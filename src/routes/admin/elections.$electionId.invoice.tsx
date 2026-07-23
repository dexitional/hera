import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CreditCard, FileText, Printer, Receipt } from "lucide-react";
import { getElectionOverview } from "#/server/tenant-elections";
import { useSuspenseQuery } from "@tanstack/react-query";
import moment from "moment";
import { PanelSkeleton } from "#/components/ui/skeleton";

const electionsQueryOptions = (electionId: any) => ({
  queryKey: ['election-overview', electionId],
  queryFn: () => getElectionOverview({ data: electionId }),
});

export const Route = createFileRoute("/admin/elections/$electionId/invoice")({
  component: ElectionInvoicePage,
  loader: async ({ context, params }: any) => {
    const electionId = params.electionId;
    await context.queryClient.ensureQueryData(electionsQueryOptions(electionId));
  },
  pendingComponent: () => <PanelSkeleton />,
});

function ElectionInvoicePage() {
  const { electionId } = Route.useParams();
  const { data: election }: any = useSuspenseQuery(electionsQueryOptions(electionId));

  const invoiceNumber = `INV-${String(election.id).padStart(5, '0')}`;
  const issueDate = moment().format('MMMM D, YYYY');
  const amountDue = election.billAmount ? Number(election.billAmount) : 0;

  return (
    <div className="print-page min-h-screen bg-zinc-900 py-8 print:bg-white print:py-0 print:[color-adjust:exact] print:[-webkit-print-color-adjust:exact]">
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          html, body, #dashboard-shell, #dashboard-content, .print-page {
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
      <div className="print-toolbar mx-auto mb-5 flex max-w-3xl items-center justify-between px-4 print:hidden">
        <Link
          to="/admin/elections/$electionId/manage"
          params={{ electionId }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Management Console
        </Link>
        <div className="flex items-center gap-2">
          {!election.billPaid && (
            <Link
              to="/admin/elections/$electionId/pay"
              params={{ electionId }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-purple-500"
            >
              <CreditCard className="h-3.5 w-3.5" /> Pay Invoice
            </Link>
          )}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-zinc-700"
          >
            <Printer className="h-3.5 w-3.5" /> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* ================= PRINTABLE SHEET ================= */}
      <div className="print-sheet mx-auto max-w-3xl rounded-2xl border border-zinc-800 bg-white p-8 shadow-2xl print:rounded-none print:border-0 print:p-0 print:shadow-none sm:p-10">
        <header className="mb-8 border-b-2 border-zinc-900 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col justify-center gap-2">
              <div className="w-2/7 aspect-auto overflow-hidden rounded-l-full">
                <img src="/logo512.png" alt="Heravote Logo" className="h-full w-full object-contain rounded-r-sm" />
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-purple-600" />
                <span className="text-xl font-black uppercase tracking-[0.2em] text-purple-600">Invoice</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">Invoice #{invoiceNumber}</p>
            </div>
            <div className="text-right">
              {election.billPaid ? (
                <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">Paid</span>
              ) : (
                <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">Unpaid</span>
              )}
              <p className="mt-1.5 font-mono text-[11px] text-zinc-500">Issued {issueDate}</p>
            </div>
          </div>
        </header>

        <section className="mb-8">
          {election.billTo && (
            <div className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Billed To</p>
              <p className="mt-1 text-sm font-bold text-zinc-900">{election.billTo}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Billed For</p>
              <p className="mt-1 text-sm font-bold text-zinc-900">{election.title}</p>
              <p className="text-xs text-zinc-500">Ref: {election.tag}</p>
              {/* <p className="text-xs text-zinc-500">Ref: {election.tag} · Election ID: {election.id}</p> */}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Eligible Voters Billed</p>
              <p className="mt-1 text-sm font-bold text-zinc-900">{election.billVoters ?? 0}</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                <th className="pb-2">Description</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-100">
                <td className="py-3 text-zinc-700">Election hosting — {election.billVoters ?? 0} eligible voters</td>
                <td className="py-3 text-right font-mono text-zinc-900">GHS {amountDue.toLocaleString()}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td className="pt-4 text-sm font-bold text-zinc-900">Total Due</td>
                <td className="pt-4 text-right font-mono text-xl font-black text-zinc-900">GHS {amountDue.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </section>

        <footer className="border-t border-zinc-200 pt-6 text-center text-[10px] text-zinc-400 print:break-inside-avoid">
          <p className="flex items-center justify-center gap-1.5">
            <Receipt className="h-3 w-3" /> Payments are processed securely via Paystack. Once paid, a receipt will be available for this election.
          </p>
        </footer>
      </div>
    </div>
  );
}
