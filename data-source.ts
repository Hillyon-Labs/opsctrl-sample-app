import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const isProduction = process.env.NODE_ENV === 'production';

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'sample_app',
  url: process.env.DATABASE_URL,
  entities: [isProduction ? 'dist/**/*.entity.js' : 'src/**/*.entity.ts'],
  migrations: [isProduction ? 'dist/migrations/*.js' : 'src/migrations/*.ts'],
  synchronize: false,
});
