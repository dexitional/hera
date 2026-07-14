import ContestantAdminForm from "#/components/event/ContestantAdminForm";
import { getCategoriesFn, getContestantFn } from "#/server/tenant-events";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/events/$eventId/contestants/$contestantId/edit")({
  component: EditContestant,
  loader: async ({ params }: any) => {
    const eventId = params.eventId;
    const contestantId = params.contestantId;
    const [data, result]: any = await Promise.all([
      getContestantFn({ data: contestantId }),
      getCategoriesFn({ data: { eventId, page: 1, pageSize: 500, searchQuery: "" } } as any),
    ]);
    const categories = (result?.categories ?? []).map((r: any) => ({ id: r.category.id, name: r.category.name }));
    return { data, categories };
  },
  pendingComponent: () => (
    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-purple-500" /></div>
  ),
});

function EditContestant() {
  const { eventId } = Route.useParams();
  const { data, categories }: any = Route.useLoaderData();
  return <ContestantAdminForm data={{ data: data[0], categories, eventId }} />;
}
