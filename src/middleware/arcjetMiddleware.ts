// app/middleware/arcjetMiddleware.ts
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { aj, ajVoterLookup } from "#/lib/arcjet";

async function protectWith(client: any) {
  // 1. Extract the underlying Web API Request object from TanStack Start
  const request: any = getRequest();
  if (!request) {
    return null; // Fallback if not executed in a server context
  }

  // 2. Run the request through the Arcjet engine
  const decision: any = await client.protect(request, { requested: 1 });

  // 3. If Arcjet signals a block, intercept the request and throw.
  // Thrown as plain Errors, not Response objects -- a thrown Response doesn't
  // survive TanStack Start's seroval-based SSR serialization when it
  // propagates through a route loader's ensureQueryData(), crashing the whole
  // render instead of surfacing a clean error (see authMiddleware.ts, which
  // already uses this same plain-Error pattern successfully).
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      throw new Error("Too Many Requests");
    }
    if (decision.reason.isBot()) {
      throw new Error("Bot Traffic Detected");
    }
    if (decision.reason.isShield()) {
      throw new Error("Request blocked by security shield");
    }
    throw new Error("Access Denied");
  }

  return null;
}

export const arcjetMiddleware = createMiddleware().server(async ({ next }) => {
  await protectWith(aj);
  return next();
});

// Same shield/bot checks as arcjetMiddleware, plus a much tighter dedicated
// rate limit -- see ajVoterLookup's comment in lib/arcjet.ts. Use this in
// place of (not alongside) arcjetMiddleware on the handler it protects.
export const arcjetVoterLookupMiddleware = createMiddleware().server(async ({ next }) => {
  await protectWith(ajVoterLookup);
  return next();
});
