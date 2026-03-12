import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { AppConfigService } from 'src/config/config.service';
import { LoggerService } from 'src/common/services/logger.service';
import { GeneralRateLimitService } from '../services/general-rate-limit.service';
import { GeneralRateLimitException } from '../exceptions/rate-limit.exceptions';
import { SKIP_RATE_LIMIT_KEY } from '../decorators/skip-rate-limit.decorator';

@Injectable()
export class GeneralRateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimitService: GeneralRateLimitService,
    private readonly configService: AppConfigService,
    private readonly reflector: Reflector,
    private readonly logger: LoggerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const config = this.configService.rateLimit.general;

    // Check if rate limiting is enabled
    if (!config.enabled) {
      return true;
    }

    // Check for @SkipRateLimit() decorator
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Check skip paths
    const requestPath = request.url.split('?')[0]; // Remove query string
    if (config.skipPaths.some((path) => requestPath.startsWith(path))) {
      return true;
    }

    // Determine identifier and limits based on authentication status
    const user = request['user'] as
      | { userId?: string; orgId?: string }
      | undefined;
    const isAuthenticated = !!(user?.userId || user?.orgId);

    const identifier = isAuthenticated
      ? `user:${user?.userId || user?.orgId}`
      : `ip:${this.getClientIp(request)}`;

    const limitConfig = isAuthenticated
      ? config.authenticated
      : config.unauthenticated;

    // Check rate limit
    const result = await this.rateLimitService.checkRateLimit(
      identifier,
      limitConfig,
    );

    // Set rate limit headers
    response.setHeader('X-RateLimit-Limit', result.limit);
    response.setHeader('X-RateLimit-Remaining', result.remaining);
    response.setHeader(
      'X-RateLimit-Reset',
      Math.ceil(result.resetAt.getTime() / 1000),
    );

    if (!result.allowed) {
      response.setHeader('Retry-After', result.retryAfterSeconds || 60);

      this.logger.warn('Rate limit exceeded', 'GeneralRateLimitGuard', {
        identifier,
        limit: result.limit,
        url: request.url,
        method: request.method,
      });

      throw new GeneralRateLimitException(
        result.retryAfterSeconds || 60,
        result.limit,
        result.remaining,
        result.resetAt,
        identifier,
      );
    }

    // Increment counter after allowing the request
    await this.rateLimitService.incrementCounter(
      identifier,
      limitConfig.windowSeconds,
    );

    return true;
  }

  /**
   * Extract client IP from request, handling proxies
   */
  private getClientIp(request: Request): string {
    const forwardedFor = request.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string') {
      return forwardedFor.split(',')[0].trim();
    }
    if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
      return forwardedFor[0].split(',')[0].trim();
    }
    return (
      request.ip || request.socket?.remoteAddress || 'unknown'
    );
  }
}
