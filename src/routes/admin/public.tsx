import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/public')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/public"!</div>
}
