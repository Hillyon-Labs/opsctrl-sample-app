import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
  MicroserviceHealthIndicator,
} from '@nestjs/terminus';
import { Transport } from '@nestjs/microservices';
import { AppConfigService } from '@/config/config.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly microservice: MicroserviceHealthIndicator,
    private readonly config: AppConfigService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Platform health check — DB + Redis' })
  check() {
    return this.health.check([
      () => this.db.pingCheck('postgresql'),
      () =>
        this.microservice.pingCheck('redis', {
          transport: Transport.REDIS,
          options: { url: this.config.redis.url },
        }),
    ]);
  }
}
