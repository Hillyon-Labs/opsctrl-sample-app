import { Module } from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from './config/config.module';
import { AppConfigService } from './config/config.service';
import { AppController } from './app.controller';
import { LoggingModule } from './common/logging.module';
// import { RateLimitModule } from './modules/rate-limit';

@Module({
  imports: [
    LoggingModule,
    // TODO: Uncomment when RateLimitModule is created
    // RateLimitModule.forRoot(),
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
    AppConfigModule,
    // TODO: Add AuthModule, UsersModule, OrganizationsModule when ready
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
