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
  });

  const appConfig = app.get(AppConfigService);
  const logger = app.get(LoggerService);

  app.useLogger(logger);

  const appPort = appConfig.app.port ?? 3000;
  const appName = appConfig.app.name ?? 'OpsCtrl Sample App';
  const appEnv = appConfig.app.env ?? 'development';

  await enableAppConfig(app);

  app.useGlobalFilters(new AppExceptionFilter());

  setupSwagger(app);

  await app.listen(appPort, '0.0.0.0');

  console.log(`🚀 ${appName} running on port ${appPort} [${appEnv}]`);
  console.log(`📖 API docs: http://localhost:${appPort}/api-docs`);
}

bootstrap();
