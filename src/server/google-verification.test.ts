import { describe, expect, it, vi } from 'vitest';
import { googleEmailVerified } from './google-verification';

describe('googleEmailVerified', () => {
  it('new Google sign-up with a verified email starts verified', async () => {
    expect(await googleEmailVerified({ email: 'ama@gmail.com', email_verified: true }, async () => undefined)).toBe(true);
  });

  it('existing account not revoked by an admin is (re-)verified', async () => {
    expect(await googleEmailVerified({ email: 'ama@gmail.com', email_verified: true }, async () => false)).toBe(true);
  });

  it("an admin's 'unverified' mark sticks: Google's claim is ignored", async () => {
    expect(await googleEmailVerified({ email: 'ama@gmail.com', email_verified: true }, async () => true)).toBe(false);
  });

  it('looks the flag up by lower-cased email', async () => {
    const lookup = vi.fn(async () => false);
    await googleEmailVerified({ email: 'Ama.Mensah@Gmail.com', email_verified: true }, lookup);
    expect(lookup).toHaveBeenCalledWith('ama.mensah@gmail.com');
  });

  it.each([
    ['Google says unverified', { email: 'ama@gmail.com', email_verified: false }],
    ['claim missing', { email: 'ama@gmail.com' }],
    ['no email', { email_verified: true }],
    ['no profile', null],
  ])('not verified when %s (and no DB lookup)', async (_label, profile) => {
    const lookup = vi.fn(async () => false);
    expect(await googleEmailVerified(profile as any, lookup)).toBe(false);
    expect(lookup).not.toHaveBeenCalled();
  });
});
