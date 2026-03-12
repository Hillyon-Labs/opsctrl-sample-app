/**
 * Database Helper
 * Utilities for managing test database state
 */

import { DataSource, EntityManager } from 'typeorm';
import { INestApplication } from '@nestjs/common';

// Tables in order of deletion (respect foreign key constraints)
const TABLE_DELETION_ORDER = [
  'refresh_tokens',
  'users',
  'organizations',
];

/**
 * Clean all tables in the database
 * Respects foreign key constraints by deleting in correct order
 */
export async function cleanDatabase(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();

    // Disable foreign key checks for faster truncation
    await queryRunner.query('SET session_replication_role = replica;');

    for (const table of TABLE_DELETION_ORDER) {
      try {
        await queryRunner.query(`TRUNCATE TABLE "${table}" CASCADE;`);
      } catch {
        // Table might not exist, ignore
      }
    }

    // Re-enable foreign key checks
    await queryRunner.query('SET session_replication_role = DEFAULT;');
  } finally {
    await queryRunner.release();
  }
}

/**
 * Clean specific tables
 */
export async function cleanTables(
  dataSource: DataSource,
  tables: string[],
): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();
    await queryRunner.query('SET session_replication_role = replica;');

    for (const table of tables) {
      try {
        await queryRunner.query(`TRUNCATE TABLE "${table}" CASCADE;`);
      } catch {
        // Table might not exist, ignore
      }
    }

    await queryRunner.query('SET session_replication_role = DEFAULT;');
  } finally {
    await queryRunner.release();
  }
}

/**
 * Reset all sequences to their initial values
 */
export async function resetSequences(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();

    // Get all sequences
    const sequences = await queryRunner.query(`
      SELECT sequence_name
      FROM information_schema.sequences
      WHERE sequence_schema = 'public';
    `);

    for (const seq of sequences) {
      await queryRunner.query(
        `ALTER SEQUENCE "${seq.sequence_name}" RESTART WITH 1;`,
      );
    }
  } finally {
    await queryRunner.release();
  }
}

/**
 * Get DataSource from NestJS application
 */
export function getDataSource(app: INestApplication): DataSource {
  return app.get(DataSource);
}

/**
 * Get EntityManager from NestJS application
 */
export function getEntityManager(app: INestApplication): EntityManager {
  return app.get(DataSource).manager;
}

/**
 * Execute raw SQL query
 */
export async function executeQuery(
  dataSource: DataSource,
  query: string,
  parameters?: unknown[],
): Promise<unknown[]> {
  return dataSource.query(query, parameters);
}

/**
 * Wait for database to be ready (useful for container startup)
 */
export async function waitForDatabase(
  dataSource: DataSource,
  maxRetries = 30,
  retryIntervalMs = 1000,
): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      if (!dataSource.isInitialized) {
        await dataSource.initialize();
      }
      await dataSource.query('SELECT 1');
      return;
    } catch {
      if (i === maxRetries - 1) {
        throw new Error('Database not ready after maximum retries');
      }
      await new Promise((resolve) => setTimeout(resolve, retryIntervalMs));
    }
  }
}

/**
 * Seed database with initial test data
 * This is a no-op by default, override in test setup if needed
 */
export async function seedDatabase(_dataSource: DataSource): Promise<void> {
  // Override in specific test files if needed
}

/**
 * Create a test transaction that auto-rolls back after the test
 * Useful for keeping tests isolated without actually cleaning DB
 */
export async function withTestTransaction<T>(
  dataSource: DataSource,
  callback: (entityManager: EntityManager) => Promise<T>,
): Promise<T> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const result = await callback(queryRunner.manager);
    return result;
  } finally {
    await queryRunner.rollbackTransaction();
    await queryRunner.release();
  }
}

/**
 * Count rows in a table
 */
export async function countRows(
  dataSource: DataSource,
  tableName: string,
): Promise<number> {
  const result = await dataSource.query(
    `SELECT COUNT(*) as count FROM "${tableName}"`,
  );
  return parseInt(result[0].count, 10);
}
