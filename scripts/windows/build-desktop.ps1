$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "../..")
. (Join-Path $PSScriptRoot "invoke-checked-command.ps1")

Invoke-CheckedCommand -FilePath corepack -ArgumentList @(
    "pnpm",
    "--filter",
    "@crosslog/desktop",
    "tauri",
    "build",
    "--",
    "--locked"
)
