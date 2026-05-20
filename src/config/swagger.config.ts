import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppConfigService } from './config.service';

export function setupSwagger(app: INestApplication): void {
  const appConfig = app.get(AppConfigService);

  const config = new DocumentBuilder()
    .setTitle('OpsCtrl Sample App')
    .setDescription(
      'Sample NestJS app demonstrating PostgreSQL, Redis queues, and health checks — deployed via OpsCtrl.',
    )
    .setVersion('1.0')
    .addTag('Notes', 'Note CRUD — triggers BullMQ jobs on create')
    .addTag('Health', 'Platform health checks')
    .addServer(
      `http://localhost:${appConfig.app.port}`,
      'Local',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
    customSiteTitle: 'OpsCtrl Sample App — API Docs',
  });
}
