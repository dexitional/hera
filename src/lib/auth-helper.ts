import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "./auth"; // Your backend Better Auth server instance

/**
 * Validates the user's active authentication token on the server.
 * Can be called safely within TanStack Route 'beforeLoad' guards.
 */
export const checkAuthSession = createServerFn({ method: "GET" })
  .handler(async () => {
    // 1. Extract request headers/cookies directly from the VPS server context
    const headers = getRequestHeaders(); 
    // 2. Fetch the session status from Better Auth engine using the headers
    const session = await auth.api.getSession({ headers });
    // 3. Return a clean, standardized state object
    if (!session) {
      return { 
        authenticated: false, 
        user: null 
      };
    }

    return { 
      authenticated: true, 
      user: session.user 
    };
  });
