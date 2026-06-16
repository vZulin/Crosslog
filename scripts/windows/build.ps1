$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "../..")
. (Join-Path $PSScriptRoot "invoke-checked-command.ps1")

Invoke-CheckedCommand pwsh -File ./scripts/windows/build-web.ps1
Invoke-CheckedCommand pwsh -File ./scripts/windows/build-desktop.ps1
