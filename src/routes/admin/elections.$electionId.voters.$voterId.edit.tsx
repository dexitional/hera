import { createFileRoute } from "@tanstack/react-router";
import { getElectionsFn, getVoterFn } from "#/server/tenant-elections";
import { FormSkeleton } from "#/components/ui/skeleton";
import VoterAdminForm from "#/components/election/VoterAdminForm";

export const Route = createFileRoute("/admin/elections/$electionId/voters/$voterId/edit")({
  component: EditPosition,
  loader: async ({ params }:any) => {
    const voterId = params.voterId;
    const elections = await getElectionsFn();
    const data = await getVoterFn({ data: voterId });
    return { data, elections }
  },
  pendingComponent: () => <FormSkeleton />,
});

function EditPosition() {

  const { electionId } = Route.useParams(); 
  const { data, elections  }:any = Route.useLoaderData();
  return <VoterAdminForm data={{ data: data[0], elections, electionId }} />;
}
