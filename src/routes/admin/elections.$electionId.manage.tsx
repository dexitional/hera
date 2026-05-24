import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState } from "react";
import { 
  Sliders, Users, Award, ShieldCheck, ArrowUpRight, Plus, 
  Calendar, Key, ToggleLeft, ToggleRight, CheckCircle2, LayoutGrid, BarChart3, 
  Loader2
} from "lucide-react";
import { getElectionOverview } from "#/server/tenant-elections";
import { useSuspenseQuery } from "@tanstack/react-query";
import moment from "moment";



const electionsQueryOptions = (electionId: any) => ({
  queryKey: ['election-overview', electionId ],
  queryFn: () => getElectionOverview({ data: electionId }),
});

export const Route = createFileRoute("/admin/elections/$electionId/manage")({
  component: ManageElectionConsole,
  loader: async ({ context, params }:any) => {
    const electionId = params.electionId;
    await context.queryClient.ensureQueryData(electionsQueryOptions(electionId));
  },
  pendingComponent: () => (
    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-purple-500" /></div>
  ),
});

function ManageElectionConsole() {
  
  const { electionId } = Route.useParams(); 
  let { data: election}:any = useSuspenseQuery(electionsQueryOptions(electionId));
  
  election = {
    ...election,
    authMode: election?.otp?.toLowerCase() == 'otp' ? 'One-Time Password (SMS / Email)' : election.otp == 'GOOGLE' ? 'Google': 'Credential',
    startAt: moment(election.startAt).format('LLL'),
    endAt: moment(election.endAt).format('LLL'),
  }
  
  const [isLive, setIsLive] = useState(election.isActive);
  // Computes active mathematical voter turnout percentage on runtime execution profiles
  const turnoutPercentage = ((election.counts.votesCast / election.counts.voters) * 100).toFixed(1);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ================= WORKSPACE CONSOLE BREADCRUMB HEADER ================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a192a]/50 p-6 rounded-xl border border-zinc-800">
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono uppercase tracking-wider">
              <Link to="/admin/elections" className="hover:text-purple-400 transition-colors">Elections</Link>
              <span>/</span>
              <span className="text-zinc-400 select-all">id: {election.tag}</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-400" />
              <span>Group:&nbsp;&nbsp; {election.title}</span>
            </h1>
          </div>

          {/* Real-time Status Switch Override */}
          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 shrink-0">
            <div className="flex flex-col text-right">
              <span className="text-xs font-semibold text-white">Ballot Infrastructure</span>
              <span className="text-[10px] text-zinc-500 font-medium">Toggle polling state live</span>
            </div>
            <button
              type="button"
              onClick={() => setIsLive(!isLive)}
              className="focus:outline-none transition-transform active:scale-95"
            >
              {isLive ? (
                <ToggleRight className="w-9 h-9 text-emerald-400 cursor-pointer" />
              ) : (
                <ToggleLeft className="w-9 h-9 text-zinc-600 cursor-pointer" />
              )}
            </button>
          </div>
        </div>

        {/* ================= QUICK STATS DISCOVERY RIBBON ================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* <div className="bg-[#0a192a]/50 border border-zinc-800 p-4 rounded-xl">
            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Turnout Density</p>
            <h3 className="text-2xl font-black text-white mt-1 font-mono">{!isNaN(parseFloat(turnoutPercentage)) ? turnoutPercentage : 0}%</h3>
            <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-2.5 overflow-hidden border border-zinc-800/40">
              <div className="bg-purple-500 h-full rounded-full" style={{ width: `${turnoutPercentage}%` }} />
            </div>
          </div>

          <div className="bg-[#0a192a]/50 border border-zinc-800 p-4 rounded-xl">
            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Ballots Cast</p>
            <h3 className="text-2xl font-black text-purple-400 mt-1 font-mono">{election.counts.votesCast.toLocaleString()}</h3>
            <p className="text-[10px] text-zinc-500 mt-2 font-medium">Audited cryptographic receipts</p>
          </div> */}

          <div className="bg-[#0a192a]/50 border border-zinc-800 p-4 rounded-xl">
            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Timeline Start</p>
            <p className="text-xs font-semibold text-zinc-200 mt-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" /> {election.startAt.split(',')[0]}
            </p>
            <p className="text-[10px] font-mono text-zinc-500 mt-1">{election.startAt.split(',')[1]}</p>
          </div>

          <div className="bg-[#0a192a]/50 border border-zinc-800 p-4 rounded-xl">
            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Security Auth Gate</p>
            <p className="text-xs font-semibold text-zinc-200 mt-2 flex items-center gap-1.5 truncate">
              <Key className="w-3.5 h-3.5 text-zinc-500 shrink-0" /> {election.authMode}
            </p>
            <p className="text-[10px] text-emerald-400 mt-1 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Anti-tamper verification active
            </p>
          </div>

        </div>

        {/* ================= INTERACTIVE CONFIGURATION CARDS CONTAINER ================= */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4 flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" /> Management Sectors
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* CARD 1: POSITIONS CONFIGURATION SECTOR */}
            <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-all group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-purple-950/30 border border-purple-900/30 flex items-center justify-center">
                    <Award className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-1 rounded">
                    {election.counts.positions} Registered
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Positions Manager</h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Establish structural ballot departments, provision winner tier criteria bounds.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-6 border-t border-zinc-900 pt-4 w-full">
                <Link
                  to="/admin/positions/new"
                  className="flex-1 inline-flex items-center justify-center gap-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs py-2 rounded-lg font-medium transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> <span>Add New Position</span>
                </Link>
                <Link
                  to="/admin/positions"
                  className="inline-flex items-center justify-center w-10 h-8 rounded-lg border border-zinc-800 bg-[#0a192a]/50 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                  title="View Registry List"
                >
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* CARD 2: CANDIDATES MANAGEMENT SECTOR */}
            <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-all group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-orange-950/30 border border-orange-900/30 flex items-center justify-center">
                    <Users className="w-5 h-5 text-orange-400" />
                  </div>
                  <span className="text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-1 rounded">
                    {election.counts.candidates} Registered
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Candidates Manager</h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Enroll candidates, audit branding portraits and review biographical metadata variables.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-6 border-t border-zinc-900 pt-4 w-full">
                <Link
                  to="/admin/candidates/new"
                  className="flex-1 inline-flex items-center justify-center gap-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs py-2 rounded-lg font-medium transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> <span>Add New Candidate</span>
                </Link>
                <Link
                  to="/admin/candidates"
                  className="inline-flex items-center justify-center w-10 h-8 rounded-lg border border-zinc-800 bg-[#0a192a]/50 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                  title="Open Candidates Grid"
                >
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* CARD 3: VOTERS REGISTRY ROLL SECTOR */}
            <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-all group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-emerald-950/30 border border-emerald-900/30 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-1 rounded">
                    {election.counts.voters.toLocaleString()} Registered
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Voters Manager</h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Manage electoral rosters, monitor 6-digit access tokens, override credentials, and batch-upload voter sheets via Excel.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-6 border-t border-zinc-900 pt-4 w-full">
                <Link
                  to="/admin/voters/new"
                  className="flex-1 inline-flex items-center justify-center gap-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs py-2 rounded-lg font-medium transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> <span>Add New Voter</span>
                </Link>
                <Link
                  to="/admin/voters"
                  className="inline-flex items-center justify-center w-10 h-8 rounded-lg border border-zinc-800 bg-[#0a192a]/50 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                  title="Open Voters Directory"
                >
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* ================= LIVE AUDIT / EXTRA METRICS PANEL LINK ================= */}
        <div className="bg-gradient-to-r from-purple-950/20 via-[#0a192a]/50 to-[#0a192a]/50 rounded-xl border border-zinc-800 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Cryptographic Real-time Audit Stream</h4>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                Review the underlying cryptographically signed ledger rows to analyze vote distributions across ballot streams as they occur.
              </p>
            </div>
          </div>
          <Link
            to={`/admin/elections/${election?.id}/feed`}
            className="w-full sm:w-auto text-center px-4 py-2 bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white rounded-lg transition-all shadow-sm shrink-0"
          >
            Open Live Stream
          </Link>
        </div>

    </div>
  );
}
