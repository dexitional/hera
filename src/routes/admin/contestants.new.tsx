import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect, useRef } from "react";
import { CheckCircle2, ChevronDown, User, Tag, Hash, ArrowUpDown, RefreshCw, UploadCloud, FileImage, X, AlertCircle } from "lucide-react";

// Types matching the precise columns of the 'contestants' Drizzle schema
interface ContestantFormData {
  categoryId: number;   // references categories.id (ForeignKey, Not Null)
  name: string;         // official contestant name (Not Null)
  tagline: string;      // short biographical hook phrase (Not Null)
  imageUrl: string;     // Stores the resultant remote object storage key link string
  code: string;         // explicit 4-digit unique numeric code token (Not Null)
  order: number;        // layout sorting index weight number (Nullable integer)
}

interface ContestantFormProps {
  initialData?: ContestantFormData & { id: number }; // Component triggers Edit Mode if populated
  onSuccess?: () => void;
}

export const Route = createFileRoute("/admin/contestants/new")({
  component: ContestantFormContainer,
});

function ContestantFormContainer() {
  return <ContestantForm />;
}

export function ContestantForm({ initialData }: ContestantFormProps) {
  const isEditMode = !!initialData;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock categories lookup array simulating data from your categories context table
  const availableCategories = [
    { id: 1, name: "Artist of the Year (NMA 2026)" },
    { id: 2, name: "Best Rapper of the Year (NMA 2026)" },
    { id: 3, name: "Lightweight Freestyle Tier (Rap Battle)" },
  ];

  // Generates a cryptographically secure 4-digit numeric code token string
  const generateFourDigitNumericCode = () => {
    const randomBuffer = new Uint32Array(1);
    window.crypto.getRandomValues(randomBuffer);
    const number = randomBuffer[0] % 10000;
    return number.toString().padStart(4, "0");
  };

  const [formData, setFormData] = useState<ContestantFormData>({
    categoryId: availableCategories[0]?.id || 1,
    name: "",
    tagline: "",
    imageUrl: "", 
    code: generateFourDigitNumericCode(),
    order: 1,
  });

  // Local storage upload pipeline state machines
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadingToBucket, setUploadingToBucket] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [dropdowns, setDropdowns] = useState({ categoryId: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Hydrate state variables instantly if editing an existing profile record context
  useEffect(() => {
    if (initialData) {
      setFormData({
        categoryId: initialData.categoryId,
        name: initialData.name,
        tagline: initialData.tagline,
        imageUrl: initialData.imageUrl || "",
        code: initialData.code,
        order: initialData.order || 1,
      });
      if (initialData.imageUrl) {
        // Mock a placeholder file object structure if a historical key exists
        setSelectedFile(new File([""], "remote-portrait-asset.jpg", { type: "image/jpeg" }));
        setUploadProgress(100);
      }
    }
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "order" ? Math.max(1, parseInt(value) || 1) : value,
    }));
  };

  // Triggers when a file payload is injected via device windows or drag drops
  const handleFileUploadAction = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Invalid file formatting. Please supply an image asset.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Asset payload bounds exceeded. Portrait maximum limit is 2MB.");
      return;
    }

    setUploadError(null);
    setSelectedFile(file);
    setUploadingToBucket(true);
    setUploadProgress(15);

    try {
      // --- ARCHITECTURAL NOTE FOR PRODUCTION COMPILATION ---
      // 1. Request a token signature or presigned upload URL endpoint route from your server setup:
      //    const response = await fetch(`/api/storage/presigned?file=${file.name}&type=${file.type}`);
      //    const { uploadUrl, publicAssetUrl } = await response.json();
      // 2. Put raw binary stream bits directly into your R2/S3 asset handler wrapper context:
      //    await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      // 3. Complete binding payload parameters: setFormData(prev => ({ ...prev, imageUrl: publicAssetUrl }));

      // Simulating standard chunked storage write latency
      await new Promise((resolve) => setTimeout(resolve, 500));
      setUploadProgress(65);
      await new Promise((resolve) => setTimeout(resolve, 400));
      setUploadProgress(100);

      const generatedStorageBucketLink = `https://festora-storage.internal{crypto.randomUUID()}-${file.name}`;
      setFormData((prev) => ({ ...prev, imageUrl: generatedStorageBucketLink }));
    } catch (err) {
      setUploadError("Storage destination synchronization handshake broke. Please retry.");
      setSelectedFile(null);
    } finally {
      setUploadingToBucket(false);
    }
  };

  const clearSelectedFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadError(null);
    setFormData((prev) => ({ ...prev, imageUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const regenerateNumericCode = () => {
    setFormData((prev) => ({ ...prev, code: generateFourDigitNumericCode() }));
  };

  const selectOption = (field: "categoryId", value: number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setDropdowns((prev) => ({ ...prev, [field]: false }));
  };

  const selectedCategoryLabel = availableCategories.find(
    (cat) => cat.id === formData.categoryId
  )?.name || "Select a parent category";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Submitting final Contestant payload to Drizzle mapping:", formData);
      setSubmitSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="w-full max-w-md mx-auto my-20 p-6 bg-zinc-900 rounded-xl border border-zinc-800 text-center font-sans animate-in fade-in duration-200">
        <CheckCircle2 className="w-12 h-12 text-purple-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white">
          {isEditMode ? "Profile Updated" : "Contestant Enrolled Successfully"}
        </h3>
        <p className="text-sm text-zinc-400 mt-2">
          Contestant Profile <span className="text-purple-400 font-semibold">"{formData.name}"</span> has been committed with an active remote object storage path layout reference.
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitSuccess(false);
            if (!isEditMode) {
              setSelectedFile(null);
              setFormData((prev) => ({
                ...prev,
                name: "",
                tagline: "",
                imageUrl: "",
                code: generateFourDigitNumericCode(),
                order: prev.order + 1
              }));
            }
          }}
          className="mt-6 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white rounded-lg transition-colors"
        >
          {isEditMode ? "Close Panel" : "Enroll Next Contestant"}
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
              <form id="contestant-configuration-form" onSubmit={handleSubmit}>
                <div className="relative">
                  <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-xl mb-4 md:mb-8 overflow-hidden">
                    
                    {/* Header Banner */}
                    <div className="bg-[#0a192a]/50 border-b border-zinc-800 flex items-center px-6 py-5">
                      <div>
                        <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                          <User className="w-5 h-5 text-purple-400" />
                          <span>{isEditMode ? "Modify Contestant Profile" : "Register Ballot Contestant"}</span>
                        </h3>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          Populate contestant profile parameters to configure their position on live application structures. Images are processed and uploaded directly to S3/R2 storage buckets.
                        </p>
                      </div>
                    </div>

                    {/* Inputs Fields Stack Matrix */}
                    <div className="divide-y divide-zinc-800/60 bg-zinc-900/40">
                      
                      {/* 1. Parent Category Selector Dropdown */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Assigned Category</label>
                          </div>
                          <div className="order-1 col-span-8 w-full relative">
                            <button
                              type="button"
                              disabled={isSubmitting || isEditMode}
                              onClick={() => setDropdowns({ categoryId: !dropdowns.categoryId })}
                              className="flex items-center justify-between rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white hover:bg-zinc-900 text-left text-sm px-3 py-2 h-[36px] w-full focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all disabled:opacity-40"
                            >
                              <span className="truncate">{selectedCategoryLabel}</span>
                              <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0" />
                            </button>

                            {dropdowns.categoryId && (
                              <div className="absolute left-0 mt-1 w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 shadow-xl z-50 overflow-hidden divide-y divide-zinc-800">
                                {availableCategories.map((cat) => (
                                  <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => selectOption("categoryId", cat.id)}
                                    className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-purple-600 hover:text-white ${formData.categoryId === cat.id ? "bg-zinc-900 text-purple-400 font-medium" : "text-zinc-400"}`}
                                  >
                                    {cat.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 2. Full Name Input */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Contestant Full Name</label>
                          </div>
                          <div className="order-1 col-span-8 w-full">
                            <input
                              type="text"
                              name="name"
                              placeholder="e.g. Stonebwoy"
                              required
                              disabled={isSubmitting}
                              value={formData.name}
                              onChange={handleInputChange}
                              className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm px-3 py-2 h-[36px] transition-all disabled:opacity-50"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 3. Biographical Tagline Input */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Contestant Tagline</label>
                          </div>
                          <div className="order-1 col-span-8 w-full">
                            <div className="relative flex items-center">
                              <input
                                type="text"
                                name="tagline"
                                placeholder="e.g. Defending Reggae/Dancehall Pioneer"
                                required
                                disabled={isSubmitting}
                                value={formData.tagline}
                                onChange={handleInputChange}
                                className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm pl-8 pr-3 py-2 h-[36px] transition-all disabled:opacity-50"
                              />
                              <Tag className="absolute left-2.5 w-3.5 h-3.5 text-zinc-500" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 4. S3 / R2 Object Storage Ingestion File Dropzone */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Contestant Portrait</label>
                          </div>
                          <div className="order-1 col-span-8 w-full">
                            
                            <input 
                              type="file"
                              ref={fileInputRef}
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => e.target.files?.[0] && handleFileUploadAction(e.target.files[0])}
                            />

                            <div 
                              onClick={() => !uploadingToBucket && fileInputRef.current?.click()}
                              className={`w-full border-2 border-dashed rounded-lg p-4 bg-[#0a192a]/50 text-center flex flex-col items-center justify-center group transition-colors cursor-pointer relative ${selectedFile ? 'border-purple-500/50 bg-purple-950/5' : 'border-zinc-800 hover:border-zinc-700'}`}
                            >
                              {!selectedFile ? (
                                <>
                                  <UploadCloud className="w-6 h-6 text-zinc-500 group-hover:text-purple-400 transition-colors mb-2" />
                                  <span className="text-xs font-medium text-zinc-300">Upload profile image asset</span>
                                  <span className="text-[10px] text-zinc-500 mt-1">Files stream directly to cloud object storage buckets</span>
                                </>
                              ) : (
                                <div className="w-full flex items-center justify-between px-2 text-left">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                                      <FileImage className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium text-zinc-200 truncate max-w-[240px]">
                                        {selectedFile.name === "remote-portrait-asset.jpg" ? "portrait-asset-stored.jpg" : selectedFile.name}
                                      </p>
                                      {selectedFile.size > 0 && (
                                        <p className="text-[10px] text-zinc-500 mt-0.5">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <button 
                                    onClick={clearSelectedFile}
                                    type="button"
                                    className="p-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}

                              {/* Upload progress feedback rendering logic */}
                              {uploadProgress > 0 && uploadProgress < 100 && (
                                <div className="absolute bottom-0 left-0 h-1 bg-purple-500 rounded-b transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                              )}
                            </div>

                            {/* Storage Error Alert Row */}
                            {uploadError && (
                              <div className="text-red-400 text-xs mt-2 flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5" />
                                {uploadError}
                              </div>
                            )}

                            {/* Hidden Drizzle Data Path State Visual Target Verification Anchor */}
                            {formData.imageUrl && (
                              <div className="mt-2 bg-[#0a192a]/50 border border-zinc-800 rounded px-2.5 py-1 text-[10px] font-mono text-zinc-500 flex items-center gap-2 truncate">
                                <span className="text-purple-400 uppercase font-bold text-[9px] border border-purple-500/20 px-1 rounded bg-purple-950/20 shrink-0">Drizzle Path Saved</span>
                                <span className="truncate">{formData.imageUrl}</span>
                              </div>
                            )}

                          </div>
                        </div>
                      </div>

                      {/* 5. Code & Order Layout Row */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Layout Configurations</label>
                          </div>
                          <div className="order-1 col-span-8 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                            
                            {/* Unique 4-Digit Numeric Ballot Selection Code */}
                            <div>
                              <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1.5 tracking-wide flex items-center gap-1">
                                <Hash className="w-3 h-3" /> 4-Digit Voting Code
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="w-28 bg-[#0a192a]/50 border border-zinc-700 rounded-md px-3 py-1.5 text-sm font-mono font-bold text-purple-400 tracking-widest text-center select-all h-[36px] flex items-center justify-center">
                                  {formData.code}
                               </div>
                                <button
                                  type="button"
                                  onClick={regenerateNumericCode}
                                  disabled={isSubmitting || isEditMode}
                                  className="px-2.5 h-[36px] bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 disabled:opacity-40"
                                  title="Regenerate unique code"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Sequential UI Weights Sorting Index Order */}
                            <div>
                              <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1.5 tracking-wide flex items-center gap-1">
                                <ArrowUpDown className="w-3 h-3 text-zinc-500" /> List Sorting Order
                              </span>
                              <input
                                type="number"
                                name="order"
                                min={1}
                                required
                                disabled={isSubmitting}
                                value={formData.order}
                                onChange={handleInputChange}
                                className="w-28 flex rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm px-3 py-2 h-[36px] font-mono font-bold transition-all disabled:opacity-50"
                              />
                            </div>

                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Submit Footer Actions */}
                    <div className="bg-[#0a192a]/50 border-t border-zinc-800 px-6 py-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting || uploadingToBucket || !formData.name || !formData.tagline || !formData.imageUrl}
                        className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm rounded-md transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-40 flex items-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                          isEditMode ? "Update Profile" : "Enroll Contestant"
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
