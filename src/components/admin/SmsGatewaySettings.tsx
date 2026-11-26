import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Check, Loader2, MessageSquareText, RefreshCw, Send, ShieldAlert } from 'lucide-react'
import { getSmsGatewayFn, sendTestSmsFn, setSmsGatewayFn } from '#/server/platform-sms'
import { toUserMessage } from '#/lib/errors'

/** Super admin card: choose the SMS gateway, fallback, balances and a test send. */
export function SmsGatewaySettings() {
  const queryClient = useQueryClient()
  const [withBalances, setWithBalances] = useState(false)
  const queryKey = ['sms-gateway', withBalances]
  const { data, isFetching } = useQuery({
    queryKey,
    queryFn: () => getSmsGatewayFn({ data: { withBalances } } as any) as Promise<any>,
  })
  const [testPhone, setTestPhone] = useState('')
  const [testProvider, setTestProvider] = useState<string | null>(null)

  const save = useMutation({
    mutationFn: (next: { provider: string; failover: boolean }) => setSmsGatewayFn({ data: next } as any),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sms-gateway'] }),
  })
  const test = useMutation({
    mutationFn: (provider: string) => sendTestSmsFn({ data: { provider, phone: testPhone } } as any),
  })

  const settings = data?.settings
  const providers: any[] = data?.providers ?? []
  const active = providers.find((p) => p.id === settings?.provider)

  return (
    <section className="rounded-xl border border-zinc-800 bg-[#0a192a]/50 p-6 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-white">
            <MessageSquareText className="h-4 w-4 text-purple-400" /> SMS gateway
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Every platform SMS (voter OTPs and invites, nominee invites, vote confirmations, broadcasts) goes through the gateway selected here. Changes apply within 30 seconds.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setWithBalances(true); queryClient.invalidateQueries({ queryKey: ['sms-gateway', true] }) }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-600"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching && withBalances ? 'animate-spin' : ''}`} /> {withBalances ? 'Refresh balances' : 'Check balances'}
        </button>
      </div>

      <div role="radiogroup" aria-label="Active SMS gateway" className="grid gap-3 sm:grid-cols-3">
        {providers.map((p) => {
          const selected = settings?.provider === p.id
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={!p.configured || save.isPending}
              onClick={() => !selected && save.mutate({ provider: p.id, failover: Boolean(settings?.failover) })}
              className={`rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed ${selected ? 'border-purple-500 bg-purple-500/10' : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-600'} ${!p.configured ? 'opacity-50' : ''}`}
            >
              <span className="flex items-center gap-2 text-sm font-bold text-white">
                {p.label}
                {selected && (save.isPending ? <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-purple-400" /> : <Check className="ml-auto h-4 w-4 text-purple-400" />)}
              </span>
              <span className="mt-1 block text-[11px] text-zinc-400">
                {!p.configured ? 'Not configured (no API key)' : selected ? 'Active' : 'Available'}
              </span>
              {p.balance && (
                <span className={`mt-1.5 block font-mono text-[11px] ${p.balance.ok ? (Number(String(p.balance.balance).split(' ')[0]) <= 50 ? 'text-amber-300' : 'text-emerald-400') : 'text-red-400'}`}>
                  {p.balance.ok ? `Balance: ${p.balance.balance}` : `Check failed: ${p.balance.error}`}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <label className="flex items-start gap-2.5 text-xs text-zinc-300 select-none">
        <input
          type="checkbox"
          className="mt-0.5 accent-purple-500"
          checked={Boolean(settings?.failover)}
          disabled={!settings || save.isPending}
          onChange={(e) => save.mutate({ provider: settings.provider, failover: e.target.checked })}
        />
        <span>
          <span className="font-semibold text-white">Fall back to the other gateways if a send fails.</span>{' '}
          Tries the remaining configured gateways in turn. Rarely, a gateway that times out after accepting a message can lead to a duplicate SMS.
        </span>
      </label>

      {save.isError && <p role="alert" className="text-xs text-red-400">{toUserMessage(save.error)}</p>}

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Send a test SMS</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="tel"
            inputMode="tel"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            placeholder="Your phone, e.g. 0241234567"
            className="flex-1 rounded-md border border-zinc-700 bg-[#0a192a]/50 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <select
            value={testProvider ?? settings?.provider ?? ''}
            onChange={(e) => setTestProvider(e.target.value)}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
            aria-label="Gateway to test"
          >
            {providers.filter((p) => p.configured).map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <button
            type="button"
            disabled={!testPhone.trim() || test.isPending}
            onClick={() => test.mutate(testProvider ?? settings?.provider)}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-40"
          >
            {test.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Send test
          </button>
        </div>
        {test.isSuccess && <p role="status" className="text-xs text-emerald-400">Sent. Check the phone for the test message.</p>}
        {test.isError && <p role="alert" className="text-xs text-red-400">{toUserMessage(test.error)}</p>}
        <p className="text-[11px] text-zinc-500">Uses one SMS credit on the chosen gateway. Sender IDs must be approved with each gateway.</p>
      </div>

      {active && !active.configured && (
        <p className="flex items-center gap-2 text-xs text-amber-300"><ShieldAlert className="h-4 w-4" /> The active gateway isn't configured on this server.</p>
      )}
    </section>
  )
}
