import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  // Configure the local development server headers
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
  plugins: [
    // Devtools MUST remain the first plugin in your configuration
    devtools(), 
    nitro({
      preset: 'node-server',
      // Explicitly activate the H3 WebSocket engine inside Nitro
      features: {
        websocket: true, 
      },
    }),
    tanstackStart(), 
    tailwindcss(), 
    viteReact(),
  ],
})
