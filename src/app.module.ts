import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RedisModule } from '@nestjs-modules/ioredis';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from './config/config.module';
import { AppConfigService } from './config/config.service';
import { AppController } from './app.controller';
import { LoggingModule } from './common/logging.module';
import { NotesModule } from './modules/notes/notes.module';
import { QueueModule } from './modules/queue/queue.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    LoggingModule,
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (appConfigService: AppConfigService) => {
        const isProduction = appConfigService.app.env === 'production';
        return {
          type: 'postgres',
          host: appConfigService.database.host,
          port: appConfigService.database.port,
          username: appConfigService.database.user,
          database: appConfigService.database.name,
          password: appConfigService.database.pass,
          url: appConfigService.database.url,
          entities: [__dirname + '/**/*.entity.{ts,js}'],
          synchronize: !isProduction,
          autoLoadEntities: true,
        };
      },
    }),
    RedisModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (appConfigService: AppConfigService) => ({
        type: 'single',
        url: appConfigService.redis.url,
      }),
    }),
    BullModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (appConfigService: AppConfigService) => ({
        connection: { url: appConfigService.redis.url },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: 50,
          removeOnFail: 100,
        },
      }),
    }),
    NotesModule,
    QueueModule,
    HealthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
