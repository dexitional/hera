import { createFileRoute } from '@tanstack/react-router';

// Arkesel validates every response strictly
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

          const contentType = request.headers.get('content-type') ?? '';
          const rawBody = await request.text();
          console.log(`Arkesel USSD webhook: content-type="${contentType}" body=${rawBody}`);

          let fields: Record<string, any> = {};
          if (contentType.includes('application/json')) {
            fields = rawBody ? JSON.parse(rawBody) : {};
          } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
            fields = Object.fromEntries(new URLSearchParams(rawBody));
          } else {
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
