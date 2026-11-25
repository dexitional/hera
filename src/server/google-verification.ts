/**
 * Whether a Google sign-in should count the account's email as verified.
 *
 * Google's signed `email_verified` claim proves the user owns the address, so
 * it is trusted -- except for accounts a super admin deliberately marked
 * unverified (email_verification_revoked). For those the claim is ignored so
 * the admin's decision sticks until the user clicks an emailed verification
 * link. Used by the Google provider's mapProfileToUser in src/lib/auth.ts.
 *
 * @param isRevoked looks up the revoked flag for a lower-cased email
 *                  (false/undefined for a brand-new account)
 */
export async function googleEmailVerified(
  profile: { email?: string | null; email_verified?: boolean | null } | null | undefined,
  isRevoked: (emailLowerCase: string) => Promise<boolean | undefined>,
): Promise<boolean> {
  if (profile?.email_verified !== true || !profile.email) return false;
  return !(await isRevoked(profile.email.toLowerCase()));
}
