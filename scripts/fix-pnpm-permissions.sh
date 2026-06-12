#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Fixing ownership (sudo pnpm leaves node_modules owned by root)..."
sudo chown -R "$(whoami):staff" node_modules pnpm-lock.yaml 2>/dev/null || true

echo "==> Pruning partial downloads from the old 113MB server package..."
pnpm store prune 2>/dev/null || true

echo "==> Installing dependencies (browser package is ~1MB, not 113MB)..."
pnpm install

echo "==> Done. Always use plain 'pnpm' — never 'sudo pnpm'."
