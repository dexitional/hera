import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, ArrowLeft, Banknote, Check, CircleDollarSign, Copy, Landmark, Lock, Percent, Plus, Receipt, Smartphone, Wallet, X } from "lucide-react";
import { getEventRevenueFn, recordWithdrawalFn, setEventFeePercentFn, voidWithdrawalFn } from "#/server/tenant-revenue";
import { WITHDRAWAL_METHODS, WITHDRAWAL_METHOD_LABELS, type WithdrawalMethod } from "#/server/event-revenue";
import { ManageDashboardSkeleton } from "#/components/ui/skeleton";
import { OwnerLine } from "#/components/admin/ScopeToggle";
import { formatMoney, formatPercent } from "#/lib/money";

function CopyValue({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      onClick={async () => { try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* selectable */ } }}
      className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

/** Where the organiser's share is paid out, from the event form. */
function SettlementCard({ event, eventId }: { event: any; eventId: string }) {
  if (!event.settlementType) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-900/40 bg-amber-950/20 p-4">
        <p className="flex items-start gap-2 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          No settlement account yet. Add the organiser's mobile money or bank details on the event form before making a payout.
        </p>
        <Link to="/admin/events/$eventId/edit" params={{ eventId }} className="shrink-0 text-xs font-semibold text-amber-200 underline-offset-2 hover:underline">
          Add settlement details
        </Link>
      </div>
    );
  }
  const momo = event.settlementType === "momo";
  const rows: [string, string | null][] = momo
    ? [["Network", `${event.settlementProvider} Mobile Money`], ["Wallet number", event.settlementAccountNumber], ["Registered name", event.settlementAccountName]]
    : [["Bank", event.settlementProvider], ["Branch", event.settlementBranch], ["Account number", event.settlementAccountNumber], ["Account name", event.settlementAccountName]];
  return (
    <div className="rounded-xl border border-zinc-800 bg-[#0a192a]/50 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          {momo ? <Smartphone className="w-4 h-4 text-purple-400" /> : <Landmark className="w-4 h-4 text-purple-400" />} Settlement account
        </h2>
        <Link to="/admin/events/$eventId/edit" params={{ eventId }} className="text-xs text-zinc-400 hover:text-white">Edit</Link>
      </div>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {rows.filter(([, v]) => v).map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{k}</dt>
            <dd className="mt-0.5 flex items-center gap-1 text-sm font-semibold text-zinc-100">
              <span className={`truncate ${k.includes("number") ? "font-mono" : ""}`}>{v}</span>
              {k.includes("number") && <CopyValue value={v!} label={k.toLowerCase()} />}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const eventRevenueQueryOptions = (eventId: string) => ({
  queryKey: ["event-revenue", eventId],
  queryFn: () => getEventRevenueFn({ data: eventId } as any),
});

export const Route = createFileRoute("/admin/events/$eventId/revenue")({
  loader: async ({ context, params }: any) => {
    await context.queryClient.ensureQueryData(eventRevenueQueryOptions(params.eventId));
  },
  pendingComponent: () => <ManageDashboardSkeleton />,
  component: EventRevenue,
});

// "YYYY-MM-DDTHH:mm" in local time, for <input type="datetime-local">.
const toLocalInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const formatDate = (iso: string) => new Date(iso).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" });
const errorText = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");

function Card({ label, value, hint, icon: Icon, tone, emphasis }: any) {
  return (
    <div className={`p-4 rounded-xl border ${emphasis ? "bg-purple-950/20 border-purple-800/40" : "bg-[#0a192a]/50 border-zinc-800"}`}>
      <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1">
        <Icon className={`w-3.5 h-3.5 ${tone}`} /> {label}
      </p>
      <h3 className="text-xl font-black text-white mt-1.5 font-mono">{value}</h3>
      {hint && <p className="text-[10px] text-zinc-500 mt-1.5">{hint}</p>}
    </div>
  );
}

const inputClass =
  "w-full bg-[#0a192a]/60 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500";

function EventRevenue() {
  const { eventId } = Route.useParams();
  const queryClient = useQueryClient();
  const { data }: any = useSuspenseQuery(eventRevenueQueryOptions(eventId));
  const { event, revenue, collections, withdrawals, canManage } = data;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["event-revenue", eventId] });
    queryClient.invalidateQueries({ queryKey: ["revenue-overview"] });
  };

  // ---- fee %
  const [feeInput, setFeeInput] = useState(String(revenue.feePercent));
  const feeMutation = useMutation({
    mutationFn: (feePercent: string) => setEventFeePercentFn({ data: { eventId, feePercent } } as any),
    onSuccess: refresh,
  });

  // ---- record withdrawal
  const blankForm = () => ({ amount: "", method: "mobile_money" as WithdrawalMethod, recipient: "", reference: "", note: "", paidAt: toLocalInput(new Date()) });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blankForm);
  const recordMutation = useMutation({
    mutationFn: () =>
      recordWithdrawalFn({ data: { eventId, ...form, paidAt: new Date(form.paidAt).toISOString() } } as any),
    onSuccess: () => {
      setForm(blankForm());
      setShowForm(false);
      refresh();
    },
  });

  // ---- void (cancel) a withdrawal
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const voidMutation = useMutation({
    mutationFn: () => voidWithdrawalFn({ data: { withdrawalId: voidingId, reason: voidReason } } as any),
    onSuccess: () => {
      setVoidingId(null);
      setVoidReason("");
      refresh();
    },
  });

  const set = (key: string) => (e: any) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Link
        to="/admin/events/$eventId/manage"
        params={{ eventId }}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to event console
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a192a]/50 p-6 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-4 min-w-0">
          {event.imageUrl && <img src={event.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover border border-zinc-800 shrink-0" />}
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Landmark className="w-5 h-5 text-purple-400 shrink-0" />
              <span className="truncate">Revenue: {event.title}</span>
            </h1>
            <OwnerLine organization={event.ownerOrganization} name={event.ownerName} />
          </div>
        </div>
        {!canManage && (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
            <Lock className="w-3.5 h-3.5" /> Read-only. Payouts are recorded by the platform.
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card
          label="Gross collected"
          value={formatMoney(revenue.gross)}
          hint={`${collections.payments.toLocaleString()} payments · ${collections.votes.toLocaleString()} votes`}
          icon={CircleDollarSign}
          tone="text-emerald-500"
        />
        <Card label={`Platform fee (${formatPercent(revenue.feePercent)})`} value={formatMoney(revenue.fee)} icon={Percent} tone="text-purple-400" />
        <Card label="Organiser share" value={formatMoney(revenue.organiserShare)} icon={Wallet} tone="text-sky-400" />
        <Card label="Withdrawn" value={formatMoney(revenue.withdrawn)} icon={Banknote} tone="text-amber-400" />
        <Card label="Available balance" value={formatMoney(revenue.balance)} hint="Share not yet paid out" icon={Landmark} tone="text-rose-400" emphasis />
      </div>

      <SettlementCard event={event} eventId={eventId} />

      {canManage && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ---- Platform fee ---- */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              feeMutation.mutate(feeInput);
            }}
            className="bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 space-y-3"
          >
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Percent className="w-4 h-4 text-purple-400" /> Platform fee
            </h2>
            <p className="text-xs text-zinc-400">Percentage of this event's gross vote revenue kept by the platform.</p>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step={0.01}
                  value={feeInput}
                  onChange={(e) => setFeeInput(e.target.value)}
                  className={`${inputClass} pr-8`}
                  aria-label="Platform fee percentage"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">%</span>
              </div>
              <button
                type="submit"
                disabled={feeMutation.isPending || Number(feeInput) === revenue.feePercent}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold disabled:opacity-40"
              >
                {feeMutation.isPending ? "Saving..." : "Save"}
              </button>
            </div>
            {feeMutation.isError && <p className="text-xs text-rose-400">{errorText(feeMutation.error)}</p>}
            {feeMutation.isSuccess && <p className="text-xs text-emerald-400">Fee updated.</p>}
          </form>

          {/* ---- Record withdrawal ---- */}
          <div className="lg:col-span-2 bg-[#0a192a]/50 border border-zinc-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Banknote className="w-4 h-4 text-amber-400" /> Record a withdrawal
              </h2>
              {!showForm && (
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  disabled={revenue.balance <= 0}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" /> New withdrawal
                </button>
              )}
            </div>
            {!showForm ? (
              <p className="text-xs text-zinc-400">
                {revenue.balance > 0
                  ? `Log a payout you've made to the organiser. Up to ${formatMoney(revenue.balance)} is available.`
                  : "Nothing is available to withdraw for this event."}
              </p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  recordMutation.mutate();
                }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                <label className="text-xs text-zinc-400 space-y-1">
                  <span>Amount (₵) · max {formatMoney(revenue.balance)}</span>
                  <div className="flex gap-2">
                    <input required type="number" inputMode="decimal" min={0.01} step={0.01} max={revenue.balance} value={form.amount} onChange={set("amount")} className={inputClass} />
                    <button type="button" onClick={() => setForm((f) => ({ ...f, amount: String(revenue.balance) }))} className="px-3 rounded-lg border border-zinc-800 text-xs text-zinc-300 hover:bg-zinc-800">
                      Max
                    </button>
                  </div>
                </label>
                <label className="text-xs text-zinc-400 space-y-1">
                  <span>Paid via</span>
                  <select value={form.method} onChange={set("method")} className={inputClass}>
                    {WITHDRAWAL_METHODS.map((m) => (
                      <option key={m} value={m}>{WITHDRAWAL_METHOD_LABELS[m]}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-zinc-400 space-y-1">
                  <span>Paid to (account / MoMo number)</span>
                  <input value={form.recipient} onChange={set("recipient")} maxLength={120} className={inputClass} />
                </label>
                <label className="text-xs text-zinc-400 space-y-1">
                  <span>Transaction reference</span>
                  <input value={form.reference} onChange={set("reference")} maxLength={120} className={inputClass} />
                </label>
                <label className="text-xs text-zinc-400 space-y-1">
                  <span>Date paid</span>
                  <input required type="datetime-local" value={form.paidAt} max={toLocalInput(new Date())} onChange={set("paidAt")} className={inputClass} />
                </label>
                <label className="text-xs text-zinc-400 space-y-1">
                  <span>Note (optional)</span>
                  <input value={form.note} onChange={set("note")} maxLength={500} className={inputClass} />
                </label>
                <div className="sm:col-span-2 flex items-center justify-between gap-3">
                  <p className="text-xs text-rose-400">{recordMutation.isError ? errorText(recordMutation.error) : ""}</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-zinc-800 text-xs text-zinc-300 hover:bg-zinc-800">
                      Cancel
                    </button>
                    <button type="submit" disabled={recordMutation.isPending} className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold disabled:opacity-40">
                      {recordMutation.isPending ? "Recording..." : "Record withdrawal"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ---- Ledger ---- */}
      <div className="bg-[#0a192a]/40 border border-zinc-800 rounded-xl overflow-x-auto">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-zinc-400" />
          <h2 className="text-sm font-bold text-white">Withdrawal history</h2>
          <span className="text-[11px] text-zinc-500">({withdrawals.length})</span>
        </div>
        <table className="w-full text-left border-collapse min-w-[860px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
              <th className="px-5 py-3">Date paid</th>
              <th className="px-5 py-3 text-right">Amount</th>
              <th className="px-5 py-3">Method</th>
              <th className="px-5 py-3">Paid to / reference</th>
              <th className="px-5 py-3">Recorded by</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 text-sm">
            {withdrawals.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-xs text-zinc-500">No withdrawals recorded yet.</td>
              </tr>
            ) : (
              withdrawals.map((w: any) => {
                const voided = !!w.voidedAt;
                return (
                  <tr key={w.id} className={voided ? "opacity-60" : ""}>
                    <td className="px-5 py-3 text-xs text-zinc-300 whitespace-nowrap">{formatDate(w.paidAt)}</td>
                    <td className={`px-5 py-3 text-right font-mono font-bold ${voided ? "line-through text-zinc-500" : "text-amber-300"}`}>{formatMoney(w.amount)}</td>
                    <td className="px-5 py-3 text-xs text-zinc-300">{WITHDRAWAL_METHOD_LABELS[w.method as WithdrawalMethod] ?? w.method}</td>
                    <td className="px-5 py-3 text-xs text-zinc-400">
                      <div>{w.recipient || "—"}</div>
                      {w.reference && <div className="font-mono text-zinc-500">{w.reference}</div>}
                      {w.note && <div className="text-zinc-500 italic">{w.note}</div>}
                    </td>
                    <td className="px-5 py-3 text-xs text-zinc-400">
                      {w.recordedByName ?? "—"}
                      <div className="text-[10px] text-zinc-600">{formatDate(w.createdAt)}</div>
                    </td>
                    <td className="px-5 py-3 text-xs">
                      {voided ? (
                        <div className="text-rose-300">
                          Cancelled
                          <div className="text-[10px] text-zinc-500">
                            {w.voidedByName ?? "—"} · {formatDate(w.voidedAt)}
                          </div>
                          <div className="text-[10px] text-zinc-400 italic">"{w.voidReason}"</div>
                        </div>
                      ) : voidingId === w.id ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            voidMutation.mutate();
                          }}
                          className="space-y-1.5 min-w-[220px]"
                        >
                          <input
                            autoFocus
                            required
                            minLength={3}
                            maxLength={500}
                            value={voidReason}
                            onChange={(e) => setVoidReason(e.target.value)}
                            placeholder="Reason for cancelling"
                            className={`${inputClass} text-xs py-1.5`}
                          />
                          {voidMutation.isError && <p className="text-[11px] text-rose-400">{errorText(voidMutation.error)}</p>}
                          <div className="flex gap-1.5">
                            <button type="submit" disabled={voidMutation.isPending} className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold disabled:opacity-40">
                              {voidMutation.isPending ? "Cancelling..." : "Confirm cancel"}
                            </button>
                            <button type="button" onClick={() => { setVoidingId(null); setVoidReason(""); }} className="px-2.5 py-1 rounded-md border border-zinc-800 text-[11px] text-zinc-300 hover:bg-zinc-800">
                              Keep
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400">Paid</span>
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => { setVoidingId(w.id); setVoidReason(""); voidMutation.reset(); }}
                              title="Cancel this withdrawal (kept in history)"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-zinc-800 text-[11px] text-zinc-400 hover:text-rose-300 hover:border-rose-800"
                            >
                              <X className="w-3 h-3" /> Cancel
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
