import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/store')({
  component: RouteComponent,
})

type ModalProduct = {
  title: string
  description: string
  phone: string
  priceLabel: string
  imgAlt: string
  imgSrc: string
  imgSrcSet: string
}

function RouteComponent() {
  const [modalProduct, setModalProduct] = useState<ModalProduct | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)

  const closeModal = () => {
    setIsModalVisible(false)
  }

  useEffect(() => {
    if (!modalProduct) return

    setIsModalVisible(false)
    const raf = requestAnimationFrame(() => setIsModalVisible(true))

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [modalProduct])

  useEffect(() => {
    if (!modalProduct) return
    if (isModalVisible) return

    const t = window.setTimeout(() => setModalProduct(null), 220)
    return () => window.clearTimeout(t)
  }, [isModalVisible, modalProduct])

  return (
    <div className="min-h-screen bg-[#18181b] text-white antialiased font-sans">
      <main className="w-full">
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pt-6 sm:pt-10 lg:pt-14 pb-16">
          <div className="text-left" style={{ opacity: 1, transform: "none" }}>
            <h1
              className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Award Store
            </h1>
            <p className="text-lg md:text-xl text-zinc-300 max-w-2xl">
              Premium quality awards, plaques, and medals for your special occasions. Contact us for custom designs and bulk orders.
            </p>
          </div>
        </section>
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-12 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Product 1 */}
            <div className="rounded-3xl bg-slate-600/10 backdrop-blur-sm border border-slate-600/20 overflow-hidden hover:border-slate-600/40 transition-all duration-300 group shadow-lg" style={{ opacity: 1, transform: "none" }}>
              <div className="relative h-72 w-full">
                <img
                  alt="Sublimation Crystal Plaque"
                  decoding="async"
                  className="object-cover object-center"
                  sizes="100vw"
                  src="/_next/image?url=%2Fstore%2Fsublimation-crystal-plaque.jpeg&amp;w=3840&amp;q=75"
                  style={{ position: "absolute", height: "100%", width: "100%", inset: 0, color: "transparent" }}
                  srcSet="/_next/image?url=%2Fstore%2Fsublimation-crystal-plaque.jpeg&amp;w=640&amp;q=75 640w, /_next/image?url=%2Fstore%2Fsublimation-crystal-plaque.jpeg&amp;w=750&amp;q=75 750w, /_next/image?url=%2Fstore%2Fsublimation-crystal-plaque.jpeg&amp;w=828&amp;q=75 828w, /_next/image?url=%2Fstore%2Fsublimation-crystal-plaque.jpeg&amp;w=1080&amp;q=75 1080w, /_next/image?url=%2Fstore%2Fsublimation-crystal-plaque.jpeg&amp;w=1200&amp;q=75 1200w, /_next/image?url=%2Fstore%2Fsublimation-crystal-plaque.jpeg&amp;w=1920&amp;q=75 1920w, /_next/image?url=%2Fstore%2Fsublimation-crystal-plaque.jpeg&amp;w=2048&amp;q=75 2048w, /_next/image?url=%2Fstore%2Fsublimation-crystal-plaque.jpeg&amp;w=3840&amp;q=75 3840w"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent"></div>
                <div className="absolute top-4 right-4 z-10">
                  <div className="px-3 py-1.5 bg-purple-500 text-white rounded-full text-sm font-bold shadow-lg">₵300 - ₵350</div>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-extrabold text-white group-hover:text-purple-400 transition-colors mb-2">
                    Sublimation Crystal Plaque
                  </h2>
                  <p className="text-sm text-zinc-300 line-clamp-2">
                    High-quality sublimation crystal plaques perfect for awards and recognition.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-phone w-4 h-4 text-purple-400">
                      <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2"></path>
                    </svg>
                    <span>0246417050</span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="flex-1 px-4 py-3 bg-linear-to-r from-[#6d28d9] to-purple-600 text-white rounded-2xl hover:from-[#6d28d9]/90 hover:to-purple-600/90 transition-all duration-300 flex items-center justify-center gap-2 group text-sm font-bold shadow-lg"
                      onClick={() =>
                        setModalProduct({
                          title: 'Sublimation Crystal Plaque',
                          description:
                            'High-quality sublimation crystal plaques perfect for awards and recognition.',
                          phone: '0246417050',
                          priceLabel: '₵300 - ₵350',
                          imgAlt: 'Sublimation Crystal Plaque',
                          imgSrc:
                            '/_next/image?url=%2Fstore%2Fsublimation-crystal-plaque.jpeg&w=3840&q=75',
                          imgSrcSet:
                            '/_next/image?url=%2Fstore%2Fsublimation-crystal-plaque.jpeg&w=640&q=75 640w, /_next/image?url=%2Fstore%2Fsublimation-crystal-plaque.jpeg&w=750&q=75 750w, /_next/image?url=%2Fstore%2Fsublimation-crystal-plaque.jpeg&w=828&q=75 828w, /_next/image?url=%2Fstore%2Fsublimation-crystal-plaque.jpeg&w=1080&q=75 1080w, /_next/image?url=%2Fstore%2Fsublimation-crystal-plaque.jpeg&w=1200&q=75 1200w, /_next/image?url=%2Fstore%2Fsublimation-crystal-plaque.jpeg&w=1920&q=75 1920w, /_next/image?url=%2Fstore%2Fsublimation-crystal-plaque.jpeg&w=2048&q=75 2048w, /_next/image?url=%2Fstore%2Fsublimation-crystal-plaque.jpeg&w=3840&q=75 3840w',
                        })
                      }
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-eye w-4 h-4">
                        <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"></path>
                        <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6"></path>
                      </svg>
                      View
                    </button>
                    <button className="px-4 py-3 bg-slate-600/20 hover:bg-slate-600/30 text-white rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 group text-sm font-medium border border-slate-600/30">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-shopping-cart w-4 h-4">
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
            {/* Product 2 */}
            <div className="rounded-3xl bg-slate-600/10 backdrop-blur-sm border border-slate-600/20 overflow-hidden hover:border-slate-600/40 transition-all duration-300 group shadow-lg" style={{ opacity: 1, transform: "none" }}>
              <div className="relative h-72 w-full">
                <img
                  alt="Crystal with Wooden Base"
                  decoding="async"
                  className="object-cover object-center"
                  sizes="100vw"
                  src="/_next/image?url=%2Fstore%2Fcrystal-with-wooden-base.jpeg&amp;w=3840&amp;q=75"
                  style={{ position: "absolute", height: "100%", width: "100%", inset: 0, color: "transparent" }}
                  srcSet="/_next/image?url=%2Fstore%2Fcrystal-with-wooden-base.jpeg&amp;w=640&amp;q=75 640w, /_next/image?url=%2Fstore%2Fcrystal-with-wooden-base.jpeg&amp;w=750&amp;q=75 750w, /_next/image?url=%2Fstore%2Fcrystal-with-wooden-base.jpeg&amp;w=828&amp;q=75 828w, /_next/image?url=%2Fstore%2Fcrystal-with-wooden-base.jpeg&amp;w=1080&amp;q=75 1080w, /_next/image?url=%2Fstore%2Fcrystal-with-wooden-base.jpeg&amp;w=1200&amp;q=75 1200w, /_next/image?url=%2Fstore%2Fcrystal-with-wooden-base.jpeg&amp;w=1920&amp;q=75 1920w, /_next/image?url=%2Fstore%2Fcrystal-with-wooden-base.jpeg&amp;w=2048&amp;q=75 2048w, /_next/image?url=%2Fstore%2Fcrystal-with-wooden-base.jpeg&amp;w=3840&amp;q=75 3840w"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent"></div>
                <div className="absolute top-4 right-4 z-10">
                  <div className="px-3 py-1.5 bg-purple-500 text-white rounded-full text-sm font-bold shadow-lg">₵250 - ₵300</div>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-extrabold text-white group-hover:text-purple-400 transition-colors mb-2">
                    Crystal with Wooden Base
                  </h2>
                  <p className="text-sm text-zinc-300 line-clamp-2">
                    Elegant crystal awards mounted on beautiful wooden bases.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-phone w-4 h-4 text-purple-400">
                      <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2"></path>
                    </svg>
                    <span>0246417050</span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="flex-1 px-4 py-3 bg-linear-to-r from-[#6d28d9] to-purple-600 text-white rounded-2xl hover:from-[#6d28d9]/90 hover:to-purple-600/90 transition-all duration-300 flex items-center justify-center gap-2 group text-sm font-bold shadow-lg"
                      onClick={() =>
                        setModalProduct({
                          title: 'Crystal with Wooden Base',
                          description:
                            'Elegant crystal awards mounted on beautiful wooden bases.',
                          phone: '0246417050',
                          priceLabel: '₵250 - ₵300',
                          imgAlt: 'Crystal with Wooden Base',
                          imgSrc:
                            '/_next/image?url=%2Fstore%2Fcrystal-with-wooden-base.jpeg&w=3840&q=75',
                          imgSrcSet:
                            '/_next/image?url=%2Fstore%2Fcrystal-with-wooden-base.jpeg&w=640&q=75 640w, /_next/image?url=%2Fstore%2Fcrystal-with-wooden-base.jpeg&w=750&q=75 750w, /_next/image?url=%2Fstore%2Fcrystal-with-wooden-base.jpeg&w=828&q=75 828w, /_next/image?url=%2Fstore%2Fcrystal-with-wooden-base.jpeg&w=1080&q=75 1080w, /_next/image?url=%2Fstore%2Fcrystal-with-wooden-base.jpeg&w=1200&q=75 1200w, /_next/image?url=%2Fstore%2Fcrystal-with-wooden-base.jpeg&w=1920&q=75 1920w, /_next/image?url=%2Fstore%2Fcrystal-with-wooden-base.jpeg&w=2048&q=75 2048w, /_next/image?url=%2Fstore%2Fcrystal-with-wooden-base.jpeg&w=3840&q=75 3840w',
                        })
                      }
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-eye w-4 h-4">
                        <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"></path>
                        <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6"></path>
                      </svg>
                      View
                    </button>
                    <button className="px-4 py-3 bg-slate-600/20 hover:bg-slate-600/30 text-white rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 group text-sm font-medium border border-slate-600/30">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-shopping-cart w-4 h-4">
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
            {/* Product 3 */}
            <div className="rounded-3xl bg-slate-600/10 backdrop-blur-sm border border-slate-600/20 overflow-hidden hover:border-slate-600/40 transition-all duration-300 group shadow-lg" style={{ opacity: 1, transform: "none" }}>
              <div className="relative h-72 w-full">
                <img
                  alt="Medal"
                  loading="lazy"
                  decoding="async"
                  className="object-cover object-center"
                  sizes="100vw"
                  src="/_next/image?url=%2Fstore%2Fmedal.jpeg&amp;w=3840&amp;q=75"
                  style={{ position: "absolute", height: "100%", width: "100%", inset: 0, color: "transparent" }}
                  srcSet="/_next/image?url=%2Fstore%2Fmedal.jpeg&amp;w=640&amp;q=75 640w, /_next/image?url=%2Fstore%2Fmedal.jpeg&amp;w=750&amp;q=75 750w, /_next/image?url=%2Fstore%2Fmedal.jpeg&amp;w=828&amp;q=75 828w, /_next/image?url=%2Fstore%2Fmedal.jpeg&amp;w=1080&amp;q=75 1080w, /_next/image?url=%2Fstore%2Fmedal.jpeg&amp;w=1200&amp;q=75 1200w, /_next/image?url=%2Fstore%2Fmedal.jpeg&amp;w=1920&amp;q=75 1920w, /_next/image?url=%2Fstore%2Fmedal.jpeg&amp;w=2048&amp;q=75 2048w, /_next/image?url=%2Fstore%2Fmedal.jpeg&amp;w=3840&amp;q=75 3840w"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent"></div>
                <div className="absolute top-4 right-4 z-10">
                  <div className="px-3 py-1.5 bg-purple-500 text-white rounded-full text-sm font-bold shadow-lg">₵50 - ₵70</div>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-extrabold text-white group-hover:text-purple-400 transition-colors mb-2">
                    Medal
                  </h2>
                  <p className="text-sm text-zinc-300 line-clamp-2">
                    Premium quality medals for competitions and achievements.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-phone w-4 h-4 text-purple-400">
                      <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2"></path>
                    </svg>
                    <span>0246417050</span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="flex-1 px-4 py-3 bg-linear-to-r from-[#6d28d9] to-purple-600 text-white rounded-2xl hover:from-[#6d28d9]/90 hover:to-purple-600/90 transition-all duration-300 flex items-center justify-center gap-2 group text-sm font-bold shadow-lg"
                      onClick={() =>
                        setModalProduct({
                          title: 'Medal',
                          description:
                            'Premium quality medals for competitions and achievements.',
                          phone: '0246417050',
                          priceLabel: '₵50 - ₵70',
                          imgAlt: 'Medal',
                          imgSrc:
                            '/_next/image?url=%2Fstore%2Fmedal.jpeg&w=3840&q=75',
                          imgSrcSet:
                            '/_next/image?url=%2Fstore%2Fmedal.jpeg&w=640&q=75 640w, /_next/image?url=%2Fstore%2Fmedal.jpeg&w=750&q=75 750w, /_next/image?url=%2Fstore%2Fmedal.jpeg&w=828&q=75 828w, /_next/image?url=%2Fstore%2Fmedal.jpeg&w=1080&q=75 1080w, /_next/image?url=%2Fstore%2Fmedal.jpeg&w=1200&q=75 1200w, /_next/image?url=%2Fstore%2Fmedal.jpeg&w=1920&q=75 1920w, /_next/image?url=%2Fstore%2Fmedal.jpeg&w=2048&q=75 2048w, /_next/image?url=%2Fstore%2Fmedal.jpeg&w=3840&q=75 3840w',
                        })
                      }
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-eye w-4 h-4">
                        <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"></path>
                        <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6"></path>
                      </svg>
                      View
                    </button>
                    <button className="px-4 py-3 bg-slate-600/20 hover:bg-slate-600/30 text-white rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 group text-sm font-medium border border-slate-600/30">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-shopping-cart w-4 h-4">
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
            {/* Product 4 */}
            <div className="rounded-3xl bg-slate-600/10 backdrop-blur-sm border border-slate-600/20 overflow-hidden hover:border-slate-600/40 transition-all duration-300 group shadow-lg" style={{ opacity: 1, transform: "none" }}>
              <div className="relative h-72 w-full">
                <img
                  alt="Crystal Award"
                  loading="lazy"
                  decoding="async"
                  className="object-cover object-center"
                  sizes="100vw"
                  src="/_next/image?url=%2Fstore%2Fcrystal-award.jpeg&amp;w=3840&amp;q=75"
                  style={{ position: "absolute", height: "100%", width: "100%", inset: 0, color: "transparent" }}
                  srcSet="/_next/image?url=%2Fstore%2Fcrystal-award.jpeg&amp;w=640&amp;q=75 640w, /_next/image?url=%2Fstore%2Fcrystal-award.jpeg&amp;w=750&amp;q=75 750w, /_next/image?url=%2Fstore%2Fcrystal-award.jpeg&amp;w=828&amp;q=75 828w, /_next/image?url=%2Fstore%2Fcrystal-award.jpeg&amp;w=1080&amp;q=75 1080w, /_next/image?url=%2Fstore%2Fcrystal-award.jpeg&amp;w=1200&amp;q=75 1200w, /_next/image?url=%2Fstore%2Fcrystal-award.jpeg&amp;w=1920&amp;q=75 1920w, /_next/image?url=%2Fstore%2Fcrystal-award.jpeg&amp;w=2048&amp;q=75 2048w, /_next/image?url=%2Fstore%2Fcrystal-award.jpeg&amp;w=3840&amp;q=75 3840w"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent"></div>
                <div className="absolute top-4 right-4 z-10">
                  <div className="px-3 py-1.5 bg-purple-500 text-white rounded-full text-sm font-bold shadow-lg">₵200 - ₵300</div>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-extrabold text-white group-hover:text-purple-400 transition-colors mb-2">
                    Crystal Award
                  </h2>
                  <p className="text-sm text-zinc-300 line-clamp-2">
                    Stunning crystal awards for special occasions and recognition.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-phone w-4 h-4 text-purple-400">
                      <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2"></path>
                    </svg>
                    <span>0246417050</span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="flex-1 px-4 py-3 bg-linear-to-r from-[#6d28d9] to-purple-600 text-white rounded-2xl hover:from-[#6d28d9]/90 hover:to-purple-600/90 transition-all duration-300 flex items-center justify-center gap-2 group text-sm font-bold shadow-lg"
                      onClick={() =>
                        setModalProduct({
                          title: 'Crystal Award',
                          description:
                            'Stunning crystal awards for special occasions and recognition.',
                          phone: '0246417050',
                          priceLabel: '₵200 - ₵300',
                          imgAlt: 'Crystal Award',
                          imgSrc:
                            '/_next/image?url=%2Fstore%2Fcrystal-award.jpeg&w=3840&q=75',
                          imgSrcSet:
                            '/_next/image?url=%2Fstore%2Fcrystal-award.jpeg&w=640&q=75 640w, /_next/image?url=%2Fstore%2Fcrystal-award.jpeg&w=750&q=75 750w, /_next/image?url=%2Fstore%2Fcrystal-award.jpeg&w=828&q=75 828w, /_next/image?url=%2Fstore%2Fcrystal-award.jpeg&w=1080&q=75 1080w, /_next/image?url=%2Fstore%2Fcrystal-award.jpeg&w=1200&q=75 1200w, /_next/image?url=%2Fstore%2Fcrystal-award.jpeg&w=1920&q=75 1920w, /_next/image?url=%2Fstore%2Fcrystal-award.jpeg&w=2048&q=75 2048w, /_next/image?url=%2Fstore%2Fcrystal-award.jpeg&w=3840&q=75 3840w',
                        })
                      }
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-eye w-4 h-4">
                        <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"></path>
                        <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6"></path>
                      </svg>
                      View
                    </button>
                    <button className="px-4 py-3 bg-slate-600/20 hover:bg-slate-600/30 text-white rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 group text-sm font-medium border border-slate-600/30">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-shopping-cart w-4 h-4">
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
          </div>
          <div className="mt-16" style={{ opacity: 1, transform: "none" }}>
            <div className="bg-slate-600/10 backdrop-blur-sm border border-slate-600/20 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-linear-to-r from-yellow-400 to-yellow-500 rounded-2xl">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-trophy w-6 h-6 text-black">
                    <path d="M8 21l8 0"></path>
                    <path d="M12 17l0 4"></path>
                    <path d="M7 4l10 0"></path>
                    <path d="M17 4v8a5 5 0 0 1 -10 0v-8"></path>
                    <path d="M3 9a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path>
                    <path d="M17 9a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path>
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">Quality Guaranteed</h2>
                  <p className="text-sm text-zinc-400">Premium materials and attention to detail</p>
                </div>
              </div>
              <p className="text-zinc-300 mb-6 max-w-2xl">
                All our products are crafted with premium materials and attention to detail. Contact us for custom designs and bulk orders.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                <span className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-phone w-4 h-4 text-purple-400">
                    <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2"></path>
                  </svg>
                  <span>Call: 0246417050</span>
                </span>
                <span>•</span>
                <span>WhatsApp Available</span>
                <span>•</span>
                <span>Free Delivery</span>
              </div>
            </div>
          </div>
        </section>

        {/* Modal */}
        {modalProduct && (
          <div
            className={[
              "fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-200 ease-out",
              isModalVisible ? "opacity-100 bg-[#18181b]/90" : "opacity-0 bg-[#18181b]/0",
            ].join(" ")}
            role="dialog"
            aria-modal="true"
            aria-label={`${modalProduct.title} details`}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeModal()
            }}
          >
            <div
              className={[
                "relative w-full max-w-4xl max-h-[90vh] bg-[#18181b] rounded-3xl overflow-hidden shadow-2xl border border-white/10",
                "transition duration-200 ease-out will-change-transform",
                isModalVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2",
              ].join(" ")}
              onMouseDown={(e) => e.stopPropagation()}
            >
            <button
              className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-white/5 transition-colors"
              onClick={closeModal}
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-x w-5 h-5 text-zinc-400">
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
                style={{ position: "absolute", height: "100%", width: "100%", inset: 0, color: "transparent" }}
              />
            </div>
            <div className="p-6">
              <div className="mb-4">
                <h2 className="text-2xl font-extrabold text-white mb-2">{modalProduct.title}</h2>
                <p className="text-zinc-300 mb-4">{modalProduct.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-phone w-4 h-4 text-purple-400">
                      <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2"></path>
                    </svg>
                    <span>{modalProduct.phone}</span>
                  </div>
                  <div className="px-3 py-1.5 bg-purple-500 text-white rounded-full text-sm font-bold">{modalProduct.priceLabel}</div>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 px-4 py-3 bg-linear-to-r from-[#6d28d9] to-purple-600 text-white rounded-2xl hover:from-[#6d28d9]/90 hover:to-purple-600/90 transition-all duration-300 flex items-center justify-center gap-2 group text-sm font-bold shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-phone w-4 h-4">
                    <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2"></path>
                  </svg>
                  Call Now
                </button>
                <button className="flex-1 px-4 py-3 bg-slate-600/20 hover:bg-slate-600/30 text-white rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 group text-sm font-medium border border-slate-600/30">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-shopping-cart w-4 h-4">
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
      <button className="fixed bottom-6 right-6 z-50 p-4 bg-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" tabIndex={0}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tabler-icon tabler-icon-message-circle w-6 h-6">
          <path d="M3 20l1.3 -3.9c-2.324 -3.437 -1.426 -7.872 2.1 -10.374c3.526 -2.501 8.59 -2.296 11.845 .48c3.255 2.777 3.695 7.266 1.029 10.501c-2.666 3.235 -7.615 4.215 -11.574 2.293l-4.7 1"></path>
        </svg>
      </button>
    </div>
  )
}
