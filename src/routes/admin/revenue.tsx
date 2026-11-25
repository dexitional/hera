import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Banknote, CircleDollarSign, ImageOff, Landmark, Percent, Search, Wallet } from "lucide-react";
import { getRevenueOverviewFn } from "#/server/tenant-revenue";
import { TableSkeleton } from "#/components/ui/skeleton";
import { OwnerLine } from "#/components/admin/ScopeToggle";
import { formatMoney, formatPercent } from "#/lib/money";

const revenueQueryOptions = () => ({
  queryKey: ["revenue-overview"],
  queryFn: () => getRevenueOverviewFn(),
});

export const Route = createFileRoute("/admin/revenue")({
  beforeLoad: ({ context }: any) => {
    if (context.user?.role !== "super") throw redirect({ to: "/admin" });
  },
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(revenueQueryOptions());
  },
  pendingComponent: () => <TableSkeleton />,
  component: RevenueOverview,
});

function StatCard({ label, value, hint, icon: Icon, tone }: { label: string; value: string; hint?: string; icon: any; tone: string }) {
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

function RevenueOverview() {
  const { data }: any = useSuspenseQuery(revenueQueryOptions());
  const [search, setSearch] = useState("");
  const [onlyWithBalance, setOnlyWithBalance] = useState(false);
  const { totals } = data;

  const q = search.trim().toLowerCase();
  const rows = data.events.filter((e: any) => {
    if (onlyWithBalance && e.balance <= 0) return false;
    if (!q) return true;
    return `${e.title} ${e.ownerOrganization ?? ""} ${e.ownerName ?? ""} ${e.ownerEmail ?? ""}`.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-[#0a192a]/50 p-6 rounded-xl border border-zinc-800">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Landmark className="w-5 h-5 text-purple-400" />
          <span>Revenue &amp; Withdrawals</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Vote revenue collected by every organisation's events, the platform fee, what has been paid out, and what is still owed.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Gross collected" value={formatMoney(totals.gross)} hint={`${totals.payments.toLocaleString()} payments · ${totals.votes.toLocaleString()} votes`} icon={CircleDollarSign} tone="text-emerald-500" />
        <StatCard label="Platform fees" value={formatMoney(totals.fee)} icon={Percent} tone="text-purple-400" />
        <StatCard label="Organisers' share" value={formatMoney(totals.organiserShare)} icon={Wallet} tone="text-sky-400" />
        <StatCard label="Withdrawn" value={formatMoney(totals.withdrawn)} icon={Banknote} tone="text-amber-400" />
        <StatCard label="Balance owed" value={formatMoney(totals.balance)} hint="Share not yet paid out" icon={Landmark} tone="text-rose-400" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search event or organisation..."
            className="w-full bg-[#0a192a]/50 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-zinc-300 select-none">
          <input type="checkbox" checked={onlyWithBalance} onChange={(e) => setOnlyWithBalance(e.target.checked)} className="accent-purple-500" />
          Only events with a balance owed
        </label>
      </div>

      <div className="bg-[#0a192a]/40 border border-zinc-800 rounded-xl overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
              <th className="px-5 py-3">Event</th>
              <th className="px-5 py-3 text-right">Gross</th>
              <th className="px-5 py-3 text-right">Fee</th>
              <th className="px-5 py-3 text-right">Organiser share</th>
              <th className="px-5 py-3 text-right">Withdrawn</th>
              <th className="px-5 py-3 text-right">Balance</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 text-sm">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-xs text-zinc-500">No events match.</td>
              </tr>
            ) : (
              rows.map((e: any) => (
                <tr key={e.id} className="hover:bg-zinc-900/20 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                        {e.imageUrl ? <img src={e.imageUrl} alt="" className="w-full h-full object-cover" /> : <ImageOff className="w-4 h-4 text-zinc-600" />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-white text-sm truncate">{e.title}</span>
                        <OwnerLine organization={e.ownerOrganization} name={e.ownerName} />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-zinc-200">{formatMoney(e.gross)}</td>
                  <td className="px-5 py-3 text-right font-mono text-zinc-400">
                    {formatMoney(e.fee)}
                    <span className="block text-[10px] text-purple-400">{formatPercent(e.feePercent)}</span>
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-zinc-200">{formatMoney(e.organiserShare)}</td>
                  <td className="px-5 py-3 text-right font-mono text-amber-300">{formatMoney(e.withdrawn)}</td>
                  <td className={`px-5 py-3 text-right font-mono font-bold ${e.balance > 0 ? "text-rose-300" : "text-zinc-500"}`}>{formatMoney(e.balance)}</td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      to="/admin/events/$eventId/revenue"
                      params={{ eventId: String(e.id) }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-purple-300 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Ledger <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
