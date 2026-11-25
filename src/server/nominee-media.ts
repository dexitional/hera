import { parseMediaUrl } from '#/lib/media-embed';
import { processImageUpload } from './image-upload';
import { processVideoUpload } from './video-upload';

// A nominee's optional campaign media from a submitted form (admin nominee
// form and the nominee's own portal profile):
//   flyer            File   -> new flyer image
//   removeFlyer      "true" -> clear the flyer
//   introVideoFile   File   -> uploaded intro video
//   introVideoUrl    string -> a YouTube/Facebook/Instagram/TikTok/Vimeo link
//                              (or a video file URL); "" clears it
// Returns only the columns to change.
//
// Kept out of the createServerFn modules for the client-bundle stripping
// reason documented in paystack-credit.ts.

export async function nomineeMediaFrom(data: FormData): Promise<{ flyerUrl?: string | null; introVideoUrl?: string | null }> {
  const out: { flyerUrl?: string | null; introVideoUrl?: string | null } = {};

  // Validate the link before uploading anything.
  const videoFile = data.get('introVideoFile');
  const linkRaw = data.get('introVideoUrl');
  let link: string | null | undefined;
  if (!(videoFile instanceof File && videoFile.size > 0) && typeof linkRaw === 'string') {
    const trimmed = linkRaw.trim();
    if (!trimmed) link = null;
    else {
      const embed = parseMediaUrl(trimmed);
      if (!embed || embed.kind === 'image') {
        throw new Error('Paste a link to the video on YouTube, Facebook, Instagram, TikTok or Vimeo (starting with https://), or upload a video file.');
      }
      link = trimmed;
    }
  }

  const flyer = data.get('flyer');
  if (flyer instanceof File && flyer.size > 0) {
    out.flyerUrl = await processImageUpload(flyer, { folder: 'flyers', maxWidth: 1600, maxHeight: 2000, quality: 82 });
  } else if (data.get('removeFlyer') === 'true') {
    out.flyerUrl = null;
  }

  if (videoFile instanceof File && videoFile.size > 0) {
    out.introVideoUrl = await processVideoUpload(videoFile, 'intro-videos');
  } else if (link !== undefined) {
    out.introVideoUrl = link;
  }
  return out;
}
