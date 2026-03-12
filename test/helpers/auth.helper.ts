/**
 * Auth Helper
 * Utilities for generating authentication tokens in tests
 */

import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

// JWT Secret for tests (matches .env.test)
const TEST_JWT_SECRET = 'test-jwt-secret-key-at-least-32-characters-long';

export interface JwtTokenPayload {
  sub: string; // User ID
  email: string;
  role: string;
  orgId?: string;
  iat: number;
  exp: number;
  type: 'access' | 'refresh';
}

/**
 * Generate a valid JWT access token
 */
export function generateAccessToken(
  overrides: Partial<JwtTokenPayload> = {},
): string {
  const now = Math.floor(Date.now() / 1000);

  const payload: JwtTokenPayload = {
    sub: crypto.randomUUID(),
    email: 'test@example.com',
    role: 'developer',
    orgId: undefined,
    iat: now,
    exp: now + 3600, // 1 hour
    type: 'access',
    ...overrides,
  };

  return signJwt(payload, TEST_JWT_SECRET);
}

/**
 * Generate a valid JWT refresh token
 */
export function generateRefreshToken(
  overrides: Partial<JwtTokenPayload> = {},
): string {
  const now = Math.floor(Date.now() / 1000);

  const payload: JwtTokenPayload = {
    sub: crypto.randomUUID(),
    email: 'test@example.com',
    role: 'developer',
    orgId: undefined,
    iat: now,
    exp: now + 86400, // 1 day
    type: 'refresh',
    ...overrides,
  };

  return signJwt(payload, TEST_JWT_SECRET);
}

/**
 * Generate an expired access token for testing
 */
export function generateExpiredToken(
  overrides: Partial<JwtTokenPayload> = {},
): string {
  const now = Math.floor(Date.now() / 1000);

  return generateAccessToken({
    iat: now - 7200, // 2 hours ago
    exp: now - 3600, // 1 hour ago (expired)
    ...overrides,
  });
}

/**
 * Generate a token with wrong type (not 'access')
 */
export function generateWrongTypeToken(
  overrides: Partial<JwtTokenPayload> = {},
): string {
  return generateAccessToken({
    type: 'refresh',
    ...overrides,
  });
}

/**
 * Generate a token with invalid signature
 */
export function generateInvalidSignatureToken(
  overrides: Partial<JwtTokenPayload> = {},
): string {
  const token = generateAccessToken(overrides);
  // Tamper with the signature by changing last few characters
  return token.slice(0, -10) + 'XXXXXXXXXX';
}

/**
 * Generate a malformed token (not proper JWT structure)
 */
export function generateMalformedToken(): string {
  return 'this.is.not.a.valid.jwt';
}

/**
 * Generate an authorization header with Bearer token
 */
export function generateAuthHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

/**
 * Generate a UUID
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Hash a password using bcrypt (for creating test users)
 */
export async function hashPassword(password: string): Promise<string> {
  // Use low rounds for faster tests
  return bcrypt.hash(password, 4);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Helper: Sign JWT with HS256
function signJwt(payload: object, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Helper: Base64 URL encode
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Decode JWT (for assertions in tests)
export function decodeJwt(token: string): {
  header: object;
  payload: object;
  signature: string;
} | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    return {
      header: JSON.parse(Buffer.from(parts[0], 'base64url').toString()),
      payload: JSON.parse(Buffer.from(parts[1], 'base64url').toString()),
      signature: parts[2],
    };
  } catch {
    return null;
  }
}

// Verify JWT signature (for testing)
export function verifyJwtSignature(token: string, secret: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${parts[0]}.${parts[1]}`)
      .digest('base64url');

    return parts[2] === expectedSignature;
  } catch {
    return false;
  }
}
