import { createFileRoute, Link } from '@tanstack/react-router'
import { authErrorMessage } from '#/lib/errors'
import { useState } from 'react'
import { ArrowLeft, ArrowRight, KeyRound, LoaderCircle, Mail, MailCheck } from 'lucide-react'
import { authClient } from '#/lib/auth-client'

export const Route = createFileRoute('/auth/forgot-password')({
  component: ForgotPassword,
})

const inputClass =
  'w-full px-4 py-3 pl-10 bg-slate-600/10 rounded-xl border border-slate-600/20 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-white placeholder-zinc-400'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error } = await authClient.requestPasswordReset({ email: email.trim(), redirectTo: '/auth/reset-password' })
      // The server answers the same way whether or not the account exists,
      // so only transport/rate-limit failures land here.
      if (error) setError(authErrorMessage(error, "We couldn't send the email right now. Please try again shortly."))
      else setSent(true)
    } catch {
      setError('We could not send the email right now. Please try again shortly.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[70vh] bg-[#0d1f36] text-white flex items-start justify-center px-4 pt-6 sm:pt-16 pb-16">
      <div className="w-full max-w-md bg-slate-600/10 border border-slate-600/20 rounded-2xl p-8 shadow-xl">
        {sent ? (
          <div className="space-y-4 text-center">
            <MailCheck className="w-10 h-10 text-emerald-400 mx-auto" />
            <h1 className="text-2xl font-extrabold">Check your email</h1>
            <p className="text-sm text-zinc-300">
              If an account exists for <span className="font-semibold text-white">{email.trim()}</span>, we've sent a link to reset its password. The link works once and expires in 1 hour.
            </p>
            <p className="text-xs text-zinc-500">Didn't get it? Check your spam folder, or try again in a few minutes.</p>
            <Link to="/auth/signin" className="inline-flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300">
              <ArrowLeft className="w-4 h-4" /> Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <KeyRound className="w-8 h-8 text-purple-400" />
              <h1 className="text-2xl font-extrabold">Forgot your password?</h1>
              <p className="text-sm text-zinc-400">Enter your account email and we'll send you a link to choose a new password.</p>
            </div>
            <div className="relative">
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                aria-label="Email address"
                className={inputClass}
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
            >
              {loading ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Sending...</> : <>Send reset link <ArrowRight className="w-4 h-4" /></>}
            </button>
            <p className="text-center text-sm text-zinc-400">
              Remembered it? <Link to="/auth/signin" className="text-purple-400 hover:text-purple-300 font-medium">Sign in</Link>
            </p>
          </form>
        )}
      </div>
    </main>
  )
}
