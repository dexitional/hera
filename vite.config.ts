import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import viteReact from '@vitejs/plugin-react'

// const config = defineConfig({
//   resolve: { tsconfigPaths: true },
//   plugins: [devtools(), tailwindcss(), tanstackStart(), viteReact()],
// })

export default defineConfig({
   // Configure the local development server headers
   server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
  plugins: [
    nitro({
      preset: 'node-server', // Or 'vercel', 'cloudflare-workers', etc.
    }),
    tanstackStart(), 
    devtools(), 
    tailwindcss(), 
    viteReact(),
  ],
})