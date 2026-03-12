import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for skip rate limit decorator
 */
export const SKIP_RATE_LIMIT_KEY = 'skipRateLimit';

/**
 * Decorator to skip rate limiting for a specific route or controller
 * Usage:
 * @SkipRateLimit()
 * @Get('/health')
 * healthCheck() { ... }
 */
export const SkipRateLimit = () => SetMetadata(SKIP_RATE_LIMIT_KEY, true);
