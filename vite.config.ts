import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    // Lets Arkesel's USSD simulator reach the local dev server through an ngrok
    // tunnel. Leading-dot matches any subdomain, so this survives ngrok issuing
    // a new random subdomain on every tunnel restart (free tier).
    allowedHosts: ['.ngrok-free.app'],
  },
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
