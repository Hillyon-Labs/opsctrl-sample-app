import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { LoggerService } from 'src/common/services/logger.service';
import {
  IGeneralRateLimiter,
  RateLimitResult,
} from '../interfaces/rate-limit.interface';

@Injectable()
export class GeneralRateLimitService implements IGeneralRateLimiter {
  private readonly keyPrefix = 'rate_limit:general';

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Check if a request is within rate limits using sliding window algorithm
   */
  async checkRateLimit(
    identifier: string,
    config: { maxRequests: number; windowSeconds: number },
  ): Promise<RateLimitResult> {
    const key = this.buildKey(identifier);
    const now = Date.now();
    const windowStart = now - config.windowSeconds * 1000;

    try {
      // Use Redis pipeline for atomicity
      const pipeline = this.redis.pipeline();
      pipeline.zremrangebyscore(key, 0, windowStart); // Remove expired entries
      pipeline.zcard(key); // Count current entries
      pipeline.pttl(key); // Get TTL in milliseconds

      const results = await pipeline.exec();

      if (!results) {
        this.logger.warn(
          'Redis pipeline returned null',
          'GeneralRateLimitService',
        );
        return this.allowByDefault(config);
      }

      const currentCount = (results[1]?.[1] as number) || 0;
      const ttlMs = (results[2]?.[1] as number) || config.windowSeconds * 1000;

      const allowed = currentCount < config.maxRequests;
      const remaining = Math.max(0, config.maxRequests - currentCount);
      const resetAt = new Date(now + Math.max(ttlMs, 0));

      return {
        allowed,
        remaining,
        limit: config.maxRequests,
        resetAt,
        retryAfterSeconds: allowed
          ? undefined
          : Math.ceil(Math.max(ttlMs, 0) / 1000),
      };
    } catch (error) {
      this.logger.error(
        'Failed to check rate limit',
        error instanceof Error ? error.message : 'Unknown error',
        'GeneralRateLimitService',
        { identifier },
      );
      // Fail open - allow request if Redis fails
      return this.allowByDefault(config);
    }
  }

  /**
   * Increment the rate limit counter for an identifier
   */
  async incrementCounter(
    identifier: string,
    windowSeconds: number,
  ): Promise<void> {
    const key = this.buildKey(identifier);
    const now = Date.now();
    // Use timestamp + random suffix for unique member
    const member = `${now}:${Math.random().toString(36).slice(2, 10)}`;

    try {
      const pipeline = this.redis.pipeline();
      pipeline.zadd(key, now, member);
      pipeline.expire(key, windowSeconds);
      await pipeline.exec();
    } catch (error) {
      this.logger.error(
        'Failed to increment rate limit counter',
        error instanceof Error ? error.message : 'Unknown error',
        'GeneralRateLimitService',
        { identifier },
      );
    }
  }

  /**
   * Get current rate limit info for an identifier
   */
  async getRateLimitInfo(identifier: string): Promise<RateLimitResult | null> {
    const key = this.buildKey(identifier);

    try {
      const count = await this.redis.zcard(key);
      const ttl = await this.redis.pttl(key);

      if (count === 0 && ttl <= 0) {
        return null;
      }

      return {
        allowed: true,
        remaining: 0, // Unknown without config
        limit: 0, // Unknown without config
        resetAt: new Date(Date.now() + Math.max(ttl, 0)),
      };
    } catch (error) {
      this.logger.error(
        'Failed to get rate limit info',
        error instanceof Error ? error.message : 'Unknown error',
        'GeneralRateLimitService',
        { identifier },
      );
      return null;
    }
  }

  /**
   * Reset rate limit for an identifier
   */
  async resetRateLimit(identifier: string): Promise<void> {
    const key = this.buildKey(identifier);

    try {
      await this.redis.del(key);
      this.logger.info('Rate limit reset', 'GeneralRateLimitService', {
        identifier,
      });
    } catch (error) {
      this.logger.error(
        'Failed to reset rate limit',
        error instanceof Error ? error.message : 'Unknown error',
        'GeneralRateLimitService',
        { identifier },
      );
    }
  }

  /**
   * Build a sanitized Redis key for an identifier
   */
  private buildKey(identifier: string): string {
    const sanitized = identifier.replace(/[^a-zA-Z0-9_\-:.]/g, '_');
    return `${this.keyPrefix}:${sanitized}`;
  }

  /**
   * Return a permissive result when Redis fails (fail-open)
   */
  private allowByDefault(config: {
    maxRequests: number;
    windowSeconds: number;
  }): RateLimitResult {
    return {
      allowed: true,
      remaining: config.maxRequests,
      limit: config.maxRequests,
      resetAt: new Date(Date.now() + config.windowSeconds * 1000),
    };
  }
}
