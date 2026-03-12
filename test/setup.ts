import * as dotenv from 'dotenv';
import * as path from 'path';
import { AppEnvironment } from 'src/common/enum/enum';

// Load test environment variables before anything else
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Increase Jest timeout for E2E tests
jest.setTimeout(30000);

// Global test setup
beforeAll(async () => {
  // Any global setup can go here
  console.log('Starting E2E test suite...');
});

// Global test teardown
afterAll(async () => {
  // Any global teardown can go here
  console.log('E2E test suite completed.');
});

// Suppress console output during tests unless DEBUG is set
if (process.env.NODE_ENV !== AppEnvironment.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    // Keep warn and error for debugging failed tests
    warn: console.warn,
    error: console.error,
  };
}
