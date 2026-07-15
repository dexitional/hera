import { createFileRoute } from '@tanstack/react-router'

import { auth } from '../../lib/auth';

// Only these origins may make credentialed cross-origin requests to the auth
// endpoint. Reflecting the caller's Origin header unconditionally (the previous
// behavior here) is a CORS misconfiguration -- combined with credentialed
// cookies, it lets ANY website read an authenticated visitor's session simply
// by fetching this URL from their browser. Keep this in sync with the
// `trustedOrigins` list in src/lib/auth.ts.
const TRUSTED_ORIGINS = new Set(
  [process.env.BETTER_AUTH_URL, process.env.VITE_BASE_URL].filter((v): v is string => !!v),
);

function corsHeadersFor(request: Request): HeadersInit {
  const origin = request.headers.get('origin');
  if (!origin || !TRUSTED_ORIGINS.has(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
  };
}

// This endpoint (login, signup, session, password reset) previously had zero
// rate-limiting or bot protection -- wide open to credential-stuffing/brute-force.
// `aj` is dynamically imported (not top-level) to keep this route file's client
// bundle free of @arcjet/node's server-only code, matching the pattern used by
// webhooks.paystack.ts/webhooks.arkesel-ussd.ts.
async function rejectIfArcjetDenied(request: Request): Promise<Response | null> {
  const { aj } = await import('../../lib/arcjet');
  const decision: any = await (aj as any).protect(request, { requested: 1 });
  if (!decision.isDenied()) return null;
  if (decision.reason.isRateLimit()) return new Response('Too Many Requests', { status: 429 });
  if (decision.reason.isBot()) return new Response('Bot Traffic Detected', { status: 403 });
  if (decision.reason.isShield()) return new Response('Request blocked by security shield', { status: 403 });
  return new Response('Access Denied', { status: 403 });
}

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      // 1. Handle preflight OPTIONS requests (no auth action taken, no need to rate-limit)
      OPTIONS: async ({ request }) => {
        return new Response(null, {
          status: 204,
          headers: {
            ...corsHeadersFor(request),
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '600',
          },
        });
      },

      // 2. Upgrade GET requests with an allowlisted CORS header
      GET: async ({ request }) => {
        const denied = await rejectIfArcjetDenied(request);
        if (denied) return denied;

        const response = await auth.handler(request);
        for (const [key, value] of Object.entries(corsHeadersFor(request))) {
          response.headers.set(key, value);
        }
        return response;
      },

      // 3. Upgrade POST requests with an allowlisted CORS header
      POST: async ({ request }: any) => {
        const denied = await rejectIfArcjetDenied(request);
        if (denied) return denied;

        const response = await auth.handler(request);
        for (const [key, value] of Object.entries(corsHeadersFor(request))) {
          response.headers.set(key, value);
        }
        return response;
      },
    },
  },
});
