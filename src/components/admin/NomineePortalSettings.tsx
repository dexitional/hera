import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Check, EyeOff, Loader2, MessagesSquare, Trophy, UserRound, UsersRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { getNomineePortalSettingsFn, setNomineeResultsViewFn } from '#/server/nominee-portal'

type View = 'hidden' | 'own' | 'standings'

const OPTIONS: { value: View; label: string; text: string; icon: LucideIcon }[] = [
  { value: 'hidden', label: 'Hidden', text: 'Nominees see no vote figures.', icon: EyeOff },
  { value: 'own', label: 'Own votes + rank', text: 'Their votes, daily trend and position in the category.', icon: UserRound },
  { value: 'standings', label: 'Full standings', text: 'Also every nominee’s votes in their category.', icon: Trophy },
]

/** Event console card: what nominees see on their portal dashboards. */
export function NomineePortalSettings({ eventId }: { eventId: string }) {
  const queryClient = useQueryClient()
  const queryKey = ['nominee-portal-settings', eventId]
  const { data } = useQuery({
    queryKey,
    queryFn: () => getNomineePortalSettingsFn({ data: { eventId } } as any),
  })
  const save = useMutation({
    mutationFn: (view: View) => setNomineeResultsViewFn({ data: { eventId, view } } as any),
    onMutate: async (view) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (d: any) => (d ? { ...d, view } : d))
      return { previous }
    },
    onError: (_e, _v, ctx) => queryClient.setQueryData(queryKey, ctx?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })

  return (
    <section className="rounded-xl border border-zinc-800 bg-[#0a192a]/50 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-400">
            <UsersRound className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Nominee portal</h4>
            <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
              Choose what nominees see about votes on their dashboard. Changes apply immediately.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <Link
            to="/admin/events/$eventId/chat"
            params={{ eventId }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:border-zinc-600 hover:text-white"
          >
            <MessagesSquare className="h-3.5 w-3.5 text-purple-400" /> Open group chat
          </Link>
          {data && (
            <Link to="/admin/events/$eventId/contestants" params={{ eventId }} className="text-xs text-zinc-400 hover:text-white">
              <span className="font-mono font-bold text-zinc-200">{data.active}</span> active ·{' '}
              <span className="font-mono font-bold text-zinc-200">{data.invited}</span> invited of {data.nominees} nominees
            </Link>
          )}
        </div>
      </div>

      <div role="radiogroup" aria-label="What nominees see" className="mt-4 grid gap-3 sm:grid-cols-3">
        {OPTIONS.map((o) => {
          const selected = data?.view === o.value
          const Icon = o.icon
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={!data}
              onClick={() => !selected && save.mutate(o.value)}
              className={`relative rounded-lg border p-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-50 ${
                selected ? 'border-purple-500 bg-purple-500/10' : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-600'
              }`}
            >
              <span className="flex items-center gap-2 text-xs font-bold text-white">
                <Icon className={`h-4 w-4 ${selected ? 'text-purple-400' : 'text-zinc-500'}`} /> {o.label}
                {selected && (save.isPending ? <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-purple-400" /> : <Check className="ml-auto h-3.5 w-3.5 text-purple-400" />)}
              </span>
              <span className="mt-1 block text-[11px] leading-snug text-zinc-400">{o.text}</span>
            </button>
          )
        })}
      </div>
      {save.isError && <p role="alert" className="mt-3 text-xs text-red-400">{(save.error as any)?.message || 'Could not save. Please try again.'}</p>}
    </section>
  )
}
