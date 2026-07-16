import { getPublicEventFn } from "#/server/tenant-events";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Clock, Search, ThumbsUp, Users } from "lucide-react";
import moment from "moment";
import { useRef, useState } from "react";

function getEventStatus(event: any, now: Date): "LIVE" | "UPCOMING" | "ENDED" {
  if (!event.isActive) return "ENDED";
  if (event.startAt && now < new Date(event.startAt)) return "UPCOMING";
  if (event.endAt && now > new Date(event.endAt)) return "ENDED";
  return "LIVE";
}

const eventQueryOptions = (eventId: any) => ({
  queryKey: ["event-page", eventId],
  queryFn: () => getPublicEventFn({ data: eventId } as any),
});

export const Route = createFileRoute("/events/$eventId/categories/")({
  component: RouteComponent,
  loader: async ({ context, params }: any) => {
    const eventId = params.eventId;
    return await context.queryClient.ensureQueryData(eventQueryOptions(eventId));
  },
});

function RouteComponent() {
  const { eventId } = Route.useParams();
  const { data: event }: any = useSuspenseQuery(eventQueryOptions(eventId));

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const status = getEventStatus(event, new Date());
  const daysLeft = event.endAt ? Math.max(moment(event.endAt).diff(moment(), "days"), 0) : null;

  const filteredCategories = (event.categories ?? []).filter((category: any) =>
    category.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#18181b] text-white antialiased font-sans">
      <main className="w-full">
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pt-6 sm:pt-10 lg:pt-14 pb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col gap-4">
            <div className="mb-2">
              <Link
                to="/events"
                className="p-2 w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-600/10 hover:bg-slate-600/20 transition-colors border border-slate-600/20 hover:border-slate-600/40 inline-flex"
              >
                <ArrowLeft className="w-5 h-5 text-purple-400" />
              </Link>
            </div>
            <h1
              className="text-2xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight mb-2"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {event.title}
            </h1>
            <p className="text-sm text-zinc-400 mb-3">{event.description}</p>

            <div className="flex items-center gap-3 text-xs sm:text-sm text-zinc-400 mb-1 flex-wrap">
              <button
                type="button"
                aria-label={isSearchOpen ? "Hide search" : "Show search"}
                aria-expanded={isSearchOpen}
                onClick={() =>
                  setIsSearchOpen((prev) => {
                    const next = !prev;
                    if (next) requestAnimationFrame(() => searchInputRef.current?.focus());
                    return next;
                  })
                }
                className={`p-2 w-8 h-8 flex items-center justify-center rounded-xl border transition-colors shrink-0 ${
                  isSearchOpen
                    ? "bg-purple-700/30 border-purple-500/40"
                    : "bg-slate-700/30 hover:bg-purple-700/30 border-slate-600/20 hover:border-purple-500/40"
                }`}
              >
                <Search className="w-4 h-4 text-purple-300" />
              </button>
              <div className="flex items-center gap-1.5 bg-slate-600/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs sm:text-sm font-medium text-white">
                  {event.categories.length} {event.categories.length === 1 ? "Category" : "Categories"}
                </span>
              </div>
              {daysLeft !== null && (
                <div className="flex items-center gap-2 bg-slate-600/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span className="text-xs sm:text-sm font-medium text-white">{daysLeft} days left</span>
                </div>
              )}
            </div>

            {isSearchOpen && (
              <div className="relative w-full animate-in fade-in slide-in-from-top-2 duration-300">
                <input
                  ref={searchInputRef}
                  placeholder="Search categories..."
                  className="w-full px-4 py-3.5 bg-slate-600/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400 pl-12 border border-slate-600/30 text-sm backdrop-blur-sm text-white placeholder-zinc-400"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => !searchQuery && setIsSearchOpen(false)}
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
              </div>
            )}
          </div>
        </section>

        <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-10 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {filteredCategories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {filteredCategories.map((category: any, index: number) => (
                <div
                  key={category.id}
                  style={{ animationDelay: `${Math.min(index, 8) * 60}ms`, animationDuration: "500ms" }}
                  className="rounded-3xl p-8 flex flex-col gap-4 shadow-md transition-all duration-300 group bg-[#6d28d9]/8 animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                >
                  <div className="flex items-center justify-between">
                    <ThumbsUp className="w-8 h-8 text-purple-300" />
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                        status === "LIVE" ? "bg-green-500" : status === "UPCOMING" ? "bg-amber-500" : "bg-slate-500"
                      }`}
                    >
                      {status === "LIVE" ? "Active" : status === "UPCOMING" ? "Upcoming" : "Ended"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-200 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-zinc-300 mb-4 truncate">
                      {category.description}
                    </p>
                    {event.unitPrice != null && (
                      <p className="text-sm text-zinc-300">
                        Vote Price: <span className="text-white font-bold">GH₵{Number(event.unitPrice).toFixed(2)}</span>
                      </p>
                    )}
                  </div>
                  <Link
                    to="/events/$eventId/categories/$categoryId"
                    params={{ eventId, categoryId: String(category.id) }}
                    className="w-full px-4 py-3 bg-gradient-to-r from-[#6d28d9] to-purple-600 text-white rounded-2xl hover:from-[#6d28d9]/90 hover:to-purple-600/90 transition-all duration-300 flex items-center justify-center gap-2 group/button text-sm font-bold shadow-lg"
                  >
                    View Nominees
                    <ArrowRight className="w-4 h-4 group-hover/button:translate-x-1 transition-transform" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-center py-16">
              <div className="flex flex-col items-center text-center gap-2 bg-slate-800/40 border border-slate-700/50 rounded-3xl px-12 py-10 max-w-sm animate-in fade-in zoom-in-95 duration-300">
                <Users className="w-12 h-12 text-slate-400 mb-2" />
                <h3 className="text-xl font-bold text-white">No Categories Available</h3>
                <p className="text-sm text-zinc-400">No categories match your search.</p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
