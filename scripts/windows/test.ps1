$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "../..")
. (Join-Path $PSScriptRoot "invoke-checked-command.ps1")

Invoke-CheckedCommand corepack pnpm lint
Invoke-CheckedCommand corepack pnpm test:unit
Invoke-CheckedCommand corepack pnpm test:integration
Invoke-CheckedCommand cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml
