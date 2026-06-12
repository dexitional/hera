import fs from 'fs';
import path from 'path';
import { fetch } from 'undici'; // Standard Node.js fetch

const MODEL_DIR = path.resolve('./public/models/background-removal');
const BASE_URL = 'https://unpkg.com';
const FILES = [
  'model.onnx',
  'config.json'
];

async function preDownloadModels() {
  if (!fs.existsSync(MODEL_DIR)) {
    fs.mkdirSync(MODEL_DIR, { recursive: true });
  }

  for (const file of FILES) {
    const targetPath = path.join(MODEL_DIR, file);
    if (fs.existsSync(targetPath)) {
      console.log(`- ${file} already cached locally.`);
      continue;
    }

    console.log(`📥 Downloading production AI artifact: ${file}...`);
    const res = await fetch(`${BASE_URL}${file}`);
    const buffer = await res.arrayBuffer();
    fs.writeFileSync(targetPath, Buffer.from(buffer));
  }
  console.log('✅ AI Assets locked into static directory storage.');
}

preDownloadModels().catch(console.error);
