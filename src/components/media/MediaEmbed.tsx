import { useState } from 'react'
import { ExternalLink, Play } from 'lucide-react'
import { parseMediaUrl, splitLinks, mediaInText, type MediaEmbed as Embed } from '#/lib/media-embed'

// Renders links as media: provider players (YouTube, Facebook, Instagram,
// TikTok, Vimeo, Spotify, SoundCloud), images and video files. Iframe
// sources always come from parseMediaUrl, never straight from user input.

const PROVIDER_LABEL: Record<string, string> = {
  youtube: 'YouTube', vimeo: 'Vimeo', facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', spotify: 'Spotify', soundcloud: 'SoundCloud',
}

export function MediaFrame({ embed, className = '', maxWidth }: { embed: Embed; className?: string; maxWidth?: number }) {
  const [active, setActive] = useState(false)

  if (embed.kind === 'image') {
    return (
      <a href={embed.src} target="_blank" rel="noopener noreferrer nofollow ugc" className={`block overflow-hidden rounded-xl border border-white/10 bg-black/20 ${className}`} style={{ maxWidth }}>
        <img src={embed.src} alt="" loading="lazy" referrerPolicy="no-referrer" className="max-h-80 w-full object-contain" />
      </a>
    )
  }

  if (embed.kind === 'video') {
    return (
      <video src={embed.src} controls playsInline preload="metadata" className={`w-full rounded-xl border border-white/10 bg-black ${className}`} style={{ maxWidth }} />
    )
  }

  // Click-to-load for YouTube: a thumbnail costs far less than a player per message.
  if (embed.thumbnail && !active) {
    return (
      <button
        type="button"
        onClick={() => setActive(true)}
        aria-label={`Play ${embed.title}`}
        className={`group relative block w-full overflow-hidden rounded-xl border border-white/10 bg-black ${className}`}
        style={{ aspectRatio: embed.aspect, maxWidth }}
      >
        <img src={embed.thumbnail} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 shadow-xl transition-transform group-hover:scale-105">
            <Play className="h-6 w-6 translate-x-0.5 fill-white text-white" />
          </span>
        </span>
        <span className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">{PROVIDER_LABEL[embed.provider]}</span>
      </button>
    )
  }

  return (
    <div className={`w-full overflow-hidden rounded-xl border border-white/10 bg-black ${className}`} style={{ aspectRatio: embed.aspect, maxWidth }}>
      <iframe
        src={`${embed.src}${embed.thumbnail ? '&autoplay=1' : ''}`}
        title={embed.title}
        loading="lazy"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation"
        className="h-full w-full border-0"
      />
    </div>
  )
}

/** A single media link (e.g. a nominee's intro video), or a plain link when it can't be embedded. */
export function MediaPlayer({ url, className, maxWidth }: { url: string; className?: string; maxWidth?: number }) {
  const embed = parseMediaUrl(url)
  if (!embed) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer nofollow ugc" className="inline-flex items-center gap-1.5 text-sm text-purple-300 underline-offset-2 hover:underline">
        <ExternalLink className="h-4 w-4" /> Open video
      </a>
    )
  }
  return <MediaFrame embed={embed} className={className} maxWidth={maxWidth} />
}

/** Message text with clickable links, and players for any media links below it. */
export function RichText({ text, linkClassName = 'underline underline-offset-2 break-all' }: { text: string; linkClassName?: string }) {
  return (
    <>
      {splitLinks(text).map((seg, i) =>
        seg.type === 'link' ? (
          <a key={i} href={seg.value} target="_blank" rel="noopener noreferrer nofollow ugc" className={linkClassName}>{seg.value}</a>
        ) : (
          <span key={i}>{seg.value}</span>
        ),
      )}
    </>
  )
}

export function RichMedia({ text, maxWidth = 360 }: { text: string; maxWidth?: number }) {
  const media = mediaInText(text)
  if (media.length === 0) return null
  return (
    <div className="mt-2 space-y-2">
      {media.map((m) => <MediaFrame key={m.src} embed={m} maxWidth={maxWidth} />)}
    </div>
  )
}
