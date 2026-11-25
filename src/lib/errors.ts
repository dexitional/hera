// Turning errors into messages people can act on.
//
// Two kinds of error reach users:
//   * messages we wrote for them ("That category code is already in use.")
//     -> shown as they are;
//   * everything else: database/driver failures, programming bugs, missing
//     configuration, network trouble, terse middleware codes -> replaced by a
//     calm explanation. Internal ones never reach the browser (they can
//     contain SQL, parameters or stack details); the server logs them under a
//     short reference the user can quote to support.
//
// Shared by the server (global function middleware, see src/start.ts) and
// the browser, so it must stay dependency-free.

export const SUPPORT_HINT = 'If it keeps happening, contact support at support@heravote.com.'

export const GENERIC_ERROR = `Something went wrong on our side. Please try again in a moment. ${SUPPORT_HINT}`

export const NETWORK_ERROR = "We couldn't reach Heravote. Please check your internet connection and try again."

/** Terse technical messages (ours or a library's) and what to say instead. */
const REPHRASE: [RegExp, string][] = [
  [/^unauthori[sz]ed\.?$/i, 'Please sign in to continue.'],
  [/^too many requests\.?$/i, "You're going a little fast. Please wait a few seconds and try again."],
  [/^bot traffic detected\.?$/i, "We couldn't verify your browser. Please refresh the page and try again."],
  [/^request blocked by security shield\.?$/i, `This request was blocked by our security checks. Please refresh the page and try again. ${SUPPORT_HINT}`],
  [/^access denied\.?$/i, "You don't have access to do that."],
  [/^forbidden\b.*super admin/i, 'Only super admins can do that.'],
  [/^forbidden\.?$/i, "You don't have permission to do that."],
  [/^(failed to fetch|load failed|networkerror.*|network request failed|fetch failed)\.?$/i, NETWORK_ERROR],
  [/\b(timed? ?out|timeout)\b/i, 'This is taking longer than expected. Please check your connection and try again.'],
  [/^request entity too large|payload too large|\b413\b/i, 'That file is too large to upload. Please choose a smaller one.'],
  [/^unexpected (token|end of json)|is not valid json/i, GENERIC_ERROR],
]

/**
 * Errors whose text must never be shown to users: database and driver
 * failures, programming mistakes, and missing server configuration.
 */
export function isInternalError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as { name?: string; message?: string; code?: unknown; cause?: unknown }
  const name = String(e.name ?? '')
  const message = String(e.message ?? '')
  if (/^(TypeError|ReferenceError|RangeError|SyntaxError|EvalError|URIError|DrizzleQueryError|DatabaseError|PostgresError)$/.test(name)) return true
  // node-postgres errors carry a 5-character SQLSTATE; Node system errors an E-code.
  if (typeof e.code === 'string' && (/^[0-9A-Z]{5}$/.test(e.code) || /^E[A-Z]{3,}/.test(e.code))) return true
  if (
    /^failed query:|\b(select|insert into|update|delete from)\b[\s\S]*"[a-z_]+"|violates .* constraint|relation ".*" does not exist|column ".*" does not exist|syntax error at or near|ECONNREFUSED|ECONNRESET|ENOTFOUND|EAI_AGAIN|connection terminated|too many clients/i.test(message)
  ) return true
  if (/is not configured|must be configured|environment variable|VOTER_TOKEN_KEY|token encoding|GMAIL_|IDrive|cannot read propert|is not a function|is not defined|undefined/i.test(message)) return true
  if (e.cause && e.cause !== error) return isInternalError(e.cause)
  return false
}

/** The message to show for an error that is safe to describe (not internal). */
export function friendlyMessage(error: unknown): string {
  const raw = typeof error === 'string' ? error : String((error as any)?.message ?? '')
  const message = raw.trim()
  if (!message) return GENERIC_ERROR
  for (const [pattern, text] of REPHRASE) if (pattern.test(message)) return text
  return message
}

const NETWORK_FAILURE = /^(failed to fetch|load failed|networkerror.*|network request failed|fetch failed)\.?$/i

/** For the browser: whatever was thrown, a message fit to show. */
export function toUserMessage(error: unknown): string {
  // Browsers raise network failures as TypeError("Failed to fetch").
  if (NETWORK_FAILURE.test(String((error as any)?.message ?? '').trim())) return NETWORK_ERROR
  if (isInternalError(error)) return GENERIC_ERROR
  return friendlyMessage(error)
}

/** A short code to quote to support, matching the server log line. */
export function errorReference(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

/** better-auth error codes, in plain language. */
const AUTH_CODES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "That email and password don't match. Please check them and try again.",
  INVALID_PASSWORD: "That password isn't right. Please try again.",
  INVALID_EMAIL: 'Please enter a valid email address.',
  USER_NOT_FOUND: "We couldn't find an account with that email.",
  USER_ALREADY_EXISTS: 'An account with this email already exists. Sign in instead, or reset your password.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'An account with this email already exists. Sign in instead, or use another email.',
  EMAIL_NOT_VERIFIED: 'Please verify your email address first. Check your inbox for the verification link.',
  PASSWORD_TOO_SHORT: 'Your password is too short. Please use at least 8 characters.',
  PASSWORD_TOO_LONG: 'Your password is too long. Please use a shorter one.',
  INVALID_TOKEN: 'This link is invalid or has expired. Please request a new one.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  BANNED_USER: `This account has been disabled. ${SUPPORT_HINT}`,
  FAILED_TO_CREATE_USER: "We couldn't create your account right now. Please try again in a moment.",
  FAILED_TO_CREATE_SESSION: "We couldn't sign you in right now. Please try again in a moment.",
  CREDENTIAL_ACCOUNT_NOT_FOUND: 'This account signs in with Google. Use "Continue with Google" instead.',
  SOCIAL_ACCOUNT_ALREADY_LINKED: 'That Google account is already linked to another Heravote account.',
  PROVIDER_NOT_FOUND: "That sign-in option isn't available.",
}

/**
 * The message for a better-auth client error ({ code, message, status }).
 * Falls back to the general rules for anything it doesn't recognise.
 */
export function authErrorMessage(error: unknown, fallback = GENERIC_ERROR): string {
  const e = (error ?? {}) as { code?: string; message?: string; status?: number }
  if (e.code && AUTH_CODES[e.code]) return AUTH_CODES[e.code]
  if (e.status === 429) return "You're going a little fast. Please wait a few seconds and try again."
  if (!e.message) return fallback
  const text = toUserMessage(e)
  return text === GENERIC_ERROR ? fallback : text
}
