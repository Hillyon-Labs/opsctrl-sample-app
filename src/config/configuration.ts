import 'dotenv/config';

export default () => ({
  app: {
    port: parseInt(process.env.PORT || '8080', 10),
    env: process.env.NODE_ENV || 'development',
    name: process.env.APP_NAME || 'NestJS App',
    frontendUrl:
      process.env.FRONTEND_URL ||
      process.env.CLIENT_SIDE_URL ||
      'http://localhost:3000',
    backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
    httpRequestTimeout: parseInt(
      process.env.HTTP_REQUEST_TIMEOUT || '5000',
      10,
    ),
    httpMaxRedirects: parseInt(process.env.HTTP_MAX_REDIRECTS || '5', 10),
  },
  database: {
    host: process.env.DATABASE_HOST!,
    port: parseInt(process.env.DB_PORT!, 10),
    user: process.env.DATABASE_USER!,
    pass: process.env.DATABASE_PASSWORD!,
    name: process.env.DATABASE_NAME!,
    url:
      process.env.DATABASE_URL ||
      'postgresql://postgres:password@localhost:5432/postgres',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '60m',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    passwordHashRounds: parseInt(process.env.PASSWORD_HASH_ROUNDS || '10', 10),
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  openAi: {
    apiKey: process.env.OPENAI_API_KEY!,
    model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o',
  },

  embeddings: {
    apiKey: process.env.OPENAI_API_KEY!,
    model: process.env.OPENAI_EMBEDDINGS_MODEL || 'text-embedding-3-small',
    dimensions: parseInt(process.env.EMBEDDINGS_DIMENSIONS || '1536', 10),
  },

  claude: {
    apiKey: process.env.ANTHROPIC_API_KEY!,
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
  },

  aiProviders: {
    llmProvider: process.env.LLM_PROVIDER || 'claude',
    embeddingsProvider: process.env.EMBEDDINGS_PROVIDER || 'openai',
  },

  rateLimit: {
    general: {
      enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
      unauthenticated: {
        maxRequests: parseInt(process.env.RATE_LIMIT_UNAUTH_MAX || '100', 10),
        windowSeconds: parseInt(
          process.env.RATE_LIMIT_UNAUTH_WINDOW || '60',
          10,
        ),
      },
      authenticated: {
        maxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '1000', 10),
        windowSeconds: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW || '60', 10),
      },
      skipPaths: (
        process.env.RATE_LIMIT_SKIP_PATHS || '/health,/metrics'
      ).split(','),
    },
    diagnosis: {
      enabled: process.env.DIAGNOSIS_RATE_LIMIT_ENABLED !== 'false',
      defaultTier: process.env.DIAGNOSIS_DEFAULT_TIER || 'free',
    },
  },
});
