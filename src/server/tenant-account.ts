import { createServerFn } from '@tanstack/react-start';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import sharp from 'sharp';
import { BUCKET_NAME, s3Client } from '#/lib/s3';
import { arcjetMiddleware } from '#/middleware/arcjetMiddleware';
import { authMiddleware } from '#/middleware/authMiddleware';

// Uploads (and optimizes) a new admin profile avatar to cloud storage.
// Returns the public URL so the caller can pass it to authClient.updateUser({ image }).
export const uploadAdminAvatarFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ data }: any) => {
    const file = data.get("image") as File | null;

    if (!file || file.size === 0) {
      throw new Error("No image file was provided.");
    }
    if (!file.type.startsWith("image/")) {
      throw new Error("Invalid file type. Please upload an image.");
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new Error("Image exceeds the 2MB size limit.");
    }

    const arrayBuffer = await file.arrayBuffer();
    const rawBuffer = Buffer.from(arrayBuffer);
    const optimizedBuffer = await sharp(rawBuffer)
      .resize(512, 512, { fit: "cover" })
      .webp({ quality: 75 })
      .toBuffer();

    const uniqueFileName = `avatars/${crypto.randomUUID()}.webp`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: uniqueFileName,
        Body: optimizedBuffer,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    const publicDomain = process.env.R2_PUBLIC_DOMAIN;
    const imageUrl = `${publicDomain}/${uniqueFileName}`;

    return { success: true, imageUrl };
  });
