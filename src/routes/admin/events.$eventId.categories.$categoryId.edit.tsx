import CategoryAdminForm from "#/components/event/CategoryAdminForm";
import { getCategoryFn } from "#/server/tenant-events";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/events/$eventId/categories/$categoryId/edit")({
  component: EditCategory,
  loader: async ({ params }: any) => {
    const categoryId = params.categoryId;
    const data = await getCategoryFn({ data: categoryId });
    return { data };
  },
  pendingComponent: () => (
    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-purple-500" /></div>
  ),
});

function EditCategory() {
  const { eventId } = Route.useParams();
  const { data }: any = Route.useLoaderData();
  return <CategoryAdminForm data={{ data: data[0], eventId }} />;
}
