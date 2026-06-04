import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { getElectionsFn } from "#/server/tenant-elections";
import VoterAdminForm from "#/components/election/VoterAdminForm";


export const Route = createFileRoute("/admin/elections/$electionId/voters/new")({
  component: CreateVoter,
  loader: async () => {
    const elections = await getElectionsFn();
    return { elections }
  },
  pendingComponent: () => (
    <div className="flex justify-center p-12">
      <Loader2 className="animate-spin text-purple-500" />
    </div>
  ),
});

function CreateVoter() {
  const { electionId } = Route.useParams(); 
  const { elections  }:any = Route.useLoaderData();
  return <VoterAdminForm data={{ elections, electionId }} />;
}
