import { createFileRoute, Outlet } from '@tanstack/react-router'
import DashboardHeader from '#/components/DashboardHeader';
export const Route = createFileRoute('/admin')({
  component: DashboardLayout,
})


function DashboardLayout() {
   
  const INITIAL_ORGANIZATIONS = [
    {
        id: 'knvmlleenlmznzfsltwy',
        name: 'Capevars.com',
        plan: 'Free Plan',
        projectsCount: 2,
        href: '/dashboard/org/knvmlleenlmznzfsltwy'
    }
  ];

  return (
    <div className="min-h-screen bg-[#18181b] text-white font-sans antialiased">
      <DashboardHeader />
      <div className="w-full min-h-screen bg-[#0a192a]/30 text-zinc-200 font-sans p-6">
        <Outlet />
      </div>
    </div>
  );
}
