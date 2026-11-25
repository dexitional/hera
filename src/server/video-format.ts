// Recognising video files by their first bytes (kept free of the storage
// client so it can be unit tested on its own).

/** True when the bytes start like an MP4/MOV (ISO-BMFF "ftyp" box) or a WebM (EBML) file. */
export function looksLikeVideo(head: Uint8Array): 'iso' | 'webm' | null {
  if (head.length >= 12 && head[4] === 0x66 && head[5] === 0x74 && head[6] === 0x79 && head[7] === 0x70) return 'iso';
  if (head.length >= 4 && head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3) return 'webm';
  return null;
}
