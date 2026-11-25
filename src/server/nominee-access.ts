import { createHmac, randomInt } from 'node:crypto';
import { deleteCookie, getCookie, setCookie } from '@tanstack/react-start/server';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { categories, contestants, events, nomineeAccess } from '../db/schema';
import { nomineeSessionKey, safeEqual } from './voter-token';
import { fastRedis } from './redis-fast';

// Nominee portal access: access codes and the signed session cookie.
//
// Kept in its own module (not alongside createServerFn exports) for the
// client-bundle stripping reason documented in paystack-credit.ts.

// No 0/O, 1/I/L: codes get read out over the phone and typed from SMS.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const NOMINEE_CODE_LENGTH = 8;

/** A fresh access code, e.g. "K7QM4XRP" (31^8 ≈ 8.5e11 combinations). */
export function generateNomineeCode(): string {
  let code = '';
  for (let i = 0; i < NOMINEE_CODE_LENGTH; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return code;
}

/** What a nominee typed, in stored form: upper case, no spaces or dashes. */
export function canonicalCode(input: unknown): string {
  return String(input ?? '').toUpperCase().replace(/[\s-]/g, '');
}

// ---------------------------------------------------------------------------
// Session cookie
// ---------------------------------------------------------------------------
//
// base64url(JSON {c: contestantId, k: first 16 hex of the code hash, x: expiry})
// + "." + HMAC-SHA256. The code-hash fragment ties the session to the current
// access code, so an admin resetting a nominee's code signs out every device
// that used the old one. httpOnly, SameSite Lax (the invite link arrives from
// an SMS/WhatsApp tap, a cross-site navigation), 30 days.

const NOMINEE_COOKIE = 'hv_nominee';
const NOMINEE_SESSION_SECONDS = 30 * 24 * 60 * 60;

const sign = (payload: string) => createHmac('sha256', nomineeSessionKey()).update(payload).digest('base64url');
const codeFingerprint = (codeHash: string) => codeHash.slice(0, 16);

export function issueNomineeSession(contestantId: string, codeHash: string): void {
  const payload = Buffer.from(
    JSON.stringify({ c: contestantId, k: codeFingerprint(codeHash), x: Date.now() + NOMINEE_SESSION_SECONDS * 1000 }),
  ).toString('base64url');
  setCookie(NOMINEE_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: NOMINEE_SESSION_SECONDS,
  });
}

export function clearNomineeSession(): void {
  deleteCookie(NOMINEE_COOKIE, { path: '/' });
}

function readCookie(): { contestantId: string; fingerprint: string } | null {
  const raw = getCookie(NOMINEE_COOKIE);
  if (!raw) return null;
  const [payload, signature] = raw.split('.');
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;
  try {
    const { c, k, x } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof c !== 'string' || typeof k !== 'string' || typeof x !== 'number' || Date.now() > x) return null;
    return { contestantId: c, fingerprint: k };
  } catch {
    return null;
  }
}

export type NomineeSession = Awaited<ReturnType<typeof loadNominee>>;

async function loadNominee(contestantId: string) {
  const [row] = await db
    .select({
      contestant: {
        id: contestants.id,
        name: contestants.name,
        tagline: contestants.tagline,
        imageUrl: contestants.imageUrl,
        flyerUrl: contestants.flyerUrl,
        introVideoUrl: contestants.introVideoUrl,
        code: contestants.code,
        phone: contestants.phone,
        categoryId: contestants.categoryId,
      },
      category: { id: categories.id, name: categories.name },
      event: { id: events.id, title: events.title, imageUrl: events.imageUrl, isActive: events.isActive, startAt: events.startAt, endAt: events.endAt },
      access: { codeHash: nomineeAccess.codeHash, activatedAt: nomineeAccess.activatedAt },
    })
    .from(nomineeAccess)
    .innerJoin(contestants, eq(nomineeAccess.contestantId, contestants.id))
    .innerJoin(categories, eq(contestants.categoryId, categories.id))
    .innerJoin(events, eq(categories.eventId, events.id))
    .where(eq(nomineeAccess.contestantId, contestantId));
  return row ?? null;
}

/**
 * The signed-in nominee for this request, or null. Re-checked against the
 * database every time, so a deleted nominee or a reset code ends the session.
 */
export async function currentNominee() {
  const cookie = readCookie();
  if (!cookie) return null;
  const row = await loadNominee(cookie.contestantId);
  if (!row || !safeEqual(codeFingerprint(row.access.codeHash), cookie.fingerprint)) return null;
  return row;
}

export async function requireNominee() {
  const nominee = await currentNominee();
  if (!nominee) throw new Error('Your session has ended. Please sign in again.');
  return nominee;
}

// ---------------------------------------------------------------------------
// Sign-in throttling (code-only sign-in)
// ---------------------------------------------------------------------------
//
// With no second factor, the defence against guessing is volume: a code is
// one of 31^8 (~8.5e11). Wrong attempts are capped per client IP, and a
// platform-wide ceiling stops a distributed guessing run (it can briefly
// pause code sign-in for everyone, the price of not letting a botnet grind
// through codes). Both windows are 15 minutes and fail open if Redis is down
// (Arcjet's per-IP limit still applies).

const WINDOW_SECONDS = 15 * 60;
const MAX_FAILURES_PER_IP = 10;
const MAX_FAILURES_GLOBAL = 1000;
const ipKey = (ip: string) => `nomineeauth:fail:ip:${ip}`;
const GLOBAL_KEY = 'nomineeauth:fail:all';

export async function isCodeSignInThrottled(ip: string): Promise<boolean> {
  try {
    const [perIp, all] = await fastRedis.mget(ipKey(ip), GLOBAL_KEY);
    return Number(perIp || 0) >= MAX_FAILURES_PER_IP || Number(all || 0) >= MAX_FAILURES_GLOBAL;
  } catch {
    return false;
  }
}

export async function recordCodeSignInFailure(ip: string): Promise<void> {
  try {
    for (const key of [ipKey(ip), GLOBAL_KEY]) {
      const n = await fastRedis.incr(key);
      if (n === 1) await fastRedis.expire(key, WINDOW_SECONDS);
    }
  } catch {
    // fail open -- see above
  }
}

export async function clearCodeSignInFailures(ip: string): Promise<void> {
  try {
    await fastRedis.del(ipKey(ip));
  } catch {
    // fail open
  }
}
