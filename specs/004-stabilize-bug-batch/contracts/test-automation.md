# Contract: Bug Batch Test Automation

This contract extends:

- `/Users/Vladimir.Zulin/projects/idea/Crosslog/specs/001-multi-log-analysis/contracts/test-scripts.md`
- `/Users/Vladimir.Zulin/projects/idea/Crosslog/specs/003-macos-ui-design-alignment/contracts/test-automation.md`

## Test Reuse Rules

- Audit existing automated and UI/E2E tests before implementation is considered
  complete.
- Keep valid tests unchanged.
- Update tests only when they assert behavior reported as incorrect in
  `/Users/Vladimir.Zulin/projects/idea/Crosslog/docs/Bugs_1.txt`.
- Add missing automated or UI/E2E coverage for every numbered bug scenario.
- Expected results must come from the stabilization spec and bug report, not
  the current implementation.

## Existing Tests Reused Unchanged

- `packages/core/tests/directory/**`
- `packages/core/tests/encoding/**`
- `packages/core/tests/file-source/**`
- `packages/core/tests/session/**`
- `packages/core/tests/timestamps/**`
- Existing read-only and inert rendering integration tests in `tests/integration/**`
- Existing performance benchmarks in `tests/performance/**`, reused for
  regression gates when rendering, search, sync, or session behavior changes.

## Existing Tests Updated

- `packages/ui/tests/app-shell/empty-workspace.test.tsx`
- `packages/ui/tests/app-shell/redesigned-workspace.test.tsx`
- `packages/ui/tests/app-shell/search-entry-points.test.tsx`
- `packages/ui/tests/app-shell/activity-rail-future-actions.test.tsx`
- `packages/ui/tests/app-shell/redesigned-shell-final-a11y.test.tsx`
- `packages/ui/tests/app-shell/theme-variants.test.tsx`
- `packages/ui/tests/app-shell/shell-presentation.test.tsx`
- `packages/ui/tests/pane-rail/pane-layout.test.tsx`
- `packages/ui/tests/pane-rail/pane-workspace-alignment.test.tsx`
- `packages/ui/tests/search/pane-search-popover.test.tsx`
- `packages/ui/tests/log-pane/log-text-copy.test.tsx`
- `packages/ui/tests/sync/time-offset-popover.test.tsx`
- `apps/web/tests/ui/log-search.spec.ts`
- `apps/web/tests/ui/log-text-copy.spec.ts`
- `apps/web/tests/ui/time-offset-popover.spec.ts`
- `apps/web/tests/ui/multi-pane-layout.spec.ts`
- `apps/web/tests/ui/browser-drag-drop.spec.ts`
- `apps/web/tests/ui/redesigned-shell-viewports.spec.ts`
- Desktop WDIO equivalents under `apps/desktop/tests/ui/*.spec.ts`
- macOS XCTest equivalents under `apps/desktop/tests/ui/macos/*.swift`

## New Coverage Matrix

| Bug area | Required coverage |
| --- | --- |
| Source opening | Picker invocation, selected file, selected directory, cancel, no demo source from product UI, fixture setup through test helpers only. |
| Disabled future controls | Activity rail source-list, activity rail search, and command field disabled or inert; settings remains active. |
| Pane width | Single-pane fill, multi-pane fit, overflow, longest-line reachability, no excessive blank scroll space. |
| Vertical scroll | Wheel/scroll reaches all loaded lines and syncs eligible panes when enabled. |
| Pane reordering | Header drag midpoint threshold, multi-position reorder, stable intervening order, cancel/no corruption. |
| Gutter width | Digit-count boundaries for 9/10/99/100/999/1000+ lines and no-overlap. |
| Keyboard navigation | Arrow left/right/up/down, selected-line movement, sync-scroll behavior when enabled. |
| Search icon | Hover/focus highlight surrounds the icon and does not shift. |
| Search highlighting | Inline text spans only, text/regex/case-sensitive modes, close cleanup, last navigated line preserved. |
| Copy action | Pointer-relative position, viewport boundary adjustment, left-click dismissal, right-click relocation, no `Copied` product text. |
| Time offset | Days unbounded, hours/minutes/seconds/milliseconds boundaries, blank-as-zero, invalid field accessibility, sync after valid apply. |
| Sync icon | Distinct inactive, active, hover, and accessible pressed states. |
| Settings/theme | Settings opens, System/Light/Dark choices, fresh default System, state preserved after theme changes. |
| Viewport/no-overlap | Changed shell, pane header, viewport, popover, copy action, settings, and topbar surfaces across required viewports. |

## Local Current-OS Gate

Current local OS is macOS. Before commit, run targeted tests during
implementation and then:

```bash
bash scripts/macos/test.sh
bash scripts/macos/test-ui.sh
```

Run when performance-sensitive rendering, scrolling, search, synchronization,
session, or release readiness is affected:

```bash
bash scripts/macos/perf.sh
bash scripts/macos/build.sh
```

## CI/CD Gate After Push

After push, monitor GitHub Actions or the configured CI/CD checks until every
required target is green:

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

Any CI/CD failure after push must be investigated and fixed before completion.
