$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "../..")
corepack pnpm test:ui:web
corepack pnpm test:ui:desktop

