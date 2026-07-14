import { createFileRoute } from "@tanstack/react-router";
import EventAdminForm from "#/components/event/EventAdminForm";
import { getEventFn } from "#/server/tenant-events";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/events/$eventId/edit")({
  component: EditEvent,
  loader: async ({ params }: any) => {
    const eventId = params.eventId;
    const data = await getEventFn({ data: eventId });
    return { data };
  },
  pendingComponent: () => (
    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-purple-500" /></div>
  ),
});

function EditEvent() {
  const { data }: any = Route.useLoaderData();
  return <EventAdminForm data={data[0]} />;
}
