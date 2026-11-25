import { createMiddleware } from '@tanstack/react-start'
import { isNotFound, isRedirect } from '@tanstack/react-router'
import { errorReference, friendlyMessage, GENERIC_ERROR, isInternalError, toUserMessage } from '#/lib/errors'

// Registered globally in src/start.ts, so it wraps every server function
// (outside any per-function middleware such as Arcjet or auth).
//
//   server: internal failures (database, bugs, configuration) are logged in
//           full under a short reference and replaced by a generic message
//           quoting it, so SQL, parameters and stack details never reach the
//           browser; terse codes ("Unauthorized") are reworded.
//   client: network failures and anything else unexpected become a message
//           fit to show.
// Router control flow (redirect / notFound) passes through untouched.

const passThrough = (e: unknown) => isRedirect(e) || isNotFound(e)

export const friendlyErrorsMiddleware = createMiddleware({ type: 'function' })
  .client(async ({ next }) => {
    try {
      return await next()
    } catch (error) {
      if (passThrough(error)) throw error
      throw new Error(toUserMessage(error))
    }
  })
  .server(async ({ next }) => {
    try {
      return await next()
    } catch (error) {
      if (passThrough(error)) throw error
      if (isInternalError(error)) {
        const ref = errorReference()
        console.error(`[error ${ref}] server function failed:`, error)
        throw new Error(`${GENERIC_ERROR} (Reference: ${ref})`)
      }
      throw new Error(friendlyMessage(error))
    }
  })
