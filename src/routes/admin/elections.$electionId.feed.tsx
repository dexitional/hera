import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { 
  BarChart3, Users, Award, ShieldAlert, Activity, 
  RefreshCw, CheckCircle2, User, HelpCircle,
  Loader2, Ban
} from "lucide-react";
// cspell:ignore USSD INFOBAR
import { getUnifiedElectionTelemetry } from "#/server/tenant-elections";
import { useSuspenseQuery } from "@tanstack/react-query";

interface CandidateTally {
  id: number | null; 
  name: string;
  imageUrl: string | null;
  votes: number;
}

interface PositionFeedGroup {
  id: number;
  title: string;
  slots: number;
  totalVotesForPosition: number;
  candidates: CandidateTally[];
}

interface AuditLogEntry {
  id: string;
  positionTitle: string;
  voterMask: string;     
  channel: "USSD" | "WEB";
  timestamp: string;
}

const electionsQueryOptions = (electionId: any) => ({
  queryKey: ['election-telemetry', electionId ],
  queryFn: () => getUnifiedElectionTelemetry({ data: electionId }),
  refetchInterval: 30 * 1000, 
  staleTime: 30 * 1000,
  refetchIntervalInBackground: true, 
});

export const Route = createFileRoute("/admin/elections/$electionId/feed")({
  component: ElectionLiveFeed,
  loader: async ({ context, params }: any) => {
    const electionId = params.electionId;
    await context.queryClient.ensureQueryData(electionsQueryOptions(electionId));
  },
  pendingComponent: () => (
    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-purple-500" /></div>
  ),
});

export default function ElectionLiveFeed() {
  const { electionId } = Route.useParams(); 
  let { data: { electionDetails, tallies: ballotTally, auditLedger: auditLog }}: any = useSuspenseQuery(electionsQueryOptions(electionId));
  
  const [isSyncing, setIsSyncing] = useState(false);

  const totalVotesCast = ballotTally && ballotTally.length > 0 
    ? Math.max(...ballotTally.map((p: any) => p.totalVotesForPosition || 0)) 
    : 0;

  const totalEligible = electionDetails?.totalEligibleVoters || 1; 
  const turnoutPercentage = ((totalVotesCast / totalEligible) * 100).toFixed(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsSyncing(true);
      setTimeout(() => setIsSyncing(false), 400);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6 text-zinc-200 font-sans select-none overflow-x-hidden">
        
        {/* ================= STREAM CONSOLE INFOBAR HEADER ================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a192a]/50 p-6 rounded-xl border border-zinc-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono uppercase tracking-wider">
              <Link to={`/admin/elections`} className="hover:text-purple-400 transition-colors">Management Console</Link>
              <span>/</span>
              <span className="text-zinc-400 select-all">Live Stream Metrics Feed</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 mt-1">
              <Activity className={`w-5 h-5 text-purple-400 \${isSyncing ? 'animate-pulse text-purple-300' : ''}`} />
              <span>Real-Time Audit: {electionDetails?.title}</span>
            </h1>
          </div>

          <div className="inline-flex items-center gap-2 text-xs bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-lg select-none shrink-0 font-medium">
            <RefreshCw className={`w-3.5 h-3.5 text-purple-400 \${isSyncing ? 'animate-spin' : ''}`} />
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
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Aggregate Turnout</p>
              <h3 className="text-2xl font-black text-white mt-1 font-mono">
                {!isNaN(parseFloat(turnoutPercentage)) ? turnoutPercentage : "0.0"}%
              </h3>
            </div>
            <Users className="w-8 h-8 text-zinc-800" />
          </div>
          <div className="bg-[#0a192a]/50 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Verified Ballots Cast</p>
              <h3 className="text-2xl font-black text-purple-400 mt-1 font-mono">{totalVotesCast.toLocaleString()}</h3>
            </div>
            <BarChart3 className="w-8 h-8 text-zinc-800" />
          </div>
          <div className="bg-[#0a192a]/50 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Eligible Registers</p>
              <h3 className="text-2xl font-black text-zinc-400 mt-1 font-mono">
                {electionDetails?.totalEligibleVoters?.toLocaleString() || 0}
              </h3>
            </div>
            <Award className="w-8 h-8 text-zinc-800" />
          </div>
        </div>

        {/* ================= PRIMARY GRID MATRIX SYNC PANELS ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT CONTAINER LAYER: LIVE BAR CHART GRIDS PER OFFICE DESIGNATION */}
          <div className="lg:col-span-2 space-y-6">
            {ballotTally?.map((position: any) => (
              <div key={position.id} className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-xl">
                
                {/* Office Header Row block */}
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-bold text-white tracking-tight">{position.title}</h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                    Total: {position.totalVotesForPosition} votes
                  </span>
                </div>

                {/* Candidate Vote Visual Progress Accumulator Bars Matrix */}
                <div className="space-y-4 pt-1">
                  {position?.candidates?.map((candidate: any) => {
                    const isAbstain = candidate.id === null || candidate.id === -1;
                    const percentageShares = position.totalVotesForPosition > 0 
                      ? ((candidate.votes / position.totalVotesForPosition) * 100).toFixed(1)
                      : "0.0";
                    const clampedWidth = Math.min(parseFloat(percentageShares), 100);

                    return (
                      <div key={candidate.id ?? `abstain-\${position.id}`} className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-medium">
                          
                          {/* Image Thumbnail and Name Info Node */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded border overflow-hidden flex items-center justify-center shrink-0 \${
                              isAbstain ? 'bg-amber-950/40 border-amber-900/40' : 'bg-zinc-900 border-zinc-800'
                            }`}>
                              {isAbstain ? (
                                <Ban className="w-3.5 h-3.5 text-amber-500" />
                              ) : candidate.imageUrl ? (
                                <img src={candidate.imageUrl} alt={candidate.name} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-3.5 h-3.5 text-zinc-600" />
                              )}
                            </div>
                            <span className={`font-semibold truncate max-w-[180px] md:max-w-xs \${
                              isAbstain ? 'text-amber-400' : 'text-zinc-200'
                            }`}>
                              {isAbstain ? "Abstained (Blank Ballots)" : candidate.name}
                            </span>
                          </div>

                          {/* Numeric Accumulation Tally Indicator */}
                          <div className="text-right shrink-0 font-mono text-[11px] font-bold text-zinc-400">
                            <span className={isAbstain ? 'text-amber-500 text-xs' : 'text-white text-xs'}>
                              {candidate.votes.toLocaleString()}
                            </span>
                            <span className="text-zinc-600 font-normal px-1">·</span>
                            <span className={isAbstain ? 'text-amber-400' : 'text-purple-400'}>
                              {percentageShares}%
                            </span>
                          </div>

                        </div>

                        {/* Custom Data Horizontal Progression Line Chart Component */}
                        {/* <div className="w-full bg-zinc-900/60 h-2 rounded-full overflow-hidden border border-zinc-900 relative">
                          <div 
                            className="bg-gradient-to-r from-purple-600 to-purple-400 h-full rounded-full transition-all duration-500 ease-out" 
                            style={{ width: `${percentageShares}%` }}
                          />
                        </div> */}

                        {/* Custom Horizontal Progression Outer Container Track */}
                        <div className="w-full bg-zinc-950/80 h-2 rounded-full overflow-hidden border border-zinc-900 relative shadow-inner">
                          <div 
                            className={`h-full rounded-full transition-all duration-700 ease-out ${
                              isAbstain 
                                ? "bg-gradient-to-r from-amber-600 to-orange-500 shadow-[0_0_12px_rgba(245,158,11,0.3)] border-r border-amber-400/30" 
                                : "bg-gradient-to-r from-purple-600 to-indigo-500 shadow-[0_0_10px_rgba(147,51,234,0.15)] border-r border-purple-400/30"
                            }`}
                            style={{ width: `${clampedWidth}%` }}
                            role="progressbar"
                            aria-valuenow={clampedWidth}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          />
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
              )) 
            }
          </div>

          {/* RIGHT CONTAINER LAYER: LIVE AUDIT LOG LEDGER STREAM */}
          <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="border-b border-zinc-900 pb-3 flex items-center justify-between select-none">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Electoral Audit Ledger</span>
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            </div>

            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Cryptographically timestamped transaction streams indicating individual ballot drop channels across server verification queues.
            </p>

            {/* Scrolling Transaction Rows Stack Module */}
            <div className="space-y-2.5 pt-2 max-h-[380px] overflow-y-auto pr-1">
              {auditLog?.map((log: any) => (
                <div 
                  key={log.id} 
                  className="bg-zinc-900/30 border border-zinc-900 hover:border-zinc-800/80 p-2.5 rounded-lg flex items-center justify-between gap-3 text-xs font-mono transition-all animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-purple-400 font-bold text-[10px] bg-purple-950/20 border border-purple-900/30 px-1 rounded">
                        {log.id}
                      </span>
                      <span className="text-zinc-200 font-sans font-semibold truncate block max-w-[120px]">
                        {log.positionTitle}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-500 font-sans font-medium flex items-center gap-1">
                      <span>Mask:</span>
                      <span className="text-zinc-400 font-mono font-bold select-all">{log.voterMask}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-1 font-sans">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border select-none ${log.channel === "USSD" ? 'border-amber-900/30 text-amber-400 bg-amber-950/20' : 'border-blue-900/30 text-blue-400 bg-blue-950/20'}`}>
                      {log.channel}
                    </span>
                    <span className="text-[10px] text-zinc-600 font-mono tracking-tighter mt-0.5">
                      {log.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Base Security Assurance Notice */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-3 rounded-lg text-[10px] text-zinc-400 flex items-start gap-2 leading-relaxed">
              <ShieldAlert className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
              <span>To protect secret ballot rights, voter telephone links undergo hardware hashing methods inside cryptographic index files.</span>
            </div>

          </div>

        </div>

    </div>
  );
}
