import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState } from "react";
import { 
  Sliders, FolderTree, UserCheck, Coins, ArrowUpRight, Plus, 
  Percent, CircleDollarSign, ShieldAlert, BarChart3, LayoutGrid, Flame 
} from "lucide-react";

interface EventOverview {
  id: number;
  title: string;
  description: string;
  unitPrice: number;        // doublePrecision map for cost per vote
  paymentAmount: number;    // doublePrecision gross revenue from Paystack
  paymentDeduction: number; // doublePrecision platform fee cuts absolute GHS
  isActive: number;         // integer mapping: 1 = Active, 0 = Disabled
  counts: {
    categories: number;
    contestants: number;
    totalVotesCast: number;
  };
}

export const Route = createFileRoute("/admin/events/manage")({
  component: ManageEventConsole,
});

function ManageEventConsole() {
  // Simulating loading data dynamically based on the active router parameter path context
  const [event, setEvent] = useState<EventOverview>({
    id: 1,
    title: "2026 National Music Awards",
    description: "Annual Public Music Industry voting and award event. Governs billing variables, shortcodes, and payouts across all active categories.",
    unitPrice: 1.50,         // GHS 1.50 per vote code entry
    paymentAmount: 45200.00,  // Gross amount collected from Paystack subaccount
    paymentDeduction: 4520.00, // Absolute platform deduction fee value
    isActive: 1,
    counts: {
      categories: 24,
      contestants: 112,
      totalVotesCast: 30133, // calculated sum(votes.vote_count)
    }
  });

  const [activeState, setActiveState] = useState(event.isActive);

  // Dynamically compute percentage deduction rate based on your gross vs absolute schema column data
  const deductionRate = event.paymentAmount > 0 
    ? ((event.paymentDeduction / event.paymentAmount) * 100).toFixed(0)
    : "0";

  // Net revenue calculation payload matrix
  const netRevenueCollected = event.paymentAmount - event.paymentDeduction;

  const handleToggleEventState = () => {
    setActiveState((prev) => (prev === 1 ? 0 : 1));
    console.log("Altering active status integer inside Drizzle context storage to:", activeState === 1 ? 0 : 1);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ================= WORKSPACE CONSOLE BREADCRUMB HEADER ================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a192a]/50 p-6 rounded-xl border border-zinc-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono uppercase tracking-wider">
              <Link to="/admin/events" className="hover:text-purple-400 transition-colors">Events App</Link>
              <span>/</span>
              <span className="text-zinc-400 select-all">Console Node: ev_{event.id}</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-400" />
              <span>Manage: {event.title}</span>
            </h1>
          </div>

          {/* Real-time Status Switch Ingestion */}
          <button
            type="button"
            onClick={handleToggleEventState}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm active:scale-95 ${activeState === 1 ? 'border-emerald-500/30 text-emerald-400 bg-emerald-950/10' : 'border-zinc-800 text-zinc-500 bg-zinc-900'}`}
          >
            <span className={`w-2 h-2 rounded-full ${activeState === 1 ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-700'}`} />
            <span>{activeState === 1 ? "Live Voting Open" : "Polling Streams Locked"}</span>
          </button>
        </div>

        {/* ================= HIGH-DENSITY FINANCIAL & TELEMETRY CARD GRIDS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Paystack Subaccount Gross Collection */}
          <div className="bg-[#0a192a]/50 border border-zinc-800 p-4 rounded-xl relative overflow-hidden">
            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1">
              <CircleDollarSign className="w-3.5 h-3.5 text-emerald-500" /> Gross Revenue Collected
            </p>
            <h3 className="text-2xl font-black text-white mt-1.5 font-mono">
              ₵{event.paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
              Abs. cut: ₵{event.paymentDeduction.toLocaleString(undefined, { minimumFractionDigits: 2 })} GHS
            </p>
          </div>

          {/* Card 3: Unit Price Per Vote */}
          <div className="bg-[#0a192a]/50 border border-zinc-800 p-4 rounded-xl">
            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-500" /> Unit Cost per Vote
            </p>
            <h3 className="text-2xl font-black text-zinc-100 mt-1.5 font-mono">
              ₵{event.unitPrice.toFixed(2)} <span className="text-xs text-zinc-500 font-sans font-normal">GHS</span>
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
              {event.counts.totalVotesCast.toLocaleString()}
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* MODULE SECTOR 1: CATEGORIES ARCHITECTURE */}
            <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-all group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-purple-950/30 border border-purple-900/30 flex items-center justify-center">
                    <FolderTree className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-1 rounded">
                    {event.counts.categories} Sections Registered
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
                  to="/admin/categories/new"
                  className="flex-1 inline-flex items-center justify-center gap-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs py-2 rounded-lg font-medium transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> <span>Deploy Category</span>
                </Link>
                <Link
                  to="/admin/categories"
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
                    {event.counts.contestants} Enrolled Profiles
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
                  to="/admin/contestants/new"
                  className="flex-1 inline-flex items-center justify-center gap-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs py-2 rounded-lg font-medium transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> <span>Enroll Contestant</span>
                </Link>
                <Link
                  to="/admin/contestants"
                  className="inline-flex items-center justify-center w-10 h-8 rounded-lg border border-zinc-800 bg-[#0a192a]/50 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                  title="Open Contestants Directory"
                >
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* ================= LIVE STREAM ACTION NOTIFICATION ROW ================= */}
        <div className="bg-gradient-to-r from-purple-950/20 via-[#0a192a]/50 to-[#0a192a]/50 rounded-xl border border-zinc-800 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Public Real-time Vote Turnout Stream</h4>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                Open the live listening websocket telemetry canvas to track candidate vote additions across channels (USSD and WEB) dynamically as they arrive.
              </p>
            </div>
          </div>
          <Link
            to={`/admin/events/feed`}
            className="w-full sm:w-auto text-center px-4 py-2 bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white rounded-lg transition-all shadow-md shrink-0"
          >
            Open Live Telemetry Feed
          </Link>
        </div>

    </div>
  );
}
