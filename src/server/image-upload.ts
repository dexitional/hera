import sharp from 'sharp';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { BUCKET_NAME, s3Client } from '#/lib/s3';

// 10MB caps the worst case while still allowing high-res portrait/logo photos --
// previously there was NO size limit at all: an upload of any size got fully
// buffered into memory (arrayBuffer()) before sharp ever got a chance to reject
// it, on server functions that (before a separate fix) didn't even require
// authentication. Checking file.size here happens before any bytes are read.
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type ImageUploadOptions = {
  folder: string; // e.g. 'contestants', 'events', 'candidates', 'logos'
  maxWidth: number;
  maxHeight: number;
  quality?: number;
  fit?: 'inside' | 'cover';
};

// Validates and optimizes an uploaded image, then stores it in R2. Returns the
// final public URL, or undefined if no file was provided (callers treat that as
// "no change"). Throws for invalid/oversized files -- let it propagate as a
// clear error rather than silently swallowing it.
export async function processImageUpload(file: File | null, options: ImageUploadOptions): Promise<string | undefined> {
  if (!file || file.size === 0) return undefined;

  if (!file.type.startsWith('image/')) {
    throw new Error('Invalid file type. Please upload an image.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`Image is too large. Maximum upload size is ${(MAX_UPLOAD_BYTES / (1024 * 1024)).toFixed(0)}MB.`);
  }

  const arrayBuffer = await file.arrayBuffer();
  const rawBuffer = Buffer.from(arrayBuffer);
  const optimizedBuffer = await sharp(rawBuffer)
    .resize(options.maxWidth, options.maxHeight, { fit: options.fit ?? 'inside', withoutEnlargement: true })
    .webp({ quality: options.quality ?? 75 })
    .toBuffer();

  const uniqueFileName = `${options.folder}/${crypto.randomUUID()}.webp`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueFileName,
      Body: optimizedBuffer,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );

  return `${process.env.R2_PUBLIC_DOMAIN}/${uniqueFileName}`;
}
