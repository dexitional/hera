import { createServerFn } from '@tanstack/react-start';
import { authMiddleware } from '#/middleware/authMiddleware';
import { arcjetMiddleware } from '#/middleware/arcjetMiddleware';
import { assertSuperAdmin } from './access-control';
import { normalizePhone } from '#/lib/phone';
import {
  checkSmsBalance, loadSmsSettings, saveSmsSettings, sendSmsMessage, SMS_PROVIDER_LABELS, SMS_PROVIDERS,
  smsProviderConfigured, type SmsProvider,
} from './sms-gateway';

// Super admin: which SMS gateway the platform sends through.

const asProvider = (v: unknown): SmsProvider | null => ((SMS_PROVIDERS as readonly unknown[]).includes(v) ? (v as SmsProvider) : null);

export const getSmsGatewayFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context, data }: any) => {
    assertSuperAdmin(context?.user);
    const settings = await loadSmsSettings();
    // Balances are fetched only when asked (they call out to every gateway).
    const balances = data?.withBalances
      ? await Promise.all(SMS_PROVIDERS.map((p) => checkSmsBalance(p)))
      : null;
    return {
      settings,
      providers: SMS_PROVIDERS.map((p) => ({
        id: p,
        label: SMS_PROVIDER_LABELS[p],
        configured: smsProviderConfigured(p),
        balance: balances?.find((b) => b.provider === p) ?? null,
      })),
    };
  });

export const setSmsGatewayFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const admin = assertSuperAdmin(context?.user);
    const provider = asProvider(data?.provider);
    if (!provider) throw new Error('Choose Arkesel, mNotify or SMSOnlineGH.');
    if (!smsProviderConfigured(provider)) {
      throw new Error(`${SMS_PROVIDER_LABELS[provider]} isn't configured on the server yet. Add its API key to the environment first.`);
    }
    return saveSmsSettings({ provider, failover: Boolean(data?.failover) }, admin.id);
  });

/** Sends one test message through a specific gateway (no fallback), to check it end to end. */
export const sendTestSmsFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    assertSuperAdmin(context?.user);
    const provider = asProvider(data?.provider);
    if (!provider) throw new Error('Choose a gateway to test.');
    const phone = normalizePhone(data?.phone);
    if (!phone) throw new Error('Enter a valid phone number, e.g. 0241234567.');
    const result = await sendSmsMessage(
      phone,
      `Heravote test message via ${SMS_PROVIDER_LABELS[provider]}. If you received this, the gateway works.`,
      { provider, failover: false },
    );
    if (!result.ok) throw new Error(result.error ?? 'The gateway did not accept the message.');
    return { ok: true, provider };
  });
