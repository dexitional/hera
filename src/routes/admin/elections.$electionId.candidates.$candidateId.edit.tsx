import { createFileRoute } from "@tanstack/react-router";
import { getCandidateFn, getPositionsListFn } from "#/server/tenant-elections";
import { FormSkeleton } from "#/components/ui/skeleton";
import CandidateAdminForm from "#/components/election/CandidateAdminForm";

const electionsQueryOptions = (electionId: any) => ({
  queryKey: ['positions-list', electionId ],
  queryFn: () => getPositionsListFn({ data: electionId }),
});

export const Route = createFileRoute("/admin/elections/$electionId/candidates/$candidateId/edit")({
  component: EditCandidate,
  loader: async ({ params, context }:any) => {
    const candidateId = params.candidateId;
    const electionId = params.electionId;
    let positions = await context.queryClient.ensureQueryData(electionsQueryOptions(electionId));
    positions = positions?.map((r:any) => ({
        ...r.positions
    }))
    const data = await getCandidateFn({ data: candidateId });
    return { data, positions }
  },
  pendingComponent: () => <FormSkeleton />,
});

function EditCandidate() {

  let { data, positions  }:any = Route.useLoaderData();
   
  return <CandidateAdminForm data={{ data: data[0], positions }} />;
}
