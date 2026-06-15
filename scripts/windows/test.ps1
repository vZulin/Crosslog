$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "../..")
corepack pnpm lint
corepack pnpm test:unit
corepack pnpm test:integration
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml

