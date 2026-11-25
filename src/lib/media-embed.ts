// Turning pasted links into embeddable media (chat messages, nominee intro
// videos). Pure and dependency-free so the server can validate with it too.
//
// Safety: an iframe src is never the pasted URL itself. For each provider we
// extract an ID (or re-encode the URL as a parameter of the provider's own
// embed endpoint) and build the player URL on a fixed, known host. Anything
// unrecognised stays a plain link. Only https links are embedded.

export type MediaEmbed =
  | { kind: 'iframe'; provider: 'youtube' | 'vimeo' | 'facebook' | 'instagram' | 'tiktok' | 'spotify' | 'soundcloud'; src: string; aspect: string; thumbnail?: string; title: string }
  | { kind: 'image'; src: string }
  | { kind: 'video'; src: string }

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif)$/i
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)$/i
const YT_ID = /^[A-Za-z0-9_-]{11}$/

const hostIs = (host: string, ...domains: string[]) => domains.some((d) => host === d || host.endsWith(`.${d}`))

function safeUrl(raw: string): URL | null {
  try {
    const u = new URL(raw.trim())
    return u.protocol === 'https:' ? u : null
  } catch {
    return null
  }
}

export function parseMediaUrl(raw: string): MediaEmbed | null {
  const u = safeUrl(raw)
  if (!u) return null
  const host = u.hostname.toLowerCase()
  const path = u.pathname
  const parts = path.split('/').filter(Boolean)

  // YouTube: watch?v=, youtu.be/, /shorts/, /embed/, /live/
  if (hostIs(host, 'youtube.com', 'youtu.be', 'youtube-nocookie.com')) {
    let id: string | null = null
    let vertical = false
    if (host === 'youtu.be') id = parts[0] ?? null
    else if (parts[0] === 'watch') id = u.searchParams.get('v')
    else if (['shorts', 'embed', 'live', 'v'].includes(parts[0] ?? '')) { id = parts[1] ?? null; vertical = parts[0] === 'shorts' }
    if (!id || !YT_ID.test(id)) return null
    return {
      kind: 'iframe', provider: 'youtube', title: 'YouTube video',
      src: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`,
      aspect: vertical ? '9 / 16' : '16 / 9',
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    }
  }

  // Vimeo: vimeo.com/123456789
  if (hostIs(host, 'vimeo.com')) {
    const id = parts.find((p) => /^\d{6,12}$/.test(p))
    if (!id) return null
    return { kind: 'iframe', provider: 'vimeo', title: 'Vimeo video', src: `https://player.vimeo.com/video/${id}?dnt=1`, aspect: '16 / 9' }
  }

  // Facebook: videos, watch, reels and fb.watch play in the video plugin; other posts in the post plugin.
  if (hostIs(host, 'facebook.com', 'fb.watch')) {
    const href = encodeURIComponent(`https://${host}${path}${u.search}`)
    const isVideo = host === 'fb.watch' || /\/(videos|watch|reel|reels)(\/|$)/.test(path) || parts[0] === 'watch'
    return isVideo
      ? { kind: 'iframe', provider: 'facebook', title: 'Facebook video', src: `https://www.facebook.com/plugins/video.php?href=${href}&show_text=false&width=560`, aspect: '16 / 9' }
      : { kind: 'iframe', provider: 'facebook', title: 'Facebook post', src: `https://www.facebook.com/plugins/post.php?href=${href}&show_text=true&width=500`, aspect: '4 / 5' }
  }

  // Instagram: /p/CODE, /reel/CODE, /tv/CODE
  if (hostIs(host, 'instagram.com')) {
    const i = parts.findIndex((p) => ['p', 'reel', 'reels', 'tv'].includes(p))
    const code = i >= 0 ? parts[i + 1] : null
    if (!code || !/^[A-Za-z0-9_-]{5,40}$/.test(code)) return null
    const type = parts[i] === 'p' ? 'p' : 'reel'
    return { kind: 'iframe', provider: 'instagram', title: 'Instagram post', src: `https://www.instagram.com/${type}/${code}/embed`, aspect: '4 / 5.6' }
  }

  // TikTok: /@user/video/ID (short vm.tiktok.com links can't be resolved here, so they stay links)
  if (hostIs(host, 'tiktok.com')) {
    const i = parts.indexOf('video')
    const id = i >= 0 ? parts[i + 1] : null
    if (!id || !/^\d{8,25}$/.test(id)) return null
    return { kind: 'iframe', provider: 'tiktok', title: 'TikTok video', src: `https://www.tiktok.com/embed/v2/${id}`, aspect: '9 / 16.8' }
  }

  // Spotify: track / album / playlist / episode / show
  if (host === 'open.spotify.com') {
    const typeIdx = parts.findIndex((p) => ['track', 'album', 'playlist', 'episode', 'show'].includes(p))
    const id = typeIdx >= 0 ? parts[typeIdx + 1] : null
    if (!id || !/^[A-Za-z0-9]{10,40}$/.test(id)) return null
    const tall = parts[typeIdx] !== 'track' && parts[typeIdx] !== 'episode'
    return { kind: 'iframe', provider: 'spotify', title: 'Spotify', src: `https://open.spotify.com/embed/${parts[typeIdx]}/${id}`, aspect: tall ? '1 / 1' : '16 / 4' }
  }

  // SoundCloud tracks and sets
  if (host === 'soundcloud.com' && parts.length >= 2) {
    return { kind: 'iframe', provider: 'soundcloud', title: 'SoundCloud', src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(`https://soundcloud.com${path}`)}&visual=true`, aspect: '16 / 9' }
  }

  // Direct image / video files
  if (IMAGE_EXT.test(path)) return { kind: 'image', src: u.toString() }
  if (VIDEO_EXT.test(path)) return { kind: 'video', src: u.toString() }
  return null
}

const URL_IN_TEXT = /https?:\/\/[^\s<>"']+/gi
// Trailing punctuation that belongs to the sentence, not the link.
const TRAILING = /[).,!?;:'"\]]+$/

/** Text split into plain-text and link segments, for safe rendering. */
export function splitLinks(text: string): ({ type: 'text'; value: string } | { type: 'link'; value: string })[] {
  const out: ({ type: 'text'; value: string } | { type: 'link'; value: string })[] = []
  let last = 0
  for (const m of text.matchAll(URL_IN_TEXT)) {
    let url = m[0]
    const trail = url.match(TRAILING)?.[0] ?? ''
    if (trail) url = url.slice(0, -trail.length)
    const start = m.index ?? 0
    if (start > last) out.push({ type: 'text', value: text.slice(last, start) })
    out.push({ type: 'link', value: url })
    last = start + url.length
  }
  if (last < text.length) out.push({ type: 'text', value: text.slice(last) })
  return out
}

/** The embeddable media linked in a message, in order, without duplicates. */
export function mediaInText(text: string, limit = 3): MediaEmbed[] {
  const seen = new Set<string>()
  const out: MediaEmbed[] = []
  for (const seg of splitLinks(text)) {
    if (seg.type !== 'link') continue
    const embed = parseMediaUrl(seg.value)
    if (embed && !seen.has(embed.src)) {
      seen.add(embed.src)
      out.push(embed)
      if (out.length >= limit) break
    }
  }
  return out
}
