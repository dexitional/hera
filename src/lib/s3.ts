import { S3Client } from "@aws-sdk/client-s3";

if (!process.env.IDRIVE_ENDPOINT || !process.env.IDRIVE_ACCESS_KEY || !process.env.IDRIVE_SECRET_KEY) {
  throw new Error("Missing IDrive e2 environment variables");
}

export const s3Client = new S3Client({
  region: process.env.IDRIVE_REGION || "us-east-1", 
  endpoint: process.env.IDRIVE_ENDPOINT, // e.g., https://e2objects.com
  credentials: {
    accessKeyId: process.env.IDRIVE_ACCESS_KEY,
    secretAccessKey: process.env.IDRIVE_SECRET_KEY,
  },
});

export const BUCKET_NAME = process.env.IDRIVE_BUCKET_NAME || "your-public-bucket";
