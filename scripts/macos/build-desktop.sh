#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

if [ -f "$HOME/.cargo/env" ]; then
  # Load user-space Rust toolchain when the shell has not sourced it yet.
  . "$HOME/.cargo/env"
fi

command -v cargo >/dev/null || {
  echo "cargo is required to build the Desktop app." >&2
  exit 127
}

corepack pnpm --filter @crosslog/desktop tauri build -- --locked
