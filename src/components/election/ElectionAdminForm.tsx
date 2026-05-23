import React, { useState } from "react";
import { CheckCircle2, Calendar, Settings, Eye, Globe } from "lucide-react";
import moment from "moment";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createElectionFn, updateElectionFn } from "#/server/tenant-elections";
import { useNavigate } from "@tanstack/react-router";

export default function ElectionAdminForm({ data }: any) {
  
        const queryClient = useQueryClient();
        const navigate = useNavigate();

        const [formData, setFormData] = useState<any>(data);
        const [dropdowns, setDropdowns] = useState({ authMode: false });
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [submitSuccess, setSubmitSuccess] = useState(false);
        const isEditMode = data != null;

        const authModeLabels: Record<string, string> = {
          otp: "One-Time Password (SMS / Email)",
          google: "Google OAuth 2.0 Identity Single Sign-On",
          credential: "Secure Username & Passcode",
        };
      
        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          const { name, value } = e.target;
          setFormData((prev:any) => ({ ...prev, [name]: value }));
        };
      
        const handleCheckboxChange = (name: string) => {
          setFormData((prev:any) => ({ ...prev, [name]: !prev[name] as any }));
        };
      
        const selectOption = (field: "authMode", value: string) => {
          setFormData((prev:any) => ({ ...prev, [field]: value }));
          setDropdowns((prev) => ({ ...prev, [field]: false }));
        };

        const createMutation = useMutation({
            mutationFn: createElectionFn,
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ['elections-admin'] });
            },
            onError: (error) => console.error(error.message)
          });
        
        const editMutation = useMutation({
            mutationFn: updateElectionFn,
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ['elections-admin'] });
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
                  data: {
                    ...formData,
                    startAt: new Date(formData?.startAt),
                    endAt: new Date(formData?.endAt),
                  },
                });
              } else {
                createMutation.mutate({
                  data: {
                    ...formData,
                    startAt: new Date(formData?.startAt),
                    endAt: new Date(formData?.endAt),
                  },
                });
              }
             setSubmitSuccess(true);
             setTimeout(()=> navigate({ to:  '/admin/elections' }), 2000)

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
              <h3 className="text-xl font-bold text-white">{isEditMode ? `Election Saved`:`Election Initialized`} </h3>
              <p className="text-sm text-zinc-400 mt-2">
                The election <span className="text-purple-400 font-semibold">"{formData?.title}"</span> has been {isEditMode ? `updated successfully`:`staged. Please pay the activation fee to go live!`}.
              </p>
              {/* <button
                onClick={() => navigate({ to: isEditMode ? '/admin/elections': '/admin/elections/new'})}
                className="mt-6 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white rounded-lg transition-colors"
              >
                {isEditMode ? 'Goto Election Manager': 'Configure Another Election'}
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
                    <form id="new-election-form" onSubmit={handleSubmit}>
                      <div className="relative">
                        <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-xl mb-4 md:mb-8 overflow-hidden">
                          
                          {/* Form Layout Header */}
                          <div className="bg-[#0a192a]/50 border-b border-zinc-800 flex items-center px-6 py-5">
                            <div>
                              <h3 className="text-lg font-bold text-white tracking-tight">
                                { data ? `UPDATE`:`CREATE NEW `} ELECTION
                              </h3>
                              {/* <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                                Deploy a custom election instance bound to <span className="text-purple-400 font-semibold">{activeOrgContext.name}</span>. This populates positions, parameters, and voter verification constraints.
                              </p> */}
                            </div>
                          </div>
      
                          {/* Form Fields Ingestion Matrix */}
                          <div className="divide-y divide-zinc-800/60 bg-zinc-900/40">
                            
                            {/* 1. Title Input Row */}
                            <div className="px-6 py-5">
                              <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                                <div className="col-span-4 flex flex-col pt-1.5">
                                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                    Election Title
                                  </label>
                                </div>
                                <div className="order-1 col-span-8 w-full">
                                  <input
                                    type="text"
                                    name="title"
                                    placeholder="e.g. 2026 Executive SRC Elections"
                                    required
                                    disabled={isSubmitting}
                                    value={formData?.title}
                                    onChange={handleInputChange}
                                    className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm px-3 py-2 h-[36px] transition-all disabled:opacity-50"
                                  />
                                </div>
                              </div>
                            </div>
      
                            {/* 2. Short Tag Input Row */}
                            <div className="px-6 py-5">
                              <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                                <div className="col-span-4 flex flex-col pt-1.5">
                                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                    Unique Identifier Tag
                                  </label>
                                </div>
                                <div className="order-1 col-span-8 w-full">
                                  <input
                                    type="text"
                                    name="tag"
                                    placeholder="e.g. src-2026"
                                    required
                                    disabled={isSubmitting}
                                    value={formData?.tag}
                                    onChange={handleInputChange}
                                    className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm px-3 py-2 h-[36px] font-mono transition-all disabled:opacity-50"
                                  />
                                  <div className="text-zinc-500 text-xs mt-2">
                                    A short string used for URL slugs and quick database tracking queries. ( Leave no spaces )
                                  </div>
                                </div>
                              </div>
                            </div>
      
                            {/* 3. Description Field Row */}
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
                                    placeholder="Describe the context or rules of this election instance..."
                                    required
                                    disabled={isSubmitting}
                                    value={formData?.description}
                                    onChange={handleInputChange}
                                    className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm p-3 transition-all resize-none disabled:opacity-50"
                                  />
                                </div>
                              </div>
                            </div>
      
                            {/* 4. Timeline Dates Grid Configuration */}
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
                                      required
                                      disabled={isSubmitting}
                                      value={formData?.startAt && moment(formData?.startAt).format('YYYY-MM-DD HH:mm:ss')}
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
                                      required
                                      disabled={isSubmitting}
                                      value={formData?.endAt && moment(formData?.endAt).format('YYYY-MM-DD HH:mm:ss')}
                                      onChange={handleInputChange}
                                      className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs px-3 py-2 h-[36px]"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
      
                            {/* 5. Custom Auth Selection Dropdown Block */}
                            <div className="px-6 py-5">
                              <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                                <div className="col-span-4 flex flex-col pt-1.5">
                                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                    Voter Auth Mode
                                  </label>
                                </div>
                                <div className="order-1 col-span-8 w-full relative">
                                  <button
                                    type="button"
                                    onClick={() => setDropdowns({ authMode: !dropdowns?.authMode })}
                                    className="flex items-center justify-between rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white hover:bg-zinc-900 text-left text-sm px-3 py-2 h-[36px] w-full focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                  >
                                    <span>{authModeLabels[formData?.authMode]}</span>
                                    <Settings className="h-3.5 h-3.5 text-zinc-500 shrink-0" />
                                  </button>
      
                                  {dropdowns.authMode && (
                                    <div className="absolute left-0 mt-1 w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 shadow-xl z-50 overflow-hidden divide-y divide-zinc-800">
                                      {Object.keys(authModeLabels).map((key) => (
                                        <button
                                          key={key}
                                          type="button"
                                          onClick={() => selectOption("authMode", key)}
                                          className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-purple-600 hover:text-white ${formData.authMode === key ? "bg-zinc-900 text-purple-400 font-medium" : "text-zinc-400"}`}
                                        >
                                          {authModeLabels[key]}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="px-6 py-5">
                              <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                                <div className="col-span-4 flex flex-col pt-1.5">
                                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                    Estimated Number of Voters 
                                  </label>
                                </div>
                                <div className="order-1 col-span-8 w-full">
                                  <input
                                    type="integer"
                                    name="billVoters"
                                    placeholder="100"
                                    disabled={isSubmitting}
                                    value={formData?.billVoters}
                                    onChange={handleInputChange}
                                    className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm px-3 py-2 h-[34px] transition-all"
                                  />
                                </div>
                              </div>
                            </div>
      
                            <div className="px-6 py-5">
                              <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                                <div className="col-span-4 flex flex-col pt-1.5">
                                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                    Election Banner URL
                                  </label>
                                </div>
                                <div className="order-1 col-span-8 w-full">
                                  <input
                                    type="url"
                                    name="imageUrl"
                                    placeholder="https://yourdomain.com"
                                    disabled={isSubmitting}
                                    value={formData?.imageUrl}
                                    onChange={handleInputChange}
                                    className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm px-3 py-2 h-[34px] transition-all"
                                  />
                                </div>
                              </div>
                            </div>

                            
      
                            {/* 7. Toggle Toggles Submatrix Segment */}
                            <div className="px-6 py-5 bg-[#0a192a]/50/20 space-y-4">
                              
                              {/* Toggle A: Public Visibility */}
                              <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-left">
                                <div className="col-span-4 flex items-center gap-1.5">
                                  <Globe className="w-3.5 h-3.5 text-zinc-500" />
                                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Public Access</span>
                                </div>
                                <div className="order-1 col-span-8 flex items-center">
                                  <input
                                    type="checkbox"
                                    id="makePublic"
                                    checked={formData?.makePublic}
                                    onChange={() => handleCheckboxChange("makePublic")}
                                    className="w-4 h-4 rounded text-purple-600 bg-[#0a192a]/50 border-zinc-700 focus:ring-purple-500 accent-purple-500 cursor-pointer"
                                  />
                                  <label htmlFor="makePublic" className="ml-2 text-xs text-zinc-400 cursor-pointer select-none">
                                    Make this election searchable and indexable on general elections page on the website.
                                  </label>
                                </div>
                              </div>
      
                              {/* Toggle B: Live Feed Stream Visibility */}
                              <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-left">
                                <div className="col-span-4 flex items-center gap-1.5">
                                  <Eye className="w-3.5 h-3.5 text-zinc-500" />
                                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Display Feed</span>
                                </div>
                                <div className="order-1 col-span-8 flex items-center">
                                  <input
                                    type="checkbox"
                                    id="showFeed"
                                    checked={formData?.showFeed}
                                    onChange={() => handleCheckboxChange("showFeed")}
                                    className="w-4 h-4 rounded text-purple-600 bg-[#0a192a]/50 border-zinc-700 focus:ring-purple-500 accent-purple-500 cursor-pointer"
                                  />
                                  <label htmlFor="showFeed" className="ml-2 text-xs text-zinc-400 cursor-pointer select-none">
                                    Allow real-time cryptographic audit trail metrics and count logs to stream publicly.
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
                                "Deploy Election"
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
