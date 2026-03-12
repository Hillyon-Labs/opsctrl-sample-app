// src/config/validation-schema.ts
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // if you provide a full URL, you don't need the individual pieces:
  DATABASE_URL: Joi.string(),

  DATABASE_HOST: Joi.string()
    .empty('') // treat '' as null
    .when('DATABASE_URL', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required(),
    }),
  DATABASE_PORT: Joi.number().when('DATABASE_URL', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.number().default(5432),
  }),
  DATABASE_USER: Joi.string().when('DATABASE_URL', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  DATABASE_PASSWORD: Joi.string().when('DATABASE_URL', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  DATABASE_NAME: Joi.string().when('DATABASE_URL', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),

  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('60m'),
  REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('7d'),
  PASSWORD_HASH_ROUNDS: Joi.number().default(10),

  REDIS_URL: Joi.string().required(),
  CLIENT_SIDE_URL: Joi.string().required(), // treat '' as null

  // OpenAI configuration - optional (not both AI providers required)
  OPENAI_API_KEY: Joi.string().optional(),
  OPENAI_CHAT_MODEL: Joi.string().default('gpt-4o'),
  OPENAI_EMBEDDINGS_MODEL: Joi.string().default('text-embedding-3-small'),
  EMBEDDINGS_DIMENSIONS: Joi.number().default(1536),

  // Claude/Anthropic configuration - optional (not both AI providers required)
  ANTHROPIC_API_KEY: Joi.string().optional(),
  CLAUDE_MODEL: Joi.string().default('claude-sonnet-4-20250514'),

  // AI Provider selection
  LLM_PROVIDER: Joi.string().valid('claude', 'openai').default('claude'),
  EMBEDDINGS_PROVIDER: Joi.string().valid('openai').default('openai'),

  // General Rate Limiting configuration
  RATE_LIMIT_ENABLED: Joi.boolean().default(true),
  RATE_LIMIT_UNAUTH_MAX: Joi.number().default(100),
  RATE_LIMIT_UNAUTH_WINDOW: Joi.number().default(60),
  RATE_LIMIT_AUTH_MAX: Joi.number().default(1000),
  RATE_LIMIT_AUTH_WINDOW: Joi.number().default(60),
  RATE_LIMIT_SKIP_PATHS: Joi.string().default('/health,/metrics'),

  // Diagnosis Rate Limiting configuration
  DIAGNOSIS_RATE_LIMIT_ENABLED: Joi.boolean().default(true),
  DIAGNOSIS_DEFAULT_TIER: Joi.string()
    .valid('free', 'pro', 'enterprise')
    .default('free'),
})
  // enforce that at least one "connection" method is present
  .or('DATABASE_URL', 'DATABASE_HOST')
  // enforce that at least one AI provider API key is present
  .or('OPENAI_API_KEY', 'ANTHROPIC_API_KEY');
