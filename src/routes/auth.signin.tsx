import AuthPage from '#/components/election/AuthPage'
import { createFileRoute, redirect } from '@tanstack/react-router'
import z from 'zod';


export const Route = createFileRoute('/auth/signin')({
  validateSearch: z.object({
    redirect: z.string().optional(),
    error: z.string().optional(),
  }),
  // Reuses root's beforeLoad result instead of calling checkAuthSession()
  // again -- that serverFn is gated by arcjetMiddleware, which throws a
  // plain Error when Arcjet blocks the request; an unhandled throw here
  // crashed the signin page itself (see __root.tsx and admin/route.tsx for
  // the same fix).
  beforeLoad: async ({ search, context }: any) => {
    if (context.authenticated) {
      throw redirect({
        // Send them to their targeted page, otherwise fallback to dashboard
        to: search.redirect || "/admin",
      });
    }
  },
  component: RouteComponent,
})

function RouteComponent() {

  const { error, redirect: redirectTo } = Route.useSearch();
  return (<AuthPage error={error} redirectTo={redirectTo} />)
}
