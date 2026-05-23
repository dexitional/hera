import CandidateAdminForm from "#/components/election/CandidateAdminForm";
import { getPositionsListFn } from "#/server/tenant-elections";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";


export const Route = createFileRoute("/admin/candidates/new")({
  component: CreateCandidate,
  loader: async () => {
    let positions = await getPositionsListFn();
    positions = positions?.map((r:any) => ({
        ...r.positions
    }))
    return { positions }
  },
  pendingComponent: () => (
    <div className="flex justify-center p-12">
      <Loader2 className="animate-spin text-purple-500" />
    </div>
  ),
});

function CreateCandidate() {
  const { positions  }:any = Route.useLoaderData();
  return <CandidateAdminForm data={{ positions }} />;
}
