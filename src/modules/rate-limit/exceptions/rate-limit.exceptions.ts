import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Exception thrown when general rate limit is exceeded
 */
export class GeneralRateLimitException extends HttpException {
  constructor(
    retryAfterSeconds: number,
    limit: number,
    remaining: number,
    resetAt: Date,
    identifier: string,
  ) {
    const message = 'Rate limit exceeded. Please try again later.';
    super(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message,
        error: 'Too Many Requests',
        details: {
          limit,
          remaining,
          resetAt: resetAt.toISOString(),
          retryAfter: retryAfterSeconds,
          identifier,
        },
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

/**
 * Exception thrown when feature quota is exceeded
 */
export class FeatureQuotaExceededException extends HttpException {
  constructor(
    tierName: string,
    used: number,
    limit: number,
    resetAt: Date,
    retryAfterSeconds: number,
  ) {
    const message = `Feature quota exceeded for ${tierName} tier. Upgrade your plan for higher limits.`;
    super(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message,
        error: 'Feature Quota Exceeded',
        details: {
          tier: tierName,
          used,
          limit,
          resetAt: resetAt.toISOString(),
          retryAfter: retryAfterSeconds,
        },
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
