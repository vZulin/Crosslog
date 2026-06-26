# Quickstart: Crosslog Activity Rail Redesign

This quickstart defines the planned validation workflow for implementing the Activity Rail redesign.

## Prerequisites

- Node.js 22 or compatible active LTS.
- Corepack enabled for pnpm 9.15.4.
- Rust stable compatible with the Desktop crate's `rust-version`.
- Tauri 2 prerequisites for the target OS.
- Playwright browser dependencies for Web UI tests.
- Windows/Linux Desktop UI prerequisites for WebdriverIO and the Tauri WebDriver path.
- macOS Xcode command-line tools and XCTest/Accessibility permissions for macOS Desktop UI tests.

## Local macOS Workflow

From the repository root:

```bash
corepack enable
corepack pnpm install --frozen-lockfile
bash scripts/macos/test.sh
bash scripts/macos/test-ui.sh
```

Run performance and build gates before release readiness or after performance-sensitive UI changes:

```bash
bash scripts/macos/perf.sh
bash scripts/macos/build.sh
```

The macOS UI script must execute real Web UI and Desktop UI/E2E behavior. If it only validates XCTest harness file presence, implementation is not release-ready.

## Performance Reference Gate

Before release readiness, run `bash scripts/macos/perf.sh` locally and verify that the recorded measurements cover:

- 20 MB file open time.
- 20 MB loaded-log search time.
- Directory switching with at least 100 top-level files.
- Synchronization accuracy on deterministic overlapping timestamp fixtures.
- Redesigned shell viewport/no-overlap checks where rendering changes affect layout.

Record the fixture names, runner OS, command, measured runs, and worst-run result in the implementation notes.

## Usability Walkthrough Gate

Before release readiness, record a walkthrough protocol for SC-002 that defines participant role, task setup, timing method, pass/fail criteria, and where the result is stored. The protocol must cover identification of the active pane, pane count, synchronization state, and active source from the redesigned UI.

## Figma Audit Workflow

Before changing UI code:

1. Inspect Figma frame `Crosslog Window`, node `11:3`.
2. Record required regions: topbar, command field, activity rail, pane workspace, pane headers, search popover, time offset popover, workspace scrollbar, and status bar.
3. Mark future controls that are not MVP: filter, palette/highlight, bookmark, saved filters, recursive search, and remote sources.
4. Confirm accessible names for icon-only controls.
5. Confirm long-label and narrow-viewport behavior before implementation tasks are closed.

## Test Migration Workflow

1. Run existing tests to identify UI-only failures caused by the redesign.
2. Keep core, integration, Rust adapter, and performance expected results unchanged.
3. Update Web UI tests under `apps/web/tests/ui/` for the redesigned shell.
4. Update Desktop WDIO tests under `apps/desktop/tests/ui/*.spec.ts` for Windows/Linux behavior.
5. Update macOS XCTest/Accessibility tests under `apps/desktop/tests/ui/macos/` for the same user stories.
6. Add missing tests for topbar, activity rail, command field, status bar, pane search popover, and time offset popover.

## GitHub CI/CD Workflow

The workflow must run these gates on GitHub Actions:

```text
Windows:
  pwsh scripts/windows/test.ps1
  pwsh scripts/windows/test-ui.ps1
  pwsh scripts/windows/build.ps1

macOS:
  bash scripts/macos/test.sh
  bash scripts/macos/test-ui.sh
  bash scripts/macos/build.sh

Linux:
  bash scripts/linux/test.sh
  bash scripts/linux/test-ui.sh
  bash scripts/linux/build.sh
```

For this macOS workstation, Windows and Linux validation is expected through GitHub Actions. Release readiness requires all OS jobs to pass.

## Completion Checklist

- Figma audit decisions are reflected in `research.md` and contracts.
- No non-MVP rail control performs filtering, highlighting, bookmark, saved-filter, recursive-search, or remote-source behavior.
- `bash scripts/macos/test.sh` passes locally.
- `bash scripts/macos/test-ui.sh` passes locally and executes real UI/E2E behavior.
- The SC-002 usability walkthrough protocol is recorded.
- Performance reference fixture names, runner OS, measured runs, and worst-run results are recorded.
- GitHub Actions passes automated tests and UI/E2E tests for Windows, macOS, and Linux.
- Existing read-only, inert-rendering, session, search, synchronization, and performance tests remain requirement-driven.
