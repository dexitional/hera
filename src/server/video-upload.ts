import { PutObjectCommand } from '@aws-sdk/client-s3';
import { BUCKET_NAME, s3Client } from '#/lib/s3';
import { looksLikeVideo } from './video-format';

// Short intro-video uploads (MP4 / WebM / MOV), stored as-is in object
// storage. The size is checked before reading any bytes, and the file's own
// header is checked (not just the browser-supplied type) so other content
// can't be stored as a "video".
//
// Kept in its own module for the client-bundle stripping reason documented
// in paystack-credit.ts.

export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

const FORMATS: Record<string, { ext: string; contentType: string }> = {
  'video/mp4': { ext: 'mp4', contentType: 'video/mp4' },
  'video/quicktime': { ext: 'mov', contentType: 'video/quicktime' },
  'video/webm': { ext: 'webm', contentType: 'video/webm' },
};

/** Uploads a video file and returns its public URL, or undefined when no file was given. */
export async function processVideoUpload(file: File | null, folder: string): Promise<string | undefined> {
  if (!file || file.size === 0) return undefined;
  const format = FORMATS[file.type];
  if (!format) throw new Error('Please upload the video as an MP4, WebM or MOV file.');
  if (file.size > MAX_VIDEO_BYTES) throw new Error('That video is over 50 MB. Please upload a shorter or smaller clip, or paste a YouTube or Facebook link instead.');

  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = looksLikeVideo(bytes.subarray(0, 16));
  if (!kind || (kind === 'webm') !== (format.ext === 'webm')) {
    throw new Error("That file doesn't look like a playable video. Please export it as MP4 and try again.");
  }

  const key = `${folder}/${crypto.randomUUID()}.${format.ext}`;
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: bytes,
      ContentType: format.contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
  return `${process.env.R2_PUBLIC_DOMAIN}/${key}`;
}
