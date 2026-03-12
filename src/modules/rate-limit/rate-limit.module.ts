import { Module, Global, DynamicModule, Provider } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

// Config
import { AppConfigModule } from 'src/config/config.module';

// Entities
import { Organization } from '../organizations/entities/organization.entity';

// Services
import { GeneralRateLimitService } from './services/general-rate-limit.service';
import { FeatureRateLimitService } from './services/feature-rate-limit.service';
import { TierResolverService } from './services/tier-resolver.service';

// Guards
import { GeneralRateLimitGuard } from './guards/general-rate-limit.guard';
import { FeatureRateLimitGuard } from './guards/feature-rate-limit.guard';

// Interfaces
import {
  GENERAL_RATE_LIMIT_SERVICE,
  FEATURE_RATE_LIMIT_SERVICE,
} from './interfaces/rate-limit.interface';

export interface RateLimitModuleOptions {
  /**
   * If true, general rate limiting is applied globally via APP_GUARD
   * @default true
   */
  enableGlobalGuard?: boolean;
}

/**
 * Rate Limiting Module
 *
 * Provides two types of rate limiting:
 * 1. General Rate Limiting - IP/user-based limits for all endpoints (global guard)
 * 2. Feature Rate Limiting - Organization-tier based limits (decorator-based)
 *
 * @example
 * // In app.module.ts
 * @Module({
 *   imports: [RateLimitModule.forRoot()],
 * })
 * export class AppModule {}
 *
 * // In a controller
 * @FeatureRateLimit()
 * @Post('operation')
 * operation() { ... }
 */
@Global()
@Module({})
export class RateLimitModule {
  /**
   * Register the rate limit module with optional configuration
   */
  static forRoot(options: RateLimitModuleOptions = {}): DynamicModule {
    const { enableGlobalGuard = true } = options;

    const providers: Provider[] = [
      // Services
      GeneralRateLimitService,
      FeatureRateLimitService,
      TierResolverService,

      // Service tokens for DI
      {
        provide: GENERAL_RATE_LIMIT_SERVICE,
        useExisting: GeneralRateLimitService,
      },
      {
        provide: FEATURE_RATE_LIMIT_SERVICE,
        useExisting: FeatureRateLimitService,
      },

      // Feature guard (used via @FeatureRateLimit() decorator)
      FeatureRateLimitGuard,
    ];

    // Add global guard if enabled
    if (enableGlobalGuard) {
      providers.push({
        provide: APP_GUARD,
        useClass: GeneralRateLimitGuard,
      });
    }

    return {
      module: RateLimitModule,
      imports: [AppConfigModule, TypeOrmModule.forFeature([Organization])],
      providers,
      exports: [
        GeneralRateLimitService,
        FeatureRateLimitService,
        TierResolverService,
        FeatureRateLimitGuard,
        GENERAL_RATE_LIMIT_SERVICE,
        FEATURE_RATE_LIMIT_SERVICE,
      ],
    };
  }

  /**
   * Register the rate limit module for feature modules (without global guard)
   */
  static forFeature(): DynamicModule {
    return {
      module: RateLimitModule,
      imports: [AppConfigModule, TypeOrmModule.forFeature([Organization])],
      providers: [
        GeneralRateLimitService,
        FeatureRateLimitService,
        TierResolverService,
        FeatureRateLimitGuard,
      ],
      exports: [
        GeneralRateLimitService,
        FeatureRateLimitService,
        TierResolverService,
        FeatureRateLimitGuard,
      ],
    };
  }
}
