import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { NotFoundPage, RouteErrorPage } from './components/ErrorPage'
import { DefaultPending } from './components/RoutePending'

import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import {
  getContext,
} from './integrations/tanstack-query/root-provider'

export function getRouter() {
  const context = getContext()

  const router = createTanStackRouter({
    routeTree,
    context,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    // Friendly screens inside the page layout when a route fails or isn't found.
    defaultErrorComponent: RouteErrorPage,
    defaultNotFoundComponent: NotFoundPage,
    // Switch pages straight away: show the destination's skeleton after
    // 50ms (instead of holding the old page for up to a second while data
    // loads), and keep it at least 200ms once shown so it doesn't flicker.
    defaultPendingMs: 50,
    defaultPendingMinMs: 200,
    defaultPendingComponent: DefaultPending,
  })

  setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
