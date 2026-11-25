import { createFileRoute } from "@tanstack/react-router";
import { FormSkeleton } from "#/components/ui/skeleton";
import { getElectionsFn } from "#/server/tenant-elections";
import VoterAdminForm from "#/components/election/VoterAdminForm";


export const Route = createFileRoute("/admin/elections/$electionId/voters/new")({
  component: CreateVoter,
  loader: async ({ params }: any) => {
    // includeElectionId: a super admin editing another tenant's election still sees it in the dropdown.
    const elections = await getElectionsFn({ data: { includeElectionId: params.electionId } } as any);
    return { elections }
  },
  pendingComponent: () => <FormSkeleton />,
});

function CreateVoter() {
  const { electionId } = Route.useParams(); 
  const { elections  }:any = Route.useLoaderData();
  return <VoterAdminForm data={{ elections, electionId }} />;
}
