import ContestantAdminForm from "#/components/event/ContestantAdminForm";
import { getCategoriesFn, getContestantFn } from "#/server/tenant-events";
import { createFileRoute } from "@tanstack/react-router";
import { FormSkeleton } from "#/components/ui/skeleton";

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
  pendingComponent: () => <FormSkeleton />,
});

function EditContestant() {
  const { eventId } = Route.useParams();
  const { data, categories }: any = Route.useLoaderData();
  return <ContestantAdminForm data={{ data: data[0], categories, eventId }} />;
}
