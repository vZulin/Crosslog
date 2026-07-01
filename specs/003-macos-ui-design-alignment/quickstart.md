# Quickstart: Crosslog macOS UI Design Alignment

This quickstart defines the validation flow for implementing the UI
design-alignment plan. It assumes the existing Crosslog stack and scripts remain
unchanged.

## Prerequisites

- Node.js 22 or compatible active LTS.
- Corepack enabled for pnpm 9.15.4.
- Rust stable compatible with the Desktop crate.
- Tauri 2 prerequisites for the target OS.
- Playwright browser dependencies.
- WebdriverIO/Tauri WebDriver prerequisites for Desktop UI tests.
- macOS Xcode command-line tools and Accessibility permissions for macOS UI
  tests.

## Local Setup

Run from `/Users/Vladimir.Zulin/projects/idea/Crosslog`:

```bash
corepack enable
corepack pnpm install --frozen-lockfile
```

## Incremental Local Validation

After CSS/token-only changes:

```bash
bash scripts/macos/test.sh
```

After topbar, empty workspace, pane workspace, pane header, popover, theme, or
platform shell changes:

```bash
bash scripts/macos/test.sh
bash scripts/macos/test-ui.sh
```

After rendering, scrolling, search, or session behavior changes:

```bash
bash scripts/macos/test.sh
bash scripts/macos/test-ui.sh
bash scripts/macos/perf.sh
```

Before release readiness:

```bash
bash scripts/macos/test.sh
bash scripts/macos/test-ui.sh
bash scripts/macos/perf.sh
bash scripts/macos/build.sh
```

## Required UI Checks

Verify these user-visible outcomes before closing implementation:

- No obsolete controls appear: permanent `Copy` toolbar, `Discover newer
  directory file`, `Append live line`, `Delete active file`, `Replace active
  file`, `Split`, `Synchronize by time`, topbar `Sync on/off`, plus/minus
  resize controls, per-pane `ready` footer, or persistent workspace action
  toolbar.
- Empty workspace shows shared topbar height, visible activity rail, centered
  drop zone, `Open Source`, and drag/drop entry.
- Light and dark runtime/mockup/test presentation variants affect actual
  application surfaces without adding product-visible theme selectors or new
  persisted UI preference storage.
- macOS, Windows, Linux, and Web variants render distinct shell chrome while
  sharing product behavior, and Windows/Linux UI gates record default OS chrome.
- Panes drag-resize by boundaries, persist desired widths, fill the right edge
  when they fit, and scroll horizontally only when they overflow.
- File and directory pane headers match target structure and do not overlap
  under long names.
- Pane search and time offset popovers open in the pane that invoked them and
  return focus on Escape.
- Future rail and left-panel surfaces do not execute out-of-scope behavior.
- A timed review records that the empty workspace makes the source-opening path
  identifiable within 5 seconds. Evidence includes reviewer role,
  empty-workspace start condition, viewport/platform, 5-second result, and
  pass/fail outcome in `validation-log.md`.

## Test Migration Flow

1. Run the local macOS automated gate.
2. Update component tests for tokens, shell regions, topbar, pane workspace,
   headers, popovers, and obsolete-control absence.
3. Update Web Playwright selectors and layout assertions.
4. Update Desktop WDIO selectors and interactions.
5. Update macOS XCTest/Accessibility selectors and interactions.
6. Add only the missing alignment tests listed in
   `contracts/test-automation.md`.
7. Re-run the local macOS automated and UI gates.

## GitHub Actions Validation

After local validation passes, push the feature branch and require all OS
targets to pass:

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

## Completion Criteria

- `plan.md`, `research.md`, `data-model.md`, contracts, and this quickstart
  contain no unresolved clarification markers.
- Existing unchanged behavior tests are reused.
- Updated UI tests cover selector/accessibility/layout deltas.
- New tests cover only the documented alignment gaps.
- Obsolete-control removal and rightmost-pane alignment are explicitly tested.
