// Shared Arkesel SMS sender. Kept as the sole plain export in this module (not mixed
// alongside createServerFn exports) -- see src/server/paystack-credit.ts's comment for
// why: a plain function mixed into a createServerFn-only file broke client-bundle
// stripping for that entire file once. Always reach this via dynamic import() from
// route files.
export async function sendSms(recipient: string, message: string): Promise<void> {
  const apiUrl = process.env.SMS_API_URL;
  const apiKey = process.env.SMS_API_KEY;
  const senderId = process.env.SMS_SENDER_ID;

  if (!apiUrl || !apiKey || !senderId) {
    console.error('sendSms: SMS_API_URL/SMS_API_KEY/SMS_SENDER_ID not configured, skipping send.');
    return;
  }

  const response = await fetch(`${apiUrl}/sms/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: senderId,
      message,
      recipients: [recipient],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SMS API HTTP error ${response.status}: ${errorText}`);
  }
}
