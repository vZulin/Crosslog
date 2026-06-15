# Quickstart: Crosslog MVP

This quickstart defines the planned developer workflow. Commands become
enforceable once the project scaffold and scripts are implemented.

## Prerequisites

- Node.js active LTS.
- pnpm.
- Rust stable toolchain compatible with Tauri 2.
- Platform prerequisites for Desktop builds on the target OS.
- Browser dependencies required by Playwright.
- tauri-driver and WebdriverIO dependencies for Windows/Linux Desktop UI tests.
- Xcode command line tools for macOS XCTest/Accessibility Desktop UI tests.

## Install

```bash
pnpm install
```

## Run Web App

```bash
pnpm dev:web
```

## Run Desktop App

```bash
pnpm dev:desktop
```

## Build

```bash
pnpm build:web
pnpm build:desktop
```

Use OS wrappers for release validation:

```bash
bash scripts/macos/build.sh
bash scripts/linux/build.sh
pwsh scripts/windows/build.ps1
```

## Automated Tests

```bash
pnpm lint
pnpm test:unit
pnpm test:integration
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml
```

Use OS wrappers for phase validation:

```bash
bash scripts/macos/test.sh
bash scripts/linux/test.sh
pwsh scripts/windows/test.ps1
```

## UI Tests

```bash
pnpm test:ui:web
pnpm test:ui:desktop
```

On Windows and Linux, Desktop UI tests use WebdriverIO with tauri-driver. On
macOS, Desktop UI tests use the macOS XCTest/Accessibility harness.

Use OS wrappers for target-specific validation:

```bash
bash scripts/macos/test-ui.sh
bash scripts/linux/test-ui.sh
pwsh scripts/windows/test-ui.ps1
```

## Performance Checks

```bash
pnpm bench
```

Use OS wrappers for release validation:

```bash
bash scripts/macos/perf.sh
bash scripts/linux/perf.sh
pwsh scripts/windows/perf.ps1
```

## Validation Fixtures

Planning expects fixtures for:

- 20 MB log file open benchmark.
- 20 MB search benchmark.
- Directory with ordered, deleted, added, and recreated files.
- Logs with overlapping timestamps.
- Logs without timestamps.
- Logs with invalid timestamp candidates.
- Logs in UTF-8, UTF-8 BOM, UTF-16 LE, UTF-16 BE, Windows-1251, and
  Windows-1252.
- Corrupt and unreadable files.
- Logs containing command-like text and terminal escape sequences.

## Constitution Checks

- Do not write to opened log files.
- Do not execute or interpret log content as commands or HTML.
- Do not change expected test results to match broken behavior.
- Run automated tests after each phase.
- Run UI tests on the corresponding target OS for OS-specific Desktop behavior.
