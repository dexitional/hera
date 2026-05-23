import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import { CheckCircle2, ChevronDown, Sparkles, Building2, Flame, Coins, Tag, Percent } from "lucide-react";

// Types matching the precise columns of the 'events' Drizzle schema + layout extensions
interface CreateEventFormData {
  title: string;             // official name of the event (Not Null)
  tag: string;               // short unique reference tag (e.g., 'vma-2026')
  description: string;       // detailed text context (Not Null)
  unitPrice: number;         // doublePrecision map for cost per vote
  deductionPercentage: number; // layout toggle to compute fee weights
  paymentAmount: number;     // doublePrecision total revenue tracked
  paymentDeduction: number;  // doublePrecision system fee deductions computed automatically
  isActive: number;          // integer status tracking -> default 1 (Not Null)
  orgId: number;             // references organizations.id (ForeignKey, Not Null)
}

export const Route = createFileRoute("/admin/events/new")({
  component: CreateEvent,
});

function CreateEvent() {
  const userOrganizations = [
    { id: 1, name: "Capevars.com" },
    { id: 2, name: "Festora Global Studios" },
    { id: 3, name: "National Entertainment Council" },
  ];

  const [formData, setFormData] = useState<CreateEventFormData>({
    title: "",
    tag: "",
    description: "",
    unitPrice: 1.00,
    deductionPercentage: 10, // Default 10% system platform flat fee cut rate
    paymentAmount: 0.00,
    paymentDeduction: 0.00,
    isActive: 1,
    orgId: userOrganizations[0]?.id || 1,
  });

  const [dropdowns, setDropdowns] = useState({ orgId: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isNumericField = ["unitPrice", "deductionPercentage", "paymentAmount", "paymentDeduction"].includes(name);
    
    setFormData((prev) => {
      const updated = { 
        ...prev, 
        [name]: isNumericField ? parseFloat(value) || 0 : value 
      };

      // Auto-compute paymentDeduction if gross entry or deduction weights alter dynamically
      if (name === "paymentAmount" || name === "deductionPercentage") {
        updated.paymentDeduction = (updated.paymentAmount * (updated.deductionPercentage / 100));
      }

      return updated;
    });
  };

  const handleToggleActive = () => {
    setFormData((prev) => ({ ...prev, isActive: prev.isActive === 1 ? 0 : 1 }));
  };

  const selectOption = (field: "orgId", value: number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setDropdowns((prev) => ({ ...prev, [field]: false }));
  };

  const selectedOrgLabel = userOrganizations.find(org => org.id === formData.orgId)?.name || "Select an Organization";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Submitting Event payload with tags to Drizzle driver context:", formData);
      setSubmitSuccess(true);
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
        <h3 className="text-xl font-bold text-white">Event Deployed Successfully</h3>
        <p className="text-sm text-zinc-400 mt-2">
          The voting platform node <span className="text-purple-400 font-semibold">"{formData.title}"</span> has been configured inside your database tree matching identifier: <code className="font-mono text-zinc-300 bg-[#0a192a]/50 px-1 py-0.5 rounded">{formData.tag}</code>.
        </p>
        <button
          onClick={() => setSubmitSuccess(false)}
          className="mt-6 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white rounded-lg transition-colors"
        >
          Create Another Event
        </button>
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
                    
                    {/* Header Banner */}
                    <div className="bg-[#0a192a]/50 border-b border-zinc-800 flex items-center px-6 py-5">
                      <div>
                        <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-purple-400" />
                          <span>Deploy New Events Platform</span>
                        </h3>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          Initialize a high-concurrency public voting instance. Setup deduction percentage targets to automate revenue auditing checks.
                        </p>
                      </div>
                    </div>

                    {/* Inputs fields block */}
                    <div className="divide-y divide-zinc-800/60 bg-zinc-900/40">
                      
                      {/* 1. Hosting Organization Dropdown */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Hosting Org</label>
                          </div>
                          <div className="order-1 col-span-8 w-full relative">
                            <button
                              type="button"
                              onClick={() => setDropdowns({ orgId: !dropdowns.orgId })}
                              className="flex items-center justify-between rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white hover:bg-zinc-900 text-left text-sm px-3 py-2 h-[36px] w-full focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            >
                              <span className="flex items-center gap-2 truncate">
                                <Building2 className="w-4 h-4 text-zinc-500 shrink-0" />
                                <span className="truncate">{selectedOrgLabel}</span>
                              </span>
                              <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0" />
                            </button>

                            {dropdowns.orgId && (
                              <div className="absolute left-0 mt-1 w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 shadow-xl z-50 overflow-hidden divide-y divide-zinc-800">
                                {userOrganizations.map((org) => (
                                  <button
                                    key={org.id}
                                    type="button"
                                    onClick={() => selectOption("orgId", org.id)}
                                    className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-purple-600 hover:text-white ${formData.orgId === org.id ? "bg-zinc-900 text-purple-400 font-medium" : "text-zinc-400"}`}
                                  >
                                    {org.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 2. Event Title Name */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Event Title</label>
                          </div>
                          <div className="order-1 col-span-8 w-full">
                            <input
                              type="text"
                              name="title"
                              placeholder="e.g. 2026 National Music Awards"
                              required
                              disabled={isSubmitting}
                              value={formData.title}
                              onChange={handleInputChange}
                              className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm px-3 py-2 h-[36px] transition-all disabled:opacity-50"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 3. System Tag Input (New Column Request) */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Platform Tag</label>
                          </div>
                          <div className="order-1 col-span-8 w-full">
                            <div className="relative flex items-center">
                              <input
                                type="text"
                                name="tag"
                                placeholder="e.g. nma-2026"
                                required
                                disabled={isSubmitting}
                                value={formData.tag}
                                onChange={handleInputChange}
                                className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm pl-8 pr-3 py-2 h-[36px] font-mono transition-all disabled:opacity-50"
                              />
                              <Tag className="absolute left-2.5 w-3.5 h-3.5 text-zinc-500" />
                            </div>
                            <div className="text-zinc-500 text-xs mt-2">
                              A clean slug indicator used for computing routing links and API lookup parameters.
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 4. Description Context */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Description</label>
                          </div>
                          <div className="order-1 col-span-8 w-full">
                            <textarea
                              name="description"
                              rows={3}
                              placeholder="Provide the public rules, timeline summaries, or summary for this voting portal..."
                              required
                              disabled={isSubmitting}
                              value={formData.description}
                              onChange={handleInputChange}
                              className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm p-3 transition-all resize-none disabled:opacity-50"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 5. Pricing and Deduction Configuration (New Dual Field Section Grid) */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Billing Config</label>
                          </div>
                          <div className="order-1 col-span-8 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1 flex items-center gap-1">
                                <Coins className="w-3 h-3 text-amber-500" /> Unit Price per Vote
                              </span>
                              <input
                                type="number"
                                name="unitPrice"
                                step="0.01"
                                min="0.00"
                                required
                                value={formData.unitPrice}
                                onChange={handleInputChange}
                                className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white text-xs px-3 py-2 h-[36px] font-mono"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1 flex items-center gap-1">
                                <Percent className="w-3 h-3 text-purple-400" /> Fee Deduction (%)
                              </span>
                              <input
                                type="number"
                                name="deductionPercentage"
                                min="0"
                                max="100"
                                required
                                value={formData.deductionPercentage}
                                onChange={handleInputChange}
                                className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white text-xs px-3 py-2 h-[36px] font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 6. Live Activation Toggle */}
                      <div className="px-6 py-5 bg-[#0a192a]/50/10">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-center">
                          <div className="col-span-4 flex flex-col">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                              <Flame className="w-3.5 h-3.5 text-zinc-500" />
                              <span>Live Activation</span>
                            </label>
                          </div>
                          <div className="order-1 col-span-8 w-full flex items-center">
                            <button
                              type="button"
                              onClick={handleToggleActive}
                              disabled={isSubmitting}
                              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg border text-xs font-bold transition-all ${formData.isActive === 1 ? 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20' : 'border-zinc-800 text-zinc-500 bg-[#0a192a]/50'}`}
                            >
                              <span className={`w-2 h-2 rounded-full ${formData.isActive === 1 ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-700'}`} />
                              <span>{formData.isActive === 1 ? "Active (Accepting Votes)" : "Disabled (Closed)"}</span>
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Submit Footer Action */}
                    <div className="bg-[#0a192a]/50 border-t border-zinc-800 px-6 py-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting || !formData.title || !formData.tag || !formData.description}
                        className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm rounded-md transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Deploying...
                          </>
                        ) : (
                          "Deploy Voting Event"
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
