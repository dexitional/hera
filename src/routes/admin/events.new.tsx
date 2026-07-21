import EventAdminForm from "#/components/event/EventAdminForm";
import { createFileRoute } from "@tanstack/react-router";
import { FormSkeleton } from "#/components/ui/skeleton";
import z from "zod";

export const Route = createFileRoute("/admin/events/new")({
  component: CreateEvent,
  validateSearch: z.object({
    // Set by a super admin creating an event inside another tenant's
    // workspace (linked from /admin/users/$userId) -- ignored server-side
    // unless the caller actually has the super role.
    forUserId: z.string().optional(),
    forUserName: z.string().optional(),
  }),
  pendingComponent: () => <FormSkeleton />,
});

function CreateEvent() {
  const { forUserId, forUserName } = Route.useSearch();
  return <EventAdminForm data={null} forUserId={forUserId} forUserName={forUserName} />;
}
