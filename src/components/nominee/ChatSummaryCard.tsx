import { Link } from '@tanstack/react-router'
import { ChevronRight, MessagesSquare } from 'lucide-react'
import { PANEL } from './NomineeDashboard'
import { useChatSummary } from './usePortalData'

export { chatSeenKey } from './usePortalData'

/** Portal home entry to the group chat: unread count and the latest message. */
export function ChatSummaryCard({ contestantId }: { contestantId: string }) {
  const { data } = useChatSummary(contestantId)
  const latest = data?.latest
  const unread: number = data?.unread ?? 0

  return (
    <Link to="/nominee-portal/chat" className={`${PANEL} group block p-5 transition-colors hover:border-purple-400/40`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white">
          <MessagesSquare className="h-4 w-4 text-purple-300" /> Nominees' chat
        </h3>
        <span className="flex items-center gap-2">
          {unread > 0 && (
            <span className="rounded-full bg-purple-600 px-2 py-0.5 text-[11px] font-bold text-white">
              {unread}{data?.unreadCapped ? '+' : ''} new
            </span>
          )}
          <ChevronRight className="h-4 w-4 text-zinc-500 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
      {latest ? (
        <p className="mt-3 line-clamp-2 text-sm text-zinc-300">
          <span className={`font-semibold ${latest.author.type === 'admin' ? 'text-amber-300' : 'text-zinc-100'}`}>{latest.author.name}: </span>
          {latest.body}
        </p>
      ) : (
        <p className="mt-3 text-sm text-zinc-400">Talk with the other nominees and organisers. Raise questions or concerns.</p>
      )}
    </Link>
  )
}
