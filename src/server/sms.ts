import { sendSmsMessage, smsAvailable } from './sms-gateway';

// Shared SMS sender, now routed through the switchable gateway (Arkesel or
// mNotify; see sms-gateway.ts). Kept as the sole plain export in this module
// (not mixed alongside createServerFn exports) -- see paystack-credit.ts for
// why. Always reach this via dynamic import() from route files.
//
// Throws when the message couldn't be sent, so callers can report it.
export async function sendSms(recipient: string, message: string): Promise<void> {
  if (!smsAvailable()) {
    console.error('sendSms: no SMS gateway is configured, skipping send.');
    return;
  }
  const result = await sendSmsMessage(recipient, message);
  if (!result.ok) throw new Error(`SMS not sent (${result.error ?? 'gateway error'})`);
}
