import { defineConfig } from 'vitest/config'

// Separate from vite.config.ts on purpose: the nitro() plugin there crashes
// when Vitest boots its dev server ("Cannot read properties of null (reading
// 'on')"), which made `npm test` unusable. Vitest prefers this file when present.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
