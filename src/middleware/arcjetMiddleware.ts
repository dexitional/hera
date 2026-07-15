// app/middleware/arcjetMiddleware.ts
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { aj } from "#/lib/arcjet";

export const arcjetMiddleware = createMiddleware().server(async ({ next }) => {
  // 1. Extract the underlying Web API Request object from TanStack Start
  const request: any = getRequest();
  if (!request) {
    return next(); // Fallback if not executed in a server context
  }

  // 2. Run the request through the Arcjet engine
  const decision:any = await (aj as any).protect(request, { requested: 1 });

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

  // 4. Continue to the Server Function handler if clean
  return next();
});
