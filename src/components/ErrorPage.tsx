import { Link, useRouter, useRouterState, type ErrorComponentProps } from '@tanstack/react-router'
import { AlertTriangle, ArrowLeft, Compass, Home, LifeBuoy, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toUserMessage } from '#/lib/errors'

// Friendly replacements for the router's default error and not-found screens.
// Inside the admin they use the admin's card classes, which follow its
// light/dark theme; on the public site, its always-dark look.

function useInAdmin() {
  return useRouterState({ select: (s) => s.location.pathname.startsWith('/admin') })
}

function Shell({ icon: Icon, tone, eyebrow, title, children }: {
  icon: typeof AlertTriangle
  tone: string
  eyebrow: string
  title: string
  children: React.ReactNode
}) {
  const admin = useInAdmin()
  return (
    <div className={`flex w-full flex-1 items-center justify-center px-4 py-16 sm:py-24 ${admin ? '' : 'bg-[#0d1f36] text-white'}`}>
      <div className={`w-full max-w-lg p-6 text-center sm:p-10 ${admin ? 'rounded-xl border border-zinc-800 bg-[#0a192a]/50' : 'rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl'}`}>
        <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border ${tone}`}>
          <Icon className="h-7 w-7" />
        </span>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{title}</h1>
        {children}
      </div>
    </div>
  )
}

const button = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors'
const secondaryFor = (admin: boolean) =>
  admin ? 'border border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-zinc-600' : 'border border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10'

export function RouteErrorPage({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const secondary = secondaryFor(useInAdmin())
  const [retrying, setRetrying] = useState(false)
  const message = toUserMessage(error)

  const retry = async () => {
    setRetrying(true)
    try {
      reset()
      await router.invalidate()
    } finally {
      setRetrying(false)
    }
  }

  return (
    <Shell icon={AlertTriangle} tone="border-amber-500/30 bg-amber-500/10 text-amber-300" eyebrow="Something went wrong" title="We couldn't load this page">
      <p className="mt-3 text-sm leading-relaxed text-zinc-300">{message}</p>
      <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
        <button type="button" onClick={retry} disabled={retrying} className={`${button} bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-60`}>
          <RefreshCw className={`h-4 w-4 ${retrying ? 'animate-spin' : ''}`} /> Try again
        </button>
        <button type="button" onClick={() => router.history.back()} className={`${button} ${secondary}`}>
          <ArrowLeft className="h-4 w-4" /> Go back
        </button>
        <Link to="/" className={`${button} ${secondary}`}>
          <Home className="h-4 w-4" /> Home
        </Link>
      </div>
      <p className="mt-6 text-xs text-zinc-500">
        Still stuck? <Link to="/contact" className="text-zinc-300 underline-offset-2 hover:underline">Contact support</Link>.
      </p>
      {import.meta.env.DEV && error instanceof Error && (
        <details className="mt-6 text-left text-xs text-zinc-500">
          <summary className="cursor-pointer select-none">Technical details (development only)</summary>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-black/30 p-3">{error.stack ?? error.message}</pre>
        </details>
      )}
    </Shell>
  )
}

export function NotFoundPage() {
  const secondary = secondaryFor(useInAdmin())
  return (
    <Shell icon={Compass} tone="border-purple-400/30 bg-purple-500/10 text-purple-300" eyebrow="Error 404" title="We can't find that page">
      <p className="mt-3 text-sm leading-relaxed text-zinc-300">
        The link may be mistyped, or the page may have moved or been removed. Here are some places to start instead.
      </p>
      <div className="mt-7 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Link to="/" className={`${button} bg-purple-600 text-white hover:bg-purple-500`}><Home className="h-4 w-4" /> Home</Link>
        <Link to="/events" className={`${button} ${secondary}`}>Events</Link>
        <Link to="/elections" className={`${button} ${secondary}`}>Elections</Link>
      </div>
      <p className="mt-6 inline-flex items-center gap-1.5 text-xs text-zinc-500">
        <LifeBuoy className="h-3.5 w-3.5" /> Need help? <Link to="/contact" className="text-zinc-300 underline-offset-2 hover:underline">Contact support</Link>
      </p>
    </Shell>
  )
}
