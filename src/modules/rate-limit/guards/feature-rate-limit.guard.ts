import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request, Response } from 'express';
import { AppConfigService } from 'src/config/config.service';
import { LoggerService } from 'src/common/services/logger.service';
import { FeatureRateLimitService } from '../services/feature-rate-limit.service';
import { TierResolverService } from '../services/tier-resolver.service';
import { FeatureQuotaExceededException } from '../exceptions/rate-limit.exceptions';

@Injectable()
export class FeatureRateLimitGuard implements CanActivate {
  constructor(
    private readonly featureRateLimitService: FeatureRateLimitService,
    private readonly tierResolver: TierResolverService,
    private readonly configService: AppConfigService,
    private readonly logger: LoggerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const config = this.configService.rateLimit.diagnosis;

    // Check if feature rate limiting is enabled
    if (!config.enabled) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Extract orgId from authenticated user
    const user = request['user'] as
      | { userId?: string; orgId?: string }
      | undefined;
    const orgId = user?.orgId;

    if (!orgId) {
      this.logger.warn(
        'Feature rate limit check skipped: no orgId in request',
        'FeatureRateLimitGuard',
        { userId: user?.userId, url: request.url },
      );
      // Allow if no org context - will be caught by auth guards
      return true;
    }

    // Resolve tier for organization
    const tier = await this.tierResolver.resolveTier(orgId);
    const tierConfig = this.tierResolver.getTierConfig(tier);

    // Check quota
    const result = await this.featureRateLimitService.checkFeatureQuota(
      orgId,
      tier,
    );

    // Set feature-specific headers
    response.setHeader(
      'X-Feature-Limit',
      result.limit !== null ? result.limit : 'unlimited',
    );
    response.setHeader('X-Feature-Used', result.used);
    response.setHeader(
      'X-Feature-Remaining',
      result.remaining !== null ? result.remaining : 'unlimited',
    );
    response.setHeader(
      'X-Feature-Reset',
      Math.ceil(result.resetAt.getTime() / 1000),
    );
    response.setHeader('X-Feature-Tier', tier);

    if (!result.allowed) {
      response.setHeader('Retry-After', result.retryAfterSeconds || 0);

      this.logger.warn('Feature quota exceeded', 'FeatureRateLimitGuard', {
        orgId,
        tier,
        used: result.used,
        limit: result.limit,
        url: request.url,
      });

      throw new FeatureQuotaExceededException(
        tierConfig.name,
        result.used,
        result.limit || 0,
        result.resetAt,
        result.retryAfterSeconds || 0,
      );
    }

    // Increment usage after successful check
    // This ensures we count the operation before it runs
    await this.featureRateLimitService.incrementFeatureUsage(orgId);

    this.logger.debug(
      'Feature quota check passed',
      'FeatureRateLimitGuard',
      {
        orgId,
        tier,
        used: result.used + 1, // +1 for this request
        limit: result.limit,
        remaining: result.remaining !== null ? result.remaining - 1 : null,
      },
    );

    return true;
  }
}
