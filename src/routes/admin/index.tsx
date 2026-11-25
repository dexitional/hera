import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowUpRight, BarChart3, Calendar, CircleDollarSign, Landmark, ListChecks, Percent, Plus,
  Radio, Receipt, Sparkles, Ticket, Users, Vote,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getDashboardAnalyticsFn } from "#/server/tenant-analytics";
import { ManageDashboardSkeleton } from "#/components/ui/skeleton";
import { OwnerLine } from "#/components/admin/ScopeToggle";
import { ColumnChart, MeterRow, SegmentedBar, Sparkline, VIZ_ROOT_CLASS } from "#/components/admin/charts";
import { formatMoney } from "#/lib/money";
import { DeltaBadge, StatTile, type Delta } from "#/components/admin/ui";

const PERIODS = [7, 30, 90] as const;
type Period = (typeof PERIODS)[number];

const dashboardQueryOptions = (days: Period) => ({
  queryKey: ["admin-dashboard", days],
  queryFn: () => getDashboardAnalyticsFn({ data: { days } } as any),
});

export const Route = createFileRoute("/admin/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(dashboardQueryOptions(30));
  },
  pendingComponent: () => <ManageDashboardSkeleton />,
  component: AdminDashboard,
});

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const compactMoney = (v: number) =>
  v >= 1_000_000 ? `₵${(v / 1_000_000).toFixed(1)}m` : v >= 1_000 ? `₵${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1)}k` : `₵${Math.round(v)}`;
const compactCount = (v: number) => (v >= 1_000 ? `${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1)}k` : String(Math.round(v)));
const shortDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GH", { day: "numeric", month: "short", timeZone: "UTC" });
const dateTime = (iso: string) => new Date(iso).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" });
const n = (v: number) => v.toLocaleString("en-GH");
const plural = (count: number, one: string, many: string) => `${n(count)} ${count === 1 ? one : many}`;
/** Same rule as the server's percentChange: null when there's no previous baseline. */
const percentChangeClient = (current: number, previous: number) =>
  previous === 0 ? (current === 0 ? 0 : null) : ((current - previous) / previous) * 100;

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

// Accent classes are written out in full so Tailwind generates them.
const ACCENTS = {
  emerald: { icon: "text-emerald-400", tile: "bg-emerald-500/10 border-emerald-500/25", bar: "from-emerald-500/80" },
  blue: { icon: "text-blue-400", tile: "bg-blue-500/10 border-blue-500/25", bar: "from-blue-500/80" },
  rose: { icon: "text-rose-400", tile: "bg-rose-500/10 border-rose-500/25", bar: "from-rose-500/80" },
  orange: { icon: "text-orange-400", tile: "bg-orange-500/10 border-orange-500/25", bar: "from-orange-500/80" },
} as const;

type NavStat = { label: string; value: React.ReactNode; tone?: string };
type NavAction = { to: string; label: string; icon?: LucideIcon };

/**
 * A section's live summary that doubles as its entry point: the whole card
 * links to the section, while the trend and quick actions sit above that link
 * so they keep their own hover and click behaviour (no nested anchors).
 */
function NavCard({
  to, icon: Icon, accent, title, subtitle, live, metricLabel, metric, delta, trend, stats, actions,
}: {
  to: string;
  icon: LucideIcon;
  accent: keyof typeof ACCENTS;
  title: string;
  subtitle: string;
  /** Shows a pulsing "N live" pill when above zero. */
  live?: { count: number; label: string };
  metricLabel: string;
  metric: React.ReactNode;
  delta?: Delta;
  trend: React.ReactNode;
  stats: NavStat[];
  actions?: NavAction[];
}) {
  const navigate = useNavigate();
  const a = ACCENTS[accent];
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-[#0a192a]/50 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-zinc-700 hover:shadow-xl hover:shadow-black/20 focus-within:border-zinc-600 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <span aria-hidden className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${a.bar} via-transparent to-transparent opacity-70 transition-opacity group-hover:opacity-100`} />

      <header className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${a.tile}`}>
          <Icon className={`h-5 w-5 ${a.icon}`} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-1 text-sm font-bold tracking-tight text-white">
            <span className="truncate">{title}</span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-zinc-600 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
          </h3>
          <p className="truncate text-[11px] text-zinc-500">{subtitle}</p>
        </div>
        {live && live.count > 0 && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            {n(live.count)} {live.label}
          </span>
        )}
      </header>

      <div className="mt-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{metricLabel}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-mono text-2xl font-black tracking-tight text-white">{metric}</span>
          {delta && <DeltaBadge delta={delta} />}
        </div>
      </div>

      {/* Above the card link, so hovering reads the trend; a click still opens the section. */}
      <div className="relative z-20 mt-3 cursor-pointer" onClick={() => navigate({ to: to as any })}>
        {trend}
      </div>

      <dl className="mt-4 grid grid-cols-3 divide-x divide-zinc-800 border-t border-zinc-800 pt-3">
        {stats.map((st) => (
          <div key={st.label} className="min-w-0 px-2 first:pl-0 last:pr-0">
            <dt className="truncate text-[10px] text-zinc-500">{st.label}</dt>
            <dd className={`truncate font-mono text-xs font-bold ${st.tone ?? "text-zinc-200"}`}>{st.value}</dd>
          </div>
        ))}
      </dl>

      {actions && actions.length > 0 && (
        <div className="relative z-20 mt-4 flex flex-wrap gap-2">
          {actions.map((act) => {
            const ActIcon = act.icon ?? Plus;
            return (
              <Link
                key={act.to}
                to={act.to as any}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
              >
                <ActIcon className="h-3.5 w-3.5" /> {act.label}
              </Link>
            );
          })}
        </div>
      )}

      <Link
        to={to as any}
        aria-label={`Open ${title}`}
        className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-purple-500"
      />
    </article>
  );
}

/** Verified share of accounts, as a single meter (Users card has no daily series). */
function AccountsMeter({ total, unverified }: { total: number; unverified: number }) {
  const verified = Math.max(0, total - unverified);
  const pct = total > 0 ? (verified / total) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex h-[44px] flex-col justify-center gap-2">
        <div className="h-2 w-full rounded-full" style={{ background: "var(--viz-track)" }} role="meter" aria-label="Verified accounts" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: "var(--viz-series-1)" }} />
        </div>
      </div>
      <div className="flex items-baseline justify-between gap-2 text-[10px] text-zinc-500">
        <span>Email verified</span>
        <span><span className="font-mono text-zinc-300">{n(verified)}</span> of {n(total)} · {pct.toFixed(0)}%</span>
      </div>
    </div>
  );
}

/** Card with a Chart / Table switch, so every value is readable without hovering. */
function ChartCard({ title, subtitle, table, children }: { title: string; subtitle?: string; table: React.ReactNode; children: React.ReactNode }) {
  const [view, setView] = useState<"chart" | "table">("chart");
  return (
    <section className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">{title}</h2>
          {subtitle && <p className="text-[11px] text-zinc-500 mt-0.5">{subtitle}</p>}
        </div>
        <div role="group" aria-label={`${title} view`} className="flex rounded-md border border-zinc-800 p-0.5 text-[11px]">
          {(["chart", "table"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`px-2.5 py-1 rounded capitalize ${view === v ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      {view === "chart" ? children : <div className="max-h-64 overflow-auto">{table}</div>}
    </section>
  );
}

const th = "px-3 py-2 text-left text-[10px] uppercase tracking-wider text-zinc-500 font-bold";
const td = "px-3 py-2 text-xs text-zinc-300";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function AdminDashboard() {
  const { user }: any = Route.useRouteContext();
  const isSuperAdmin = user?.role === "super";
  const [days, setDays] = useState<Period>(30);
  const { data, isFetching } = useQuery({ ...dashboardQueryOptions(days), placeholderData: keepPreviousData });
  if (!data) return <ManageDashboardSkeleton />;

  const { counts, allTime, period, change, series, channels, topEvents, liveElections, recentPayments } = data as any;
  const vsLabel = `vs previous ${days} days`;
  const delta = (pct: number | null): Delta => ({ pct, label: vsLabel });
  const dayLabels = series.map((p: any) => shortDate(p.date));
  const accounts = counts.accounts;
  const turnoutPct = counts.registeredVoters ? Math.round((counts.votedVoters / counts.registeredVoters) * 100) : 0;
  const scopeLabel = isSuperAdmin ? "All organisations" : "Your organisation";
  const hasEvents = counts.events > 0;
  const hasElections = counts.elections > 0;
  const topMax = Math.max(0, ...topEvents.map((e: any) => e.gross));
  // Colour follows the channel, never its rank: Web is always slot 1, USSD slot 2.
  const channelParts = [
    { label: "Web", value: channels.filter((c: any) => c.channel !== "USSD").reduce((t: number, c: any) => t + c.gross, 0), color: "var(--viz-series-1)" },
    { label: "USSD", value: channels.find((c: any) => c.channel === "USSD")?.gross ?? 0, color: "var(--viz-series-2)" },
  ];

  return (
    <div className={`max-w-7xl mx-auto space-y-8 ${VIZ_ROOT_CLASS}`}>
      {/* ---------- Header ---------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a192a]/50 p-6 rounded-xl border border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <span>Dashboard</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {isSuperAdmin
              ? "Voting, collections and payouts across every organisation on the platform."
              : "Voting and collections across your events and elections."}
          </p>
        </div>
        <span className="inline-flex items-center gap-2 text-xs bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-lg font-medium shrink-0 text-zinc-300">
          <Users className="w-3.5 h-3.5 text-zinc-500" /> {scopeLabel}
        </span>
      </div>

      {/* ---------- Sections: live summaries that open each console ---------- */}
      <div className={`grid grid-cols-1 gap-5 md:grid-cols-2 transition-opacity ${isFetching ? "opacity-60" : ""}`}>
        <NavCard
          to="/admin/events"
          icon={Sparkles}
          accent="emerald"
          title="Events Console"
          subtitle="Paid voting events, nominees & pricing"
          live={{ count: counts.activeEvents, label: "live" }}
          metricLabel={`Collected · ${days}d`}
          metric={formatMoney(period.gross)}
          delta={delta(change.gross)}
          trend={<Sparkline values={series.map((p: any) => p.gross)} labels={dayLabels} formatValue={formatMoney} ariaLabel={`Event collections per day, last ${days} days`} />}
          stats={[
            { label: "Events", value: n(counts.events) },
            { label: `Votes · ${days}d`, value: n(period.votes) },
            { label: `Payments · ${days}d`, value: n(period.payments) },
          ]}
          actions={[{ to: "/admin/events/new", label: "New event" }]}
        />
        <NavCard
          to="/admin/elections"
          icon={Calendar}
          accent="blue"
          title="Elections Console"
          subtitle="Ballots, positions & voter registers"
          live={{ count: counts.liveElections, label: "live" }}
          metricLabel={`Ballots cast · ${days}d`}
          metric={n(period.ballots)}
          delta={delta(change.ballots)}
          trend={<Sparkline values={series.map((p: any) => p.ballots)} labels={dayLabels} formatValue={n} ariaLabel={`Ballots cast per day, last ${days} days`} />}
          stats={[
            { label: "Elections", value: n(counts.elections) },
            { label: "Voters", value: n(counts.registeredVoters) },
            { label: "Turnout", value: `${turnoutPct}%` },
          ]}
          actions={[{ to: "/admin/elections/new", label: "New election" }]}
        />
        {isSuperAdmin && (
          <NavCard
            to="/admin/revenue"
            icon={Landmark}
            accent="rose"
            title="Revenue & Withdrawals"
            subtitle="Fees, organiser balances & payouts"
            metricLabel={`Platform fees · ${days}d`}
            metric={formatMoney(period.fee)}
            delta={delta(change.fee)}
            trend={<Sparkline values={series.map((p: any) => p.fee)} labels={dayLabels} formatValue={formatMoney} ariaLabel={`Platform fees per day, last ${days} days`} />}
            stats={[
              { label: "Owed", value: compactMoney(allTime.balance), tone: allTime.balance > 0 ? "text-rose-300" : undefined },
              { label: "Paid out", value: compactMoney(allTime.withdrawn) },
              { label: "Fees all time", value: compactMoney(allTime.fee) },
            ]}
          />
        )}
        {isSuperAdmin && accounts && (
          <NavCard
            to="/admin/users"
            icon={Users}
            accent="orange"
            title="Users Registry"
            subtitle="Admin accounts, access & credentials"
            metricLabel={`New accounts · ${days}d`}
            metric={n(accounts.newInPeriod)}
            delta={delta(percentChangeClient(accounts.newInPeriod, accounts.newInPrevious))}
            trend={<AccountsMeter total={accounts.total} unverified={accounts.unverified} />}
            stats={[
              { label: "Accounts", value: n(accounts.total) },
              { label: "Super admins", value: n(accounts.superAdmins) },
              { label: "Disabled", value: n(accounts.disabled), tone: accounts.disabled > 0 ? "text-amber-300" : undefined },
            ]}
          />
        )}
      </div>

      {/* ---------- Filter row: scopes everything below ---------- */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-zinc-500">Showing</span>
        <div role="group" aria-label="Time period" className="flex rounded-lg border border-zinc-800 bg-zinc-900/60 p-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={days === p}
              onClick={() => setDays(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${days === p ? "bg-purple-600 text-white" : "text-zinc-400 hover:text-white"}`}
            >
              Last {p} days
            </button>
          ))}
        </div>
        <span className="text-[11px] text-zinc-600">Days in GMT</span>
      </div>

      {/* Refetch keeps the frame: previous figures stay, dimmed, until the new period arrives. */}
      <div className={`space-y-6 transition-opacity ${isFetching ? "opacity-60" : "opacity-100"}`} aria-busy={isFetching}>
        {/* ---------- Headline figures ---------- */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatTile label={`Collected · ${days}d`} value={formatMoney(period.gross)} delta={delta(change.gross)} hint={`${formatMoney(allTime.gross)} all time`} icon={CircleDollarSign} tone="text-emerald-500" />
          {isSuperAdmin ? (
            <StatTile label={`Platform fees · ${days}d`} value={formatMoney(period.fee)} delta={delta(change.fee)} hint={`${formatMoney(allTime.fee)} all time`} icon={Percent} tone="text-purple-400" />
          ) : (
            <StatTile label="Your balance" value={formatMoney(allTime.balance)} hint={`${formatMoney(allTime.withdrawn)} paid out so far`} icon={Landmark} tone="text-rose-400" />
          )}
          <StatTile label={`Votes bought · ${days}d`} value={n(period.votes)} delta={delta(change.votes)} hint={`${n(period.payments)} payments`} icon={Ticket} tone="text-sky-400" />
          <StatTile label={`Ballots cast · ${days}d`} value={n(period.ballots)} delta={delta(change.ballots)} hint={`${n(counts.votedVoters)} of ${n(counts.registeredVoters)} voters overall`} icon={Vote} tone="text-blue-400" />
          <StatTile label="Live now" value={`${counts.liveElections + counts.activeEvents}`} hint={`${plural(counts.liveElections, "election", "elections")} · ${plural(counts.activeEvents, "event", "events")}`} icon={Radio} tone="text-amber-400" />
        </div>

        {/* ---------- Time series (one measure per chart: no dual axes) ---------- */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ChartCard
            title="Collections per day"
            subtitle={hasEvents ? `Successful vote payments, ${scopeLabel.toLowerCase()}` : "No events yet"}
            table={
              <table className="w-full">
                <thead><tr><th className={th}>Day</th><th className={`${th} text-right`}>Collected</th><th className={`${th} text-right`}>Votes</th><th className={`${th} text-right`}>Payments</th></tr></thead>
                <tbody className="divide-y divide-zinc-900">
                  {[...series].reverse().map((p: any) => (
                    <tr key={p.date}><td className={td}>{shortDate(p.date)}</td><td className={`${td} text-right font-mono`}>{formatMoney(p.gross)}</td><td className={`${td} text-right font-mono`}>{n(p.votes)}</td><td className={`${td} text-right font-mono`}>{n(p.payments)}</td></tr>
                  ))}
                </tbody>
              </table>
            }
          >
            <ColumnChart
              ariaLabel={`Collections per day over the last ${days} days`}
              formatValue={compactMoney}
              formatTooltipValue={formatMoney}
              data={series.map((p: any) => ({
                key: p.date,
                label: shortDate(p.date),
                value: p.gross,
                details: [
                  { label: "Votes", value: n(p.votes) },
                  { label: "Payments", value: n(p.payments) },
                  ...(isSuperAdmin ? [{ label: "Platform fee", value: formatMoney(p.fee) }] : []),
                ],
              }))}
            />
          </ChartCard>

          <ChartCard
            title="Ballots cast per day"
            subtitle={hasElections ? `Election ballots submitted, ${scopeLabel.toLowerCase()}` : "No elections yet"}
            table={
              <table className="w-full">
                <thead><tr><th className={th}>Day</th><th className={`${th} text-right`}>Ballots</th></tr></thead>
                <tbody className="divide-y divide-zinc-900">
                  {[...series].reverse().map((p: any) => (
                    <tr key={p.date}><td className={td}>{shortDate(p.date)}</td><td className={`${td} text-right font-mono`}>{n(p.ballots)}</td></tr>
                  ))}
                </tbody>
              </table>
            }
          >
            <ColumnChart
              ariaLabel={`Ballots cast per day over the last ${days} days`}
              formatValue={compactCount}
              formatTooltipValue={n}
              integer
              data={series.map((p: any) => ({ key: p.date, label: shortDate(p.date), value: p.ballots }))}
            />
          </ChartCard>
        </div>

        {/* ---------- Breakdowns ---------- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white">Collections by channel</h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">Web checkout vs USSD, last {days} days</p>
            </div>
            <SegmentedBar
              ariaLabel="Collections by channel"
              formatValue={formatMoney}
              parts={channelParts}
            />
          </section>

          <section className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white">Top events</h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">By amount collected, last {days} days</p>
            </div>
            {topEvents.length === 0 ? (
              <p className="text-xs text-zinc-500">No payments in this period.</p>
            ) : (
              <div className="space-y-4">
                {topEvents.map((e: any) => (
                  <MeterRow
                    key={e.id}
                    label={<Link to="/admin/events/$eventId/manage" params={{ eventId: e.id }} className="hover:text-white hover:underline">{e.title}</Link>}
                    sublabel={isSuperAdmin ? <OwnerLine organization={e.ownerOrganization} name={e.ownerName} /> : `${n(e.votes)} votes`}
                    value={e.gross}
                    max={topMax}
                    figure={formatMoney(e.gross)}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2"><ListChecks className="w-4 h-4 text-blue-400" /> Live elections</h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">Turnout so far: ballots cast of registered voters</p>
            </div>
            {liveElections.length === 0 ? (
              <p className="text-xs text-zinc-500">No elections are open right now.</p>
            ) : (
              <div className="space-y-4">
                {liveElections.map((e: any) => (
                  <MeterRow
                    key={e.id}
                    label={<Link to="/admin/elections/$electionId/manage" params={{ electionId: e.id }} className="hover:text-white hover:underline">{e.title}</Link>}
                    sublabel={isSuperAdmin ? <OwnerLine organization={e.ownerOrganization} name={e.ownerName} /> : e.endAt ? `Closes ${dateTime(e.endAt)}` : undefined}
                    value={e.voted}
                    max={e.registered}
                    figure={`${n(e.voted)} / ${n(e.registered)} · ${e.registered ? Math.round((e.voted / e.registered) * 100) : 0}%`}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ---------- Recent payments ---------- */}
        <section className="bg-[#0a192a]/40 border border-zinc-800 rounded-xl overflow-x-auto">
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-white">Recent payments</h2>
          </div>
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className={`${th} px-5`}>Time</th><th className={th}>Event</th><th className={th}>Nominee</th><th className={th}>Payer</th><th className={th}>Channel</th>
                <th className={`${th} text-right`}>Votes</th><th className={`${th} text-right px-5`}>Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {recentPayments.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-xs text-zinc-500">No payments yet.</td></tr>
              ) : (
                recentPayments.map((p: any) => (
                  <tr key={p.id}>
                    <td className={`${td} px-5 whitespace-nowrap`}>{dateTime(p.createdAt)}</td>
                    <td className={`${td} max-w-[220px] truncate`}>{p.eventTitle}</td>
                    <td className={`${td} max-w-[200px] truncate`}>{p.contestantName}</td>
                    <td className={`${td} font-mono text-zinc-400`}>{p.payer}</td>
                    <td className={td}>{p.channel === "USSD" ? "USSD" : "Web"}</td>
                    <td className={`${td} text-right font-mono`}>{n(p.votes)}</td>
                    <td className={`${td} px-5 text-right font-mono font-bold text-white`}>{formatMoney(p.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
