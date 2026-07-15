import arcjet, { detectBot, shield, tokenBucket } from "@arcjet/node";

// In dev, Arcjet falls back to a single shared IP (127.0.0.1) for every
// request since there's no public IP to key on. Every loader on every page
// draws from the SAME 10-req/60s bucket, so ordinary local usage (HMR
// reloads, multiple loaders per navigation) blows through it constantly.
// DRY_RUN still evaluates and logs every rule, it just never blocks.
const mode = import.meta.env.DEV ? "DRY_RUN" : "LIVE";

export const aj = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ["ip.src"], // Track rate limits by IP address
  rules: [
    // Protect against common web attacks (SQL injection, XSS)
    shield({ mode }),
    // Block bad bots, allow legitimate search engines
    detectBot({
        mode,
        block: ["AUTOMATED"],
        allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"]
    } as any),
     // Enforce a rate limit of 10 requests per minute
    tokenBucket({
      mode,
      refillRate: 10,
      interval: 60,
      capacity: 10,
    }),
  ],
} as any);
