#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

if [ -f "$HOME/.cargo/env" ]; then
  # Load user-space Rust toolchain when the shell has not sourced it yet.
  . "$HOME/.cargo/env"
fi

command -v corepack >/dev/null || {
  echo "corepack is required to run the pinned pnpm package manager." >&2
  exit 127
}

corepack pnpm lint
corepack pnpm test:unit
corepack pnpm test:integration

if command -v cargo >/dev/null; then
  cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml
else
  echo "cargo is required for Rust adapter tests." >&2
  exit 127
fi
