import { getActiveEventsFn } from "#/server/tenant-events";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, Clock, LayoutGrid, Search, ArrowRight, CalendarDays, ImageIcon, Ticket } from "lucide-react";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { CardGridSkeleton } from "#/components/ui/skeleton";

const eventsQueryOptions = () => ({
  queryKey: ["events-page"],
  queryFn: () => getActiveEventsFn(),
});

export const Route = createFileRoute("/events/")({
  component: RouteComponent,
  loader: async ({ context }) => {
    return await context.queryClient.ensureQueryData(eventsQueryOptions());
  },
  pendingComponent: () => (
    <div className="min-h-screen bg-[#0d1f36] text-white antialiased font-sans">
      <main className="w-full">
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pt-6 sm:pt-10 lg:pt-14 pb-16">
          <CardGridSkeleton />
        </section>
      </main>
    </div>
  ),
});

function getEventStatus(event: any, now: Date): "LIVE" | "UPCOMING" | "ENDED" {
  if (!event.isActive) return "ENDED";
  if (event.startAt && now < new Date(event.startAt)) return "UPCOMING";
  if (event.endAt && now > new Date(event.endAt)) return "ENDED";
  return "LIVE";
}

function RouteComponent() {
  const { data }: any = useSuspenseQuery(eventsQueryOptions());
  const rightNow = new Date();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "LIVE" | "UPCOMING" | "ENDED">("ALL");
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

  const filteredEvents = (data ?? []).filter((event: any) => {
    const status = getEventStatus(event, rightNow);
    const matchesSearch =
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#0d1f36] text-white antialiased font-sans">
      <main className="w-full">
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pt-6 sm:pt-10 lg:pt-14 pb-16 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="text-left">
            <h1
              className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Vote on Events
            </h1>
            <p className="text-lg md:text-xl text-zinc-300 max-w-2xl">
              Discover and participate in exciting voting events. Your voice
              matters in shaping the future of democratic participation.
            </p>
          </div>
        </section>

        <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pb-8 animate-in fade-in slide-in-from-top-2 duration-500 delay-100 fill-mode-both">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <input
                placeholder="Search events..."
                className="w-full px-4 py-3.5 bg-slate-600/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400 pl-12 border border-slate-600/30 text-sm backdrop-blur-sm text-white placeholder-zinc-400"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
            </div>
            <div className="flex gap-2">
              <div className="relative" ref={dropdownRef}>
                <button
                  className="flex items-center gap-3 px-6 py-3.5 bg-[#18181b] border border-slate-600/30 rounded-2xl text-sm font-medium text-white hover:bg-slate-800/50 hover:border-slate-500/50 transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-slate-500/25 focus:outline-none focus:ring-2 focus:ring-purple-400 min-w-[160px]"
                  type="button"
                  onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
                >
                  <CalendarDays className="w-4 h-4 text-purple-400" />
                  <span className="flex-1 text-left">
                    {statusFilter === "ALL" ? "Show All" : statusFilter === "LIVE" ? "Live" : statusFilter === "UPCOMING" ? "Upcoming" : "Ended"}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-purple-400 transition-transform duration-200 ${isFilterDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {isFilterDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-full sm:w-48 rounded-2xl border border-slate-600/30 bg-[#18181b] p-1 shadow-2xl z-50 overflow-hidden divide-y divide-slate-700/60">
                    {(["ALL", "LIVE", "UPCOMING", "ENDED"] as const).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => {
                          setStatusFilter(filter);
                          setIsFilterDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors hover:bg-purple-600 hover:text-white ${statusFilter === filter ? "bg-slate-700/40 text-purple-400 font-semibold" : "text-zinc-400"}`}
                      >
                        {filter === "ALL" ? "Show All" : filter === "LIVE" ? "Live" : filter === "UPCOMING" ? "Upcoming" : "Ended"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pb-24 animate-in fade-in duration-500 delay-150 fill-mode-both">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event: any, index: number) => {
                const status = getEventStatus(event, rightNow);
                const daysLeft = event.endAt ? Math.max(moment(event.endAt).diff(moment(), "days"), 0) : null;
                return (
                  <div
                    key={event.id}
                    style={{ animationDelay: `${Math.min(index, 8) * 60}ms`, animationDuration: "500ms" }}
                    className="rounded-3xl bg-slate-600/10 backdrop-blur-sm border border-slate-600/20 overflow-hidden hover:border-slate-600/40 transition-all duration-300 group shadow-md animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                  >
                    <div className="relative h-56 bg-gradient-to-br from-[#6d28d9]/30 via-slate-700/20 to-slate-900/40 flex items-center justify-center overflow-hidden">
                      {event.imageUrl ? (
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <ImageIcon className="w-10 h-10 text-purple-300/60" />
                      )}
                      <div className="absolute top-4 right-4">
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-semibold shadow-lg ${
                            status === "LIVE"
                              ? "bg-emerald-500 text-white"
                              : status === "UPCOMING"
                                ? "bg-amber-500 text-white"
                                : "bg-slate-500 text-white"
                          }`}
                        >
                          {status === "LIVE" ? "Ongoing" : status === "UPCOMING" ? "Upcoming" : "Ended"}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-extrabold text-white mb-1 truncate group-hover:text-purple-400 transition-colors uppercase tracking-wide">
                        {event.title}
                      </h3>
                      <p className="text-sm text-zinc-400 mb-4 truncate">
                        {event.description}
                      </p>

                      <div className="flex items-center justify-between text-sm text-zinc-400 mb-6 gap-2">
                        <span className="px-3 py-1.5 bg-slate-600/20 rounded-full text-xs flex items-center gap-1.5 border border-slate-600/30">
                          <LayoutGrid className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-zinc-300">{event.categoriesCount} {event.categoriesCount === 1 ? "Category" : "Categories"}</span>
                        </span>
                        {daysLeft !== null && (
                          <span className="px-3 py-1.5 bg-slate-600/20 rounded-full text-xs flex items-center gap-1.5 border border-slate-600/30">
                            <Clock className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-zinc-300">{daysLeft} days left</span>
                          </span>
                        )}
                      </div>

                      <Link
                        to="/events/$eventId/categories"
                        params={{ eventId: String(event.id) }}
                        className="w-full px-6 py-3 bg-[#E3F09B] hover:bg-[#c0ff14] text-[#131313] rounded-lg shadow-[5px_5px_10px_rgba(0,0,0,0.116)] transition-all duration-500 active:scale-[0.97] flex items-center justify-center gap-2 group text-sm font-bold"
                      >
                        View Categories
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full flex items-center justify-center min-h-[50vh] py-16">
                <div className="flex flex-col items-center text-center gap-2 bg-slate-800/40 border border-slate-700/50 rounded-3xl px-12 py-10 max-w-sm animate-in fade-in zoom-in-95 duration-300">
                  <Ticket className="w-12 h-12 text-slate-400 mb-2" />
                  <h3 className="text-xl font-bold text-white">No Events Found</h3>
                  <p className="text-sm text-zinc-400">There are no events available at the moment. Check back later for new events.</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
