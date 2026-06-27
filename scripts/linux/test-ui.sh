#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."
corepack pnpm test:ui:web

if [[ -n "${DISPLAY:-}" ]]; then
  corepack pnpm test:ui:desktop
else
  xvfb-run -a --server-args="-screen 0 1280x960x24" corepack pnpm test:ui:desktop
fi
