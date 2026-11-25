import * as DialogPrimitive from '@radix-ui/react-dialog'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { CalendarCheck, CornerDownLeft, Plus, Search, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getElectionsFn } from '#/server/tenant-elections'
import { getEventsFn } from '#/server/tenant-events'
import { MAIN_NAV, SECONDARY_NAV, navFor } from './nav'

type Item = {
  id: string
  group: 'Pages' | 'Actions' | 'Elections' | 'Events'
  label: string
  hint?: string
  to: string
  icon: React.ComponentType<{ className?: string }>
  haystack: string
}

const MAX_PER_GROUP = 6

/**
 * ⌘K / Ctrl+K palette: jump to any admin page, start common actions, or open
 * an election/event by title, tag or organisation. Super admins search every
 * organisation; everyone else their own records. Records load on first open.
 */
export function CommandPalette({ open, onOpenChange, isSuper }: { open: boolean; onOpenChange: (o: boolean) => void; isSuper: boolean }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const scope = isSuper ? 'all' : 'mine'

  const elections = useQuery({
    queryKey: ['palette-elections', scope],
    queryFn: () => getElectionsFn({ data: { scope } } as any),
    enabled: open,
    staleTime: 60_000,
  })
  const events = useQuery({
    queryKey: ['palette-events', scope],
    queryFn: () => getEventsFn({ data: { scope } } as any),
    enabled: open,
    staleTime: 60_000,
  })

  const items = useMemo<Item[]>(() => {
    const pages: Item[] = [...navFor(MAIN_NAV, isSuper), ...SECONDARY_NAV].map((n) => ({
      id: `page:${n.to}`, group: 'Pages', label: n.label, to: n.to, icon: n.icon, haystack: `${n.label} ${n.keywords ?? ''}`.toLowerCase(),
    }))
    const actions: Item[] = [
      { id: 'act:new-election', group: 'Actions', label: 'Create election', to: '/admin/elections/new', icon: Plus, haystack: 'create new election add' },
      { id: 'act:new-event', group: 'Actions', label: 'Create voting event', to: '/admin/events/new', icon: Plus, haystack: 'create new event add awards' },
    ]
    const owner = (r: any) => r.ownerOrganization || r.ownerName || ''
    const electionItems: Item[] = ((elections.data as any[]) ?? []).map((e) => ({
      id: `el:${e.id}`, group: 'Elections', label: e.title, hint: [e.tag, isSuper ? owner(e) : ''].filter(Boolean).join(' · '),
      to: `/admin/elections/${e.id}/manage`, icon: CalendarCheck, haystack: `${e.title} ${e.tag} ${owner(e)}`.toLowerCase(),
    }))
    const eventItems: Item[] = ((events.data as any[]) ?? []).map((e) => ({
      id: `ev:${e.id}`, group: 'Events', label: e.title, hint: isSuper ? owner(e) : undefined,
      to: `/admin/events/${e.id}/manage`, icon: Sparkles, haystack: `${e.title} ${owner(e)}`.toLowerCase(),
    }))
    return [...pages, ...actions, ...electionItems, ...eventItems]
  }, [elections.data, events.data, isSuper])

  const results = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
    const matched = terms.length ? items.filter((i) => terms.every((t) => i.haystack.includes(t))) : items.filter((i) => i.group === 'Pages' || i.group === 'Actions')
    const counts: Record<string, number> = {}
    return matched.filter((i) => (counts[i.group] = (counts[i.group] ?? 0) + 1) <= MAX_PER_GROUP)
  }, [items, query])

  useEffect(() => setActive(0), [query, open])
  useEffect(() => {
    if (!open) setQuery('')
  }, [open])
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const go = (item: Item | undefined) => {
    if (!item) return
    onOpenChange(false)
    navigate({ to: item.to as any })
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
    else if (e.key === 'Enter') { e.preventDefault(); go(results[active]) }
  }

  const loading = open && (elections.isLoading || events.isLoading)
  let lastGroup = ''

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-[12vh] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-zinc-800 bg-[#0a192a] shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          onKeyDown={onKeyDown}
        >
          <DialogPrimitive.Title className="sr-only">Search the admin</DialogPrimitive.Title>
          <div className="flex items-center gap-2 border-b border-zinc-800 px-4">
            <Search className="h-4 w-4 shrink-0 text-zinc-500" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages, elections, events..."
              aria-label="Search"
              aria-controls="command-results"
              aria-activedescendant={results[active] ? `cmd-${results[active].id}` : undefined}
              className="h-12 w-full bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
            />
            {loading && <span className="text-[11px] text-zinc-500">Loading...</span>}
          </div>
          <div ref={listRef} id="command-results" role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
            {results.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-zinc-500">No matches for "{query}".</p>
            ) : (
              results.map((item, i) => {
                const header = item.group !== lastGroup ? item.group : null
                lastGroup = item.group
                const Icon = item.icon
                return (
                  <div key={item.id}>
                    {header && <div className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">{header}</div>}
                    <div
                      id={`cmd-${item.id}`}
                      data-index={i}
                      role="option"
                      aria-selected={i === active}
                      onMouseMove={() => setActive(i)}
                      onClick={() => go(item)}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm ${i === active ? 'bg-zinc-800 text-white' : 'text-zinc-300'}`}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-zinc-500" />
                      <span className="truncate">{item.label}</span>
                      {item.hint && <span className="ml-auto truncate pl-3 text-xs text-zinc-500">{item.hint}</span>}
                      {i === active && !item.hint && <CornerDownLeft className="ml-auto h-3.5 w-3.5 text-zinc-500" />}
                    </div>
                  </div>
                )
              })
            )}
          </div>
          <div className="flex items-center gap-4 border-t border-zinc-800 px-4 py-2 text-[11px] text-zinc-500">
            <span><kbd className="font-mono">↑↓</kbd> to move</span>
            <span><kbd className="font-mono">↵</kbd> to open</span>
            <span><kbd className="font-mono">esc</kbd> to close</span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
