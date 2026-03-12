import { ApiProperty } from '@nestjs/swagger';
import { Role, UserStatus } from 'src/common/enum/enum';

export class UserResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User ID',
  })
  id: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
  })
  lastName: string;

  @ApiProperty({
    enum: Role,
    example: Role.DEVELOPER,
    description: 'User role',
  })
  role: Role;

  @ApiProperty({
    enum: UserStatus,
    example: UserStatus.ACTIVE,
    description: 'User status',
  })
  status: UserStatus;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Organization ID',
    required: false,
  })
  orgId?: string;
}

export class AuthResponseDto {
  @ApiProperty({
    type: UserResponseDto,
    description: 'User information',
  })
  user: UserResponseDto;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh token',
  })
  refreshToken: string;

  @ApiProperty({
    example: 900,
    description: 'Access token expiry in seconds (15 minutes)',
  })
  expiresIn: number;

  @ApiProperty({
    example: 2592000,
    description: 'Refresh token expiry in seconds (30 days)',
  })
  refreshExpiresIn: number;
}

export class RefreshResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'New JWT access token',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'New refresh token',
  })
  refreshToken: string;

  @ApiProperty({
    example: 900,
    description: 'Access token expiry in seconds',
  })
  expiresIn: number;
}
