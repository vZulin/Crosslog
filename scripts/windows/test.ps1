param(
    [ValidateSet("all", "js", "rust")]
    [string]$Mode = "all"
)

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "../..")
. (Join-Path $PSScriptRoot "invoke-checked-command.ps1")

function Invoke-JsAutomatedTests {
    Invoke-CheckedCommand corepack pnpm lint
    Invoke-CheckedCommand corepack pnpm test:unit
    Invoke-CheckedCommand corepack pnpm test:integration
}

function Invoke-RustAutomatedTests {
    Invoke-CheckedCommand cargo test --locked --manifest-path apps/desktop/src-tauri/Cargo.toml
}

switch ($Mode) {
    "all" {
        Invoke-JsAutomatedTests
        Invoke-RustAutomatedTests
    }
    "js" {
        Invoke-JsAutomatedTests
    }
    "rust" {
        Invoke-RustAutomatedTests
    }
}
