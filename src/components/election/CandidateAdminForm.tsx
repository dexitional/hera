import React, { useState, useRef } from "react";
import { CheckCircle2, ChevronDown, User, UploadCloud, FileImage, X, AlertCircle, Hash } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { createCandidateFn, updateCandidateFn } from "#/server/tenant-elections";
import { convertToFormData } from "#/lib/utils";
import { useRouter } from "@tanstack/react-router";

export default function CandidateAdminForm({ data: { data, positions }}: any) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<any>({
    positionId: data?.positionId || positions && positions[0]?.id,
    name: data?.name,
    imageUrl: data?.imageUrl,
    order: data?.order,
    teaser: data?.teaser,
    isActive: data?.isActive,
    id: data?.id
  });

  // Local state tracking for files before bucket dispatch
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadingToStorage, setUploadingToStorage] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [dropdowns, setDropdowns] = useState({ positionId: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const isEditMode = data != null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev:any) => ({ ...prev, [name]: value }));
  };

  const selectOption = (field: "positionId", value: number) => {
    setFormData((prev:any) => ({ ...prev, [field]: value }));
    setDropdowns((prev:any) => ({ ...prev, [field]: false }));
  };

  // Triggers when a file is selected via browser or drag-and-drop actions
  const handleFileChange = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Invalid file type. Please upload an image asset.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File is too large. Image profile maximum size is 10MB.");
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

  const selectedPositionLabel = positions?.find(
    (p:any) => p.id === formData.positionId
  )?.title || "Select a Position";

  
  const createMutation = useMutation({
    mutationFn: createCandidateFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates-admin'] });
    },
    onError: (error) => console.error(error.message)
  });

  const editMutation = useMutation({
      mutationFn: updateCandidateFn,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['candidates-admin'] });
      },
      onError: (error) => console.error(error.message)
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Simulate database runtime driver delay latency
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      let newFormData: any = convertToFormData(formData);
      
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
        <h3 className="text-xl font-bold text-white">Candidate Saved</h3>
        <p className="text-sm text-zinc-400 mt-2">
          Candidate <span className="text-purple-400 font-semibold">"{formData.name}"</span> record has been saved.
        </p>
        <div className="flex flex-col sm:flex-row sm:justify-center gap-4">
          <button
              onClick={() => {
                navigate({ to:  `/admin/elections/${positions && positions[0]?.electionId}/candidates` })
              }}
              className="mt-6 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white rounded-lg transition-colors"
          >
            Goto Candidates
          </button>
          <button
            onClick={() => {
              setSubmitSuccess(false);
              setSelectedFile(null);
              setUploadProgress(0);
              setFormData({ positionId: positions && positions[0].id, name: "", imageUrl: "" });
              navigate({ to:  `/admin/elections/${positions && positions[0]?.electionId}/candidates/new` })
            }}
            className="mt-6 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white rounded-lg transition-colors"
          >
            Add Another Candidate
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full flex flex-col items-stretch max-w-[1200px] lg:px-6 mx-auto text-zinc-200 font-sans">
      <div className="h-full overflow-y-auto">
        <div className="flex w-full flex-col">
          <div className="overflow-auto">
            <section className="relative mx-auto my-10 max-w-2xl w-full px-4">
              <form id="new-candidate-form" onSubmit={handleSubmit}>
                <div className="relative">
                  <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-xl mb-4 md:mb-8 overflow-y-auto">
                    
                    {/* Header */}
                    <div className="bg-[#0a192a]/50 border-b border-zinc-800 flex items-center px-6 py-5">
                      <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">
                         {isEditMode ? `Edit Candidate `:`Create New Candidate`}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          Add a candidate node to a specific ballot layer context. Portrait images are accepted and processed.
                        </p>
                      </div>
                    </div>

                    {/* Inputs fields block */}
                    <div className="divide-y divide-zinc-800/60 bg-zinc-900/40">
                      
                      {/* Position Picker Dropdown */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                              Contesting Position
                            </label>
                          </div>
                          <div className="order-1 col-span-8 w-full relative">
                            <button
                              type="button"
                              onClick={() => setDropdowns({ positionId: !dropdowns.positionId })}
                              className="flex items-center justify-between rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white hover:bg-zinc-900 text-left text-sm px-3 py-2 h-[36px] w-full focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            >
                              <span>{selectedPositionLabel}</span>
                              <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0" />
                            </button>

                            {dropdowns.positionId && (
                              <div className="absolute left-0 mt-1 w-full rounded-md border border-zinc-700 bg-[#0a192a] shadow-xl z-50 overflow-hidden divide-y divide-zinc-800">
                                {positions?.map((pos: any) => (
                                  <button
                                    key={pos.id}
                                    type="button"
                                    onClick={() => selectOption("positionId", pos.id)}
                                    className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-purple-600 hover:text-white ${formData.positionId === pos.id ? "bg-zinc-900 text-purple-400 font-medium" : "text-zinc-400"}`}
                                  >
                                    {pos.title}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Candidate Name Input */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                              Candidate Full Name
                            </label>
                          </div>
                          <div className="order-1 col-span-8 w-full">
                            <div className="relative flex items-center">
                              <input
                                type="text"
                                name="name"
                                placeholder="e.g. Jane Afia Mensah"
                                required
                                disabled={isSubmitting}
                                value={formData?.name}
                                onChange={handleInputChange}
                                className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm pl-9 pr-3 py-2 h-[36px] transition-all disabled:opacity-50"
                              />
                              <User className="absolute left-3 w-4 h-4 text-zinc-500" />
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Candidate Teaser Input */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                              Candidate Teaser
                            </label>
                          </div>
                          <div className="order-1 col-span-8 w-full">
                            <div className="relative flex items-center">
                              <input
                                type="text"
                                name="teaser"
                                placeholder="e.g. unbreakable, Jane"
                                required
                                disabled={isSubmitting}
                                value={formData?.teaser}
                                onChange={handleInputChange}
                                className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm pl-9 pr-3 py-2 h-[36px] transition-all disabled:opacity-50"
                              />
                              <User className="absolute left-3 w-4 h-4 text-zinc-500" />
                            </div>
                          </div>
                        </div>
                      </div>
                     <div className="px-6 py-5">
                          <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                            <div className="col-span-4 flex flex-col pt-1.5">
                              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Ballot / Sorting Number
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
                                Specify how candidates are arranged on the ballot horizontally.
                              </div>
                            </div>
                          </div>
                        </div>

                      {/* Storage Object File Ingestion Dropzone Field */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                              Portrait Asset
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
                                  <span className="text-xs font-medium text-zinc-300">Upload candidate portrait</span>
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

                    </div>

                    {/* Submit layout control row element */}
                    <div className="bg-[#0a192a]/50 border-t border-zinc-800 px-6 py-4 flex justify-end gap-4 cursor-pointer">
                      <button 
                        type="button"
                        onClick={() => {
                            if(window.confirm(`Go back!`)) router.history.back(); 
                        }}
                      >
                        Cancel
                      </button>
                      
                      <button
                        type="submit"
                        disabled={isSubmitting || !formData?.name  ||  !formData?.positionId }
                        className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm rounded-md transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                           isEditMode ? `Update Candidate `:`Create Candidate`
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
