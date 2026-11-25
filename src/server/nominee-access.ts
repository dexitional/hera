import { createHmac, randomInt } from 'node:crypto';
import { deleteCookie, getCookie, setCookie } from '@tanstack/react-start/server';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { categories, contestants, events, nomineeAccess } from '../db/schema';
import { nomineeSessionKey, safeEqual } from './voter-token';

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
