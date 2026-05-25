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
    tanstackStartCookies() // Manages server-side and client-side cookie hydration
  ]
} as any);
