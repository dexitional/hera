import { createFileRoute } from "@tanstack/react-router";
import ElectionAdminForm from "#/components/election/ElectionAdminForm";
import { getElectionFn } from "#/server/tenant-elections";
import { FormSkeleton } from "#/components/ui/skeleton";

export const Route = createFileRoute("/admin/elections/$electionId/edit")({
  component: EditElection,
  loader: async ({ params }:any) => {
    const electionId = params.electionId;
    const data = await getElectionFn({ data: electionId });
    return { data }
    // await context.queryClient.ensureQueryData(electionsQueryOptions(electionId));
  },
  pendingComponent: () => <FormSkeleton />,

});

function EditElection() {

  // const { data }:any = useSuspenseQuery(electionsQueryOptions(electionId));
  const { data }:any = Route.useLoaderData();

  console.log("data: ", data);

  return <ElectionAdminForm data={data[0]} />;
}
