import { deletePositionFn, getPositionsFn } from "#/server/tenant-elections";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  ArrowLeft,
  Award,
  ChevronDown,
  Edit2,
  Filter,
  Hash,
  Loader2,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const electionsQueryOptions = (electionId: any) => ({
  queryKey: ["positions-admin", electionId],
  queryFn: () => getPositionsFn({ data: electionId }),
});


export const Route = createFileRoute("/admin/elections/$electionId/positions/")({
  component: PositionsDirectory,
  loader: async ({ context,params }) => {
    const electionId = params.electionId;
    return await context.queryClient.ensureQueryData(electionsQueryOptions(electionId));
  },
  pendingComponent: () => (
    <div className="flex justify-center p-12">
      <Loader2 className="animate-spin text-purple-500" />
    </div>
  ),
});

function PositionsDirectory() {
  const queryClient = useQueryClient();
  const { electionId } = Route.useParams(); 
  const { data }: any = useSuspenseQuery(electionsQueryOptions(electionId));
  const positions: any = data?.map((r: any) => ({
    id: r?.position.id,
    electionId: r.election?.id,
    title: r.position?.title,
    electionTitle: r.election?.title,
    slots: r.position?.slots,
    order: r.position?.order,
    candidatesCount: r.candidatesCount,
  }));
  
  // const [positions, setPositions] = useState<any[]>(initials);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedElectionFilter, setSelectedElectionFilter] =
    useState<string>("ALL");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dynamically extract unique elections to populate filtering dropdown options
  const uniqueElections = [
    "ALL",
    ...Array.from(new Set(positions.map((p: any) => p.electionTitle))),
  ];

  // Smart Click-Away Closing listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsFilterDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Pipeline sorting out row inclusions reactively
  const filteredPositions = positions.filter((position: any) => {
    const matchesSearch = position?.title
      ?.toLowerCase()
      .includes(searchQuery?.toLowerCase());
    const matchesFilter =
      selectedElectionFilter === "ALL" ||
      position?.electionTitle === selectedElectionFilter;
    return matchesSearch && matchesFilter;
  });

  const deleteMutation = useMutation({
    mutationFn: deletePositionFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions-admin"] });
      return redirect({ to: `/admin/elections/${electionId}/positions` });
    },
    onError: (error: any) => console.error(error.message),
  });

  const handleDeletePosition = (id: any) => {
    if (
      confirm(
        "Are you sure you want to remove this position category? Removing this will cascade and affect candidates attached to this ballot layer!",
      )
    ) {
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

      {/* ================= HEADER SECTION ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a192a]/50 p-6 rounded-xl border border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Position Manager
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Configure corporate offices, establish winner slot limits, and
            organize your digital ballot papers.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to={`/admin/elections/${electionId}/positions/new`}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs px-3.5 py-2 rounded-lg font-medium shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Position</span>
          </Link>
        </div>
      </div>

      {/* ================= FILTERS & RIBBON OVERVIEW ================= */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80 relative z-30">
        {/* Quick Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search position title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a192a]/50 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
        </div>

        {/* Interactive Custom Dropdown Filter for Elections */}
        <div className="relative w-full sm:w-auto" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
            className={`w-full sm:w-64 flex items-center justify-between gap-2 text-xs font-semibold px-4 py-2 rounded-lg border bg-[#0a192a]/50 text-zinc-300 transition-all focus:outline-none ${isFilterDropdownOpen ? "border-purple-500 ring-2 ring-purple-500/20" : "border-zinc-800 hover:border-zinc-700"}`}
          >
            <div className="flex items-center gap-2 truncate">
              <Filter className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-zinc-500 font-normal">Election:</span>
              <span className="text-white truncate">
                {selectedElectionFilter}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-200 ${isFilterDropdownOpen ? "transform rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown Options List */}
          {isFilterDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-full sm:w-64 rounded-lg border border-zinc-800 bg-[#0a192a]/50 p-1 shadow-2xl z-50 overflow-hidden divide-y divide-zinc-900 block">
              {uniqueElections.map((elec: any) => (
                <button
                  key={elec}
                  type="button"
                  onClick={() => {
                    setSelectedElectionFilter(elec);
                    setIsFilterDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-purple-600 hover:text-white flex items-center justify-between ${selectedElectionFilter === elec ? "bg-zinc-900 text-purple-400 font-semibold" : "text-zinc-400"}`}
                >
                  <span className="truncate pr-2">{elec}</span>
                  {selectedElectionFilter === elec && (
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================= POSITIONS TABLE DATA GRID ================= */}
      <div className="bg-[#0a192a]/50 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/60 bg-zinc-900/20 text-zinc-400 text-[11px] font-bold uppercase tracking-wider select-none">
                <th className="px-6 py-4">Position Title Designation</th>
                <th className="px-6 py-4">Linked Election Scope</th>
                <th className="px-6 py-4 text-center">Seat Slots</th>
                <th className="px-4 py-4 text-center">Candidates</th>
                <th className="px-4 py-4 text-center">Sorting Number</th>
                <th className="px-6 py-4 text-right">Action Overrides</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-sm">
              {filteredPositions.length > 0 ? (
                filteredPositions.map((position: any) => (
                  <tr
                    key={position.id}
                    className="hover:bg-zinc-900/20 transition-colors group"
                  >
                    {/* Left: Position Icon and Title */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                          <Award className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-white tracking-wide">
                            {position.title}
                          </span>
                          {/* <span className="text-[11px] text-zinc-500 font-mono mt-0.5">ID: pos_{position.id}</span> */}
                        </div>
                      </div>
                    </td>

                    {/* Middle: Linked Election Scope Join Title */}
                    <td className="px-6 py-4 align-middle">
                      <span className="text-zinc-300 text-xs bg-zinc-900/50 border border-zinc-800/60 px-2.5 py-1 rounded-md block w-max max-w-xs truncate">
                        {position.electionTitle}
                      </span>
                    </td>

                    {/* Center: Numeric Slot Allocation Pillar */}
                    <td className="px-6 py-4 align-middle text-center">
                      <div className="inline-flex items-center gap-1 text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded shadow-inner">
                        <Hash className="w-3 h-3 text-zinc-500" />
                        <span>{position.slots}</span>
                        <span className="text-[10px] text-zinc-500 font-sans font-normal ml-1">
                          {position.slots === 1 ? "Winner" : "Winners"}
                        </span>
                      </div>
                    </td>

                    {/* Center: Candidates number */}
                    <td className="px-4 py-4 align-middle text-center">
                      <div className="inline-flex items-center gap-2 text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded shadow-inner">
                        <Users className="w-3 h-3 text-zinc-500" />
                        <span>{position?.candidatesCount}</span>
                      </div>
                    </td>

                    {/* Center: Numeric Sorting Number */}
                    <td className="px-4 py-4 align-middle text-center">
                      <div className="inline-flex items-center gap-1 text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded shadow-inner">
                        <span className="text-[10px] text-zinc-500 font-sans font-normal ml-1">
                          Order
                        </span>
                        <Hash className="w-3 h-3 text-zinc-500" />
                        <span>{position?.order}</span>
                      </div>
                    </td>

                    {/* Right: Actions Menu Row */}
                    <td className="px-6 py-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/elections/${electionId}/positions/${position?.id}/edit`}
                          title="Edit Position Config"
                          className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDeletePosition(position.id)}
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
                  <td
                    colSpan={4}
                    className="text-center py-12 text-zinc-500 text-xs border border-dashed border-zinc-900 rounded-b-xl"
                  >
                    No position categories found matching sorting parameters.
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
