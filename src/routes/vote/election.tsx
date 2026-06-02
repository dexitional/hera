import AuthElection from '#/components/election/AuthElection'
import { getElectionByTagFn } from '#/server/tenant-elections'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Navigate, redirect } from '@tanstack/react-router'
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
  // beforeLoad: async () => {
  //   const { isAuthenticated } = authStore.state;
  //   if (isAuthenticated) {
  //     throw redirect({ to: '/vote/cast' })
  //   }
  // },
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const { page } = deps
    return await context.queryClient.ensureQueryData(electionsQueryOptions(page));
    
  //  return { page, token }
  },

})

function RouteComponent() {
  const { page  } = Route.useSearch();
  const { data }:any = useSuspenseQuery(electionsQueryOptions(page));
  
  if(page && data?.length) return (<AuthElection data={data && data[0]} />)
  return <Navigate to={`/elections`}/>
  
}
