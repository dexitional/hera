import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { adminAc, userAc } from "better-auth/plugins/admin/access";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "../db"; // Your optimized Drizzle instance
import { sendEmail, verificationEmailHtml } from "../server/email";
import { trustedOrigins } from "./trusted-origins";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  trustedOrigins,
  user: {
    fields: {
      role: "role",
    },
    additionalFields: {
      phone: {
        type: "string",
        required: false,
        input: true,
      },
      organization: {
        type: "string",
        required: false,
        input: true,
      },
      jobTitle: {
        type: "string",
        required: false,
        input: true,
      },
      address: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // better-auth trusts Google's email_verified claim by default and will
      // silently flip our local user.emailVerified to true on every sign-in
      // (not just the first link) -- including accounts a super admin has
      // deliberately marked unverified. Verification must only ever happen
      // through the explicit link-click flow, so never let the provider's
      // claim override our own column.
      mapProfileToUser: () => ({ emailVerified: false }),
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    // Unverified users are allowed to sign in -- verification instead gates
    // specific actions (see createElectionFn/createEventFn) rather than login
    // itself, since role=super accounts must never be blocked by it.
  },

  // Sends a verification link on signup and whenever a caller explicitly
  emailVerification: {
    sendVerificationEmail: async ({ user, url }: any) => {
      // sendEmail now throws on failure -- caught here so a broken mail
      // provider can't turn into a failed signup/verification request.
      try {
        await sendEmail({
          to: user.email,
          subject: "Verify your Heravote account",
          html: verificationEmailHtml({ name: user.name, url }),
        });
      } catch (err) {
        console.error('[AUTH] failed to send verification email:', err);
      }
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
  advanced: {
    cookieOptions: {
      sameSite: "none",
      secure: true,
    },
    crossSubDomainCookies: {
      enabled: true,
      ... process.env.NODE_ENV == 'production' && ({ domain: ".heravote.com" }),
    },
  },
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["super"],
      roles: {
        super: adminAc,
        user: userAc,
      },
    }),
    tanstackStartCookies()
  ]
} as any);
