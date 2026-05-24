import { createFileRoute } from '@tanstack/react-router'
import Typewriter from 'typewriter-effect';

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <div className="min-h-screen bg-[#0a192a]/80 text-white antialiased font-sans flex flex-col items-center">
    <main className="relative">
      <div className="min-h-screen bg-[#0a192a]/80 text-white antialiased font-sans flex flex-col items-center">
        <main className="w-full flex flex-col items-center justify-center">
          <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pt-6 sm:pt-12 lg:pt-24 pb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight text-left" style={{ fontFamily: "Inter, sans-serif" }}>
                          <Typewriter
                            options={{
                              wrapperClassName: 'text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight text-left',
                              strings: ['Easy Voting', 'Fast Setup', 'Secure System','Live Results'],
                              autoStart: true,
                              loop: true,
                              cursorClassName: 'relative w-1 pl-2 top-3 text-8xl animate-pulse text-purple-400'
                            }}
                          />
                        </h1>
                        <p className="text-lg md:text-xl text-zinc-300 mb-8 text-left max-w-lg">Create transparent elections and voting events in minutes. From awards ceremonies to organisation elections - secure, verifiable, and engaging digital voting with real-time results.</p>
                        <div className="flex gap-3">
                            <a className="inline-flex items-center justify-center px-6 py-2 rounded-full bg-purple-600 text-white font-bold text-sm shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 hover:bg-purple-700" href="/elections">
                                Vote Now
                                <svg className="ml-2 w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                                    <path d="M5 12h14M12 5l7 7-7 7"></path>
                                </svg>
                            </a>
                            <a className="inline-flex items-center justify-center px-6 py-2 rounded-full bg-purple-600 text-white font-bold text-sm shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 hover:bg-purple-700" href="/auth/signup">
                                Signup Now
                                <svg className="ml-2 w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                                    <path d="M5 12h14M12 5l7 7-7 7"></path>
                                </svg>
                            </a>
                        </div>
                        
                    </div>
                    <div className="relative">
                        <div className="relative bg-transparent rounded-2xl border border-slate-600/20 backdrop-blur-sm overflow-hidden">
                            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-600/20 transform -translate-x-0.5"></div>
                            <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-600/20 transform -translate-y-0.5"></div>
                            <div className="grid grid-cols-2 grid-rows-2">
                                <div className="p-8 flex flex-col items-center justify-center text-center bg-linear-to-br from-slate-600/5 to-slate-500/3 hover:from-slate-600/8 hover:to-slate-500/5 transition-all duration-300 group">
                                    <div className="w-12 h-12 flex items-center justify-center mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="tabler-icon tabler-icon-calendar-event w-10 h-10 text-slate-400 group-hover:text-slate-300 transition-colors">
                                            <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12"></path>
                                            <path d="M16 3l0 4"></path>
                                            <path d="M8 3l0 4"></path>
                                            <path d="M4 11l16 0"></path>
                                            <path d="M8 15h2v2h-2l0 -2"></path>
                                        </svg>
                                    </div>
                                    <div className="text-3xl font-bold text-white mb-2">
                                        <span>0</span>
                                        +
                                    </div>
                                    <div className="text-slate-400 font-medium text-sm">Total Events</div>
                                </div>
                                <div className="p-8 flex flex-col items-center justify-center text-center bg-linear-to-br from-slate-600/5 to-slate-500/3 hover:from-slate-600/8 hover:to-slate-500/5 transition-all duration-300 group">
                                    <div className="w-12 h-12 flex items-center justify-center mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="tabler-icon tabler-icon-circle-check w-10 h-10 text-slate-400 group-hover:text-slate-300 transition-colors">
                                            <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"></path>
                                            <path d="M9 12l2 2l4 -4"></path>
                                        </svg>
                                    </div>
                                    <div className="text-3xl font-bold text-white mb-2">
                                        <span>0</span>
                                        +
                                    </div>
                                    <div className="text-slate-400 font-medium text-sm">Total Elections</div>
                                </div>
                                <div className="p-8 flex flex-col items-center justify-center text-center bg-linear-to-br from-slate-600/5 to-slate-500/3 hover:from-slate-600/8 hover:to-slate-500/5 transition-all duration-300 group">
                                    <div className="w-12 h-12 flex items-center justify-center mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="tabler-icon tabler-icon-trending-up-3 w-10 h-10 text-slate-400 group-hover:text-slate-300 transition-colors">
                                            <path d="M18 5l3 3l-3 3"></path>
                                            <path d="M3 18h2.397a5 5 0 0 0 4.096 -2.133l4.014 -5.734a5 5 0 0 1 4.096 -2.133h3.397"></path>
                                        </svg>
                                    </div>
                                    <div className="text-3xl font-bold text-white mb-2">
                                        <span>0</span>
                                        +
                                    </div>
                                    <div className="text-slate-400 font-medium text-sm">Transactions</div>
                                </div>
                                <div className="p-8 flex flex-col items-center justify-center text-center bg-linear-to-br from-slate-600/5 to-slate-500/3 hover:from-slate-600/8 hover:to-slate-500/5 transition-all duration-300 group">
                                    <div className="w-12 h-12 flex items-center justify-center mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="tabler-icon tabler-icon-users w-10 h-10 text-slate-400 group-hover:text-slate-300 transition-colors">
                                            <path d="M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"></path>
                                            <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"></path>
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                            <path d="M21 21v-2a4 4 0 0 0 -3 -3.85"></path>
                                        </svg>
                                    </div>
                                    <div className="text-3xl font-bold text-white mb-2">
                                        <span>0</span>
                                        +
                                    </div>
                                    <div className="text-slate-400 font-medium text-sm">Organizations</div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-600/3 via-slate-500/3 to-slate-600/3 rounded-2xl blur-2xl -z-10"></div>
                    </div>
                </div>
            </section>
            <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pb-24">
                <h2 className="text-3xl font-extrabold mb-10 text-white text-left">Everything you need to run successful voting events</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                    <div className="rounded-3xl bg-[#6d28d9]/30 p-10 flex flex-col items-center justify-center gap-4 shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="tabler-icon tabler-icon-thumb-up w-12 h-12 text-purple-400">
                            <path d="M7 11v8a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1h3a4 4 0 0 0 4 -4v-1a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1 -2 2h-7a3 3 0 0 1 -3 -3"></path>
                        </svg>
                        <span className="text-xl font-bold text-white text-center">secure voting</span>
                    </div>
                    <div className="rounded-3xl bg-[#f59e42]/20 p-10 flex flex-col items-center justify-center gap-4 shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="tabler-icon tabler-icon-chart-line w-12 h-12 text-orange-400">
                            <path d="M4 19l16 0"></path>
                            <path d="M4 15l4 -6l4 2l4 -5l4 4"></path>
                        </svg>
                        <span className="text-xl font-bold text-white text-center">real-time results</span>
                    </div>
                    <div className="rounded-3xl bg-[#f59e42]/20 p-10 flex flex-col items-center justify-center gap-4 shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="tabler-icon tabler-icon-users w-12 h-12 text-orange-400">
                            <path d="M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"></path>
                            <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            <path d="M21 21v-2a4 4 0 0 0 -3 -3.85"></path>
                        </svg>
                        <span className="text-xl font-bold text-white text-center">nominee management</span>
                    </div>
                    <div className="rounded-3xl bg-[#6d28d9]/30 p-10 flex flex-col items-center justify-center gap-4 shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="tabler-icon tabler-icon-building w-12 h-12 text-purple-400">
                            <path d="M3 21l18 0"></path>
                            <path d="M9 8l1 0"></path>
                            <path d="M9 12l1 0"></path>
                            <path d="M9 16l1 0"></path>
                            <path d="M14 8l1 0"></path>
                            <path d="M14 12l1 0"></path>
                            <path d="M14 16l1 0"></path>
                            <path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16"></path>
                        </svg>
                        <span className="text-xl font-bold text-white text-center">category organization</span>
                    </div>
                    <div className="rounded-3xl bg-[#6d28d9]/30 p-10 flex flex-col items-center justify-center gap-4 shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="tabler-icon tabler-icon-credit-card w-12 h-12 text-purple-400">
                            <path d="M3 8a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3l0 -8"></path>
                            <path d="M3 10l18 0"></path>
                            <path d="M7 15l.01 0"></path>
                            <path d="M11 15l2 0"></path>
                        </svg>
                        <span className="text-xl font-bold text-white text-center">payment integration</span>
                    </div>
                    <div className="rounded-3xl bg-[#f59e42]/20 p-10 flex flex-col items-center justify-center gap-4 shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="tabler-icon tabler-icon-chart-bar w-12 h-12 text-orange-400">
                            <path d="M3 13a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -6"></path>
                            <path d="M15 9a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -10"></path>
                            <path d="M9 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -14"></path>
                            <path d="M4 20h14"></path>
                        </svg>
                        <span className="text-xl font-bold text-white text-center">detailed analytics</span>
                    </div>
                    <div className="rounded-3xl bg-[#6d28d9]/30 p-10 flex flex-col items-center justify-center gap-4 shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="tabler-icon tabler-icon-device-mobile w-12 h-12 text-purple-400">
                            <path d="M6 5a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2v-14"></path>
                            <path d="M11 4h2"></path>
                            <path d="M12 17v.01"></path>
                        </svg>
                        <span className="text-xl font-bold text-white text-center">mobile-first design</span>
                    </div>
                    <div className="rounded-3xl bg-[#6d28d9]/30 p-10 flex flex-col items-center justify-center gap-4 shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="tabler-icon tabler-icon-shield w-12 h-12 text-purple-400">
                            <path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3"></path>
                        </svg>
                        <span className="text-xl font-bold text-white text-center">admin controls</span>
                    </div>
                    <div className="rounded-3xl bg-[#f59e42]/20 p-10 flex flex-col items-center justify-center gap-4 shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="tabler-icon tabler-icon-ticket w-12 h-12 text-orange-400">
                            <path d="M15 5l0 2"></path>
                            <path d="M15 11l0 2"></path>
                            <path d="M15 17l0 2"></path>
                            <path d="M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-3a2 2 0 0 0 0 -4v-3a2 2 0 0 1 2 -2"></path>
                        </svg>
                        <span className="text-xl font-bold text-white text-center">event management</span>
                    </div>
                </div>
            </section>
            <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pb-24">
                <h2 className="text-3xl font-extrabold mb-10 text-white text-left">We offer the best features for your voting events</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="rounded-3xl bg-[#f59e42]/20 p-10 flex flex-col gap-3 shadow-md">
                        <h3 className="text-xl font-extrabold text-white mb-2">Secure &amp;transparent</h3>
                        <p className="text-base text-zinc-200">Built-in security features ensure voting integrity with payment verification, anti-fraud measures, and transparent result tracking. Every vote counts.</p>
                    </div>
                    <div className="rounded-3xl bg-[#6d28d9]/30 p-10 flex flex-col gap-3 shadow-md">
                        <h3 className="text-xl font-extrabold text-white mb-2">Flexible &amp;scalable</h3>
                        <p className="text-base text-zinc-200">From small team awards to large-scale competitions. Support for multiple categories, unlimited nominees, and concurrent voting events.</p>
                    </div>
                    <div className="rounded-3xl bg-[#a78bfa]/20 p-10 flex flex-col gap-3 shadow-md">
                        <h3 className="text-xl font-extrabold text-white mb-2">Intuitive &amp;powerful</h3>
                        <p className="text-base text-zinc-200">Clean interface for voters, comprehensive admin dashboard for organizers. Real-time analytics and automated payment processing make management effortless.</p>
                    </div>
                </div>
            </section>
            <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pb-24">
                <h2 className="text-3xl font-extrabold mb-10 text-white text-left">Trusted by Leading Institutions</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="rounded-3xl bg-slate-600/10 p-10 flex flex-col items-center justify-center gap-4 shadow-md">
                        <div className="w-28 h-28 bg-white rounded-2xl flex items-center justify-center p-4">
                            <img src="/ucc-logo1.png" alt="University of Cape Coast Logo" className="w-full h-full object-contain"/>
                        </div>
                        <h3 className="text-xl font-extrabold text-white text-center">UCC</h3>
                    </div>
                    <div className="rounded-3xl bg-slate-600/10 p-10 flex flex-col items-center justify-center gap-4 shadow-md">
                        <div className="w-28 h-28 bg-white rounded-2xl flex items-center justify-center p-4">
                            <img src="/esiama-logo.png" alt="University of Cape Coast Logo" className="w-full h-full object-contain"/>
                        </div>
                        <h3 className="text-xl font-extrabold text-white text-center">NMTC - Esiama</h3>
                    </div>
                </div>
            </section>
        </main>
    </div>
    </main>
    </div>
  )
}
