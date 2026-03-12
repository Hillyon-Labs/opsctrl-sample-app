import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto, RefreshResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { UserStatus } from 'src/common/enum/enum';
import { JwtPayload } from './decorators/current-user.decorator';

@Injectable()
export class AuthService {
  private readonly ACCESS_TOKEN_EXPIRES_IN = 15 * 60; // 15 minutes
  private readonly REFRESH_TOKEN_EXPIRES_IN = 30 * 24 * 60 * 60; // 30 days
  private readonly REDIS_REFRESH_TOKEN_PREFIX = 'refresh_token:';

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    @InjectRedis() private readonly redis: Redis,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const user = this.userRepository.create({
      email: email.toLowerCase(),
      password: passwordHash,
      firstName,
      lastName,
      status: UserStatus.ACTIVE,
    });

    await this.userRepository.save(user);

    // Generate tokens
    return this.generateAuthResponse(user);
  }

  /**
   * Login user and generate tokens
   */
  async login(user: User): Promise<AuthResponseDto> {
    return this.generateAuthResponse(user);
  }

  /**
   * Validate user credentials (used by LocalStrategy)
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return null;
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is not active');
    }

    // Need to select password field explicitly since it's excluded by default
    const userWithPassword = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
      select: ['id', 'email', 'password', 'firstName', 'lastName', 'status', 'orgId', 'role'],
    });

    if (!userWithPassword) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, userWithPassword.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(
    refreshToken: string,
    userId: string,
  ): Promise<RefreshResponseDto> {
    const tokenHash = this.hashToken(refreshToken);

    // Check Redis first (fast lookup)
    const redisKey = `${this.REDIS_REFRESH_TOKEN_PREFIX}${tokenHash}`;
    const cachedToken = await this.redis.get(redisKey);

    if (!cachedToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Verify token in database
    const refreshTokenRecord = await this.refreshTokenRepository.findOne({
      where: { tokenHash, userId, isRevoked: false },
      relations: ['user'],
    });

    if (!refreshTokenRecord) {
      // Remove from Redis if not in DB
      await this.redis.del(redisKey);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Check if token is expired
    if (refreshTokenRecord.expiresAt < new Date()) {
      await this.revokeToken(refreshToken, userId);
      throw new UnauthorizedException('Refresh token expired');
    }

    // Update last used timestamp
    refreshTokenRecord.lastUsedAt = new Date();
    await this.refreshTokenRepository.save(refreshTokenRecord);

    // Generate new tokens
    const user = refreshTokenRecord.user;
    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = await this.generateRefreshToken(user);

    // Revoke old refresh token
    await this.revokeToken(refreshToken, userId);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
    };
  }

  /**
   * Logout user by revoking all refresh tokens
   */
  async logout(userId: string): Promise<void> {
    // Get all user's refresh tokens
    const tokens = await this.refreshTokenRepository.find({
      where: { userId, isRevoked: false },
    });

    // Revoke all tokens
    for (const token of tokens) {
      const tokenHash = token.tokenHash;
      const redisKey = `${this.REDIS_REFRESH_TOKEN_PREFIX}${tokenHash}`;

      // Remove from Redis
      await this.redis.del(redisKey);

      // Mark as revoked in DB
      token.isRevoked = true;
    }

    await this.refreshTokenRepository.save(tokens);
  }

  /**
   * Revoke a specific refresh token
   */
  async revokeToken(refreshToken: string, userId: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    const redisKey = `${this.REDIS_REFRESH_TOKEN_PREFIX}${tokenHash}`;

    // Remove from Redis
    await this.redis.del(redisKey);

    // Mark as revoked in DB
    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: { tokenHash, userId },
    });

    if (tokenRecord) {
      tokenRecord.isRevoked = true;
      await this.refreshTokenRepository.save(tokenRecord);
    }
  }

  /**
   * Get current user information
   */
  async getMe(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.serializeUser(user);
  }

  /**
   * Generate JWT access token
   */
  private generateAccessToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.ACCESS_TOKEN_EXPIRES_IN,
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
    });
  }

  /**
   * Generate refresh token and store in Redis + Database
   */
  private async generateRefreshToken(
    user: User,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.REFRESH_TOKEN_EXPIRES_IN,
    };

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
    });

    const tokenHash = this.hashToken(refreshToken);

    // Store in database
    const refreshTokenEntity = this.refreshTokenRepository.create({
      tokenHash,
      userId: user.id,
      expiresAt: new Date(Date.now() + this.REFRESH_TOKEN_EXPIRES_IN * 1000),
      userAgent,
      ipAddress,
    });

    await this.refreshTokenRepository.save(refreshTokenEntity);

    // Store in Redis for fast lookup
    const redisKey = `${this.REDIS_REFRESH_TOKEN_PREFIX}${tokenHash}`;
    await this.redis.setex(
      redisKey,
      this.REFRESH_TOKEN_EXPIRES_IN,
      user.id,
    );

    return refreshToken;
  }

  /**
   * Generate complete auth response with tokens
   */
  private async generateAuthResponse(
    user: User,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResponseDto> {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(
      user,
      userAgent,
      ipAddress,
    );

    return {
      user: this.serializeUser(user),
      accessToken,
      refreshToken,
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
      refreshExpiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
    };
  }

  /**
   * Hash password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    const rounds = this.configService.get<number>('auth.passwordHashRounds', 10);
    return bcrypt.hash(password, rounds);
  }

  /**
   * Hash token using SHA256 for storage
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Serialize user for response (exclude sensitive fields)
   */
  private serializeUser(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      orgId: user.orgId,
    };
  }

  /**
   * Clean up expired refresh tokens (can be called by cron job)
   */
  async cleanupExpiredTokens(): Promise<void> {
    const expiredTokens = await this.refreshTokenRepository.find({
      where: {
        expiresAt: new Date(),
      },
    });

    for (const token of expiredTokens) {
      const redisKey = `${this.REDIS_REFRESH_TOKEN_PREFIX}${token.tokenHash}`;
      await this.redis.del(redisKey);
    }

    await this.refreshTokenRepository
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .execute();
  }
}
