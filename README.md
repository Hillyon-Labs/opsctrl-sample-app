# NestJS Backend Template

## Overview
A production-ready NestJS backend template with authentication, multi-tenancy, rate limiting, comprehensive logging, and testing infrastructure. This template provides a solid foundation for building scalable backend applications with modern best practices and enterprise-grade features.

## Features

### Tier 1: Foundation (Core Infrastructure)
- ✅ **Type-safe configuration system** with Joi validation
- ✅ **Production-grade Winston logging** with correlation tracking
- ✅ **Request/response logging**, audit logging, performance logging
- ✅ **Global exception filters** and interceptors
- ✅ **Base entity** with UUID, timestamps, soft deletes
- ✅ **TypeORM with PostgreSQL** for robust data persistence
- ✅ **Redis** for caching and session storage

### Tier 2: Essential Features
- ✅ **Passport.js authentication** (JWT + Local strategy)
- ✅ **User management** with bcrypt password hashing
- ✅ **Multi-tenant organization management**
- ✅ **Role-based access control** (OWNER, ADMIN, DEVELOPER, VIEWER)
- ✅ **Redis-backed rate limiting** (general + feature-specific)
- ✅ **Comprehensive E2E testing infrastructure**
- ✅ **Swagger/OpenAPI documentation**

### Tier 3: Advanced Features (Optional)
- ✅ **Email notifications** with Handlebars templates
- ✅ **AI providers abstraction** (Claude & OpenAI support)
- ✅ **Embeddings provider interface**

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 16
- Redis 7

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# At minimum, set: DATABASE_URL, REDIS_URL, JWT_SECRET
```

### Development Setup

```bash
# Start development services (PostgreSQL + Redis)
npm run docker:dev:up

# Run migrations (if using migrations)
npm run migration:run

# Start development server with hot-reload
npm run start:dev
```

The application will be available at `http://localhost:3000`

### Testing

```bash
# Run E2E tests (automatically manages Docker containers)
npm run test:e2e

# Run tests without Docker (requires running services)
npm run test:e2e:no-docker

# Run unit tests
npm test

# Run tests with coverage
npm run test:cov

# Run all tests (unit + E2E)
npm run test:all
```

## Project Structure

```
src/
├── config/              # Configuration system
│   ├── configuration.ts # Environment configuration
│   ├── config.service.ts
│   ├── config.module.ts
│   └── schema/          # Joi validation schemas
├── common/              # Shared utilities and base classes
│   ├── entity/          # Base entity with UUID, timestamps, soft deletes
│   ├── enum/            # Shared enums (roles, statuses, etc.)
│   ├── dto/             # Shared DTOs
│   └── constants/       # Application constants
├── modules/             # Feature modules
│   ├── auth/            # Authentication & authorization
│   │   ├── dto/         # Login, register, token DTOs
│   │   ├── entities/    # Refresh token entity
│   │   ├── strategies/  # JWT & Local Passport strategies
│   │   └── guards/      # Auth guards
│   ├── users/           # User management
│   │   ├── dto/         # User DTOs
│   │   └── entities/    # User entity
│   ├── rate-limit/      # Rate limiting infrastructure
│   └── ai-providers/    # AI provider abstraction layer
│       ├── providers/   # Claude & OpenAI implementations
│       └── interfaces/  # Provider interfaces
├── app.module.ts        # Root application module
└── main.ts              # Application entry point

test/
├── modules/             # E2E tests by module
│   ├── auth/            # Authentication tests
│   └── users/           # User management tests
├── helpers/             # Test utilities
└── mocks/               # Mock implementations
```

## Architecture

### Module Structure
The application follows NestJS modular architecture with clear separation of concerns:

- **`src/config/`** - Type-safe configuration management with Joi validation
- **`src/common/`** - Shared utilities, base entities, filters, interceptors
- **`src/modules/auth/`** - Authentication with Passport.js (JWT + Local strategies)
- **`src/modules/users/`** - User management and profile operations
- **`src/modules/rate-limit/`** - Redis-backed rate limiting
- **`src/modules/ai-providers/`** - Abstraction layer for AI services

### Design Patterns
- **Dependency Injection** - Loose coupling and testability
- **Repository Pattern** - Data access abstraction via TypeORM
- **Guard Pattern** - Authorization and authentication
- **Interceptor Pattern** - Cross-cutting concerns (logging, transformation)
- **Decorator Pattern** - Metadata and validation
- **Strategy Pattern** - Multiple authentication strategies

### Key Technologies
- **NestJS** - Progressive Node.js framework
- **TypeORM** - ORM for PostgreSQL
- **Passport.js** - Authentication middleware
- **Redis** - Caching and rate limiting
- **Winston** - Structured logging
- **Joi** - Configuration validation
- **Swagger** - API documentation
- **Jest** - Testing framework

## API Documentation

Once the application is running, interactive API documentation is available at:

```
http://localhost:3000/api/docs
```

The Swagger UI provides:
- Complete API endpoint documentation
- Request/response schemas
- Interactive testing interface
- Authentication flows

## Environment Variables

See `.env.example` for all available configuration options. Copy it to `.env` and update values accordingly.

### Required Variables

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=template_db
# Or use: DATABASE_URL=postgresql://user:pass@host:port/db

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

### Optional Variables

```bash
# Application
NODE_ENV=development
PORT=3000
APP_NAME=NestJS Backend Template

# AI Providers (if using AI features)
LLM_PROVIDER=claude
EMBEDDINGS_PROVIDER=openai
ANTHROPIC_API_KEY=sk-ant-api-key-here
CLAUDE_MODEL=claude-sonnet-4-20250514
OPENAI_API_KEY=sk-openai-key-here
OPENAI_CHAT_MODEL=gpt-4o
OPENAI_EMBEDDINGS_MODEL=text-embedding-3-small

# Email Notifications (if using notifications)
NOTIFICATION_MODULE_ENABLED=true
GOOGLE_WORKSPACE_SMTP_HOST=smtp.gmail.com
GOOGLE_WORKSPACE_SMTP_PORT=587
GOOGLE_WORKSPACE_EMAIL_USERNAME=your-email@gmail.com
GOOGLE_WORKSPACE_EMAIL_PASSWORD=your-app-password

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_UNAUTH_MAX=100
RATE_LIMIT_UNAUTH_WINDOW=60
RATE_LIMIT_AUTH_MAX=1000
RATE_LIMIT_AUTH_WINDOW=60

# Logging
LOG_LEVEL=info
LOG_ENABLE_CONSOLE=true
LOG_ENABLE_FILE=false
LOG_ENABLE_JSON=false
```

## Customization Guide

### Adding a New Module

1. **Create module structure:**
   ```bash
   mkdir -p src/modules/my-module/{dto,entities}
   ```

2. **Define entity:**
   ```typescript
   // src/modules/my-module/entities/my-entity.entity.ts
   import { Entity, Column } from 'typeorm';
   import { BaseEntity } from 'src/common/entity/entity';

   @Entity('my_entities')
   export class MyEntity extends BaseEntity {
     @Column()
     name: string;
   }
   ```

3. **Create DTOs:**
   ```typescript
   // src/modules/my-module/dto/create-my-entity.dto.ts
   import { IsString } from 'class-validator';

   export class CreateMyEntityDto {
     @IsString()
     name: string;
   }
   ```

4. **Implement service:**
   ```typescript
   // src/modules/my-module/my-module.service.ts
   import { Injectable } from '@nestjs/common';
   import { InjectRepository } from '@nestjs/typeorm';
   import { Repository } from 'typeorm';
   import { MyEntity } from './entities/my-entity.entity';

   @Injectable()
   export class MyModuleService {
     constructor(
       @InjectRepository(MyEntity)
       private repository: Repository<MyEntity>,
     ) {}

     // Implement methods
   }
   ```

5. **Create controller:**
   ```typescript
   // src/modules/my-module/my-module.controller.ts
   import { Controller, Get } from '@nestjs/common';
   import { MyModuleService } from './my-module.service';

   @Controller('my-module')
   export class MyModuleController {
     constructor(private service: MyModuleService) {}

     // Implement endpoints
   }
   ```

6. **Register module:**
   ```typescript
   // src/modules/my-module/my-module.module.ts
   import { Module } from '@nestjs/common';
   import { TypeOrmModule } from '@nestjs/typeorm';
   import { MyEntity } from './entities/my-entity.entity';
   import { MyModuleService } from './my-module.service';
   import { MyModuleController } from './my-module.controller';

   @Module({
     imports: [TypeOrmModule.forFeature([MyEntity])],
     controllers: [MyModuleController],
     providers: [MyModuleService],
     exports: [MyModuleService],
   })
   export class MyModuleModule {}
   ```

7. **Import in app.module.ts:**
   ```typescript
   import { MyModuleModule } from './modules/my-module/my-module.module';

   @Module({
     imports: [
       // ... other imports
       MyModuleModule,
     ],
   })
   export class AppModule {}
   ```

8. **Add tests:**
   ```bash
   mkdir -p test/modules/my-module
   # Create E2E tests
   ```

### Modifying Authentication

**JWT Configuration:**
```typescript
// src/config/configuration.ts
auth: {
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
}
```

**Auth Strategies:**
- JWT Strategy: `src/modules/auth/strategies/jwt.strategy.ts`
- Local Strategy: `src/modules/auth/strategies/local.strategy.ts`

**Guards:**
- JWT Auth Guard: `src/modules/auth/guards/jwt-auth.guard.ts`
- Roles Guard: `src/modules/auth/guards/roles.guard.ts`

### Database Migrations

```bash
# Generate migration from entity changes
npm run migration:generate -- src/migrations/MigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

### Adding Custom Logging

```typescript
import { LoggerService } from 'src/common/services/logger.service';

@Injectable()
export class MyService {
  constructor(private logger: LoggerService) {}

  doSomething() {
    this.logger.info('Doing something', { context: 'MyService' });
    this.logger.error('Error occurred', error, { context: 'MyService' });
  }
}
```

### Implementing Rate Limiting

```typescript
// Apply to specific routes
import { RateLimit } from 'src/modules/rate-limit/decorators';

@Controller('my-endpoint')
export class MyController {
  @RateLimit({ max: 10, windowSeconds: 60 })
  @Get()
  limitedEndpoint() {
    // This endpoint is rate-limited
  }
}
```

## Deployment

### Docker Production Build

```bash
# Build production image
docker build -t nestjs-template:latest .

# Run container
docker run -p 3000:3000 --env-file .env nestjs-template:latest
```

### Docker Compose Production

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres
      - redis
```

### Production Checklist

- [ ] **Security**
  - [ ] Set strong `JWT_SECRET` (minimum 32 characters)
  - [ ] Configure `DATABASE_URL` for production database
  - [ ] Set `NODE_ENV=production`
  - [ ] Enable HTTPS/TLS
  - [ ] Configure CORS with specific origins
  - [ ] Review and set secure headers (helmet)

- [ ] **Performance**
  - [ ] Enable Redis caching
  - [ ] Configure connection pooling
  - [ ] Set up CDN for static assets
  - [ ] Enable compression

- [ ] **Monitoring & Logging**
  - [ ] Enable file logging (`LOG_ENABLE_FILE=true`)
  - [ ] Configure log rotation
  - [ ] Set up error tracking (Sentry, etc.)
  - [ ] Enable audit logging (`LOG_ENABLE_AUDIT=true`)
  - [ ] Set up health checks
  - [ ] Configure monitoring (Prometheus, Datadog, etc.)

- [ ] **Rate Limiting**
  - [ ] Review rate limit thresholds
  - [ ] Configure per-feature rate limits
  - [ ] Set up IP whitelisting if needed

- [ ] **Database**
  - [ ] Disable `synchronize` (should be `false` in production)
  - [ ] Run migrations before deployment
  - [ ] Set up database backups
  - [ ] Configure connection limits

- [ ] **Environment**
  - [ ] Review all environment variables
  - [ ] Set appropriate timeouts
  - [ ] Configure external service URLs
  - [ ] Test all integrations

## Scripts Reference

### Development
```bash
npm run start:dev        # Start with hot-reload
npm run start:debug      # Start in debug mode
npm run format           # Format code with Prettier
npm run lint             # Lint code with ESLint
npm run typecheck        # Type check without build
```

### Testing
```bash
npm test                 # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:cov         # Run tests with coverage
npm run test:e2e         # Run E2E tests (with Docker)
npm run test:e2e:no-docker  # Run E2E tests (manual setup)
npm run test:all         # Run all tests
```

### Build & Production
```bash
npm run build            # Build for production
npm run start:prod       # Start production server
```

### Database
```bash
npm run migration:generate  # Generate migration
npm run migration:run      # Run migrations
npm run migration:revert   # Revert last migration
```

### Docker
```bash
npm run docker:dev:up      # Start dev services
npm run docker:dev:down    # Stop dev services
npm run docker:test:up     # Start test services
npm run docker:test:down   # Stop test services
```

### Maintenance
```bash
npm run clean            # Clean build artifacts
npm run clean:all        # Clean everything and reinstall
npm run audit:fix        # Fix npm vulnerabilities
```

## Testing Strategy

### Unit Tests
- Located alongside source files (`*.spec.ts`)
- Test individual components in isolation
- Mock external dependencies
- Fast execution

### E2E Tests
- Located in `test/modules/`
- Test complete request/response cycles
- Use real database (test instance)
- Cover authentication flows, authorization, and business logic

### Running Tests
```bash
# Unit tests
npm test

# E2E tests with automatic Docker management
npm run test:e2e

# E2E tests with manual service management
npm run docker:test:up
npm run test:e2e:no-docker
npm run docker:test:down

# Coverage reports
npm run test:cov
npm run test:e2e:cov
```

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# View PostgreSQL logs
docker logs template-postgres

# Connect to database
psql postgresql://postgres:password@localhost:5432/template_db
```

### Redis Connection Issues
```bash
# Check if Redis is running
docker ps | grep redis

# Test Redis connection
redis-cli -h localhost -p 6379 ping

# View Redis logs
docker logs template-redis
```

### Migration Issues
```bash
# Check migration status
npm run typeorm migration:show

# Reset database (development only!)
npm run docker:dev:down
npm run docker:dev:up
npm run migration:run
```

### Port Conflicts
```bash
# Check what's using port 3000
lsof -i :3000

# Check database port
lsof -i :5432

# Check Redis port
lsof -i :6379
```

## Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Add tests** for new functionality
5. **Run tests** (`npm run test:all`)
6. **Run linter** (`npm run lint`)
7. **Format code** (`npm run format`)
8. **Commit your changes** (`git commit -m 'Add amazing feature'`)
9. **Push to branch** (`git push origin feature/amazing-feature`)
10. **Open a Pull Request**

### Code Style
- Follow existing code patterns
- Use TypeScript strict mode
- Add JSDoc comments for public APIs
- Write meaningful commit messages
- Keep functions small and focused

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation
- Review the code examples

---

**Built with NestJS** - A progressive Node.js framework for building efficient and scalable server-side applications.
