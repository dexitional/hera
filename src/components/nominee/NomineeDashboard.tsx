import { useEffect, useRef, useState } from 'react'
import {
  Award, CalendarDays, Clock4, EyeOff, Flame, Lightbulb, Medal, PartyPopper, Pencil, Radio, Sparkles, Target, TrendingUp, Trophy, Vote, X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ColumnChart } from '#/components/admin/charts'
import { DeltaBadge } from '#/components/admin/ui'
import { useNomineeDashboard } from './usePortalData'

// Chart colours for the (always dark) portal: the dark-theme values from
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

const RANGES = [
  { key: '7', label: '7D', days: 7 },
  { key: '30', label: '30D', days: 30 },
  { key: 'all', label: 'All', days: Infinity },
] as const
const MILESTONES = [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000]

export const n = (v: number) => Math.round(v).toLocaleString('en-GH')
const shortDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const when = (iso: string) => new Date(iso).toLocaleString('en-GH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? 'am' : 'pm'}`
const ordinal = (k: number) => {
  const s = ['th', 'st', 'nd', 'rd'], v = k % 100
  return `${k}${s[(v - 20) % 10] || s[v] || s[0]}`
}
const pct = (cur: number, prev: number) => (prev === 0 ? (cur === 0 ? 0 : null) : ((cur - prev) / prev) * 100)
const sum = (xs: { votes: number }[]) => xs.reduce((t, x) => t + x.votes, 0)

/** Eases a number to its new value (skipped when the user prefers less motion). */
function useCountUp(target: number, ms = 900) {
  const [value, setValue] = useState(target)
  const from = useRef(target)
  useEffect(() => {
    const start = from.current
    if (start === target || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      from.current = target
      setValue(target)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / ms)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(start + (target - start) * eased)
      if (p < 1) raf = requestAnimationFrame(step)
      else from.current = target
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return value
}

function Stat({ label, value, display, hint, icon: Icon, delta }: {
  label: string; value?: number; display?: string; hint?: React.ReactNode; icon: LucideIcon; delta?: React.ReactNode
}) {
  const animated = useCountUp(value ?? 0)
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
        <span className="font-mono text-3xl font-black tracking-tight text-white tabular-nums">{display ?? n(animated)}</span>
        {delta}
      </div>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  )
}

/** Pop-up when new votes land between polls. */
function NewVotesToast({ total }: { total: number | undefined }) {
  const last = useRef<number | undefined>(undefined)
  const [gain, setGain] = useState<number | null>(null)
  useEffect(() => {
    if (total === undefined) return
    if (last.current !== undefined && total > last.current) {
      setGain(total - last.current)
      const t = setTimeout(() => setGain(null), 6000)
      last.current = total
      return () => clearTimeout(t)
    }
    last.current = total
  }, [total])
  if (gain === null) return null
  return (
    <div role="status" className="fixed inset-x-4 top-20 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-emerald-400/30 bg-[#0f2a22]/95 p-4 shadow-2xl backdrop-blur animate-in fade-in slide-in-from-top-4 duration-300">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15"><PartyPopper className="h-5 w-5 text-emerald-300" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-white">+{n(gain)} new {gain === 1 ? 'vote' : 'votes'}!</p>
        <p className="text-xs text-emerald-200/80">Your supporters are voting right now.</p>
      </div>
      <button type="button" onClick={() => setGain(null)} aria-label="Dismiss" className="rounded-md p-1 text-emerald-200/70 hover:bg-white/10"><X className="h-4 w-4" /></button>
    </div>
  )
}

function Ring({ progress, size = 96, stroke = 9 }: { progress: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const p = Math.max(0, Math.min(1, progress))
  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1f2b3a" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#goal-gradient)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - p)} className="transition-[stroke-dashoffset] duration-700"
      />
      <defs>
        <linearGradient id="goal-gradient" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#c3d34a" />
          <stop offset="100%" stopColor="#3987e5" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/** A personal vote target, kept on this device. */
function GoalCard({ contestantId, total }: { contestantId: string; total: number }) {
  const key = `hv-nominee-goal:${contestantId}`
  const [goal, setGoal] = useState<number | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  useEffect(() => {
    try { const g = Number(localStorage.getItem(key)); if (g > 0) setGoal(g) } catch { /* private mode */ }
  }, [key])
  const suggested = MILESTONES.find((m) => m > total) ?? total * 2
  const target = goal ?? suggested
  const save = () => {
    const g = Math.floor(Number(draft))
    if (g > 0) {
      setGoal(g)
      try { localStorage.setItem(key, String(g)) } catch { /* private mode */ }
    }
    setEditing(false)
  }
  const progress = target ? total / target : 0

  return (
    <section className={`${PANEL} p-5`}>
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white"><Target className="h-4 w-4 text-purple-300" /> Vote goal</h3>
        {!editing && (
          <button type="button" onClick={() => { setDraft(String(target)); setEditing(true) }} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-white/5 hover:text-white">
            <Pencil className="h-3 w-3" /> {goal ? 'Edit' : 'Set goal'}
          </button>
        )}
      </div>
      {editing ? (
        <form onSubmit={(e) => { e.preventDefault(); save() }} className="mt-4 flex gap-2">
          <input
            autoFocus type="number" min={1} inputMode="numeric" value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Vote goal"
            className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 font-mono text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button type="submit" className="rounded-lg bg-purple-600 px-3 text-sm font-semibold text-white hover:bg-purple-500">Save</button>
        </form>
      ) : (
        <div className="mt-4 flex items-center gap-4">
          <div className="relative">
            <Ring progress={progress} />
            <span className="absolute inset-0 flex items-center justify-center font-mono text-lg font-black text-white">{Math.min(999, Math.floor(progress * 100))}%</span>
          </div>
          <div className="min-w-0 text-sm">
            <p className="font-mono text-lg font-bold text-white">{n(total)} <span className="text-sm font-normal text-zinc-500">/ {n(target)}</span></p>
            <p className="text-xs text-zinc-400">
              {total >= target ? 'Goal reached. Set a bigger one!' : `${n(target - total)} to go${goal ? '' : ' to the next milestone'}`}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}

function Milestones({ total }: { total: number }) {
  const reached = MILESTONES.filter((m) => total >= m)
  const next = MILESTONES.find((m) => m > total)
  const shown = [...reached.slice(-3), ...(next ? [next] : [])]
  return (
    <section className={`${PANEL} p-5`}>
      <h3 className="flex items-center gap-2 text-sm font-bold text-white"><Award className="h-4 w-4 text-purple-300" /> Milestones</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {shown.map((m) => {
          const done = total >= m
          return (
            <span key={m} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${done ? 'border-amber-400/30 bg-amber-400/10 text-amber-200' : 'border-dashed border-white/15 text-zinc-400'}`}>
              {done ? <Medal className="h-3.5 w-3.5" /> : <Target className="h-3.5 w-3.5" />} {n(m)} votes
            </span>
          )
        })}
      </div>
      {next && (
        <div className="mt-3">
          <div className="h-1.5 rounded-full bg-[#1f2b3a]">
            <div className="h-1.5 rounded-full bg-gradient-to-r from-amber-300 to-purple-400 transition-all duration-700" style={{ width: `${Math.min(100, (total / next) * 100)}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-zinc-500">{n(next - total)} more to unlock {n(next)}</p>
        </div>
      )}
    </section>
  )
}

/**
 * The nominee's results. `aside` (chat, share shortcuts) goes in the right
 * column on wide screens and below the figures on phones.
 */
export function NomineeDashboard({ contestantId, aside }: { contestantId: string; aside: React.ReactNode }) {
  const [range, setRange] = useState<(typeof RANGES)[number]['key']>('30')
  const { data, isFetching, dataUpdatedAt, isError } = useNomineeDashboard()

  const live = data && data.view !== 'hidden'
  const header = (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-bold text-white">Your results</h2>
      {live && (
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
  let sideExtras: React.ReactNode = null
  if (isError && !data) {
    main = <p className={`${PANEL} p-5 text-sm text-red-300`}>We couldn't load your results just now. They'll appear as soon as the connection is back.</p>
  } else if (!data) {
    main = (
      <div className="space-y-4" aria-label="Loading your results">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className={`${PANEL} h-28 animate-pulse`} />)}</div>
        <div className={`${PANEL} h-72 animate-pulse`} />
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
    const { own, rank, standings } = data
    const series: { date: string; votes: number }[] = own.series
    const visible = series.slice(-Math.min(series.length, RANGES.find((r) => r.key === range)!.days))
    const today = series[series.length - 1]?.votes ?? 0
    const yesterday = series[series.length - 2]?.votes ?? 0
    const last7 = sum(series.slice(-7))
    const prev7 = series.length >= 14 ? sum(series.slice(-14, -7)) : null
    const best = series.reduce((b, p) => (p.votes > b.votes ? p : b), { date: '', votes: 0 })
    const hours: number[] = own.hours ?? []
    const peakHour = hours.reduce((b, v, h) => (v > hours[b] ? h : b), 0)
    const perPayment = own.payments ? own.total / own.payments : 0
    const leader = standings?.[0]
    const me = standings?.find((r: any) => r.isYou)
    const ahead = standings && me && me.rank > 1 ? standings.filter((r: any) => r.votes > me.votes).at(-1) : null

    const insights: { icon: LucideIcon; text: React.ReactNode }[] = []
    if (hours.some((v) => v > 0)) insights.push({ icon: Clock4, text: <>Your supporters vote most around <b className="text-white">{hourLabel(peakHour)}–{hourLabel((peakHour + 1) % 24)}</b> (GMT). Post your reminders just before.</> })
    if (best.votes > 0) insights.push({ icon: Flame, text: <>Your best day was <b className="text-white">{shortDate(best.date)}</b> with <b className="text-white">{n(best.votes)}</b> votes.</> })
    if (prev7 !== null && prev7 > 0) {
      const change = ((last7 - prev7) / prev7) * 100
      insights.push({ icon: TrendingUp, text: change >= 0 ? <>Momentum is up <b className="text-white">{Math.round(change)}%</b> on the week before. Keep it going!</> : <>This week is <b className="text-white">{Math.round(-change)}%</b> below last week. A fresh share could help.</> })
    }
    if (perPayment > 0) insights.push({ icon: Sparkles, text: <>Each supporter buys about <b className="text-white">{perPayment.toFixed(perPayment >= 10 ? 0 : 1)}</b> votes on average.</> })
    if (ahead) insights.push({ icon: Trophy, text: <><b className="text-white">{n(ahead.votes - me.votes + 1)}</b> more votes would move you up to <b className="text-white">{ordinal(ahead.rank)}</b>.</> })
    else if (me && me.rank === 1 && standings.length > 1) insights.push({ icon: Trophy, text: <>You're leading your category by <b className="text-white">{n(me.votes - (standings[1]?.votes ?? 0))}</b> votes.</> })

    main = (
      <div className="space-y-4" style={VIZ_VARS}>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Stat label="Total votes" value={own.total} hint={`from ${n(own.payments)} ${own.payments === 1 ? 'payment' : 'payments'}`} icon={Vote} />
          <Stat label="Today" value={today} icon={Flame} delta={<DeltaBadge delta={{ pct: pct(today, yesterday), label: 'vs yesterday' }} />} hint="vs yesterday" />
          <Stat label="Last 7 days" value={last7} icon={CalendarDays} delta={prev7 !== null ? <DeltaBadge delta={{ pct: pct(last7, prev7), label: 'vs the 7 days before' }} /> : undefined} hint={prev7 !== null ? 'vs the 7 days before' : undefined} />
          <Stat
            label="Your rank"
            icon={Trophy}
            display={own.total > 0 ? ordinal(rank.position) : '—'}
            hint={own.total > 0 ? (rank.position === 1 ? `of ${rank.of} · leading` : `of ${rank.of} in your category`) : 'Shows once you have votes'}
          />
        </div>

        <section className={`${PANEL} space-y-3 p-5`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">Votes per day</h3>
              <p className="text-xs text-zinc-500">{best.votes > 0 ? <>Best day: <span className="font-mono text-zinc-300">{n(best.votes)}</span> on {shortDate(best.date)}</> : 'Hover or tap a day for its total'}</p>
            </div>
            <div role="group" aria-label="Chart range" className="flex rounded-lg border border-white/10 bg-black/20 p-0.5 text-[11px]">
              {RANGES.map((r) => (
                <button key={r.key} type="button" aria-pressed={range === r.key} onClick={() => setRange(r.key)}
                  className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${range === r.key ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'}`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <ColumnChart
            ariaLabel={`Your votes per day, ${shortDate(visible[0].date)} to ${shortDate(visible[visible.length - 1].date)}`}
            formatValue={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v)))}
            formatTooltipValue={(v) => `${n(v)} votes`}
            integer height={210}
            data={visible.map((p) => ({ key: p.date, label: shortDate(p.date), value: p.votes }))}
          />
          <details className="text-xs text-zinc-400">
            <summary className="cursor-pointer select-none hover:text-white">Show as a table</summary>
            <table className="mt-2 w-full">
              <thead><tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500"><th className="py-1">Day</th><th className="py-1 text-right">Votes</th></tr></thead>
              <tbody className="divide-y divide-white/5">
                {[...visible].reverse().map((p) => <tr key={p.date}><td className="py-1">{shortDate(p.date)}</td><td className="py-1 text-right font-mono text-zinc-200">{n(p.votes)}</td></tr>)}
              </tbody>
            </table>
          </details>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className={`${PANEL} space-y-3 p-5`}>
            <div>
              <h3 className="text-sm font-bold text-white">When your supporters vote</h3>
              <p className="text-xs text-zinc-500">All your votes by hour of day (GMT)</p>
            </div>
            <ColumnChart
              ariaLabel="Your votes by hour of day"
              formatValue={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v)))}
              formatTooltipValue={(v) => `${n(v)} votes`}
              integer height={170}
              data={hours.map((v, h) => ({ key: String(h), label: hourLabel(h), value: v }))}
            />
          </section>
          <section className={`${PANEL} p-5`}>
            <h3 className="flex items-center gap-2 text-sm font-bold text-white"><Lightbulb className="h-4 w-4 text-amber-300" /> Insights</h3>
            {insights.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-400">Insights appear once your first votes come in.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {insights.slice(0, 4).map((i, k) => (
                  <li key={k} className="flex gap-3 text-sm leading-relaxed text-zinc-300">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5"><i.icon className="h-3.5 w-3.5 text-purple-300" /></span>
                    <span>{i.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {standings && (
          <section className={`${PANEL} p-5`}>
            <h3 className="flex items-center gap-2 text-sm font-bold text-white"><Medal className="h-4 w-4 text-purple-300" /> Category standings</h3>
            <ol className="mt-3 space-y-2">
              {standings.map((r: any) => (
                <li key={r.id} className={`rounded-xl border p-2.5 ${r.isYou ? 'border-purple-400/40 bg-purple-500/10' : 'border-transparent'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${r.rank === 1 ? 'bg-amber-400/15 text-amber-300' : 'bg-white/5 text-zinc-400'}`}>{r.rank}</span>
                    {r.imageUrl ? <img src={r.imageUrl} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" /> : <span className="h-9 w-9 shrink-0 rounded-lg bg-zinc-700" />}
                    <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">
                      {r.name} {r.isYou && <span className="ml-1 rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-purple-200">You</span>}
                    </span>
                    <span className="shrink-0 font-mono text-sm font-bold text-white">{n(r.votes)}</span>
                  </div>
                  <div className="ml-10 mt-2 h-1.5 rounded-full bg-[#1f2b3a]">
                    <div className="h-1.5 rounded-full bg-[#3987e5]" style={{ width: `${leader?.votes ? (r.votes / leader.votes) * 100 : 0}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    )

    sideExtras = (
      <>
        <GoalCard contestantId={contestantId} total={own.total} />
        <Milestones total={own.total} />
        <section className={`${PANEL} p-5`}>
          <h3 className="flex items-center gap-2 text-sm font-bold text-white"><Radio className="h-4 w-4 text-purple-300" /> Recent votes</h3>
          {own.recent.length === 0 ? (
            <p className="mt-3 flex items-start gap-2 text-sm text-zinc-400"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-purple-300" /> No votes yet. Share your page and code to get started.</p>
          ) : (
            <ul className="mt-3 space-y-1">
              {own.recent.map((r: any, i: number) => (
                <li key={i} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/[0.03]">
                  <span className="flex h-7 min-w-[3rem] items-center justify-center rounded-md bg-purple-500/10 px-1.5 font-mono text-xs font-bold text-purple-200">+{n(r.votes)}</span>
                  <span className="flex-1 text-xs text-zinc-400">{when(r.at)}</span>
                  <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-zinc-400">{r.channel}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <NewVotesToast total={live ? data.own.total : undefined} />
      <div className="space-y-4 lg:col-span-2">
        {header}
        {main}
      </div>
      <aside className="space-y-4">
        {aside}
        {sideExtras}
      </aside>
    </div>
  )
}
