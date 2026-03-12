import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { LoggerService } from 'src/common/services/logger.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  OrganizationResponseDto,
} from './dto/organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Create a new organization
   */
  async create(
    createOrgDto: CreateOrganizationDto,
    userId: string,
  ): Promise<OrganizationResponseDto> {
    const organization = this.organizationRepository.create({
      ...createOrgDto,
      createdBy: userId,
      tier: createOrgDto.tier || 'free',
      subscriptionStatus: createOrgDto.subscriptionStatus || 'trial',
    });

    const savedOrg = await this.organizationRepository.save(organization);

    this.logger.info(
      'Organization created',
      'OrganizationsService',
      { orgId: savedOrg.id, name: savedOrg.name },
    );

    return this.toResponseDto(savedOrg);
  }

  /**
   * Get organization by ID
   */
  async findOne(orgId: string): Promise<OrganizationResponseDto> {
    const organization = await this.organizationRepository.findOne({
      where: { id: orgId },
      relations: ['users'],
    });

    if (!organization) {
      throw new NotFoundException(`Organization ${orgId} not found`);
    }

    return this.toResponseDto(organization);
  }

  /**
   * Get all organizations
   */
  async findAll(): Promise<OrganizationResponseDto[]> {
    const organizations = await this.organizationRepository.find({
      relations: ['users'],
    });

    return organizations.map((org) => this.toResponseDto(org));
  }

  /**
   * Update organization
   */
  async update(
    orgId: string,
    updateOrgDto: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    const organization = await this.organizationRepository.findOne({
      where: { id: orgId },
    });

    if (!organization) {
      throw new NotFoundException(`Organization ${orgId} not found`);
    }

    Object.assign(organization, updateOrgDto);
    const updatedOrg = await this.organizationRepository.save(organization);

    this.logger.info(
      'Organization updated',
      'OrganizationsService',
      { orgId: updatedOrg.id },
    );

    return this.toResponseDto(updatedOrg);
  }

  /**
   * Delete organization
   */
  async remove(orgId: string): Promise<void> {
    const organization = await this.organizationRepository.findOne({
      where: { id: orgId },
    });

    if (!organization) {
      throw new NotFoundException(`Organization ${orgId} not found`);
    }

    await this.organizationRepository.softRemove(organization);

    this.logger.info(
      'Organization deleted',
      'OrganizationsService',
      { orgId },
    );
  }

  /**
   * Convert organization entity to response DTO
   */
  private toResponseDto(
    organization: Organization,
  ): OrganizationResponseDto {
    return {
      id: organization.id,
      name: organization.name,
      tier: organization.tier || 'free',
      subscriptionStatus: organization.subscriptionStatus || 'trial',
      trialEndsAt: organization.trialEndsAt,
      createdBy: organization.createdBy,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    };
  }
}
