# Quickstart: Crosslog Bug Batch 2 Stabilization

Validation flow for implementing the plan from
`/Users/Vladimir.Zulin/projects/idea/Crosslog/specs/005-stabilize-bug-batch-2/plan.md`.

## Prerequisites

- Node.js 22 or compatible active LTS.
- Corepack enabled for pnpm 9.15.4.
- Rust stable compatible with the Desktop crate; Tauri 2 prerequisites for the OS.
- Playwright browser dependencies.
- WebdriverIO/tauri-driver prerequisites for Desktop UI tests.
- macOS Xcode command-line tools and Accessibility permissions for macOS UI tests.

## Local Setup

Run from `/Users/Vladimir.Zulin/projects/idea/Crosslog`:

```bash
corepack enable
corepack pnpm install --frozen-lockfile
```

## Incremental Targeted Validation

Run focused tests as each area changes:

```bash
# Bug 1 dark theme
corepack pnpm vitest run packages/ui/tests/app-shell/theme-variants.test.tsx

# Bug 2 Desktop picker
corepack pnpm vitest run packages/platform/tests/tauri/tauri-source-picker.test.ts

# Bug 3 Desktop drag-drop
corepack pnpm vitest run packages/platform/tests/tauri/tauri-drag-drop-source.test.ts

# Bug 4 Web directory
corepack pnpm vitest run packages/platform/tests/browser/browser-source-picker.test.ts packages/platform/tests/browser/browser-directory-access.test.ts

# Bug 5 vertical scroll
corepack pnpm vitest run packages/ui/tests/log-pane/virtual-log-viewport.test.tsx

# Bug 6 header reorder
corepack pnpm vitest run packages/ui/tests/pane-rail/pane-layout.test.tsx

# Bug 7 icon centering
corepack pnpm vitest run packages/ui/tests/app-shell/icon-button-accessibility.test.tsx
```

## Per-Scenario Manual Validation

- Bug 1: Open Desktop in dark theme; compare surfaces against the mockups.
- Bug 2: Click add-pane/open-source on Desktop; the native picker opens; select a
  file, then a directory; cancel once — nothing changes.
- Bug 3: Drag a file and a directory onto the Desktop window; each opens.
- Bug 4: In the Web app, open a directory as well as a file.
- Bug 5: Scroll a long log; the text advances and returns; first/last lines are
  reachable.
- Bug 6: Drag a pane by the header title (not the handle) across another pane;
  it reorders; click header controls — they act, no drag.
- Bug 7: Hover the sync toggle, add-pane, close-pane, activity-rail icons, and
  search arrows; each icon sits centered in its hover zone.

## Local Gates Before Commit (macOS)

```bash
bash scripts/macos/test.sh
bash scripts/macos/test-ui.sh web
bash scripts/macos/test-ui.sh desktop
# plus build.sh / perf.sh when rendering or scroll is affected
```

## CI/CD After Push

Monitor `.github/workflows/ci.yml` ("CI/CD"); the batch is complete only when all
required automated-tests, ui-tests, windows-desktop-ui-tests, build-web, and
build-desktop jobs are green on Windows, macOS, and Linux.
