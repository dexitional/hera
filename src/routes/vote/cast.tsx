import LiveBallotSimulation from '#/components/election/LiveBallotSimulation';
import { useAuthStore } from '#/lib/voterStore';
import { getElectionDataFn } from '#/server/tenant-elections';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router'

// Utility to restore state from localStorage to in-memory store if needed
function restoreAuthFromStorageIfNeeded() {
  if (typeof window === 'undefined') return;
  try {
    const persisted = window.localStorage.getItem('ts_auth_session');
    if (persisted) {
      const persistedData = JSON.parse(persisted);
      const storeUser = useAuthStore.getState().user;
      if (!storeUser && persistedData?.state?.user) {
        useAuthStore.setState({ user: persistedData.state.user });
      }
    }
  } catch (e) {
    // Ignore errors
  }
}

const electionsQueryOptions = (electionId: any) => ({
  queryKey: ['election-page', electionId],
  queryFn: () => getElectionDataFn({ data: electionId })
});

export const Route = createFileRoute('/vote/cast')({
  component: RouteComponent,
  beforeLoad: async ({ location }) => {
    // Only run on client
    if (typeof window !== 'undefined') {
      // Wait until persistence is hydrated, if necessary
      if (useAuthStore.persist?.hasHydrated && !useAuthStore.persist.hasHydrated()) {
        await new Promise((resolve) => {
          const unsub = useAuthStore.persist.onHydrate(() => {
            unsub();
            setTimeout(resolve, 0);
          });
        });
      }
      // After hydrated, ensure data from localStorage to in-memory store
      restoreAuthFromStorageIfNeeded();
    }
    // Optionally, redirect unauthenticated users:
    const { user } = useAuthStore.getState();
    if (!user) {
      throw redirect({
        to: '/elections',
        search: { redirect: location.pathname }
      });
    }
  },

  loader: async ({ context }) => {
    if (typeof window !== 'undefined') {
      if (useAuthStore.persist?.hasHydrated && !useAuthStore.persist.hasHydrated()) {
        await new Promise((resolve) => {
          const unsub = useAuthStore.persist.onHydrate(() => {
            unsub();
            setTimeout(resolve, 0);
          });
        });
      }
      restoreAuthFromStorageIfNeeded();
    }
    const { user }: any = useAuthStore.getState();
    if (!user?.electionId) throw new Error("No user or electionId found.");
    return await context.queryClient.ensureQueryData(electionsQueryOptions(user.electionId));
  }
});

function RouteComponent() {
  // When store reloads/hydrates, this updates
  const user: any = useAuthStore((state) => state.user);

  // If user is undefined (rare edge case outside loader), prevent rendering
  if (!user?.electionId) {
    return <div className="text-center text-red-500">Please log in to access election voting.</div>;
  }

  const { data }: any = useSuspenseQuery(electionsQueryOptions(user.electionId));
  return <LiveBallotSimulation user={user} data={data} />;
}
