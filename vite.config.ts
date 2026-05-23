import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

// const config = defineConfig({
//   resolve: { tsconfigPaths: true },
//   plugins: [devtools(), tailwindcss(), tanstackStart(), viteReact()],
// })

export default defineConfig({
  plugins: [
    nitro({
      preset: 'node-server', // Or 'vercel', 'cloudflare-workers', etc.
    }),
    tanstackStart(), devtools(), tailwindcss(), 
  ],
})