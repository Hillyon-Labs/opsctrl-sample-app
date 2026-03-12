import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { LoggerService } from 'src/common/services/logger.service';
import {
  IFeatureRateLimiter,
  FeatureQuotaResult,
  FeatureUsageInfo,
} from '../interfaces/rate-limit.interface';
import { FeatureTier, FEATURE_TIERS } from '../constants/tiers.constants';

@Injectable()
export class FeatureRateLimitService implements IFeatureRateLimiter {
  private readonly keyPrefix = 'rate_limit:feature';

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Check if an organization has remaining feature quota
   */
  async checkFeatureQuota(
    orgId: string,
    tier: FeatureTier,
  ): Promise<FeatureQuotaResult> {
    const tierConfig = FEATURE_TIERS[tier];

    // Enterprise = unlimited
    if (tierConfig.monthlyLimit === null) {
      const used = await this.getMonthlyUsage(orgId);
      return {
        allowed: true,
        used,
        limit: null,
        remaining: null,
        resetAt: this.getNextMonthStart(),
        tier,
      };
    }

    try {
      const monthlyUsed = await this.getMonthlyUsage(orgId);
      const allowed = monthlyUsed < tierConfig.monthlyLimit;

      return {
        allowed,
        used: monthlyUsed,
        limit: tierConfig.monthlyLimit,
        remaining: Math.max(0, tierConfig.monthlyLimit - monthlyUsed),
        resetAt: this.getNextMonthStart(),
        tier,
        retryAfterSeconds: allowed
          ? undefined
          : this.getSecondsUntilNextMonth(),
      };
    } catch (error) {
      this.logger.error(
        'Failed to check feature quota',
        error instanceof Error ? error.message : 'Unknown error',
        'FeatureRateLimitService',
        { orgId, tier },
      );
      // Fail open - allow if Redis fails
      return {
        allowed: true,
        used: 0,
        limit: tierConfig.monthlyLimit,
        remaining: tierConfig.monthlyLimit,
        resetAt: this.getNextMonthStart(),
        tier,
      };
    }
  }

  /**
   * Increment feature usage for an organization
   */
  async incrementFeatureUsage(orgId: string): Promise<void> {
    const monthKey = this.getMonthKey(orgId);
    const dayKey = this.getDayKey(orgId);

    try {
      const pipeline = this.redis.pipeline();

      // Increment monthly counter
      pipeline.incr(monthKey);
      pipeline.expire(monthKey, this.getSecondsUntilNextMonth() + 86400); // +1 day buffer

      // Increment daily counter
      pipeline.incr(dayKey);
      pipeline.expire(dayKey, this.getSecondsUntilMidnight() + 3600); // +1 hour buffer

      await pipeline.exec();

      this.logger.debug(
        'Feature usage incremented',
        'FeatureRateLimitService',
        { orgId },
      );
    } catch (error) {
      this.logger.error(
        'Failed to increment feature usage',
        error instanceof Error ? error.message : 'Unknown error',
        'FeatureRateLimitService',
        { orgId },
      );
    }
  }

  /**
   * Get detailed usage info for an organization
   */
  async getFeatureUsage(orgId: string): Promise<FeatureUsageInfo> {
    const monthKey = this.getMonthKey(orgId);
    const dayKey = this.getDayKey(orgId);

    try {
      const [monthlyCount, dailyCount] = await Promise.all([
        this.redis.get(monthKey),
        this.redis.get(dayKey),
      ]);

      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = this.getNextMonthStart();

      return {
        monthlyUsed: monthlyCount ? parseInt(monthlyCount, 10) : 0,
        dailyUsed: dailyCount ? parseInt(dailyCount, 10) : 0,
        monthlyLimit: null, // Unknown without tier context
        dailyLimit: null,
        tier: 'free', // Default, caller should set correct tier
        periodStart,
        periodEnd,
      };
    } catch (error) {
      this.logger.error(
        'Failed to get feature usage',
        error instanceof Error ? error.message : 'Unknown error',
        'FeatureRateLimitService',
        { orgId },
      );
      return {
        monthlyUsed: 0,
        dailyUsed: 0,
        monthlyLimit: null,
        dailyLimit: null,
        tier: 'free',
        periodStart: new Date(),
        periodEnd: this.getNextMonthStart(),
      };
    }
  }

  /**
   * Reset monthly usage for an organization (admin operation)
   */
  async resetMonthlyUsage(orgId: string): Promise<void> {
    const monthKey = this.getMonthKey(orgId);

    try {
      await this.redis.del(monthKey);
      this.logger.info(
        'Monthly feature usage reset',
        'FeatureRateLimitService',
        { orgId },
      );
    } catch (error) {
      this.logger.error(
        'Failed to reset monthly usage',
        error instanceof Error ? error.message : 'Unknown error',
        'FeatureRateLimitService',
        { orgId },
      );
    }
  }

  /**
   * Get monthly usage count from Redis
   */
  private async getMonthlyUsage(orgId: string): Promise<number> {
    const key = this.getMonthKey(orgId);
    const count = await this.redis.get(key);
    return count ? parseInt(count, 10) : 0;
  }

  /**
   * Generate Redis key for monthly usage
   */
  private getMonthKey(orgId: string): string {
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return `${this.keyPrefix}:monthly:${orgId}:${monthStr}`;
  }

  /**
   * Generate Redis key for daily usage
   */
  private getDayKey(orgId: string): string {
    const now = new Date();
    const dayStr = now.toISOString().split('T')[0];
    return `${this.keyPrefix}:daily:${orgId}:${dayStr}`;
  }

  /**
   * Get the first day of next month
   */
  private getNextMonthStart(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  /**
   * Get seconds until the first day of next month
   */
  private getSecondsUntilNextMonth(): number {
    return Math.ceil(
      (this.getNextMonthStart().getTime() - Date.now()) / 1000,
    );
  }

  /**
   * Get seconds until midnight
   */
  private getSecondsUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    );
    return Math.ceil((midnight.getTime() - now.getTime()) / 1000);
  }
}
