import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Sliders, FolderTree, UserCheck, Coins, ArrowUpRight, Plus,
  Percent, CircleDollarSign, BarChart3, LayoutGrid, Flame, Pencil,
  ArrowLeft, Loader2, Receipt, Activity, FileSpreadsheet,
} from "lucide-react";
import { exportEventResultsToExcelFn, getEventOverviewFn, updateEventActiveStateFn } from "#/server/tenant-events";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ManageDashboardSkeleton } from "#/components/ui/skeleton";

const eventOverviewQueryOptions = (eventId: any) => ({
  queryKey: ['event-overview', eventId],
  queryFn: () => getEventOverviewFn({ data: eventId } as any),
  refetchInterval: 30 * 1000,
  staleTime: 30 * 1000,
  refetchIntervalInBackground: true,
});

export const Route = createFileRoute("/admin/events/$eventId/manage")({
  component: ManageEventConsole,
  loader: async ({ context, params }: any) => {
    const eventId = params.eventId;
    await context.queryClient.ensureQueryData(eventOverviewQueryOptions(eventId));
  },
  pendingComponent: () => <ManageDashboardSkeleton />,
});

function ManageEventConsole() {
  const { eventId } = Route.useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: event }: any = useSuspenseQuery(eventOverviewQueryOptions(eventId));

  const [isActive, setIsActive] = useState<boolean>(!!event.isActive);
  const [isExportingResults, setIsExportingResults] = useState(false);

  const activeStateMutation = useMutation({ mutationFn: updateEventActiveStateFn });

  const handleExportResults = async () => {
    try {
      setIsExportingResults(true);

      const result = await exportEventResultsToExcelFn({ data: { eventId } } as any);

      if (!result.success || !result.base64Data) {
        alert(result.error || "Export failed to execute correctly.");
        return;
      }

      const byteCharacters = atob(result.base64Data);
      const byteArrays = [];
      const sliceSize = 512;

      for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        byteArrays.push(new Uint8Array(byteNumbers));
      }

      const fileBlob = new Blob(byteArrays, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const downloadUrl = window.URL.createObjectURL(fileBlob);
      const linkElement = document.createElement('a');

      linkElement.href = downloadUrl;
      linkElement.download = result.filename;
      document.body.appendChild(linkElement);
      linkElement.click();

      document.body.removeChild(linkElement);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error("Event results export failed:", err);
    } finally {
      setIsExportingResults(false);
    }
  };

  const handleToggleActive = () => {
    if (activeStateMutation.isPending) return;
    const nextIsActive = !isActive;
    setIsActive(nextIsActive);
    activeStateMutation.mutate({ data: { eventId, isActive: nextIsActive } } as any, {
      onError: () => setIsActive(!nextIsActive),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event-overview', eventId] }),
    });
  };

  const paymentAmount = event.paymentAmount ?? 0;
  const paymentDeduction = event.paymentDeduction ?? 0;
  const deductionRate = paymentAmount > 0 ? ((paymentDeduction / paymentAmount) * 100).toFixed(0) : "0";
  const netRevenueCollected = paymentAmount - paymentDeduction;

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ================= BACK NAVIGATION ================= */}
      <Link
        to="/admin/events"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Events Console
      </Link>

      {/* ================= WORKSPACE CONSOLE BREADCRUMB HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a192a]/50 p-6 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-4">
          {event.imageUrl && (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-14 h-14 rounded-lg object-cover border border-zinc-800 shrink-0"
            />
          )}
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono uppercase tracking-wider">
              <Link to="/admin/events" className="hover:text-purple-400 transition-colors">Events App</Link>
              <span>/</span>
              <span className="text-zinc-400 select-all">Console Node: ev_{event.id}</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-400 shrink-0" />
              <span className="truncate">Manage: {event.title}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/admin/events/$eventId/edit"
            params={{ eventId: String(event.id) }}
            title="Edit Main Event Form"
            className="flex flex-col items-center justify-center gap-2 px-3 h-14 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            <span className="text-[9px] font-bold uppercase tracking-wide leading-none">Edit</span>
          </Link>

          {/* Real-time Status Switch Ingestion */}
          <button
            type="button"
            onClick={handleToggleActive}
            disabled={activeStateMutation.isPending}
            className={`flex items-center gap-2 px-4 h-14 rounded-xl border text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${isActive ? 'border-emerald-500/30 text-emerald-400 bg-emerald-950/10' : 'border-zinc-800 text-zinc-500 bg-zinc-900'}`}
          >
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-700'}`} />
            <span>{isActive ? "Live Voting Open" : "Polling Streams Locked"}</span>
          </button>
        </div>
      </div>

      {/* ================= HIGH-DENSITY FINANCIAL & TELEMETRY CARD GRIDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Card 1: Gross Revenue Collection */}
        <div className="bg-[#0a192a]/50 border border-zinc-800 p-4 rounded-xl relative overflow-hidden">
          <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1">
            <CircleDollarSign className="w-3.5 h-3.5 text-emerald-500" /> Gross Revenue Collected
          </p>
          <h3 className="text-2xl font-black text-white mt-1.5 font-mono">
            ₵{paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-zinc-400 mt-2 font-medium flex items-center gap-1">
            Net balance: <span className="text-emerald-400 font-bold">₵{netRevenueCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </p>
        </div>

        {/* Card 2: Platform Deduction Rate */}
        <div className="bg-[#0a192a]/50 border border-zinc-800 p-4 rounded-xl">
          <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1">
            <Percent className="w-3.5 h-3.5 text-purple-400" /> Deduction Rate
          </p>
          <h3 className="text-2xl font-black text-purple-400 mt-1.5 font-mono">
            {deductionRate}% <span className="text-xs text-zinc-600 font-sans font-normal">flat fee</span>
          </h3>
          <p className="text-[10px] text-zinc-500 mt-2 font-medium">
            Abs. cut: ₵{paymentDeduction.toLocaleString(undefined, { minimumFractionDigits: 2 })} GHS
          </p>
        </div>

        {/* Card 3: Unit Price Per Vote */}
        <div className="bg-[#0a192a]/50 border border-zinc-800 p-4 rounded-xl">
          <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-amber-500" /> Unit Cost per Vote
          </p>
          <h3 className="text-2xl font-black text-zinc-100 mt-1.5 font-mono">
            {event.unitPrice != null ? `₵${Number(event.unitPrice).toFixed(2)}` : "—"} <span className="text-xs text-zinc-500 font-sans font-normal">GHS</span>
          </h3>
          <p className="text-[10px] text-zinc-500 mt-2 font-medium">
            Applies to both USSD and Web integrations
          </p>
        </div>

        {/* Card 4: Accumulated Vote Count Density */}
        <div className="bg-[#0a192a]/50 border border-zinc-800 p-4 rounded-xl">
          <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-orange-500" /> Aggregate Votes Cast
          </p>
          <h3 className="text-2xl font-black text-white mt-1.5 font-mono">
            {(event.counts?.votesCast ?? 0).toLocaleString()}
          </h3>
          <p className="text-[10px] text-emerald-400 mt-2 font-medium flex items-center gap-1">
            Stream data ticker sync healthy
          </p>
        </div>

      </div>

      {/* ================= INTERACTIVE WORKSPACE SECTOR CARDS ================= */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4 flex items-center gap-2 select-none">
          <LayoutGrid className="w-4 h-4" /> Structural Sectors
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* MODULE SECTOR 1: CATEGORIES ARCHITECTURE */}
          <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-all group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-purple-950/30 border border-purple-900/30 flex items-center justify-center">
                  <FolderTree className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-1 rounded">
                  {event.counts?.categories ?? 0} Sections Registered
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Voting Categories</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Configure official ballot subdivisions (e.g. "Artist of the Year"), modify alphanumeric interaction codes, and handle sequential dashboard lists.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-6 border-t border-zinc-900 pt-4 w-full">
              <Link
                to="/admin/events/$eventId/categories/new"
                params={{ eventId: String(event.id) }}
                className="flex-1 inline-flex items-center justify-center gap-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs py-2 rounded-lg font-medium transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> <span>Deploy Category</span>
              </Link>
              <Link
                to="/admin/events/$eventId/categories"
                params={{ eventId: String(event.id) }}
                className="inline-flex items-center justify-center w-10 h-8 rounded-lg border border-zinc-800 bg-[#0a192a]/50 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                title="Open Categories Directory"
              >
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* MODULE SECTOR 2: CONTESTANTS PROFILES */}
          <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-all group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-orange-950/30 border border-orange-900/30 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-orange-400" />
                </div>
                <span className="text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-1 rounded">
                  {event.counts?.contestants ?? 0} Enrolled Profiles
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Nominees & Contestants</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Enroll participants, set short description taglines, process image path file uploads to S3/R2 storage, and modify layout sorting order sequences.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-6 border-t border-zinc-900 pt-4 w-full">
              <Link
                to="/admin/events/$eventId/contestants/new"
                params={{ eventId: String(event.id) }}
                className="flex-1 inline-flex items-center justify-center gap-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs py-2 rounded-lg font-medium transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> <span>Enroll Contestant</span>
              </Link>
              <Link
                to="/admin/events/$eventId/contestants"
                params={{ eventId: String(event.id) }}
                className="inline-flex items-center justify-center w-10 h-8 rounded-lg border border-zinc-800 bg-[#0a192a]/50 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                title="Open Contestants Directory"
              >
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* MODULE SECTOR 3: VOTE TRANSACTIONS LEDGER */}
          <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-all group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-emerald-950/30 border border-emerald-900/30 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-1 rounded">
                  {event.counts?.transactions ?? 0} Recorded
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Vote Transactions</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Track pay-per-vote transactions, confirm payment status, and manually record or adjust vote credits.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-6 border-t border-zinc-900 pt-4 w-full">
              <Link
                to="/admin/events/$eventId/transactions/new"
                params={{ eventId: String(event.id) }}
                className="flex-1 inline-flex items-center justify-center gap-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs py-2 rounded-lg font-medium transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> <span>Record Transaction</span>
              </Link>
              <Link
                to="/admin/events/$eventId/transactions"
                params={{ eventId: String(event.id) }}
                className="inline-flex items-center justify-center w-10 h-8 rounded-lg border border-zinc-800 bg-[#0a192a]/50 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                title="Open Transactions Ledger"
              >
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* ================= LIVE STREAM / RESULTS ACTION NOTIFICATION ROW ================= */}
      <div className="bg-gradient-to-r from-purple-950/20 via-[#0a192a]/50 to-[#0a192a]/50 rounded-xl border border-zinc-800 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Results &amp; Live Turnout Stream</h4>
            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
              Print certified category results, export the full tally and transaction ledger to Excel, or open the live telemetry canvas as votes arrive.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => navigate({ to: `/admin/events/${event?.id}/results` })}
            className="w-full sm:w-auto flex items-center justify-center gap-1 text-center px-4 py-2 bg-green-600 hover:bg-purple-500 text-xs font-semibold text-white rounded-lg transition-all shadow-sm shrink-0"
          >
            <Activity className="h-4 animate-pulse" />
            <span>Print Results</span>
          </button>
          <button
            onClick={handleExportResults}
            disabled={isExportingResults}
            className="w-full sm:w-auto flex items-center justify-center gap-1 text-center px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed bg-green-600 hover:bg-purple-500 text-xs font-semibold text-white rounded-lg transition-all shadow-sm shrink-0"
          >
            {isExportingResults ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            <span>Export Results</span>
          </button>
          <Link
            to="/admin/events/$eventId/feed"
            params={{ eventId: String(event.id) }}
            className="w-full sm:w-auto text-center px-4 py-2 bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white rounded-lg transition-all shadow-md shrink-0"
          >
            Open Live Telemetry Feed
          </Link>
        </div>
      </div>

    </div>
  );
}
