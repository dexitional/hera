import { createFileRoute, useParams } from '@tanstack/react-router'
import { Dialog, DialogTrigger } from "#/components/ui/dialog";
import PayMode from '#/components/PayMode';
import { modalPage } from '#/lib/utils';

export const Route = createFileRoute(
  '/events/$eventId/categories/$categoryId/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { eventId } = useParams({ from: '/events/$eventId/categories/$categoryId/' })

  return (
    <div className="min-h-screen bg-[#18181b] text-white antialiased font-sans">
    <Dialog
      onOpenChange={(open) => {
        if (!open) modalPage.setState(() => ({ size: 'lg', page: 'card' }))
      }}
    >
      <main className="w-full">
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pt-6 sm:pt-6 pb-8">
          <div className="mb-6 sm:mb-4" style={{ opacity: 1, transform: "none" }}>
            <a
              className="p-3 rounded-2xl bg-slate-600/10 hover:bg-slate-600/20 transition-colors border border-slate-600/20 hover:border-slate-600/40 inline-flex"
              href={`/events/${eventId}/categories`}
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
                className="tabler-icon tabler-icon-arrow-left w-5 h-5 text-purple-400"
              >
                <path d="M5 12l14 0"></path>
                <path d="M5 12l6 6"></path>
                <path d="M5 12l6 -6"></path>
              </svg>
            </a>
          </div>
          <div
            className="flex flex-col sm:flex-row items-start gap-4"
            style={{ opacity: 1, transform: "none" }}
          >
            <div className="flex-1">
              <h1
                className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-2 leading-tight"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Stylish Student Host/Presenter of the Year
              </h1>
              <p className="text-base text-zinc-400 mb-4 max-w-3xl">
                An event host/presenter with perfect outfit choices.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 text-sm text-zinc-400">
                <div className="flex flex-row sm:flex-row items-center sm:items-center gap-3 sm:gap-4">
                  <span className="flex items-center gap-2">
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
                      className="tabler-icon tabler-icon-users w-4 h-4"
                    >
                      <path d="M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"></path>
                      <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      <path d="M21 21v-2a4 4 0 0 0 -3 -3.85"></path>
                    </svg>
                    0 Nominees
                  </span>
                  <div
                    className="flex items-center gap-2 bg-slate-600/20 px-3 py-1.5 rounded-full backdrop-blur-sm"
                    style={{ opacity: 1, transform: "none" }}
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
                      className="tabler-icon tabler-icon-clock w-4 h-4 text-purple-400"
                    >
                      <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"></path>
                      <path d="M12 7v5l3 3"></path>
                    </svg>
                    <span
                      className="text-sm font-medium text-white"
                      style={{ opacity: 1, transform: "none" }}
                    >
                      0 days left
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* No Nominee */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" style={{ opacity: 1, transform: "none" }}>
            <div
              className="col-span-full flex flex-col items-center justify-center py-16 text-center"
              style={{ opacity: 1, transform: "none" }}
            >
              <div className="rounded-3xl bg-slate-600/10 p-8 flex flex-col items-center justify-center gap-4">
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
                  className="tabler-icon tabler-icon-users w-12 h-12 text-slate-400"
                >
                  <path d="M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"></path>
                  <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  <path d="M21 21v-2a4 4 0 0 0 -3 -3.85"></path>
                </svg>
                <h3 className="text-xl font-bold text-white">No Nominees Yet</h3>
                <p className="text-zinc-400 text-sm">
                  There are no nominees in this category at the moment.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Nominees */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pb-24">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" style={{ opacity: 1, transform: "none" }}>
            {/* Nominee 1 */}
            <div className="rounded-3xl bg-slate-600/10 backdrop-blur-sm border border-slate-600/20 overflow-hidden hover:border-slate-600/40 transition-all duration-300 group shadow-lg relative" style={{ opacity: 1, transform: "none" }}>
                <div className="relative h-72 w-full">
                <div className="relative w-full h-full">
                    <img
                        alt="Patrick Annan and Vanessa Ekua Dadzie "
                        loading="eager"
                        decoding="async"
                        className="w-full h-full object-cover object-[center_20%] transition-opacity duration-300 opacity-100"
                        src="https://res.cloudinary.com/dm4pbkgma/image/upload/v1752445363/nominees/nominee_686cb3bceda17b88db7e1368.jpg"
                    />
                </div>
                <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent"></div>
                </div>
                <div className="p-6">
                <div className="mb-4">
                    <div className="flex flex-wrap items-baseline gap-2 mb-2">
                    <h2 className="text-xl font-extrabold text-white group-hover:text-purple-400 transition-colors flex-1 min-w-0">
                        Patrick Annan and Vanessa Ekua Dadzie{" "}
                    </h2>
                    </div>
                    <p className="text-sm text-zinc-300 line-clamp-2">The Best 🎁 Gift you can ever get is a Good Friend.</p>
                </div>
                <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-qrcode w-4 h-4 text-purple-400">
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
                    <span>Code: 1585</span>
                    </div>
                    <a
                    className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    href="/nominee/1585"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-link w-4 h-4">
                        <path d="M9 15l6 -6"></path>
                        <path d="M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464"></path>
                        <path d="M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463"></path>
                    </svg>
                    <span>View Profile</span>
                    </a>
                </div>
                <div className="flex gap-3">
                    <DialogTrigger asChild>
                        <button onClick={() => modalPage.setState(() => { return ({ size:'lg', page: 'card' })} )} className="flex-1 px-4 py-3 bg-linear-to-r from-[#6d28d9] to-purple-600 text-white rounded-2xl hover:from-[#6d28d9]/90 hover:to-purple-600/90 transition-all duration-300 flex items-center justify-center gap-2 group text-sm font-bold shadow-lg">
                          Vote Now
                        </button>
                    </DialogTrigger>
                    <DialogTrigger asChild>
                        <button onClick={() => modalPage.setState(() => { return ({ size:'xl', page: 'profile' })} )} className="px-4 py-3 bg-slate-600/20 hover:bg-slate-600/30 text-white rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 group text-sm font-medium border border-slate-600/30">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-photo w-4 h-4">
                                <path d="M15 8h.01"></path>
                                <path d="M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12"></path>
                                <path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5"></path>
                                <path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3"></path>
                            </svg>
                        </button>
                    </DialogTrigger>
                </div>
                </div>
            </div>
            </div>
        </section>
       <PayMode />
      </main>
      </Dialog>
    </div>
  )
}
