import * as DialogPrimitive from '@radix-ui/react-dialog'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Check, Copy, KeyRound, Loader2, MessageSquareText, RotateCcw, Send, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { nomineeInviteFn } from '#/server/nominee-portal'

export type InviteTarget = { id: string; name: string; phone: string | null; eventId: string }

type InviteResult = {
  code: string
  link: string
  smsSent: boolean
  sentTo: string | null
  hasPhone: boolean
  activated: boolean
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          // Clipboard blocked: the value is selectable on screen.
        }
      }}
      aria-label={`Copy ${label}`}
      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] font-medium text-zinc-300 hover:border-zinc-600 hover:text-white"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

/**
 * Invite a nominee to the portal: shows their access code and link (created on
 * open if they don't have one yet), and sends them by SMS on request.
 */
export function NomineeInviteDialog({ target, onClose }: { target: InviteTarget | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [result, setResult] = useState<InviteResult | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const invite = useMutation({
    mutationFn: (action: 'prepare' | 'sms' | 'reset') =>
      nomineeInviteFn({ data: { contestantId: target!.id, action } } as any) as Promise<InviteResult>,
    onSuccess: (r) => {
      setResult(r)
      queryClient.invalidateQueries({ queryKey: ['contestants-admin'] })
    },
  })

  useEffect(() => {
    setResult(null)
    setConfirmReset(false)
    invite.reset()
    if (target) invite.mutate('prepare')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.id])

  const message = result
    ? `Hi ${target?.name}, you're a nominee on Heravote. Complete your profile and follow your votes here: ${result.link} . Your access code: ${result.code}. Keep it private.`
    : ''

  return (
    <DialogPrimitive.Root open={target !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-800 bg-[#0b1420] p-5 shadow-2xl focus:outline-none">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogPrimitive.Title className="flex items-center gap-2 text-sm font-bold text-white">
                <KeyRound className="h-4 w-4 text-purple-400" /> Invite {target?.name}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 text-xs text-zinc-400">
                The nominee opens the link, signs in with their phone and this code, and completes their profile.
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close aria-label="Close" className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white">
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          {!result && invite.isPending && (
            <div className="flex items-center gap-2 py-8 text-xs text-zinc-400"><Loader2 className="h-4 w-4 animate-spin" /> Preparing access…</div>
          )}

          {result && (
            <div className="mt-4 space-y-3">
              {result.activated && (
                <p className="rounded-md border border-emerald-900/40 bg-emerald-950/20 px-3 py-2 text-[11px] text-emerald-300">
                  This nominee has already signed in and completed their profile.
                </p>
              )}
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Access code</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="select-all font-mono text-lg font-black tracking-[0.2em] text-white">{result.code}</span>
                  <CopyButton value={result.code} label="access code" />
                </div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Portal link</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="select-all truncate font-mono text-xs text-zinc-300">{result.link}</span>
                  <CopyButton value={message} label="invite message" />
                </div>
              </div>

              {result.smsSent && (
                <p role="status" className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <Check className="h-3.5 w-3.5" /> Invite sent by SMS to {result.sentTo}.
                </p>
              )}
              {invite.isError && (
                <p role="alert" className="text-xs text-red-400">{(invite.error as any)?.message || 'Something went wrong.'}</p>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                {result.hasPhone ? (
                  <button
                    type="button"
                    onClick={() => invite.mutate('sms')}
                    disabled={invite.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
                  >
                    {invite.isPending && invite.variables === 'sms' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    {result.smsSent ? 'Send again' : 'Send by SMS'}
                  </button>
                ) : (
                  <Link
                    to="/admin/events/$eventId/contestants/$contestantId/edit"
                    params={{ eventId: target!.eventId, contestantId: target!.id }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white"
                  >
                    Add a phone to send by SMS
                  </Link>
                )}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(message)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 hover:border-zinc-600 hover:text-white"
                >
                  <MessageSquareText className="h-3.5 w-3.5 text-emerald-400" /> WhatsApp
                </a>
                {confirmReset ? (
                  <button
                    type="button"
                    onClick={() => { setConfirmReset(false); invite.mutate('reset') }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs font-semibold text-red-300 hover:text-white"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Confirm: new code, sign out old
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-200"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reset code
                  </button>
                )}
              </div>
            </div>
          )}

          {!result && invite.isError && (
            <p role="alert" className="mt-4 text-xs text-red-400">{(invite.error as any)?.message || 'Could not prepare an invite.'}</p>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
