import PositionAdminForm from "#/components/election/PositionAdminForm";
import { getElectionsFn } from "#/server/tenant-elections";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";


export const Route = createFileRoute("/admin/elections/$electionId/positions/new")({
  component: CreatePosition,
  loader: async ({params}) => {
    const electionId = params.electionId;
    const elections = await getElectionsFn();
    return { elections }
  },
  pendingComponent: () => (
    <div className="flex justify-center p-12">
      <Loader2 className="animate-spin text-purple-500" />
    </div>
  ),
});

function CreatePosition() {
  const { electionId } = Route.useParams(); 
  const { elections  }:any = Route.useLoaderData();
  
  return <PositionAdminForm data={{ elections, electionId }} />;
}
