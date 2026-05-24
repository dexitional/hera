import AuthPage from '#/components/election/AuthPage'
import { checkAuthSession } from '#/lib/auth-helper';
import { createFileRoute, redirect } from '@tanstack/react-router'
import z from 'zod';

export const Route = createFileRoute('/auth/signin')({
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
  beforeLoad: async ({ search }: any) => {
    const authState = await checkAuthSession();
    if (authState.authenticated) {
      throw redirect({
        // Send them to their targeted page, otherwise fallback to dashboard
        to: search.redirect || "/admin", 
      });
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  return (<AuthPage/>)
}
