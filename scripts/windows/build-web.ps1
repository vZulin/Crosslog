$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "../..")
corepack pnpm build:web

