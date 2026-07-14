import { CheckCircle2 } from 'lucide-react';
import { DialogClose } from './ui/dialog';
import type { ModalNominee, ModalReceipt } from '#/lib/utils';

export default function VoteSuccess({
  nominee,
  receipt,
}: {
  nominee: ModalNominee | null;
  receipt: ModalReceipt | null;
}) {
  return (
    <div className="p-4 sm:p-6">
      <div className="text-center py-8">
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">Payment Successful</span>
          </div>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Thank you for voting!</h2>
        <p className="text-zinc-400 text-sm mb-6">
          {receipt?.votes ?? 0} {receipt?.votes === 1 ? 'vote' : 'votes'} credited to{' '}
          <span className="text-white font-semibold">{nominee?.name ?? 'this nominee'}</span>.
        </p>

        {receipt && (
          <div className="bg-slate-600/10 border border-slate-600/20 rounded-xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Amount Paid</span>
              <span className="text-white font-semibold">GH₵ {Number(receipt.amount ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Reference</span>
              <span className="text-white font-mono text-xs truncate max-w-[160px]">{receipt.reference}</span>
            </div>
          </div>
        )}

        <DialogClose asChild>
          <button
            className="px-6 py-2.5 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-colors text-sm font-medium"
            tabIndex={0}
          >
            Done
          </button>
        </DialogClose>
      </div>
    </div>
  );
}
