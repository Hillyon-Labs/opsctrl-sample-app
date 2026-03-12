/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/require-await */

/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppConfigService } from './config.service';
import { AppEnvironment } from 'src/common/enum/enum';
import { SWAGGER_DOCUMENTATION_PATH } from 'src/common/constants/common.constant';
import * as bodyParser from 'body-parser';

const compression = require('compression');

export const enableAppConfig = async (app: INestApplication) => {
  const isProd = app.get(AppConfigService).app.env == AppEnvironment.PROD;
  const isDev = app.get(AppConfigService).app.env == AppEnvironment.DEV;
  const isTest = app.get(AppConfigService).app.env == AppEnvironment.TEST;

  enableValidationPipe(app);

  enableOpenApiDocumentation(app);

  enableSecurityFeatures(app);

  app.setGlobalPrefix('api/v1');

  app.use(compression());

  enableBodyParser(app);

  app.enableCors({
    origin: isProd
      ? 'https://www.example.com'
      : isDev
        ? 'http://localhost:5173'
        : isTest
          ? 'https://www.uat.example.com'
          : '*',

    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });
};

const enableValidationPipe = (app: INestApplication) => {
  app.useGlobalPipes(
    new ValidationPipe({
      forbidUnknownValues: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
};
/**
 * This will enable the auto-documentation of apis.
 * @param app
 */
const enableOpenApiDocumentation = (app: INestApplication) => {
  const isProduction = app.get(AppConfigService).app.env == AppEnvironment.PROD;

  const APP_NAME = app.get(AppConfigService).app.name;
  if (isProduction) return;

  const config = new DocumentBuilder()
    .setTitle(`Live Api documentation for ${APP_NAME}`)
    .setDescription(`Live description for ${APP_NAME}`)
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [],
  });

  SwaggerModule.setup(SWAGGER_DOCUMENTATION_PATH, app, document);
};

/**
 * This is wherer we put all the security features for our applications.
 * Throttling,
 *
 */
const enableSecurityFeatures = (app: INestApplication) => {
  app.use(
    helmet({
      hidePoweredBy: true,
      xssFilter: true,
    }),
  );
};

/**
 * Configure body parsers with support for raw body preservation
 */
const enableBodyParser = (app: INestApplication) => {
  app.use(
    bodyParser.json({
      limit: '100mb',
    }),
  );

  app.use(
    bodyParser.urlencoded({
      extended: true,
      limit: '100mb',
    }),
  );
};
