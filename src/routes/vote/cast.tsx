import LiveBallotSimulation from '#/components/election/LiveBallotSimulation';
import { useAuthStore } from '#/lib/voterStore';
import { getElectionDataFn } from '#/server/tenant-elections';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router'

const electionsQueryOptions = (electionId: any) => ({
  queryKey: ['election-page',],
  queryFn: () => getElectionDataFn({ data: electionId }),
})

export const Route = createFileRoute('/vote/cast')({
  component: RouteComponent,
  beforeLoad: async ({ location }) => {
    // On server, skip hydration check to prevent reading undefined 'persist'
    if (typeof window !== 'undefined') {
      const hasAuth = useAuthStore.persist?.hasHydrated
        ? useAuthStore.persist.hasHydrated()
        : true; // fallback: assume hydrated on server
      if (!hasAuth) {
        // Wait until store is hydrated (client only)
        await new Promise((resolve) => {
          useAuthStore.persist.onHydrate(() => {
            setTimeout(resolve, 0);
          });
        });
      }
    }
    const { isAuthenticated, user } = useAuthStore.getState();
    console.log(user)
    // if (!isAuthenticated) {
    //   throw redirect({
    //     to: '/elections',
    //     search: { redirect: location.pathname }, // Safe on both server and client!
    //   })
    // }
  },

  loader: async ({ context }) => {
    // Same pattern: only run hydration logic in browser
    if (typeof window !== 'undefined') {
      const hasAuth = useAuthStore.persist?.hasHydrated
        ? useAuthStore.persist.hasHydrated()
        : true;
      if (!hasAuth) {
        await new Promise((resolve) => {
          useAuthStore.persist.onHydrate(() => {
            setTimeout(resolve, 0);
          });
        });
      }
    }
    const { user }: any = useAuthStore.getState();
    return await context.queryClient.ensureQueryData(electionsQueryOptions(user?.electionId));
  },
})

function RouteComponent() {
  const user: any = useAuthStore((state) => state.user)
  const { data }: any = useSuspenseQuery(electionsQueryOptions(user?.electionId));

  return (<LiveBallotSimulation user={user} data={data} />)

}
