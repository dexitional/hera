import React, { useState } from "react";
import { CheckCircle2, Coins, ToggleLeft, Calendar } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEventFn, updateEventFn } from "#/server/tenant-events";
import { useNavigate } from "@tanstack/react-router";
import moment from "moment";

export default function EventAdminForm({ data }: any) {

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<any>(data ?? { isActive: true });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const isEditMode = data != null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string) => {
    setFormData((prev: any) => ({ ...prev, [name]: !prev[name] }));
  };

  const createMutation = useMutation({
    mutationFn: createEventFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events-admin'] });
    },
    onError: (error) => console.error(error.message),
  });

  const editMutation = useMutation({
    mutationFn: updateEventFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events-admin'] });
    },
    onError: (error) => console.error(error.message),
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        editMutation.mutate({ data: { ...formData } } as any);
      } else {
        createMutation.mutate({ data: { ...formData } } as any);
      }
      setSubmitSuccess(true);
      setTimeout(() => navigate({ to: '/admin/events' }), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="w-full max-w-md mx-auto my-20 p-6 bg-zinc-900 border border-zinc-800 rounded-xl text-center font-sans animate-in fade-in duration-200">
        <CheckCircle2 className="w-12 h-12 text-purple-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white">{isEditMode ? `Event Saved` : `Event Created`} </h3>
        <p className="text-sm text-zinc-400 mt-2">
          The event <span className="text-purple-400 font-semibold">"{formData?.title}"</span> has been {isEditMode ? `updated successfully` : `created. You can now add categories and contestants.`}.
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
              <form id="new-event-form" onSubmit={handleSubmit}>
                <div className="relative">
                  <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-xl mb-4 md:mb-8 overflow-hidden">

                    {/* Form Layout Header */}
                    <div className="bg-[#0a192a]/50 border-b border-zinc-800 flex items-center px-6 py-5">
                      <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">
                          {data ? `UPDATE` : `CREATE NEW `} VOTING EVENT
                        </h3>
                      </div>
                    </div>

                    {/* Form Fields Ingestion Matrix */}
                    <div className="divide-y divide-zinc-800/60 bg-zinc-900/40">

                      {/* 1. Title Input Row */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                              Event Title
                            </label>
                          </div>
                          <div className="order-1 col-span-8 w-full">
                            <input
                              type="text"
                              name="title"
                              placeholder="e.g. Face of Campus 2026"
                              required
                              disabled={isSubmitting}
                              value={formData?.title ?? ''}
                              onChange={handleInputChange}
                              className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm px-3 py-2 h-[36px] transition-all disabled:opacity-50"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 2. Description Field Row */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                              Description
                            </label>
                          </div>
                          <div className="order-1 col-span-8 w-full">
                            <textarea
                              name="description"
                              rows={3}
                              placeholder="Describe the context or rules of this voting event..."
                              required
                              disabled={isSubmitting}
                              value={formData?.description ?? ''}
                              onChange={handleInputChange}
                              className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm p-3 transition-all resize-none disabled:opacity-50"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 3. Timeline Dates Grid Configuration */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                              Timeline Config
                            </label>
                          </div>
                          <div className="order-1 col-span-8 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="text-[11px] text-zinc-500 block mb-1.5 uppercase font-medium tracking-wide flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Start Timestamp
                              </span>
                              <input
                                type="datetime-local"
                                name="startAt"
                                disabled={isSubmitting}
                                value={formData?.startAt ? moment(formData.startAt).format('YYYY-MM-DDTHH:mm') : ''}
                                onChange={handleInputChange}
                                className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs px-3 py-2 h-[36px]"
                              />
                            </div>
                            <div>
                              <span className="text-[11px] text-zinc-500 block mb-1.5 uppercase font-medium tracking-wide flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> End Timestamp
                              </span>
                              <input
                                type="datetime-local"
                                name="endAt"
                                disabled={isSubmitting}
                                value={formData?.endAt ? moment(formData.endAt).format('YYYY-MM-DDTHH:mm') : ''}
                                onChange={handleInputChange}
                                className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs px-3 py-2 h-[36px]"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 4. Price Per Vote Row */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                              Price Per Vote
                            </label>
                          </div>
                          <div className="order-1 col-span-8 w-full">
                            <div className="relative">
                              <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-500" />
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                name="unitPrice"
                                placeholder="1.00"
                                disabled={isSubmitting}
                                value={formData?.unitPrice ?? ''}
                                onChange={handleInputChange}
                                className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm pl-9 pr-3 py-2 h-[36px] transition-all disabled:opacity-50"
                              />
                            </div>
                            <div className="text-zinc-500 text-xs mt-2">
                              Amount charged per single vote cast via USSD/mobile money. Leave blank if uncertain.
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 5. Active Toggle Row */}
                      <div className="px-6 py-5 bg-[#0a192a]/50/20">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-left">
                          <div className="col-span-4 flex items-center gap-1.5">
                            <ToggleLeft className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Event Status</span>
                          </div>
                          <div className="order-1 col-span-8 flex items-center">
                            <input
                              type="checkbox"
                              id="isActive"
                              checked={!!formData?.isActive}
                              onChange={() => handleCheckboxChange("isActive")}
                              className="w-4 h-4 rounded text-purple-600 bg-[#0a192a]/50 border-zinc-700 focus:ring-purple-500 accent-purple-500 cursor-pointer"
                            />
                            <label htmlFor="isActive" className="ml-2 text-xs text-zinc-400 cursor-pointer select-none">
                              Event is live and open to accept public votes.
                            </label>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Form Submission Action Footer */}
                    <div className="bg-[#0a192a]/50 border-t border-zinc-800 px-6 py-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm rounded-md transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Deploying...
                          </>
                        ) : (
                          "Deploy Event"
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
