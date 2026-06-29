#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

if [ -f "$HOME/.cargo/env" ]; then
  # Load user-space Rust toolchain when the shell has not sourced it yet.
  . "$HOME/.cargo/env"
fi

corepack pnpm lint
corepack pnpm test:unit
corepack pnpm test:integration
cargo test --locked --manifest-path apps/desktop/src-tauri/Cargo.toml
