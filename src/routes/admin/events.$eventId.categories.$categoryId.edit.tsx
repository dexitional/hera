import CategoryAdminForm from "#/components/event/CategoryAdminForm";
import { getCategoryFn } from "#/server/tenant-events";
import { createFileRoute } from "@tanstack/react-router";
import { FormSkeleton } from "#/components/ui/skeleton";

export const Route = createFileRoute("/admin/events/$eventId/categories/$categoryId/edit")({
  component: EditCategory,
  loader: async ({ params }: any) => {
    const categoryId = params.categoryId;
    const data = await getCategoryFn({ data: categoryId });
    return { data };
  },
  pendingComponent: () => <FormSkeleton />,
});

function EditCategory() {
  const { eventId } = Route.useParams();
  const { data }: any = Route.useLoaderData();
  return <CategoryAdminForm data={{ data: data[0], eventId }} />;
}
