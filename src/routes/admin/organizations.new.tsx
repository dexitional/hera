import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import { UploadCloud, CheckCircle2, AlertCircle } from "lucide-react";

// Types corresponding to the fields required by the 'organizations' Drizzle schema
interface CreateOrganizationFormData {
  name: string;
  imageUrl: string;
  email: string;
  phone: string;
  adminId: string; // Linked to Better Auth User ID
}

interface FormErrors {
  email?: string;
  phone?: string;
}

export const Route = createFileRoute("/admin/organizations/new")({
  component: CreateOrganization,
});

function CreateOrganization() {
  // Simulating an authenticated session context from Better Auth
  // In production, pull this directly from your auth store (e.g., auth.useSession())
  const mockBetterAuthUser = {
    id: "usr_cl7w9x8120000jk8s9zxx41p0",
    name: "John Doe",
  };

  const [formData, setFormData] = useState<CreateOrganizationFormData>({
    name: "",
    imageUrl: "",
    email: "",
    phone: "",
    adminId: mockBetterAuthUser.id, // Pre-populating ownership automatically
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validateField = (name: string, value: string) => {
    const newErrors: FormErrors = { ...errors };

    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        newErrors.email = "Please enter a valid email address.";
      } else {
        delete newErrors.email;
      }
    }

    if (name === "phone") {
      // Validates general formats including international codes (+233 etc)
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      // Strip out spaces or dashes for clean evaluation
      const cleanPhone = value.replace(/[\s-]/g, "");
      if (!phoneRegex.test(cleanPhone)) {
        newErrors.phone = "Enter a valid international phone format (e.g., +233240000000).";
      } else {
        delete newErrors.phone;
      }
    }

    setErrors(newErrors);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Final defensive validation validation run
    validateField("email", formData.email);
    validateField("phone", formData.phone);

    if (Object.keys(errors).length > 0 || !formData.name || !formData.email || !formData.phone) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate database payload serialization latency 
      await new Promise((resolve) => setTimeout(resolve, 1200));
      
      console.log("Payload dispatched successfully to Drizzle driver:", formData);
      setSubmitSuccess(true);
    } catch (err) {
      console.error("Database ingestion failure:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="w-full max-w-md mx-auto my-20 p-6 bg-zinc-900 border border-zinc-800 rounded-xl text-center font-sans animate-in fade-in duration-200">
        <CheckCircle2 className="w-12 h-12 text-purple-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white">Organization Created</h3>
        <p className="text-sm text-zinc-400 mt-2">
          Workspace <span className="text-purple-400 font-semibold">"{formData.name}"</span> has been configured and written to your database instance cleanly.
        </p>
        <button
          onClick={() => setSubmitSuccess(false)}
          className="mt-6 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white rounded-lg transition-colors"
        >
          Create Another
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
              <form id="new-org-form" onSubmit={handleSubmit}>
                <div className="relative">
                  <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-xl mb-4 md:mb-8 overflow-hidden">
                    
                    {/* Header Banner */}
                    <div className="bg-zinc-950 border-b border-zinc-800 flex items-center px-6 py-5">
                      <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">
                          Configure Workspace Profile
                        </h3>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          Populate profile variables to provision an isolated core node block environment. This structure binds directly to administrative multi-tenant rules.
                        </p>
                      </div>
                    </div>

                    {/* Inputs Matrix fields block */}
                    <div className="divide-y divide-zinc-800/60 bg-zinc-900/40">
                      
                      {/* Name input row */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                              Workspace Name
                            </label>
                          </div>
                          <div className="order-1 col-span-8 w-full">
                            <input
                              type="text"
                              name="name"
                              placeholder="e.g. Festora Global"
                              required
                              disabled={isSubmitting}
                              value={formData.name}
                              onChange={handleInputChange}
                              className="flex w-full rounded-md border border-zinc-700 bg-zinc-950 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm px-3 py-2 h-[36px] transition-all disabled:opacity-50"
                            />
                            <div className="text-zinc-500 text-xs mt-2">
                              Enter the distinct consumer branding name for this entity node wrapper.
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Email input row */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                              System Email
                            </label>
                          </div>
                          <div className="order-1 col-span-8 w-full">
                            <input
                              type="email"
                              name="email"
                              placeholder="contact@organization.com"
                              required
                              disabled={isSubmitting}
                              value={formData.email}
                              onChange={handleInputChange}
                              className={`flex w-full rounded-md border bg-zinc-950 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm px-3 py-2 h-[36px] transition-all disabled:opacity-50 ${errors.email ? 'border-red-500/60 focus:ring-red-500' : 'border-zinc-700'}`}
                            />
                            {errors.email ? (
                              <div className="text-red-400 text-xs mt-2 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> {errors.email}
                              </div>
                            ) : (
                              <div className="text-zinc-500 text-xs mt-2">
                                Unique parameter constraints are checked globally inside index caches.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Phone input row */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                              Contact Phone
                            </label>
                          </div>
                          <div className="order-1 col-span-8 w-full">
                            <input
                              type="tel"
                              name="phone"
                              placeholder="e.g. +233240000000"
                              required
                              disabled={isSubmitting}
                              value={formData.phone}
                              onChange={handleInputChange}
                              className={`flex w-full rounded-md border bg-zinc-950 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm px-3 py-2 h-[36px] transition-all disabled:opacity-50 ${errors.phone ? 'border-red-500/60 focus:ring-red-500' : 'border-zinc-700'}`}
                            />
                            {errors.phone ? (
                              <div className="text-red-400 text-xs mt-2 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> {errors.phone}
                              </div>
                            ) : (
                              <div className="text-zinc-500 text-xs mt-2">
                                Standard format tracks integration vectors for dispatching active system SMS text triggers.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Brand asset logo handling row */}
                      <div className="px-6 py-5">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-start">
                          <div className="col-span-4 flex flex-col pt-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                              Branding Asset
                            </label>
                          </div>
                          <div className="order-1 col-span-8 w-full">
                            
                            {/* Standardizing look to look like a modern dashboard selector area wrapper */}
                            <div className="w-full border-2 border-dashed border-zinc-800 rounded-lg p-4 bg-zinc-950 text-center flex flex-col items-center justify-center group hover:border-zinc-700 transition-colors cursor-pointer">
                              <UploadCloud className="w-6 h-6 text-zinc-500 group-hover:text-purple-400 transition-colors mb-2" />
                              <span className="text-xs font-medium text-zinc-300">Upload organization image</span>
                              <span className="text-[10px] text-zinc-500 mt-1">PNG, JPG up to 2MB (Simulated CDN fallback tracking)</span>
                              <input 
                                type="text"
                                name="imageUrl"
                                placeholder="Or inject a manual CDN link here..."
                                disabled={isSubmitting}
                                value={formData.imageUrl}
                                onChange={handleInputChange}
                                className="mt-3 flex w-full rounded border border-zinc-800 bg-zinc-900 text-zinc-300 placeholder:text-zinc-600 text-xs px-2.5 py-1.5 focus:outline-none"
                              />
                            </div>

                          </div>
                        </div>
                      </div>

                      {/* Admin validation details block (Read-Only session fallback context metadata tag) */}
                      <div className="px-6 py-5 bg-zinc-950/20">
                        <div className="relative text-sm flex flex-col gap-2 md:grid md:grid-cols-12 items-center">
                          <div className="col-span-4 flex flex-col">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                              Ownership Context
                            </label>
                          </div>
                          <div className="order-1 col-span-8 w-full flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-400">
                            <span className="truncate max-w-[280px]">Admin: {mockBetterAuthUser.name}</span>
                            <span className="text-zinc-600 font-sans tracking-wide text-[10px] bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
                              {formData.adminId.slice(0, 10)}...
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Submit footer trigger action anchor segment */}
                    <div className="bg-zinc-950 border-t border-zinc-800 px-6 py-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting || Object.keys(errors).length > 0}
                        className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm rounded-md transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Organization"
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
