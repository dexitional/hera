import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import moment from 'moment';
import {
  Plus, Search, Edit2, Trash2, Calendar,
  Globe, Shield, Eye, Filter, ChevronDown, CheckCircle, Sliders
} from "lucide-react";
import { deleteElectionFn, getElectionsFn } from "#/server/tenant-elections";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { TableSkeleton } from "#/components/ui/skeleton";


const electionsQueryOptions = () => ({
  queryKey: ['elections-admin'],
  queryFn: () => getElectionsFn(),
});

export const Route = createFileRoute("/admin/elections/")({
  component: ElectionsDirectory,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(electionsQueryOptions());
  },
  pendingComponent: () => <TableSkeleton />,
});

function ElectionsDirectory() {
  const queryClient = useQueryClient();
  const { data }:any = useSuspenseQuery(electionsQueryOptions());
  const  elections:any = data?.map((r: any) => ({ 
    id: r?.id,
    adminId: r.adminId,
    tag: r.tag,
    title: r.title,
    description: r.description,
    startAt: moment(r.startAt).format('LLL'),       
    endAt: moment(r.endAt).format('LLL'),        
    imageUrl: r.imageUrl,
    authMode: r.authMode,      // "GOOGLE" | "CREDENTIAL" | "OTP"
    makePublic: r.makePublic,
    showFeed: r.showFeed,
    isActive: r.isActive,
  }))

  // const [elections, setElections] = useState<any>(initials);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "ARCHIVED">("ALL");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredElections = elections?.filter((election: any) => {
    const matchesSearch = 
      election.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      election.tag.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === "ACTIVE") return matchesSearch && election.isActive;
    if (statusFilter === "ARCHIVED") return matchesSearch && !election.isActive;
    return matchesSearch;
  });

  const deleteMutation = useMutation({
    mutationFn: deleteElectionFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elections-admin'] });
      return redirect({ to: '/admin/elections' })
    },
    onError: (error) => console.error(error.message)
  });


  const handleDeleteElection = (id: any) => {
    if (confirm("Are you sure you want to delete this election? This drops all positions, candidates, voters and cast votes linked to this instance!")) {
      deleteMutation.mutate({ data: id });
    }
  };


  return (
    <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ================= HEADER SECTION ================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a192a]/50 p-6 rounded-xl border border-zinc-800">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Elections Manager</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Stage corporate election, schedule timelines, establish auth modes, and access management sub-consoles.
            </p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="/admin/elections/new"
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs px-3.5 py-2 rounded-lg font-medium shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Deploy New Election</span>
            </a>
          </div>
        </div>

        {/* ================= BAR FILTERS & ACTION RIBBON ================= */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80 relative z-30">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by title or system tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a192a]/50 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
          </div>

          <div className="relative w-full sm:w-auto" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
              className={`w-full sm:w-48 flex items-center justify-between gap-2 text-xs font-semibold px-4 py-2 rounded-lg border bg-[#0a192a]/50 text-zinc-300 transition-all focus:outline-none ${isFilterDropdownOpen ? "border-purple-500 ring-2 ring-purple-500/20" : "border-zinc-800 hover:border-zinc-700"}`}
            >
              <div className="flex items-center gap-2 truncate">
                <Filter className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-zinc-500 font-normal">State:</span>
                <span className="text-white truncate uppercase">{statusFilter}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-200 ${isFilterDropdownOpen ? "transform rotate-180" : ""}`} />
            </button>

            {isFilterDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-full sm:w-48 rounded-lg border border-zinc-800 bg-[#0a192a]/50 p-1 shadow-2xl z-50 overflow-hidden divide-y divide-zinc-900 block animate-in fade-in duration-100">
                {(["ALL", "ACTIVE", "ARCHIVED"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => {
                      setStatusFilter(filter);
                      setIsFilterDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-purple-600 hover:text-white flex items-center justify-between ${statusFilter === filter ? "bg-zinc-900 text-purple-400 font-semibold" : "text-zinc-400"}`}
                  >
                    <span>{filter === "ALL" ? "All Instances" : filter}</span>
                    {statusFilter === filter && (
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ================= DATAGRID DATA INSIGHT MATRIX ================= */}
        <div className="bg-[#0a192a]/50 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl relative z-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/60 bg-zinc-900/20 text-zinc-400 text-[11px] font-bold uppercase tracking-wider select-none">
                  <th className="px-6 py-4">Election Meta Summary</th>
                  <th className="px-6 py-4">Timeline Context</th>
                  <th className="px-6 py-4">Auth Mode</th>
                  <th className="px-6 py-4 text-center">Pipeline Toggles</th>
                  <th className="px-6 py-4 text-center">Lifecycle Status</th>
                  <th className="px-6 py-4 text-right">Console Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-sm">
                {filteredElections.length > 0 ? (
                  filteredElections.map((election:any) => (
                    <tr key={election.id} className="hover:bg-zinc-900/20 transition-colors group">
                      
                      <td className="px-6 py-4 max-w-xs">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white tracking-wide text-sm">{election.title}</span>
                          <span className="text-[10px] text-purple-400 font-mono font-bold bg-purple-950/20 border border-purple-900/30 px-1.5 py-0.5 rounded w-max mt-1 select-all">
                            tag: {election.tag}
                          </span>
                          <p className="text-xs text-zinc-500 mt-2 line-clamp-2 leading-relaxed">
                            {election.description}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4 align-middle whitespace-nowrap text-xs text-zinc-400 font-mono">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                            <span className="text-zinc-600 font-sans text-[11px]">Start:</span>
                            <span>{election.startAt}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                            <span className="text-zinc-600 font-sans text-[11px]">End:</span>
                            <span>{election.endAt}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 align-middle">
                        <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded shadow-inner">
                          <Shield className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{election.authMode}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 align-middle text-center">
                        <div className="flex items-center justify-center gap-3">
                          <div title={election.makePublic ? "Public Index View Enabled" : "Private Restricted Access"}>
                            <Globe className={`w-4 h-4 transition-colors ${election.makePublic ? "text-emerald-400" : "text-zinc-700"}`} />
                          </div>
                          <div title={election.showFeed ? "Real-time Audit Trail Active" : "Audit Log Streaming Deactivated"}>
                            <Eye className={`w-4 h-4 transition-colors ${election.showFeed ? "text-purple-400" : "text-zinc-700"}`} />
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 align-middle text-center">
                        <div className="inline-flex justify-center">
                          {election.isActive ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-2.5 py-0.5 rounded-full">
                              <CheckCircle className="w-3 h-3" /> Live Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-full">
                              Concluded
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Unified Management Action Ribbon Column */}
                      <td className="px-6 py-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-3">
                          
                          {/* Dedicated Manage Button linking to election subcontext */}
                          <Link
                            to="/admin/elections/$electionId/manage"
                            params={{ electionId: String(election?.id) }}
                            className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-all shadow-sm"
                          >
                            <Sliders className="w-3 h-3 text-purple-400" />
                            <span>Manage</span>
                          </Link>

                          {/* Quick Overrides Menu Group */}
                          <div className="flex items-center gap-1 border-l border-zinc-800 pl-2">
                            <Link
                              to="/admin/elections/$electionId/edit"
                              params={{ electionId: String(election?.id) }}
                              title="Edit Election"
                              className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Link>
                            { election?.status == 'staged' && (
                            <button
                              onClick={() => handleDeleteElection(election?.id)}
                              title="Delete Election"
                              className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            )}
                          </div>

                        </div>
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-zinc-500 text-xs border border-dashed border-zinc-900 rounded-b-xl">
                      No election instances detected matching sorting filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

    </div>
  );
}
