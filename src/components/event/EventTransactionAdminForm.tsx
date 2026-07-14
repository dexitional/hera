import React, { useState } from "react";
import { CheckCircle2, ChevronDown, Phone, Hash, ToggleLeft, Coins } from "lucide-react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEventTransactionFn, updateEventTransactionFn } from "#/server/tenant-events";

export default function EventTransactionAdminForm({ data: { data, contestants, eventId } }: any) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();

  const [formData, setFormData] = useState<any>({
    contestantId: data?.contestantId || (contestants && contestants[0]?.id),
    payPhone: data?.payPhone,
    payAmount: data?.payAmount,
    votes: data?.votes ?? 1,
    channel: data?.channel || "USSD",
    payStatus: data?.payStatus ?? false,
    payRef: data?.payRef,
    transRef: data?.transRef,
    id: data?.id,
  });

  const [dropdowns, setDropdowns] = useState({ contestantId: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isEditMode = data != null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string) => {
    setFormData((prev: any) => ({ ...prev, [name]: !prev[name] }));
  };

  const selectOption = (field: "contestantId", value: number) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    setDropdowns((prev: any) => ({ ...prev, [field]: false }));
  };

  const selectedContestantLabel = contestants?.find(
    (c: any) => c.id === formData.contestantId
  )?.name || "Select a Contestant";

  const createMutation = useMutation({
    mutationFn: createEventTransactionFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions-admin'] });
      queryClient.invalidateQueries({ queryKey: ['event-overview', eventId] });
    },
    onError: (error: any) => setErrorMessage(error.message),
  });

  const editMutation = useMutation({
    mutationFn: updateEventTransactionFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions-admin'] });
      queryClient.invalidateQueries({ queryKey: ['event-overview', eventId] });
    },
    onError: (error: any) => setErrorMessage(error.message),
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      if (isEditMode) {
        await editMutation.mutateAsync({ data: formData } as any);
      } else {
        await createMutation.mutateAsync({ data: formData } as any);
      }
      setSubmitSuccess(true);
      setTimeout(() => navigate({ to: `/admin/events/${eventId}/transactions` }), 1500);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to save transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="w-full max-w-md mx-auto my-20 p-6 bg-zinc-900 border border-zinc-800 rounded-xl text-center font-sans animate-in fade-in duration-200">
        <CheckCircle2 className="w-12 h-12 text-purple-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white">Transaction Saved</h3>
        <p className="text-sm text-zinc-400 mt-2">
          The vote transaction for <span className="text-purple-400 font-semibold">{selectedContestantLabel}</span> has been saved successfully.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full flex flex-col items-stretch max-w-[1200px] lg:px-6 mx-auto text-zinc-200 font-sans">
      <div className="h-full overflow-y-auto">
        <div className="flex w-full flex-col">
          <div className="overflow-auto">
            <section className="relative mx-auto my-10 max-w-2xl w-full px-4">
              <form id="transaction-form" onSubmit={handleSubmit}>
                <div className="relative">
                  <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-xl mb-4 md:mb-8 overflow-hidden">

                    {/* Header */}
                    <div className="bg-[#0a192a]/50 border-b border-zinc-800 flex items-center px-6 py-5">
                      <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">
                          {isEditMode ? `Edit Vote Transaction` : `Record New Transaction`}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          Manually record or adjust a pay-per-vote transaction against a contestant. Only transactions marked Paid count toward the live vote tally.
                        </p>
                      </div>
                    </div>

                    {/* Inputs fields block */}
                    <div className="divide-y divide-zinc-800/60 bg-zinc-900/40">

                      {/* Contestant Picker Dropdown */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                              Contestant
                            </label>
                          </div>
                          <div className="order-1 col-span-8 w-full relative">
                            <button
                              type="button"
                              onClick={() => setDropdowns({ contestantId: !dropdowns.contestantId })}
                              className="flex items-center justify-between rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white hover:bg-zinc-900 text-left text-sm px-3 py-2 h-[36px] w-full focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            >
                              <span className="truncate pr-4">{selectedContestantLabel}</span>
                              <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0" />
                            </button>

                            {dropdowns.contestantId && (
                              <div className="absolute left-0 mt-1 w-full rounded-md border border-zinc-700 bg-[#0a192a] shadow-xl z-50 overflow-hidden divide-y divide-zinc-800 max-h-56 overflow-y-auto">
                                {contestants?.map((c: any) => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => selectOption("contestantId", c.id)}
                                    className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-purple-600 hover:text-white ${formData.contestantId === c.id ? "bg-zinc-900 text-purple-400 font-medium" : "text-zinc-400"}`}
                                  >
                                    {c.name} {c.categoryName ? <span className="text-zinc-500">— {c.categoryName}</span> : null}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Pay Phone Input */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                              Voter Phone
                            </label>
                          </div>
                          <div className="order-1 col-span-8 w-full">
                            <div className="relative flex items-center">
                              <input
                                type="tel"
                                name="payPhone"
                                placeholder="e.g. +233241234567"
                                required
                                disabled={isSubmitting}
                                value={formData?.payPhone ?? ''}
                                onChange={handleInputChange}
                                className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm pl-9 pr-3 py-2 h-[36px] transition-all disabled:opacity-50"
                              />
                              <Phone className="absolute left-3 w-4 h-4 text-zinc-500" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Pay Amount + Votes Grid */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                              Amount &amp; Votes
                            </label>
                          </div>
                          <div className="order-1 col-span-8 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1 flex items-center gap-1">
                                <Coins className="w-3 h-3 text-amber-500" /> Pay Amount (GHS)
                              </span>
                              <input
                                type="number"
                                name="payAmount"
                                step="0.01"
                                min="0"
                                disabled={isSubmitting}
                                value={formData?.payAmount ?? ''}
                                onChange={handleInputChange}
                                className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white text-xs px-3 py-2 h-[36px] font-mono"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1 flex items-center gap-1">
                                <Hash className="w-3 h-3 text-purple-400" /> Votes Granted
                              </span>
                              <input
                                type="number"
                                name="votes"
                                min="0"
                                required
                                disabled={isSubmitting}
                                value={formData?.votes ?? ''}
                                onChange={handleInputChange}
                                className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white text-xs px-3 py-2 h-[36px] font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Channel Select */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                              Channel
                            </label>
                          </div>
                          <div className="order-1 col-span-8 w-full">
                            <select
                              name="channel"
                              disabled={isSubmitting}
                              value={formData?.channel ?? 'USSD'}
                              onChange={handleInputChange as any}
                              className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white text-sm px-3 py-2 h-[36px] transition-all disabled:opacity-50 max-w-[160px]"
                            >
                              <option value="USSD">USSD</option>
                              <option value="WEB">WEB</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Reference Codes Grid */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                              Reference Codes
                            </label>
                          </div>
                          <div className="order-1 col-span-8 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">
                                Payment Ref
                              </span>
                              <input
                                type="text"
                                name="payRef"
                                placeholder="Optional"
                                disabled={isSubmitting}
                                value={formData?.payRef ?? ''}
                                onChange={handleInputChange}
                                className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 text-xs px-3 py-2 h-[36px] font-mono"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">
                                Transaction Ref
                              </span>
                              <input
                                type="text"
                                name="transRef"
                                placeholder="Optional"
                                disabled={isSubmitting}
                                value={formData?.transRef ?? ''}
                                onChange={handleInputChange}
                                className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 text-xs px-3 py-2 h-[36px] font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Pay Status Toggle */}
                      <div className="px-6 py-5 bg-[#0a192a]/50/20">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-left">
                          <div className="col-span-4 flex items-center gap-1.5">
                            <ToggleLeft className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Payment Status</span>
                          </div>
                          <div className="order-1 col-span-8 flex items-center">
                            <input
                              type="checkbox"
                              id="payStatus"
                              checked={!!formData?.payStatus}
                              onChange={() => handleCheckboxChange("payStatus")}
                              className="w-4 h-4 rounded text-purple-600 bg-[#0a192a]/50 border-zinc-700 focus:ring-purple-500 accent-purple-500 cursor-pointer"
                            />
                            <label htmlFor="payStatus" className="ml-2 text-xs text-zinc-400 cursor-pointer select-none">
                              Payment confirmed — votes counted toward the live tally.
                            </label>
                          </div>
                        </div>
                      </div>

                    </div>

                    {errorMessage && (
                      <div className="px-6 py-3 bg-red-950/20 border-t border-red-900/30 text-red-400 text-xs">
                        {errorMessage}
                      </div>
                    )}

                    {/* Submit Action Footer */}
                    <div className="bg-[#0a192a]/50 border-t border-zinc-800 px-6 py-4 flex justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Go back!`)) router.history.back();
                        }}
                        className="text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting || !formData?.contestantId || !formData?.payPhone}
                        className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm rounded-md transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                          isEditMode ? `Update Transaction` : `Record Transaction`
                        )}
                      </button>
                    </div>

                  </div>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
