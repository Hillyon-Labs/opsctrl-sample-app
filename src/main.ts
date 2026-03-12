import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfigService } from './config/config.service';
import { AppExceptionFilter } from './common/filters/exception.filter';
import { enableAppConfig } from './config/ignition.config';
import { setupSwagger } from './config/swagger.config';
import { LoggerService } from './common/services/logger.service';
import { logStartupSuccess } from './common/utils/banner.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    // Don't use built-in body parser - configured in ignition.config.ts
    bodyParser: false,
  });

  // Get services
  const appConfig = app.get(AppConfigService);
  const logger = app.get(LoggerService);

  // Use custom logger
  app.useLogger(logger);

  const appPort = appConfig.app.port ?? 3000;
  const appName = appConfig.app.name ?? 'NestJS Backend Template';
  const appEnv = appConfig.app.env ?? 'development';

  await enableAppConfig(app);

  // Apply global exception filter
  app.useGlobalFilters(new AppExceptionFilter());

  // Setup API documentation
  setupSwagger(app);

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');

  // Log startup success with nice formatted banner
  logStartupSuccess(appName, appPort, appEnv, '/api/docs');

  // Log startup completion (audit log only)
  logger.logAudit({
    action: 'application_started',
    resource: 'system',
    metadata: {
      appName,
      port: appPort,
      environment: appEnv,
      nodeVersion: process.version,
      pid: process.pid,
    },
  });
}

bootstrap();
