import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { LoggerService } from 'src/common/services/logger.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Organization)
    private readonly organizationsRepository: Repository<Organization>,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Find user by ID
   */
  async findById(userId: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
      relations: ['organization'],
    });
  }

  /**
   * Find all users
   */
  async findAll(): Promise<User[]> {
    return await this.usersRepository.find({
      relations: ['organization'],
    });
  }

  /**
   * Update user
   */
  async update(userId: string, updateData: Partial<User>): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    Object.assign(user, updateData);
    const updatedUser = await this.usersRepository.save(user);

    this.logger.info(
      'User updated',
      'UsersService',
      { userId },
    );

    return updatedUser;
  }

  /**
   * Delete user (soft delete)
   */
  async delete(userId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    await this.usersRepository.softRemove(user);

    this.logger.info(
      'User deleted',
      'UsersService',
      { userId },
    );
  }
}
