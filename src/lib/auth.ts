import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { adminAc, userAc } from "better-auth/plugins/admin/access";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "../db"; // Your optimized Drizzle instance

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
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
