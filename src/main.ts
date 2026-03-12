import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfigService } from './config/config.service';
import { AppExceptionFilter } from './common/filters/exception.filter';
import { enableAppConfig } from './config/ignition.config';
import { setupSwagger } from './config/swagger.config';
import { LoggerService } from './common/services/logger.service';

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

  const appPort = appConfig.app.port;
  const appName = appConfig.app.name;

  await enableAppConfig(app);

  // Apply global exception filter
  app.useGlobalFilters(new AppExceptionFilter());

  // Setup API documentation
  setupSwagger(app);

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');

  // Log startup success
  logger.log(
    `\n🚀 Application started successfully!\n` +
      `   Name: ${appName}\n` +
      `   Port: ${appPort}\n` +
      `   Environment: ${appConfig.app.env}\n` +
      `   Node Version: ${process.version}\n` +
      `   PID: ${process.pid}\n` +
      `   Swagger: http://localhost:${appPort}/api/docs\n`,
  );

  // Log startup completion (audit log only)
  logger.logAudit({
    action: 'application_started',
    resource: 'system',
    metadata: {
      appName,
      port: appPort,
      environment: appConfig.app.env,
      nodeVersion: process.version,
      pid: process.pid,
    },
  });
}

bootstrap();
