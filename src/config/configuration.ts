import 'dotenv/config';

export default () => ({
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
    name: process.env.APP_NAME || 'OpsCtrl Sample App',
  },
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    user: process.env.DATABASE_USER || 'postgres',
    pass: process.env.DATABASE_PASSWORD || 'password',
    name: process.env.DATABASE_NAME || 'sample_app',
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
});
