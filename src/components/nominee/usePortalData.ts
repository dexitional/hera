import { useQuery } from '@tanstack/react-query'
import { getNomineeDashboardFn } from '#/server/nominee-portal'
import { getNomineeChatSummaryFn } from '#/server/nominee-chat'

/** localStorage key for the newest chat message this nominee has seen. */
export const chatSeenKey = (contestantId: string) => `hv-nominee-chat-seen:${contestantId}`

const readLocal = (key: string) => {
  try { return localStorage.getItem(key) } catch { return null }
}

/** Shared, live dashboard data (one poll for the whole portal). */
export function useNomineeDashboard() {
  return useQuery({
    queryKey: ['nominee-dashboard'],
    queryFn: () => getNomineeDashboardFn() as Promise<any>,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  })
}

/** Unread chat count and latest message, for the tab badge and home card. */
export function useChatSummary(contestantId: string | undefined) {
  return useQuery({
    queryKey: ['nominee-chat-summary', contestantId],
    queryFn: () => getNomineeChatSummaryFn({ data: { since: readLocal(chatSeenKey(contestantId!)) } } as any) as Promise<any>,
    enabled: Boolean(contestantId),
    refetchInterval: 20_000,
  })
}
