import { createServerFn } from '@tanstack/react-start';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

 const s3 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  
  export async function getUploadUrl(fileName: string, fileType: string) {
      const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `uploads/${Date.now()}-${fileName}`,
        ContentType: fileType,
      });
       
      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
      return { uploadUrl, fileUrl: `https://${process.env.CDN_DOMAIN}/${command.input.Key}` };
  }

  export async function getCandidatePhotoUploadUrl({ fileName, fileType }: any) {
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `uploads/${Date.now()}-${fileName}`,
      ContentType: fileType,
    });
     
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return { uploadUrl, publicUrl: `https://${process.env.CDN_DOMAIN}/${command.input.Key}` };
  }
  
  
  export const getPresignedUploadUrl = createServerFn({ method: 'POST' }).handler( 
      async ({ fileName, fileType }: any) => {
        // Generate a secure, unique file path
        const fileKey = `avatars/${Date.now()}-${fileName}`;
        const command = new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: fileKey,
          ContentType: fileType,
        });
        // URL expires automatically in 5 minutes (300 seconds)
        const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
        const finalFileUrl = `${process.env.R2_PUBLIC_DOMAIN}/${fileKey}`;
        return { uploadUrl, finalFileUrl };
      }
  );
  
