import { useCallback, useEffect, useRef, useState } from 'react'

export type ChatMessage = {
  id: string
  body: string | null
  deleted: boolean
  pinned: boolean
  createdAt: string
  updatedAt: string
  author: { type: 'nominee' | 'admin'; contestantId: string | null; name: string; imageUrl: string | null; category: string | null }
}

type Page = { messages: ChatMessage[]; cursor: string | null; full: boolean }

/** Applies a page of new/changed messages: deleted ones drop out, the rest replace by id. */
export function mergeMessages(current: Map<string, ChatMessage>, page: ChatMessage[], full: boolean) {
  const next = full ? new Map<string, ChatMessage>() : new Map(current)
  for (const m of page) {
    if (m.deleted) next.delete(m.id)
    else next.set(m.id, m)
  }
  return next
}

export const sortMessages = (m: Map<string, ChatMessage>) => [...m.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt))

/**
 * Loads a chat room and keeps it fresh by polling with a cursor. Polls every
 * `intervalMs` while the tab is visible and straight away when it becomes
 * visible again. `load(null)` must return the full room.
 */
export function useChatRoom<T extends Page>(load: (since: string | null) => Promise<T>, intervalMs = 4000) {
  const [messages, setMessages] = useState<Map<string, ChatMessage>>(new Map())
  const [latest, setLatest] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const cursor = useRef<string | null>(null)
  const inFlight = useRef(false)
  // A refresh asked for mid-poll (e.g. right after sending) runs as soon as it ends.
  const pending = useRef(false)
  const loadRef = useRef(load)
  loadRef.current = load

  const poll = useCallback(async (full = false): Promise<void> => {
    if (inFlight.current) { pending.current = true; return }
    inFlight.current = true
    try {
      const page = await loadRef.current(full ? null : cursor.current)
      cursor.current = page.cursor ?? cursor.current
      setMessages((m) => mergeMessages(m, page.messages, page.full))
      setLatest(page)
      setError(null)
    } catch (e: any) {
      setError(e?.message || 'Connection lost. Retrying…')
    } finally {
      inFlight.current = false
      if (pending.current) { pending.current = false; void poll() }
    }
  }, [])

  useEffect(() => {
    void poll(true)
    const tick = () => { if (document.visibilityState === 'visible') void poll() }
    const timer = setInterval(tick, intervalMs)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [poll, intervalMs])

  return { messages: sortMessages(messages), latest, error, refresh: () => poll() }
}
