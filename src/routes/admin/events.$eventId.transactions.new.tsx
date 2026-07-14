import EventTransactionAdminForm from "#/components/event/EventTransactionAdminForm";
import { getContestantsFn } from "#/server/tenant-events";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/events/$eventId/transactions/new")({
  component: CreateTransaction,
  loader: async ({ params }: any) => {
    const eventId = params.eventId;
    const result: any = await getContestantsFn({ data: { eventId, page: 1, pageSize: 500, searchQuery: "" } } as any);
    const contestants = (result?.contestants ?? []).map((r: any) => ({ id: r.contestants.id, name: r.contestants.name, categoryName: r.categories.name }));
    return { contestants };
  },
  pendingComponent: () => (
    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-purple-500" /></div>
  ),
});

function CreateTransaction() {
  const { eventId } = Route.useParams();
  const { contestants }: any = Route.useLoaderData();
  return <EventTransactionAdminForm data={{ data: null, contestants, eventId }} />;
}
