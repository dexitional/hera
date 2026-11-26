import { eq } from 'drizzle-orm';
import { db } from '../db';
import { platformSettings } from '../db/schema';
import { fetchWithRetry } from '#/lib/utils';

// SMS sending through one of three gateways (Arkesel, mNotify, SMSOnlineGH),
// chosen by a super admin at runtime (platform_settings 'sms'), with optional
// automatic fallback to the other configured gateways when a send fails.
//
// Configuration (.env):
//   Arkesel:     SMS_API_URL, SMS_API_KEY, SMS_SENDER_ID
//   mNotify:     MNOTIFY_API_KEY, MNOTIFY_SENDER_ID (defaults to SMS_SENDER_ID),
//                MNOTIFY_API_URL (defaults to https://api.mnotify.com/api)
//   SMSOnlineGH: SMSONLINEGH_API_KEY, SMSONLINEGH_SENDER_ID (defaults to SMS_SENDER_ID),
//                SMSONLINEGH_API_URL (defaults to https://api.smsonlinegh.com/v5)
//   SMS_PROVIDER: the gateway used until a super admin picks one (default arkesel)
// Sender IDs must be registered/approved with each gateway separately.
//
// Kept out of createServerFn modules for the client-bundle stripping reason
// documented in paystack-credit.ts.

export const SMS_PROVIDERS = ['arkesel', 'mnotify', 'smsonlinegh'] as const;
export type SmsProvider = (typeof SMS_PROVIDERS)[number];
export const SMS_PROVIDER_LABELS: Record<SmsProvider, string> = { arkesel: 'Arkesel', mnotify: 'mNotify', smsonlinegh: 'SMSOnlineGH' };

const senderFor = (p: SmsProvider) =>
  p === 'arkesel' ? process.env.SMS_SENDER_ID
    : p === 'mnotify' ? process.env.MNOTIFY_SENDER_ID || process.env.SMS_SENDER_ID
      : process.env.SMSONLINEGH_SENDER_ID || process.env.SMS_SENDER_ID;
const mnotifyBase = () => (process.env.MNOTIFY_API_URL || 'https://api.mnotify.com/api').replace(/\/+$/, '');
const smsonlineBase = () => (process.env.SMSONLINEGH_API_URL || 'https://api.smsonlinegh.com/v5').replace(/\/+$/, '');

export type SmsSettings = { provider: SmsProvider; failover: boolean };

const asProvider = (v: unknown): SmsProvider | null => ((SMS_PROVIDERS as readonly unknown[]).includes(v) ? (v as SmsProvider) : null);

export function smsProviderConfigured(p: SmsProvider): boolean {
  if (p === 'arkesel') return Boolean(process.env.SMS_API_URL && process.env.SMS_API_KEY && senderFor(p));
  if (p === 'mnotify') return Boolean(process.env.MNOTIFY_API_KEY && senderFor(p));
  return Boolean(process.env.SMSONLINEGH_API_KEY && senderFor(p));
}

/** True when at least one gateway can send. */
export const smsAvailable = () => SMS_PROVIDERS.some(smsProviderConfigured);

// ---------------------------------------------------------------------------
// Settings (cached briefly per process; a change reaches every PM2 process
// within CACHE_MS)
// ---------------------------------------------------------------------------

const CACHE_MS = 30_000;
let cached: { at: number; value: SmsSettings } | null = null;

const defaultSettings = (): SmsSettings => ({ provider: asProvider(process.env.SMS_PROVIDER) ?? 'arkesel', failover: false });

export async function loadSmsSettings(): Promise<SmsSettings> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.value;
  let value = defaultSettings();
  try {
    const [row] = await db.select({ value: platformSettings.value }).from(platformSettings).where(eq(platformSettings.key, 'sms'));
    const v = row?.value as Partial<SmsSettings> | undefined;
    if (v) value = { provider: asProvider(v.provider) ?? value.provider, failover: Boolean(v.failover) };
  } catch (err: any) {
    console.error('[SMS] could not read gateway settings, using defaults:', err?.message);
  }
  cached = { at: Date.now(), value };
  return value;
}

export async function saveSmsSettings(next: SmsSettings, userId: string): Promise<SmsSettings> {
  const value = { provider: next.provider, failover: Boolean(next.failover) };
  await db
    .insert(platformSettings)
    .values({ key: 'sms', value, updatedBy: userId, updatedAt: new Date() })
    .onConflictDoUpdate({ target: platformSettings.key, set: { value, updatedBy: userId, updatedAt: new Date() } });
  cached = { at: Date.now(), value };
  return value;
}

// ---------------------------------------------------------------------------
// Phone formats: Arkesel wants 233XXXXXXXXX, mNotify accepts 0XXXXXXXXX.
// ---------------------------------------------------------------------------

export function toInternational(phone: string): string {
  const d = String(phone ?? '').replace(/\D/g, '');
  if (d.startsWith('00')) return d.slice(2);
  if (d.startsWith('0') && d.length === 10) return `233${d.slice(1)}`;
  if (d.length === 9) return `233${d}`;
  return d;
}

export function toLocalGhana(phone: string): string {
  const intl = toInternational(phone);
  return intl.startsWith('233') && intl.length === 12 ? `0${intl.slice(3)}` : intl;
}

// ---------------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------------

export type SmsResult = { ok: boolean; provider: SmsProvider; error?: string; fellBackFrom?: SmsProvider };

/** Whether a gateway's JSON reply means the message was accepted. */
export function gatewayAccepted(provider: SmsProvider, httpOk: boolean, body: any): boolean {
  if (!httpOk || !body) return false;
  if (provider === 'arkesel') return body.status === 'success' || body.code === '1000' || body.code === 'ok';
  if (provider === 'mnotify') return body.status === 'success' || String(body.code) === '2000';
  // SMSOnlineGH v5: { handshake: { id: 0, label: 'HSHK_OK' }, data: {...} }
  return body.handshake?.id === 0 || body.handshake?.label === 'HSHK_OK';
}

/** A readable error out of a gateway's reply. */
function gatewayError(body: any, status: number): string {
  return body?.message || body?.error || body?.handshake?.label || `HTTP ${status}`;
}

async function sendWith(provider: SmsProvider, recipient: string, message: string): Promise<SmsResult> {
  if (!smsProviderConfigured(provider)) return { ok: false, provider, error: `${SMS_PROVIDER_LABELS[provider]} is not configured` };
  try {
    let res: Response;
    if (provider === 'arkesel') {
      res = await fetchWithRetry(`${process.env.SMS_API_URL}/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': process.env.SMS_API_KEY! },
        body: JSON.stringify({ sender: senderFor(provider), message, recipients: [toInternational(recipient)] }),
      });
    } else if (provider === 'mnotify') {
      res = await fetchWithRetry(`${mnotifyBase()}/sms/quick?key=${encodeURIComponent(process.env.MNOTIFY_API_KEY!)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ recipient: [toLocalGhana(recipient)], sender: senderFor(provider), message, is_schedule: false, schedule_date: '' }),
      });
    } else {
      res = await fetchWithRetry(`${smsonlineBase()}/message/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `key ${process.env.SMSONLINEGH_API_KEY}` },
        body: JSON.stringify({ text: message, type: 0, sender: senderFor(provider), destinations: [toInternational(recipient)] }),
      });
    }
    const body = await res.json().catch(() => null);
    if (gatewayAccepted(provider, res.ok, body)) return { ok: true, provider };
    return { ok: false, provider, error: `${SMS_PROVIDER_LABELS[provider]}: ${gatewayError(body, res.status)}` };
  } catch (err: any) {
    return { ok: false, provider, error: `${SMS_PROVIDER_LABELS[provider]}: ${err?.message ?? 'network error'}` };
  }
}

/**
 * Sends one SMS through the active gateway, falling back to the other one
 * when that's switched on (and configured). Never throws; check `ok`.
 * Note: a gateway that times out after accepting a message and then fails
 * over can deliver it twice; a duplicate beats an OTP that never arrives.
 */
export async function sendSmsMessage(recipient: string, message: string, opts: { provider?: SmsProvider; failover?: boolean } = {}): Promise<SmsResult> {
  const settings = await loadSmsSettings();
  const primary = opts.provider ?? settings.provider;
  const failover = opts.failover ?? settings.failover;
  const first = await sendWith(primary, recipient, message);
  if (first.ok || !failover) {
    if (!first.ok) console.error(`[SMS] send failed: ${first.error}`);
    return first;
  }
  // Fall back through the other configured gateways, in a fixed order.
  const errors = [first.error];
  for (const other of SMS_PROVIDERS.filter((p) => p !== primary && smsProviderConfigured(p))) {
    const next = await sendWith(other, recipient, message);
    if (next.ok) {
      console.warn(`[SMS] ${errors.join('; ')}; delivered through ${SMS_PROVIDER_LABELS[other]} instead.`);
      return { ...next, fellBackFrom: primary };
    }
    errors.push(next.error);
  }
  console.error(`[SMS] every gateway failed: ${errors.join('; ')}`);
  return { ok: false, provider: primary, error: errors.join('; ') };
}

// ---------------------------------------------------------------------------
// Balance (read-only; also confirms the API key works)
// ---------------------------------------------------------------------------

export type SmsBalance = { provider: SmsProvider; ok: boolean; balance?: string; error?: string };

export async function checkSmsBalance(provider: SmsProvider): Promise<SmsBalance> {
  if (!smsProviderConfigured(provider)) return { provider, ok: false, error: 'Not configured' };
  try {
    const timeout = { signal: AbortSignal.timeout(10_000) };
    if (provider === 'arkesel') {
      const res = await fetch(`${process.env.SMS_API_URL}/clients/balance-details`, { ...timeout, headers: { 'api-key': process.env.SMS_API_KEY! } });
      const body: any = await res.json().catch(() => null);
      const bal = body?.data?.sms_balance ?? body?.data?.balance ?? body?.balance;
      return res.ok && bal !== undefined ? { provider, ok: true, balance: String(bal) } : { provider, ok: false, error: gatewayError(body, res.status) };
    }
    if (provider === 'mnotify') {
      const res = await fetch(`${mnotifyBase()}/balance/sms?key=${encodeURIComponent(process.env.MNOTIFY_API_KEY!)}`, timeout);
      const body: any = await res.json().catch(() => null);
      const bal = body?.balance ?? body?.data?.balance;
      return res.ok && body?.status !== 'error' && bal !== undefined ? { provider, ok: true, balance: String(bal) } : { provider, ok: false, error: gatewayError(body, res.status) };
    }
    const res = await fetch(`${smsonlineBase()}/account/balance`, { ...timeout, headers: { Accept: 'application/json', Authorization: `key ${process.env.SMSONLINEGH_API_KEY}` } });
    const body: any = await res.json().catch(() => null);
    const bal = body?.data?.balance ?? body?.data?.amount;
    return res.ok && body?.handshake?.id === 0 ? { provider, ok: true, balance: bal !== undefined ? `${bal}${body?.data?.model ? ` (${body.data.model})` : ''}` : 'OK' } : { provider, ok: false, error: gatewayError(body, res.status) };
  } catch (err: any) {
    return { provider, ok: false, error: err?.message ?? 'network error' };
  }
}
