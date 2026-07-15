import { defineConfig, mergeConfig } from 'vite';
import baseConfig from './vite.config.ts';

// Local-only override: node_modules/.vite/deps is root-owned in this environment
// (leftover from however the dev server was first started, long before this
// session) and the current user can't write to it, which breaks Vite's dep
// pre-bundling step on every cold start. Redirects the cache to a writable
// location instead. NOT meant to be committed -- gitignored below.
export default defineConfig((env) =>
  mergeConfig(
    typeof baseConfig === 'function' ? baseConfig(env) : baseConfig,
    { cacheDir: 'node_modules/.vite-user-cache' },
  ),
);
