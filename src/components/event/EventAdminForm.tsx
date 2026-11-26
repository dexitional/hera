import React, { useRef, useState } from "react";
import { FormCancelButton } from "#/components/admin/FormCancelButton";
import { CheckCircle2, Coins, ToggleLeft, Calendar, UploadCloud, FileImage, X, AlertCircle, ShieldCheck, Landmark, Smartphone, Wallet } from "lucide-react";
import { GHANA_BANKS, MOMO_NETWORKS } from "#/lib/settlement";
import { toUserMessage } from "#/lib/errors";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEventFn, updateEventFn } from "#/server/tenant-events";
import { useNavigate } from "@tanstack/react-router";
import { convertToFormData } from "#/lib/utils";
import moment from "moment";

export default function EventAdminForm({ data, forUserId, forUserName }: any) {

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<any>(data ?? { isActive: true });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isEditMode = data != null;

  // Local state tracking for the image before bucket dispatch
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string) => {
    setFormData((prev: any) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Invalid file type. Please upload an image asset.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setUploadError("File is too large. Event image maximum size is 3MB.");
      return;
    }
    setUploadError(null);
    setSelectedFile(file);
    setFormData((prev: any) => ({ ...prev, image: file }));
  };

  const removeSelectedFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setUploadError(null);
    setFormData((prev: any) => ({ ...prev, image: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const createMutation = useMutation({
    mutationFn: createEventFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events-admin'] });
    },
  });

  const editMutation = useMutation({
    mutationFn: updateEventFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events-admin'] });
    },
  });

  const setSettlementType = (type: string | null) => {
    // The provider means a network for MoMo and a bank otherwise, so it resets.
    setFormData((prev: any) => ({
      ...prev,
      settlementType: type,
      ...(prev.settlementType !== type ? { settlementProvider: null, settlementBranch: null } : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const newFormData = convertToFormData({
        ...formData,
        // Only meaningful on create -- a super admin staging this event
        // inside another tenant's workspace.
        ...(!isEditMode && forUserId ? { adminId: forUserId } : {}),
      });
      // Wait for the save: success is only shown once the server accepted it.
      if (isEditMode) {
        await editMutation.mutateAsync({ data: newFormData } as any);
      } else {
        await createMutation.mutateAsync({ data: newFormData } as any);
      }
      setSubmitSuccess(true);
      setTimeout(() => {
        if (!isEditMode && forUserId) {
          navigate({ to: '/admin/users/$userId', params: { userId: forUserId } });
        } else {
          navigate({ to: '/admin/events' });
        }
      }, 2000);
    } catch (err) {
      setErrorMessage(toUserMessage(err));
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
                  {!isEditMode && forUserId && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg border border-purple-900/30 bg-purple-950/20 px-4 py-2.5 text-xs text-purple-300">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      Creating this event in <span className="font-semibold text-white">{forUserName || forUserId}</span>'s workspace.
                    </div>
                  )}
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

                      {/* Event Image / Logo Row */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                              Event Image / Logo
                            </label>
                          </div>
                          <div className="order-1 col-span-8 w-full">

                            <input
                              type="file"
                              ref={fileInputRef}
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                            />

                            <div
                              onClick={() => fileInputRef.current?.click()}
                              className={`w-full border-2 border-dashed rounded-lg p-4 bg-[#0a192a]/50 text-center flex flex-col items-center justify-center group transition-colors cursor-pointer relative ${selectedFile ? 'border-purple-500/50 bg-purple-950/5' : 'border-zinc-800 hover:border-zinc-700'}`}
                            >
                              {!selectedFile ? (
                                <>
                                  <UploadCloud className="w-6 h-6 text-zinc-500 group-hover:text-purple-400 transition-colors mb-2" />
                                  <span className="text-xs font-medium text-zinc-300">Upload event banner or logo</span>
                                  <span className="text-[10px] text-zinc-500 mt-1">Recommended 16:9 landscape, up to 3MB</span>
                                </>
                              ) : (
                                <div className="w-full flex items-center justify-between px-2 text-left">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                                      <FileImage className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium text-zinc-200 truncate max-w-[240px]">{selectedFile?.name}</p>
                                      <p className="text-[10px] text-zinc-500 mt-0.5">{(selectedFile?.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                  </div>

                                  <button
                                    onClick={removeSelectedFile}
                                    type="button"
                                    className="p-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {uploadError && (
                              <div className="text-red-400 text-xs mt-2 flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5" />
                                {uploadError}
                              </div>
                            )}

                            {!selectedFile && formData?.imageUrl && (
                              <div className="mt-3 relative w-full max-w-xs rounded-lg overflow-hidden border border-zinc-800">
                                <img src={formData.imageUrl} alt="Current event image" className="w-full h-32 object-cover" />
                              </div>
                            )}

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

                      {/* 5. Settlement Row */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                              <Wallet className="w-3.5 h-3.5 text-zinc-500" /> Settlement Account
                            </label>
                            <span className="text-zinc-500 text-xs mt-1 leading-relaxed">Where your share of the vote revenue is paid out.</span>
                          </div>
                          <div className="order-1 col-span-8 w-full space-y-3">
                            <div role="radiogroup" aria-label="Settlement type" className="grid grid-cols-3 gap-1 rounded-lg border border-zinc-800 bg-[#0a192a]/50 p-1">
                              {([
                                { value: null, label: "Not set", icon: X },
                                { value: "momo", label: "Mobile money", icon: Smartphone },
                                { value: "bank", label: "Bank account", icon: Landmark },
                              ] as const).map((o) => {
                                const active = (formData?.settlementType ?? null) === o.value;
                                return (
                                  <button
                                    key={o.label}
                                    type="button"
                                    role="radio"
                                    aria-checked={active}
                                    disabled={isSubmitting}
                                    onClick={() => setSettlementType(o.value)}
                                    className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-semibold transition-colors ${active ? "bg-purple-600 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-900"}`}
                                  >
                                    <o.icon className="w-3.5 h-3.5" /> {o.label}
                                  </button>
                                );
                              })}
                            </div>

                            {formData?.settlementType === "momo" && (
                              <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
                                <div>
                                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Network</span>
                                  <div role="radiogroup" aria-label="Mobile money network" className="flex flex-wrap gap-2">
                                    {MOMO_NETWORKS.map((net) => (
                                      <button
                                        key={net}
                                        type="button"
                                        role="radio"
                                        aria-checked={formData?.settlementProvider === net}
                                        onClick={() => setFormData((prev: any) => ({ ...prev, settlementProvider: net }))}
                                        className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${formData?.settlementProvider === net ? "border-purple-500 bg-purple-500/10 text-white" : "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"}`}
                                      >
                                        {net}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <label className="block">
                                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Wallet number</span>
                                    <input type="tel" inputMode="tel" name="settlementAccountNumber" required placeholder="0241234567" disabled={isSubmitting}
                                      value={formData?.settlementAccountNumber ?? ""} onChange={handleInputChange} className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm px-3 py-2 h-[36px] transition-all disabled:opacity-50 font-mono" />
                                  </label>
                                  <label className="block">
                                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Registered name</span>
                                    <input type="text" name="settlementAccountName" required placeholder="Name on the wallet" disabled={isSubmitting}
                                      value={formData?.settlementAccountName ?? ""} onChange={handleInputChange} className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm px-3 py-2 h-[36px] transition-all disabled:opacity-50" />
                                  </label>
                                </div>
                              </div>
                            )}

                            {formData?.settlementType === "bank" && (
                              <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <label className="block">
                                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Bank</span>
                                    <input type="text" name="settlementProvider" list="ghana-banks" required placeholder="e.g. GCB Bank" disabled={isSubmitting}
                                      value={formData?.settlementProvider ?? ""} onChange={handleInputChange} className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm px-3 py-2 h-[36px] transition-all disabled:opacity-50" />
                                    <datalist id="ghana-banks">{GHANA_BANKS.map((b) => <option key={b} value={b} />)}</datalist>
                                  </label>
                                  <label className="block">
                                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Branch <span className="normal-case font-normal">(optional)</span></span>
                                    <input type="text" name="settlementBranch" placeholder="e.g. Cape Coast" disabled={isSubmitting}
                                      value={formData?.settlementBranch ?? ""} onChange={handleInputChange} className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm px-3 py-2 h-[36px] transition-all disabled:opacity-50" />
                                  </label>
                                  <label className="block">
                                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Account number</span>
                                    <input type="text" inputMode="numeric" name="settlementAccountNumber" required placeholder="Account number" disabled={isSubmitting}
                                      value={formData?.settlementAccountNumber ?? ""} onChange={handleInputChange} className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm px-3 py-2 h-[36px] transition-all disabled:opacity-50 font-mono" />
                                  </label>
                                  <label className="block">
                                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Account name</span>
                                    <input type="text" name="settlementAccountName" required placeholder="Name on the account" disabled={isSubmitting}
                                      value={formData?.settlementAccountName ?? ""} onChange={handleInputChange} className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm px-3 py-2 h-[36px] transition-all disabled:opacity-50" />
                                  </label>
                                </div>
                              </div>
                            )}

                            <div className="text-zinc-500 text-xs">
                              {formData?.settlementType
                                ? "Double-check these details: payouts are sent exactly here."
                                : "Optional for now, but needed before any payout can be made."}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 6. Active Toggle Row */}
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

                    {errorMessage && (
                      <div role="alert" className="px-6 py-3 bg-red-950/20 border-t border-red-900/30 text-red-400 text-xs flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 mt-px shrink-0" /> {errorMessage}
                      </div>
                    )}

                    {/* Form Submission Action Footer */}
                    <div className="bg-[#0a192a]/50 border-t border-zinc-800 px-6 py-4 flex justify-end items-center gap-3">
                      <FormCancelButton fallback={"/admin/events"} disabled={isSubmitting} />
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
