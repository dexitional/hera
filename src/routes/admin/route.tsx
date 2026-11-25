import { createFileRoute, Outlet, redirect, useRouterState } from '@tanstack/react-router'
import { AdminShell } from '#/components/admin/shell/AdminShell'
import adminThemeCss from '#/styles/admin-theme.css?url'

export const Route = createFileRoute('/admin')({
    // Reuses the root route's beforeLoad result instead of calling
    // checkAuthSession() again -- that serverFn is gated by Arcjet's
    // site-wide shared rate-limit bucket, and every admin navigation was
    // burning two tokens from it (root + here) for the exact same check.
    beforeLoad: async ({ context }) => {
        if (!context.authenticated) throw redirect({ to: "/auth/signin"  });
        return {
          user: context.user,
        };
    },
    // Admin-only light theme (re-points Tailwind colour variables; see the file).
    head: () => ({ links: [{ rel: 'stylesheet', href: adminThemeCss }] }),
    component: DashboardLayout,
})


function DashboardLayout() {
  const { user } = Route.useRouteContext();
  // Keyed by pathname so every admin page (including navigating between two
  // records on the same route, e.g. different electionId) remounts and
  // replays the entrance transition, instead of only genuinely different
  // route components doing so.
  //
  // Deliberately reads `resolvedLocation`, not `location`: `location` updates
  // the instant a navigation is dispatched (before the target route's loader
  // has resolved), while `resolvedLocation` only updates once that route's
  // data is actually ready and being rendered under Outlet. Keying on
  // `location` remounted this wrapper -- and replayed the animation -- while
  // the outgoing page (or its pendingComponent) was still on screen, which
  // read as the transition flickering / firing on the way out.
  const pathname = useRouterState({ select: (s) => s.resolvedLocation?.pathname ?? s.location.pathname });
  return (
    <AdminShell user={user}>
      <div key={pathname} className="animate-in fade-in slide-in-from-bottom-1 duration-300">
        <Outlet />
      </div>
    </AdminShell>
  );
}
