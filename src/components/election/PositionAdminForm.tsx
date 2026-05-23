import React, { useState } from "react";
import { CheckCircle2, ChevronDown, Award, Hash } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPositionFn, updatePositionFn } from "#/server/tenant-elections";

export default function PositionAdminForm({ data: { data, elections }}: any) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [formData, setFormData] = useState<any>({
      electionId: data?.electionId || elections && elections[0]?.id, 
      title: data?.title,
      slots: data?.slots,
      order: data?.order,
      id: data?.id,
    });
  
    const [dropdowns, setDropdowns] = useState({ electionId: false });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const isEditMode = data != null;
  
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev: any) => ({
        ...prev,
        [name]: name === "slots" ? Math.max(1, parseInt(value) || 1) : value,
      }));
    };
  
    const selectOption = (field: "electionId", value: number) => {
      setFormData((prev: any) => ({ ...prev, [field]: value }));
      setDropdowns((prev) => ({ ...prev, [field]: false }));
    };
  
    const selectedElectionLabel = elections?.find(
      (e: any) => e.id === formData?.electionId
    )?.title || "Select an Election";
  
   

    const createMutation = useMutation({
        mutationFn: createPositionFn,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['positions-admin'] });
        },
        onError: (error) => console.error(error.message)
      });
    
    const editMutation = useMutation({
        mutationFn: updatePositionFn,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['positions-admin'] });
        },
        onError: (error) => console.error(error.message)
    });
  
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
        // Simulate database runtime driver delay latency
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        if (isEditMode) {
            editMutation.mutate({
              data: formData,
            });
          } else {
            createMutation.mutate({
              data: formData,
            });
          }
         setSubmitSuccess(true);
         setTimeout(()=> navigate({ to:  '/admin/positions' }), 2000)

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
          <h3 className="text-xl font-bold text-white">Position Saved</h3>
          <p className="text-sm text-zinc-400 mt-2">
            The office of <span className="text-purple-400 font-semibold">"{formData?.title}"</span> ({formData?.slots} {formData?.slots === 1 ? 'slot' : 'slots'}) has been saved successfully.
          </p>
          <button
            onClick={() => {
              setSubmitSuccess(false);
              setFormData((prev: any) => ({ ...prev, title: "", slots: 1 }));
            }}
            className="mt-6 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white rounded-lg transition-colors"
          >
            Add Another Position
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
                <form id="new-position-form" onSubmit={handleSubmit}>
                  <div className="relative">
                    <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-xl mb-4 md:mb-8 overflow-hidden">
                      
                      {/* Header Banner */}
                      <div className="bg-[#0a192a]/50 border-b border-zinc-800 flex items-center px-6 py-5">
                        <div>
                          <h3 className="text-lg font-bold text-white tracking-tight">
                          {isEditMode ? `Edit Election Position `:`Create New Position`}
                          </h3>
                          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                            Define an official office position categories for an election. Positions enforce winning criteria boundaries by controlling how many candidates can be elected into office slots.
                          </p>
                        </div>
                      </div>
  
                      {/* Form Fields Stack */}
                      <div className="divide-y divide-zinc-800/60 bg-zinc-900/40">
                        
                        {/* 1. Election ForeignKey Lookup Dropdown */}
                        <div className="px-6 py-5">
                          <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                            <div className="col-span-4 flex flex-col pt-1.5">
                              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Target Election
                              </label>
                            </div>
                            <div className="order-1 col-span-8 w-full relative">
                              <button
                                type="button"
                                onClick={() => setDropdowns({ electionId: !dropdowns?.electionId })}
                                className="flex items-center justify-between rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white hover:bg-zinc-900 text-left text-sm px-3 py-2 h-[36px] w-full focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                              >
                                <span className="truncate pr-4">{selectedElectionLabel}</span>
                                <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0" />
                              </button>
  
                              {dropdowns.electionId && (
                                <div className="absolute left-0 mt-1 w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 shadow-xl z-50 overflow-hidden divide-y divide-zinc-800">
                                  {elections?.map((elec: any) => (
                                    <button
                                      key={elec.id}
                                      type="button"
                                      onClick={() => selectOption("electionId", elec.id)}
                                      className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-purple-600 hover:text-white ${formData?.electionId === elec.id ? "bg-zinc-900 text-purple-400 font-medium" : "text-zinc-400"}`}
                                    >
                                      {elec.title}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
  
                        {/* 2. Position Title Input Row (Not Null) */}
                        <div className="px-6 py-5">
                          <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                            <div className="col-span-4 flex flex-col pt-1.5">
                              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Position Title
                              </label>
                            </div>
                            <div className="order-1 col-span-8 w-full">
                              <div className="relative flex items-center">
                                <input
                                  type="text"
                                  name="title"
                                  placeholder="e.g. Committee Chairman"
                                  required
                                  disabled={isSubmitting}
                                  value={formData?.title}
                                  onChange={handleInputChange}
                                  className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm pl-9 pr-3 py-2 h-[36px] transition-all disabled:opacity-50"
                                />
                                <Award className="absolute left-3 w-4 h-4 text-zinc-500" />
                              </div>
                              <div className="text-zinc-500 text-xs mt-2">
                                The official name of the designation office tier listed on the ballot slip.
                              </div>
                            </div>
                          </div>
                        </div>
  
                        {/* 3. Available Slots Number Input (Not Null, Default 1) */}
                        <div className="px-6 py-5">
                          <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                            <div className="col-span-4 flex flex-col pt-1.5">
                              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Sorting Order Number
                              </label>
                            </div>
                            <div className="order-1 col-span-8 w-full">
                              <div className="relative flex items-center w-32">
                                <input
                                  type="number"
                                  name="order"
                                  min={1}
                                  required
                                  disabled={isSubmitting}
                                  value={formData?.order}
                                  onChange={handleInputChange}
                                  className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm pl-9 pr-3 py-2 h-[36px] transition-all disabled:opacity-50"
                                />
                                <Hash className="absolute left-3 w-4 h-4 text-zinc-500" />
                              </div>
                              <div className="text-zinc-500 text-xs mt-2">
                                Specify how positions are arranged or sorted.
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="px-6 py-5">
                          <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                            <div className="col-span-4 flex flex-col pt-1.5">
                              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Winning Slots
                              </label>
                            </div>
                            <div className="order-1 col-span-8 w-full">
                              <div className="relative flex items-center w-32">
                                <input
                                  type="number"
                                  name="slots"
                                  min={1}
                                  required
                                  disabled={isSubmitting}
                                  value={formData?.slots || 1}
                                  onChange={handleInputChange}
                                  className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm pl-9 pr-3 py-2 h-[36px] transition-all disabled:opacity-50"
                                />
                                <Hash className="absolute left-3 w-4 h-4 text-zinc-500" />
                              </div>
                              <div className="text-zinc-500 text-xs mt-2">
                                Specify how many candidate winners can be elected into this single office position (e.g., General Executive Committee slots might allow 3 winners).
                              </div>
                            </div>
                          </div>
                        </div>
  
                      </div>
  
                      {/* Submit Action Footer */}
                      <div className="bg-[#0a192a]/50 border-t border-zinc-800 px-6 py-4 flex justify-end">
                        <button
                          type="submit"
                          disabled={isSubmitting || !formData?.title}
                          className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm rounded-md transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Saving...
                            </>
                          ) : (
                             isEditMode ? `Update Position `:`Create Position`
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
