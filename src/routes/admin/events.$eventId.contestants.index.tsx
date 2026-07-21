import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  UserPlus, Search, Edit2, Trash2,
  Award, Filter, User, ChevronDown,
  ArrowLeft,
  Hash,
} from "lucide-react";
import { deleteContestantFn, getContestantsFn } from "#/server/tenant-events";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TableSkeleton } from "#/components/ui/skeleton";

const CONTESTANTS_PAGE_SIZE = 15;

const contestantsQueryOptions = (params: {
  eventId: any;
  page: number;
  pageSize: number;
  searchQuery: string;
  categoryFilter: string;
}) => ({
  queryKey: ['contestants-admin', params.eventId, params.page, params.pageSize, params.searchQuery, params.categoryFilter],
  queryFn: () => getContestantsFn({ data: params } as any),
  placeholderData: keepPreviousData,
});

export const Route = createFileRoute("/admin/events/$eventId/contestants/")({
  component: ContestantsDirectory,
  loader: async ({ context, params }: any) => {
    const eventId = params.eventId;
    await context.queryClient.ensureQueryData(contestantsQueryOptions({
      eventId, page: 1, pageSize: CONTESTANTS_PAGE_SIZE, searchQuery: "", categoryFilter: "ALL",
    }));
  },
  pendingComponent: () => <TableSkeleton />,
});

function ContestantsDirectory() {
  const queryClient = useQueryClient();
  const { eventId } = Route.useParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [jumpToPageInput, setJumpToPageInput] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearchQuery(searchQuery.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery, selectedCategoryFilter]);

  const { data }: any = useQuery(contestantsQueryOptions({
    eventId, page, pageSize: CONTESTANTS_PAGE_SIZE, searchQuery: debouncedSearchQuery, categoryFilter: selectedCategoryFilter,
  }));

  const contestants: any = (data?.contestants ?? []).map((r: any) => ({
    id: r?.contestants.id,
    name: r.contestants?.name,
    tagline: r.contestants?.tagline,
    order: r.contestants?.order,
    imageUrl: r.contestants?.imageUrl,
    code: r.contestants?.code,
    categoryName: r.categories?.name,
  }));

  const uniqueCategories = ["ALL", ...(data?.categoryNames ?? [])];
  const totalCount: number = data?.pagination?.totalCount ?? 0;
  const totalPages: number = Math.max(data?.pagination?.totalPages ?? 1, 1);
  const isFetchingContestants = !data;

  const handleJumpToPage = () => {
    const parsed = Number(jumpToPageInput);
    if (!Number.isFinite(parsed)) return;
    setPage(Math.min(Math.max(Math.floor(parsed), 1), totalPages));
    setJumpToPageInput("");
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const deleteMutation = useMutation({
    mutationFn: deleteContestantFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contestants-admin'] });
    },
    onError: (error: any) => console.error(error.message),
  });

  const handleDeleteContestant = (id: any) => {
    if (confirm("Are you sure you want to remove this contestant? This will permanently drop all votes cast for them.")) {
      deleteMutation.mutate({ data: id } as any);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ================= BACK NAVIGATION ================= */}
      <Link
        to="/admin/events/$eventId/manage"
        params={{ eventId }}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Management Console
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a192a]/50 p-6 rounded-xl border border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Nominees & Contestants Manager</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Enroll participants, verify profile images, and assign them to their voting category.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/admin/events/$eventId/contestants/new"
            params={{ eventId }}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs px-3.5 py-2 rounded-lg font-medium shadow-md transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Enroll Contestant</span>
          </Link>
        </div>
      </div>

      {/* ================= FILTERS & DROPDOWN RIBBON ================= */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80 relative z-30">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search contestant name..."
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
            className={`w-full sm:w-56 flex items-center justify-between gap-2 text-xs font-semibold px-4 py-2 rounded-lg border bg-[#0a192a]/50 text-zinc-300 transition-all focus:outline-none ${isFilterDropdownOpen ? "border-purple-500 ring-2 ring-purple-500/20" : "border-zinc-800 hover:border-zinc-700"}`}
          >
            <div className="flex items-center gap-2 truncate">
              <Filter className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-zinc-500 font-normal">Category:</span>
              <span className="text-white truncate">{selectedCategoryFilter}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-200 ${isFilterDropdownOpen ? "transform rotate-180" : ""}`} />
          </button>

          {isFilterDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-full sm:w-56 rounded-lg border border-zinc-800 bg-[#0a192a]/50 p-1 shadow-2xl z-50 overflow-hidden divide-y divide-zinc-900 animate-in fade-in slide-in-from-top-1 duration-100 block">
              {uniqueCategories.map((cat: any) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategoryFilter(cat);
                    setIsFilterDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-purple-600 hover:text-white flex items-center justify-between ${selectedCategoryFilter === cat ? "bg-zinc-900 text-purple-400 font-semibold" : "text-zinc-400"}`}
                >
                  <span className="truncate pr-2">{cat}</span>
                  {selectedCategoryFilter === cat && (
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================= CONTESTANTS TABLE DATA GRID ================= */}
      <div className="bg-[#0a192a]/50 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/60 bg-zinc-900/20 text-zinc-400 text-[11px] font-bold uppercase tracking-wider select-none">
                <th className="px-6 py-4">Contestant Identity</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-sm">
              {contestants.length > 0 ? (
                contestants.map((contestant: any) => (
                  <tr key={contestant.id} className="hover:bg-zinc-900/20 transition-colors group">

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
                          {contestant.imageUrl ? (
                            <img
                              src={contestant.imageUrl}
                              alt={contestant.name}
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
                          <span className="font-semibold text-white tracking-wide">{contestant.name}</span>
                          <span className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1 max-w-xs">{contestant.tagline}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 align-middle">
                      <div className="flex items-center gap-2">
                        <Award className="w-3.5 h-3.5 text-purple-400" />
                        <div className="flex flex-col">
                          <span className="w-fit font-medium text-zinc-300 text-xs bg-zinc-900 border border-zinc-800 px-2 py-1 rounded">
                            {contestant.categoryName}
                          </span>
                          <span className="text-[11px] text-zinc-500 font-mono mt-0.5">Order: #{contestant.order ?? '—'}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 align-middle">
                      <div className="inline-flex items-center gap-1 text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded shadow-inner">
                        <Hash className="w-3 h-3 text-zinc-500" />
                        <span>{contestant.code}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to="/admin/events/$eventId/contestants/$contestantId/edit"
                          params={{ eventId, contestantId: String(contestant.id) }}
                          title="Edit Contestant Meta"
                          className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteContestant(contestant.id)}
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
                  <td colSpan={4} className="text-center py-12 text-zinc-500 text-xs border border-dashed border-zinc-900 rounded-b-xl">
                    No contestant profiles detected matching sorting parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ================= PAGINATION BOTTOM ELEMENT BAR ================= */}
        <div className="p-4 bg-zinc-900/40 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-zinc-400">
            {isFetchingContestants
              ? "Loading contestants..."
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
