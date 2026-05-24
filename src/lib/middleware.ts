// src/server/middleware.ts
import { createMiddleware } from '@tanstack/react-start'

export const authMiddleware = createMiddleware({
  type: 'function' // Required field
})
.client(async ({ next }) => {
  // Client bundle only sees this light layer
  return next()
})
.server(async ({ next }) => {
  // Vite strips everything inside .server() out of the client build!
  // Secure server-only environment imports go here
  const { auth } = await import('../lib/auth') 
  const request = await import('@tanstack/react-start/server').then(m => m.getRequest())
  
  const session = await auth.api.getSession({ headers: request.headers })
  
  if (!session) {
    throw new Error('Unauthorized')
  }

  return next({
    context: session
  })
})
