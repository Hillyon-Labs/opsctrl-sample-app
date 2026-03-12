import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from 'src/modules/organizations/entities/organization.entity';
import { LoggerService } from 'src/common/services/logger.service';
import {
  FeatureTier,
  FEATURE_TIERS,
  DEFAULT_TIER,
  TierConfig,
} from '../constants/tiers.constants';

/**
 * Service to resolve organization tiers for feature rate limiting
 */
@Injectable()
export class TierResolverService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Resolve the tier for a given organization
   */
  async resolveTier(orgId: string): Promise<FeatureTier> {
    try {
      const organization = await this.organizationRepository.findOne({
        where: { id: orgId },
      });

      if (!organization) {
        this.logger.warn(
          'Organization not found, using default tier',
          'TierResolverService',
          { orgId },
        );
        return DEFAULT_TIER;
      }

      // Check if organization has a tier field
      // If your Organization entity has a tier field, use it
      // Otherwise, implement your own tier resolution logic
      const tier = (organization as any).tier as FeatureTier | undefined;

      if (tier && this.isValidTier(tier)) {
        return tier;
      }

      // Default fallback
      this.logger.debug(
        'No tier found for organization, using default',
        'TierResolverService',
        { orgId },
      );
      return DEFAULT_TIER;
    } catch (error) {
      this.logger.error(
        'Failed to resolve tier',
        error instanceof Error ? error.message : 'Unknown error',
        'TierResolverService',
        { orgId },
      );
      return DEFAULT_TIER;
    }
  }

  /**
   * Get tier configuration
   */
  getTierConfig(tier: FeatureTier): TierConfig {
    return FEATURE_TIERS[tier];
  }

  /**
   * Check if a tier is valid
   */
  private isValidTier(tier: string): tier is FeatureTier {
    return tier in FEATURE_TIERS;
  }

  /**
   * Get all available tiers
   */
  getAvailableTiers(): FeatureTier[] {
    return Object.keys(FEATURE_TIERS) as FeatureTier[];
  }

  /**
   * Update organization tier (admin operation)
   */
  async updateOrganizationTier(
    orgId: string,
    tier: FeatureTier,
  ): Promise<void> {
    try {
      if (!this.isValidTier(tier)) {
        throw new Error(`Invalid tier: ${tier}`);
      }

      const organization = await this.organizationRepository.findOne({
        where: { id: orgId },
      });

      if (!organization) {
        throw new Error(`Organization not found: ${orgId}`);
      }

      // Update tier if your Organization entity has a tier field
      (organization as any).tier = tier;
      await this.organizationRepository.save(organization);

      this.logger.info(
        'Organization tier updated',
        'TierResolverService',
        { orgId, tier },
      );
    } catch (error) {
      this.logger.error(
        'Failed to update organization tier',
        error instanceof Error ? error.message : 'Unknown error',
        'TierResolverService',
        { orgId, tier },
      );
      throw error;
    }
  }
}
