import { createFileRoute } from '@tanstack/react-router';

// Arkesel USSD gateway callback. Request format (confirmed against Arkesel's own
// integration docs): POST, application/x-www-form-urlencoded body with fields
// sessionId, serviceCode, phoneNumber, text, type ("initiation" | "response").
// Response must be plain text: "CON <message>" to continue the session and show
// another prompt, or "END <message>" to close it. This is the same convention
// most African USSD aggregators use (e.g. Africa's Talking).
//
// Security boundary: unlike Paystack, Arkesel doesn't sign USSD callbacks, so
// the callback URL configured in Arkesel's dashboard must include
// ?token=<ARKESEL_USSD_WEBHOOK_TOKEN> and we verify it here.
//
// This is a raw file-route handler (like api/auth.$.ts and
// api/webhooks.paystack.ts), not a createServerFn -- the router logic is
// dynamically imported inside the handler, not at module top-level, so this
// route file (which is part of the client route tree for navigation purposes)
// never pulls the server-only db/schema/pg dependency graph into the client
// bundle. See webhooks.paystack.ts's comment for the exact failure mode this
// avoids -- it broke the entire app once.
export const Route = createFileRoute('/api/webhooks/arkesel-ussd')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { timingSafeEqual } = await import('node:crypto');
          const { routeUssdSession } = await import('../../server/ussd/router');

          const expectedToken = process.env.ARKESEL_USSD_WEBHOOK_TOKEN;
          if (!expectedToken) {
            console.error('Arkesel USSD webhook: ARKESEL_USSD_WEBHOOK_TOKEN not configured');
            return new Response('Webhook not configured', { status: 401 });
          }

          const providedToken = new URL(request.url).searchParams.get('token') ?? '';
          const expectedBuf = Buffer.from(expectedToken);
          const providedBuf = Buffer.from(providedToken);
          const tokenValid =
            expectedBuf.length === providedBuf.length && timingSafeEqual(expectedBuf, providedBuf);

          if (!tokenValid) {
            console.error('Arkesel USSD webhook: invalid or missing token');
            return new Response('Unauthorized', { status: 401 });
          }

          const form = await request.formData();
          const sessionId = String(form.get('sessionId') ?? '');
          const phoneNumber = String(form.get('phoneNumber') ?? '');
          const text = String(form.get('text') ?? '');

          if (!sessionId || !phoneNumber) {
            return new Response('END Invalid request.', {
              status: 200,
              headers: { 'Content-Type': 'text/plain' },
            });
          }

          const responseText = await routeUssdSession({ sessionId, phoneNumber, text });

          return new Response(responseText, {
            status: 200,
            headers: { 'Content-Type': 'text/plain' },
          });
        } catch (error) {
          console.error('Arkesel USSD webhook: unhandled error:', error);
          // USSD gateways expect a response to close the session cleanly rather
          // than a raw HTTP error -- an unhandled 5xx just leaves the caller's
          // phone screen stuck.
          return new Response('END A system error occurred. Please try again shortly.', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' },
          });
        }
      },
    },
  },
});
