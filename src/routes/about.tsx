import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <div className="min-h-screen bg-[#0a192a]/80 text-white antialiased font-sans flex flex-col items-center">
    <main className="w-full flex flex-col items-center justify-center">
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pb-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6" style={{ opacity: 1, transform: "none" }}>
            <h2 className="text-5xl font-extrabold mb-6 text-white">Our Story</h2>
            <p className="text-base text-zinc-300 leading-relaxed">
              Founded in 2019, Heravote emerged to solve a simple problem: make voting easy, secured, accessible, convenient and transparent with real-time results. Whether you're running organization elections or events nominations and award ceremonies, Heravote adapts perfectlyto your needs.
            </p>
            <p>It is scalable, secured with 24/7 support system to give you a smooth voting experience.</p>
          </div>
          <div className="relative" style={{ opacity: 1, transform: "none" }}>
            <div className="grid grid-cols-1 gap-6">
              <div className="rounded-3xl mt-15 bg-[#6d28d9]/30 p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-rocket w-6 h-6 text-white"><path d="M4 13a8 8 0 0 1 7 7a6 6 0 0 0 3 -5a9 9 0 0 0 6 -8a3 3 0 0 0 -3 -3a9 9 0 0 0 -8 6a6 6 0 0 0 -5 3"></path><path d="M7 14a6 6 0 0 0 -3 6a6 6 0 0 0 6 -3"></path><path d="M14 9a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path></svg>
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-lg font-bold text-white">Our Mission</h3>
                  <p className="text-sm text-zinc-300">Empowering democratic participation through technology</p>
                </div>
              </div>
              <div className="rounded-3xl bg-[#f59e42]/20 p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-globe w-6 h-6 text-white"><path d="M7 9a4 4 0 1 0 8 0a4 4 0 0 0 -8 0"></path><path d="M5.75 15a8.015 8.015 0 1 0 9.25 -13"></path><path d="M11 17v4"></path><path d="M7 21h8"></path></svg>
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-lg font-bold text-white">Global Impact</h3>
                  <p className="text-sm text-zinc-300">Serving capable institutions across Ghana and Africa.</p>
                </div>
              </div>
              <div className="rounded-3xl bg-[#6d28d9]/30 p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-shield w-6 h-6 text-white"><path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3"></path></svg>
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-lg font-bold text-white">Security First</h3>
                  <p className="text-sm text-zinc-300">Enterprise-grade security for your peace of mind</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pb-24">
        <div className="text-center mb-16" style={{ opacity: 1, transform: "none" }}>
          <h2 className="text-3xl font-extrabold mb-10 text-white">Our Core Values</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="rounded-3xl bg-[#6d28d9]/30 p-10 flex flex-col items-center justify-center gap-4 shadow-md" style={{ opacity: 1, transform: "none" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-rocket w-12 h-12 text-purple-400"><path d="M4 13a8 8 0 0 1 7 7a6 6 0 0 0 3 -5a9 9 0 0 0 6 -8a3 3 0 0 0 -3 -3a9 9 0 0 0 -8 6a6 6 0 0 0 -5 3"></path><path d="M7 14a6 6 0 0 0 -3 6a6 6 0 0 0 6 -3"></path><path d="M14 9a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path></svg>
            <h3 className="text-xl font-bold text-white text-center">Innovation</h3>
            <p className="text-base text-zinc-200 text-center">Constantly pushing boundaries to create better solutions for democratic participation</p>
          </div>
          <div className="rounded-3xl bg-[#f59e42]/20 p-10 flex flex-col items-center justify-center gap-4 shadow-md" style={{ opacity: 1, transform: "none" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-users w-12 h-12 text-orange-400"><path d="M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"></path><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path><path d="M21 21v-2a4 4 0 0 0 -3 -3.85"></path></svg>
            <h3 className="text-xl font-bold text-white text-center">Community</h3>
            <p className="text-base text-zinc-200 text-center">Building strong relationships with our users and voting partners</p>
          </div>
          <div className="rounded-3xl bg-[#6d28d9]/30 p-10 flex flex-col items-center justify-center gap-4 shadow-md" style={{ opacity: 1, transform: "none" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-chart-line w-12 h-12 text-purple-400"><path d="M4 19l16 0"></path><path d="M4 15l4 -6l4 2l4 -5l4 4"></path></svg>
            <h3 className="text-xl font-bold text-white text-center">Excellence</h3>
            <p className="text-base text-zinc-200 text-center">Committed to delivering the highest quality voting experience</p>
          </div>
        </div>
      </section>

      <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pb-24">
        <h2 className="text-3xl font-extrabold mb-10 text-white text-center">Why Choose Heravote</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="rounded-3xl bg-[#f59e42]/20 p-10 flex flex-col gap-3 shadow-md">
            <h3 className="text-xl font-extrabold text-white mb-2">secure &amp; transparent</h3>
            <p className="text-base text-zinc-200">Built-in security features ensure voting integrity with payment verification, anti-fraud measures, and transparent result tracking. Every vote counts.</p>
          </div>
          <div className="rounded-3xl bg-[#6d28d9]/30 p-10 flex flex-col gap-3 shadow-md">
            <h3 className="text-xl font-extrabold text-white mb-2">flexible &amp; scalable</h3>
            <p className="text-base text-zinc-200">From small team awards to large-scale competitions. Support for multiple categories, unlimited nominees, and concurrent voting events.</p>
          </div>
          <div className="rounded-3xl bg-[#a78bfa]/20 p-10 flex flex-col gap-3 shadow-md">
            <h3 className="text-xl font-extrabold text-white mb-2">intuitive &amp; powerful</h3>
            <p className="text-base text-zinc-200">Clean interface for voters, comprehensive admin dashboard for organizers. Real-time analytics and automated payment processing make management effortless.</p>
          </div>
        </div>
      </section>

      <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pb-24">
        <div className="text-center" style={{ opacity: 0, transform: "translateY(20px)" }}>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-6">Ready to transform your voting events?</h2>
          <p className="text-lg text-zinc-300 max-w-2xl mx-auto mb-8">Join leading institutions using Heravote to make democratic participation more accessible and secure.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-purple-600 text-white font-bold text-lg shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 hover:bg-purple-700" href="/auth/signup">
              Get Started Today
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-arrow-right ml-2 w-6 h-6"><path d="M5 12l14 0"></path><path d="M13 18l6 -6"></path><path d="M13 6l6 6"></path></svg>
            </a>
            <a className="inline-flex items-center justify-center px-8 py-4 rounded-full border-2 border-purple-500 text-purple-200 font-bold text-lg hover:bg-purple-900/30 transition-colors" href="/contact">Contact Us</a>
          </div>
        </div>
      </section>
    </main>
    </div>
  )
}
