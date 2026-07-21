import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Crown,
  Printer,
  Trophy,
  Users,
} from "lucide-react";
import { getEventFinalResultsFn } from "#/server/tenant-events";
import { useSuspenseQuery } from "@tanstack/react-query";
import moment from "moment";
import { PanelSkeleton } from "#/components/ui/skeleton";

interface ContestantResult {
  id: string;
  name: string;
  teaser: string;
  imageUrl: string;
  code: string;
  ballotNumber: number;
  votes: number;
  percentage: number;
  isWinner: boolean;
}

interface CategoryResult {
  id: string;
  title: string;
  totalVotesForCategory: number;
  contestants: ContestantResult[];
}

const eventResultsQueryOptions = (eventId: any) => ({
  queryKey: ["event-final-results", eventId],
  queryFn: () => getEventFinalResultsFn({ data: { eventId } } as any),
});

export const Route = createFileRoute("/admin/events/$eventId/results")({
  component: EventFinalResultsPage,
  loader: async ({ context, params }: any) => {
    const eventId = params.eventId;
    await context.queryClient.ensureQueryData(eventResultsQueryOptions(eventId));
  },
  pendingComponent: () => <PanelSkeleton />,
});

function StatCard({
  label,
  value,
  sublabel,
  accent,
}: {
  label: string;
  value: string;
  sublabel: string;
  accent: string;
}) {
  return (
    <div className="w-full relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 print:break-inside-avoid print:border-zinc-300 print:shadow-none shadow-sm">
      <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] font-black uppercase tracking-widest text-zinc-500">{label}</p>
          <h3 className="mt-1.5 font-mono text-3xl font-black text-zinc-900 italic">{value}</h3>
          <p className="mt-1 text-[11px] text-zinc-500 font-semibold italic capitalize">{sublabel}</p>
        </div>
      </div>
    </div>
  );
}

function ContestantRow({ contestant }: { contestant: ContestantResult }) {
  const clampedWidth = Math.min(contestant.percentage, 100);
  return (
    <div
      className={`relative flex flex-col gap-2.5 rounded-lg border p-3.5 print:break-inside-avoid ${
        contestant.isWinner
          ? "border-emerald-300 bg-emerald-50/70 shadow-sm"
          : "border-zinc-200 bg-white"
      }`}
    >
      {contestant.isWinner && (
        <span className="absolute -top-2.5 right-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-green-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow print:shadow-none">
          <Crown className="h-3 w-3" /> Winner
        </span>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-center gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-zinc-400 bg-zinc-50 font-mono text-[12px] font-black text-zinc-500 italic">
          {contestant.ballotNumber}
        </span>

        <div
          className={`aspect-square w-1/3 shrink-0 overflow-hidden rounded-md border-2 ${
            contestant.isWinner ? "border-emerald-400" : "border-zinc-200"
          } bg-zinc-100 flex items-center justify-center`}
        >
          {contestant.imageUrl ? (
            <img src={contestant.imageUrl} alt={contestant.name} className="h-full w-full object-cover object-top" />
          ) : (
            <Users className="h-6 w-6 text-zinc-400" />
          )}
        </div>

        <div className="min-w-0 flex-1 sm:text-left">
          <p className="text-sm font-bold text-zinc-900">{contestant.name}</p>
          <p className="text-[10px] font-mono text-zinc-400">Code: {contestant.code}</p>
          {contestant.teaser ? (
            <p className="truncate text-[11px] italic text-zinc-500">{contestant.teaser}</p>
          ) : null}
        </div>

        <div className="shrink-0 text-right">
          <p className="font-mono text-base font-black text-zinc-900">{contestant.votes.toLocaleString()}</p>
          <p className="font-mono text-[11px] font-black text-zinc-500 italic">{contestant.percentage.toFixed(1)}%</p>
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          style={{ width: `${clampedWidth}%` }}
          className={`h-full rounded-full ${
            contestant.isWinner
              ? "bg-gradient-to-r from-emerald-500 to-green-400"
              : "bg-gradient-to-r from-indigo-600 to-purple-500"
          }`}
        />
      </div>
    </div>
  );
}

function CategorySection({ category }: { category: CategoryResult }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-5 print:break-inside-avoid-page print:border-zinc-300 print:bg-white">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-black uppercase tracking-wide text-zinc-600">{category.title}</h3>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-zinc-500">
          <span className="rounded border border-zinc-300 bg-white px-2 py-0.5">
            {category.totalVotesForCategory.toLocaleString()} Total Votes
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {category.contestants.length > 0 ? (
          category.contestants.map((contestant) => (
            <ContestantRow key={contestant.id} contestant={contestant} />
          ))
        ) : (
          <p className="col-span-full rounded-lg border border-dashed border-zinc-300 p-6 text-center text-xs italic text-zinc-400">
            No contestants enrolled in this category.
          </p>
        )}
      </div>
    </section>
  );
}

function EventFinalResultsPage() {
  const { eventId } = Route.useParams();
  const { data }: any = useSuspenseQuery(eventResultsQueryOptions(eventId));
  const { event, stats, categories } = data;

  return (
    <div className="min-h-screen py-8 print:bg-white print:py-0 print:[color-adjust:exact] print:[-webkit-print-color-adjust:exact]">
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          html, body, #dashboard-shell, #dashboard-content {
            background: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
          }
          #dashboard-content { padding: 0 !important; }
          .print-toolbar { display: none !important; }
          .print-sheet {
            background: #ffffff !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
          }
        }
      `}</style>

      {/* ================= SCREEN-ONLY TOOLBAR ================= */}
      <div className="print-toolbar mx-auto mb-5 flex max-w-5xl items-center justify-between px-4 print:hidden">
        <Link
          to="/admin/events/$eventId/manage"
          params={{ eventId }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Management Console
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-purple-500"
        >
          <Printer className="h-3.5 w-3.5" /> Print / Save as PDF
        </button>
      </div>

      {/* ================= PRINTABLE SHEET ================= */}
      <div className="print-sheet mx-auto max-w-5xl rounded-2xl border border-zinc-800 bg-white p-8 shadow-2xl print:rounded-none print:border-0 print:p-0 print:shadow-none sm:p-10">
        {/* HEADER */}
        <header className="mb-8 border-b-2 border-zinc-900 pb-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex aspect-square h-48 w-2/5 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-zinc-50">
              {event.imageUrl ? (
                <img src={event.imageUrl} alt={event.title} className="h-full w-full object-cover" />
              ) : (
                <Trophy className="h-1/2 w-1/2 text-zinc-300" />
              )}
            </div>
            <p className="text-xl font-black uppercase tracking-[0.2em] text-purple-600 sm:text-2xl">Official Final Results</p>
            <h1 className="text-2xl font-black leading-tight text-zinc-900 sm:text-3xl">{event.title}</h1>
          </div>
        </header>

        {/* STATISTICS SECTION */}
        <section className="mb-9">
          <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-zinc-500">Voting Statistics</h2>
          <div className="w-full flex flex-col sm:flex-row gap-3">
            <StatCard
              label="Total Votes"
              value={stats.totalVotes.toLocaleString()}
              sublabel="Paid votes cast"
              accent="bg-indigo-500"
            />
            <StatCard
              label="Gross Revenue"
              value={`₵${Number(stats.grossRevenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              sublabel="Collected"
              accent="bg-emerald-500"
            />
            <StatCard
              label="Transactions"
              value={stats.totalTransactions.toLocaleString()}
              sublabel="Recorded payments"
              accent="bg-purple-500"
            />
            <StatCard
              label="Contestants"
              value={stats.totalContestants.toLocaleString()}
              sublabel={`Across ${stats.totalCategories} ${stats.totalCategories === 1 ? "category" : "categories"}`}
              accent="bg-amber-500"
            />
          </div>
        </section>

        {/* CATEGORY RESULTS SECTION */}
        <section>
          <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-zinc-500">Results by Category</h2>
          <div className="space-y-5">
            {categories.map((category: CategoryResult) => (
              <CategorySection key={category.id} category={category} />
            ))}
            {categories.length === 0 && (
              <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-xs italic text-zinc-400">
                No categories have been configured for this event.
              </p>
            )}
          </div>
        </section>

        {/* FOOTER / CERTIFICATION (screen preview only) */}
        <footer className="mt-10 border-t border-zinc-200 pt-6 print:hidden">
          <p className="text-center text-[10px] text-zinc-400 italic">
            Results generated on {moment().format("MMMM D, YYYY [at] h:mm A")}
          </p>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div className="text-center">
              <div className="mb-1 h-10 border-b border-zinc-500" />
              <p className="text-[12px] font-black uppercase tracking-wide text-zinc-500">Event Organizer</p>
            </div>
            <div className="text-center">
              <div className="mb-1 h-10 border-b border-zinc-500" />
              <p className="text-[12px] font-black uppercase tracking-wide text-zinc-500">Verified By</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
