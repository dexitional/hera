import { createHmac } from 'node:crypto';
import { fastRedis } from './redis-fast';
import { deleteCookie, getCookie, setCookie } from '@tanstack/react-start/server';
import { ballotSessionKey, safeEqual } from './voter-token';

// Voter-login helpers: brute-force lockout + the trimmed payload returned to
// the browser after a successful login.
//
// Kept in its own module (not alongside the createServerFn exports in
// tenant-elections.ts) for the client-bundle stripping reason documented in
// paystack-credit.ts.

// ------------------------------------------------------------------
// Brute-force lockout
// ------------------------------------------------------------------
//
// Two counters per login identity (election + normalized username):
//   * per identity + IP : 5 failures  -> that IP is locked out of that voter for 15 min
//   * per identity      : 20 failures -> the voter is locked out from everywhere for 15 min
// The per-IP tier stops a single attacker quickly without letting them lock a
// voter out from their own device; the global tier caps distributed guessing.
// A 6-char token from a 32-char alphabet (~1e9 combinations) is infeasible to
// guess at 20 tries per 15 minutes.
//
// Fails OPEN if Redis is unreachable: an outage must not stop a live election.
// The Arcjet IP rate limit still applies in that case.

const MAX_FAILURES_PER_IP = 5;
const MAX_FAILURES_PER_IDENTITY = 20;
const LOCKOUT_SECONDS = 15 * 60;

// Shared fail-fast client (see redis-fast.ts).
const redis = fastRedis;

function normalizeIdentity(value: unknown): string {
  return String(value ?? '').toLowerCase().replace(/\s+/g, '');
}

function keysFor(electionId: string, username: unknown, ip: string) {
  const identity = `${electionId}:${normalizeIdentity(username)}`;
  return {
    perIp: `voterauth:fail:${identity}:${ip}`,
    perIdentity: `voterauth:fail:${identity}`,
  };
}

/** True when this identity (or this identity from this IP) is currently locked out. */
export async function isLoginLockedOut(electionId: string, username: unknown, ip: string): Promise<boolean> {
  try {
    const { perIp, perIdentity } = keysFor(electionId, username, ip);
    const [ipCount, identityCount] = await redis.mget(perIp, perIdentity);
    return Number(ipCount || 0) >= MAX_FAILURES_PER_IP || Number(identityCount || 0) >= MAX_FAILURES_PER_IDENTITY;
  } catch {
    return false;
  }
}

export async function recordLoginFailure(electionId: string, username: unknown, ip: string): Promise<void> {
  try {
    const { perIp, perIdentity } = keysFor(electionId, username, ip);
    for (const key of [perIp, perIdentity]) {
      const count = await redis.incr(key);
      // Fixed window from the first failure.
      if (count === 1) await redis.expire(key, LOCKOUT_SECONDS);
    }
  } catch {
    // fail open -- see header comment
  }
}

export async function clearLoginFailures(electionId: string, username: unknown, ip: string): Promise<void> {
  try {
    const { perIp, perIdentity } = keysFor(electionId, username, ip);
    await redis.del(perIp, perIdentity);
  } catch {
    // fail open
  }
}

export const LOCKED_OUT_MESSAGE = 'Too many failed attempts. Please wait 15 minutes and try again.';

// ------------------------------------------------------------------
// Client IP
// ------------------------------------------------------------------

/**
 * Real client IP behind Cloudflare -> nginx -> Node. CF-Connecting-IP is set by
 * Cloudflare and can't be spoofed by the visitor as long as the origin only
 * accepts traffic from Cloudflare (see the nginx CF-only lockdown noted in
 * lib/arcjet.ts). X-Forwarded-For's first entry IS client-controlled, so it is
 * only a last-resort fallback (local dev).
 */
export function getClientIp(request: Request | undefined | null): string {
  const headers = request?.headers;
  return (
    headers?.get('cf-connecting-ip')?.trim() ||
    headers?.get('x-real-ip')?.trim() ||
    headers?.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '127.0.0.1'
  );
}

// ------------------------------------------------------------------
// Login payload
// ------------------------------------------------------------------

/**
 * Shape returned to the browser after a voter has FULLY authenticated. Same
 * nested { voters, elections } layout the login UI already consumes, but with
 * only the fields it uses -- the raw joined rows previously sent everything
 * (including other election config) to the client.
 *
 * The voter's token is NOT included: the right to cast a ballot is carried by
 * the httpOnly ballot session cookie (issueBallotSession below), so the
 * password/OTP no longer has to sit in the browser's localStorage.
 */
export function toVoterLoginPayload(row: { voters: any; elections: any }) {
  const v = row.voters;
  const e = row.elections;
  return {
    voters: {
      id: v.id,
      username: v.username,
      name: v.name,
      phoneNumber: v.phoneNumber,
      email: v.email,
      electionId: v.electionId,
      hasVoted: v.hasVoted,
    },
    elections: {
      id: e.id,
      title: e.title,
      status: e.status,
      startAt: e.startAt,
      endAt: e.endAt,
      autoStop: e.autoStop,
      imageUrl: e.imageUrl,
    },
  };
}

// ------------------------------------------------------------------
// Ballot session
// ------------------------------------------------------------------
//
// Issued after a successful voter login (credential, OTP or Google) and
// required by castBallotServerFn, which takes the voter's identity from it
// instead of trusting a voterId + token sent by the browser.
//
// Format: base64url(JSON {v: voterId, e: electionId, x: expiryMs}) + "." +
// base64url(HMAC-SHA256). httpOnly (unreadable by page scripts), SameSite
// Strict (never sent on cross-site requests), 60-minute lifetime.

const BALLOT_COOKIE = 'hv_ballot';
const BALLOT_SESSION_SECONDS = 60 * 60;

function signBallotPayload(payload: string): string {
  return createHmac('sha256', ballotSessionKey()).update(payload).digest('base64url');
}

export function issueBallotSession(voterId: string, electionId: string): void {
  const payload = Buffer.from(
    JSON.stringify({ v: voterId, e: electionId, x: Date.now() + BALLOT_SESSION_SECONDS * 1000 }),
  ).toString('base64url');
  setCookie(BALLOT_COOKIE, `${payload}.${signBallotPayload(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: BALLOT_SESSION_SECONDS,
  });
}

/** The authenticated voter for this request, or null if missing/invalid/expired. */
export function readBallotSession(): { voterId: string; electionId: string } | null {
  const raw = getCookie(BALLOT_COOKIE);
  if (!raw) return null;
  const [payload, signature] = raw.split('.');
  if (!payload || !signature || !safeEqual(signature, signBallotPayload(payload))) return null;
  try {
    const { v, e, x } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof v !== 'string' || typeof e !== 'string' || typeof x !== 'number' || Date.now() > x) return null;
    return { voterId: v, electionId: e };
  } catch {
    return null;
  }
}

export function clearBallotSession(): void {
  deleteCookie(BALLOT_COOKIE, { path: '/' });
}
