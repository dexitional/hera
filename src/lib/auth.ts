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
  // Restricts which origins may complete auth flows / send credentialed
  // requests -- shared with the CORS allowlist in src/routes/api/auth.$.ts
  // via ./trusted-origins so both include the www and non-www forms.
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
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  // Sends a verification link on signup and whenever a caller explicitly
  // requests one. Deliberately NOT pairing this with
  // emailAndPassword.requireEmailVerification -- the app immediately routes a
  // brand-new signup to /welcome to collect onboarding details using the
  // session that autoSignIn just created, so sign-in must not be blocked on
  // verification completing first. emailVerified is tracked (and shown/used
  // elsewhere) independently of whether the user can already sign in.
  emailVerification: {
    sendVerificationEmail: async ({ user, url }: any) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your Heravote account",
        html: verificationEmailHtml({ name: user.name, url }),
      });
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
  advanced: {
    cookieOptions: {
      sameSite: "none", 
      secure: true,
    }
  },
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["super"],
      // Reuse the plugin's built-in full-permission "admin" role, just re-keyed as "super"
      // to match this app's role convention (adminRoles above tells the plugin to use it).
      roles: {
        super: adminAc,
        user: userAc,
      },
    }),
    tanstackStartCookies()
  ]
} as any);
