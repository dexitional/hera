import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "./auth"; // Your backend Better Auth server instance

export const checkAuthSession = createServerFn({ method: "GET" })
  .handler(async () => {
    const headers = getRequestHeaders(); 
    const session = await auth.api.getSession({ headers });
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
