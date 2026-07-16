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
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },

  // Sends a verification link on signup and whenever a caller explicitly
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
    },
    crossSubDomainCookies: {
      enabled: true,
      // domain: ".heravote.com",
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
