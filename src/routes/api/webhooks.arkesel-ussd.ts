import { createFileRoute } from '@tanstack/react-router';

// Arkesel validates every response strictly -- all five fields must be present or
// it rejects with "invalid response" regardless of continueSession/message being
// correct. sessionID/msisdn are just echoed back from the request; Arkesel's
// request body has no separate user-identifier field, so userID mirrors msisdn
// (confirmed sufficient against the live simulator).
function jsonUssdResponse(params: { sessionId: string; phoneNumber: string; continueSession: boolean; message: string }) {
  const { sessionId, phoneNumber, continueSession, message } = params;
  return new Response(
    JSON.stringify({
      sessionID: sessionId,
      userID: phoneNumber,
      msisdn: phoneNumber,
      message,
      continueSession,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}

// Arkesel USSD gateway callback. Request format: POST, application/x-www-form-urlencoded
// body with fields sessionId, serviceCode, phoneNumber, text, type ("initiation" |
// "response"). Response must be JSON: { sessionID, userID, msisdn, message,
// continueSession } -- NOT the plain-text "CON"/"END" convention used by Africa's
// Talking-style gateways (confirmed against the live Arkesel simulator; their own
// written docs describe the plain-text convention but the actual API expects this
// JSON shape, and validates all five fields are present on every response).
// Internal USSD handlers (src/server/ussd/*) still return "CON ..."/"END ..."
// strings for readability -- translated to the real JSON shape right here at the
// route boundary.
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

          // Arkesel's written docs said form-urlencoded; the live gateway actually
          // sends JSON (discovered the hard way -- request.formData() threw on the
          // real Content-Type). Parse defensively and log the raw body so a wrong
          // guess is diagnosable from server logs without another blind round-trip.
          const contentType = request.headers.get('content-type') ?? '';
          const rawBody = await request.text();
          console.log(`Arkesel USSD webhook: content-type="${contentType}" body=${rawBody}`);

          let fields: Record<string, any> = {};
          if (contentType.includes('application/json')) {
            fields = rawBody ? JSON.parse(rawBody) : {};
          } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
            fields = Object.fromEntries(new URLSearchParams(rawBody));
          } else {
            // Unknown/missing Content-Type -- guess JSON first (now the confirmed
            // live format), fall back to query-string style parsing.
            try {
              fields = rawBody ? JSON.parse(rawBody) : {};
            } catch {
              fields = Object.fromEntries(new URLSearchParams(rawBody));
            }
          }

          const sessionId = String(fields.sessionId ?? fields.sessionID ?? fields.session_id ?? '');
          const phoneNumber = String(fields.phoneNumber ?? fields.msisdn ?? fields.MSISDN ?? '');
          const text = String(fields.text ?? fields.userData ?? fields.message ?? '');
          const type = String(fields.type ?? fields.Type ?? '').toLowerCase();
          const isNewSession = type === 'initiation';

          if (!sessionId || !phoneNumber) {
            return jsonUssdResponse({ sessionId, phoneNumber, continueSession: false, message: 'Invalid request.' });
          }

          const responseText = await routeUssdSession({ sessionId, phoneNumber, text, isNewSession });
          const continueSession = responseText.startsWith('CON ');
          const message = responseText.replace(/^(CON |END )/, '');

          return jsonUssdResponse({ sessionId, phoneNumber, continueSession, message });
        } catch (error) {
          console.error('Arkesel USSD webhook: unhandled error:', error);
          // USSD gateways expect a response to close the session cleanly rather
          // than a raw HTTP error -- an unhandled 5xx just leaves the caller's
          // phone screen stuck. sessionId/phoneNumber may be unset if the error
          // happened during token/form parsing itself.
          return jsonUssdResponse({
            sessionId: '',
            phoneNumber: '',
            continueSession: false,
            message: 'A system error occurred. Please try again shortly.',
          });
        }
      },
    },
  },
});
