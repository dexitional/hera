import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  optimizeDeps: {
    exclude: ['onnxruntime-web', '@imgly/background-removal'],
  },
  plugins: [
    // Devtools MUST remain the first plugin in your configuration
    devtools(),
    nitro({
      preset: 'node-server',
      features: {
        websocket: true,
      },
    }),
    tanstackStart(),
    tailwindcss(),
    viteReact(),
  ],
})
