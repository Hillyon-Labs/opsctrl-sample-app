/**
 * Feature tier types
 */
export type FeatureTier = 'free' | 'pro' | 'enterprise';

/**
 * Tier configuration interface
 */
export interface TierConfig {
  name: string;
  monthlyLimit: number | null; // null = unlimited
  dailyLimit: number | null; // null = unlimited
  features: string[];
}

/**
 * Feature tier configurations
 */
export const FEATURE_TIERS: Record<FeatureTier, TierConfig> = {
  free: {
    name: 'Free',
    monthlyLimit: 100,
    dailyLimit: 10,
    features: ['basic_features'],
  },
  pro: {
    name: 'Professional',
    monthlyLimit: 1000,
    dailyLimit: 100,
    features: ['basic_features', 'advanced_features', 'priority_support'],
  },
  enterprise: {
    name: 'Enterprise',
    monthlyLimit: null, // Unlimited
    dailyLimit: null, // Unlimited
    features: [
      'basic_features',
      'advanced_features',
      'enterprise_features',
      'priority_support',
      'dedicated_account_manager',
      'custom_integrations',
    ],
  },
};

/**
 * Default tier for organizations without explicit tier assignment
 */
export const DEFAULT_TIER: FeatureTier = 'free';
