import ElectionAdminForm from "#/components/election/ElectionAdminForm";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";


export const Route = createFileRoute("/admin/elections/new")({
  component: EditElection,
  pendingComponent: () => (
    <div className="flex justify-center p-12">
      <Loader2 className="animate-spin text-purple-500" />
    </div>
  ),
});

function EditElection() {
  return <ElectionAdminForm data={null} />;
}
