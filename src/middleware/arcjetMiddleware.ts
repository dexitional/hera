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

  // 3. If Arcjet signals a block, intercept the request and throw a 429
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      throw new Response("Too Many Requests", { status: 429 });
    }
    if (decision.reason.isBot()) {
      throw new Response("Bot Traffic Detected", { status: 403 });
    }
    if (decision.reason.isShield()) {
      throw new Response("Request blocked by security shield", { status: 403 });
    }
    throw new Response("Access Denied", { status: 403 });
  }

  // 4. Continue to the Server Function handler if clean
  return next();
});
