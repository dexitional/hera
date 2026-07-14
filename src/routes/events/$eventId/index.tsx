import { getPublicEventFn } from "#/server/tenant-events";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CalendarClock, Clock, Coins, FolderTree, Hash, User } from "lucide-react";
import moment from "moment";

const eventQueryOptions = (eventId: any) => ({
  queryKey: ["event-page", eventId],
  queryFn: () => getPublicEventFn({ data: eventId } as any),
});

export const Route = createFileRoute("/events/$eventId/")({
  component: RouteComponent,
  loader: async ({ context, params }: any) => {
    const eventId = params.eventId;
    return await context.queryClient.ensureQueryData(eventQueryOptions(eventId));
  },
});

function getEventStatus(event: any, now: Date): "LIVE" | "UPCOMING" | "ENDED" {
  if (!event.isActive) return "ENDED";
  if (event.startAt && now < new Date(event.startAt)) return "UPCOMING";
  if (event.endAt && now > new Date(event.endAt)) return "ENDED";
  return "LIVE";
}

function RouteComponent() {
  const { eventId } = Route.useParams();
  const { data: event }: any = useSuspenseQuery(eventQueryOptions(eventId));
  const rightNow = new Date();
  const status = getEventStatus(event, rightNow);

  return (
    <div className="min-h-screen bg-[#18181b] text-white antialiased font-sans">
      <main className="w-full">
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pt-6 sm:pt-10 lg:pt-14 pb-8">
          <div className="mb-6">
            <Link
              to="/events"
              className="p-2 w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-600/10 hover:bg-slate-600/20 transition-colors border border-slate-600/20 hover:border-slate-600/40 inline-flex"
            >
              <ArrowLeft className="w-5 h-5 text-purple-400" />
            </Link>
          </div>

          {event.imageUrl && (
            <div className="mb-6 rounded-3xl overflow-hidden border border-slate-600/20 relative h-48 md:h-64 lg:h-72 w-full">
              <img
                alt={event.title}
                src={event.imageUrl}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#18181b] via-transparent to-transparent" />
            </div>
          )}

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1
                className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight uppercase"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {event.title}
              </h1>
              <p className="text-base md:text-lg text-zinc-300 max-w-2xl">
                {event.description}
              </p>
            </div>
            <span
              className={`text-xs px-3 py-1.5 rounded-full font-bold shrink-0 ${
                status === "LIVE"
                  ? "bg-purple-500 text-white animate-pulse"
                  : status === "UPCOMING"
                    ? "bg-amber-500 text-white"
                    : "bg-slate-500 text-white"
              }`}
            >
              {status === "LIVE" ? "Live" : status === "UPCOMING" ? "Upcoming" : "Past"}
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap mt-6">
            <span className="px-3 py-1.5 bg-slate-600/20 rounded-full text-xs flex items-center gap-1.5 border border-slate-600/30">
              <FolderTree className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-zinc-300">{event.categories.length} {event.categories.length === 1 ? "Category" : "Categories"}</span>
            </span>
            {event.unitPrice != null && (
              <span className="px-3 py-1.5 bg-slate-600/20 rounded-full text-xs flex items-center gap-1.5 border border-slate-600/30">
                <Coins className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-zinc-300">₵{Number(event.unitPrice).toFixed(2)} / vote</span>
              </span>
            )}
            {event.startAt && (
              <span className="px-3 py-1.5 bg-slate-600/20 rounded-full text-xs flex items-center gap-1.5 border border-slate-600/30">
                <CalendarClock className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-zinc-300">Opens {moment(event.startAt).format("LLL")}</span>
              </span>
            )}
            {event.endAt && (
              <span className="px-3 py-1.5 bg-slate-600/20 rounded-full text-xs flex items-center gap-1.5 border border-slate-600/30">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-zinc-300">Closes {moment(event.endAt).format("LLL")}</span>
              </span>
            )}
          </div>

          <div className="mt-8">
            <Link
              to="/events/$eventId/categories"
              params={{ eventId: String(event.id) }}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-[#6d28d9] to-purple-600 text-white rounded-2xl hover:from-[#6d28d9]/90 hover:to-purple-600/90 transition-all duration-300 flex items-center justify-center gap-2 group text-sm font-bold shadow-lg inline-flex"
            >
              Browse All Categories
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

        <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pb-24">
          <div className="col-span-full flex items-center my-4">
            <div className="flex-1 h-px bg-slate-700"></div>
            <span className="mx-6 text-zinc-400 text-sm font-semibold uppercase tracking-wider">
              Voting Categories
            </span>
            <div className="flex-1 h-px bg-slate-700"></div>
          </div>

          {event.categories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {event.categories.map((category: any) => (
                <Link
                  key={category.id}
                  to="/events/$eventId/categories/$categoryId"
                  params={{ eventId: String(event.id), categoryId: String(category.id) }}
                  className="rounded-3xl p-6 flex flex-col gap-3 shadow-md transition-all duration-300 group bg-[#6d28d9]/8 hover:bg-[#6d28d9]/14"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-purple-950/30 border border-purple-900/30 flex items-center justify-center">
                      <FolderTree className="w-5 h-5 text-purple-300" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-zinc-900/60 border border-zinc-700/40 text-zinc-300 px-2 py-1 rounded">
                      <Hash className="w-3 h-3 text-zinc-500" />
                      {category.code}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1.5 group-hover:text-purple-200 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-zinc-300 line-clamp-2">
                      {category.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <User className="w-3.5 h-3.5 text-purple-400" />
                    <span>{category.contestantsCount} {category.contestantsCount === 1 ? "Nominee" : "Nominees"}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-zinc-500 text-sm border border-dashed border-slate-700 rounded-3xl">
              No voting categories have been published for this event yet.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
