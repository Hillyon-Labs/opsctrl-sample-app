import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface DatabaseConfig {
  host: string | undefined;
  port: number | undefined;
  user: string | undefined;
  pass: string | undefined;
  name: string | undefined;
  url: string | undefined;
}

export interface AuthConfig {
  jwtSecret: string | undefined;
  jwtExpiresIn: string | undefined;
  refreshTokenExpiresIn: string | undefined;
  passwordHashRounds: number | undefined;
}

export interface AppConfig {
  port: number | undefined;
  env: string | undefined;
  name: string | undefined;
  frontendUrl: string | undefined;
  backendUrl: string | undefined;
  httpRequestTimeout: number | undefined;
  httpMaxRedirects: number | undefined;
}

export interface OpenAiConfig {
  apiKey: string;
  model: string;
}

export interface EmbeddingsConfig {
  apiKey: string;
  model: string;
  dimensions?: number;
}

export interface ClaudeConfig {
  apiKey: string;
  model: string;
}

export interface AiProvidersConfig {
  llmProvider: 'claude' | 'openai';
  embeddingsProvider: 'openai';
}

export interface RedisConfig {
  url: string | undefined;
}

export interface RateLimitWindowConfig {
  maxRequests: number;
  windowSeconds: number;
}

export interface GeneralRateLimitConfig {
  enabled: boolean;
  unauthenticated: RateLimitWindowConfig;
  authenticated: RateLimitWindowConfig;
  skipPaths: string[];
}

export interface DiagnosisRateLimitConfig {
  enabled: boolean;
  defaultTier: 'free' | 'pro' | 'enterprise';
}

export interface RateLimitConfig {
  general: GeneralRateLimitConfig;
  diagnosis: DiagnosisRateLimitConfig;
}

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  // app
  get app(): AppConfig {
    return {
      port: this.config.get<number>('app.port'),
      env: this.config.get<string>('app.env'),
      name: this.config.get<string>('app.name'),
      frontendUrl: this.config.get<string>('app.frontendUrl'),
      backendUrl: this.config.get<string>('app.backendUrl'),
      httpRequestTimeout: this.config.get<number>('app.httpRequestTimeout'),
      httpMaxRedirects: this.config.get<number>('app.httpMaxRedirects'),
    };
  }

  // database
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

  // auth
  get auth(): AuthConfig {
    return {
      jwtSecret: this.config.get<string>('auth.jwtSecret'),
      jwtExpiresIn: this.config.get<string>('auth.jwtExpiresIn'),
      refreshTokenExpiresIn: this.config.get<string>(
        'auth.refreshTokenExpiresIn',
      ),
      passwordHashRounds: this.config.get<number>('auth.passwordHashRounds'),
    };
  }

  get redis(): RedisConfig {
    return {
      url: this.config.get<string>('redis.url'),
    };
  }

  get openAi(): OpenAiConfig {
    return {
      apiKey: this.config.get<string>('openAi.apiKey'),
      model: this.config.get<string>('openAi.model'),
    } as OpenAiConfig;
  }

  get embeddings(): EmbeddingsConfig {
    return {
      apiKey: this.config.get<string>('embeddings.apiKey'),
      model: this.config.get<string>('embeddings.model'),
      dimensions: this.config.get<number>('embeddings.dimensions'),
    } as EmbeddingsConfig;
  }

  get claude(): ClaudeConfig {
    return {
      apiKey: this.config.get<string>('claude.apiKey'),
      model: this.config.get<string>('claude.model'),
    } as ClaudeConfig;
  }

  get aiProviders(): AiProvidersConfig {
    return {
      llmProvider: this.config.get<'claude' | 'openai'>(
        'aiProviders.llmProvider',
      ),
      embeddingsProvider: this.config.get<'openai'>(
        'aiProviders.embeddingsProvider',
      ),
    } as AiProvidersConfig;
  }

  get rateLimit(): RateLimitConfig {
    return {
      general: {
        enabled: this.config.get<boolean>('rateLimit.general.enabled') ?? true,
        unauthenticated: {
          maxRequests:
            this.config.get<number>(
              'rateLimit.general.unauthenticated.maxRequests',
            ) ?? 100,
          windowSeconds:
            this.config.get<number>(
              'rateLimit.general.unauthenticated.windowSeconds',
            ) ?? 60,
        },
        authenticated: {
          maxRequests:
            this.config.get<number>(
              'rateLimit.general.authenticated.maxRequests',
            ) ?? 1000,
          windowSeconds:
            this.config.get<number>(
              'rateLimit.general.authenticated.windowSeconds',
            ) ?? 60,
        },
        skipPaths:
          this.config.get<string[]>('rateLimit.general.skipPaths') ?? [],
      },
      diagnosis: {
        enabled:
          this.config.get<boolean>('rateLimit.diagnosis.enabled') ?? true,
        defaultTier:
          this.config.get<'free' | 'pro' | 'enterprise'>(
            'rateLimit.diagnosis.defaultTier',
          ) ?? 'free',
      },
    };
  }
}
