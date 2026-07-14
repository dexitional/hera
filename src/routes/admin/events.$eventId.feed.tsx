import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  BarChart3, Award, ShieldAlert, Activity, Coins,
  RefreshCw, CheckCircle2, User, Receipt,
  Loader2, ChevronLeft, ChevronRight, ArrowLeft
} from "lucide-react";
import { getEventTelemetryFn } from "#/server/tenant-events";
import { useSuspenseQuery } from "@tanstack/react-query";

const eventTelemetryQueryOptions = (eventId: any) => ({
  queryKey: ['event-telemetry', eventId],
  queryFn: () => getEventTelemetryFn({ data: eventId } as any),
  refetchInterval: 15 * 1000,
  staleTime: 15 * 1000,
  refetchIntervalInBackground: true,
});

export const Route = createFileRoute("/admin/events/$eventId/feed")({
  component: EventLiveFeed,
  loader: async ({ context, params }: any) => {
    const eventId = params.eventId;
    await context.queryClient.ensureQueryData(eventTelemetryQueryOptions(eventId));
  },
  pendingComponent: () => (
    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-purple-500" /></div>
  ),
});

function EventLiveFeed() {
  const { eventId } = Route.useParams();
  const { data: { eventDetails, summary, tallies: ballotTally, auditLedger: auditLog } }: any = useSuspenseQuery(eventTelemetryQueryOptions(eventId));

  const [isSyncing, setIsSyncing] = useState(false);

  // ================= STATE HOOKS FOR PORTFOLIO SLIDER =================
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsSyncing(true);
      setTimeout(() => setIsSyncing(false), 400);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      autoSlide();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Safe parameters definitions for carousel controls bounds
  const totalCategoriesCount = ballotTally?.length || 0;
  const currentActiveCategory = ballotTally?.[currentCategoryIndex];

  const handlePrevSlide = () => {
    setCurrentCategoryIndex((prev) => (prev <= 0 ? totalCategoriesCount - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentCategoryIndex((prev) => (prev >= totalCategoriesCount - 1 ? 0 : prev + 1));
  };

  const autoSlide = () => {
    setCurrentCategoryIndex((prev) => (prev >= totalCategoriesCount - 1 ? 0 : prev + 1));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6 text-zinc-200 font-sans select-none overflow-x-hidden">

      {/* ================= BACK NAVIGATION ================= */}
      <Link
        to="/admin/events/$eventId/manage"
        params={{ eventId }}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Management Console
      </Link>

      {/* ================= STREAM CONSOLE INFOBAR HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a192a]/50 p-6 rounded-xl border border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono uppercase tracking-wider">
            <Link
              to="/admin/events/$eventId/manage"
              params={{ eventId }}
              className="hover:text-purple-400 transition-colors"
            >
              Management Console
            </Link>
            <span>/</span>
            <span className="text-zinc-400 select-all">Live Stream Metrics Feed</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 mt-1">
            <Activity className={`w-5 h-5 text-purple-400 ${isSyncing ? 'animate-pulse text-purple-300' : ''}`} />
            <span>Real-Time Audit: {eventDetails?.title}</span>
          </h1>
        </div>

        <div className="inline-flex items-center gap-2 text-xs bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-lg select-none shrink-0 font-medium">
          <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="text-zinc-400">Stream Status:</span>
          <span className="text-emerald-400 font-semibold tracking-wide uppercase text-[10px] bg-emerald-950/20 border border-emerald-900/30 px-1.5 py-0.5 rounded-sm">
            Live Listening
          </span>
        </div>
      </div>

      {/* ================= CORE SYSTEM TRACKING SUMMARY PANELS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0a192a]/50 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Gross Revenue Collected</p>
            <h3 className="text-2xl font-black text-white mt-1 font-mono">
              ₵{(summary?.totalAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <Coins className="w-8 h-8 text-zinc-800" />
        </div>
        <div className="bg-[#0a192a]/50 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Verified Votes Cast</p>
            <h3 className="text-2xl font-black text-purple-400 mt-1 font-mono">{(summary?.totalVotes ?? 0).toLocaleString()}</h3>
          </div>
          <BarChart3 className="w-8 h-8 text-zinc-800" />
        </div>
        <div className="bg-[#0a192a]/50 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Paid Transactions</p>
            <h3 className="text-2xl font-black text-zinc-400 mt-1 font-mono">
              {(summary?.totalTransactions ?? 0).toLocaleString()}
            </h3>
          </div>
          <Receipt className="w-8 h-8 text-zinc-800" />
        </div>
      </div>

      {/* ================= PRIMARY GRID MATRIX SYNC PANELS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* LEFT CONTAINER LAYER: CATEGORY SECTION SLIDER CAROUSEL */}
        <div className="lg:col-span-2 space-y-4">

          {/* Slider Header Context Row Selector Panel */}
          <div className="flex items-center justify-between bg-zinc-900/40 border border-zinc-800 p-3 rounded-xl">
            <span className="text-xs text-zinc-400 font-medium">
              Category <b className="text-purple-400 font-mono">{totalCategoriesCount > 0 ? currentCategoryIndex + 1 : 0}</b> of <b className="text-white font-mono">{totalCategoriesCount}</b>
            </span>

            <div className="flex gap-2">
              <button
                onClick={handlePrevSlide}
                disabled={totalCategoriesCount <= 1}
                className="p-1.5 rounded-lg border border-zinc-800 bg-[#0a192a]/50 hover:bg-zinc-800 transition-all text-zinc-300 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextSlide}
                disabled={totalCategoriesCount <= 1}
                className="p-1.5 rounded-lg border border-zinc-800 bg-[#0a192a]/50 hover:bg-zinc-800 transition-all text-zinc-300 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Active Category Slide Display Card */}
          {currentActiveCategory ? (
            <div key={currentActiveCategory.id} className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-xl transition-all duration-300 animate-in fade-in-50 duration-200">

              {/* Category Header Row block */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white tracking-tight">{currentActiveCategory.title}</h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                  Total: {currentActiveCategory.totalVotesForPosition} votes
                </span>
              </div>

              {/* Contestant Vote Visual Progress Accumulator Bars Matrix */}
              <div className="grid grid-cols-3 gap-3">
                {currentActiveCategory?.candidates?.map((contestant: any) => {
                  const percentageShares = currentActiveCategory.totalVotesForPosition > 0
                    ? ((contestant.votes / currentActiveCategory.totalVotesForPosition) * 100).toFixed(1)
                    : "0.0";
                  const clampedWidth = Math.min(parseFloat(percentageShares), 100);

                  return (
                    <div key={contestant.id} className="space-y-2.5 rounded-lg border border-zinc-800/60 bg-zinc-900/30 p-3">

                      {/* Enlarged Contestant Photo Panel */}
                      <div className="flex justify-center">
                        <div className="w-2/3 aspect-square rounded-lg border overflow-hidden flex items-center justify-center shrink-0 bg-zinc-900 border-zinc-800">
                          {contestant.imageUrl ? (
                            <img src={contestant.imageUrl} alt={contestant.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-8 h-8 text-zinc-500" />
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-2 text-xs font-medium">

                        {/* Name and Tagline Info Node */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="min-w-0 flex flex-col gap-1 text-center">
                            <p className="text-zinc-200 font-semibold truncate tracking-wide">{contestant.name}</p>
                            {contestant.teaser ? (
                              <p className="text-[10px] text-zinc-500 italic truncate">{contestant.teaser}</p>
                            ) : null}
                          </div>
                        </div>

                        {/* Numerical Vote Shares Data Count Labels */}
                        <div className="flex items-center gap-2 font-mono text-[11px] font-bold shrink-0">
                          {contestant.ballotNumber != null && (
                            <span className="mr-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zinc-500 bg-zinc-900 font-mono text-[9px] font-bold text-zinc-400 italic">
                              {contestant.ballotNumber}
                            </span>
                          )}
                          <span className="text-purple-400">{contestant.votes.toLocaleString()}</span>
                          <span className="text-zinc-600">|</span>
                          <span className="text-white">{percentageShares}%</span>
                        </div>
                      </div>

                      {/* Outer Progress Bar Runway */}
                      <div className="w-full bg-zinc-900 border border-zinc-800/60 h-2.5 rounded-full overflow-hidden p-0.5">
                        <div
                          style={{ width: `${clampedWidth}%` }}
                          className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-purple-600 to-indigo-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500 text-xs italic">
              No active voting categories or tallies tracked for this event.
            </div>
          )}
        </div>

        {/* RIGHT CONTAINER LAYER: AUDIT LOG LEDGER PANEL */}
        <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">Vote Transaction Ledger</h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-zinc-500">
              {auditLog?.length || 0} Entries
            </span>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
            {auditLog && auditLog.length > 0 ? (
              auditLog.map((log: any, idx: number) => (
                <div key={log.id ?? idx} className="flex gap-2.5 items-start bg-zinc-900/30 p-2.5 rounded border border-zinc-800/40 text-xs text-zinc-400 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-zinc-300 leading-tight truncate">{log.positionTitle}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-zinc-600 font-sans">
                        {log.voterMask} · {log.channel} · {log.votes} votes
                      </span>
                      <span className="text-[10px] text-zinc-600 font-sans shrink-0">{log.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-zinc-500 text-xs italic py-6 text-center">
                Awaiting data stream packet logs...
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
