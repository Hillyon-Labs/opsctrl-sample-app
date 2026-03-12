/**
 * Test App Helper
 * Creates and configures NestJS test application with mocked providers
 */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';
import { DataSource } from 'typeorm';

import { AppConfigModule } from '../../src/config/config.module';
import { AppConfigService } from '../../src/config/config.service';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { UsersModule } from '../../src/modules/users/users.module';
import { OrganizationsModule } from '../../src/modules/organizations/organizations.module';
import { RateLimitModule } from '../../src/modules/rate-limit/rate-limit.module';
import { LoggingModule } from '../../src/common/logging.module';

import {
  mockLlmProvider,
  mockEmbeddingsProvider,
} from '../mocks/global';

// Import provider tokens
import {
  LLM_PROVIDER,
  EMBEDDINGS_PROVIDER,
} from '../../src/modules/ai-providers/interfaces';

export interface TestAppOptions {
  // Override specific providers
  providers?: Array<{
    provide: unknown;
    useValue: unknown;
  }>;
  // Skip specific modules
  skipModules?: string[];
  // Additional imports (NestJS modules)
  additionalImports?: any[];
}

/**
 * Create a test NestJS application with mocked external services
 */
export async function createTestApp(
  options: TestAppOptions = {},
): Promise<INestApplication> {
  const { providers = [], additionalImports = [] } = options;

  // Reset all mocks before creating a new app
  mockLlmProvider.reset();
  mockEmbeddingsProvider.reset();

  const moduleBuilder = Test.createTestingModule({
    imports: [
      LoggingModule,
      AppConfigModule,

      // Database with test configuration
      TypeOrmModule.forRootAsync({
        imports: [AppConfigModule],
        inject: [AppConfigService],
        useFactory: (config: AppConfigService) => ({
          type: 'postgres',
          host: config.database.host,
          port: config.database.port,
          username: config.database.user,
          database: config.database.name,
          password: config.database.pass,
          entities: [__dirname + '/../../src/**/*.entity.{ts,js}'],
          synchronize: true, // Auto-sync schema for tests
          autoLoadEntities: true,
          dropSchema: false, // Don't drop on connection, use cleanDatabase helper
        }),
      }),

      // Redis with test configuration
      RedisModule.forRootAsync({
        imports: [AppConfigModule],
        inject: [AppConfigService],
        useFactory: (config: AppConfigService) => ({
          type: 'single',
          url: config.redis.url,
        }),
      }),

      // Rate limiting (disabled in test env)
      RateLimitModule.forRoot({ enableGlobalGuard: false }),

      // Application modules
      AuthModule,
      UsersModule,
      OrganizationsModule,

      // Additional imports from options
      ...additionalImports,
    ],
  });

  // Override external services with mocks
  moduleBuilder
    .overrideProvider(LLM_PROVIDER)
    .useValue(mockLlmProvider)
    .overrideProvider(EMBEDDINGS_PROVIDER)
    .useValue(mockEmbeddingsProvider);

  // Apply additional provider overrides
  for (const provider of providers) {
    moduleBuilder
      .overrideProvider(provider.provide)
      .useValue(provider.useValue);
  }

  const moduleFixture: TestingModule = await moduleBuilder.compile();

  const app = moduleFixture.createNestApplication();

  // Configure validation pipes (matching production)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Enable CORS for tests
  app.enableCors();

  console.log('Starting the app');

  await app.init();

  return app;
}

/**
 * Get DataSource from test application
 */
export function getTestDataSource(app: INestApplication): DataSource {
  return app.get(DataSource);
}

/**
 * Get a service from test application
 */
export function getService<T>(
  app: INestApplication,
  service: new (...args: unknown[]) => T,
): T {
  return app.get(service);
}

/**
 * Get a provider by token from test application
 */
export function getProvider<T>(
  app: INestApplication,
  token: string | symbol,
): T {
  return app.get(token);
}

/**
 * Close test application and cleanup
 */
export async function closeTestApp(app: INestApplication): Promise<void> {
  const dataSource = app.get(DataSource);
  if (dataSource?.isInitialized) {
    await dataSource.destroy();
  }
  await app.close();
}

/**
 * Get Redis client from test application
 */
export function getRedisClient(app: INestApplication): unknown {
  return app.get('default_IORedisModuleConnectionToken');
}

/**
 * Flush Redis (clear all test data)
 */
export async function flushRedis(app: INestApplication): Promise<void> {
  const redis = getRedisClient(app) as { flushdb: () => Promise<void> };
  if (redis?.flushdb) {
    await redis.flushdb();
  }
}
