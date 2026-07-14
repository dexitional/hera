import { useState } from 'react';
import { AlertCircle, CreditCard, Minus, Plus, ShoppingCart } from 'lucide-react';
import { openPaystackCheckout } from '#/lib/paystack';
import { verifyAndCastCardVoteFn } from '#/server/tenant-events';
import { modalPage, wait, type ModalNominee, type ModalReceipt } from '#/lib/utils';

const MAX_VOTES = 1000;
// Paystack silently rejects transactions below its own minimum chargeable amount --
// often rendering as a blank checkout iframe instead of a visible error. Keep our own
// floor comfortably above that so "Pay" always sends a valid amount.
const MIN_CHECKOUT_AMOUNT_GHS = 1;

export default function VotePay({
  nominee,
  onBack,
  onSuccess,
}: {
  nominee: ModalNominee | null;
  onBack: () => void;
  onSuccess: (receipt: ModalReceipt) => void;
}) {
  const [voteCount, setVoteCount] = useState(() => {
    const price = nominee?.unitPrice ?? 0;
    return price > 0 && price < MIN_CHECKOUT_AMOUNT_GHS ? Math.ceil(MIN_CHECKOUT_AMOUNT_GHS / price) : 1;
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const unitPrice = nominee?.unitPrice ?? 0;
  const totalAmount = unitPrice * voteCount;
  const belowMinimum = totalAmount > 0 && totalAmount < MIN_CHECKOUT_AMOUNT_GHS;

  const adjustVotes = (delta: number) => {
    setVoteCount((prev) => Math.min(MAX_VOTES, Math.max(1, prev + delta)));
  };

  const handlePay = async () => {
    if (!nominee) return;
    if (totalAmount < MIN_CHECKOUT_AMOUNT_GHS) {
      setErrorMessage(`Minimum card payment is GH₵${MIN_CHECKOUT_AMOUNT_GHS.toFixed(2)}. Please increase your vote count.`);
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    // Close our own dialog before handing off to Paystack -- two overlapping modal
    // systems (our Radix dialog and Paystack's injected iframe) fight over focus and
    // stacking, which is why the Paystack form wouldn't render/respond while ours was
    // still open. Give the close animation a moment to finish before opening Paystack.
    modalPage.setState((prev) => ({ ...prev, open: false }));
    await wait(200);

    try {
      // Paystack rejects ".local" as an invalid TLD and fails silently (blank iframe)
      // instead of surfacing a validation error -- use a real-format TLD instead.
      const checkoutEmail = `voter-${Date.now().toString(36)}@heravote.com`;

      const { reference } = await openPaystackCheckout({
        email: checkoutEmail,
        amountInKobo: Math.round(totalAmount * 100),
        currency: 'GHS',
        metadata: { contestantId: nominee.id, votes: voteCount },
      });

      const result: any = await verifyAndCastCardVoteFn({
        data: {
          reference,
          contestantId: nominee.id,
          votes: voteCount,
          payEmail: checkoutEmail,
          payPhone: 'web-checkout',
        },
      } as any);

      onSuccess({ votes: result.votes, amount: result.amount, reference: result.reference });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Payment failed. Please try again.');
      modalPage.setState((prev) => ({ ...prev, open: true }));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="text-center mb-6">
        <div className="mb-3">
          <div className="inline-flex items-center gap-2 bg-purple-400/10 px-3 py-1.5 rounded-full border border-blue-500/20">
            <ShoppingCart className="w-3 h-3 text-purple-400" />
            <span className="text-xs font-medium text-blue-400">Bulk Voting</span>
          </div>
        </div>
        <h2 className="text-xl font-bold text-white mb-1">Vote for {nominee?.name ?? 'this nominee'}</h2>
        <p className="text-zinc-400 text-sm">
          {nominee?.categoryName}
          {unitPrice > 0 ? ` • GH₵ ${unitPrice.toFixed(2)} per vote` : ''}
        </p>
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-white">Number of Votes</label>
          <span className="text-xs text-zinc-400">Max: {MAX_VOTES.toLocaleString()}</span>
        </div>
        <div className="bg-slate-600/10 p-3 rounded-xl border border-slate-600/20">
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => adjustVotes(-1)}
              disabled={voteCount <= 1 || isProcessing}
              className="w-9 h-9 bg-slate-600/20 rounded-lg flex items-center justify-center text-white hover:bg-slate-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="flex-1 max-w-24">
              <input
                min={1}
                max={MAX_VOTES}
                className="w-full text-center text-2xl font-bold text-white bg-slate-800/30 rounded-lg py-2 px-2 border border-slate-600/20 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/40 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                type="number"
                value={voteCount}
                disabled={isProcessing}
                onChange={(e) => {
                  const parsed = Number(e.target.value);
                  if (Number.isFinite(parsed)) setVoteCount(Math.min(MAX_VOTES, Math.max(1, Math.floor(parsed))));
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => adjustVotes(1)}
              disabled={voteCount >= MAX_VOTES || isProcessing}
              className="w-9 h-9 bg-slate-600/20 rounded-lg flex items-center justify-center text-white hover:bg-slate-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-600/10 p-4 rounded-xl border border-slate-600/20 mb-5">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">{voteCount.toLocaleString()} votes × GH₵ {unitPrice.toFixed(2)}</span>
          </div>
          <div className="border-t border-slate-600/20 pt-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white">Total Amount</span>
              <span className="font-bold text-white text-xl">GH₵ {totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {belowMinimum && !errorMessage && (
        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4 text-xs text-amber-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Minimum card payment is GH₵{MIN_CHECKOUT_AMOUNT_GHS.toFixed(2)}. Increase your vote count to continue.</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isProcessing}
          className="px-4 py-3 bg-slate-600/10 text-white rounded-xl hover:bg-slate-600/20 transition-colors text-sm font-medium border border-slate-600/20 disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handlePay}
          disabled={isProcessing || belowMinimum}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 flex items-center justify-center gap-2 group text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {isProcessing ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <CreditCard className="w-4 h-4" />
          )}
          <span>{isProcessing ? 'Processing...' : `Pay GH₵ ${totalAmount.toFixed(2)}`}</span>
        </button>
      </div>
    </div>
  );
}
