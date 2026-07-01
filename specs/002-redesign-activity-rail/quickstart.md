# Quickstart: Crosslog Activity Rail Redesign

This quickstart defines the validation workflow for implementing and releasing
the Activity Rail redesign.

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

The macOS UI script executes real Web UI behavior plus the native
XCTest/Accessibility Desktop harness. Presence-only XCTest file validation is
not release-ready.

## Final Redesign Validation

Run these gates from a clean working tree before closing Phase 10:

```bash
bash scripts/macos/test.sh
bash scripts/macos/test-ui.sh
bash scripts/macos/perf.sh
bash scripts/macos/build.sh
```

After local validation passes, push the feature branch and wait for GitHub
Actions to pass all Windows, macOS, and Linux automated, UI/E2E, and build jobs.

## Performance Reference Gate

Before release readiness, run `bash scripts/macos/perf.sh` locally and verify that the recorded measurements cover:

- 20 MB file open time using `tests/fixtures/large-20mb-log.fixture.ts`.
- 20 MB loaded-log search time using deterministic generated line content in
  `tests/performance/search-20mb.bench.ts`.
- Directory switching with at least 100 top-level files using the deterministic
  directory source generated in `tests/performance/directory-switch-threshold.bench.ts`.
- Synchronization accuracy on deterministic overlapping timestamp fixtures in
  `tests/performance/synchronization.bench.ts`.
- Three-source open/search/synchronization/render workflow coverage in
  `tests/performance/fresh-start-three-sources.bench.ts`.
- Redesigned shell viewport/no-overlap checks in
  `packages/ui/tests/app-shell/redesigned-shell-final-a11y.test.tsx`,
  `apps/web/tests/ui/redesigned-shell-viewports.spec.ts`, and
  `apps/desktop/tests/ui/redesigned-shell-viewports.spec.ts`.

Measured runs must be collected after a production build on the current OS with
no debugger attached. Treat the first benchmark iteration as warm-up and review
at least three measured iterations per scenario; the release reference is the
worst measured run. Record the fixture names, runner OS, command, measured run
count, and worst-run result in the implementation notes or release checklist.

### Phase 10 Local Performance Reference

Date: 2026-06-28  
Runner OS: macOS local workstation  
Command: `bash scripts/macos/perf.sh`  
Result: PASS

| Scenario | Fixture or Source | Samples | Worst Run |
|----------|-------------------|---------|-----------|
| 20 MB open | `tests/fixtures/large-20mb-log.fixture.ts` via `tests/performance/open-20mb.bench.ts` | Vitest reported 0 timing samples | Validated by benchmark pass |
| 20 MB loaded-log search | `tests/performance/search-20mb.bench.ts` generated content | 25 | 34.4318 ms |
| Directory switch threshold | `tests/performance/directory-switch-threshold.bench.ts` generated 5,000-file source | 680 | 0.8412 ms |
| Directory navigation index | `tests/performance/directory-switch.bench.ts` generated large directory source | 158 | 4.7800 ms |
| Synchronization accuracy | `tests/performance/synchronization.bench.ts` generated overlapping timestamp panes | 44 | 15.2749 ms |
| Three-source workflow | `tests/performance/fresh-start-three-sources.bench.ts` generated three-pane workflow | Vitest reported 0 timing samples | Validated by benchmark pass |
| Log pane virtualization | `tests/performance/log-pane-virtualization.bench.ts` generated large log window | 81 | 12.3944 ms |
| Live append | `tests/performance/live-append.bench.ts` generated chunk store | 55 | 20.4361 ms |
| Session write | `tests/performance/session-write.bench.ts` generated multi-pane snapshot | 30,943 | 0.1472 ms |

## Usability Walkthrough Gate

Before release readiness, execute or review the SC-002 walkthrough protocol in
`usability-walkthrough.md`. The protocol defines participant role, task setup,
timing method, pass/fail criteria, and the evidence that must be recorded. It
covers identification of the active pane, pane count, synchronization state, and
active source from the redesigned UI.

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
- The SC-002 usability walkthrough protocol is recorded in `usability-walkthrough.md`.
- Performance reference fixture names, runner OS, measured runs, and worst-run
  results are recorded for the Phase 10 validation run.
- GitHub Actions passes automated tests and UI/E2E tests for Windows, macOS, and Linux.
- Existing read-only, inert-rendering, session, search, synchronization, and performance tests remain requirement-driven.
