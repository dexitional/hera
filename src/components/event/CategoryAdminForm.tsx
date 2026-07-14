import React, { useState } from "react";
import { CheckCircle2, FolderTree, Hash } from "lucide-react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCategoryFn, updateCategoryFn } from "#/server/tenant-events";

export default function CategoryAdminForm({ data: { data, eventId } }: any) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();

  const [formData, setFormData] = useState<any>({
    eventId: eventId,
    name: data?.name,
    description: data?.description,
    code: data?.code,
    id: data?.id,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isEditMode = data != null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const createMutation = useMutation({
    mutationFn: createCategoryFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-admin'] });
    },
    onError: (error: any) => setErrorMessage(error.message),
  });

  const editMutation = useMutation({
    mutationFn: updateCategoryFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-admin'] });
    },
    onError: (error: any) => setErrorMessage(error.message),
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      if (isEditMode) {
        await editMutation.mutateAsync({ data: formData } as any);
      } else {
        await createMutation.mutateAsync({ data: formData } as any);
      }
      setSubmitSuccess(true);
      setTimeout(() => navigate({ to: `/admin/events/${eventId}/categories` }), 1500);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to save category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="w-full max-w-md mx-auto my-20 p-6 bg-zinc-900 border border-zinc-800 rounded-xl text-center font-sans animate-in fade-in duration-200">
        <CheckCircle2 className="w-12 h-12 text-purple-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white">Category Saved</h3>
        <p className="text-sm text-zinc-400 mt-2">
          The category <span className="text-purple-400 font-semibold">"{formData?.name}"</span> has been saved successfully.
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
              <form id="category-form" onSubmit={handleSubmit}>
                <div className="relative">
                  <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-xl mb-4 md:mb-8 overflow-hidden">

                    {/* Header Banner */}
                    <div className="bg-[#0a192a]/50 border-b border-zinc-800 flex items-center px-6 py-5">
                      <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">
                          {isEditMode ? `Edit Voting Category` : `Create New Category`}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          Define an official ballot subdivision for this event (e.g. "Artist of the Year"). Contestants are enrolled under a category.
                        </p>
                      </div>
                    </div>

                    {/* Form Fields Stack */}
                    <div className="divide-y divide-zinc-800/60 bg-zinc-900/40">

                      {/* 1. Category Name Input Row */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                              Category Name
                            </label>
                          </div>
                          <div className="order-1 col-span-8 w-full">
                            <div className="relative flex items-center">
                              <input
                                type="text"
                                name="name"
                                placeholder="e.g. Artist of the Year"
                                required
                                disabled={isSubmitting}
                                value={formData?.name ?? ''}
                                onChange={handleInputChange}
                                className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm pl-9 pr-3 py-2 h-[36px] transition-all disabled:opacity-50"
                              />
                              <FolderTree className="absolute left-3 w-4 h-4 text-zinc-500" />
                            </div>
                            <div className="text-zinc-500 text-xs mt-2">
                              The official name of this ballot subdivision as it will appear to voters.
                            </div>
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
                              placeholder="Describe the rules or context of this voting category..."
                              required
                              disabled={isSubmitting}
                              value={formData?.description ?? ''}
                              onChange={handleInputChange}
                              className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm p-3 transition-all resize-none disabled:opacity-50"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 3. Interaction Code Input Row */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                              Interaction Code
                            </label>
                          </div>
                          <div className="order-1 col-span-8 w-full">
                            <div className="relative flex items-center w-40">
                              <input
                                type="text"
                                name="code"
                                placeholder="e.g. AOY"
                                required
                                disabled={isSubmitting}
                                value={formData?.code ?? ''}
                                onChange={handleInputChange}
                                className="flex w-full rounded-md border border-zinc-700 bg-[#0a192a]/50 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm pl-9 pr-3 py-2 h-[36px] font-mono uppercase transition-all disabled:opacity-50"
                              />
                              <Hash className="absolute left-3 w-4 h-4 text-zinc-500" />
                            </div>
                            <div className="text-zinc-500 text-xs mt-2">
                              A short unique code voters dial via USSD to select this category. Must be unique within this event.
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                    {errorMessage && (
                      <div className="px-6 py-3 bg-red-950/20 border-t border-red-900/30 text-red-400 text-xs">
                        {errorMessage}
                      </div>
                    )}

                    {/* Submit Action Footer */}
                    <div className="bg-[#0a192a]/50 border-t border-zinc-800 px-6 py-4 flex justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Go back!`)) router.history.back();
                        }}
                        className="text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting || !formData?.name}
                        className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm rounded-md transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                          isEditMode ? `Update Category` : `Create Category`
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
