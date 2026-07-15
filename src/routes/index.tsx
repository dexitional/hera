import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import Typewriter from 'typewriter-effect';
import { getHomepageStatsFn } from '#/server/homepage-stats';

const homepageStatsQueryOptions = () => ({
  queryKey: ['homepage-stats'],
  queryFn: () => getHomepageStatsFn(),
  refetchInterval: 30 * 1000,
  staleTime: 30 * 1000,
  refetchIntervalInBackground: true,
});

export const Route = createFileRoute('/')({
  component: App,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(homepageStatsQueryOptions());
  },
})

function App() {
  const { data: stats }: any = useSuspenseQuery(homepageStatsQueryOptions());
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
                                        <span>{stats.totalEvents}</span>
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
                                        <span>{stats.totalElections}</span>
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
                                        <span>{stats.totalTransactions}</span>
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
                                        <span>{stats.totalOrganizations}</span>
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
                    <div className="rounded-3xl bg-[#6d28d9]/30 p-10 flex flex-col items-center justify-center gap-4 shadow-md text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="tabler-icon tabler-icon-thumb-up w-12 h-12 text-purple-400">
                            <path d="M7 11v8a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1h3a4 4 0 0 0 4 -4v-1a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1 -2 2h-7a3 3 0 0 1 -3 -3"></path>
                        </svg>
                        <span className="text-xl font-bold text-white">Secure &amp; Verified Voting</span>
                        <p className="text-sm text-zinc-300">Every vote is signed and receipt-backed, so results stay tamper-proof and auditable.</p>
                    </div>
                    <div className="rounded-3xl bg-[#f59e42]/20 p-10 flex flex-col items-center justify-center gap-4 shadow-md text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="tabler-icon tabler-icon-chart-line w-12 h-12 text-orange-400">
                            <path d="M4 19l16 0"></path>
                            <path d="M4 15l4 -6l4 2l4 -5l4 4"></path>
                        </svg>
                        <span className="text-xl font-bold text-white">Real-Time Results &amp; Analytics</span>
                        <p className="text-sm text-zinc-300">Live leaderboards, tallies and turnout stats update the moment a vote comes in.</p>
                    </div>
                    <div className="rounded-3xl bg-[#f59e42]/20 p-10 flex flex-col items-center justify-center gap-4 shadow-md text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="tabler-icon tabler-icon-building w-12 h-12 text-orange-400">
                            <path d="M3 21l18 0"></path>
                            <path d="M9 8l1 0"></path>
                            <path d="M9 12l1 0"></path>
                            <path d="M9 16l1 0"></path>
                            <path d="M14 8l1 0"></path>
                            <path d="M14 12l1 0"></path>
                            <path d="M14 16l1 0"></path>
                            <path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16"></path>
                        </svg>
                        <span className="text-xl font-bold text-white">Flexible Event Structure</span>
                        <p className="text-sm text-zinc-300">Organize awards into categories and nominees, or elections into positions and candidates.</p>
                    </div>
                    <div className="rounded-3xl bg-[#6d28d9]/30 p-10 flex flex-col items-center justify-center gap-4 shadow-md text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="tabler-icon tabler-icon-credit-card w-12 h-12 text-purple-400">
                            <path d="M3 8a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3l0 -8"></path>
                            <path d="M3 10l18 0"></path>
                            <path d="M7 15l.01 0"></path>
                            <path d="M11 15l2 0"></path>
                        </svg>
                        <span className="text-xl font-bold text-white">Pay &amp; Vote Your Way</span>
                        <p className="text-sm text-zinc-300">Card or mobile money through Paystack, or dial in over USSD from any phone - no app required.</p>
                    </div>
                    <div className="rounded-3xl bg-[#6d28d9]/30 p-10 flex flex-col items-center justify-center gap-4 shadow-md text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="tabler-icon tabler-icon-shield w-12 h-12 text-purple-400">
                            <path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3"></path>
                        </svg>
                        <span className="text-xl font-bold text-white">Admin Controls</span>
                        <p className="text-sm text-zinc-300">Start, pause or lock voting, verify voters, and manage payouts from one dashboard.</p>
                    </div>
                    <div className="rounded-3xl bg-[#f59e42]/20 p-10 flex flex-col items-center justify-center gap-4 shadow-md text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="tabler-icon tabler-icon-ticket w-12 h-12 text-orange-400">
                            <path d="M15 5l0 2"></path>
                            <path d="M15 11l0 2"></path>
                            <path d="M15 17l0 2"></path>
                            <path d="M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-3a2 2 0 0 0 0 -4v-3a2 2 0 0 1 2 -2"></path>
                        </svg>
                        <span className="text-xl font-bold text-white">Event &amp; Ticket Management</span>
                        <p className="text-sm text-zinc-300">Run the full event lifecycle - awards, tickets, and voting - from a single event page.</p>
                    </div>
                </div>
            </section>
            <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pb-24">
                <h2 className="text-3xl font-extrabold mb-2 text-white text-left">One platform, four modules</h2>
                <p className="text-base text-zinc-300 mb-10 text-left max-w-2xl">Everything runs on the same secure, real-time core - pick the module that fits what you're running.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                    <Link to="/elections" className="rounded-3xl bg-[#f59e42]/20 p-8 flex flex-col gap-3 shadow-md hover:bg-[#f59e42]/30 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-orange-400">
                            <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"></path>
                            <path d="M9 12l2 2l4 -4"></path>
                        </svg>
                        <h3 className="text-xl font-extrabold text-white">Elections</h3>
                        <p className="text-sm text-zinc-200">Run organisation and association elections with positions, candidates, verified voter invites, and receipt-signed ballots.</p>
                    </Link>
                    <Link to="/events" className="rounded-3xl bg-[#6d28d9]/30 p-8 flex flex-col gap-3 shadow-md hover:bg-[#6d28d9]/40 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-purple-400">
                            <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12"></path>
                            <path d="M16 3l0 4"></path>
                            <path d="M8 3l0 4"></path>
                            <path d="M4 11l16 0"></path>
                            <path d="M8 15h2v2h-2l0 -2"></path>
                        </svg>
                        <h3 className="text-xl font-extrabold text-white">Events</h3>
                        <p className="text-sm text-zinc-200">Award shows and competitions with categories, nominees, and pay-per-vote via card, mobile money, or USSD.</p>
                    </Link>
                    <Link to="/tickets" className="rounded-3xl bg-[#a78bfa]/20 p-8 flex flex-col gap-3 shadow-md hover:bg-[#a78bfa]/30 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-violet-300">
                            <path d="M15 5l0 2"></path>
                            <path d="M15 11l0 2"></path>
                            <path d="M15 17l0 2"></path>
                            <path d="M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-3a2 2 0 0 0 0 -4v-3a2 2 0 0 1 2 -2"></path>
                        </svg>
                        <h3 className="text-xl font-extrabold text-white">Tickets</h3>
                        <p className="text-sm text-zinc-200">Sell and verify tickets for the same events you're running votes for, all from one dashboard.</p>
                    </Link>
                    <div className="rounded-3xl bg-slate-600/10 p-8 flex flex-col gap-3 shadow-md opacity-70 cursor-not-allowed">
                        <div className="flex items-center justify-between">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-slate-400">
                                <path d="M6 8a6 6 0 1 0 12 0a6 6 0 0 0 -12 0"></path>
                                <path d="M4 21v-2a4 4 0 0 1 4 -4h1"></path>
                                <path d="M17.5 17.5m-3.5 0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0"></path>
                                <path d="M19.5 15.5v2l1.5 1"></path>
                            </svg>
                            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 bg-slate-600/20 px-2 py-1 rounded-full">Upcoming</span>
                        </div>
                        <h3 className="text-xl font-extrabold text-white">Data Bundle</h3>
                        <p className="text-sm text-zinc-300">Buy data bundles straight from the USSD menu, the same way you vote. Coming soon.</p>
                    </div>
                </div>
            </section>
            <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pb-24">
                <h2 className="text-3xl font-extrabold mb-10 text-white text-left">Trusted by Leading Institutions</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="rounded-3xl bg-slate-600/10 p-10 flex flex-col items-center justify-center gap-4 shadow-md">
                        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center p-4">
                            <img src="/ucc-logo1.png" alt="University of Cape Coast Logo" className="w-full h-full object-contain"/>
                        </div>
                        <h3 className="text-xl font-extrabold text-white text-center">UCC</h3>
                    </div>
                    <div className="rounded-3xl bg-slate-600/10 p-10 flex flex-col items-center justify-center gap-4 shadow-md">
                        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center p-4">
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
