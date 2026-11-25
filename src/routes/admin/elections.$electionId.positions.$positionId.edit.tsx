import PositionAdminForm from "#/components/election/PositionAdminForm";
import { getElectionsFn, getPositionFn } from "#/server/tenant-elections";
import { createFileRoute } from "@tanstack/react-router";
import { FormSkeleton } from "#/components/ui/skeleton";

export const Route = createFileRoute("/admin/elections/$electionId/positions/$positionId/edit")({
  component: EditPosition,
  loader: async ({ params }:any) => {
    const positionId = params.positionId;
    // includeElectionId: a super admin editing another tenant's election still sees it in the dropdown.
    const elections = await getElectionsFn({ data: { includeElectionId: params.electionId } } as any);
    const data = await getPositionFn({ data: positionId });
    return { data, elections }
  },
  pendingComponent: () => <FormSkeleton />,
});

function EditPosition() {
  const { electionId } = Route.useParams(); 
  const { data, elections  }:any = Route.useLoaderData();
  return <PositionAdminForm data={{ data: data[0], elections, electionId }} />;
}
