import CategoryAdminForm from "#/components/event/CategoryAdminForm";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/events/$eventId/categories/new")({
  component: CreateCategory,
});

function CreateCategory() {
  const { eventId } = Route.useParams();
  return <CategoryAdminForm data={{ data: null, eventId }} />;
}
