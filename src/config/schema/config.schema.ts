import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  APP_NAME: Joi.string().default('OpsCtrl Sample App'),

  // All database vars have defaults — no env vars required to run locally
  DATABASE_URL: Joi.string().optional(),
  DATABASE_HOST: Joi.string().default('localhost'),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_USER: Joi.string().default('postgres'),
  DATABASE_PASSWORD: Joi.string().default('password'),
  DATABASE_NAME: Joi.string().default('sample_app'),

  REDIS_URL: Joi.string().default('redis://localhost:6379'),
});
