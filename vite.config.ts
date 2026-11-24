import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import viteReact from '@vitejs/plugin-react'

// Applied to every response by Nitro.
//
// The Content-Security-Policy is REPORT-ONLY for now: violations are logged
// in the browser console but nothing is blocked. Walk through voter login
// (credential / OTP / Google), ballot casting, card checkout and admin image
// upload with the console open; once it is clean, rename the header to
// 'Content-Security-Policy' to enforce it.
const contentSecurityPolicy = [
  "default-src 'self'",
  // 'unsafe-inline': TanStack's SSR hydration scripts and the theme init
  // script are inline. Move to nonces before tightening further.
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://js.paystack.co https://accounts.google.com https://apis.google.com https://unpkg.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://api.paystack.co https://accounts.google.com https://www.googleapis.com https://staticimgly.com https://unpkg.com",
  "worker-src 'self' blob:",
  "frame-src https://checkout.paystack.com https://accounts.google.com",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com",
].join('; ')

const securityHeaders = {
  'Content-Security-Policy-Report-Only': contentSecurityPolicy,
  // No includeSubDomains/preload: other *.heravote.com hosts must be confirmed
  // HTTPS-only before widening this.
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

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
      routeRules: {
        '/**': { headers: securityHeaders },
      },
    }),
    tanstackStart(),
    tailwindcss(),
    viteReact(),
  ],
})
