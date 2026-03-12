import { ApiProperty } from '@nestjs/swagger';
import { Role, UserStatus } from 'src/common/enum/enum';
import { Exclude } from 'class-transformer';

export class UserResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User ID',
  })
  id: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
    required: false,
  })
  firstName?: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
    required: false,
  })
  lastName?: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  email: string;

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
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Organization ID',
    required: false,
  })
  orgId?: string;

  @ApiProperty({
    example: '2024-01-15T08:00:00Z',
    description: 'When user was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'When user was last updated',
  })
  updatedAt: Date;

  @Exclude()
  password: string;

  @Exclude()
  deletedAt: Date;
}
