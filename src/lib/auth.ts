import { betterAuth } from "better-auth";
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
    tanstackStartCookies() 
  ]
} as any);
