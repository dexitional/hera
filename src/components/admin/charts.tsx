import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

// Dashboard chart primitives (plain SVG/HTML, no chart library).
//
// Colours come from CSS variables on a .viz-root ancestor, defined per theme
// in src/styles/admin-theme.css and validated with the dataviz palette
// validator against each surface (dark #0f1925, light #ffffff):
//   --viz-series-1 (theme primary, olive), --viz-series-2 (orange), --viz-track, --viz-grid, --viz-axis.
export const VIZ_ROOT_CLASS = 'viz-root'

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/** Rendered width of an element, kept in sync with resizes. */
function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.getBoundingClientRect().width)
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

/**
 * A "nice" axis maximum (1, 2, 2.5, 5 x 10^n) with 4 even steps. For whole-
 * number measures (ballots, votes) the step is a whole number >= 1, so tick
 * labels never repeat (0, 1, 1, 2, 2).
 */
function niceMax(max: number, integer = false): number {
  if (max <= 0) return integer ? 4 : 1
  const raw = max / 4
  const pow = 10 ** Math.floor(Math.log10(raw))
  let step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? 10 * pow
  if (integer) step = Math.max(1, Math.ceil(step))
  return step * 4
}

export type ColumnDatum = {
  key: string
  /** Short axis label, e.g. "25 Nov" */
  label: string
  value: number
  /** Extra rows for the tooltip, e.g. votes / payments for the day. */
  details?: { label: string; value: string }[]
}

/**
 * Single-series column chart (one hue, no legend: the card title names it).
 * Each column is its own hover/focus target spanning the full band height.
 */
export function ColumnChart({
  data,
  formatValue,
  formatTooltipValue = formatValue,
  integer = false,
  ariaLabel,
  height = 200,
}: {
  data: ColumnDatum[]
  /** Axis labels (may be compact, e.g. "₵1.2k"). */
  formatValue: (v: number) => string
  /** Exact value in the tooltip (e.g. "₵1,234.50"). Defaults to formatValue. */
  formatTooltipValue?: (v: number) => string
  /** Whole-number measure: integer axis steps. */
  integer?: boolean
  ariaLabel: string
  height?: number
}) {
  const [wrapRef, width] = useElementWidth<HTMLDivElement>()
  const [active, setActive] = useState<number | null>(null)

  const padLeft = 56
  const padRight = 8
  const padTop = 10
  const axisBand = 22 // x-axis labels live inside the container height
  const plotH = height - padTop - axisBand
  const plotW = Math.max(0, width - padLeft - padRight)
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)), integer)
  const band = data.length ? plotW / data.length : 0
  const barW = Math.max(2, Math.min(24, band - 2)) // <= 24px; 2px surface gap between columns
  const y = (v: number) => padTop + plotH - (v / max) * plotH
  const ticks = [0, 1, 2, 3, 4].map((i) => (max / 4) * i)
  // As many x labels as fit (~52px each, at most 6), always the first and
  // last day; a label too close to the last one is dropped so they can't collide.
  const maxLabels = Math.max(2, Math.min(6, Math.floor(plotW / 52)))
  const labelEvery = Math.max(1, Math.ceil(data.length / maxLabels))
  const last = data.length - 1
  const showLabel = (i: number) => i === last || (i % labelEvery === 0 && last - i >= labelEvery * 0.75)

  const activeDatum = active !== null ? data[active] : null
  const tooltipLeft = active !== null ? padLeft + band * active + band / 2 : 0

  return (
    <div ref={wrapRef} className="relative w-full select-none" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block overflow-visible">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padLeft} x2={width - padRight} y1={y(t)} y2={y(t)} stroke="var(--viz-grid)" strokeWidth={1} />
              <text x={padLeft - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-zinc-500 text-[10px] font-mono">
                {formatValue(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const x = padLeft + band * i + (band - barW) / 2
            const top = y(d.value)
            const h = Math.max(0, padTop + plotH - top)
            const r = Math.min(4, barW / 2, h)
            // Rounded data-end, square at the baseline.
            const path = h > 0
              ? `M${x},${top + h} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${top + h} Z`
              : ''
            return (
              <g key={d.key}>
                {path && <path d={path} fill="var(--viz-series-1)" opacity={active === null || active === i ? 1 : 0.55} />}
                {showLabel(i) && (
                  <text x={padLeft + band * i + band / 2} y={height - 6} textAnchor="middle" className="fill-zinc-500 text-[10px]">
                    {d.label}
                  </text>
                )}
                {/* Hit target: the whole band, taller than the mark. */}
                <rect
                  x={padLeft + band * i}
                  y={padTop}
                  width={band}
                  height={plotH}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${d.label}: ${formatTooltipValue(d.value)}`}
                  onPointerEnter={() => setActive(i)}
                  onPointerLeave={() => setActive((a) => (a === i ? null : a))}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive((a) => (a === i ? null : a))}
                  className="outline-none focus-visible:stroke-zinc-400"
                />
              </g>
            )
          })}
          <line x1={padLeft} x2={width - padRight} y1={padTop + plotH} y2={padTop + plotH} stroke="var(--viz-axis)" strokeWidth={1} />
        </svg>
      )}
      {activeDatum && (
        <div
          role="status"
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-zinc-700 bg-[#0b1420] px-3 py-2 shadow-xl text-xs whitespace-nowrap"
          style={{ left: Math.min(Math.max(tooltipLeft, 80), Math.max(80, width - 80)), top: 0 }}
        >
          <div className="font-mono font-bold text-white text-sm">{formatTooltipValue(activeDatum.value)}</div>
          <div className="text-zinc-400">{activeDatum.label}</div>
          {activeDatum.details?.map((row) => (
            <div key={row.label} className="flex justify-between gap-4 text-zinc-400">
              <span>{row.label}</span>
              <span className="font-mono text-zinc-200">{row.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * One whole split into a few parts (e.g. collections by channel): a tall
 * segmented bar with each part's share printed where it fits, plus a legend
 * with names and amounts.
 */
export function SegmentedBar({
  parts,
  formatValue,
  ariaLabel,
}: {
  parts: { label: string; value: number; color: string }[]
  formatValue: (v: number) => string
  ariaLabel: string
}) {
  const total = parts.reduce((s, p) => s + p.value, 0)
  if (total <= 0) return <p className="text-xs text-zinc-500">No payments in this period.</p>
  return (
    <div className="space-y-3">
      <div role="img" aria-label={ariaLabel} className="flex h-10 w-full gap-[2px] overflow-hidden rounded-md">
        {parts.filter((p) => p.value > 0).map((p) => {
          const share = (p.value / total) * 100
          return (
            <div
              key={p.label}
              title={`${p.label}: ${formatValue(p.value)} (${share.toFixed(1)}%)`}
              className="flex items-center justify-center text-[11px] font-bold text-[#0b1a2e]"
              style={{ width: `${share}%`, background: p.color }}
            >
              {share >= 12 ? `${share.toFixed(0)}%` : ''}
            </div>
          )
        })}
      </div>
      <ul className="space-y-1.5">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-2 text-zinc-300">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} />
              {p.label}
            </span>
            <span className="font-mono text-zinc-200">
              {formatValue(p.value)} <span className="text-zinc-500">· {total ? ((p.value / total) * 100).toFixed(1) : '0.0'}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** One row of a meter list: name, a same-hue bar against its own whole, and the figure. */
export function MeterRow({
  label,
  sublabel,
  value,
  max,
  figure,
}: {
  label: React.ReactNode
  sublabel?: React.ReactNode
  value: number
  max: number
  figure: string
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <div className="min-w-0">
          <div className="truncate font-medium text-zinc-200">{label}</div>
          {sublabel && <div className="truncate text-[11px] text-zinc-500">{sublabel}</div>}
        </div>
        <span className="shrink-0 font-mono text-zinc-200">{figure}</span>
      </div>
      <div className="h-2 w-full rounded-full" style={{ background: 'var(--viz-track)' }} role="meter" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: 'var(--viz-series-1)' }} />
      </div>
    </div>
  )
}

/**
 * Compact single-series trend (no axes) with a readout line underneath:
 * the date range at rest, the hovered/focused day's value otherwise. Arrow
 * keys step through days when focused. One hue; the surrounding card names it.
 */
export function Sparkline({
  values,
  labels,
  formatValue,
  ariaLabel,
  height = 44,
  emptyText = 'No activity in this period',
}: {
  values: number[]
  /** One label per value, e.g. "25 Nov". */
  labels: string[]
  formatValue: (v: number) => string
  ariaLabel: string
  height?: number
  emptyText?: string
}) {
  const [wrapRef, width] = useElementWidth<HTMLDivElement>()
  const [active, setActive] = useState<number | null>(null)
  const gradientId = useId()
  const pad = 4
  const max = Math.max(0, ...values)
  const total = values.reduce((t, v) => t + v, 0)
  const x = (i: number) => (values.length > 1 ? pad + (i * (width - pad * 2)) / (values.length - 1) : width / 2)
  const y = (v: number) => pad + (height - pad * 2) * (1 - (max > 0 ? v / max : 0))
  const line = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area = values.length ? `${line} L${x(values.length - 1).toFixed(1)},${height} L${x(0).toFixed(1)},${height} Z` : ''
  const last = values.length - 1
  const focus = active ?? last

  const pick = (clientX: number, el: Element) => {
    if (values.length === 0) return
    const left = el.getBoundingClientRect().left
    const i = Math.round(((clientX - left - pad) / Math.max(1, width - pad * 2)) * (values.length - 1))
    setActive(Math.min(last, Math.max(0, i)))
  }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    setActive((a) => Math.min(last, Math.max(0, (a ?? last) + (e.key === 'ArrowRight' ? 1 : -1))))
  }

  return (
    <div className="space-y-1.5">
      <div ref={wrapRef} className="relative w-full" style={{ height }}>
        {width > 0 && values.length > 0 && (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={`${ariaLabel}: ${formatValue(total)} in total, peak ${formatValue(max)}`}
            tabIndex={0}
            onPointerMove={(e) => pick(e.clientX, e.currentTarget)}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive(last)}
            onBlur={() => setActive(null)}
            onKeyDown={onKey}
            className="block overflow-visible rounded outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--viz-series-1)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--viz-series-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <line x1={0} x2={width} y1={height - 0.5} y2={height - 0.5} stroke="var(--viz-grid)" strokeWidth={1} />
            {max > 0 && <path d={area} fill={`url(#${gradientId})`} />}
            <path d={line} fill="none" stroke="var(--viz-series-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" opacity={max > 0 ? 1 : 0.4} />
            {active !== null && <line x1={x(active)} x2={x(active)} y1={0} y2={height} stroke="var(--viz-axis)" strokeWidth={1} />}
            {max > 0 && (
              <circle cx={x(focus)} cy={y(values[focus])} r={4} fill="var(--viz-series-1)" stroke="var(--viz-surface)" strokeWidth={2} />
            )}
          </svg>
        )}
      </div>
      <div className="flex items-baseline justify-between gap-2 text-[10px]" aria-live="polite">
        {active !== null ? (
          <>
            <span className="text-zinc-400">{labels[active]}</span>
            <span className="font-mono font-semibold text-zinc-200">{formatValue(values[active])}</span>
          </>
        ) : max > 0 ? (
          <>
            <span className="text-zinc-500">{labels[0]} – {labels[last]}</span>
            <span className="text-zinc-500">peak <span className="font-mono text-zinc-300">{formatValue(max)}</span></span>
          </>
        ) : (
          <span className="text-zinc-500">{emptyText}</span>
        )}
      </div>
    </div>
  )
}
