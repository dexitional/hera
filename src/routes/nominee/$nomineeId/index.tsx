import { useState } from 'react'
import PayMode from '#/components/PayMode'
import { Dialog, DialogTrigger } from '#/components/ui/dialog'
import { modalPage, useModalPageState, type ModalNominee } from '#/lib/utils'
import { getPublicContestantFn } from '#/server/tenant-events'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Award, ArrowLeft, Check, Image as ImageIcon, QrCode, Share2, ThumbsUp, User } from 'lucide-react'

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
  const [shareCopied, setShareCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareData = {
      title: nominee.name,
      text: `Vote for ${nominee.name} in ${nominee.category.name}!`,
      url: shareUrl,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled the native share sheet -- nothing to do.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // Clipboard access blocked -- nothing more we can do.
    }
  };

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
      <main className="pt-8 sm:pt-12 lg:pt-16 pb-20 md:pb-0">
        <div className="min-h-screen bg-[#18181b] text-white antialiased font-sans -mt-16">
          <main className="w-full">
            <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pt-6 sm:pt-10 lg:pt-14 pb-8">
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
                        className="text-2xl sm:text-3xl lg:text-4xl font-extrabold break-words text-left"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        {nominee.name}
                      </h1>
                    </div>
                  </div>
                  <div className="flex-1 sm:hidden">
                    <h1
                      className="text-2xl sm:text-3xl lg:text-4xl font-extrabold break-words text-left"
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
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 bg-slate-600/10 px-3 py-1.5 rounded-full hover:bg-slate-600/20 transition-colors"
                  >
                    {shareCopied ? (
                      <>
                        <Check className="w-4 h-4 text-green-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 text-purple-400" />
                        <span>Share</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="relative rounded-3xl overflow-hidden">
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
                <div className="space-y-6">
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
                  <div className="rounded-3xl p-10 flex flex-col gap-4 shadow-md transition-all duration-300 group bg-[#6d28d9]/8">
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
                        onClick={openVoteModal}
                        className="w-full px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-white rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 group/button text-sm font-bold border border-purple-400/30 hover:border-purple-400/50"
                      >
                        <ThumbsUp className="w-4 h-4 group-hover/button:translate-x-1 transition-transform" />
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
