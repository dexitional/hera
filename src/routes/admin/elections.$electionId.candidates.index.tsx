import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  UserPlus, Search, Edit2, Trash2, CheckCircle2,
  Award, Filter, User, ChevronDown,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { deleteCandidateFn, getCandidatesFn } from "#/server/tenant-elections";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

const CANDIDATES_PAGE_SIZE = 15;

const candidatesQueryOptions = (params: {
  electionId: any;
  page: number;
  pageSize: number;
  searchQuery: string;
  positionFilter: string;
}) => ({
  queryKey: ['candidates-admin', params.electionId, params.page, params.pageSize, params.searchQuery, params.positionFilter],
  queryFn: () => getCandidatesFn({ data: params } as any),
  placeholderData: keepPreviousData,
});


export const Route = createFileRoute("/admin/elections/$electionId/candidates/")({
  component: CandidatesDirectory,
  loader: async ({ context, params }) => {
    const electionId = params.electionId;
    await context.queryClient.ensureQueryData(candidatesQueryOptions({
      electionId, page: 1, pageSize: CANDIDATES_PAGE_SIZE, searchQuery: "", positionFilter: "ALL",
    }));
  },
  pendingComponent: () => (
    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-purple-500" /></div>
  ),
});


function CandidatesDirectory() {

  const queryClient = useQueryClient();
  const { electionId } = Route.useParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedPositionFilter, setSelectedPositionFilter] = useState<string>("ALL");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [jumpToPageInput, setJumpToPageInput] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce the raw search input before it drives a server request
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearchQuery(searchQuery.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Any change to the active filters should snap the view back to page 1
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery, selectedPositionFilter]);

  const { data }: any = useQuery(candidatesQueryOptions({
    electionId, page, pageSize: CANDIDATES_PAGE_SIZE, searchQuery: debouncedSearchQuery, positionFilter: selectedPositionFilter,
  }));

  const candidates: any = (data?.candidates ?? []).map((r: any) => ({
    id: r?.candidates.id,
    teaser: r?.candidates.teaser,
    order: r?.candidates.order,
    isActive: r?.candidates.isActive,
    positionId: r.candidates?.id,
    positionTitle: r.positions?.title,
    electionTitle: r.elections?.title,
    name: r.candidates?.name,
    imageUrl: r.candidates?.imageUrl,
  }));

  const uniquePositions = ["ALL", ...(data?.positionTitles ?? [])];
  const totalCount: number = data?.pagination?.totalCount ?? 0;
  const totalPages: number = Math.max(data?.pagination?.totalPages ?? 1, 1);
  const isFetchingCandidates = !data;

  const handleJumpToPage = () => {
    const parsed = Number(jumpToPageInput);
    if (!Number.isFinite(parsed)) return;
    setPage(Math.min(Math.max(Math.floor(parsed), 1), totalPages));
    setJumpToPageInput("");
  };

  // Smart Click-Away Closing listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search and position filtering now run server-side (see getCandidatesFn)

  const deleteMutation = useMutation({
    mutationFn: deleteCandidateFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates-admin'] });
      return redirect({ to: '/admin/elections/$electionId/candidates', params: { electionId } })
    },
    onError: (error: any) => console.error(error.message)
  });



  const handleDeleteCandidate = (id: any) => {
    if (confirm("Are you sure you want to remove this position category? Removing this will cascade and affect candidates attached to this ballot layer!")) {
       deleteMutation.mutate({ data: id });
    }
  };


  return (
    <div className="max-w-7xl mx-auto space-y-6">
        {/* ================= BACK NAVIGATION ================= */}
        <Link
          to="/admin/elections/$electionId/manage"
          params={{ electionId }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Management Console
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a192a]/50 p-6 rounded-xl border border-zinc-800">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Candidates Manager</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Review certified election candidates, verify cloud profile images, and assign contesting categories.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/admin/elections/$electionId/candidates/new"
              params={{ electionId }}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs px-3.5 py-2 rounded-lg font-medium shadow-md transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Enroll Candidate</span>
            </Link>
          </div>
        </div>

        {/* ================= FILTERS & DROPDOWN RIBBON ================= */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80 relative z-30">
          {/* Quick Search */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search candidate name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a192a]/50 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
          </div>

          {/* Interactive Custom Dropdown Filter */}
          <div className="relative w-full sm:w-auto" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
              className={`w-full sm:w-56 flex items-center justify-between gap-2 text-xs font-semibold px-4 py-2 rounded-lg border bg-[#0a192a]/50 text-zinc-300 transition-all focus:outline-none ${isFilterDropdownOpen ? "border-purple-500 ring-2 ring-purple-500/20" : "border-zinc-800 hover:border-zinc-700"}`}
            >
              <div className="flex items-center gap-2 truncate">
                <Filter className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-zinc-500 font-normal">Position:</span>
                <span className="text-white truncate">{selectedPositionFilter}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-200 ${isFilterDropdownOpen ? "transform rotate-180" : ""}`} />
            </button>

            {/* Dropdown Options Box [15] */}
            {isFilterDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-full sm:w-56 rounded-lg border border-zinc-800 bg-[#0a192a]/50 p-1 shadow-2xl z-50 overflow-hidden divide-y divide-zinc-900 animate-in fade-in slide-in-from-top-1 duration-100 block">
                {uniquePositions.map((pos: any) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => {
                      setSelectedPositionFilter(pos);
                      setIsFilterDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-purple-600 hover:text-white flex items-center justify-between ${selectedPositionFilter === pos ? "bg-zinc-900 text-purple-400 font-semibold" : "text-zinc-400"}`}
                  >
                    <span>{pos}</span>
                    {selectedPositionFilter === pos && (
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ================= CANDIDATES TABLE DATA GRID ================= */}
        <div className="bg-[#0a192a]/50 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl relative z-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/60 bg-zinc-900/20 text-zinc-400 text-[11px] font-bold uppercase tracking-wider select-none">
                  <th className="px-6 py-4">Candidate Identity</th>
                  <th className="px-6 py-4">Official Position</th>
                  <th className="px-6 py-4">Electoral Group</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-sm">
                {candidates.length > 0 ? (
                  candidates.map((candidate: any) => (
                    <tr key={candidate.id} className="hover:bg-zinc-900/20 transition-colors group">

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
                            {candidate.imageUrl ? (
                              <img
                                src={candidate.imageUrl}
                                alt={candidate.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <User className="w-4 h-4 text-zinc-600" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-white tracking-wide">{candidate.name}</span>
                            <span className="text-[11px] text-zinc-500 font-mono mt-0.5">{candidate.teaser && `#${candidate.teaser}`}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-2">
                          <Award className="w-3.5 h-3.5 text-purple-400" />
                          <div className="flex flex-col">
                          <span className="w-fit font-medium text-zinc-300 text-xs bg-zinc-900 border border-zinc-800 px-2 py-1 rounded">
                            {candidate.positionTitle}
                          </span>
                          <span className="text-[11px] text-zinc-500 font-mono mt-0.5">Ballot Number :  #{candidate.order}</span>

                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 align-middle max-w-xs">
                          <div className="text-xs font-mono text-zinc-500 truncate select-all" title={candidate.imageUrl}>
                            {candidate.electionTitle}
                          </div>
                      </td>

                      <td className="px-6 py-4 align-middle text-center">
                        { candidate.isActive ?
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                          :
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-emerald-950/20 border border-emerald-900/30 px-2 py-0.5 rounded-full">
                            {/* <UserCheck className="w-3 h-3" />  */}
                            Inactive
                          </span>
                         }
                      </td>

                      <td className="px-6 py-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to="/admin/elections/$electionId/candidates/$candidateId/edit"
                            params={{ electionId, candidateId: String(candidate?.id) }}
                            title="Edit Candidate Meta"
                            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDeleteCandidate(candidate.id)}
                            title="Delete Record"
                            className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-zinc-500 text-xs border border-dashed border-zinc-900 rounded-b-xl">
                      No candidate profiles detected matching sorting parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ================= PAGINATION BOTTOM ELEMENT BAR ================= */}
          <div className="p-4 bg-zinc-900/40 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-zinc-400">
              {isFetchingCandidates
                ? "Loading candidates..."
                : <>Showing Page <b className="text-white">{page}</b> of <b className="text-white">{totalPages}</b> ({totalCount} entries)</>
              }
            </span>

            <div className="flex gap-2 w-full sm:w-auto justify-end items-center">
              <button
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="flex items-center gap-1 text-xs px-3 py-1.5 border border-zinc-800 rounded-lg bg-zinc-900 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-zinc-800 transition-all cursor-pointer"
              >
                Previous
              </button>

              {/* Jump To Page Number Input */}
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={jumpToPageInput}
                  onChange={(e) => setJumpToPageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJumpToPage()}
                  placeholder={`${page}`}
                  className="w-14 bg-[#0a192a]/50 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white text-center placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  disabled={!jumpToPageInput}
                  onClick={handleJumpToPage}
                  className="text-xs px-3 py-1.5 border border-zinc-800 rounded-lg bg-zinc-900 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  Go
                </button>
              </div>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="flex items-center gap-1 text-xs px-3 py-1.5 border border-zinc-800 rounded-lg bg-zinc-900 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-zinc-800 transition-all cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>

    </div>
  );
}
