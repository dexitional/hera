import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowDown, ImagePlus, Loader2, Lock, Megaphone, MicOff, MoreVertical, Pin, PinOff, SendHorizontal, ShieldCheck, Trash2, X } from 'lucide-react'
import { RichMedia, RichText } from '#/components/media/MediaEmbed'
import type { ChatMessage } from './useChatRoom'

// One chat surface for both sides of the nominee group chat. Written with the
// admin's zinc classes, which the admin light theme remaps; the public portal
// is always dark.

const MAX_LENGTH = 1000
const MAX_PHOTO_BYTES = 10 * 1024 * 1024
const GROUP_GAP_MS = 5 * 60_000

const dayLabel = (iso: string) => {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today.getTime() - 86_400_000)
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString()
  if (same(d, today)) return 'Today'
  if (same(d, yesterday)) return 'Yesterday'
  return d.toLocaleDateString('en-GH', { weekday: 'short', day: 'numeric', month: 'short', year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric' })
}
const time = (iso: string) => new Date(iso).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')

function Avatar({ m }: { m: ChatMessage }) {
  if (m.author.type === 'admin') {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/15 text-amber-300">
        <ShieldCheck className="h-4 w-4" />
      </span>
    )
  }
  return m.author.imageUrl ? (
    <img src={m.author.imageUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
  ) : (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[11px] font-bold text-zinc-200">{initials(m.author.name)}</span>
  )
}

export type ChatRoomProps = {
  messages: ChatMessage[]
  loading: boolean
  /** Whose messages are "mine": a contestant id, or "admin" for every organiser message. */
  mine: (m: ChatMessage) => boolean
  canPost: boolean
  /** Shown in place of the composer when posting isn't allowed. */
  blockedReason?: string
  onSend: (body: string, options: { announce: boolean; image: File | null }) => Promise<void>
  /** Delete is offered on messages this returns true for. */
  canDelete: (m: ChatMessage) => boolean
  onDelete: (m: ChatMessage) => Promise<void>
  /** Admin only. */
  onPin?: (m: ChatMessage, pinned: boolean) => Promise<void>
  onMute?: (contestantId: string) => Promise<void>
  /** Admin composer extra: post as a pinned announcement. */
  announceToggle?: boolean
  error?: string | null
  placeholder?: string
  emptyText?: string
}

export function ChatRoom({
  messages, loading, mine, canPost, blockedReason, onSend, canDelete, onDelete, onPin, onMute,
  announceToggle, error, placeholder = 'Write a message…', emptyText = 'No messages yet. Say hello!',
}: ChatRoomProps) {
  const scroller = useRef<HTMLDivElement>(null)
  const textarea = useRef<HTMLTextAreaElement>(null)
  const atBottom = useRef(true)
  const [unseen, setUnseen] = useState(0)
  const [draft, setDraft] = useState('')
  const [announce, setAnnounce] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const [photo, setPhoto] = useState<{ file: File; url: string } | null>(null)
  const photoInput = useRef<HTMLInputElement>(null)

  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo.url) }, [photo])

  const pickPhoto = (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return setSendError('Only photos can be attached. Paste a link to share a video.')
    if (file.size > MAX_PHOTO_BYTES) return setSendError('That photo is over 10 MB. Please choose a smaller one.')
    setSendError(null)
    setPhoto({ file, url: URL.createObjectURL(file) })
    textarea.current?.focus()
  }
  const clearPhoto = () => {
    setPhoto(null)
    if (photoInput.current) photoInput.current.value = ''
  }
  const lastCount = useRef(0)

  const pinned = messages.filter((m) => m.pinned)

  // Stick to the bottom when already there; otherwise count what arrived below.
  useLayoutEffect(() => {
    const el = scroller.current
    if (!el) return
    const added = messages.length - lastCount.current
    if (atBottom.current || lastCount.current === 0) {
      el.scrollTop = el.scrollHeight
      setUnseen(0)
    } else if (added > 0) {
      setUnseen((u) => u + added)
    }
    lastCount.current = messages.length
  }, [messages])

  useEffect(() => {
    if (!menuFor) return
    const close = () => setMenuFor(null)
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [menuFor])

  const onScroll = () => {
    const el = scroller.current!
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    if (atBottom.current) setUnseen(0)
  }
  const jumpDown = () => {
    const el = scroller.current!
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }

  const autosize = () => {
    const t = textarea.current
    if (!t) return
    t.style.height = 'auto'
    t.style.height = `${Math.min(t.scrollHeight, 160)}px`
  }

  const send = async () => {
    const body = draft.trim()
    if ((!body && !photo) || sending) return
    setSending(true)
    setSendError(null)
    try {
      await onSend(body, { announce, image: photo?.file ?? null })
      setDraft('')
      setAnnounce(false)
      clearPhoto()
      atBottom.current = true
      requestAnimationFrame(autosize)
    } catch (e: any) {
      setSendError(e?.message || 'Message not sent. Try again.')
    } finally {
      setSending(false)
      textarea.current?.focus()
    }
  }

  // Render rows with day separators and author grouping.
  const rows: React.ReactNode[] = []
  let prev: ChatMessage | null = null
  for (const m of messages) {
    const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString()
    if (newDay) {
      rows.push(
        <div key={`d-${m.id}`} className="my-3 flex items-center gap-3" role="separator">
          <span className="h-px flex-1 bg-zinc-800" />
          <span className="text-[11px] font-semibold text-zinc-500">{dayLabel(m.createdAt)}</span>
          <span className="h-px flex-1 bg-zinc-800" />
        </div>,
      )
    }
    const sameAuthor = !newDay && prev && prev.author.type === m.author.type && prev.author.contestantId === m.author.contestantId &&
      Date.parse(m.createdAt) - Date.parse(prev.createdAt) < GROUP_GAP_MS
    const isMine = mine(m)
    const isAdmin = m.author.type === 'admin'
    const showMenu = canDelete(m) || (onPin && true) || (onMute && m.author.type === 'nominee' && m.author.contestantId)
    rows.push(
      <div key={m.id} className={`group flex gap-2 ${isMine ? 'flex-row-reverse' : ''} ${sameAuthor ? 'mt-0.5' : 'mt-3'}`}>
        <div className="w-8 shrink-0">{!sameAuthor && !isMine && <Avatar m={m} />}</div>
        <div className={`flex min-w-0 max-w-[80%] flex-col ${isMine ? 'items-end' : 'items-start'}`}>
          {!sameAuthor && !isMine && (
            <span className="mb-1 flex items-center gap-1.5 px-1 text-[11px]">
              <span className={`font-semibold ${isAdmin ? 'text-amber-300' : 'text-zinc-200'}`}>{m.author.name}</span>
              {isAdmin ? (
                <span className="rounded bg-amber-500/15 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-amber-300">Organiser</span>
              ) : (
                m.author.category && <span className="truncate text-zinc-500">{m.author.category}</span>
              )}
            </span>
          )}
          <div className={`relative flex items-end gap-1 ${isMine ? 'flex-row-reverse' : ''}`}>
            <div
              className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                isMine
                  ? 'rounded-br-md bg-purple-600 text-white'
                  : isAdmin
                    ? 'rounded-bl-md border border-amber-500/25 bg-amber-500/10 text-zinc-100'
                    : 'rounded-bl-md border border-zinc-800 bg-zinc-900 text-zinc-100'
              }`}
            >
              {m.imageUrl && (
                <a href={m.imageUrl} target="_blank" rel="noopener noreferrer" className="-mx-1.5 -mt-0.5 mb-1.5 block overflow-hidden rounded-xl">
                  <img src={m.imageUrl} alt="Shared photo" loading="lazy" className="max-h-72 w-full max-w-[320px] object-cover" />
                </a>
              )}
              {m.pinned && <Pin className="mr-1 inline h-3 w-3 -translate-y-px opacity-70" aria-label="Pinned" />}
              {m.body && <RichText text={m.body} />}
              <span className={`ml-2 inline-block translate-y-0.5 text-[10px] ${isMine ? 'text-white/70' : 'text-zinc-500'}`}>{time(m.createdAt)}</span>
            </div>
            {showMenu && (
              <div className="relative">
                <button
                  type="button"
                  aria-label="Message options"
                  aria-haspopup="menu"
                  aria-expanded={menuFor === m.id}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => setMenuFor((v) => (v === m.id ? null : m.id))}
                  className="rounded-md p-1 text-zinc-500 opacity-0 transition-opacity hover:bg-zinc-800 hover:text-white focus:opacity-100 group-hover:opacity-100 [@media(pointer:coarse)]:opacity-60"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
                {menuFor === m.id && (
                  <div
                    role="menu"
                    onPointerDown={(e) => e.stopPropagation()}
                    className={`absolute bottom-full z-20 mb-1 w-44 overflow-hidden rounded-lg border border-zinc-800 bg-[#0b1420] py-1 shadow-xl ${isMine ? 'right-0' : 'left-0'}`}
                  >
                    {onPin && (
                      <button type="button" role="menuitem" onClick={() => { setMenuFor(null); void onPin(m, !m.pinned) }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-200 hover:bg-zinc-800">
                        {m.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />} {m.pinned ? 'Unpin' : 'Pin as announcement'}
                      </button>
                    )}
                    {onMute && m.author.type === 'nominee' && m.author.contestantId && (
                      <button type="button" role="menuitem" onClick={() => { setMenuFor(null); void onMute(m.author.contestantId!) }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-200 hover:bg-zinc-800">
                        <MicOff className="h-3.5 w-3.5" /> Mute {m.author.name.split(' ')[0]}
                      </button>
                    )}
                    {canDelete(m) && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => { setMenuFor(null); if (window.confirm('Delete this message for everyone?')) void onDelete(m) }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-400 hover:bg-zinc-800"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          {m.body && <div className="w-full max-w-[340px]"><RichMedia text={m.body} maxWidth={340} /></div>}
        </div>
      </div>,
    )
    prev = m
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {pinned.length > 0 && (
        <div className="space-y-1.5 border-b border-zinc-800 bg-amber-500/5 px-4 py-3">
          {pinned.slice(-3).map((m) => (
            <div key={m.id} className="flex items-start gap-2 text-xs">
              <Megaphone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
              <p className="line-clamp-2 text-zinc-200"><span className="font-semibold text-amber-300">{m.author.name}: </span>{m.body || 'Photo'}</p>
            </div>
          ))}
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        <div ref={scroller} onScroll={onScroll} className="h-full overflow-y-auto px-3 py-2 sm:px-4" role="log" aria-live="polite" aria-label="Chat messages">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading messages…</div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-zinc-500">{emptyText}</div>
          ) : (
            rows
          )}
        </div>
        {unseen > 0 && (
          <button
            type="button"
            onClick={jumpDown}
            className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
          >
            <ArrowDown className="h-3.5 w-3.5" /> {unseen} new {unseen === 1 ? 'message' : 'messages'}
          </button>
        )}
      </div>

      {error && <p className="border-t border-zinc-800 px-4 py-1.5 text-[11px] text-amber-300">{error}</p>}

      <div className="border-t border-zinc-800 p-3">
        {canPost ? (
          <form onSubmit={(e) => { e.preventDefault(); void send() }} className="space-y-2">
            {photo && (
              <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-2">
                <img src={photo.url} alt="Photo to send" className="h-14 w-14 rounded-lg object-cover" />
                <span className="min-w-0 flex-1 truncate text-xs text-zinc-400">{photo.file.name}</span>
                <button type="button" onClick={clearPhoto} aria-label="Remove photo" className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"><X className="h-4 w-4" /></button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <input ref={photoInput} type="file" accept="image/*" className="hidden" onChange={(e) => pickPhoto(e.target.files?.[0])} />
              <button
                type="button"
                onClick={() => photoInput.current?.click()}
                aria-label="Attach a photo"
                title="Attach a photo"
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white"
              >
                <ImagePlus className="h-4 w-4" />
              </button>
              <textarea
                ref={textarea}
                rows={1}
                value={draft}
                maxLength={MAX_LENGTH}
                placeholder={placeholder}
                aria-label="Message"
                onChange={(e) => { setDraft(e.target.value); autosize() }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send() }
                }}
                className="max-h-40 min-h-[42px] flex-1 resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                disabled={(!draft.trim() && !photo) || sending}
                aria-label="Send message"
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white transition-colors hover:bg-purple-500 disabled:opacity-40"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between gap-3 px-1 text-[11px] text-zinc-500">
              {announceToggle ? (
                <label className="flex items-center gap-1.5 select-none">
                  <input type="checkbox" checked={announce} onChange={(e) => setAnnounce(e.target.checked)} className="accent-purple-500" />
                  Pin as announcement
                </label>
              ) : (
                <span>Enter to send · Paste YouTube, Facebook, Instagram or TikTok links to play them here</span>
              )}
              {draft.length > MAX_LENGTH - 200 && <span className={draft.length >= MAX_LENGTH ? 'text-red-400' : ''}>{draft.length}/{MAX_LENGTH}</span>}
            </div>
            {sendError && <p role="alert" className="px-1 text-xs text-red-400">{sendError}</p>}
          </form>
        ) : (
          <p className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3.5 py-3 text-xs text-zinc-400">
            <Lock className="h-3.5 w-3.5 shrink-0" /> {blockedReason}
          </p>
        )}
      </div>
    </div>
  )
}
