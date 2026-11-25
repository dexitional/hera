import { createStart } from '@tanstack/react-start'
import { friendlyErrorsMiddleware } from './middleware/errorMiddleware'

// App-wide TanStack Start configuration.
export const startInstance = createStart(() => ({
  functionMiddleware: [friendlyErrorsMiddleware],
}))
