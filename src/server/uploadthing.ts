// src/server/uploadthing.ts
import { createUploadthing,createRouteHandler } from "uploadthing/next";
const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    .onUploadComplete(async ({ metadata, file }: any) => {
      // 1. This block executes strictly on your server after the file hits the cloud
      console.log("File URL ready for database:", file.url); 
      
    //   // 2. Save the URL to your database record
    //   const updatedUser = await db.user.update({
    //     where: { id: "user_123" }, 
    //     data: { avatarUrl: file.url }
    //   });
      
      return { uploadedBy: "user_123", newUrl: file.url };
    }),
};



// Export the GET and POST handlers created by UploadThing
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});