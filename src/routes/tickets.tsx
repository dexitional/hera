import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/tickets')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="min-h-screen bg-[#18181b] text-white antialiased font-sans">
      <main className="w-full">
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pt-6 sm:pt-10 lg:pt-14 pb-16">
          <div className="text-left" style={{ opacity: 1, transform: 'none' }}>
            <h1
              className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Event Tickets
            </h1>
            <p className="text-lg md:text-xl text-zinc-300 max-w-2xl">
              Get tickets for exciting events. Secure your spot and be part of amazing experiences.
            </p>
          </div>
        </section>
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pb-8">
          <div className="flex flex-col md:flex-row gap-4" style={{ opacity: 1, transform: 'none' }}>
            <div className="relative flex-1">
              <input
                placeholder="Search events..."
                className="w-full px-4 py-3.5 bg-slate-600/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400 pl-12 border border-slate-600/30 text-sm backdrop-blur-sm text-white placeholder-zinc-400"
                type="text"
                value=""
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="tabler-icon tabler-icon-search absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5"
              >
                <path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"></path>
                <path d="M21 21l-6 -6"></path>
              </svg>
            </div>
            <div className="flex gap-2">
              <div className="relative" data-dropdown="true">
                <button
                  className="flex items-center gap-3 px-6 py-3.5 bg-[#18181b] border border-slate-600/30 rounded-2xl text-sm font-medium text-white hover:bg-slate-800/50 hover:border-slate-500/50 transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-slate-500/25 focus:outline-none focus:ring-2 focus:ring-purple-400 min-w-[160px]"
                  tabIndex={0}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="tabler-icon tabler-icon-calendar-time w-4 h-4 text-purple-400"
                  >
                    <path d="M11.795 21h-6.795a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v4"></path>
                    <path d="M14 18a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"></path>
                    <path d="M15 3v4"></path>
                    <path d="M7 3v4"></path>
                    <path d="M3 11h16"></path>
                    <path d="M18 16.496v1.504l1 1"></path>
                  </svg>
                  <span className="flex-1 text-left">Active Events</span>
                  <div style={{ transform: 'none' }}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="tabler-icon tabler-icon-chevron-down w-4 h-4 text-purple-400"
                    >
                      <path d="M6 9l6 6l6 -6"></path>
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" style={{ opacity: 1, transform: 'none' }}>
            <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center" style={{ opacity: 1, transform: 'none' }}>
              <div className="w-20 h-20 bg-slate-600/10 rounded-3xl flex items-center justify-center mb-6 border border-slate-600/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="tabler-icon tabler-icon-ticket w-10 h-10 text-slate-400"
                >
                  <path d="M15 5l0 2"></path>
                  <path d="M15 11l0 2"></path>
                  <path d="M15 17l0 2"></path>
                  <path d="M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-3a2 2 0 0 0 0 -4v-3a2 2 0 0 1 2 -2"></path>
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-white mb-2">No Ticketed Events Found</h3>
              <p className="text-zinc-300 max-w-md">
                There are no ticketed events available at the moment. Check back later for new events with tickets.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
