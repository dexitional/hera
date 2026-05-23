import { createFileRoute } from "@tanstack/react-router";
import { getElectionsFn, getPositionFn } from "#/server/tenant-elections";
import { Loader2 } from "lucide-react";
import PositionAdminForm from "#/components/election/PositionAdminForm";

export const Route = createFileRoute("/admin/positions/$positionId/edit")({
  component: EditPosition,
  loader: async ({ params }:any) => {
    const positionId = params.positionId;
    const elections = await getElectionsFn();
    const data = await getPositionFn({ data: positionId });
    return { data, elections }
  },
  pendingComponent: () => (
    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-purple-500" /></div>
  ),
});

function EditPosition() {

  const { data, elections  }:any = Route.useLoaderData();
  return <PositionAdminForm data={{ data: data[0], elections }} />;
}
