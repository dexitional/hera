import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useState } from "react";
import { CheckCircle2, ChevronDown, User, Mail, Phone, Key, RefreshCw } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createVoterFn, updateVoterFn } from "#/server/tenant-elections";
import { generateSixDigitCode } from "#/lib/utils";

export default function VoterAdminForm({ data: { data, elections }}: any) {
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  console.log(data);
  
  const [formData, setFormData] = useState<any>({
    electionId: data?.electionId || elections && elections[0]?.id,
    name: data?.name,
    username: data?.username,
    phoneNumber: data?.phoneNumber,
    email: data?.email,
    inviteToken: data?.inviteToken || generateSixDigitCode(),
    isVerified: data?.isVerified || false,
    hasVoted: data?.hasVoted || false,
    id: data?.id,
  });

  const [dropdowns, setDropdowns] = useState({ electionId: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const isEditMode = data != null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const selectOption = (field: "electionId", value: number) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    setDropdowns((prev: any) => ({ ...prev, [field]: false }));
  };

  const selectedElectionLabel = elections?.find(
    (e:any) => e.id === formData.electionId
  )?.title || "Select an Election";

  const regenerateCode = () => {
    setFormData((prev: any) => ({ ...prev, inviteToken: generateSixDigitCode() }));
  };


  const createMutation = useMutation({
    mutationFn: createVoterFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voters-admin'] });
    },
    onError: (error) => console.error(error.message)
  });

const editMutation = useMutation({
    mutationFn: updateVoterFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voters-admin'] });
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
     setTimeout(()=> navigate({ to:  '/admin/voters' }), 2000)

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
        <h3 className="text-xl font-bold text-white">Voter Saved</h3>
        <p className="text-sm text-zinc-400 mt-2">
          Voter <span className="text-purple-400 font-semibold">"{formData.name}"</span> has been saved with the 6-digit access token: <span className="font-mono text-white bg-[#0a192a]/50 px-2 py-1 rounded border border-zinc-800 tracking-wider font-bold">{formData.inviteToken}</span>
        </p>
        {/* <button
          onClick={() => {
            setSubmitSuccess(false);
            setFormData({
              electionId: activeElections[0].id,
              name: "",
              username: "",
              phoneNumber: "",
              email: "",
              inviteToken: generateSixDigitCode(),
              isVerified: false,
              hasVoted: false,
            });
          }}
          className="mt-6 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white rounded-lg transition-colors"
        >
          Add Another Voter
        </button> */}
      </div>
    );
  }

  return (
    <div className="w-full min-h-full flex flex-col items-stretch max-w-[1200px] lg:px-6 mx-auto text-zinc-200 font-sans">
      <div className="h-full overflow-y-auto">
        <div className="flex w-full flex-col">
          <div className="overflow-auto">
            <section className="relative mx-auto my-10 max-w-2xl w-full px-4">
              <form id="new-voter-form" onSubmit={handleSubmit}>
                <div className="relative">
                  <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-xl mb-4 md:mb-8 overflow-hidden">
                    
                    {/* Header */}
                    <div className="bg-[#0a192a]/50 border-b border-zinc-800 flex items-center px-6 py-5">
                      <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">
                          Register Authorized Voter
                        </h3>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          Provision structural credential criteria nodes for target ballot rolls. This writes a unique entry matching index constraints to block duplicate voting procedures.
                        </p>
                      </div>
                    </div>

                    {/* Inputs System Matrix */}
                    <div className="divide-y divide-zinc-800/60 bg-zinc-900/40">
                      
                      {/* Target Election ForeignKey Context Dropdown */}
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
                              onClick={() => setDropdowns({ electionId: !dropdowns.electionId })}
                              className="flex items-center justify-between rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white hover:bg-zinc-900 text-left text-sm px-3 py-2 h-[36px] w-full focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            >
                              <span className="truncate pr-4">{selectedElectionLabel}</span>
                              <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0" />
                            </button>

                            {dropdowns.electionId && (
                              <div className="absolute left-0 mt-1 w-full rounded-md border border-zinc-700 bg-[#0a192a] shadow-xl z-50 overflow-hidden divide-y divide-zinc-800">
                                {elections?.map((elec: any) => (
                                  <button
                                    key={elec.id}
                                    type="button"
                                    onClick={() => selectOption("electionId", elec.id)}
                                    className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-purple-600 hover:text-white ${formData.electionId === elec.id ? "bg-zinc-900 text-purple-400 font-medium" : "text-zinc-400"}`}
                                  >
                                    {elec.title}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Name input */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                              Voter Full Name
                            </label>
                          </div>
                          <div className="order-1 col-span-8 w-full">
                            <div className="relative flex items-center">
                              <input
                                type="text"
                                name="name"
                                placeholder="e.g. Kwame Mensah"
                                required
                                disabled={isSubmitting}
                                value={formData.name}
                                onChange={handleInputChange}
                                className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm pl-9 pr-3 py-2 h-[36px] transition-all disabled:opacity-50"
                              />
                              <User className="absolute left-3 w-4 h-4 text-zinc-500" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Username input */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                              Voter Username
                            </label>
                          </div>
                          <div className="order-1 col-span-8 w-full">
                            <input
                              type="text"
                              name="username"
                              maxLength={50}
                              placeholder="e.g. kwame_m"
                              required
                              disabled={isSubmitting}
                              value={formData.username}
                              onChange={handleInputChange}
                              className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm px-3 py-2 h-[36px] font-mono text-xs transition-all disabled:opacity-50"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Email Input */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                              Email Address
                            </label>
                          </div>
                          <div className="order-1 col-span-8 w-full">
                            <div className="relative flex items-center">
                              <input
                                type="email"
                                name="email"
                                placeholder="kwame@domain.edu.gh"
                                required
                                disabled={isSubmitting}
                                value={formData.email}
                                onChange={handleInputChange}
                                className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm pl-9 pr-3 py-2 h-[36px] transition-all disabled:opacity-50"
                              />
                              <Mail className="absolute left-3 w-4 h-4 text-zinc-500" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Phone Input */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                              Phone Number
                            </label>
                          </div>
                          <div className="order-1 col-span-8 w-full">
                            <div className="relative flex items-center">
                              <input
                                type="tel"
                                name="phoneNumber"
                                placeholder="e.g. +233241234567"
                                required
                                disabled={isSubmitting}
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                                className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm pl-9 pr-3 py-2 h-[36px] transition-all disabled:opacity-50"
                              />
                              <Phone className="absolute left-3 w-4 h-4 text-zinc-500" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 6-Digit Verification Code Panel */}
                      <div className="px-6 py-5 bg-[#0a192a]/50/20">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-center">
                          <div className="col-span-4 flex flex-col">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex gap-1.5">
                              <Key className="w-3.5 h-3.5 text-zinc-500" /> 6-Digit Invite Code
                            </label>
                          </div>
                          <div className="order-1 col-span-8 w-full flex items-center gap-3">
                            <div className="w-32 bg-[#0a192a]/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm font-mono text-purple-400 font-bold tracking-widest text-center select-all">
                              {formData.inviteToken}
                            </div>
                            { !isEditMode ? (
                            <button
                              type="button"
                              onClick={regenerateCode}
                              disabled={isSubmitting || isEditMode}
                              className="hidden px-2.5 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-300 text-xs font-medium rounded-md transition-all shrink-0 flex items-center gap-1.5"
                            >
                              <RefreshCw className="w-3 h-3" /> Regenerate
                            </button>
                            ) : null }
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Footer Trigger Button */}
                    <div className="bg-[#0a192a]/50 border-t border-zinc-800 px-6 py-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting || !formData.name || !formData.username || !formData.email || !formData.phoneNumber}
                        className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm rounded-md transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                           isEditMode ? `Update Voter `:`Create Voter`
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
