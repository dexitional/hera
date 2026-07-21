import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  Plus, Search, Edit2, Trash2, Sliders,
  Sparkles, Filter, ChevronDown, CheckCircle, XCircle, FolderTree, Coins, ImageOff
} from "lucide-react";
import { deleteEventFn, getEventsFn } from "#/server/tenant-events";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { TableSkeleton } from "#/components/ui/skeleton";

const eventsQueryOptions = () => ({
  queryKey: ['events-admin'],
  queryFn: () => getEventsFn(),
});

export const Route = createFileRoute("/admin/events/")({
  component: EventsDirectory,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(eventsQueryOptions());
  },
  pendingComponent: () => <TableSkeleton />,
});

function EventsDirectory() {
  const queryClient = useQueryClient();
  const { data: events }: any = useSuspenseQuery(eventsQueryOptions());

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "DISABLED">("ALL");
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

  const filteredEvents = (events ?? []).filter((event: any) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === "ACTIVE") return matchesSearch && event.isActive;
    if (statusFilter === "DISABLED") return matchesSearch && !event.isActive;
    return matchesSearch;
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEventFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events-admin'] }),
    onError: (error: any) => console.error(error.message),
  });

  const handleDeleteEvent = (id: any) => {
    if (confirm("Are you sure you want to delete this event? This will permanently drop all nested categories, contestants, and cast votes under this record!")) {
      deleteMutation.mutate({ data: id } as any);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">

        {/* ================= HEADER SECTION ================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a192a]/50 p-6 rounded-xl border border-zinc-800">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>Public Events Manager</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Launch public voting events, organize award categories, and track pay-per-vote revenue.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/admin/events/new"
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs px-3.5 py-2 rounded-lg font-medium shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Voting Event</span>
            </Link>
          </div>
        </div>

        {/* ================= BAR FILTERS & QUICK SEARCH ================= */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80 relative z-30">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by title or description..."
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
                <span className="text-white truncate uppercase text-[11px] font-bold">{statusFilter}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-200 ${isFilterDropdownOpen ? "transform rotate-180" : ""}`} />
            </button>

            {isFilterDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-full sm:w-48 rounded-lg border border-zinc-800 bg-[#0a192a]/50 p-1 shadow-2xl z-50 overflow-hidden divide-y divide-zinc-900 block animate-in fade-in slide-in-from-top-1 duration-100">
                {(["ALL", "ACTIVE", "DISABLED"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => {
                      setStatusFilter(filter);
                      setIsFilterDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-purple-600 hover:text-white flex items-center justify-between ${statusFilter === filter ? "bg-zinc-900 text-purple-400 font-semibold" : "text-zinc-400"}`}
                  >
                    <span>{filter === "ALL" ? "All Platforms" : filter === "ACTIVE" ? "Active (Live)" : "Disabled (Closed)"}</span>
                    {statusFilter === filter && (
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#0a192a]/50 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl relative z-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/60 bg-zinc-900/20 text-zinc-400 text-[11px] font-bold uppercase tracking-wider select-none">
                  <th className="px-6 py-4">Event</th>
                  <th className="px-6 py-4 text-center">Categories</th>
                  <th className="px-6 py-4 text-center">Price / Vote</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Console Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-sm">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event: any) => (
                    <tr key={event.id} className="hover:bg-zinc-900/20 transition-colors group">

                      <td className="px-6 py-4 max-w-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                            {event.imageUrl ? (
                              <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                            ) : (
                              <ImageOff className="w-4 h-4 text-zinc-600" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-white tracking-wide text-sm truncate">{event.title}</span>
                            <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                              {event.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 align-middle text-center">
                        <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 text-purple-400 px-2.5 py-1 rounded shadow-inner">
                          <FolderTree className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{event.categoriesCount}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 align-middle text-center">
                        <div className="inline-flex items-center gap-1 text-xs font-mono font-bold text-zinc-300 bg-zinc-900/60 border border-zinc-800/40 px-2 py-1 rounded">
                          <Coins className="w-3 h-3 text-amber-500" />
                          <span>{event.unitPrice != null ? `₵${Number(event.unitPrice).toFixed(2)}` : "—"}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 align-middle text-center">
                        <div className="inline-flex justify-center">
                          {event.isActive ? (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-2.5 py-0.5 rounded-full">
                              <CheckCircle className="w-3 h-3 animate-pulse" /> Live
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-full">
                              <XCircle className="w-3 h-3" /> Closed
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-3">

                          <Link
                            to="/admin/events/$eventId/manage"
                            params={{ eventId: String(event.id) }}
                            className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-all shadow-sm"
                          >
                            <Sliders className="w-3 h-3 text-purple-400" />
                            <span>Manage</span>
                          </Link>

                          <div className="flex items-center gap-1 border-l border-zinc-800 pl-2">
                            <Link
                              to="/admin/events/$eventId/edit"
                              params={{ eventId: String(event.id) }}
                              title="Edit Event"
                              className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              title="Delete Event Instance"
                              className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                        </div>
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-zinc-500 text-xs border border-dashed border-zinc-900 rounded-b-xl">
                      No public events detected matching sorting filters.
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
