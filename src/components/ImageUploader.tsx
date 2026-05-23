import React, { useState } from "react";
import { getPresignedUploadUrl } from "../server/storage";

export function ImageUploader() {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. Fetch pre-signed URL from server function
      const { uploadUrl, finalFileUrl } = await getPresignedUploadUrl({
        fileName: file.name,
        fileType: file.type,
      } as any);

      // 2. Upload binary file data directly to storage bucket
      const response = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!response.ok) throw new Error("Upload failed");

      // 3. Save finalFileUrl to PostgreSQL using Drizzle
      console.log("Saved to DB successfully:", finalFileUrl);
    } catch (error) {
      console.error("Upload process failed:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && <p>Uploading your image directly to secure storage...</p>}
    </div>
  );
}
