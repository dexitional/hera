import { useEffect, useRef, useState } from 'react'
import { FileVideo, ImagePlus, Link2, Trash2, Upload, X } from 'lucide-react'
import { parseMediaUrl } from '#/lib/media-embed'
import { MediaFrame, MediaPlayer } from './MediaEmbed'

// Flyer + intro video fields, shared by the admin nominee form and the
// nominee's portal profile. Reports changes as the form keys the server
// reads (see server/nominee-media.ts): flyer, removeFlyer, introVideoFile,
// introVideoUrl.

export type NomineeMediaChange = {
  flyer?: File | null
  removeFlyer?: 'true' | null
  introVideoFile?: File | null
  introVideoUrl?: string
}

const MAX_FLYER = 10 * 1024 * 1024
const MAX_VIDEO = 50 * 1024 * 1024
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

export function NomineeMediaFields({ flyerUrl, introVideoUrl, disabled, onChange }: {
  flyerUrl?: string | null
  introVideoUrl?: string | null
  disabled?: boolean
  onChange: (change: NomineeMediaChange) => void
}) {
  const flyerInput = useRef<HTMLInputElement>(null)
  const videoInput = useRef<HTMLInputElement>(null)
  const [flyerPreview, setFlyerPreview] = useState<string | null>(flyerUrl ?? null)
  const [mode, setMode] = useState<'link' | 'upload'>(introVideoUrl && parseMediaUrl(introVideoUrl)?.kind === 'video' ? 'upload' : 'link')
  const [link, setLink] = useState(introVideoUrl && parseMediaUrl(introVideoUrl)?.kind !== 'video' ? introVideoUrl : '')
  const [videoFile, setVideoFile] = useState<{ name: string; url: string } | null>(null)
  const [keptVideo, setKeptVideo] = useState<string | null>(introVideoUrl && parseMediaUrl(introVideoUrl)?.kind === 'video' ? introVideoUrl : null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => () => { if (videoFile) URL.revokeObjectURL(videoFile.url) }, [videoFile])

  const pickFlyer = (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('The flyer must be an image (JPG, PNG or WebP).')
    if (file.size > MAX_FLYER) return setError('That flyer is over 10 MB. Please choose a smaller image.')
    setError(null)
    setFlyerPreview(URL.createObjectURL(file))
    onChange({ flyer: file, removeFlyer: null })
  }
  const removeFlyer = () => {
    setFlyerPreview(null)
    if (flyerInput.current) flyerInput.current.value = ''
    onChange({ flyer: null, removeFlyer: 'true' })
  }

  const pickVideo = (file?: File) => {
    if (!file) return
    if (!VIDEO_TYPES.includes(file.type)) return setError('Upload the video as an MP4, WebM or MOV file.')
    if (file.size > MAX_VIDEO) return setError('That video is over 50 MB. Upload a shorter clip, or paste a YouTube or Facebook link instead.')
    setError(null)
    setVideoFile({ name: file.name, url: URL.createObjectURL(file) })
    onChange({ introVideoFile: file, introVideoUrl: '' })
  }
  const clearVideo = () => {
    setVideoFile(null)
    setKeptVideo(null)
    setLink('')
    if (videoInput.current) videoInput.current.value = ''
    onChange({ introVideoFile: null, introVideoUrl: '' })
  }

  const linkEmbed = link.trim() ? parseMediaUrl(link.trim()) : null
  const linkInvalid = Boolean(link.trim()) && (!linkEmbed || linkEmbed.kind === 'image')
  const tab = (m: 'link' | 'upload', label: string, Icon: typeof Link2) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === m}
      onClick={() => setMode(m)}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${mode === m ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'}`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  )

  return (
    <div className="space-y-5">
      {/* Flyer */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Campaign flyer <span className="font-normal normal-case text-zinc-500">(optional)</span></p>
        <input ref={flyerInput} type="file" accept="image/*" className="hidden" onChange={(e) => pickFlyer(e.target.files?.[0])} />
        {flyerPreview ? (
          <div className="flex items-start gap-3">
            <img src={flyerPreview} alt="Flyer preview" className="h-40 w-auto max-w-[220px] rounded-lg border border-zinc-800 object-contain bg-black/30" />
            <div className="flex flex-col gap-2">
              <button type="button" disabled={disabled} onClick={() => flyerInput.current?.click()} className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-600">
                <ImagePlus className="h-3.5 w-3.5" /> Replace
              </button>
              <button type="button" disabled={disabled} onClick={removeFlyer} className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-950/30">
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => flyerInput.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-zinc-800 bg-[#0a192a]/40 px-4 py-6 text-center hover:border-zinc-600"
          >
            <ImagePlus className="h-5 w-5 text-zinc-500" />
            <span className="text-xs font-medium text-zinc-300">Upload a flyer</span>
            <span className="text-[11px] text-zinc-500">Portrait poster works best · JPG, PNG or WebP up to 10 MB</span>
          </button>
        )}
      </div>

      {/* Intro video */}
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Intro video <span className="font-normal normal-case text-zinc-500">(optional)</span></p>
          <div role="tablist" className="flex rounded-lg border border-zinc-800 bg-[#0a192a]/50 p-0.5">
            {tab('link', 'Paste link', Link2)}
            {tab('upload', 'Upload file', Upload)}
          </div>
        </div>

        {mode === 'link' ? (
          <div className="space-y-2">
            <input
              type="url"
              inputMode="url"
              disabled={disabled}
              value={link}
              placeholder="https://youtu.be/…  ·  Facebook, Instagram, TikTok or Vimeo link"
              onChange={(e) => { setLink(e.target.value); setVideoFile(null); setKeptVideo(null); onChange({ introVideoFile: null, introVideoUrl: e.target.value }) }}
              className={`flex w-full rounded-md border bg-[#0a192a]/50 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 ${linkInvalid ? 'border-red-500/60' : 'border-zinc-700'}`}
            />
            {linkInvalid && <p className="text-xs text-red-400">That link can't be played here. Use a YouTube, Facebook, Instagram, TikTok or Vimeo video link.</p>}
            {linkEmbed && !linkInvalid && <MediaFrame embed={linkEmbed} maxWidth={420} />}
          </div>
        ) : (
          <div className="space-y-2">
            <input ref={videoInput} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={(e) => pickVideo(e.target.files?.[0])} />
            {videoFile || keptVideo ? (
              <div className="space-y-2">
                <video src={videoFile?.url ?? keptVideo!} controls playsInline preload="metadata" className="w-full max-w-[420px] rounded-lg border border-zinc-800 bg-black" />
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <FileVideo className="h-3.5 w-3.5" /> <span className="truncate">{videoFile?.name ?? 'Current intro video'}</span>
                  <button type="button" disabled={disabled} onClick={() => videoInput.current?.click()} className="ml-auto rounded-md border border-zinc-800 px-2 py-1 text-zinc-200 hover:border-zinc-600">Replace</button>
                  <button type="button" disabled={disabled} onClick={clearVideo} aria-label="Remove video" className="rounded-md p-1 text-red-400 hover:bg-red-950/30"><X className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={disabled}
                onClick={() => videoInput.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-zinc-800 bg-[#0a192a]/40 px-4 py-6 text-center hover:border-zinc-600"
              >
                <Upload className="h-5 w-5 text-zinc-500" />
                <span className="text-xs font-medium text-zinc-300">Upload a short video</span>
                <span className="text-[11px] text-zinc-500">MP4, WebM or MOV up to 50 MB</span>
              </button>
            )}
          </div>
        )}
        {(link || videoFile || keptVideo) && mode === 'link' && link && !linkInvalid && (
          <button type="button" onClick={clearVideo} className="mt-2 text-xs text-zinc-500 hover:text-red-400">Remove intro video</button>
        )}
      </div>

      {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

export { MediaPlayer }
