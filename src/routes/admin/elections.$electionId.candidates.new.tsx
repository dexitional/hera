import CandidateAdminForm from "#/components/election/CandidateAdminForm";
import { getPositionsListFn } from "#/server/tenant-elections";
import { createFileRoute } from "@tanstack/react-router";
import { FormSkeleton } from "#/components/ui/skeleton";


const electionsQueryOptions = (electionId: any) => ({
  queryKey: ['positions-list', electionId ],
  queryFn: () => getPositionsListFn({ data: electionId }),
});

export const Route = createFileRoute("/admin/elections/$electionId/candidates/new")({
  component: CreateCandidate,
  loader: async ({ params, context }) => {
    const electionId = params.electionId;
    let positions = await context.queryClient.ensureQueryData(electionsQueryOptions(electionId));
    positions = positions?.map((r:any) => ({
        ...r.positions
    }))
    return { positions }
  },
  pendingComponent: () => <FormSkeleton />,
});

function CreateCandidate() {
  const { positions  }:any = Route.useLoaderData();
  return <CandidateAdminForm data={{ positions }} />;
}
