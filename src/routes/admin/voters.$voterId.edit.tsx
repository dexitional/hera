import { createFileRoute } from "@tanstack/react-router";
import { getElectionsFn, getVoterFn } from "#/server/tenant-elections";
import { Loader2 } from "lucide-react";
import VoterAdminForm from "#/components/election/VoterAdminForm";

export const Route = createFileRoute("/admin/voters/$voterId/edit")({
  component: EditPosition,
  loader: async ({ params }:any) => {
    const voterId = params.voterId;
    const elections = await getElectionsFn();
    const data = await getVoterFn({ data: voterId });
    return { data, elections }
  },
  pendingComponent: () => (
    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-purple-500" /></div>
  ),
});

function EditPosition() {

  const { data, elections  }:any = Route.useLoaderData();
  return <VoterAdminForm data={{ data: data[0], elections }} />;
}
