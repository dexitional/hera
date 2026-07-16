import { createFileRoute, Link } from '@tanstack/react-router'
import { Dialog, DialogTrigger } from "#/components/ui/dialog";
import PayMode from '#/components/PayMode';
import { modalPage, useModalPageState, type ModalNominee } from '#/lib/utils';
import { getPublicCategoryFn } from "#/server/tenant-events";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, Image as ImageIcon, Link2, ScanQrCode, User, Users } from "lucide-react";
import moment from "moment";

const categoryQueryOptions = (categoryId: any) => ({
  queryKey: ["category-page", categoryId],
  queryFn: () => getPublicCategoryFn({ data: categoryId } as any),
});

export const Route = createFileRoute(
  '/events/$eventId/categories/$categoryId/',
)({
  component: RouteComponent,
  loader: async ({ context, params }: any) => {
    const categoryId = params.categoryId;
    return await context.queryClient.ensureQueryData(categoryQueryOptions(categoryId));
  },
})

function RouteComponent() {
  const { eventId, categoryId } = Route.useParams();
  const { data: category }: any = useSuspenseQuery(categoryQueryOptions(categoryId));
  const modal = useModalPageState();

  const daysLeft = category.event.endAt ? Math.max(moment(category.event.endAt).diff(moment(), "days"), 0) : null;

  const openVoteModal = (contestant: any) => {
    const nominee: ModalNominee = {
      id: contestant.id,
      name: contestant.name,
      tagline: contestant.tagline,
      imageUrl: contestant.imageUrl,
      code: contestant.code,
      categoryId: category.id,
      categoryName: category.name,
      eventId: category.event.id,
      eventTitle: category.event.title,
      unitPrice: category.event.unitPrice,
    };
    modalPage.setState(() => ({ size: 'lg', page: 'card', open: true, nominee }));
  };

  const openProfileModal = (contestant: any) => {
    const nominee: ModalNominee = {
      id: contestant.id,
      name: contestant.name,
      tagline: contestant.tagline,
      imageUrl: contestant.imageUrl,
      code: contestant.code,
      categoryId: category.id,
      categoryName: category.name,
      eventId: category.event.id,
      eventTitle: category.event.title,
      unitPrice: category.event.unitPrice,
    };
    modalPage.setState(() => ({ size: '2xl', page: 'profile', open: true, nominee }));
  };

  return (
    <div className="min-h-screen bg-[#0a192a]/30 text-white antialiased font-sans">
    <Dialog
      open={modal.open}
      onOpenChange={(open) => {
        modalPage.setState((prev) => ({ ...prev, open, ...(!open ? { size: 'lg', page: 'card' } : {}) }))
      }}
    >
      <main className="w-full">
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pt-6 sm:pt-6 pb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="mb-6 sm:mb-4">
            <Link
              className="p-3 rounded-2xl bg-slate-600/10 hover:bg-slate-600/20 transition-colors border border-slate-600/20 hover:border-slate-600/40 inline-flex"
              to="/events/$eventId/categories"
              params={{ eventId }}
            >
              <ArrowLeft className="w-5 h-5 text-purple-400" />
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="flex-1">
              <h1
                className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-2 leading-tight"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {category.name}
              </h1>
              <p className="text-base text-zinc-400 mb-4 max-w-3xl">
                {category.description}
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 text-sm text-zinc-400">
                <div className="flex flex-row items-center gap-3 sm:gap-4">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {category.contestants.length} {category.contestants.length === 1 ? "Nominee" : "Nominees"}
                  </span>
                  {daysLeft !== null && (
                    <div className="flex items-center gap-2 bg-slate-600/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium text-white">{daysLeft} days left</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {category.contestants.length === 0 ? (
          <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pb-24 animate-in fade-in duration-500 delay-150 fill-mode-both">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-3xl bg-slate-600/10 p-8 flex flex-col items-center justify-center gap-4 animate-in fade-in zoom-in-95 duration-300">
                  <Users className="w-12 h-12 text-slate-400" />
                  <h3 className="text-xl font-bold text-white">No Nominees Yet</h3>
                  <p className="text-zinc-400 text-sm">
                    There are no nominees in this category at the moment.
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pb-24 animate-in fade-in duration-500 delay-150 fill-mode-both">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {category.contestants.map((contestant: any, index: number) => (
                <div
                  key={contestant.id}
                  style={{ animationDelay: `${Math.min(index, 8) * 60}ms`, animationDuration: "500ms" }}
                  className="rounded-3xl bg-slate-600/10 backdrop-blur-sm border border-slate-600/20 overflow-hidden hover:border-slate-600/40 transition-all duration-300 group shadow-lg relative animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                >
                  <div className="relative h-72 w-full bg-slate-800/40">
                    {contestant.imageUrl ? (
                      <div className="relative w-full h-full">
                        <img
                          alt={contestant.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover object-[center_20%] transition-opacity duration-300 opacity-100"
                          src={contestant.imageUrl}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-16 h-16 text-zinc-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent"></div>
                  </div>
                  <div className="p-6">
                    <div className="mb-4">
                      <div className="flex flex-wrap items-baseline gap-2 mb-2">
                        <h2 className="text-xl font-extrabold text-white group-hover:text-purple-400 transition-colors flex-1 min-w-0">
                          {contestant.name}
                        </h2>
                      </div>
                      {contestant.tagline && (
                        <p className="text-sm text-zinc-300 line-clamp-2">{contestant.tagline}</p>
                      )}
                    </div>
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-sm text-zinc-300">
                       <ScanQrCode className="w-4 h-4 text-purple-400" />
                        <span>Code: {contestant.code}</span>
                      </div>
                      <Link
                        className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                        to="/nominee/$nomineeId"
                        params={{ nomineeId: String(contestant.code) }}
                      >
                        <Link2 className="w-4 h-4" />
                        <span>View Profile</span>
                      </Link>
                    </div>
                    <div className="flex gap-3">
                      <DialogTrigger asChild>
                        <button
                          onClick={() => openVoteModal(contestant)}
                          className="flex-1 px-4 py-3 bg-[#E3F09B] hover:bg-[#c0ff14] text-[#131313] rounded-lg shadow-[5px_5px_10px_rgba(0,0,0,0.116)] transition-all duration-500 active:scale-[0.97] flex items-center justify-center gap-2 group text-sm font-bold"
                        >
                          Vote Now
                        </button>
                      </DialogTrigger>
                      <DialogTrigger asChild>
                        <button
                          onClick={() => openProfileModal(contestant)}
                          className="px-4 py-3 bg-slate-600/20 hover:bg-slate-600/30 text-white rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 group text-sm font-medium border border-slate-600/30"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>
                      </DialogTrigger>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
       <PayMode />
      </main>
      </Dialog>
    </div>
  )
}
