import { createFileRoute, Link } from '@tanstack/react-router'
import { authErrorMessage } from '#/lib/errors'
import { useState } from 'react'
import z from 'zod'
import { ArrowRight, CheckCircle2, Eye, EyeOff, LoaderCircle, Lock, ShieldAlert } from 'lucide-react'
import { authClient } from '#/lib/auth-client'

// Landing page for the emailed reset link. better-auth validates the token,
// then redirects here with ?token=... (or ?error=INVALID_TOKEN when the link
// is expired, already used, or malformed).
export const Route = createFileRoute('/auth/reset-password')({
  validateSearch: z.object({
    token: z.string().optional(),
    error: z.string().optional(),
  }),
  component: ResetPassword,
})

const MIN_LENGTH = 8
const inputClass =
  'w-full px-4 py-3 pl-10 pr-10 bg-slate-600/10 rounded-xl border border-slate-600/20 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-white placeholder-zinc-400'

function ResetPassword() {
  const { token, error: linkError } = Route.useSearch()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const invalidLink = !token || !!linkError

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < MIN_LENGTH) return setError(`Use at least ${MIN_LENGTH} characters.`)
    if (password !== confirm) return setError("The two passwords don't match.")
    setLoading(true)
    try {
      const { error } = await authClient.resetPassword({ newPassword: password, token: token! })
      if (error) {
        setError(
          /token/i.test(error.message ?? '') || error.code === 'INVALID_TOKEN'
            ? 'This reset link has expired or was already used. Request a new one.'
            : authErrorMessage(error, "We couldn't reset your password. Please try again."),
        )
      } else {
        setDone(true)
      }
    } catch {
      setError('Could not reset your password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[70vh] bg-[#0d1f36] text-white flex items-start justify-center px-4 pt-6 sm:pt-16 pb-16">
      <div className="w-full max-w-md bg-slate-600/10 border border-slate-600/20 rounded-2xl p-8 shadow-xl">
        {done ? (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h1 className="text-2xl font-extrabold">Password changed</h1>
            <p className="text-sm text-zinc-300">Your password has been reset and you've been signed out of every device. Sign in with your new password.</p>
            <Link to="/auth/signin" className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 bg-purple-500 hover:bg-purple-600 rounded-xl font-semibold">
              Sign in <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : invalidLink ? (
          <div className="space-y-4 text-center">
            <ShieldAlert className="w-10 h-10 text-amber-400 mx-auto" />
            <h1 className="text-2xl font-extrabold">Link expired or invalid</h1>
            <p className="text-sm text-zinc-300">Password reset links work once and expire after 1 hour. Request a new link to continue.</p>
            <Link to="/auth/forgot-password" className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 bg-purple-500 hover:bg-purple-600 rounded-xl font-semibold">
              Request a new link <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Lock className="w-8 h-8 text-purple-400" />
              <h1 className="text-2xl font-extrabold">Choose a new password</h1>
              <p className="text-sm text-zinc-400">At least {MIN_LENGTH} characters. You'll be signed out of every device afterwards.</p>
            </div>
            {[
              { value: password, set: setPassword, label: 'New password', auto: 'new-password' },
              { value: confirm, set: setConfirm, label: 'Confirm new password', auto: 'new-password' },
            ].map((f) => (
              <div key={f.label} className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  required
                  minLength={MIN_LENGTH}
                  maxLength={128}
                  autoComplete={f.auto}
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  placeholder={f.label}
                  aria-label={f.label}
                  className={inputClass}
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
              </div>
            ))}
            <button type="button" onClick={() => setShow((s) => !s)} className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white">
              {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />} {show ? 'Hide' : 'Show'} passwords
            </button>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
            >
              {loading ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Saving...</> : 'Reset password'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
