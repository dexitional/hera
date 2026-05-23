import LiveBallotSimulation from '#/components/election/LiveBallotSimulation';
import { authStore } from '#/lib/voterStore';
import { getElectionDataFn } from '#/server/tenant-elections';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useSelector } from '@tanstack/react-store';

const electionsQueryOptions = (electionId: any) => ({
  queryKey: ['election-page',],
  queryFn: () => getElectionDataFn({ data: electionId }),
})

export const Route = createFileRoute('/vote/cast')({
  component: RouteComponent,
  beforeLoad: async ({ location }) => {
    const { isAuthenticated } = authStore.state
    if (!isAuthenticated) {
      throw redirect({
        to: '/elections',
        search: { redirect: location.pathname }, // Safe on both server and client!
      })
    }
  },
  loader: async ({ context }) => {
    const { user } = authStore.state
    return await context.queryClient.ensureQueryData(electionsQueryOptions(user?.electionId));
  },
})


function RouteComponent() {
  const user = useSelector(authStore, (s:any) => s.user)
  const { data }:any = useSuspenseQuery(electionsQueryOptions(user?.electionId));

  return (<LiveBallotSimulation user={user} data={data} />)
  
}
