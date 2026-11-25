import { Building2, User } from 'lucide-react'

export type ListScope = 'mine' | 'all'

/**
 * Super-admin switch between "my records" and "every organisation's records"
 * on the admin list pages. Only render it for super admins -- the server
 * ignores scope 'all' for everyone else anyway.
 */
export default function ScopeToggle({ value, onChange }: { value: ListScope; onChange: (scope: ListScope) => void }) {
  const option = (scope: ListScope, label: string, Icon: typeof User) => (
    <button
      type="button"
      onClick={() => onChange(scope)}
      aria-pressed={value === scope}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
        value === scope ? 'bg-purple-600 text-white shadow' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  )

  return (
    <div role="group" aria-label="Show records from" className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 p-1">
      {option('mine', 'Mine', User)}
      {option('all', 'All organisations', Building2)}
    </div>
  )
}

/** "by Acme Ltd" line under a record's title when it belongs to someone else. */
export function OwnerLine({ organization, name }: { organization?: string | null; name?: string | null }) {
  const label = organization?.trim() || name?.trim()
  if (!label) return null
  return (
    <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-amber-300/90">
      <Building2 className="w-3 h-3" />
      <span className="truncate">{label}</span>
    </span>
  )
}
