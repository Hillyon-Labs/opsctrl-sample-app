/**
 * Result of a rate limit check
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
  retryAfterSeconds?: number;
}

/**
 * Result of a feature quota check
 */
export interface FeatureQuotaResult {
  allowed: boolean;
  used: number;
  limit: number | null; // null = unlimited
  remaining: number | null; // null = unlimited
  resetAt: Date;
  tier: string;
  retryAfterSeconds?: number;
}

/**
 * Detailed feature usage information
 */
export interface FeatureUsageInfo {
  monthlyUsed: number;
  dailyUsed: number;
  monthlyLimit: number | null;
  dailyLimit: number | null;
  tier: string;
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Configuration for rate limiting
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

/**
 * Interface for general rate limiting service
 */
export interface IGeneralRateLimiter {
  checkRateLimit(
    identifier: string,
    config: RateLimitConfig,
  ): Promise<RateLimitResult>;
  incrementCounter(identifier: string, windowSeconds: number): Promise<void>;
  getRateLimitInfo(identifier: string): Promise<RateLimitResult | null>;
  resetRateLimit(identifier: string): Promise<void>;
}

/**
 * Interface for feature-specific rate limiting service
 */
export interface IFeatureRateLimiter {
  checkFeatureQuota(orgId: string, tier: string): Promise<FeatureQuotaResult>;
  incrementFeatureUsage(orgId: string): Promise<void>;
  getFeatureUsage(orgId: string): Promise<FeatureUsageInfo>;
  resetMonthlyUsage(orgId: string): Promise<void>;
}

/**
 * Injection tokens for rate limiting services
 */
export const GENERAL_RATE_LIMIT_SERVICE = Symbol('GENERAL_RATE_LIMIT_SERVICE');
export const FEATURE_RATE_LIMIT_SERVICE = Symbol('FEATURE_RATE_LIMIT_SERVICE');
