import React, { useRef, useState } from "react";
import { CheckCircle2, Calendar, Settings, Eye, Globe, UploadCloud, FileImage, X, AlertCircle, ShieldCheck } from "lucide-react";
import moment from "moment";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createElectionFn, updateElectionFn } from "#/server/tenant-elections";
import { useNavigate } from "@tanstack/react-router";
import { convertToFormData } from "#/lib/utils";

export default function ElectionAdminForm({ data, forUserId, forUserName }: any) {
  
        const queryClient = useQueryClient();
        const navigate = useNavigate();
        const fileInputRef = useRef<HTMLInputElement>(null);

        // Local state tracking for files before bucket dispatch
        const [selectedFile, setSelectedFile] = useState<File | null>(null);
        const [uploadProgress, setUploadProgress] = useState<number>(0);
        const [uploadingToStorage, setUploadingToStorage] = useState<boolean>(false);
        const [uploadError, setUploadError] = useState<string | null>(null);


        const [formData, setFormData] = useState<any>(data);
        const [dropdowns, setDropdowns] = useState({ authMode: false });
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [submitSuccess, setSubmitSuccess] = useState(false);
        const isEditMode = data != null;

        const authModeLabels: Record<string, string> = {
          otp: "One-Time Password - Version 1 (OTP-SMS)",
          google: "Google OAuth 2.0 Identity Single Sign-On",
          credential: "Secure Username & Passcode (Send Bulk Credentials via SMS)",
          aotp: "One-Time Password - Version 2 (OTP-SMS/Voice)",
        };
      
        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

        // Triggers when a file is selected via browser or drag-and-drop actions
        const handleFileChange = async (file: File) => {
            if (!file.type.startsWith("image/")) {
            setUploadError("Invalid file type. Please upload an image asset.");
            return;
            }
            if (file.size > 2 * 1024 * 1024) {
            setUploadError("File is too large. Image profile maximum size is 2MB.");
            return;
            }

            setUploadError(null);
            setSelectedFile(file);
            setUploadingToStorage(true);
            setUploadProgress(10);

            try {
            // Simulating standard chunked storage write latency
            await new Promise((resolve) => setTimeout(resolve, 400));
            setUploadProgress(60);
            await new Promise((resolve) => setTimeout(resolve, 400));
            setUploadProgress(100);
            setFormData((prev:any) => ({ ...prev, image: file }));

            } catch (err) {
            setUploadError("Storage delivery handshake failed. Try re-uploading.");
            setSelectedFile(null);
            } finally {
            setUploadingToStorage(false);
            }
        };

        const removeSelectedFile = (e: React.MouseEvent) => {
            e.stopPropagation();
            setSelectedFile(null);
            setUploadProgress(0);
            setUploadError(null);
            setFormData((prev:any) => ({ ...prev, image: null }));
            if (fileInputRef.current) fileInputRef.current.value = "";
        };

        const createMutation = useMutation({
            mutationFn: createElectionFn,
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ['elections-admin'] });
            },
            onError: (error) => alert(error.message)
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
              
              let newFormData: any = convertToFormData({
                    ...formData,
                    startAt: new Date(formData?.startAt),
                    endAt: new Date(formData?.endAt),
                    // Only meaningful on create -- a super admin staging this
                    // election inside another tenant's workspace.
                    ...(!isEditMode && forUserId ? { adminId: forUserId } : {}),
              });
              
              if (isEditMode) {
                  editMutation.mutate({
                    data: newFormData,
                  });
                } else {
                  createMutation.mutate({
                    data: newFormData,
                  });
                }
              setSubmitSuccess(true);
              setTimeout(() => {
                if (!isEditMode && forUserId) {
                  navigate({ to: '/admin/users/$userId', params: { userId: forUserId } });
                } else {
                  navigate({ to: '/admin/elections' });
                }
              }, 2000)
        
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
                        {!isEditMode && forUserId && (
                          <div className="mb-4 flex items-center gap-2 rounded-lg border border-purple-900/30 bg-purple-950/20 px-4 py-2.5 text-xs text-purple-300">
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                            Creating this election in <span className="font-semibold text-white">{forUserName || forUserId}</span>'s workspace.
                          </div>
                        )}
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

                            {/* 2b. Alias URL Input Row */}
                            <div className="px-6 py-5">
                              <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                                <div className="col-span-4 flex flex-col pt-1.5">
                                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                    Alias URL
                                  </label>
                                </div>
                                <div className="order-1 col-span-8 w-full">
                                  <input
                                    type="text"
                                    name="aliasUrl"
                                    placeholder="e.g. vote.myorganization.com"
                                    disabled={isSubmitting}
                                    value={formData?.aliasUrl || ''}
                                    onChange={handleInputChange}
                                    className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm px-3 py-2 h-[36px] font-mono transition-all disabled:opacity-50"
                                  />
                                  <div className="text-zinc-500 text-xs mt-2">
                                    Optional custom domain or subdomain pointed at this election. When set, SMS and email broadcasts link voters here instead of the default voting URL.
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
                                    className="flex items-center justify-between rounded-md border border-zinc-700 bg-[#0a192a] text-white hover:bg-zinc-900 text-left text-sm px-3 py-2 h-[36px] w-full focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                  >
                                    <span>{authModeLabels[formData?.authMode]}</span>
                                    <Settings className="h-3.5 h-3.5 text-zinc-500 shrink-0" />
                                  </button>
      
                                  {dropdowns.authMode && (
                                    <div className="absolute left-0 mt-1 w-full rounded-md border border-zinc-700 bg-[#0a192a] shadow-xl z-50 overflow-hidden divide-y divide-zinc-800">
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

                            {/* Login field label overrides -- the username/identity field label applies to
                                credential, otp, and aotp modes; the password field only exists for credential. */}
                            { ["credential", "otp", "aotp"].includes(formData?.authMode?.toLowerCase()) && (
                            <div className="px-6 py-5">
                              <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                                <div className="col-span-4 flex flex-col pt-1.5">
                                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                    Login Field Labels
                                  </label>
                                  <span className="text-[11px] text-zinc-500 mt-1">
                                    { formData?.authMode?.toLowerCase() === "credential"
                                      ? "Placeholder text shown on the voter login page's username/password fields."
                                      : "Placeholder text shown on the voter login page's identity field." }
                                  </span>
                                </div>
                                <div className="order-1 col-span-8 w-full grid grid-cols-2 gap-3">
                                  <input
                                    type="text"
                                    name="placeholderUsername"
                                    disabled={isSubmitting}
                                    value={formData?.placeholderUsername ?? formData?.placeholder?.username ?? 'Username'}
                                    onChange={handleInputChange}
                                    placeholder="Username"
                                    className={`flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs px-3 py-2 h-[36px] ${formData?.authMode?.toLowerCase() !== "credential" ? "col-span-2" : ""}`}
                                  />
                                  { formData?.authMode?.toLowerCase() === "credential" && (
                                  <input
                                    type="text"
                                    name="placeholderPassword"
                                    disabled={isSubmitting}
                                    value={formData?.placeholderPassword ?? formData?.placeholder?.password ?? 'Password'}
                                    onChange={handleInputChange}
                                    placeholder="Password"
                                    className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs px-3 py-2 h-[36px]"
                                  />
                                  )}
                                </div>
                              </div>
                            </div>
                            )}

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
                                    Bill To
                                  </label>
                                </div>
                                <div className="order-1 col-span-8 w-full">
                                  <input
                                    type="text"
                                    name="billTo"
                                    placeholder="e.g. Acme Student Union"
                                    disabled={isSubmitting}
                                    value={formData?.billTo || ''}
                                    onChange={handleInputChange}
                                    className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm px-3 py-2 h-[34px] transition-all"
                                  />
                                  <div className="text-zinc-500 text-xs mt-2">
                                    Organization or customer name to print on this election's invoices and receipts.
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="px-6 py-5">
                              <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                                <div className="col-span-4 flex flex-col pt-1.5">
                                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                    Election Status
                                  </label>
                                </div>
                                <div className="order-1 col-span-8 w-full">
                                  {/* <input
                                    type="text"
                                    name="status"
                                    placeholder="staged"
                                    disabled={isSubmitting}
                                    value={formData?.status}
                                    onChange={handleInputChange}
                                    className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm px-3 py-2 h-[34px] transition-all"
                                  /> */}
                                  <select
                                    name="status"
                                    disabled={isSubmitting}
                                    value={formData?.status}
                                    onChange={handleInputChange}
                                   className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm px-3 py-2 h-[34px] transition-all"
                                 
                                  >
                                     <option value="staged">STAGED</option>
                                     <option value="started">STARTED</option>
                                     <option value="ended">ENDED</option>
                                  </select>
                                </div>
                              </div>
                            </div>

                             {/* Storage Object File Ingestion Dropzone Field */}
                            <div className="px-6 py-5">
                                <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                                <div className="col-span-4 flex flex-col pt-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                    Electoral Group Logo
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
                                    onClick={() => !uploadingToStorage && fileInputRef.current?.click()}
                                    className={`w-full border-2 border-dashed rounded-lg p-4 bg-[#0a192a]/50 text-center flex flex-col items-center justify-center group transition-colors cursor-pointer relative ${selectedFile ? 'border-purple-500/50 bg-purple-950/5' : 'border-zinc-800 hover:border-zinc-700'}`}
                                    >
                                    {!selectedFile ? (
                                        <>
                                        <UploadCloud className="w-6 h-6 text-zinc-500 group-hover:text-purple-400 transition-colors mb-2" />
                                        <span className="text-xs font-medium text-zinc-300">Upload electoral group logo</span>
                                        <span className="text-[10px] text-zinc-500 mt-1">Image uploads map straight to object storage buckets</span>
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

                                    {/* Progress bar line indicators for live network actions */}
                                    {uploadProgress > 0 && uploadProgress < 100 && (
                                        <div className="absolute bottom-0 left-0 h-1 bg-purple-500 rounded-b transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                    )}
                                    </div>

                                    {/* Storage Delivery Error Output Alert Component Layout */}
                                    {uploadError && (
                                    <div className="text-red-400 text-xs mt-2 flex items-center gap-1.5">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        {uploadError}
                                    </div>
                                    )}

                                    {/* Drizzle Hidden Target State Verification Tag */}
                                    {formData?.imageUrl && (
                                    <div className="mt-2 bg-[#0a192a]/50 border border-zinc-800 rounded px-2.5 py-1 text-[10px] font-mono text-zinc-500 flex items-center gap-2 truncate">
                                        <span className="text-purple-400 uppercase font-bold text-[9px] border border-purple-500/20 px-1 rounded bg-purple-950/20 shrink-0">Path Saved</span>
                                        <span className="truncate">{formData?.imageUrl}</span>
                                    </div>
                                    )}

                                </div>
                                </div>
                            </div>
      
                            {/* <div className="px-6 py-5">
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
                            </div> */}

                            
      
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
                                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Display Voters Register</span>
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
                                    Allow real-time cryptographic audit trail metrics and count logs to stream publicly, and let voters search the public voters register to look up their Voter ID.
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
