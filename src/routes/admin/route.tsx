import { createFileRoute, Outlet, redirect, useLocation } from '@tanstack/react-router'
import DashboardHeader from '#/components/DashboardHeader';
import { checkAuthSession } from '#/lib/auth-helper';
export const Route = createFileRoute('/admin')({
    beforeLoad: async () => {
        const authState = await checkAuthSession();
        if (!authState?.authenticated) throw redirect({ to: "/auth/signin"  });
        return {
          user: authState?.user,
        };
    },
    component: DashboardLayout,
})


function DashboardLayout() {
  const { user } = Route.useRouteContext();
  // Keyed by pathname so every admin page (including navigating between two
  // records on the same route, e.g. different electionId) remounts and
  // replays the entrance transition, instead of only genuinely different
  // route components doing so.
  const { pathname } = useLocation();
  return (
    <div id="dashboard-shell" className="min-h-screen print:bg-white bg-[#18181b] text-white font-sans antialiased print:bg-white">
      { user && (<DashboardHeader user={user} />)}
      <div id="dashboard-content" className="w-full min-h-screen bg-[#0a192a]/30 text-zinc-200 font-sans p-6 print:bg-white print:p-0">
        <div key={pathname} className="animate-in fade-in slide-in-from-bottom-1 duration-300">
          <Outlet />
        </div>
      </div>
    </div>
  );

}
