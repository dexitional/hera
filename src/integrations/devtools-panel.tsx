import { TanStackDevtools } from '@tanstack/react-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import TanStackQueryDevtools from './tanstack-query/devtools'

// Loaded only in development via a lazy import in routes/__root.tsx, so none
// of the devtools code ships in the production client bundle (previously it
// was rendered unconditionally on every page, for every visitor).
export default function DevtoolsPanel() {
  return (
    <TanStackDevtools
      config={{
        position: 'bottom-right',
      }}
      plugins={[
        {
          name: 'Tanstack Router',
          render: <TanStackRouterDevtoolsPanel />,
        },
        TanStackQueryDevtools,
      ]}
    />
  )
}
