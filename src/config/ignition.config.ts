import { INestApplication, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppConfigService } from './config.service';
import { AppEnvironment } from 'src/common/enum/enum';

const compression = require('compression');

export const enableAppConfig = async (app: INestApplication) => {
  const config = app.get(AppConfigService);
  const isProd = config.app.env === AppEnvironment.PROD;
  const isDev = config.app.env === AppEnvironment.DEV;

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use(helmet({ hidePoweredBy: true }));
  app.use(compression());

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: isProd ? 'https://www.opsctrl.dev' : isDev ? 'http://localhost:5173' : '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });
};
