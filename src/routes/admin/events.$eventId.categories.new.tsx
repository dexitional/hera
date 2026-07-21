import CategoryAdminForm from "#/components/event/CategoryAdminForm";
import { createFileRoute } from "@tanstack/react-router";
import { FormSkeleton } from "#/components/ui/skeleton";

export const Route = createFileRoute("/admin/events/$eventId/categories/new")({
  component: CreateCategory,
  pendingComponent: () => <FormSkeleton />,
});

function CreateCategory() {
  const { eventId } = Route.useParams();
  return <CategoryAdminForm data={{ data: null, eventId }} />;
}
