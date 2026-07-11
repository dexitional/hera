import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
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
  return (
    <div id="dashboard-shell" className="min-h-screen bg-[#18181b] text-white font-sans antialiased print:bg-white">
      { user && (<DashboardHeader user={user} />)}
      <div id="dashboard-content" className="w-full min-h-screen bg-[#0a192a]/30 text-zinc-200 font-sans p-6 print:bg-white print:p-0">
        <Outlet />
      </div>
    </div>
  );
  
}
