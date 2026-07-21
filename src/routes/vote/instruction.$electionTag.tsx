import { getElectionByTagFn } from '#/server/tenant-elections'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, Navigate } from '@tanstack/react-router'
import {
  ArrowLeft, ArrowRight, CheckCircle2, KeyRound, ListChecks,
  Mail, Moon, Printer, Search, Send, ShieldCheck, Smartphone, Sun, User,
} from 'lucide-react'
import moment from 'moment'
import { useEffect, useState } from 'react'

const electionQueryOptions = (tag: any) => ({
  queryKey: ['election-page', tag],
  queryFn: () => getElectionByTagFn({ data: tag }),
})

export const Route = createFileRoute('/vote/instruction/$electionTag')({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    return await context.queryClient.ensureQueryData(electionQueryOptions(params.electionTag))
  },
  head: ({ loaderData }: any) => ({
    meta: [
      { title: 'HOW TO VOTE' },
      { name: 'description', content: loaderData?.[0]?.title || 'Voting instructions' },
    ],
  }),
})

function RouteComponent() {
  const { electionTag } = Route.useParams()
  const { data }: any = useSuspenseQuery(electionQueryOptions(electionTag))

  if (!data?.length) return <Navigate to="/elections" />

  return <VotingInstructions election={data[0]} />
}

// ==========================================
// THEME
// ==========================================
// Mirrors __root.tsx's boot script: same 'theme' localStorage key, same
// classList/data-theme contract, so a toggle here composes with that script
// (and with any other toggle added elsewhere later) instead of fighting it.
function useTheme() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggle = () => {
    const next = isDark ? 'light' : 'dark'
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(next)
    root.setAttribute('data-theme', next)
    root.style.colorScheme = next
    window.localStorage.setItem('theme', next)
    setIsDark(next === 'dark')
  }

  return { isDark, toggle }
}

// ==========================================
// STEP MOCKUP ILLUSTRATIONS
// ==========================================
// Small stylized "screenshots" built from real UI chrome (browser bar, form
// fields, candidate rows, receipt) rather than a repeated icon-in-a-box, so
// each step actually previews the screen it describes.

function BrowserFrame({ children, url }: { children: React.ReactNode; url?: string }) {
  return (
    <div className="w-full h-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0d1c30] overflow-hidden flex flex-col shadow-sm">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-black/5 dark:border-white/5 bg-black/2 dark:bg-white/3">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400/70 shrink-0" />
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70 shrink-0" />
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70 shrink-0" />
        {url ? (
          <span className="ml-1.5 flex-1 min-w-0 rounded-lg bg-black/4 dark:bg-white/10 px-2 py-1 text-[7.5px] leading-tight font-medium text-black/60 dark:text-white/60 whitespace-normal break-all">
            {url}
          </span>
        ) : (
          <span className="ml-2 h-2 flex-1 max-w-28 rounded-full bg-black/10 dark:bg-white/10" />
        )}
      </div>
      <div className="flex-1 flex items-center justify-center p-5">{children}</div>
    </div>
  )
}

function LinkVisual({ url }: { url: string }) {
  return (
    <BrowserFrame url={url}>
      <div className="w-full space-y-2.5">
        <div className="h-2 w-4/5 rounded-full bg-purple-400/60" />
        <div className="h-2 w-3/5 rounded-full bg-black/10 dark:bg-white/15" />
        <div className="h-2 w-full rounded-full bg-black/10 dark:bg-white/15" />
      </div>
    </BrowserFrame>
  )
}

function CredentialSignInVisual({ userLabel, passLabel }: { userLabel: string; passLabel: string }) {
  return (
    <BrowserFrame>
      <div className="w-full space-y-3">
        <div>
          <span className="block text-[9px] font-bold uppercase tracking-wider text-black/40 dark:text-white/40 mb-1">{userLabel}</span>
          <div className="h-5 w-full rounded-md border border-black/15 dark:border-white/20 bg-black/3 dark:bg-white/5" />
        </div>
        <div>
          <span className="block text-[9px] font-bold uppercase tracking-wider text-black/40 dark:text-white/40 mb-1">{passLabel}</span>
          <div className="h-5 w-full rounded-md border border-black/15 dark:border-white/20 bg-black/3 dark:bg-white/5" />
        </div>
        <div className="h-5 w-full rounded-md bg-purple-400" />
      </div>
    </BrowserFrame>
  )
}

function OtpSignInVisual({ userLabel }: { userLabel: string }) {
  return (
    <BrowserFrame>
      <div className="w-full space-y-3">
        <div>
          <span className="block text-[9px] font-bold uppercase tracking-wider text-black/40 dark:text-white/40 mb-1">{userLabel}</span>
          <div className="h-5 w-full rounded-md border border-black/15 dark:border-white/20 bg-black/3 dark:bg-white/5" />
        </div>
        <div className="flex gap-1.5 justify-center pt-1">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="w-4 h-6 rounded-md border border-black/15 dark:border-white/20 bg-black/3 dark:bg-white/5" />
          ))}
        </div>
      </div>
    </BrowserFrame>
  )
}

function GoogleSignInVisual() {
  return (
    <BrowserFrame>
      <div className="flex items-center gap-2 rounded-md border border-black/15 dark:border-white/20 bg-white dark:bg-white px-3.5 py-2.5 shadow-sm">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#18181b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.945 11a9 9 0 1 1 -3.284 -5.997l-2.655 2.392a5.5 5.5 0 1 0 2.119 6.605h-4.125v-3h7.945"></path>
        </svg>
        <span className="text-[9px] font-bold text-black/70">Login with Google Account</span>
      </div>
    </BrowserFrame>
  )
}

// Mirrors LiveBallotSimulation's actual layout: one position at a time, a
// grid of photo-first candidate cards, the chosen one picked out with a
// purple ring + checkmark badge on the photo -- not a generic radio list.
function BallotVisual() {
  return (
    <BrowserFrame>
      <div className="w-full space-y-1.5">
        <div className="h-1.5 w-2/5 rounded-full bg-black/15 dark:bg-white/20" />
        <div className="grid grid-cols-3 gap-1.5">
          {[0, 1, 2].map((i) => {
            const isSelected = i === 1
            return (
              <div
                key={i}
                className={`rounded-md border overflow-hidden ${isSelected ? 'border-purple-400 ring-1 ring-purple-400/30' : 'border-black/10 dark:border-white/15'}`}
              >
                <div className="h-7 bg-black/5 dark:bg-white/10 relative flex items-center justify-center">
                  <User className="w-2.5 h-2.5 text-black/20 dark:text-white/25" />
                  {isSelected && (
                    <span className="absolute top-0.5 right-0.5 bg-purple-400 rounded-full p-[1.5px] shadow-sm">
                      <CheckCircle2 className="w-2 h-2 text-white" />
                    </span>
                  )}
                </div>
                <div className="h-1 mx-1 my-1 rounded-full bg-black/15 dark:bg-white/20" />
              </div>
            )
          })}
        </div>
      </div>
    </BrowserFrame>
  )
}

// Mirrors LiveBallotSimulation's "FINAL STEP SUMMARY CONFIRMATION MODULE":
// one thumbnail + position label + chosen-candidate row per position
// (abstained ones called out in amber), then the actual green "confirm &
// cast" submit button.
function ReviewVisual() {
  const rows = [
    { label: 'PRESIDENT', value: 'A. Mensah', abstained: false },
    { label: 'CHAIRMAN', value: 'Abstained', abstained: true },
  ]
  return (
    <BrowserFrame>
      <div className="w-full space-y-1.5">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-1.5 rounded-md border border-black/10 dark:border-white/10 px-1.5 py-1">
            <div className="w-4 h-4 rounded bg-black/5 dark:bg-white/10 flex items-center justify-center shrink-0">
              <User className="w-2 h-2 text-black/25 dark:text-white/30" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-[5.5px] font-bold uppercase tracking-wider text-purple-400">{row.label}</span>
              <span className={`block text-[7px] font-bold truncate ${row.abstained ? 'text-amber-500' : 'text-black/70 dark:text-white/80'}`}>
                {row.value}
              </span>
            </div>
          </div>
        ))}
        <div className="h-5 w-full rounded-md bg-emerald-600 flex items-center justify-center text-white text-[6px] font-bold uppercase tracking-wide">
          Confirm &amp; Cast Ballot
        </div>
      </div>
    </BrowserFrame>
  )
}

function SuccessVisual() {
  return (
    <BrowserFrame>
      <div className="flex flex-col items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-emerald-500" strokeWidth={1.5} />
        </div>
        <div className="h-1.5 w-20 rounded-full bg-black/10 dark:bg-white/15" />
      </div>
    </BrowserFrame>
  )
}

function ReceiptVisual() {
  return (
    <BrowserFrame>
      <div className="flex flex-col items-center gap-1.5">
        <Mail className="w-9 h-9 text-emerald-500" strokeWidth={1.5} />
        <div className="h-1.5 w-20 rounded-full bg-black/10 dark:bg-white/15" />
        <div className="h-1.5 w-14 rounded-full bg-black/10 dark:bg-white/15" />
      </div>
    </BrowserFrame>
  )
}

// ==========================================
// PAGE
// ==========================================

function VotingInstructions({ election }: any) {
  const { isDark, toggle } = useTheme()
  const authMode = (election?.authMode || 'credential').toLowerCase()
  const userLabel = election?.placeholder?.username || 'Username'
  const passLabel = election?.placeholder?.password || 'Password'

  const signInStep = (() => {
    if (authMode === 'google') {
      return {
        title: 'Sign in with Google',
        description: "Tap “Login with Google Account” and choose the Google account you registered with. There's no password to remember.",
        icon: CheckCircle2,
        visual: <GoogleSignInVisual />,
      }
    }
    if (authMode === 'otp' || authMode === 'aotp') {
      return {
        title: `Enter your ${userLabel.toLowerCase()} and verify`,
        description: `Type in your ${userLabel.toLowerCase()}, then enter the one-time code sent to your registered phone${authMode === 'aotp' ? ' (by SMS or voice call)' : ' by SMS'}. The code expires after a few minutes, so keep your phone nearby.`,
        icon: Smartphone,
        visual: <OtpSignInVisual userLabel={userLabel} />,
      }
    }
    return {
      title: `Enter your ${userLabel.toLowerCase()} and ${passLabel.toLowerCase()}`,
      description: `Use the ${userLabel.toLowerCase()} and ${passLabel.toLowerCase()} sent to you by the election administrator. Forgot your ${userLabel.toLowerCase()}? You can look it up by name before you begin.`,
      icon: KeyRound,
      visual: <CredentialSignInVisual userLabel={userLabel} passLabel={passLabel} />,
    }
  })()

  const steps = [
    {
      title: 'Open your voting link',
      description: `Visit the link shared with you for ${election.title}. It works on any phone, tablet, or computer — no app to install.`,
      icon: Search,
      visual: <LinkVisual url={`heravote.com/vote/election?page=${election.tag}`} />,
    },
    signInStep,
    {
      title: 'Make your selections',
      description: 'Go through each position one at a time and choose your preferred candidate. You may abstain on any position — it will still count as a valid, recorded choice.',
      icon: ListChecks,
      visual: <BallotVisual />,
    },
    {
      title: 'Review and submit',
      description: "Double check your choices on the review screen. Once you submit, your ballot is final and locked — you won't be able to vote again in this election.",
      icon: ShieldCheck,
      visual: <ReviewVisual />,
    },
    ...(authMode === 'google'
      ? [{
          title: 'Get your emailed receipt',
          description: 'Because you signed in with Google, a confirmation receipt — your selections, timestamp, and submission details — is sent straight to your inbox.',
          icon: Send,
          visual: <ReceiptVisual />,
        }]
      : [{
          title: "You're done",
          description: 'A confirmation appears on screen the moment your ballot is recorded. Thank you for voting.',
          icon: Send,
          visual: <SuccessVisual />,
        }]),
  ]

  return (
    <div className="min-h-screen bg-[#f3f5fa] dark:bg-[#0a192a] text-[#0a192a] dark:text-white transition-colors duration-300 print:bg-white print:text-black">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 print:hidden backdrop-blur-md bg-[#f3f5fa]/80 dark:bg-[#0a192a]/80 border-b border-black/5 dark:border-white/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 h-14 flex items-center justify-between">
          <Link
            to="/vote/election"
            search={{ page: election.tag }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-black/50 dark:text-white/50 hover:text-purple-400 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
          </Link>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => window.print()}
              title="Print instructions"
              className="p-2 rounded-lg text-black/50 dark:text-white/50 hover:text-purple-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={toggle}
              title="Toggle theme"
              className="p-2 rounded-lg text-black/50 dark:text-white/50 hover:text-purple-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-14 print:py-6 print:px-2 flex flex-col gap-14 print:gap-6">
        {/* Header */}
        <header className="text-center flex flex-col items-center gap-3">
          {election.imageUrl ? (
            <img
              src={election.imageUrl}
              alt={election.title}
              className="w-fit h-20 rounded-2xl object-cover shadow-lg shadow-black/10 dark:shadow-black/40 ring-1 ring-black/5 dark:ring-white/10"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-purple-400 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {election.title?.charAt(0)?.toUpperCase()}
            </div>
          )}
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-purple-400">
            Voting Instructions
          </p>
          <h1
            style={{ fontFamily: "'Fraunces', serif" }}
            className="text-3xl sm:text-4xl font-medium tracking-tight text-balance"
          >
            How to vote in {election.title}
          </h1>
          <p className="text-sm text-black/50 dark:text-white/50">
            {election.tag?.replaceAll('-', ' ')?.toUpperCase()}
            {election.startAt && election.endAt && (
              <> &middot; {moment(election.startAt).format('MMM D')} &ndash; {moment(election.endAt).format('MMM D, YYYY')}</>
            )}
          </p>
        </header>

        {/* Steps */}
        <ol className="relative flex flex-col gap-10 print:gap-4">
          {steps.map((step, i) => {
            const Icon = step.icon
            const isLast = i === steps.length - 1
            return (
              <li key={i} className="relative pl-[4.5rem] sm:pl-20 print:break-inside-avoid">
                {!isLast && (
                  <span className="absolute left-[1.75rem] sm:left-[2rem] top-14 bottom-[-2.5rem] w-px bg-gradient-to-b from-black/15 dark:from-white/15 to-transparent print:hidden" />
                )}
                <span
                  style={{ fontFamily: "'Fraunces', serif" }}
                  className="absolute left-0 top-0 w-14 h-14 rounded-2xl bg-white dark:bg-[#112240] border border-black/10 dark:border-white/10 shadow-sm flex items-center justify-center text-xl font-medium text-purple-400"
                >
                  {i + 1}
                </span>
                <div className="flex items-start gap-4 min-h-14">
                  <div className="flex-1 min-w-0 pt-1.5">
                    <h2 className="flex items-center gap-2 text-base sm:text-lg font-semibold tracking-tight mb-1.5">
                      <Icon className="w-4 h-4 text-purple-400 shrink-0" />
                      {step.title}
                    </h2>
                    <p className="text-sm leading-relaxed text-black/60 dark:text-white/60 max-w-md text-pretty">
                      {step.description}
                    </p>
                  </div>
                  <div className="hidden sm:block w-72 h-36 shrink-0 print:hidden">
                    {step.visual}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>

        {/* CTA */}
        <div className="pt-2 border-t border-black/10 dark:border-white/10 flex flex-col items-center gap-4 text-center print:hidden">
          <Link
            to="/vote/election"
            search={{ page: election.tag }}
            className="group inline-flex items-center gap-2 rounded-full bg-purple-400 hover:bg-purple-500 text-white text-sm font-semibold px-7 py-3.5 shadow-lg shadow-purple-400/25 transition-all active:scale-[0.97] mt-6"
          >
            Start Voting
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          {authMode !== 'google' && election.showFeed && (
            <Link
              to="/vote/register/$electionTag"
              params={{ electionTag: election.tag }}
              className="text-xs font-medium text-black/50 dark:text-white/50 hover:text-purple-400 transition-colors"
            >
              Forgot your {userLabel.toLowerCase()}? Look it up here
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}
