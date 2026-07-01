param(
    [ValidateSet("all", "web", "desktop")]
    [string]$Mode = "all"
)

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "../..")
. (Join-Path $PSScriptRoot "invoke-checked-command.ps1")

function Invoke-WebUiTests {
    Invoke-CheckedCommand corepack pnpm test:ui:web
}

function Invoke-DesktopUiTests {
    Invoke-CheckedCommand corepack pnpm test:ui:desktop
}

switch ($Mode) {
    "all" {
        Invoke-WebUiTests
        Invoke-DesktopUiTests
    }
    "web" {
        Invoke-WebUiTests
    }
    "desktop" {
        Invoke-DesktopUiTests
    }
}
