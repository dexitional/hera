import ContestantAdminForm from "#/components/event/ContestantAdminForm";
import { getCategoriesFn } from "#/server/tenant-events";
import { createFileRoute } from "@tanstack/react-router";
import { FormSkeleton } from "#/components/ui/skeleton";

export const Route = createFileRoute("/admin/events/$eventId/contestants/new")({
  component: CreateContestant,
  loader: async ({ params }: any) => {
    const eventId = params.eventId;
    const result: any = await getCategoriesFn({ data: { eventId, page: 1, pageSize: 500, searchQuery: "" } } as any);
    const categories = (result?.categories ?? []).map((r: any) => ({ id: r.category.id, name: r.category.name }));
    return { categories };
  },
  pendingComponent: () => <FormSkeleton />,
});

function CreateContestant() {
  const { eventId } = Route.useParams();
  const { categories }: any = Route.useLoaderData();
  return <ContestantAdminForm data={{ data: null, categories, eventId }} />;
}
