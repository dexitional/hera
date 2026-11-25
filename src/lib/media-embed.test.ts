import { describe, expect, it } from 'vitest'
import { mediaInText, parseMediaUrl, splitLinks } from './media-embed'

describe('parseMediaUrl', () => {
  it('YouTube in all its link shapes, embedded from youtube-nocookie', () => {
    for (const url of [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    ]) {
      const e = parseMediaUrl(url)
      expect(e && e.kind === 'iframe' && e.src.startsWith('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'), url).toBe(true)
    }
    const short = parseMediaUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')
    expect(short?.kind === 'iframe' && short.aspect).toBe('9 / 16')
  })
  it('Vimeo, Instagram, TikTok, Spotify and SoundCloud', () => {
    expect(parseMediaUrl('https://vimeo.com/76979871')).toMatchObject({ provider: 'vimeo', src: 'https://player.vimeo.com/video/76979871?dnt=1' })
    expect(parseMediaUrl('https://www.instagram.com/reel/C1a2B3c4D5e/?igsh=x')).toMatchObject({ provider: 'instagram', src: 'https://www.instagram.com/reel/C1a2B3c4D5e/embed' })
    expect(parseMediaUrl('https://www.instagram.com/p/C1a2B3c4D5e/')).toMatchObject({ src: 'https://www.instagram.com/p/C1a2B3c4D5e/embed' })
    expect(parseMediaUrl('https://www.tiktok.com/@ama/video/7301234567890123456')).toMatchObject({ provider: 'tiktok', src: 'https://www.tiktok.com/embed/v2/7301234567890123456' })
    expect(parseMediaUrl('https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC')).toMatchObject({ provider: 'spotify' })
    expect(parseMediaUrl('https://soundcloud.com/artist/track-name')).toMatchObject({ provider: 'soundcloud' })
  })
  it('Facebook videos use the video plugin, other posts the post plugin, with the link re-encoded', () => {
    const v = parseMediaUrl('https://www.facebook.com/heravote/videos/123456789/')
    expect(v?.kind === 'iframe' && v.src.startsWith('https://www.facebook.com/plugins/video.php?href=https%3A%2F%2F')).toBe(true)
    const p = parseMediaUrl('https://www.facebook.com/heravote/posts/pfbid0abc')
    expect(p?.kind === 'iframe' && p.src.startsWith('https://www.facebook.com/plugins/post.php?href=')).toBe(true)
  })
  it('direct image and video files', () => {
    expect(parseMediaUrl('https://cdn.example.com/a/photo.JPG')).toEqual({ kind: 'image', src: 'https://cdn.example.com/a/photo.JPG' })
    expect(parseMediaUrl('https://cdn.example.com/clip.mp4')).toEqual({ kind: 'video', src: 'https://cdn.example.com/clip.mp4' })
  })
  it('never embeds http, look-alike hosts, script URLs or unknown pages', () => {
    expect(parseMediaUrl('http://youtu.be/dQw4w9WgXcQ')).toBeNull()
    expect(parseMediaUrl('https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ')).toBeNull()
    expect(parseMediaUrl('https://evilyoutube.com/watch?v=dQw4w9WgXcQ')).toBeNull()
    expect(parseMediaUrl('javascript:alert(1)')).toBeNull()
    expect(parseMediaUrl('https://www.youtube.com/watch?v=short')).toBeNull()
    expect(parseMediaUrl('https://example.com/page')).toBeNull()
    expect(parseMediaUrl('https://vm.tiktok.com/ZMabc/')).toBeNull()
  })
})

describe('splitLinks / mediaInText', () => {
  it('separates links from text and leaves trailing punctuation outside', () => {
    expect(splitLinks('See https://youtu.be/dQw4w9WgXcQ, thanks!')).toEqual([
      { type: 'text', value: 'See ' },
      { type: 'link', value: 'https://youtu.be/dQw4w9WgXcQ' },
      { type: 'text', value: ', thanks!' },
    ])
  })
  it('finds embeddable media once each, capped', () => {
    const text = 'a https://youtu.be/dQw4w9WgXcQ b https://www.youtube.com/watch?v=dQw4w9WgXcQ c https://example.com d https://x.io/1.png e https://x.io/2.png f https://x.io/3.png'
    const media = mediaInText(text)
    expect(media).toHaveLength(3)
    expect(media[0]).toMatchObject({ provider: 'youtube' })
  })
})
