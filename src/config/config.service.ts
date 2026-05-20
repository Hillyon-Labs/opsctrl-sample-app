import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AppConfig {
  port: number | undefined;
  env: string | undefined;
  name: string | undefined;
}

export interface DatabaseConfig {
  host: string | undefined;
  port: number | undefined;
  user: string | undefined;
  pass: string | undefined;
  name: string | undefined;
  url: string | undefined;
}

export interface RedisConfig {
  url: string | undefined;
}

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  get app(): AppConfig {
    return {
      port: this.config.get<number>('app.port'),
      env: this.config.get<string>('app.env'),
      name: this.config.get<string>('app.name'),
    };
  }

  get database(): DatabaseConfig {
    return {
      host: this.config.get<string>('database.host'),
      port: this.config.get<number>('database.port'),
      user: this.config.get<string>('database.user'),
      pass: this.config.get<string>('database.pass'),
      name: this.config.get<string>('database.name'),
      url: this.config.get<string>('database.url'),
    };
  }

  get redis(): RedisConfig {
    return {
      url: this.config.get<string>('redis.url'),
    };
  }
}
