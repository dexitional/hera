import { useState } from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { Building2, Briefcase, Phone, MapPin, ArrowRight } from 'lucide-react';
import { authClient } from '#/lib/auth-client';
import { checkAuthSession } from '#/lib/auth-helper';

export const Route = createFileRoute('/welcome')({
  beforeLoad: async () => {
    const authState: any = await checkAuthSession();
    if (!authState?.authenticated) {
      throw redirect({ to: '/auth/signin', search: { redirect: '/welcome' } });
    }
    // Already completed onboarding -- nothing left to collect here.
    if (authState.user?.organization) {
      throw redirect({ to: '/admin' });
    }
    return { user: authState.user };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { user }: any = Route.useRouteContext();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    organization: '',
    jobTitle: '',
    phone: user?.phone || '',
    address: '',
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);

    const { error }: any = await authClient.updateUser({
      organization: formData.organization,
      jobTitle: formData.jobTitle,
      phone: formData.phone,
      address: formData.address,
    } as any);

    setSubmitting(false);

    if (error) {
      console.error('Failed to save onboarding details:', error.message);
      alert(`Couldn't save your details: ${error.message}`);
      return;
    }

    window.location.href = '/admin';
  };

  const handleSkip = () => {
    window.location.href = '/admin';
  };

  return (
    <div className="min-h-screen bg-[#0a192a]/50 text-white antialiased font-sans flex flex-col items-center">
      <main className="w-full flex flex-col items-center justify-center">
        <section className="w-full max-w-2xl mx-auto px-4 sm:px-10 lg:px-12 pt-6 sm:pt-14 lg:pt-20 pb-24">
          <div className="text-left mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
              Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
            </h1>
            <p className="text-lg text-zinc-300 max-w-lg">
              A few more details help us tailor Heravote to how you'll use it. This takes less than a minute.
            </p>
          </div>

          <div className="bg-slate-600/10 backdrop-blur-sm border border-slate-600/20 rounded-3xl p-8 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative group">
                <input
                  type="text"
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-600/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 pl-10 border border-slate-600/20 group-hover:border-slate-600/40 transition-colors text-sm text-white placeholder-zinc-400"
                  placeholder="Organization name"
                />
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 group-hover:text-purple-400 transition-colors w-4 h-4" />
              </div>

              <div className="relative group">
                <input
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-600/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 pl-10 border border-slate-600/20 group-hover:border-slate-600/40 transition-colors text-sm text-white placeholder-zinc-400"
                  placeholder="Job title"
                />
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 group-hover:text-purple-400 transition-colors w-4 h-4" />
              </div>

              <div className="relative group">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-600/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 pl-10 border border-slate-600/20 group-hover:border-slate-600/40 transition-colors text-sm text-white placeholder-zinc-400"
                  placeholder="Phone number"
                />
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 group-hover:text-purple-400 transition-colors w-4 h-4" />
              </div>

              <div className="relative group">
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-600/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 pl-10 border border-slate-600/20 group-hover:border-slate-600/40 transition-colors text-sm text-white placeholder-zinc-400"
                  placeholder="Address"
                />
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 group-hover:text-purple-400 transition-colors w-4 h-4" />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all duration-300 flex items-center justify-center gap-2 group text-sm font-medium shadow-lg disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : 'Continue'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="px-6 py-3 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
                >
                  Skip for now
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
