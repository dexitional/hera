import { getPublicEventFn } from "#/server/tenant-events";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Clock, Search, ThumbsUp, Users } from "lucide-react";
import moment from "moment";
import { useState } from "react";

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

  const status = getEventStatus(event, new Date());
  const daysLeft = event.endAt ? Math.max(moment(event.endAt).diff(moment(), "days"), 0) : null;

  const filteredCategories = (event.categories ?? []).filter((category: any) =>
    category.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#18181b] text-white antialiased font-sans">
      <main className="w-full">
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pt-6 sm:pt-10 lg:pt-14 pb-8">
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

            <div className="flex items-center gap-4 text-xs sm:text-sm text-zinc-400 mb-3 flex-wrap">
              {isSearchOpen ? (
                <div className="relative flex-1 min-w-[220px] max-w-sm">
                  <input
                    autoFocus
                    placeholder="Search categories..."
                    className="w-full px-3 py-2 bg-slate-600/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 pl-9 border border-slate-600/30 text-xs backdrop-blur-sm text-white placeholder-zinc-400"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => !searchQuery && setIsSearchOpen(false)}
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-3.5 h-3.5" />
                </div>
              ) : (
                <button
                  type="button"
                  aria-label="Search categories"
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 w-8 h-8 flex items-center justify-center rounded-xl bg-slate-700/30 hover:bg-purple-700/30 border border-slate-600/20 hover:border-purple-500/40 transition-colors"
                >
                  <Search className="w-4 h-4 text-purple-300" />
                </button>
              )}
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
          </div>
        </section>

        <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-10 pb-24">
          {filteredCategories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {filteredCategories.map((category: any) => (
                <div
                  key={category.id}
                  className="rounded-3xl p-8 flex flex-col gap-4 shadow-md transition-all duration-300 group bg-[#6d28d9]/8"
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
            <div className="text-center py-16 text-zinc-500 text-sm border border-dashed border-slate-700 rounded-3xl">
              No categories found matching your search.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
