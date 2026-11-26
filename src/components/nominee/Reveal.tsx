import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'

// Entrance motion for the nominee portal.
//
//   <Reveal delay={120}>…</Reveal>   fades + slides a section in. Sections in
//   view animate straight away (staggered by `delay`); ones further down wait
//   until they're scrolled into view.
//
// Content rendered by the server on first load is left as-is (animating it
// would make already-visible content blink out and back in). Whether this
// component is being hydrated from server HTML or freshly mounted in the
// browser is read per component (useSyncExternalStore gives the server
// snapshot during hydration), so content that only appears after a client
// fetch still animates. Reduced-motion users get no motion.

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

const noopSubscribe = () => () => {}
/** False while React hydrates this component from server HTML, true for browser mounts. */
function useMountedInBrowser() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false)
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function Reveal({ children, delay = 0, className = '', from = 'bottom' }: {
  children: React.ReactNode
  delay?: number
  className?: string
  from?: 'bottom' | 'left' | 'right' | 'none'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'static' | 'hidden' | 'shown'>('static')
  // Captured on the first render only: was this component hydrated from server HTML?
  const mountedInBrowser = useMountedInBrowser()
  const fromServerHtml = useRef(!mountedInBrowser).current

  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return
    const inView = el.getBoundingClientRect().top < window.innerHeight
    if (inView) {
      // Already on screen: animate only if it wasn't server-rendered (see above).
      if (!fromServerHtml) setState('shown')
      return
    }
    // Below the fold: hide until it scrolls into view, then animate.
    setState('hidden')
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState('shown')
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -6% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const slide = from === 'left' ? 'slide-in-from-left-4' : from === 'right' ? 'slide-in-from-right-4' : from === 'none' ? '' : 'slide-in-from-bottom-4'
  const cls = state === 'hidden' ? 'opacity-0' : state === 'shown' ? `animate-in fade-in ${slide} duration-500 ease-out fill-mode-both` : ''
  return (
    <div ref={ref} className={`${cls} ${className}`} style={state === 'shown' && delay ? { animationDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  )
}
