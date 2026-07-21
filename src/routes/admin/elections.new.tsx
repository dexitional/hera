import ElectionAdminForm from "#/components/election/ElectionAdminForm";
import { createFileRoute } from "@tanstack/react-router";
import { FormSkeleton } from "#/components/ui/skeleton";
import z from "zod";


export const Route = createFileRoute("/admin/elections/new")({
  component: EditElection,
  validateSearch: z.object({
    // Set by a super admin creating an election inside another tenant's
    // workspace (linked from /admin/users/$userId) -- ignored server-side
    // unless the caller actually has the super role.
    forUserId: z.string().optional(),
    forUserName: z.string().optional(),
  }),
  pendingComponent: () => <FormSkeleton />,
});

function EditElection() {
  const { forUserId, forUserName } = Route.useSearch();
  return <ElectionAdminForm data={null} forUserId={forUserId} forUserName={forUserName} />;
}
