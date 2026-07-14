import { createFileRoute } from '@tanstack/react-router';

// Paystack server-to-server webhook. This is the authoritative "payment succeeded"
// signal -- it must keep working even if the voter's browser closed or lost
// connectivity right after paying, before the client-side callback could fire.
//
// Security boundary: the HMAC-SHA512 signature on the raw body IS the auth here.
// This is a raw file-route handler (like api/auth.$.ts), not a createServerFn, so
// it intentionally does NOT go through arcjetMiddleware -- Paystack's calls must
// never be bot-blocked.
export const Route = createFileRoute('/api/webhooks/paystack')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          // Dynamically imported (not top-level) so this route file -- which is
          // part of the client route tree for navigation purposes -- never pulls
          // Node builtins or the server-only db/schema/sharp/aws-sdk graph into
          // the client bundle. creditCardVote is a plain function (not a
          // createServerFn), so the compiler can't auto-strip it like it does for
          // server functions; a dynamic import keeps it in a server-only chunk.
          const { createHmac, timingSafeEqual } = await import('node:crypto');
          const { creditCardVote } = await import('../../server/paystack-credit');
          const { sendSms } = await import('../../server/sms');

          // Raw body must be read BEFORE any JSON parsing -- the signature is
          // computed over the exact bytes Paystack sent.
          const rawBody = await request.text();

          const signature = request.headers.get('x-paystack-signature');
          if (!signature) {
            return new Response('Missing signature header', { status: 401 });
          }

          const secretKey = process.env.PAYSTACK_SECRET_KEY;
          if (!secretKey) {
            return new Response('Webhook not configured', { status: 401 });
          }

          const expectedHash = createHmac('sha512', secretKey).update(rawBody).digest('hex');

          const expectedBuf = Buffer.from(expectedHash, 'hex');
          const signatureBuf = Buffer.from(signature, 'hex');
          const signatureValid =
            expectedBuf.length === signatureBuf.length &&
            timingSafeEqual(expectedBuf, signatureBuf);

          if (!signatureValid) {
            console.error('Paystack webhook: signature mismatch');
            return new Response('Invalid signature', { status: 401 });
          }

          let event: any;
          try {
            event = JSON.parse(rawBody);
          } catch {
            console.error('Paystack webhook: invalid JSON payload');
            return new Response('Invalid payload', { status: 400 });
          }

          if (event?.event !== 'charge.success') {
            // No-op for any other event type -- acknowledge so Paystack doesn't retry.
            return new Response('Ignored', { status: 200 });
          }

          const data = event.data ?? {};
          const reference = data.reference;
          const amount = data.amount;
          const metadata = data.metadata ?? {};
          const contestantId = metadata.contestantId;
          const votes = metadata.votes;
          const channel = metadata.channel === 'USSD' ? 'USSD' : 'WEB';
          const email = data.customer?.email;

          if (!reference || !contestantId || !votes) {
            console.error(`Paystack webhook: missing required fields on charge.success (reference=${reference})`);
            // Malformed/irrelevant payload from Paystack's side -- nothing we can
            // retry our way out of, so acknowledge to stop retries.
            return new Response('Missing required fields', { status: 200 });
          }

          try {
            const result = await creditCardVote({
              reference,
              contestantId,
              votes: Number(votes),
              payPhone: channel === 'USSD' ? metadata.phone : email,
              amountKobo: amount,
              transRef: data.id ? String(data.id) : null,
              channel,
            });

            if (result.status === 'not_found') {
              console.error(
                `Paystack webhook: nominee not found for charge.success (reference=${reference}, contestantId=${contestantId})`,
              );
            }
            if (result.status === 'amount_mismatch') {
              console.error(
                `Paystack webhook: amount mismatch for charge.success (reference=${reference})`,
              );
            }

            // The web checkout flow shows an on-screen success state already; the
            // "wait for SMS confirmation" step is a promise specific to the USSD
            // flow (VoteUSSD.tsx step 5), so only text back for USSD-channel votes.
            if (result.status === 'credited' && channel === 'USSD' && metadata.phone) {
              try {
                await sendSms(
                  metadata.phone,
                  `Heravote: Your vote of ${result.votes} vote(s) for ${metadata.nomineeName || 'your nominee'} has been confirmed. Thank you for voting!`,
                );
              } catch (smsError: any) {
                // Vote is already credited -- an SMS failure shouldn't turn this
                // into a retry (Paystack would just re-send the same webhook).
                console.error(`Paystack webhook: SMS confirmation failed (reference=${reference}):`, smsError?.message);
              }
            }

            // credited / already_recorded / not_found / amount_mismatch are all
            // "we handled this, don't retry" outcomes from Paystack's perspective.
            return new Response('OK', { status: 200 });
          } catch (creditError) {
            // Genuinely unexpected/transient failure (e.g. DB unreachable) --
            // surface as 5xx so Paystack's retry mechanism kicks in.
            console.error(`Paystack webhook: failed to credit vote (reference=${reference}):`, creditError);
            return new Response('Internal error', { status: 500 });
          }
        } catch (error) {
          console.error('Paystack webhook: unhandled error:', error);
          return new Response('Internal error', { status: 500 });
        }
      },
    },
  },
});
