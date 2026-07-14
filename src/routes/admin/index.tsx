import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  BarChart3, Calendar, Sparkles,
  ArrowUpRight, Users
} from "lucide-react";

interface GlobalMetricsSummary {
  totalOrganizations: number;
  totalElections: number;
  totalEvents: number;
  totalUsers: number;
  totalSessions: number;
  financials: {
    grossPaystackCollected: number;
    platformDeductionsAmount: number;
    netPayoutsDistributed: number;
    averageDeductionRate: number;
  };
  activeElectionsList: Array<{
    id: number;
    title: string;
    tag: string;
    orgName: string;
    endAt: string;
    authMode: string;
  }>;
  activeEventsList: Array<{
    id: number;
    title: string;
    tag: string;
    orgName: string;
    unitPrice: number;
    grossCollected: number;
  }>;
}

export const Route = createFileRoute("/admin/")({
  component: GlobalAdminDashboard,
});

function GlobalAdminDashboard() {
  const { user }: any = Route.useRouteContext();
  const isSuperAdmin = user?.role === 'super';

  // Simulated reactive state engine mapping database aggregations inside Drizzle
  const [metrics, setMetrics] = useState<GlobalMetricsSummary>({
    totalOrganizations: 3,
    totalElections: 2,
    totalEvents: 3,
    totalUsers: 1450, // mapping count from user/users tables
    totalSessions: 42,  // active sessions cached
    financials: {
      grossPaystackCollected: 66550.50, // accumulated sum(events.payment_amount)
      platformDeductionsAmount: 6655.05, // accumulated sum(events.payment_deduction)
      netPayoutsDistributed: 59895.45,   // gross minus deductions
      averageDeductionRate: 10,
    },
    activeElectionsList: [
      { id: 1, title: "2026 Executive SRC Elections", tag: "src-2026", orgName: "Capevars.com", endAt: "2026-05-20 17:00", authMode: "OTP" },
      { id: 2, title: "Faculty of Science Council Voting", tag: "sci-council", orgName: "Capevars.com", endAt: "2026-06-16 16:00", authMode: "GOOGLE" }
    ],
    activeEventsList: [
      { id: 1, title: "2026 National Music Awards", tag: "nma-2026", orgName: "Festora Global Studios", unitPrice: 1.50, grossCollected: 45200.00 },
      { id: 2, title: "Inter-University Rap Battle Arena", tag: "vma-2026", orgName: "Capevars.com", unitPrice: 0.50, grossCollected: 12450.50 }
    ]
  });

  const [isSyncing, setIsSyncing] = useState(false);

  // Simulating live data refresh intervals for tracking transaction ingestion streams
  useEffect(() => {
    const ticker = setInterval(() => {
      setIsSyncing(true);
      setMetrics((prev) => {
        const randomGrossInflow = Math.random() > 0.4 ? Math.floor(Math.random() * 15) * 1.50 : 0;
        const updatedGross = prev.financials.grossPaystackCollected + randomGrossInflow;
        const updatedDeduction = updatedGross * (prev.financials.averageDeductionRate / 100);
        
        return {
          ...prev,
          financials: {
            ...prev.financials,
            grossPaystackCollected: updatedGross,
            platformDeductionsAmount: updatedDeduction,
            netPayoutsDistributed: updatedGross - updatedDeduction
          },
          activeEventsList: prev.activeEventsList.map((evt, idx) => 
            idx === 0 ? { ...evt, grossCollected: evt.grossCollected + randomGrossInflow } : evt
          )
        };
      });
      setTimeout(() => setIsSyncing(false), 300);
    }, 5000);

    return () => clearInterval(ticker);
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a192a]/50 p-6 rounded-xl border border-zinc-800">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <span>Administrative Dashboard</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Real-time platform overview across multi-tenant applications, transactional billing operations, active e-voting clusters, and core events sessions.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 text-xs bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-lg font-medium select-none shrink-0">
            <span className={`w-2 h-2 rounded-full bg-emerald-400 ${isSyncing ? "animate-ping" : ""}`} />
            <span className="text-zinc-400">Verified</span>
            {/* <span className="text-zinc-200 font-mono text-[11px]">Syncing</span> */}
          </div>
        </div>

        {/* ================= PREMIUM MENU NAVIGATION SECTORS GRID ================= */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2 select-none">
            <span>Platform Administrative Modules</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* CARD 1: ORGANIZATIONS SECTOR */}
            {/* <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700/80 transition-all group relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-purple-950/30 border border-purple-900/30 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                    {metrics.totalOrganizations} Tenancies
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                    <span>Organizations</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                    Provision client workspaces, audit phone indices, and map discrete ForeignKey administrative keys.
                  </p>
                </div>
              </div>
              <Link to="/admin/organizations" className="absolute inset-0 z-10" />
            </div> */}

            {/* CARD 2: EVENTS PLATFORMS */}
            <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700/80 transition-all group relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-emerald-950/30 border border-emerald-900/30 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                    {metrics.totalEvents} Active Node Channels
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                    <span>Events Console</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                    Manage public talent polls, adjust unit costs per vote, and handle automated multi-tenant payout deductions.
                  </p>
                </div>
              </div>
              <Link to="/admin/events" className="absolute inset-0 z-10" />
            </div>

            {/* CARD 3: ELECTIONS CONFIGURATOR */}
            <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700/80 transition-all group relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-blue-950/30 border border-blue-900/30 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                    {/* {metrics.totalElections} Staged Elections */}
                    Manage Elections
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                    <span>Elections Console</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                    Deploy structural token-verified ballots, configure position slots, and verify authentication gate modes.
                  </p>
                </div>
              </div>
              <Link to="/admin/elections" className="absolute inset-0 z-10" />
            </div>

            {/* CARD 4: SUPER ADMIN USERS REGISTRY (visible to role="super" only) */}
            {isSuperAdmin && (
              <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700/80 transition-all group relative overflow-hidden">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-orange-950/30 border border-orange-900/30 flex items-center justify-center">
                      <Users className="w-5 h-5 text-orange-400" />
                    </div>
                    <span className="text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                      Super Admin
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                      <span>Users Registry</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-orange-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                      Create and manage tenant accounts, verify or disable access, reset credentials, and administer each account's election workspace.
                    </p>
                  </div>
                </div>
                <Link to="/admin/users" className="absolute inset-0 z-10" />
              </div>
            )}

            {/* CARD 5: BETTER AUTH ACCOUNTS & SESSIONS */}
            {/* <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700/80 transition-all group relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-amber-950/30 border border-amber-900/30 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className="text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                    {metrics.totalSessions} Active Sessions
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                    <span>Accounts & Auth Keys</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                    Monitor OAuth provider identities, audit token expiration dates, and intercept session handshakes.
                  </p>
                </div>
              </div>
              <Link to="/admin" className="absolute inset-0 z-10" />
            </div> */}

            {/* CARD 6: PLATFORM ACTIVITY LEDGER TRAIL */}
            {/* <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700/80 transition-all group relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-cyan-950/30 border border-cyan-900/30 flex items-center justify-center">
                    <History className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-1.5 py-0.5 rounded-sm select-none uppercase tracking-wider text-[9px]">
                    Ledger Secured
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                    <span>Activity Audit Logs</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                    Track real-time system mutations, verify cryptographic signatures, and trace administration override footprints.
                  </p>
                </div>
              </div>
              <Link to="/admin" className="absolute inset-0 z-10" />
            </div> */}

          </div>
        </div>

        {/* ================= PLATFORM REVENUE TRACKING METRICS SECTION ================= */}
        {/* <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-xl">
          <div className="border-b border-zinc-900 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <CircleDollarSign className="w-4 h-4 text-emerald-400" />
              <span>Events Transaction Financials Overview</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-1">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1.5 tracking-wide">Gross Paystack Collected</span>
              <h4 className="text-xl font-black text-white font-mono tracking-tight">
                ₵{metrics.financials.grossPaystackCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h4>
              <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" /> Real-time billing accumulation active
              </p>
            </div>

            <div className="border-t sm:border-t-0 sm:border-x border-zinc-900 pt-4 sm:pt-0 sm:px-6">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1.5 tracking-wide flex items-center gap-1">
                System Deductions Cuts <span className="text-purple-400 font-normal">({metrics.financials.averageDeductionRate}%)</span>
              </span>
              <h4 className="text-xl font-black text-purple-400 font-mono tracking-tight">
                ₵{metrics.financials.platformDeductionsAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h4>
              <p className="text-[10px] text-zinc-500 mt-1">Calculated share splits matching tenant drivers</p>
            </div>

            <div className="border-t sm:border-t-0 pt-4 sm:pt-0 sm:pl-4">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1.5 tracking-wide">Net Remittance Payouts</span>
              <h4 className="text-xl font-black text-emerald-400 font-mono tracking-tight">
                ₵{metrics.financials.netPayoutsDistributed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h4>
              <p className="text-[10px] text-zinc-500 mt-1">Provisioned balance ready for merchant subaccount split routing</p>
            </div>
          </div>
        </div> */}

        {/* ================= BOTTOM METRICS DETAILS GRID SPLIT ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
          
          {/* SECTOR LEFT: ACTIVE ELECTIONS LIST */}
          {/* <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="border-b border-zinc-900 pb-3 flex justify-between items-center select-none">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                <span>Active Core Elections</span>
              </h3>
              <span className="text-[10px] font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-500 px-2 py-0.5 rounded">
                Live Frameworks
              </span>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {metrics.activeElectionsList.map((election) => (
                <div key={election.id} className="bg-zinc-900/30 border border-zinc-900 p-3 rounded-lg flex items-center justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <span className="text-xs font-semibold text-white tracking-wide block truncate">{election.title}</span>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                      <span className="font-medium text-zinc-400 truncate">{election.orgName}</span>
                      <span>·</span>
                      <span className="font-mono text-purple-400 font-bold bg-purple-950/20 px-1 rounded text-[9px]">slug: {election.tag}</span>
                    </div>
                  </div>
                  <Link
                    to={`/admin/elections`}
                    className="inline-flex items-center gap-1 text-[11px] font-bold bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-2.5 py-1.5 rounded-md transition-colors shrink-0"
                  >
                    <span>Manage</span> <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div> */}

          {/* SECTOR RIGHT: ACTIVE EVENTS PLATFORMS */}
          {/* <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="border-b border-zinc-900 pb-3 flex justify-between items-center select-none">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Active Public Voting Channels</span>
              </h3>
              <span className="text-[10px] font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-500 px-2 py-0.5 rounded">
                Ingestion Live
              </span>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {metrics.activeEventsList.map((event) => (
                <div key={event.id} className="bg-zinc-900/30 border border-zinc-900 p-3 rounded-lg flex items-center justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <span className="text-xs font-semibold text-white tracking-wide block truncate">{event.title}</span>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                      <span className="font-medium text-zinc-400 truncate">{event.orgName}</span>
                      <span>·</span>
                      <span className="font-mono text-zinc-400 flex items-center gap-0.5 bg-[#0a192a]/50 border border-zinc-800/40 px-1 rounded text-[9px]">
                        <Coins className="w-2.5 h-2.5 text-amber-500" /> ₵{event.unitPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 font-mono text-xs font-black text-emerald-400 bg-[#0a192a]/50 border border-zinc-900 px-2.5 py-1.5 rounded-md">
                    ₵{event.grossCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </div> */}

        </div>

    </div>
  );
}
