import { removeBackground } from "@imgly/background-removal";

const IMGLY_ASSET_PATH =
  "https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function compositePassport(img: HTMLImageElement): string {
  const width = img.naturalWidth;
  const height = img.naturalHeight;
  const cropSize = Math.min(width, height);
  const leftOffset = Math.floor((width - cropSize) / 2);
  const topOffset = Math.floor((height - cropSize) * 0.25);
  const scale = 600 / cropSize;

  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 600;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not initialize image canvas.");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 600, 600);
  ctx.drawImage(
    img,
    -leftOffset * scale,
    -topOffset * scale,
    width * scale,
    height * scale,
  );

  return canvas.toDataURL("image/jpeg", 0.95);
}

export async function createPassportPhoto(
  sourceDataUrl: string,
  onProgress?: (fraction: number) => void,
): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("Passport photo processing must run in the browser.");
  }

  const transparentBlob = await removeBackground(sourceDataUrl, {
    publicPath: IMGLY_ASSET_PATH,
    // model: "small",
    model: "isnet",
    device: "cpu",
    proxyToWorker: false,
    progress: (_key:any, current:any, total:any) => {
      if (total > 0) onProgress?.(current / total);
    },
  });

  const transparentUrl = URL.createObjectURL(transparentBlob);
  try {
    const img = await loadImage(transparentUrl);
    return compositePassport(img);
  } finally {
    URL.revokeObjectURL(transparentUrl);
  }
}
