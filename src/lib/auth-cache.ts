// Client-side memo of the root route's sign-in check, so navigating between
// pages doesn't wait on a server round trip every time. Purely a UI hint:
// every server function still checks the session itself (authMiddleware).
//
// Cleared by a full page load (sign-in, admin sign-out and Google sign-in
// all reload) and explicitly by clearAuthCache() for in-page sign-outs.

export type AuthState = { user: any; authenticated: boolean }

const TTL_MS = 60_000
let cached: { at: number; value: AuthState } | null = null

export function getCachedAuth(): AuthState | null {
  if (typeof window === 'undefined' || !cached) return null
  if (Date.now() - cached.at > TTL_MS) {
    cached = null
    return null
  }
  return cached.value
}

export function setCachedAuth(value: AuthState): void {
  if (typeof window !== 'undefined') cached = { at: Date.now(), value }
}

export function clearAuthCache(): void {
  cached = null
}
