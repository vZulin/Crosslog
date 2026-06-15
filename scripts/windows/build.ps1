$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "../..")
& ./scripts/windows/build-web.ps1
& ./scripts/windows/build-desktop.ps1

