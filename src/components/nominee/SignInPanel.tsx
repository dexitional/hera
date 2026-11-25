import { useRouter } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { BarChart3, KeyRound, Loader2, Megaphone, MessagesSquare, ShieldCheck } from 'lucide-react'
import { nomineeSignInFn } from '#/server/nominee-portal'

const LENGTH = 8
// Same alphabet as the server's codes; anything else is dropped as typed.
const clean = (v: string) => v.toUpperCase().replace(/[^A-HJKMNP-Z2-9]/g, '')

/** Eight one-character boxes acting as one field: type, paste, backspace, arrows. */
function CodeInput({ value, onChange, onComplete, disabled }: {
  value: string
  onChange: (v: string) => void
  onComplete: (v: string) => void
  disabled?: boolean
}) {
  const boxes = useRef<(HTMLInputElement | null)[]>([])
  const focus = (i: number) => boxes.current[Math.max(0, Math.min(LENGTH - 1, i))]?.focus()

  const setAt = (i: number, chars: string) => {
    const next = (value.slice(0, i) + chars + value.slice(i + chars.length)).slice(0, LENGTH)
    onChange(next)
    focus(i + chars.length)
    if (next.length === LENGTH && !next.includes(' ')) onComplete(next)
  }

  return (
    <div className="flex justify-between gap-1.5 sm:gap-2" role="group" aria-label="Access code">
      {Array.from({ length: LENGTH }, (_, i) => (
        <input
          key={i}
          ref={(el) => { boxes.current[i] = el }}
          value={value[i] ?? ''}
          disabled={disabled}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          spellCheck={false}
          maxLength={LENGTH}
          aria-label={`Character ${i + 1} of ${LENGTH}`}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => {
            const chars = clean(e.target.value)
            if (chars) setAt(i, chars)
          }}
          onPaste={(e) => {
            e.preventDefault()
            const chars = clean(e.clipboardData.getData('text'))
            if (chars) setAt(0, chars.slice(0, LENGTH))
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace') {
              e.preventDefault()
              if (value[i]) onChange(value.slice(0, i) + value.slice(i + 1))
              else if (i > 0) { onChange(value.slice(0, i - 1) + value.slice(i)); focus(i - 1) }
            } else if (e.key === 'ArrowLeft') { e.preventDefault(); focus(i - 1) }
            else if (e.key === 'ArrowRight') { e.preventDefault(); focus(i + 1) }
          }}
          className="h-12 w-full min-w-0 rounded-xl border border-white/15 bg-black/30 text-center font-mono text-lg font-bold uppercase text-white caret-purple-400 transition-colors focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 disabled:opacity-50 sm:h-14 sm:text-xl"
        />
      ))}
    </div>
  )
}

const FEATURES = [
  { icon: BarChart3, title: 'Live results', text: 'Your votes, daily trend and rank, updating as votes arrive.' },
  { icon: Megaphone, title: 'Share kit', text: 'Posters, QR code and captions ready for WhatsApp and Instagram.' },
  { icon: MessagesSquare, title: 'Nominees chat', text: 'Talk with other nominees and the organisers in one place.' },
]

export function SignInPanel({ initialCode }: { initialCode?: string }) {
  const router = useRouter()
  const [code, setCode] = useState(clean(initialCode ?? '').slice(0, LENGTH))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const autoTried = useRef(false)

  const signIn = async (value = code) => {
    if (value.length !== LENGTH || busy) return
    setBusy(true)
    setError(null)
    try {
      const r: any = await nomineeSignInFn({ data: { code: value } } as any)
      await router.invalidate()
      await router.navigate({ to: r.activated ? '/nominee-portal' : '/nominee-portal/profile', search: r.activated ? { code: undefined } : undefined } as any)
    } catch (err: any) {
      setError(err?.message || "We couldn't sign you in. Please try again.")
      setBusy(false)
    }
  }

  // Opening the invite link signs straight in.
  useEffect(() => {
    if (!autoTried.current && code.length === LENGTH) {
      autoTried.current = true
      void signIn(code)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl lg:grid-cols-2">
      {/* Brand side */}
      <div className="relative overflow-hidden border-b border-white/10 p-6 sm:p-10 lg:border-b-0 lg:border-r">
        <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-sky-500/10" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-purple-200">
            <ShieldCheck className="h-3.5 w-3.5" /> For nominees
          </span>
          <h1 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight sm:mt-5 sm:text-4xl">Your campaign, in one place.</h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-300 max-sm:hidden!">
            Follow your votes as they come in, share your voting page, and stay in touch with the organisers.
          </p>
          <ul className="mt-8 space-y-5 max-sm:hidden!">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <f.icon className="h-5 w-5 text-purple-300" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">{f.title}</span>
                  <span className="block text-sm text-zinc-400">{f.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Form side */}
      <form onSubmit={(e) => { e.preventDefault(); void signIn() }} className="flex flex-col justify-center gap-6 p-6 sm:p-10">
        <div>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <KeyRound className="h-5 w-5 text-purple-300" />
          </span>
          <h2 className="mt-4 text-xl font-bold text-white">Sign in with your access code</h2>
          <p className="mt-1 text-sm text-zinc-400">Enter the 8-character code from your invite. Pasting works too.</p>
        </div>

        <CodeInput value={code} onChange={(v) => { setCode(v); setError(null) }} onComplete={(v) => void signIn(v)} disabled={busy} />

        {error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-sm text-red-200">{error}</p>}

        <button
          type="submit"
          disabled={busy || code.length !== LENGTH}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition-colors hover:bg-purple-500 disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} {busy ? 'Signing you in…' : 'Sign in'}
        </button>

        <p className="text-xs leading-relaxed text-zinc-500">
          Your code works like a password, so keep it private. Lost it? Ask the event organiser to send you a new one.
        </p>
      </form>
    </div>
  )
}
