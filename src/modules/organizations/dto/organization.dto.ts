import { IsString, IsOptional, IsEnum, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for creating a new organization
 */
export class CreateOrganizationDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(['free', 'pro', 'enterprise'])
  tier?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'trial', 'cancelled'])
  subscriptionStatus?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  trialEndsAt?: Date;
}

/**
 * DTO for updating an organization
 */
export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(['free', 'pro', 'enterprise'])
  tier?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'trial', 'cancelled'])
  subscriptionStatus?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  trialEndsAt?: Date;
}

/**
 * Response DTO for organization
 */
export class OrganizationResponseDto {
  id: string;
  name: string;
  tier: string;
  subscriptionStatus: string;
  trialEndsAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
