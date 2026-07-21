import { createFileRoute } from "@tanstack/react-router";
import { FormSkeleton } from "#/components/ui/skeleton";
import { getElectionsFn } from "#/server/tenant-elections";
import VoterAdminForm from "#/components/election/VoterAdminForm";


export const Route = createFileRoute("/admin/elections/$electionId/voters/new")({
  component: CreateVoter,
  loader: async () => {
    const elections = await getElectionsFn();
    return { elections }
  },
  pendingComponent: () => <FormSkeleton />,
});

function CreateVoter() {
  const { electionId } = Route.useParams(); 
  const { elections  }:any = Route.useLoaderData();
  return <VoterAdminForm data={{ elections, electionId }} />;
}
