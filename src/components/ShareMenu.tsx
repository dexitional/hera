import { useEffect, useRef, useState } from 'react'
import {
  Check,
  Copy,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MessageCircle,
  MessageSquare,
  Music2,
  MoreHorizontal,
  Send,
  Share2,
  Twitter,
} from 'lucide-react'

type ShareMenuProps = {
  title: string
  text: string
  /** Defaults to the current page URL. */
  url?: string
  /** Trigger styling; defaults to the nominee page's pill. */
  buttonClassName?: string
  /** Heading inside the menu. */
  heading?: string
  /** Which edge of the trigger the dropdown lines up with on wide screens. */
  align?: 'left' | 'right'
}

type Target = {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  /** Opens a share URL in a new tab. */
  href?: (url: string, text: string, title: string) => string
  /**
   * Instagram / TikTok have no web "share a link" endpoint: on devices with a
   * native share sheet we hand off to it (it lists the installed apps);
   * otherwise we copy the link and open the site so it can be pasted.
   */
  appOnly?: { site: string; name: string }
}

const enc = encodeURIComponent

const TARGETS: Target[] = [
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'bg-[#25D366]', href: (u, t) => `https://wa.me/?text=${enc(`${t} ${u}`)}` },
  { key: 'facebook', label: 'Facebook', icon: Facebook, color: 'bg-[#1877F2]', href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${enc(u)}` },
  { key: 'instagram', label: 'Instagram', icon: Instagram, color: 'bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]', appOnly: { site: 'https://www.instagram.com/', name: 'Instagram' } },
  { key: 'tiktok', label: 'TikTok', icon: Music2, color: 'bg-black ring-1 ring-white/20', appOnly: { site: 'https://www.tiktok.com/', name: 'TikTok' } },
  { key: 'x', label: 'X', icon: Twitter, color: 'bg-black ring-1 ring-white/20', href: (u, t) => `https://twitter.com/intent/tweet?text=${enc(t)}&url=${enc(u)}` },
  { key: 'telegram', label: 'Telegram', icon: Send, color: 'bg-[#229ED9]', href: (u, t) => `https://t.me/share/url?url=${enc(u)}&text=${enc(t)}` },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'bg-[#0A66C2]', href: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${enc(u)}` },
  { key: 'sms', label: 'SMS', icon: MessageSquare, color: 'bg-emerald-600', href: (u, t) => `sms:?&body=${enc(`${t} ${u}`)}` },
  { key: 'email', label: 'Email', icon: Mail, color: 'bg-slate-500', href: (u, t, ti) => `mailto:?subject=${enc(ti)}&body=${enc(`${t}\n\n${u}`)}` },
]

export default function ShareMenu({ title, text, url, buttonClassName, heading = 'Share this nominee', align = 'left' }: ShareMenuProps) {
  const [open, setOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState(url ?? '')
  const [canNativeShare, setCanNativeShare] = useState(false)
  // Phones/tablets: their native share sheet lists installed apps such as
  // Instagram and TikTok. Desktop share sheets (e.g. macOS) don't.
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [isWide, setIsWide] = useState(true)
  const rootRef = useRef<HTMLDivElement>(null)

  // Browser-only values (avoids an SSR/hydration mismatch).
  useEffect(() => {
    // Follows the url prop, which can arrive after the first render.
    setShareUrl(url ?? window.location.href)
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
    setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches)
    const wide = window.matchMedia('(min-width: 640px)')
    const sync = () => setIsWide(wide.matches)
    sync()
    wide.addEventListener('change', sync)
    return () => wide.removeEventListener('change', sync)
  }, [url])

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const flash = (message: string) => {
    setNotice(message)
    setTimeout(() => setNotice(null), 2500)
  }

  const copyLink = async (message = 'Link copied') => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      flash(message)
      return true
    } catch {
      flash('Could not copy the link')
      return false
    }
  }

  const nativeShare = async () => {
    try {
      await navigator.share({ title, text, url: shareUrl })
      setOpen(false)
    } catch {
      // User dismissed the share sheet -- nothing to do.
    }
  }

  const onAppOnly = (e: React.MouseEvent, target: Target) => {
    if (canNativeShare && isTouchDevice) {
      // Phones: the native sheet lists installed apps (Instagram, TikTok, ...).
      e.preventDefault()
      void nativeShare()
      return
    }
    // Desktop: copy the link, and let the anchor open the site in a new tab.
    void copyLink(`Link copied. Paste it into ${target.appOnly!.name}.`)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={buttonClassName ?? "flex items-center gap-2 bg-slate-600/10 px-3 py-1.5 rounded-full hover:bg-slate-600/20 transition-colors"}
      >
        <Share2 className={buttonClassName ? "w-4 h-4" : "w-4 h-4 text-purple-400"} />
        <span>Share</span>
      </button>

      {open && (
        <div
          role="menu"
          // Bottom sheet on phones (the button can sit mid-row, so a dropdown
          // would run off-screen); dropdown under the button on wider screens.
          // Chosen in JS rather than with sm: variants because the legacy
          // utilities pasted into styles.css (e.g. .fixed) come later in the
          // same layer and override Tailwind's responsive classes.
          className={`${isWide ? `absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-2 w-80` : 'fixed inset-x-4 bottom-4'} z-50 rounded-2xl border border-slate-600/30 bg-[#1f1f24] p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150`}
        >
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">{heading}</p>
          <div className="grid grid-cols-4 gap-3">
            {TARGETS.map((t) => {
              const Icon = t.icon
              const href = t.href ? t.href(shareUrl, text, title) : t.appOnly!.site
              const external = href.startsWith('http')
              return (
                <a
                  key={t.key}
                  role="menuitem"
                  href={href}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  onClick={(e) => (t.appOnly ? onAppOnly(e, t) : setOpen(false))}
                  className="flex flex-col items-center gap-1.5 rounded-xl p-1.5 hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60"
                >
                  <span className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${t.color}`}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="text-[11px] text-zinc-300 leading-none">{t.label}</span>
                </a>
              )
            })}
            <button
              type="button"
              role="menuitem"
              onClick={() => void copyLink()}
              className="flex flex-col items-center gap-1.5 rounded-xl p-1.5 hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60"
            >
              <span className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-purple-600">
                {notice === 'Link copied' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </span>
              <span className="text-[11px] text-zinc-300 leading-none">Copy link</span>
            </button>
            {canNativeShare && (
              <button
                type="button"
                role="menuitem"
                onClick={() => void nativeShare()}
                className="flex flex-col items-center gap-1.5 rounded-xl p-1.5 hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60"
              >
                <span className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-slate-600">
                  <MoreHorizontal className="w-5 h-5" />
                </span>
                <span className="text-[11px] text-zinc-300 leading-none">More</span>
              </button>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-black/30 px-3 py-2">
            <span className="flex-1 truncate text-xs text-zinc-400" title={shareUrl}>{shareUrl}</span>
          </div>
          {notice && (
            <p role="status" className="mt-2 text-xs font-medium text-green-400">{notice}</p>
          )}
        </div>
      )}
    </div>
  )
}
