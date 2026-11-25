import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowUpRight, BarChart3, Calendar, CircleDollarSign, Landmark, ListChecks, Percent,
  Radio, Receipt, Sparkles, Ticket, Users, Vote,
} from "lucide-react";
import { getDashboardAnalyticsFn } from "#/server/tenant-analytics";
import { ManageDashboardSkeleton } from "#/components/ui/skeleton";
import { OwnerLine } from "#/components/admin/ScopeToggle";
import { ColumnChart, MeterRow, SegmentedBar, VIZ_STYLE } from "#/components/admin/charts";
import { formatMoney } from "#/lib/money";

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

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

function StatTile({ label, value, hint, icon: Icon, tone }: { label: string; value: string; hint?: string; icon: any; tone: string }) {
  return (
    <div className="bg-[#0a192a]/50 border border-zinc-800 p-4 rounded-xl">
      <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1">
        <Icon className={`w-3.5 h-3.5 ${tone}`} /> {label}
      </p>
      <h3 className="text-xl font-black text-white mt-1.5 font-mono">{value}</h3>
      {hint && <p className="text-[10px] text-zinc-500 mt-1.5">{hint}</p>}
    </div>
  );
}

function ModuleCard({ to, icon: Icon, tone, badge, title, text }: { to: string; icon: any; tone: string; badge: string; title: string; text: string }) {
  return (
    <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700/80 transition-all group relative overflow-hidden">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Icon className={`w-5 h-5 ${tone}`} />
          </div>
          <span className="text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded">{badge}</span>
        </div>
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
            <span>{title}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </h3>
          <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">{text}</p>
        </div>
      </div>
      <Link to={to as any} className="absolute inset-0 z-10" aria-label={title} />
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

  const { counts, allTime, period, series, channels, topEvents, liveElections, recentPayments } = data as any;
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
    <div className="max-w-7xl mx-auto space-y-8" style={VIZ_STYLE}>
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

      {/* ---------- Modules ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <ModuleCard to="/admin/events" icon={Sparkles} tone="text-emerald-400" badge={plural(counts.events, "event", "events")} title="Events Console"
          text="Manage public voting events, categories, nominees and vote pricing." />
        <ModuleCard to="/admin/elections" icon={Calendar} tone="text-blue-400" badge={plural(counts.elections, "election", "elections")} title="Elections Console"
          text="Set up ballots, positions, candidates and voter registers." />
        {isSuperAdmin && (
          <ModuleCard to="/admin/revenue" icon={Landmark} tone="text-rose-400" badge={`${formatMoney(allTime.balance)} owed`} title="Revenue & Withdrawals"
            text="Platform fees, organiser balances and the withdrawal ledger for every event." />
        )}
        {isSuperAdmin && (
          <ModuleCard to="/admin/users" icon={Users} tone="text-orange-400" badge={plural(counts.accounts?.total ?? 0, "account", "accounts")} title="Users Registry"
            text="Manage admin accounts, verify or disable access, and reset credentials." />
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
          <StatTile label={`Collected · ${days}d`} value={formatMoney(period.gross)} hint={`${formatMoney(allTime.gross)} all time`} icon={CircleDollarSign} tone="text-emerald-500" />
          {isSuperAdmin ? (
            <StatTile label={`Platform fees · ${days}d`} value={formatMoney(period.fee)} hint={`${formatMoney(allTime.fee)} all time`} icon={Percent} tone="text-purple-400" />
          ) : (
            <StatTile label="Your balance" value={formatMoney(allTime.balance)} hint={`${formatMoney(allTime.withdrawn)} paid out so far`} icon={Landmark} tone="text-rose-400" />
          )}
          <StatTile label={`Votes bought · ${days}d`} value={n(period.votes)} hint={`${n(period.payments)} payments`} icon={Ticket} tone="text-sky-400" />
          <StatTile label={`Ballots cast · ${days}d`} value={n(period.ballots)} hint={`${n(counts.votedVoters)} of ${n(counts.registeredVoters)} voters overall`} icon={Vote} tone="text-blue-400" />
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
