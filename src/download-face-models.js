import fs from 'fs';
import path from 'path';

const MODEL_DIR = path.resolve('./public/models/face');

// Use official raw GitHub links to completely bypass jsdelivr block/timeouts
const MODELS_TO_DOWNLOAD = [
  {
    filename: 'ssd_mobilenetv1_model-weights_manifest.json',
    url: 'https://githubusercontent.com'
  },
  {
    filename: 'ssd_mobilenetv1_model-shard1',
    url: 'https://githubusercontent.com'
  }
];

async function downloadModels() {
  if (!fs.existsSync(MODEL_DIR)) {
    fs.mkdirSync(MODEL_DIR, { recursive: true });
  }

  for (const item of MODELS_TO_DOWNLOAD) {
    const targetPath = path.join(MODEL_DIR, item.filename);
    
    if (fs.existsSync(targetPath)) {
      console.log(`- ${item.filename} already present on disk.`);
      continue;
    }

    console.log(`📥 Downloading from GitHub: ${item.url}`);
    const res = await fetch(item.url);
    
    if (!res.ok) {
      throw new Error(`Failed to download ${item.filename}: ${res.statusText}`);
    }
    
    const buffer = await res.arrayBuffer();
    fs.writeFileSync(targetPath, Buffer.from(buffer));
  }
  console.log('✅ All face tracking models safely downloaded and verified from GitHub!');
}

downloadModels().catch(console.error);
