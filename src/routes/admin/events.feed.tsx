import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { 
  Activity, RefreshCw, BarChart3, Users, Award, 
  Coins, User, ShieldAlert, CheckCircle2, Flame 
} from "lucide-react";

interface NomineeTally {
  id: number;
  name: string;
  imageUrl: string;
  tagline: string;
  votes: number;
}

interface LiveCategoryGroup {
  id: number;
  name: string;
  code: string;
  totalVotesForCategory: number;
  contestants: NomineeTally[];
}

interface LiveVoteAudit {
  id: string;
  categoryName: string;
  contestantName: string;
  voterPhoneMask: string;
  channel: "USSD" | "WEB";
  timestamp: string;
}

export const Route = createFileRoute("/admin/events/feed")({
  component: EventLiveMetricsFeed,
});

function EventLiveMetricsFeed() {
  // Mock meta mapping core table state variables
  const eventMeta = {
    id: 1,
    title: "2026 National Music Awards",
    unitPrice: 1.50,
  };

  // State mimicking live records streaming from combined contestants + votes joins
  const [ballotTally, setBallotTally] = useState<LiveCategoryGroup[]>( puddings );

  // State tracking live incoming ledger streams from the underlying 'votes' table
  const [auditStream, setAuditStream] = useState<LiveVoteAudit[]>([
    { id: "v_9a2b", categoryName: "Artist of the Year", contestantName: "Stonebwoy", voterPhoneMask: "+233 24 **** 567", channel: "WEB", timestamp: "Just now" },
    { id: "v_4f1e", categoryName: "Best Rapper of the Year", contestantName: "Sarkodie", voterPhoneMask: "+233 20 **** 123", channel: "USSD", timestamp: "1m ago" },
    { id: "v_7c8d", categoryName: "Artist of the Year", contestantName: "Sarkodie", voterPhoneMask: "+233 55 **** 890", channel: "WEB", timestamp: "2m ago" },
  ]);

  const [isSyncing, setIsSyncing] = useState(false);

  // Core global aggregations
  const totalVotesCast = ballotTally.reduce((sum, cat) => sum + cat.totalVotesForCategory, 0);
  const estimatedRevenue = totalVotesCast * eventMeta.unitPrice;

  // High-concurrency data streaming ticker emulation
  useEffect(() => {
    const interval = setInterval(() => {
      setIsSyncing(true);
      
      // Randomly inject incoming vote ticks to simulate micro-transaction streams
      setBallotTally((prev) => 
        prev.map((category) => {
          let categoryNewTotal = 0;
          const updatedContestants = category.contestants.map((cand) => {
            const randomTick = Math.random() > 0.5 ? Math.floor(Math.random() * 4) : 0;
            const updatedVotes = cand.votes + randomTick;
            categoryNewTotal += updatedVotes;

            // Prepend single item directly into the ledger if it hits a lucky transaction tick
            if (randomTick > 0 && Math.random() > 0.7) {
              setAuditStream((prevLog) => [
                {
                  id: `v_${Math.random().toString(16).slice(2, 6)}`,
                  categoryName: category.name,
                  contestantName: cand.name,
                  voterPhoneMask: `+233 ${Math.random() > 0.5 ? '24' : '50'} **** ${Math.floor(100 + Math.random() * 900)}`,
                  channel: Math.random() > 0.5 ? "USSD" : "WEB",
                  timestamp: "Just now",
                },
                ...prevLog.slice(0, 4),
              ]);
            }

            return { ...cand, votes: updatedVotes };
          });

          return { 
            ...category, 
            contestants: updatedContestants, 
            totalVotesForCategory: categoryNewTotal 
          };
        })
      );

      setTimeout(() => setIsSyncing(false), 350);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ================= TELEMETRY HEADER RIBBON ================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a192a]/50 p-6 rounded-xl border border-zinc-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono uppercase tracking-wider">
              <Link to={`/admin/events`} className="hover:text-purple-400 transition-colors">Management Console</Link>
              <span>/</span>
              <span className="text-zinc-400 select-all">Live Stream Metrics Canvas</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 mt-1">
              <Activity className={`w-5 h-5 text-purple-400 ${isSyncing ? "animate-pulse" : ""}`} />
              <span>Live Statistics Feed: {eventMeta.title}</span>
            </h1>
          </div>

          <div className="inline-flex items-center gap-2 text-xs bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-lg select-none shrink-0 font-medium">
            <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${isSyncing ? "animate-spin" : ""}`} />
            <span className="text-zinc-400">Sync Pipeline:</span>
            <span className="text-emerald-400 font-semibold tracking-wide uppercase text-[10px] bg-emerald-950/20 border border-emerald-900/30 px-1.5 py-0.5 rounded-sm">
              Live Listening
            </span>
          </div>
        </div>

        {/* ================= GLOBAL METRICS OVERVIEW ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#0a192a]/50 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Gross Ballots Ingested</p>
              <h3 className="text-2xl font-black text-purple-400 mt-1 font-mono">{totalVotesCast.toLocaleString()}</h3>
            </div>
            <BarChart3 className="w-8 h-8 text-zinc-900" />
          </div>
          <div className="bg-[#0a192a]/50 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Est. Pipeline Invoiced</p>
              <h3 className="text-2xl font-black text-white mt-1 font-mono">₵{estimatedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            </div>
            <Coins className="w-8 h-8 text-zinc-900" />
          </div>
          <div className="bg-[#0a192a]/50 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Unit Elastic Cost</p>
              <h3 className="text-2xl font-black text-zinc-400 mt-1 font-mono">₵{eventMeta.unitPrice.toFixed(2)} <span className="text-xs text-zinc-600 font-sans font-normal">GHS</span></h3>
            </div>
            <Users className="w-8 h-8 text-zinc-900" />
          </div>
        </div>

        {/* ================= PRIMARY CONTENT SPLIT GRID ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT: CANDIDATE VOTE PROGRESSION CARDS PER CATEGORY */}
          <div className="lg:col-span-2 space-y-6">
            {ballotTally.map((category) => (
              <div key={category.id} className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-xl">
                
                {/* Category Identity Section Header */}
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-bold text-white tracking-tight">{category.name}</h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                    code: *920*{category.code}# · {category.totalVotesForCategory.toLocaleString()} votes
                  </span>
                </div>

                {/* Sub-Contestants Progression Matrix Bars stack */}
                <div className="space-y-4 pt-1">
                  {category.contestants.map((nominee) => {
                    const shares = category.totalVotesForCategory > 0
                      ? ((nominee.votes / category.totalVotesForCategory) * 100).toFixed(1)
                      : "0.0";

                    return (
                      <div key={nominee.id} className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-medium">
                          
                          {/* Image Thumbnail profile node block layout */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
                              {nominee.imageUrl ? (
                                <img src={nominee.imageUrl} alt={nominee.name} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-4 h-4 text-zinc-600" />
                              )}
                            </div>
                            <div className="min-w-0 flex flex-col">
                              <span className="text-zinc-200 font-semibold truncate max-w-[200px]">{nominee.name}</span>
                              <span className="text-[10px] text-zinc-500 truncate max-w-[200px] mt-0.5">{nominee.tagline}</span>
                            </div>
                          </div>

                          {/* Metric Numeric Tally Indicators Column */}
                          <div className="text-right shrink-0 font-mono text-[11px] font-bold text-zinc-400">
                            <span className="text-white text-xs">{nominee.votes.toLocaleString()}</span>
                            <span className="text-zinc-700 font-normal px-1">·</span>
                            <span className="text-purple-400">{shares}%</span>
                          </div>

                        </div>

                        {/* Progression bar visual graphics gauge line element */}
                        <div className="w-full bg-zinc-900/60 h-2 rounded-full overflow-hidden border border-zinc-900 relative">
                          <div 
                            className="bg-gradient-to-r from-purple-600 to-purple-400 h-full rounded-full transition-all duration-500 ease-out" 
                            style={{ width: `${shares}%` }}
                          />
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            ))}
          </div>

          {/* RIGHT: REAL-TIME AUDIT LOG TRAIL STREAM */}
          <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="border-b border-zinc-900 pb-3 flex items-center justify-between select-none">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Electoral Audit Ledger</span>
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            </div>

            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Cryptographically verified vote ingestion drop tokens streaming from active USSD infrastructure switches and Web browser gateways.
            </p>

            {/* Scrollable Ledger list row nodes */}
            <div className="space-y-2.5 pt-2 max-h-[440px] overflow-y-auto pr-1">
              {auditStream.map((log) => (
                <div 
                  key={log.id} 
                  className="bg-zinc-900/30 border border-zinc-900 hover:border-zinc-800/80 p-2.5 rounded-lg flex items-center justify-between gap-3 text-xs font-mono transition-all animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-purple-400 font-bold text-[10px] bg-purple-950/20 border border-purple-900/30 px-1 rounded shrink-0">
                        {log.id}
                      </span>
                      <span className="text-zinc-200 font-sans font-semibold truncate block max-w-[120px]">
                        {log.contestantName}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-500 font-sans font-medium truncate">
                      {log.categoryName} · Mask: <span className="font-mono text-zinc-400 font-bold">{log.voterPhoneMask}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-1 font-sans select-none">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${log.channel === "USSD" ? 'border-amber-900/30 text-amber-400 bg-amber-950/20' : 'border-blue-900/30 text-blue-400 bg-blue-950/20'}`}>
                      {log.channel}
                    </span>
                    <span className="text-[10px] text-zinc-600 font-mono tracking-tighter mt-0.5">
                      {log.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Privacy Legal Anchor Notice */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-3 rounded-lg text-[10px] text-zinc-400 flex items-start gap-2 leading-relaxed">
              <ShieldAlert className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
              <span>Secret ballot variables undergo hardware hashing pipelines matching data security regulations. Phone details are permanently obfuscated.</span>
            </div>

          </div>

        </div>

    </div>
  );
}

// Fallback seed configuration mock records data state matrix
const INITIAL_BAL_TALLY: LiveCategoryGroup[] = [
  {
    id: 1,
    name: "Artist of the Year",
    code: "001",
    totalVotesForCategory: 27342,
    contestants: [
      { id: 10, name: "Stonebwoy", tagline: "Defending Reggae/Dancehall Pioneer", imageUrl: "https://festora-storage.internal", votes: 14502 },
      { id: 11, name: "Sarkodie", tagline: "Decorated African Rap Icon", imageUrl: "", votes: 12840 },
    ]
  },
  {
    id: 2,
    name: "Best Rapper of the Year",
    code: "002",
    totalVotesForCategory: 8930,
    contestants: [
      { id: 20, name: "M.anifest", tagline: "Premium Wordplay Lyricist", imageUrl: "", votes: 5120 },
      { id: 21, name: "Kwesi Arthur", tagline: "GroundUp Chale Pioneer Anthem Lead", imageUrl: "", votes: 3810 },
    ]
  }
];
const puddings = INITIAL_BAL_TALLY;
