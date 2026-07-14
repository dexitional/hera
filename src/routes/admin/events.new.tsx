import EventAdminForm from "#/components/event/EventAdminForm";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/events/new")({
  component: CreateEvent,
  pendingComponent: () => (
    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-purple-500" /></div>
  ),
});

function CreateEvent() {
  return <EventAdminForm data={null} />;
}
