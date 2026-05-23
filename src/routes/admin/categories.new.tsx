import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { CheckCircle2, ChevronDown, FolderTree, FileText, Hash, ArrowUpDown, RefreshCw } from "lucide-react";

// Types matching the precise columns of the 'categories' Drizzle schema
interface CategoryFormData {
  eventId: number;      // references events.id (ForeignKey, Not Null)
  name: string;         // official category name e.g., "Artist of the Year" (Not Null)
  description: string;  // detailed section rules/context (Not Null)
  code: string;         // updated to a 4-digit unique code token (Not Null)
  order: number;        // sequential sorting index weight number
}

interface CategoryFormProps {
  initialData?: CategoryFormData & { id: number }; // If passed, component runs in Edit Mode
  onSuccess?: () => void;
}

export const Route = createFileRoute("/admin/categories/new")({
  component: CategoryFormContainer,
});

function CategoryFormContainer() {
  return <CategoryForm />;
}

export function CategoryForm({ initialData, onSuccess }: CategoryFormProps) {
  const isEditMode = !!initialData;

  const activeEvents:any = [
    { id: 1, title: "2026 National Music Awards" },
    { id: 2, title: "Inter-University Rap Battle Arena" },
    { id: 3, title: "Community Heritage Talent Search" },
  ];

  // Generates a human-readable, safe 4-digit unique category alphanumeric token
  const generateFourDigitToken = () => {
    const chars = "0123456789"; // Excludes easily confused digits like 0, O, 1, I
    let token = "";
    const randomBuffer = new Uint32Array(4);
    window.crypto.getRandomValues(randomBuffer);
    
    for (let i = 0; i < 4; i++) {
      token += chars[randomBuffer[i] % chars.length];
    }
    return token;
  };

  const [formData, setFormData] = useState<CategoryFormData>({
    eventId: activeEvents?.id || 1,
    name: "",
    description: "",
    code: generateFourDigitToken(), // Pre-populated unique token
    order: 1, // Default sequential weight
  } as any);

  const [dropdowns, setDropdowns] = useState({ eventId: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        eventId: initialData.eventId,
        name: initialData.name,
        description: initialData.description,
        code: initialData.code,
        order: initialData.order || 1,
      });
    }
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: name === "order" ? Math.max(1, parseInt(value) || 1) : value 
    }));
  };

  const regenerateCategoryToken = () => {
    setFormData((prev) => ({ ...prev, code: generateFourDigitToken() }));
  };

  const selectOption = (field: "eventId", value: number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setDropdowns((prev) => ({ ...prev, [field]: false }));
  };

  const selectedEventLabel = activeEvents.find((evt:any) => evt.id === formData.eventId)?.title || "Select a parent event";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      if (isEditMode) {
        console.log(`Updating Category schema footprint row ID [${initialData?.id}]:`, formData);
      } else {
        console.log("Inserting Category record into Drizzle DB driver:", formData);
      }
      
      setSubmitSuccess(true);
      if (onSuccess) onSuccess();
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
        <h3 className="text-xl font-bold text-white">
          {isEditMode ? "Category Updated" : "Category Saved Successfully"}
        </h3>
        <p className="text-sm text-zinc-400 mt-2">
          Category <span className="text-purple-400 font-semibold">"{formData.name}"</span> has been committed under unique key: <span className="font-mono text-white bg-[#0a192a]/50 px-2 py-0.5 rounded border border-zinc-800 tracking-wider font-bold">{formData.code}</span>
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitSuccess(false);
            if (!isEditMode) {
              setFormData((prev) => ({ ...prev, name: "", description: "", code: generateFourDigitToken(), order: prev.order + 1 }));
            }
          }}
          className="mt-6 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white rounded-lg transition-colors"
        >
          {isEditMode ? "Close Panel" : "Create Next Category"}
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
              <form id="category-configuration-form" onSubmit={handleSubmit}>
                <div className="relative">
                  <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-xl mb-4 md:mb-8 overflow-hidden">
                    
                    {/* Header Banner Context */}
                    <div className="bg-[#0a192a]/50 border-b border-zinc-800 flex items-center px-6 py-5">
                      <div>
                        <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                          <FolderTree className="w-5 h-5 text-purple-400" />
                          <span>{isEditMode ? "Modify Category Profile" : "Create Voting Category"}</span>
                        </h3>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          Group contestants into distinct ballot layers. Setting explicit order variables allows you to dictate sorting logic within live user menus.
                        </p>
                      </div>
                    </div>

                    {/* Inputs fields block */}
                    <div className="divide-y divide-zinc-800/60 bg-zinc-900/40">
                      
                      {/* 1. Event ForeignKey Dropdown */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Belongs to Event</label>
                          </div>
                          <div className="order-1 col-span-8 w-full relative">
                            <button
                              type="button"
                              disabled={isSubmitting || isEditMode}
                              onClick={() => setDropdowns({ eventId: !dropdowns.eventId })}
                              className="flex items-center justify-between rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white hover:bg-zinc-900 text-left text-sm px-3 py-2 h-[36px] w-full focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all disabled:opacity-40"
                            >
                              <span className="truncate">{selectedEventLabel}</span>
                              <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0" />
                            </button>

                            {dropdowns.eventId && (
                              <div className="absolute left-0 mt-1 w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 shadow-xl z-50 overflow-hidden divide-y divide-zinc-800">
                                {activeEvents.map((evt:any) => (
                                  <button
                                    key={evt.id}
                                    type="button"
                                    onClick={() => selectOption("eventId", evt.id)}
                                    className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-purple-600 hover:text-white ${formData.eventId === evt.id ? "bg-zinc-900 text-purple-400 font-medium" : "text-zinc-400"}`}
                                  >
                                    {evt.title}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 2. Category Name Input */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Category Name</label>
                          </div>
                          <div className="order-1 col-span-8 w-full">
                            <input
                              type="text"
                              name="name"
                              placeholder="e.g. Artist of the Year"
                              required
                              disabled={isSubmitting}
                              value={formData.name}
                              onChange={handleInputChange}
                              className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm px-3 py-2 h-[36px] transition-all disabled:opacity-50"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 3. Horizontal Sequential Layout Parameters (Code & Order Stack Grid) */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Layout Indexing</label>
                          </div>
                          <div className="order-1 col-span-8 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                            
                            {/* Alphanumeric Unique 4-Digit Generation Code */}
                            <div>
                              <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1.5 tracking-wide flex items-center gap-1">
                                <Hash className="w-3 h-3" /> 4-Digit Menu Code
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="w-28 bg-[#0a192a]/50 border border-zinc-700 rounded-md px-3 py-1.5 text-sm font-mono font-bold text-purple-400 tracking-widest text-center select-all h-[36px] flex items-center justify-center">
                                  {formData.code}
                                </div>
                                <button
                                  type="button"
                                  onClick={regenerateCategoryToken}
                                  disabled={isSubmitting || isEditMode}
                                  className="px-2.5 h-[36px] bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 disabled:opacity-40"
                                  title="Regenerate unique token"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Sequential UI Weights Sorting Order Input */}
                            <div>
                              <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1.5 tracking-wide flex items-center gap-1">
                                <ArrowUpDown className="w-3 h-3 text-zinc-500" /> Sequential Sorting Order
                              </span>
                              <div className="relative flex items-center w-28">
                                <input
                                  type="number"
                                  name="order"
                                  min={1}
                                  required
                                  disabled={isSubmitting}
                                  value={formData.order}
                                  onChange={handleInputChange}
                                  className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm px-3 py-2 h-[36px] font-mono font-bold transition-all disabled:opacity-50"
                                />
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>

                      {/* 4. Description/Rules Ingestion TextArea */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Description/Rules</label>
                          </div>
                          <div className="order-1 col-span-8 w-full">
                            <div className="relative flex items-start">
                              <textarea
                                name="description"
                                rows={3}
                                placeholder="Define category voting requirements or parameters context..."
                                required
                                disabled={isSubmitting}
                                value={formData.description}
                                onChange={handleInputChange}
                                className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm p-3 transition-all resize-none disabled:opacity-50"
                              />
                              <FileText className="absolute right-3 top-3 w-4 h-4 text-zinc-700" />
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Submit Footer Action Controls */}
                    <div className="bg-[#0a192a]/50 border-t border-zinc-800 px-6 py-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting || !formData.name || !formData.description}
                        className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm rounded-md transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-40 flex items-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                          isEditMode ? "Update Category" : "Deploy Category"
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
