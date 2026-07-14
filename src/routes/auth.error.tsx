import { createFileRoute, Link } from '@tanstack/react-router'
import { AlertTriangle, ArrowLeft, Ban, ShieldAlert } from 'lucide-react'
import z from 'zod'

const searchSchema = z.object({
  error: z.string().optional(),
  error_description: z.string().optional(),
})

const ERROR_PRESETS: Record<string, { title: string; icon: any; tone: string }> = {
  banned: {
    title: 'Account Disabled',
    icon: Ban,
    tone: 'red',
  },
  access_denied: {
    title: 'Access Denied',
    icon: ShieldAlert,
    tone: 'amber',
  },
}

const DEFAULT_PRESET = {
  title: 'Authentication Error',
  icon: AlertTriangle,
  tone: 'amber',
}

export const Route = createFileRoute('/auth/error')({
  validateSearch: searchSchema,
  component: RouteComponent,
})

function RouteComponent() {
  const { error, error_description } = Route.useSearch()

  const preset = (error && ERROR_PRESETS[error]) || DEFAULT_PRESET
  const Icon = preset.icon
  const message = error_description || 'Something went wrong while signing you in. Please try again.'

  const toneClasses = preset.tone === 'red'
    ? { bg: 'bg-red-950/30', border: 'border-red-900/30', text: 'text-red-400' }
    : { bg: 'bg-amber-950/30', border: 'border-amber-900/30', text: 'text-amber-400' }

  return (
    <main className="min-h-screen bg-[#0a192a]/50 text-white antialiased font-sans flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="bg-slate-600/10 backdrop-blur-sm border border-slate-600/20 rounded-3xl p-8 shadow-xl text-center">
          <div className={`w-14 h-14 rounded-full ${toneClasses.bg} border ${toneClasses.border} flex items-center justify-center mx-auto mb-5`}>
            <Icon className={`w-7 h-7 ${toneClasses.text}`} />
          </div>

          <h1 className="text-2xl font-extrabold text-white mb-2">{preset.title}</h1>
          <p className="text-zinc-300 text-sm leading-relaxed">{message}</p>

          {error && (
            <p className="mt-4 font-mono text-[11px] text-zinc-500 select-all">
              error code: {error}
            </p>
          )}

          <div className="mt-8 pt-6 border-t border-slate-600/20">
            <Link
              to="/auth/signin"
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all duration-300 text-sm font-semibold shadow-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
