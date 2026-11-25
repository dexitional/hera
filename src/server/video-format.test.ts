import { describe, expect, it } from 'vitest'
import { looksLikeVideo } from './video-format'

describe('looksLikeVideo', () => {
  it('recognises MP4/MOV and WebM headers', () => {
    expect(looksLikeVideo(new Uint8Array([0, 0, 0, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]))).toBe('iso')
    expect(looksLikeVideo(new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0]))).toBe('webm')
  })
  it('rejects anything else', () => {
    expect(looksLikeVideo(new TextEncoder().encode('<html><script>'))).toBeNull()
    expect(looksLikeVideo(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]))).toBeNull()
  })
})
