$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "../..")
corepack pnpm bench

