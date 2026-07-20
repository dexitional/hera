import arcjet, { cloudflare, detectBot, shield, tokenBucket } from "@arcjet/node";

// In dev, Arcjet falls back to a single shared IP (127.0.0.1) for every
// request since there's no public IP to key on. Every loader on every page
// draws from the SAME 10-req/60s bucket, so ordinary local usage (HMR
// reloads, multiple loaders per navigation) blows through it constantly.
// DRY_RUN still evaluates and logs every rule, it just never blocks.
const mode = import.meta.env.DEV ? "DRY_RUN" : "LIVE";

export const aj = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ["ip.src"], // Track rate limits by IP address
  // Requests arrive as Cloudflare -> nginx (proxy_pass over loopback) -> Node,
  // so there's no socket for Arcjet to read a peer address from -- it falls
  // back to parsing X-Forwarded-For. cloudflare() teaches that fallback to
  // recognize a Cloudflare edge IP in the chain and, only then, pull the real
  // client IP from CF-Connecting-IP -- otherwise ip.src would key every rule
  // (rate limits, bot detection) off nginx's/Cloudflare's IP instead of the
  // visitor's. nginx's own real_ip module (set up separately for CF-only
  // origin lockdown) does the equivalent job for nginx's own $remote_addr.
  proxies: [cloudflare()],
  rules: [
    // Protect against common web attacks (SQL injection, XSS)
    shield({ mode }),
    // Block bad bots, allow legitimate search engines
    detectBot({
        mode,
        block: ["AUTOMATED"],
        allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"]
    } as any),
     // Enforce a rate limit of 60 requests per minute. arcjetMiddleware wraps
    // almost every createServerFn call in the app (loaders and mutations,
    // admin and public), all sharing this one IP-keyed bucket, so it needs
    // enough headroom for a normal admin session (a single page nav can fire
    // several server calls) rather than being tuned for a single public form.
    tokenBucket({
      mode,
      refillRate: 60,
      interval: 60,
      capacity: 60,
    }),
  ],
} as any);

// Stricter bucket layered on top of the base client (shield + bot detection +
// the shared 60/min bucket still apply) for public, unauthenticated,
// PII-returning endpoints -- currently searchVotersFn, which hands back voter
// names + usernames to anyone with an election tag. A real visitor only needs
// a handful of searches while they find their own name; this mainly exists to
// slow down scripted a-z roster scraping.
export const ajVoterLookup = (aj as any).withRule([
  tokenBucket({
    mode,
    refillRate: 10,
    interval: 60,
    capacity: 10,
  }),
]);
