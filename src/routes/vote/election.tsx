import AuthElection from '#/components/election/AuthElection'
import { getElectionByTagFn } from '#/server/tenant-elections'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Navigate } from '@tanstack/react-router'
import { z } from 'zod'

const searchSchema = z.object({
  page: z.string().optional(),
  token: z.string().optional(),
})

const electionsQueryOptions = (tag: any) => ({
  queryKey: ['election-page',],
  queryFn: () => getElectionByTagFn({ data: tag }),
})



export const Route = createFileRoute('/vote/election')({
  component: RouteComponent,
  validateSearch: searchSchema,
  // validateSearch: (search) => searchSchema.parse(search),
  loaderDeps: ({ search }) => search,
  // beforeLoad: async ({ context, search }) => {
  //   const page = search.page;
  //   const [ res ] = await context.queryClient.ensureQueryData(electionsQueryOptions(page));
  //   console.log()
    
  //   // const { isAuthenticated } = useAuthStore.getState();
  //   // if (isAuthenticated) {
  //   //   throw redirect({ to: '/vote/cast' })
  //   // }
  // },
  loader: async ({ context, deps }) => {
    const { page } = deps
    try {
      await context.queryClient.ensureQueryData(electionsQueryOptions(page));
    } catch {
      // getElectionByTagFn is gated by arcjetMiddleware, which throws a
      // plain Error when Arcjet blocks the request (rate limit/bot/shield).
      // This page is a very common bot/crawler target (shared vote links) --
      // don't let an unhandled throw here crash the whole page for them;
      // the client re-fetches on mount regardless (see index.tsx).
    }
  },

})

function RouteComponent() {
  const { page  } = Route.useSearch();
  const { data }:any = useSuspenseQuery(electionsQueryOptions(page));
  
  if(page && data?.length) return (<AuthElection data={data && data[0]} />)
  return <Navigate to={`/elections`}/>
}
