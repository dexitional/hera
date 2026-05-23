import { createFileRoute } from "@tanstack/react-router";
import ElectionAdminForm from "#/components/election/ElectionAdminForm";
import { getElectionFn } from "#/server/tenant-elections";
import { Loader2 } from "lucide-react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

const electionsQueryOptions = (electionId: any) => ({
  queryKey: ['election-admin', electionId ],
  queryFn: () => getElectionFn({ data: electionId }),
  staleTime: 0,
  gcTime: 0
});

export const Route = createFileRoute("/admin/elections/$electionId/edit")({
  component: EditElection,
  loader: async ({ context, params }:any) => {
    const electionId = params.electionId;
    const data = await getElectionFn({ data: electionId });
    return { data }
    // await context.queryClient.ensureQueryData(electionsQueryOptions(electionId));
  },
  pendingComponent: () => (
    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-purple-500" /></div>
  ),
  
});

function EditElection() {

  const { electionId } = Route.useParams(); 
  // const { data }:any = useSuspenseQuery(electionsQueryOptions(electionId));
  const { data }:any = Route.useLoaderData();

  console.log("data: ", data);

  return <ElectionAdminForm data={data[0]} />;
}
