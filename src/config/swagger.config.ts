import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppConfigService } from './config.service';

export function setupSwagger(app: INestApplication): void {
  const appConfig = app.get(AppConfigService);

  const config = new DocumentBuilder()
    .setTitle('NestJS Backend Template API')
    .setDescription(
      'A production-ready NestJS backend template with authentication, database, Redis, AI providers, and rate limiting',
    )
    .setVersion('1.0')
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Users', 'User management and profiles')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addServer(
      appConfig.app.env === 'production'
        ? appConfig.app.backendUrl || 'https://api.example.com'
        : `http://localhost:${appConfig.app.port}`,
      appConfig.app.env === 'production' ? 'Production' : 'Development',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
    customSiteTitle: 'API Documentation',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #3b82f6 }
    `,
  });
}
