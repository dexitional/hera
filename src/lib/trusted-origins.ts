// Single source of truth for allowed auth origins, consumed by both
// betterAuth's trustedOrigins (src/lib/auth.ts) and the CORS allowlist
// (src/routes/api/auth.$.ts). Derives the www/non-www counterpart of each
// configured URL so the site works under either hostname instead of only
// whichever one happens to be set in BETTER_AUTH_URL/VITE_BASE_URL.
function withWwwVariant(url: string): string[] {
  try {
    const parsed = new URL(url);
    const variantHost = parsed.hostname.startsWith("www.")
      ? parsed.hostname.slice(4)
      : `www.${parsed.hostname}`;
    const variant = new URL(url);
    variant.hostname = variantHost;
    return [parsed.origin, variant.origin];
  } catch {
    return [url];
  }
}

export const trustedOrigins = Array.from(
  new Set(
    [process.env.BETTER_AUTH_URL, process.env.VITE_BASE_URL]
      .filter((v): v is string => !!v)
      .flatMap(withWwwVariant),
  ),
);
