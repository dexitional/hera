import Redis from 'ioredis';

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

// enableOfflineQueue: false -> commands fail immediately while disconnected
// instead of queueing and hanging the login request.
const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
});

let lastRedisErrorLog = 0;
redis.on('error', (err) => {
  const now = Date.now();
  if (now - lastRedisErrorLog > 60_000) {
    lastRedisErrorLog = now;
    console.error('[VOTER AUTH] Redis unavailable, login lockout disabled:', err?.message);
  }
});

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
 * inviteToken is still included because castBallotServerFn re-verifies it; at
 * this point the voter has proven they know it (password, OTP, or Google).
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
      inviteToken: v.inviteToken,
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
