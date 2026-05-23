// src/utils/uploadthing.ts
import {
    generateUploadButton,
    generateUploadDropzone,
  } from "@uploadthing/react";
  
  // Import your router's TYPE only, keeping your backend code out of the bundle
  import type { OurFileRouter } from "../server/uploadthing"; 
  
  // Export components explicitly typed to your endpoints
  export const UploadButton = generateUploadButton<OurFileRouter>();
  export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
  