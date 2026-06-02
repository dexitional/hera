import { getActiveElectionsFn } from "#/server/tenant-elections";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Link2 } from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";

const electionsQueryOptions = () => ({
  queryKey: ["elections-page"],
  queryFn: () => getActiveElectionsFn(),
});

export const Route = createFileRoute("/elections")({
  component: RouteComponent,
  loader: async ({ context }) => {
    return await context.queryClient.ensureQueryData(electionsQueryOptions());
  },
});

type ModalProduct = {
  title: string;
  description: string;
  phone: string;
  priceLabel: string;
  imgAlt: string;
  imgSrc: string;
  imgSrcSet: string;
};

function RouteComponent() {
  const { data }: any = useSuspenseQuery(electionsQueryOptions());
  const rightNow = new Date();
  console.log(data);

  const [modalProduct, setModalProduct] = useState<ModalProduct | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const closeModal = () => {
    setIsModalVisible(false);
  };

  useEffect(() => {
    if (!modalProduct) return;

    setIsModalVisible(false);
    const raf = requestAnimationFrame(() => setIsModalVisible(true));

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [modalProduct]);

  useEffect(() => {
    if (!modalProduct) return;
    if (isModalVisible) return;

    const t = window.setTimeout(() => setModalProduct(null), 220);
    return () => window.clearTimeout(t);
  }, [isModalVisible, modalProduct]);

  return (
    <div className="min-h-screen bg-[#18181b] text-white antialiased font-sans">
      <main className="w-full">
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pt-6 sm:pt-10 lg:pt-14 pb-16">
          <div className="text-left" style={{ opacity: 1, transform: "none" }}>
            <h1
              className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Elections
            </h1>
            <p className="text-lg md:text-xl text-zinc-300 max-w-2xl">
              Secure organization elections staged and made public for eligble
              voters.
            </p>
          </div>
        </section>
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {/* Election 1 */}
            {data.map((row: any) => (
              <div
                key={row?.id}
                className="rounded-3xl bg-slate-600/10 backdrop-blur-sm border border-slate-600/20 overflow-hidden hover:border-slate-600/40 transition-all duration-300 group shadow-lg"
                style={{ opacity: 1, transform: "none" }}
              >
                <div className="relative h-56 w-full">
                  {row.imageUrl && (
                    <img
                      alt={row.title}
                      decoding="async"
                      className="object-cover object-top"
                      sizes="100vw"
                      src={row?.imageUrl}
                      style={{
                        position: "absolute",
                        height: "100%",
                        width: "100%",
                        inset: 0,
                        color: "transparent",
                      }}
                      srcSet={row?.imageUrl}
                    />
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent"></div>
                  <div className="absolute top-4 right-4 z-10">
                    <div className={`px-3 py-0.5 ${['staged','ended'].includes(row.status) || (rightNow < row.startAt || rightNow > row.endAt) ? 'bg-zinc-300 text-zinc-700' : 'bg-purple-500 animate-pulse text-white' }  rounded-full text-xs font-black shadow-lg`}>
                      {/* { row.status == 'staged' ? 'NOT STARTED': row.status == 'started'? 'LIVE & ON-GOING' : 'CLOSED' } */}
                      { (rightNow < row.startAt || rightNow > row.endAt) ? "INACTIVE" : row.status == 'staged' ? 'NOT STARTED': row.status == 'started'? 'LIVE & ON-GOING' : 'CLOSED' }
                    </div>
                  </div>
                </div>
                <div className="px-4 py-4">
                  <div className="mb-4">
                    <h2 className="text-lg font-extrabold text-white group-hover:text-purple-400 transition-colors mb-2">
                      {row.tag?.replaceAll("-", " ")?.toUpperCase()}
                    </h2>
                    <p className="mb-3 text-xs text-purple-400 font-semibold line-clamp-2">
                      {row.title?.toUpperCase()}
                    </p>
                    <p className="text-sm border border-zinc-700 text-zinc-300 flex flex-col space-y-2 rounded">
                      {/* Election starts at: April 23, 2026 5:00 AM and  */}
                      <button className="px-1 py-1 bg-slate-600/20 hover:bg-slate-600/30 text-zinc-300  transition-all duration-300 flex items-center justify-center gap-2 group text-sm font-medium border border-slate-600/30">
                        Opens : {moment(row.startAt).format("LLL")}
                      </button>
                      <button className="px-1 py-1 bg-slate-600/20 hover:bg-slate-600/30 text-zinc-300  transition-all duration-300 flex items-center justify-center gap-2 group text-sm font-medium border border-slate-600/30">
                        Closes : {moment(row.startAt).format("LLL")}
                      </button>
                    </p>
                  </div>
                  <div className="space-y-3">
                    {/* <div className="flex items-center gap-2 text-sm text-zinc-300">
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
                        className="tabler-icon tabler-icon-phone w-4 h-4 text-purple-400"
                      >
                        <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2"></path>
                      </svg>
                      <span>{row.tag}</span>
                    </div> */}
                    <div className="flex gap-3">
                      {/* <Link
                        to={`/vote/election?page=${row.tag}`}
                        className="flex-1 px-4 py-1 bg-[#E3F09B] text-black rounded-lg hover:from-[#6d28d9]/90 hover:to-purple-600/90 transition-all duration-300 flex items-center justify-center gap-2 group text-sm font-bold shadow-lg"
                      >
                        Goto Election Page
                      </Link> */}
                      {/* <button className="px-4 py-3 bg-slate-600/20 hover:bg-slate-600/30 text-white rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 group text-sm font-medium border border-slate-600/30">
                        Live Feed
                      </button> */}
                      <Link
                            to={`/vote/election?page=${row.tag}`}
                            className="group relative flex h-10 w-full cursor-pointer items-center justify-start gap-2.5 rounded-lg bg-[#E3F09B] pl-4 font-semibold text-sm text-[#131313] shadow-[5px_5px_10px_rgba(0,0,0,0.116)] transition-all duration-500 hover:bg-[#c0ff14] active:scale-[0.97]"
                      >
                          <Link2 
                            className="h-[25px] w-auto transition-transform duration-[1500ms] ease-in-out group-hover:rotate-[250deg]"
                            
                          />
                         <span>Goto Election Page</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Modal */}
        {modalProduct && (
          <div
            className={[
              "fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-200 ease-out",
              isModalVisible
                ? "opacity-100 bg-[#18181b]/90"
                : "opacity-0 bg-[#18181b]/0",
            ].join(" ")}
            role="dialog"
            aria-modal="true"
            aria-label={`${modalProduct.title} details`}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeModal();
            }}
          >
            <div
              className={[
                "relative w-full max-w-4xl max-h-[90vh] bg-[#18181b] rounded-3xl overflow-hidden shadow-2xl border border-white/10",
                "transition duration-200 ease-out will-change-transform",
                isModalVisible
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-95 translate-y-2",
              ].join(" ")}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-white/5 transition-colors"
                onClick={closeModal}
                aria-label="Close modal"
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
                  className="tabler-icon tabler-icon-x w-5 h-5 text-zinc-400"
                >
                  <path d="M18 6l-12 12"></path>
                  <path d="M6 6l12 12"></path>
                </svg>
              </button>
              <div className="relative w-full h-[70vh]">
                <img
                  alt={modalProduct.imgAlt}
                  decoding="async"
                  data-nimg="fill"
                  className="object-contain"
                  sizes="100vw"
                  srcSet={modalProduct.imgSrcSet}
                  src={modalProduct.imgSrc}
                  style={{
                    position: "absolute",
                    height: "100%",
                    width: "100%",
                    inset: 0,
                    color: "transparent",
                  }}
                />
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <h2 className="text-2xl font-extrabold text-white mb-2">
                    {modalProduct.title}
                  </h2>
                  <p className="text-zinc-300 mb-4">
                    {modalProduct.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-300">
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
                        className="tabler-icon tabler-icon-phone w-4 h-4 text-purple-400"
                      >
                        <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2"></path>
                      </svg>
                      <span>{modalProduct.phone}</span>
                    </div>
                    <div className="px-3 py-1.5 bg-purple-500 text-white rounded-full text-sm font-bold">
                      {modalProduct.priceLabel}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="flex-1 px-4 py-3 bg-linear-to-r from-[#6d28d9] to-purple-600 text-white rounded-2xl hover:from-[#6d28d9]/90 hover:to-purple-600/90 transition-all duration-300 flex items-center justify-center gap-2 group text-sm font-bold shadow-lg">
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
                      className="tabler-icon tabler-icon-phone w-4 h-4"
                    >
                      <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2"></path>
                    </svg>
                    Call Now
                  </button>
                  <button className="flex-1 px-4 py-3 bg-slate-600/20 hover:bg-slate-600/30 text-white rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 group text-sm font-medium border border-slate-600/30">
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
                      className="tabler-icon tabler-icon-shopping-cart w-4 h-4"
                    >
                      <path d="M4 19a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path>
                      <path d="M15 19a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path>
                      <path d="M17 17h-11v-14h-2"></path>
                      <path d="M6 5l14 1l-1 7h-13"></path>
                    </svg>
                    WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <button
        className="fixed bottom-6 right-6 z-50 p-4 bg-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
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
          className="tabler-icon tabler-icon-message-circle w-6 h-6"
        >
          <path d="M3 20l1.3 -3.9c-2.324 -3.437 -1.426 -7.872 2.1 -10.374c3.526 -2.501 8.59 -2.296 11.845 .48c3.255 2.777 3.695 7.266 1.029 10.501c-2.666 3.235 -7.615 4.215 -11.574 2.293l-4.7 1"></path>
        </svg>
      </button>
    </div>
  );
}
