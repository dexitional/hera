import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { CalendarDays, EyeOff, Flame, Medal, Radio, Sparkles, Trophy, Vote } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ColumnChart } from '#/components/admin/charts'
import { DeltaBadge } from '#/components/admin/ui'
import { getNomineeDashboardFn } from '#/server/nominee-portal'

// Chart colours for the (always dark) public site: the dark-theme values from
// admin-theme.css, validated with the dataviz palette checker.
const VIZ_VARS = {
  '--viz-series-1': '#3987e5',
  '--viz-track': '#1f2b3a',
  '--viz-grid': '#1c2633',
  '--viz-axis': '#334155',
  '--viz-surface': '#0f1925',
} as React.CSSProperties

/** Bordered glass panel used across the portal. */
export const PANEL = 'rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]'

const REFRESH_MS = 30_000
const RANGES = [
  { key: '7', label: '7D', days: 7 },
  { key: '30', label: '30D', days: 30 },
  { key: 'all', label: 'All', days: Infinity },
] as const

const n = (v: number) => v.toLocaleString('en-GH')
const shortDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const when = (iso: string) => new Date(iso).toLocaleString('en-GH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const ordinal = (k: number) => {
  const s = ['th', 'st', 'nd', 'rd'], v = k % 100
  return `${k}${s[(v - 20) % 10] || s[v] || s[0]}`
}
const pct = (cur: number, prev: number) => (prev === 0 ? (cur === 0 ? 0 : null) : ((cur - prev) / prev) * 100)
const sum = (xs: { votes: number }[]) => xs.reduce((t, x) => t + x.votes, 0)

function Stat({ label, value, hint, icon: Icon, delta }: { label: string; value: string; hint?: React.ReactNode; icon: LucideIcon; delta?: React.ReactNode }) {
  return (
    <div className={`${PANEL} relative overflow-hidden p-4`}>
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-purple-400/60 via-purple-400/10 to-transparent" />
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
        <span className="flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-white/5">
          <Icon className="h-3.5 w-3.5 text-purple-300" />
        </span>
        {label}
      </p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-mono text-3xl font-black tracking-tight text-white">{value}</span>
        {delta}
      </div>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  )
}

/**
 * The nominee's results. `aside` (the campaign kit) sits in the right column
 * on wide screens and below the figures on phones.
 */
export function NomineeDashboard({ aside }: { aside: React.ReactNode }) {
  const [range, setRange] = useState<(typeof RANGES)[number]['key']>('30')
  const { data, isFetching, dataUpdatedAt, isError } = useQuery({
    queryKey: ['nominee-dashboard'],
    queryFn: () => getNomineeDashboardFn() as Promise<any>,
    refetchInterval: REFRESH_MS,
    refetchOnWindowFocus: true,
  })

  const header = (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-bold text-white">Your results</h2>
      {data && data.view !== 'hidden' && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300" aria-live="polite">
          <span className="relative flex h-1.5 w-1.5">
            <span className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${isFetching ? 'motion-safe:animate-ping' : ''}`} />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          Live · {new Date(dataUpdatedAt).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  )

  let main: React.ReactNode
  if (isError && !data) {
    main = <p className={`${PANEL} p-5 text-sm text-red-400`}>Couldn't load your results. Try again shortly.</p>
  } else if (!data) {
    main = (
      <div className="space-y-4" aria-label="Loading your results">
        <div className="grid grid-cols-2 gap-3">{[0, 1, 2, 3].map((i) => <div key={i} className={`${PANEL} h-28 animate-pulse`} />)}</div>
        <div className={`${PANEL} h-64 animate-pulse`} />
      </div>
    )
  } else if (data.view === 'hidden') {
    main = (
      <div className={`${PANEL} flex items-start gap-3 p-5`}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5"><EyeOff className="h-4 w-4 text-zinc-400" /></span>
        <div>
          <p className="text-sm font-semibold text-white">Vote figures are hidden</p>
          <p className="text-sm text-zinc-400">The organiser has chosen not to show votes to nominees for this event. Keep sharing your page and code.</p>
        </div>
      </div>
    )
  } else {
    const { own, rank } = data
    const series: { date: string; votes: number }[] = own.series
    const visible = series.slice(-Math.min(series.length, RANGES.find((r) => r.key === range)!.days))
    const today = series[series.length - 1]?.votes ?? 0
    const yesterday = series[series.length - 2]?.votes ?? 0
    const last7 = sum(series.slice(-7))
    const prev7 = series.length >= 14 ? sum(series.slice(-14, -7)) : null
    const best = series.reduce((b, p) => (p.votes > b.votes ? p : b), { date: '', votes: 0 })
    const topShare = rank.of > 1 ? Math.max(1, Math.round((rank.position / rank.of) * 100)) : null

    main = (
      <div className="space-y-4" style={VIZ_VARS}>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Stat label="Total votes" value={n(own.total)} hint={`from ${n(own.payments)} ${own.payments === 1 ? 'payment' : 'payments'}`} icon={Vote} />
          <Stat label="Today" value={n(today)} icon={Flame} delta={<DeltaBadge delta={{ pct: pct(today, yesterday), label: 'vs yesterday' }} />} hint="vs yesterday" />
          <Stat
            label="Last 7 days"
            value={n(last7)}
            icon={CalendarDays}
            delta={prev7 !== null ? <DeltaBadge delta={{ pct: pct(last7, prev7), label: 'vs the 7 days before' }} /> : undefined}
            hint={prev7 !== null ? 'vs the 7 days before' : undefined}
          />
          <Stat
            label="Your rank"
            value={own.total > 0 ? ordinal(rank.position) : '—'}
            hint={own.total > 0 ? `of ${rank.of}${topShare && rank.position > 1 ? ` · top ${topShare}%` : ' in your category'}` : 'Shows once you have votes'}
            icon={Trophy}
          />
        </div>

        <section className={`${PANEL} space-y-3 p-5`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">Votes per day</h3>
              <p className="text-xs text-zinc-500">
                {best.votes > 0 ? <>Best day: <span className="font-mono text-zinc-300">{n(best.votes)}</span> on {shortDate(best.date)}</> : 'Hover or tap a day for its total'}
              </p>
            </div>
            <div role="group" aria-label="Chart range" className="flex rounded-lg border border-white/10 bg-black/20 p-0.5 text-[11px]">
              {RANGES.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  aria-pressed={range === r.key}
                  onClick={() => setRange(r.key)}
                  className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${range === r.key ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <ColumnChart
            ariaLabel={`Your votes per day, ${shortDate(visible[0].date)} to ${shortDate(visible[visible.length - 1].date)}`}
            formatValue={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v)))}
            formatTooltipValue={(v) => `${n(v)} votes`}
            integer
            height={200}
            data={visible.map((p) => ({ key: p.date, label: shortDate(p.date), value: p.votes }))}
          />
          <details className="text-xs text-zinc-400">
            <summary className="cursor-pointer select-none hover:text-white">Show as a table</summary>
            <table className="mt-2 w-full">
              <thead><tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500"><th className="py-1">Day</th><th className="py-1 text-right">Votes</th></tr></thead>
              <tbody className="divide-y divide-white/5">
                {[...visible].reverse().map((p) => (
                  <tr key={p.date}><td className="py-1">{shortDate(p.date)}</td><td className="py-1 text-right font-mono text-zinc-200">{n(p.votes)}</td></tr>
                ))}
              </tbody>
            </table>
          </details>
        </section>
      </div>
    )
  }

  const standings = data?.standings as any[] | null | undefined
  const leader = standings?.[0]?.votes ?? 0
  const recent = data && data.view !== 'hidden' ? (data.own.recent as any[]) : null

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {header}
        {main}
        {standings && (
          <section className={`${PANEL} p-5`}>
            <h3 className="flex items-center gap-2 text-sm font-bold text-white"><Medal className="h-4 w-4 text-purple-300" /> Category standings</h3>
            <ol className="mt-3 space-y-2">
              {standings.map((r) => (
                <li key={r.id} className={`rounded-xl border p-2.5 ${r.isYou ? 'border-purple-400/40 bg-purple-500/10' : 'border-transparent'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${r.rank === 1 ? 'bg-amber-400/15 text-amber-300' : 'bg-white/5 text-zinc-400'}`}>{r.rank}</span>
                    {r.imageUrl ? <img src={r.imageUrl} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" /> : <span className="h-9 w-9 shrink-0 rounded-lg bg-zinc-700" />}
                    <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">
                      {r.name} {r.isYou && <span className="ml-1 rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-purple-200">You</span>}
                    </span>
                    <span className="shrink-0 font-mono text-sm font-bold text-white">{n(r.votes)}</span>
                  </div>
                  <div className="ml-10 mt-2 h-1.5 rounded-full" style={{ background: '#1f2b3a' }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${leader ? (r.votes / leader) * 100 : 0}%`, background: '#3987e5' }} />
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>

      <aside className="space-y-4">
        {aside}
        {recent && (
          <section className={`${PANEL} p-5`}>
            <h3 className="flex items-center gap-2 text-sm font-bold text-white"><Radio className="h-4 w-4 text-purple-300" /> Recent votes</h3>
            {recent.length === 0 ? (
              <p className="mt-3 flex items-start gap-2 text-sm text-zinc-400"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-purple-300" /> No votes yet. Share your page and code to get started.</p>
            ) : (
              <ul className="mt-3 space-y-1">
                {recent.map((r, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/[0.03]">
                    <span className="flex h-7 min-w-[3rem] items-center justify-center rounded-md bg-purple-500/10 px-1.5 font-mono text-xs font-bold text-purple-200">+{n(r.votes)}</span>
                    <span className="flex-1 text-xs text-zinc-400">{when(r.at)}</span>
                    <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-zinc-400">{r.channel}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </aside>
    </div>
  )
}
