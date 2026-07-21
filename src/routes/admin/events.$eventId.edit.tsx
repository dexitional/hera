import { createFileRoute } from "@tanstack/react-router";
import EventAdminForm from "#/components/event/EventAdminForm";
import { getEventFn } from "#/server/tenant-events";
import { FormSkeleton } from "#/components/ui/skeleton";

export const Route = createFileRoute("/admin/events/$eventId/edit")({
  component: EditEvent,
  loader: async ({ params }: any) => {
    const eventId = params.eventId;
    const data = await getEventFn({ data: eventId });
    return { data };
  },
  pendingComponent: () => <FormSkeleton />,
});

function EditEvent() {
  const { data }: any = Route.useLoaderData();
  return <EventAdminForm data={data[0]} />;
}
