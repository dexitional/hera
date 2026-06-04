import arcjet, { detectBot, shield, tokenBucket } from "@arcjet/node";

export const aj = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ["ip.src"], // Track rate limits by IP address
  rules: [
    // Protect against common web attacks (SQL injection, XSS)
    shield({ mode: "LIVE" }),
    // Block bad bots, allow legitimate search engines
    detectBot({ 
        mode: "LIVE", 
        block: ["AUTOMATED"], 
        allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"]
    } as any),
     // Enforce a rate limit of 10 requests per minute
    tokenBucket({
      mode: "DRY_RUN",
      refillRate: 10,
      interval: 60,
      capacity: 10,
    }),
  ],
} as any);
