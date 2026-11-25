import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Banknote, CircleDollarSign, ImageOff, Landmark, Percent, Wallet } from "lucide-react";
import { DataTable, StatTile, type Column } from "#/components/admin/ui";
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

function RevenueOverview() {
  const { data }: any = useSuspenseQuery(revenueQueryOptions());
  const [onlyWithBalance, setOnlyWithBalance] = useState(false);
  const { totals } = data;
  const rows = onlyWithBalance ? data.events.filter((e: any) => e.balance > 0) : data.events;

  const money = (k: string) => (e: any) => e[k];
  const columns: Column<any>[] = [
    {
      key: "event", header: "Event", sortValue: (e) => e.title,
      render: (e) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
            {e.imageUrl ? <img src={e.imageUrl} alt="" className="w-full h-full object-cover" /> : <ImageOff className="w-4 h-4 text-zinc-600" />}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-white text-sm truncate">{e.title}</span>
            <OwnerLine organization={e.ownerOrganization} name={e.ownerName} />
          </div>
        </div>
      ),
    },
    { key: "gross", header: "Gross", align: "right", sortValue: money("gross"), render: (e) => <span className="font-mono text-zinc-200">{formatMoney(e.gross)}</span> },
    {
      key: "fee", header: "Fee", align: "right", sortValue: money("fee"),
      render: (e) => (
        <span className="font-mono text-zinc-400">
          {formatMoney(e.fee)}
          <span className="block text-[10px] text-purple-400">{formatPercent(e.feePercent)}</span>
        </span>
      ),
    },
    { key: "share", header: "Organiser share", align: "right", sortValue: money("organiserShare"), render: (e) => <span className="font-mono text-zinc-200">{formatMoney(e.organiserShare)}</span> },
    { key: "withdrawn", header: "Withdrawn", align: "right", sortValue: money("withdrawn"), render: (e) => <span className="font-mono text-amber-300">{formatMoney(e.withdrawn)}</span> },
    { key: "balance", header: "Balance", align: "right", sortValue: money("balance"), render: (e) => <span className={`font-mono font-bold ${e.balance > 0 ? "text-rose-300" : "text-zinc-500"}`}>{formatMoney(e.balance)}</span> },
    {
      key: "open", header: "", align: "right",
      render: (e) => (
        <Link
          to="/admin/events/$eventId/revenue"
          params={{ eventId: String(e.id) }}
          className="inline-flex items-center gap-1 text-xs font-medium text-purple-300 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded-lg transition-colors"
        >
          Ledger <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      ),
    },
  ];

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
        <StatTile label="Gross collected" value={formatMoney(totals.gross)} hint={`${totals.payments.toLocaleString()} payments · ${totals.votes.toLocaleString()} votes`} icon={CircleDollarSign} tone="text-emerald-500" />
        <StatTile label="Platform fees" value={formatMoney(totals.fee)} icon={Percent} tone="text-purple-400" />
        <StatTile label="Organisers' share" value={formatMoney(totals.organiserShare)} icon={Wallet} tone="text-sky-400" />
        <StatTile label="Withdrawn" value={formatMoney(totals.withdrawn)} icon={Banknote} tone="text-amber-400" />
        <StatTile label="Balance owed" value={formatMoney(totals.balance)} hint="Share not yet paid out" icon={Landmark} tone="text-rose-400" />
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(e: any) => String(e.id)}
        searchText={(e: any) => `${e.title} ${e.ownerOrganization ?? ""} ${e.ownerName ?? ""} ${e.ownerEmail ?? ""}`}
        searchPlaceholder="Search event or organisation..."
        initialSort={{ key: "balance", dir: "desc" }}
        emptyTitle="No events yet"
        emptyDescription="Revenue appears here once organisations create events and collect votes."
        minWidth={900}
        toolbar={
          <label className="flex items-center gap-2 text-xs text-zinc-300 select-none">
            <input type="checkbox" checked={onlyWithBalance} onChange={(e) => setOnlyWithBalance(e.target.checked)} className="accent-purple-500" />
            Only events with a balance owed
          </label>
        }
      />
    </div>
  );
}
