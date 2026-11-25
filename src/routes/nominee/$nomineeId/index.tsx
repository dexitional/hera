import PayMode from '#/components/PayMode'
import ShareMenu from '#/components/ShareMenu'
import { Dialog, DialogTrigger } from '#/components/ui/dialog'
import { modalPage, useModalPageState, type ModalNominee } from '#/lib/utils'
import { getPublicContestantFn } from '#/server/tenant-events'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Award, ArrowLeft, Clapperboard, Download, Image as ImageIcon, QrCode, ThumbsUp, User } from 'lucide-react'
import { MediaPlayer } from '#/components/media/MediaEmbed'

const nomineeQueryOptions = (nomineeId: any) => ({
  queryKey: ["nominee-page", nomineeId],
  queryFn: () => getPublicContestantFn({ data: nomineeId } as any),
});

export const Route = createFileRoute('/nominee/$nomineeId/')({
  component: RouteComponent,
  loader: async ({ context, params }: any) => {
    const nomineeId = params.nomineeId;
    return await context.queryClient.ensureQueryData(nomineeQueryOptions(nomineeId));
  },
})

function RouteComponent() {
  const { nomineeId } = Route.useParams();
  const { data: nominee }: any = useSuspenseQuery(nomineeQueryOptions(nomineeId));
  const modal = useModalPageState();
  const openVoteModal = () => {
    const nomineeContext: ModalNominee = {
      id: nominee.id,
      name: nominee.name,
      tagline: nominee.tagline,
      imageUrl: nominee.imageUrl,
      code: nominee.code,
      categoryId: nominee.category.id,
      categoryName: nominee.category.name,
      eventId: nominee.event.id,
      eventTitle: nominee.event.title,
      unitPrice: nominee.event.unitPrice,
    };
    modalPage.setState(() => ({ size: 'lg', page: 'card', open: true, nominee: nomineeContext }));
  };

  return (
    <div className="min-h-screen bg-black text-white">
    <Dialog
      open={modal.open}
      onOpenChange={(open) => {
        modalPage.setState((prev) => ({ ...prev, open, ...(!open ? { size: 'lg', page: 'card' } : {}) }))
      }}
    >
      <main className="pt-8 sm:pt-12 lg:pt-16 pb-20 md:pb-0 max-sm:pt-0!">
        <div className="min-h-screen bg-[#18181b] text-white antialiased font-sans -mt-16 max-sm:mt-0!">
          <main className="w-full">
            <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pt-6 sm:pt-10 lg:pt-14 pb-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <Link
                      className="p-3 rounded-2xl bg-slate-600/10 hover:bg-slate-600/20 transition-colors border border-slate-600/20 hover:border-slate-600/40"
                      to="/events/$eventId/categories/$categoryId"
                      params={{ eventId: String(nominee.event.id), categoryId: String(nominee.category.id) }}
                    >
                      <ArrowLeft className="w-5 h-5 text-zinc-400" />
                    </Link>
                    <div className="hidden sm:block">
                      <h1
                        className="text-xl sm:text-2xl lg:text-3xl font-extrabold break-words text-left"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        {nominee.name}
                      </h1>
                    </div>
                  </div>
                  <div className="flex-1 sm:hidden">
                    <h1
                      className="text-xl sm:text-2xl lg:text-3xl font-extrabold break-words text-left"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {nominee.name}
                    </h1>
                    {nominee.tagline && (
                      <p className="text-sm sm:text-base text-zinc-300 mt-1 break-words text-left">
                        {nominee.tagline}
                      </p>
                    )}
                  </div>
                  {nominee.tagline && (
                    <div className="hidden sm:block flex-1">
                      <p className="text-sm sm:text-base text-zinc-300 mt-1 break-words text-left">
                        {nominee.tagline}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-zinc-400">
                  <div className="flex items-center gap-2 bg-slate-600/10 px-3 py-1.5 rounded-full">
                    <QrCode className="w-4 h-4 text-purple-400" />
                    <span>Code: {nominee.code}</span>
                  </div>
                  <ShareMenu
                    title={nominee.name}
                    text={`Vote for ${nominee.name} in ${nominee.category.name}!`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="relative rounded-3xl overflow-hidden animate-in fade-in slide-in-from-left-4 duration-500 delay-100 fill-mode-both">
                  <div className="relative w-full bg-slate-800/40 min-h-[320px] flex items-center justify-center">
                    {nominee.imageUrl ? (
                      <>
                        <img
                          alt={nominee.name}
                          decoding="async"
                          className="w-full h-auto rounded-3xl"
                          src={nominee.imageUrl}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      </>
                    ) : (
                      <User className="w-24 h-24 text-zinc-600" />
                    )}
                  </div>
                </div>
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 delay-200 fill-mode-both">
                  <div className="bg-slate-600/10 backdrop-blur-sm border border-slate-600/20 rounded-3xl p-6">
                    <h2 className="text-xl font-extrabold mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
                      Category &amp; Event
                    </h2>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                          <Award className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm text-zinc-400">Category</p>
                          <p className="font-medium">{nominee.category.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="w-6 h-6 text-orange-400" />
                        </div>
                        <div>
                          <p className="text-sm text-zinc-400">Event</p>
                          <p className="font-medium">{nominee.event.title}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* The whole card opens the vote modal (the button remains the
                      keyboard/screen-reader control). */}
                  <div
                    onClick={openVoteModal}
                    className="rounded-3xl p-10 flex flex-col gap-4 shadow-md transition-all duration-300 group bg-[#6d28d9]/8 cursor-pointer hover:bg-[#6d28d9]/15 ring-1 ring-transparent hover:ring-purple-400/40"
                  >
                    <div className="flex items-center justify-between">
                      <ThumbsUp className="w-8 h-8 text-purple-300" />
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
                        Support {nominee.name} in {nominee.category.name}
                      </p>
                      {nominee.event.unitPrice != null && (
                        <p className="text-sm text-zinc-300">
                          Vote Price:{" "}
                          <span className="text-white font-bold">₵{Number(nominee.event.unitPrice).toFixed(2)}</span>
                        </p>
                      )}
                    </div>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        onClick={openVoteModal}
                        className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 group/button text-sm font-bold border border-purple-400/40 shadow-lg shadow-purple-900/40 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
                      >
                        <ThumbsUp className="w-4 h-4 group-hover/button:translate-x-1 transition-transform" />
                        Vote Now
                      </button>
                    </DialogTrigger>
                  </div>
                </div>
              </div>

              {/* Campaign media (optional): intro video and flyer */}
              {(nominee.introVideoUrl || nominee.flyerUrl) && (
                <div className={`grid grid-cols-1 gap-8 ${nominee.introVideoUrl && nominee.flyerUrl ? 'lg:grid-cols-2' : ''}`}>
                  {nominee.introVideoUrl && (
                    <div id="intro-video" className="scroll-mt-24 bg-slate-600/10 border border-slate-600/20 rounded-3xl p-5 sm:p-6 space-y-4">
                      <h2 className="text-xl font-extrabold flex items-center gap-2" style={{ fontFamily: "Inter, sans-serif" }}>
                        <Clapperboard className="w-5 h-5 text-purple-400" /> Meet {nominee.name.split(' ')[0]}
                      </h2>
                      <div className="flex justify-center">
                        <MediaPlayer url={nominee.introVideoUrl} maxWidth={640} />
                      </div>
                    </div>
                  )}
                  {nominee.flyerUrl && (
                    <div id="flyer" className="scroll-mt-24 bg-slate-600/10 border border-slate-600/20 rounded-3xl p-5 sm:p-6 space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="text-xl font-extrabold flex items-center gap-2" style={{ fontFamily: "Inter, sans-serif" }}>
                          <ImageIcon className="w-5 h-5 text-purple-400" /> Campaign flyer
                        </h2>
                        <a href={nominee.flyerUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-slate-600/20 px-3 py-1.5 text-xs text-zinc-200 hover:bg-slate-600/30">
                          <Download className="w-3.5 h-3.5" /> Open
                        </a>
                      </div>
                      <a href={nominee.flyerUrl} target="_blank" rel="noopener noreferrer" className="block">
                        <img src={nominee.flyerUrl} alt={`${nominee.name} campaign flyer`} loading="lazy" className="mx-auto max-h-[640px] w-auto rounded-2xl" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </section>
          </main>
        </div>
        <PayMode />
      </main>
      </Dialog>
    </div>
  )
}
