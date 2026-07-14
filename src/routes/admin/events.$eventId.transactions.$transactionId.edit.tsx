import EventTransactionAdminForm from "#/components/event/EventTransactionAdminForm";
import { getContestantsFn, getEventTransactionFn } from "#/server/tenant-events";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/events/$eventId/transactions/$transactionId/edit")({
  component: EditTransaction,
  loader: async ({ params }: any) => {
    const eventId = params.eventId;
    const transactionId = params.transactionId;
    const [data, result]: any = await Promise.all([
      getEventTransactionFn({ data: transactionId }),
      getContestantsFn({ data: { eventId, page: 1, pageSize: 500, searchQuery: "" } } as any),
    ]);
    const contestants = (result?.contestants ?? []).map((r: any) => ({ id: r.contestants.id, name: r.contestants.name, categoryName: r.categories.name }));
    return { data, contestants };
  },
  pendingComponent: () => (
    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-purple-500" /></div>
  ),
});

function EditTransaction() {
  const { eventId } = Route.useParams();
  const { data, contestants }: any = Route.useLoaderData();
  return <EventTransactionAdminForm data={{ data: data[0], contestants, eventId }} />;
}
