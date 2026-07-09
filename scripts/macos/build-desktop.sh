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

corepack pnpm --filter @crosslog/desktop tauri build --bundles app,dmg --no-sign -- --locked

app_bundle_path="apps/desktop/src-tauri/target/release/bundle/macos/Crosslog.app"
dmg_bundle_dir="apps/desktop/src-tauri/target/release/bundle/dmg"

if [ ! -d "$app_bundle_path" ]; then
  echo "Expected macOS app bundle was not created: $app_bundle_path" >&2
  exit 1
fi

shopt -s nullglob
dmg_files=("$dmg_bundle_dir"/*.dmg)
shopt -u nullglob

if [ "${#dmg_files[@]}" -eq 0 ]; then
  echo "Expected macOS DMG was not created under: $dmg_bundle_dir" >&2
  exit 1
fi

printf 'Built macOS app bundle: %s\n' "$app_bundle_path"
printf 'Built macOS DMG: %s\n' "${dmg_files[@]}"
