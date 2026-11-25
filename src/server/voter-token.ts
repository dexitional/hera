import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { eq, or } from 'drizzle-orm';
import { voters } from '../db/schema';

// Voter token (credential password / OTP) protection at rest.
//
// Each token is stored twice, never in plaintext:
//   token_hash : HMAC-SHA256(hashKey, token) hex -- used for login lookups and
//                the global uniqueness constraint
//   token_enc  : AES-256-GCM(encKey, token)       -- decrypted only where the
//                plaintext is genuinely needed (admin voter list/export/form,
//                invite SMS, USSD code retrieval)
// so a leaked database dump or backup no longer reveals any voter's code.
//
// The legacy plaintext column (invite_token) is read only as a fallback for
// rows not yet converted by src/scripts/encrypt-voter-tokens.ts; every write
// sets it to NULL.
//
// Kept in its own module (not alongside createServerFn exports) for the
// client-bundle stripping reason documented in paystack-credit.ts.
//
// Key: VOTER_TOKEN_KEY = 32 random bytes, base64 (`openssl rand -base64 32`).
// Losing or changing it makes every stored token unusable -- back it up with
// the other production secrets.

const ENC_PREFIX = 'v1:';

let cachedKeys: { hash: Buffer; enc: Buffer; session: Buffer; nomineeSession: Buffer } | null = null;

function keys() {
  if (cachedKeys) return cachedKeys;
  const raw = process.env.VOTER_TOKEN_KEY;
  if (!raw) {
    throw new Error('VOTER_TOKEN_KEY is not configured. Generate one with `openssl rand -base64 32`.');
  }
  const master = Buffer.from(raw, 'base64');
  if (master.length < 32) {
    throw new Error('VOTER_TOKEN_KEY must be at least 32 bytes (base64-encoded).');
  }
  const derive = (info: string) => Buffer.from(hkdfSync('sha256', master, Buffer.alloc(0), info, 32));
  cachedKeys = {
    hash: derive('heravote-voter-token-hash-v1'),
    enc: derive('heravote-voter-token-enc-v1'),
    session: derive('heravote-ballot-session-v1'),
    nomineeSession: derive('heravote-nominee-session-v1'),
  };
  return cachedKeys;
}

/** Key for signing ballot session cookies (see voter-auth.ts). */
export function ballotSessionKey(): Buffer {
  return keys().session;
}

/** Key for signing nominee portal session cookies (see nominee-access.ts). */
export function nomineeSessionKey(): Buffer {
  return keys().nomineeSession;
}

export function hashToken(token: string): string {
  return createHmac('sha256', keys().hash).update(token, 'utf8').digest('hex');
}

export function encryptToken(token: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keys().enc, iv);
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ENC_PREFIX + Buffer.concat([iv, tag, ciphertext]).toString('base64');
}

export function decryptToken(value: string): string {
  if (!value.startsWith(ENC_PREFIX)) throw new Error('Unrecognized voter token encoding.');
  const buf = Buffer.from(value.slice(ENC_PREFIX.length), 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', keys().enc, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

/** Column values to write for a (new or changed) token. */
export function tokenColumns(token: string) {
  return {
    tokenHash: hashToken(token),
    tokenEnc: encryptToken(token),
    inviteToken: null,
  };
}

/** Rejects a missing/empty token on insert (the column used to be NOT NULL). */
export function requireToken(token: unknown): string {
  if (typeof token !== 'string' || token.length === 0) {
    throw new Error('Each voter needs an access token.');
  }
  return token;
}

/** Plaintext token for a voter row (encrypted copy, else legacy plaintext). */
export function revealToken(row: { tokenEnc?: string | null; inviteToken?: string | null } | null | undefined): string {
  if (!row) return '';
  if (row.tokenEnc) return decryptToken(row.tokenEnc);
  return row.inviteToken ?? '';
}

/** WHERE clause matching a submitted token (hashed rows, or legacy plaintext rows). */
export function tokenMatches(token: string) {
  return or(eq(voters.tokenHash, hashToken(token)), eq(voters.inviteToken, token));
}

/**
 * Voter row as returned to ADMIN screens: plaintext token under the existing
 * `inviteToken` key (the UI is unchanged), hash/ciphertext stripped.
 */
export function toAdminVoter<T extends Record<string, any>>(row: T) {
  const { tokenHash: _hash, tokenEnc: _enc, ...rest } = row as any;
  return { ...rest, inviteToken: revealToken(row as any) } as Omit<T, 'tokenHash' | 'tokenEnc'> & { inviteToken: string };
}

/** Constant-time string comparison (for signatures). */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
