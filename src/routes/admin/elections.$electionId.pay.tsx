import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, CreditCard, FileText, ShieldCheck } from "lucide-react";
import { getElectionOverview } from "#/server/tenant-elections";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PanelSkeleton } from "#/components/ui/skeleton";

const electionsQueryOptions = (electionId: any) => ({
  queryKey: ['election-overview', electionId],
  queryFn: () => getElectionOverview({ data: electionId }),
});

export const Route = createFileRoute("/admin/elections/$electionId/pay")({
  component: ElectionPayPage,
  loader: async ({ context, params }: any) => {
    const electionId = params.electionId;
    await context.queryClient.ensureQueryData(electionsQueryOptions(electionId));
  },
  pendingComponent: () => <PanelSkeleton />,
});

function ElectionPayPage() {
  const { electionId } = Route.useParams();
  const { data: election }: any = useSuspenseQuery(electionsQueryOptions(electionId));

  const amountDue = election.billAmount ? Number(election.billAmount) : 0;

  const handlePayWithPaystack = () => {
    // TODO: Wire up Paystack checkout here — pass electionId, election.title, and amountDue.
    alert("Payment integration coming soon. Paystack checkout will be wired up here.");
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Link
        to="/admin/elections/$electionId/manage"
        params={{ electionId }}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Management Console
      </Link>

      <div className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-950/30 border border-purple-900/30 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Pay Election Invoice</h1>
            <p className="text-xs text-zinc-400 mt-0.5">{election.title}</p>
          </div>
        </div>

        {election.billPaid ? (
          <div className="flex items-center gap-2 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-xs font-semibold rounded-lg px-4 py-3">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> This invoice has already been paid in full.
          </div>
        ) : (
          <>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Amount Due</p>
                <p className="font-mono text-2xl font-black text-white mt-1">GHS {amountDue.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Eligible Voters</p>
                <p className="text-sm font-semibold text-zinc-200 mt-1">{election.billVoters ?? 0}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePayWithPaystack}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold py-3 rounded-lg transition-all shadow-md"
            >
              <CreditCard className="w-4 h-4" /> Pay with Paystack
            </button>

            <p className="flex items-center gap-1.5 text-[10px] text-zinc-500">
              <ShieldCheck className="w-3 h-3 shrink-0" /> Payments are processed securely. This checkout is not yet live — Paystack integration is coming soon.
            </p>
          </>
        )}

        <Link
          to="/admin/elections/$electionId/invoice"
          params={{ electionId }}
          className="flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium py-2 rounded-lg transition-all"
        >
          <FileText className="w-3.5 h-3.5" /> View Invoice
        </Link>
      </div>
    </div>
  );
}
