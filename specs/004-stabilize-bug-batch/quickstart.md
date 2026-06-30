# Quickstart: Crosslog Bug Batch Stabilization

This quickstart defines the validation flow for implementing the stabilization
plan from `/Users/Vladimir.Zulin/projects/idea/Crosslog/specs/004-stabilize-bug-batch/plan.md`.

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

## Incremental Targeted Validation

Run focused tests as each area changes:

```bash
corepack pnpm exec vitest run packages/ui/tests/app-shell/empty-workspace.test.tsx
corepack pnpm exec vitest run packages/ui/tests/app-shell/search-entry-points.test.tsx
corepack pnpm exec vitest run packages/ui/tests/pane-rail/pane-layout.test.tsx packages/ui/tests/pane-rail/pane-workspace-alignment.test.tsx
corepack pnpm exec vitest run packages/ui/tests/search/pane-search-popover.test.tsx packages/ui/tests/log-pane/log-text-copy.test.tsx
corepack pnpm exec vitest run packages/ui/tests/sync/time-offset-popover.test.tsx
corepack pnpm exec vitest run packages/ui/tests/app-shell/theme-variants.test.tsx packages/ui/tests/sync/redesigned-sync-controls.test.tsx
```

Run targeted Web UI tests after shared UI behavior changes:

```bash
corepack pnpm exec playwright test --config playwright.config.ts apps/web/tests/ui/multi-pane-layout.spec.ts apps/web/tests/ui/log-search.spec.ts apps/web/tests/ui/log-text-copy.spec.ts apps/web/tests/ui/time-offset-popover.spec.ts apps/web/tests/ui/browser-drag-drop.spec.ts
```

## Local Current-OS Gates Before Commit

Run from `/Users/Vladimir.Zulin/projects/idea/Crosslog`:

```bash
bash scripts/macos/test.sh
bash scripts/macos/test-ui.sh
```

Run performance/build gates when affected:

```bash
bash scripts/macos/perf.sh
bash scripts/macos/build.sh
```

## Manual Review Checklist

- Product `Open Source` and `Add pane` open user source selection, not demo
  sources.
- Activity rail `Open sources`, activity rail search, and command field are
  disabled or inert until their future surfaces exist.
- Empty workspace drag/drop opens supported dropped sources.
- Pane width uses space efficiently and avoids excessive horizontal blank
  scroll area.
- Vertical scroll, arrow-key navigation, and sync-scroll behavior work in log
  viewports.
- Pane headers can reorder panes by drag and do not overlap controls.
- Line-number gutter width follows digit count.
- Pane search highlights only matched text and clears highlights on close.
- Copy action appears beside the pointer, dismisses/moves correctly, and shows
  no `Copied` product text.
- Time offset boundaries and blank-as-zero behavior are correct.
- Sync icon active/inactive/hover states are distinct.
- Settings opens and theme defaults to System with Light/Dark options.

## CI/CD Validation After Push

After local validation passes, push the branch and monitor required checks:

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

Every failure found after push must be fixed before the bug batch is complete.
