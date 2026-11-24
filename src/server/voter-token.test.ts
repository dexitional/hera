import { randomBytes } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// In-memory cookie jar standing in for TanStack Start's request/response cookies.
const jar = new Map<string, string>();
vi.mock('@tanstack/react-start/server', () => ({
  getCookie: (name: string) => jar.get(name),
  setCookie: (name: string, value: string) => void jar.set(name, value),
  deleteCookie: (name: string) => void jar.delete(name),
}));
// voter-auth.ts opens a Redis client at import; the lockout isn't under test here.
vi.mock('ioredis', () => ({ default: class { on() {} } }));

const KEY_A = randomBytes(32).toString('base64');
const KEY_B = randomBytes(32).toString('base64');

async function load(key: string | undefined) {
  vi.resetModules();
  if (key === undefined) delete process.env.VOTER_TOKEN_KEY;
  else process.env.VOTER_TOKEN_KEY = key;
  return {
    token: await import('./voter-token'),
    auth: await import('./voter-auth'),
  };
}

beforeEach(() => jar.clear());

describe('voter token encryption', () => {
  it('round-trips, and never stores the plaintext', async () => {
    const { token } = await load(KEY_A);
    const enc = token.encryptToken('AB3K9Z');
    expect(enc).not.toContain('AB3K9Z');
    expect(token.decryptToken(enc)).toBe('AB3K9Z');
  });

  it('uses a fresh IV each time (same token -> different ciphertext)', async () => {
    const { token } = await load(KEY_A);
    expect(token.encryptToken('AB3K9Z')).not.toBe(token.encryptToken('AB3K9Z'));
  });

  it('rejects tampered ciphertext (GCM authentication)', async () => {
    const { token } = await load(KEY_A);
    const enc = token.encryptToken('AB3K9Z');
    const raw = Buffer.from(enc.slice(3), 'base64');
    raw[raw.length - 1] ^= 0xff;
    expect(() => token.decryptToken('v1:' + raw.toString('base64'))).toThrow();
  });

  it('hash is deterministic per key and differs across keys', async () => {
    const a = (await load(KEY_A)).token;
    const h1 = a.hashToken('AB3K9Z');
    expect(a.hashToken('AB3K9Z')).toBe(h1);
    expect(a.hashToken('AB3K9Y')).not.toBe(h1);
    const b = (await load(KEY_B)).token;
    expect(b.hashToken('AB3K9Z')).not.toBe(h1);
  });

  it('fails loudly when VOTER_TOKEN_KEY is missing or too short', async () => {
    const missing = (await load(undefined)).token;
    expect(() => missing.hashToken('x')).toThrow(/VOTER_TOKEN_KEY is not configured/);
    const short = (await load(Buffer.from('short').toString('base64'))).token;
    expect(() => short.hashToken('x')).toThrow(/at least 32 bytes/);
  });

  it('tokenColumns clears the legacy plaintext column', async () => {
    const { token } = await load(KEY_A);
    const cols = token.tokenColumns('AB3K9Z');
    expect(cols.inviteToken).toBeNull();
    expect(cols.tokenHash).toBe(token.hashToken('AB3K9Z'));
    expect(token.decryptToken(cols.tokenEnc)).toBe('AB3K9Z');
  });

  it('revealToken prefers the encrypted copy and falls back to legacy plaintext', async () => {
    const { token } = await load(KEY_A);
    expect(token.revealToken({ tokenEnc: token.encryptToken('NEW111'), inviteToken: null })).toBe('NEW111');
    expect(token.revealToken({ tokenEnc: null, inviteToken: 'OLD222' })).toBe('OLD222');
    expect(token.revealToken(null)).toBe('');
  });

  it('toAdminVoter exposes the plaintext and strips hash/ciphertext', async () => {
    const { token } = await load(KEY_A);
    const row = { id: 'v1', name: 'Ama', ...token.tokenColumns('AB3K9Z') };
    const out: any = token.toAdminVoter(row);
    expect(out.inviteToken).toBe('AB3K9Z');
    expect(out).not.toHaveProperty('tokenHash');
    expect(out).not.toHaveProperty('tokenEnc');
    expect(out.name).toBe('Ama');
  });

  it('requireToken rejects empty / non-string tokens', async () => {
    const { token } = await load(KEY_A);
    expect(token.requireToken('AB3K9Z')).toBe('AB3K9Z');
    for (const bad of ['', undefined, null, 123]) expect(() => token.requireToken(bad)).toThrow();
  });
});

describe('ballot session cookie', () => {
  it('issues a session that reads back the same voter and election', async () => {
    const { auth } = await load(KEY_A);
    auth.issueBallotSession('voter-1', 'election-1');
    expect(auth.readBallotSession()).toEqual({ voterId: 'voter-1', electionId: 'election-1' });
  });

  it('returns null with no cookie', async () => {
    const { auth } = await load(KEY_A);
    expect(auth.readBallotSession()).toBeNull();
  });

  it('rejects a cookie whose payload was edited to another voter', async () => {
    const { auth } = await load(KEY_A);
    auth.issueBallotSession('voter-1', 'election-1');
    const [, sig] = jar.get('hv_ballot')!.split('.');
    const forged = Buffer.from(JSON.stringify({ v: 'voter-2', e: 'election-1', x: Date.now() + 60_000 })).toString('base64url');
    jar.set('hv_ballot', `${forged}.${sig}`);
    expect(auth.readBallotSession()).toBeNull();
  });

  it('rejects a cookie signed with a different key', async () => {
    const a = (await load(KEY_A)).auth;
    a.issueBallotSession('voter-1', 'election-1');
    const cookie = jar.get('hv_ballot')!;
    const b = (await load(KEY_B)).auth;
    jar.set('hv_ballot', cookie);
    expect(b.readBallotSession()).toBeNull();
  });

  it('expires after 60 minutes', async () => {
    const { auth } = await load(KEY_A);
    vi.useFakeTimers();
    try {
      auth.issueBallotSession('voter-1', 'election-1');
      vi.advanceTimersByTime(59 * 60 * 1000);
      expect(auth.readBallotSession()).not.toBeNull();
      vi.advanceTimersByTime(2 * 60 * 1000);
      expect(auth.readBallotSession()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('clearBallotSession removes it', async () => {
    const { auth } = await load(KEY_A);
    auth.issueBallotSession('voter-1', 'election-1');
    auth.clearBallotSession();
    expect(auth.readBallotSession()).toBeNull();
  });

  it('login payload no longer carries the voter token', async () => {
    const { auth } = await load(KEY_A);
    const p: any = auth.toVoterLoginPayload({
      voters: { id: 'v', username: 'u', name: 'n', electionId: 'e', hasVoted: false, inviteToken: 'SECRET', tokenEnc: 'SECRET' },
      elections: { id: 'e', title: 't' },
    });
    expect(JSON.stringify(p)).not.toContain('SECRET');
  });
});
