import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Award,
  Crown,
  Loader2,
  OctagonX,
  Printer,
  ShieldCheck,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { getElectionFinalResultsFn } from "#/server/tenant-elections";
import { useSuspenseQuery } from "@tanstack/react-query";
import moment from "moment";

interface CandidateResult {
  id: number | null;
  name: string;
  teaser: string;
  imageUrl: string;
  ballotNumber: number;
  votes: number;
  percentage: number;
  isWinner: boolean;
}

interface PositionResult {
  id: number;
  title: string;
  slots: number;
  totalVotesForPosition: number;
  abstentions: number;
  abstentionPercentage: number;
  candidates: CandidateResult[];
}

const electionResultsQueryOptions = (electionId: any) => ({
  queryKey: ["election-final-results", electionId],
  queryFn: () => getElectionFinalResultsFn({ data: { electionId } } as any),
});

export const Route = createFileRoute("/admin/elections/$electionId/results")({
  component: ElectionFinalResultsPage,
  loader: async ({ context, params }: any) => {
    const electionId = params.electionId;
    await context.queryClient.ensureQueryData(electionResultsQueryOptions(electionId));
  },
  pendingComponent: () => (
    <div className="flex justify-center p-12">
      <Loader2 className="animate-spin text-purple-500" />
    </div>
  ),
});

function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  accent,
}: {
  icon: any;
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
        {/* <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accent} bg-opacity-10`}>
          <Icon className="h-4.5 w-4.5 text-zinc-700" />
        </div> */}
      </div>
    </div>
  );
}

function CandidateRow({ candidate }: { candidate: CandidateResult }) {
  const clampedWidth = Math.min(candidate.percentage, 100);
  return (
    <div
      className={`relative flex flex-col gap-2.5 rounded-lg border p-3.5 print:break-inside-avoid ${
        candidate.isWinner
          ? "border-emerald-300 bg-emerald-50/70 shadow-sm"
          : "border-zinc-200 bg-white"
      }`}
    >
      {candidate.isWinner && (
        <span className="absolute -top-2.5 right-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-green-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow print:shadow-none">
          <Crown className="h-3 w-3" /> Winner
        </span>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-center gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-zinc-400 bg-zinc-50 font-mono text-[12px] font-black text-zinc-500 italic">
          {candidate.ballotNumber}
        </span>

        <div
          className={`aspect-square w-1/3 shrink-0 overflow-hidden rounded-md border-2 ${
            candidate.isWinner ? "border-emerald-400" : "border-zinc-200"
          } bg-zinc-100 flex items-center justify-center`}
        >
          {candidate.imageUrl ? (
            <img src={candidate.imageUrl} alt={candidate.name} className="h-full w-full object-cover" />
          ) : (
            <Users className="h-6 w-6 text-zinc-400" />
          )}
        </div>

        <div className="min-w-0 flex-1 sm:text-left">
          <p className="text-sm font-bold text-zinc-900">{candidate.name}</p>
          {candidate.teaser ? (
            <p className="truncate text-[11px] italic text-zinc-500">{candidate.teaser}</p>
          ) : null}
        </div>

        <div className="shrink-0 text-right">
          <p className="font-mono text-base font-black text-zinc-900">{candidate.votes.toLocaleString()}</p>
          <p className="font-mono text-[11px] font-black text-zinc-500 italic">{candidate.percentage.toFixed(1)}%</p>
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          style={{ width: `${clampedWidth}%` }}
          className={`h-full rounded-full ${
            candidate.isWinner
              ? "bg-gradient-to-r from-emerald-500 to-green-400"
              : "bg-gradient-to-r from-indigo-600 to-purple-500"
          }`}
        />
      </div>
    </div>
  );
}

function AbstentionCard({ abstentions, abstentionPercentage }: { abstentions: number; abstentionPercentage: number }) {
  const clampedWidth = Math.min(abstentionPercentage, 100);
  return (
    <div className="relative flex flex-col gap-2.5 rounded-lg border border-dashed border-red-300 bg-red-50/40 p-3.5 print:break-inside-avoid">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-red-300 bg-white font-mono text-[12px] font-black italic text-red-500">
          —
        </span>

        <div className="flex aspect-square w-1/3 shrink-0 items-center justify-center overflow-hidden rounded-md border-2 border-red-200 bg-red-100/60">
          <OctagonX className="h-6 w-6 text-red-500" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-zinc-900">Abstained / Skipped</p>
          <p className="truncate text-[11px] italic text-zinc-500">No candidate selected</p>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-mono text-base font-black text-zinc-900">{abstentions.toLocaleString()}</p>
          <p className="font-mono text-[11px] font-black italic text-zinc-500">{abstentionPercentage.toFixed(1)}%</p>
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          style={{ width: `${clampedWidth}%` }}
          className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-300"
        />
      </div>
    </div>
  );
}

function PositionSection({ position }: { position: PositionResult }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-5 print:break-inside-avoid-page print:border-zinc-300 print:bg-white">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3">
        <div className="flex items-center gap-2">
          {/* <Award className="h-4 w-4 text-purple-600" /> */}
          <h3 className="text-xl font-black uppercase tracking-wide text-zinc-600">{position.title}</h3>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-zinc-500">
          <span className="rounded border border-zinc-300 bg-white px-2 py-0.5">
            {position.slots} {position.slots === 1 ? "Slot" : "Slots"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {position.candidates.map((candidate) => (
          <CandidateRow key={candidate.id ?? `cand-${position.id}`} candidate={candidate} />
        ))}
        <AbstentionCard abstentions={position.abstentions} abstentionPercentage={position.abstentionPercentage} />
      </div>
    </section>
  );
}

function ElectionFinalResultsPage() {
  const { electionId } = Route.useParams();
  const { data }: any = useSuspenseQuery(electionResultsQueryOptions(electionId));
  const { election, stats, positions } = data;

  const dateRange =
    election.startAt && election.endAt
      ? `${moment(election.startAt).format("MMM D, YYYY, h:mm A")} — ${moment(election.endAt).format("MMM D, YYYY, h:mm A")}`
      : "Schedule not set";

  return (
    <div className="min-h-screen bg-zinc-900 py-8 print:bg-white print:py-0 print:[color-adjust:exact] print:[-webkit-print-color-adjust:exact]">
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
          to="/admin/elections/$electionId/manage"
          params={{ electionId }}
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
              {election.imageUrl ? (
                <img src={election.imageUrl} alt="Organization logo" className="h-full w-full object-contain" />
              ) : (
                <ShieldCheck className="h-1/2 w-1/2 text-zinc-300" />
              )}
            </div>
            <p className="text-xl font-black uppercase tracking-[0.2em] text-purple-600 sm:text-2xl">Official Final Results</p>
            <h1 className="text-2xl font-black leading-tight text-zinc-900 sm:text-3xl">{election.title}</h1>
            {/* <p className="font-mono text-[11px] text-zinc-500">{dateRange}</p> */}
          </div>
        </header>

        {/* STATISTICS SECTION */}
        <section className="mb-9">
          <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-zinc-500">Voter Turnout &amp; Statistics</h2>
          <div className="w-full flex flex-col sm:flex-row gap-3">
            <StatCard
              icon={Users}
              label="Eligible Voters"
              value={stats.registeredVoters.toLocaleString()}
              sublabel="Total registered"
              accent="bg-indigo-500"
            />
            <StatCard
              icon={UserCheck}
              label="Votes Cast"
              value={stats.votedCount.toLocaleString()}
              sublabel="Ballots submitted"
              accent="bg-emerald-500"
            />
            <StatCard
              icon={Award}
              label="Turnout"
              value={`${stats.turnoutPercentage.toFixed(1)}%`}
              sublabel="Of eligible voters"
              accent="bg-purple-500"
            />
            <StatCard
              icon={UserX}
              label="Absentees"
              value={stats.absentees.toLocaleString()}
              sublabel="Did not vote"
              accent="bg-rose-500"
            />
          </div>
        </section>

        {/* PORTFOLIO RESULTS SECTION */}
        <section>
          <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-zinc-500">Results by Portfolio</h2>
          <div className="space-y-5">
            {positions.map((position: PositionResult) => (
              <PositionSection key={position.id} position={position} />
            ))}
            {positions.length === 0 && (
              <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-xs italic text-zinc-400">
                No portfolios have been configured for this election.
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
              <p className="text-[12px] font-black uppercase tracking-wide text-zinc-500">Returning Officer</p>
            </div>
            <div className="text-center">
              <div className="mb-1 h-10 border-b border-zinc-500" />
              <p className="text-[12px] font-black uppercase tracking-wide text-zinc-500">Election Committee Chairperson</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
