/**
 * Test Helpers Index
 * Export all test helpers from a single location
 */

// Database helpers
export {
  cleanDatabase,
  cleanTables,
  resetSequences,
  getDataSource,
  getEntityManager,
  executeQuery,
  waitForDatabase,
  seedDatabase,
  withTestTransaction,
  countRows,
} from './database.helper';

// Auth helpers
export {
  generateAccessToken,
  generateRefreshToken,
  generateExpiredToken,
  generateWrongTypeToken,
  generateInvalidSignatureToken,
  generateMalformedToken,
  generateAuthHeader,
  generateUUID,
  hashPassword,
  verifyPassword,
  decodeJwt,
  verifyJwtSignature,
  type JwtTokenPayload,
} from './auth.helper';

// Test app helpers
export {
  createTestApp,
  getTestDataSource,
  getService,
  getProvider,
  closeTestApp,
  getRedisClient,
  flushRedis,
  type TestAppOptions,
} from './test-app.helper';
