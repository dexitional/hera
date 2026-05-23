import PayMode from '#/components/PayMode'
import { Dialog, DialogTrigger } from '#/components/ui/dialog'
import { modalPage } from '#/lib/utils'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/nominee/$nomineeId/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="min-h-screen bg-black text-white">
    <Dialog
      onOpenChange={(open) => {
        if (!open) modalPage.setState(() => ({ size: 'lg', page: 'card' }))
      }}
    >
      <main className="pt-8 sm:pt-12 lg:pt-16 pb-20 md:pb-0">
        <div className="min-h-screen bg-[#18181b] text-white antialiased font-sans -mt-16">
          <main className="w-full">
            <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pt-6 sm:pt-10 lg:pt-14 pb-8">
              <div className="mb-6" style={{ opacity: 1, transform: "none" }}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <a
                      className="p-3 rounded-2xl bg-slate-600/10 hover:bg-slate-600/20 transition-colors border border-slate-600/20 hover:border-slate-600/40"
                      href="/"
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
                        className="tabler-icon tabler-icon-arrow-left w-5 h-5 text-zinc-400"
                      >
                        <path d="M5 12l14 0"></path>
                        <path d="M5 12l6 6"></path>
                        <path d="M5 12l6 -6"></path>
                      </svg>
                    </a>
                    <div className="hidden sm:block">
                      <h1
                        className="text-2xl sm:text-3xl lg:text-4xl font-extrabold break-words text-left"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        Micheal, Perpetual, Stephanie{" "}
                      </h1>
                    </div>
                  </div>
                  <div className="flex-1 sm:hidden">
                    <h1
                      className="text-2xl sm:text-3xl lg:text-4xl font-extrabold break-words text-left"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      Micheal, Perpetual, Stephanie{" "}
                    </h1>
                    <p className="text-sm sm:text-base text-zinc-300 mt-1 break-words text-left">
                      Hardworking{" "}
                    </p>
                  </div>
                  <div className="hidden sm:block flex-1">
                    <p className="text-sm sm:text-base text-zinc-300 mt-1 break-words text-left">
                      Hardworking{" "}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-zinc-400">
                  <div className="flex items-center gap-2 bg-slate-600/10 px-3 py-1.5 rounded-full">
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
                      className="tabler-icon tabler-icon-qrcode w-4 h-4 text-purple-400"
                    >
                      <path d="M4 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4"></path>
                      <path d="M7 17l0 .01"></path>
                      <path d="M14 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4"></path>
                      <path d="M7 7l0 .01"></path>
                      <path d="M4 15a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4"></path>
                      <path d="M17 7l0 .01"></path>
                      <path d="M14 14l3 0"></path>
                      <path d="M20 14l0 .01"></path>
                      <path d="M14 14l0 3"></path>
                      <path d="M14 20l3 0"></path>
                      <path d="M17 17l3 0"></path>
                      <path d="M20 17l0 3"></path>
                    </svg>
                    <span>Code: 7134</span>
                  </div>
                  <button className="flex items-center gap-2 bg-slate-600/10 px-3 py-1.5 rounded-full hover:bg-slate-600/20 transition-colors">
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
                      className="tabler-icon tabler-icon-share w-4 h-4 text-purple-400"
                    >
                      <path d="M3 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"></path>
                      <path d="M15 6a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"></path>
                      <path d="M15 18a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"></path>
                      <path d="M8.7 10.7l6.6 -3.4"></path>
                      <path d="M8.7 13.3l6.6 3.4"></path>
                    </svg>
                    <span>Share</span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" style={{ opacity: 1, transform: "none" }}>
                <div className="relative rounded-3xl overflow-hidden">
                  <div className="relative w-full">
                    <img
                      alt="Micheal, Perpetual, Stephanie "
                      width={800}
                      height={1200}
                      decoding="async"
                      data-nimg="1"
                      className="w-full h-auto rounded-3xl"
                      src="https://res.cloudinary.com/dm4pbkgma/image/upload/v1752445213/nominees/nominee_686b20ff45dbd1ceb5891ee4.jpg"
                      style={{ color: "transparent" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="bg-slate-600/10 backdrop-blur-sm border border-slate-600/20 rounded-3xl p-6">
                    <h2 className="text-xl font-extrabold mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
                      Category &amp; Event
                    </h2>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
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
                            className="tabler-icon tabler-icon-award w-6 h-6 text-purple-400"
                          >
                            <path d="M6 9a6 6 0 1 0 12 0a6 6 0 1 0 -12 0"></path>
                            <path d="M12 15l3.4 5.89l1.598 -3.233l3.598 .232l-3.4 -5.889"></path>
                            <path d="M6.802 12l-3.4 5.89l3.598 -.233l1.598 3.232l3.4 -5.889"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-zinc-400">Category</p>
                          <p className="font-medium">Best Pals of the Year</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
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
                            className="tabler-icon tabler-icon-photo w-6 h-6 text-orange-400"
                          >
                            <path d="M15 8h.01"></path>
                            <path d="M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12"></path>
                            <path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5"></path>
                            <path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-zinc-400">Event</p>
                          <p className="font-medium">CENA DE LAS ESTRELLAS (MOBBSAG UCC DINNER &amp; AWARDS '25)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-3xl p-10 flex flex-col gap-4 shadow-md transition-all duration-300 group bg-[#6d28d9]/8">
                    <div className="flex items-center justify-between">
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
                        className="tabler-icon tabler-icon-thumb-up w-8 h-8 text-purple-300"
                      >
                        <path d="M7 11v8a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1h3a4 4 0 0 0 4 -4v-1a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1 -2 2h-7a3 3 0 0 1 -3 -3"></path>
                      </svg>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500 text-white">
                        Active
                      </span>
                    </div>
                    <div className="flex-1">
                      <h2
                        className="text-xl font-extrabold mb-2 group-hover:text-purple-200 transition-colors"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        Vote Now
                      </h2>
                      <p className="text-sm text-zinc-300 mb-4">
                        Support Micheal, Perpetual, Stephanie  in Best Pals of the Year
                      </p>
                      <p className="text-sm text-zinc-300">
                        Vote Price:{" "}
                        <span className="text-white font-bold">GH₵0.5</span>
                      </p>
                    </div>
                    <DialogTrigger asChild>
                    <button onClick={() => modalPage.setState(() => { return ({ size:'lg', page: 'card' })} )} className="w-full px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-white rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 group/button text-sm font-bold border border-purple-400/30 hover:border-purple-400/50">
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
                        className="tabler-icon tabler-icon-thumb-up w-4 h-4 group-hover/button:translate-x-1 transition-transform"
                      >
                        <path d="M7 11v8a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1h3a4 4 0 0 0 4 -4v-1a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1 -2 2h-7a3 3 0 0 1 -3 -3"></path>
                      </svg>
                      Vote Now
                    </button>
                    </DialogTrigger>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
        <PayMode />
      </main>
      </Dialog>
    </div>
  )
}
