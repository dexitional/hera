import PositionAdminForm from "#/components/election/PositionAdminForm";
import { getElectionsFn } from "#/server/tenant-elections";
import { createFileRoute } from "@tanstack/react-router";
import { FormSkeleton } from "#/components/ui/skeleton";


export const Route = createFileRoute("/admin/elections/$electionId/positions/new")({
  component: CreatePosition,
  loader: async ({ params }: any) => {
    // includeElectionId: a super admin editing another tenant's election still sees it in the dropdown.
    const elections = await getElectionsFn({ data: { includeElectionId: params.electionId } } as any);
    return { elections }
  },
  pendingComponent: () => <FormSkeleton />,
});

function CreatePosition() {
  const { electionId } = Route.useParams(); 
  const { elections  }:any = Route.useLoaderData();
  
  return <PositionAdminForm data={{ elections, electionId }} />;
}
