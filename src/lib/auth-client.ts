import { createAuthClient } from "better-auth/react";
import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "./auth";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_BASE_URL || "http://localhost:3000",
  plugins: [inferAdditionalFields<typeof auth>(), adminClient()],
});

export const { useSession, signOut, signIn, signUp } = authClient;