import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Inbox, Search, TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'

// Shared admin building blocks. Written with the admin's dark-theme utility
// classes, which src/styles/admin-theme.css maps for the light theme, so they
// work in both themes without per-theme code.

export function Card({ title, subtitle, actions, children, className = '', padded = true }: {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  padded?: boolean
}) {
  return (
    <section className={`rounded-xl border border-zinc-800 bg-[#0a192a]/50 ${className}`}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 px-5 pt-5">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-bold text-white">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[11px] text-zinc-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  )
}

/** Change vs a previous period. `goodWhen` says which direction is good news. */
export type Delta = { pct: number | null; goodWhen?: 'up' | 'down'; label?: string }

export function StatTile({ label, value, hint, icon: Icon, tone = 'text-zinc-400', delta }: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  icon?: LucideIcon
  tone?: string
  delta?: Delta
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-[#0a192a]/50 p-4">
      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
        {Icon && <Icon className={`h-3.5 w-3.5 ${tone}`} />} {label}
      </p>
      <div className="mt-1.5 flex items-baseline gap-2">
        <h3 className="font-mono text-xl font-black text-white">{value}</h3>
        {delta && <DeltaBadge delta={delta} />}
      </div>
      {hint && <p className="mt-1.5 text-[10px] text-zinc-500">{hint}</p>}
    </div>
  )
}

export function DeltaBadge({ delta }: { delta: Delta }) {
  if (delta.pct === null || !Number.isFinite(delta.pct)) {
    // No previous baseline to compare with.
    return <span className="text-[10px] font-semibold text-zinc-400" title={delta.label}>new</span>
  }
  const up = delta.pct > 0
  const flat = Math.abs(delta.pct) < 0.5
  const good = flat ? null : (delta.goodWhen ?? 'up') === 'up' ? up : !up
  const Icon = up ? TrendingUp : TrendingDown
  const tone = good === null ? 'text-zinc-400' : good ? 'text-emerald-400' : 'text-red-400'
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${tone}`} title={delta.label}>
      {!flat && <Icon className="h-3 w-3" aria-hidden />}
      {flat ? '0%' : `${up ? '+' : ''}${delta.pct.toFixed(Math.abs(delta.pct) >= 10 ? 0 : 1)}%`}
      <span className="sr-only">{good === null ? ' no change' : good ? ' (improvement)' : ' (decline)'}</span>
    </span>
  )
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900">
        <Icon className="h-5 w-5 text-zinc-500" />
      </div>
      <p className="text-sm font-semibold text-white">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-zinc-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// DataTable: client-side search, sort and pagination.
// ---------------------------------------------------------------------------

export type Column<T> = {
  key: string
  header: React.ReactNode
  render: (row: T) => React.ReactNode
  /** Makes the column sortable. */
  sortValue?: (row: T) => string | number | null | undefined
  align?: 'left' | 'right' | 'center'
  className?: string
}

type SortState = { key: string; dir: 'asc' | 'desc' } | null

const alignClass = (a?: Column<any>['align']) => (a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left')

export function sortRows<T>(rows: T[], column: Column<T> | undefined, dir: 'asc' | 'desc'): T[] {
  if (!column?.sortValue) return rows
  const get = column.sortValue
  return [...rows].sort((a, b) => {
    const x = get(a), y = get(b)
    // Missing values always sort last.
    if (x == null && y == null) return 0
    if (x == null) return 1
    if (y == null) return -1
    const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true, sensitivity: 'base' })
    return dir === 'asc' ? c : -c
  })
}

export function DataTable<T>({
  rows, columns, rowKey, searchText, searchPlaceholder = 'Search...', initialSort = null,
  pageSizes = [10, 25, 50], emptyTitle = 'Nothing here yet', emptyDescription, toolbar, minWidth = 720,
}: {
  rows: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string
  /** Enables the search box; returns the text a row is searched by. */
  searchText?: (row: T) => string
  searchPlaceholder?: string
  initialSort?: SortState
  pageSizes?: number[]
  emptyTitle?: string
  emptyDescription?: string
  /** Extra controls shown beside the search box (filters etc.). */
  toolbar?: React.ReactNode
  minWidth?: number
}) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortState>(initialSort)
  const [pageSize, setPageSize] = useState(pageSizes[0])
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
    if (!searchText || terms.length === 0) return rows
    return rows.filter((r) => {
      const text = searchText(r).toLowerCase()
      return terms.every((t) => text.includes(t))
    })
  }, [rows, query, searchText])

  const sorted = useMemo(
    () => (sort ? sortRows(filtered, columns.find((c) => c.key === sort.key), sort.dir) : filtered),
    [filtered, sort, columns],
  )

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const current = Math.min(page, pageCount - 1)
  const visible = sorted.slice(current * pageSize, current * pageSize + pageSize)

  const toggleSort = (key: string) => {
    setPage(0)
    setSort((s) => (s?.key !== key ? { key, dir: 'desc' } : s.dir === 'desc' ? { key, dir: 'asc' } : null))
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-[#0a192a]/40">
      {(searchText || toolbar) && (
        <div className="flex flex-col gap-3 border-b border-zinc-800 p-4 sm:flex-row sm:items-center sm:justify-between">
          {searchText && (
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="search"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(0) }}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="w-full rounded-lg border border-zinc-800 bg-[#0a192a]/50 py-2 pl-9 pr-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}
          {toolbar && <div className="flex flex-wrap items-center gap-3">{toolbar}</div>}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left" style={{ minWidth }}>
          <thead>
            <tr className="border-b border-zinc-800">
              {columns.map((c) => {
                const active = sort?.key === c.key
                const ariaSort = active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : 'none'
                return (
                  <th key={c.key} scope="col" aria-sort={c.sortValue ? ariaSort : undefined} className={`px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 ${alignClass(c.align)} ${c.className ?? ''}`}>
                    {c.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className={`inline-flex items-center gap-1 uppercase tracking-wider hover:text-white ${active ? 'text-white' : ''} ${c.align === 'right' ? 'flex-row-reverse' : ''}`}
                      >
                        {c.header}
                        {active ? (sort!.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                      </button>
                    ) : c.header}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 text-sm">
            {visible.map((row) => (
              <tr key={rowKey(row)} className="transition-colors hover:bg-zinc-900/30">
                {columns.map((c) => (
                  <td key={c.key} className={`px-5 py-3 ${alignClass(c.align)} ${c.className ?? ''}`}>{c.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && (
          <EmptyState
            title={query ? 'No matches' : emptyTitle}
            description={query ? `Nothing matches "${query}".` : emptyDescription}
          />
        )}
      </div>

      {sorted.length > pageSizes[0] && (
        <div className="flex flex-col gap-3 border-t border-zinc-800 px-5 py-3 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {current * pageSize + 1}–{Math.min(sorted.length, (current + 1) * pageSize)} of {sorted.length.toLocaleString()}
          </span>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5">
              Rows
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0) }}
                className="rounded-md border border-zinc-800 bg-zinc-900 px-1.5 py-1 text-xs text-white"
              >
                {pageSizes.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setPage(current - 1)} disabled={current === 0} aria-label="Previous page" className="rounded-md border border-zinc-800 p-1 hover:bg-zinc-800 disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-1 text-zinc-400">{current + 1} / {pageCount}</span>
              <button type="button" onClick={() => setPage(current + 1)} disabled={current >= pageCount - 1} aria-label="Next page" className="rounded-md border border-zinc-800 p-1 hover:bg-zinc-800 disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
