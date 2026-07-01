# Contract: Test Automation For UI Alignment

This contract extends
`/Users/Vladimir.Zulin/projects/idea/Crosslog/specs/002-redesign-activity-rail/contracts/test-automation.md`.

## Reuse Rules

- Reuse existing core, platform, integration, Rust, performance, search, sync,
  directory navigation, session restore, encoding, and safety tests unchanged
  unless a real requirement gap is found.
- Update UI tests for selector, accessible-name, shell-region, and visual
  contract changes instead of rewriting them from scratch.
- Add new tests only for documented alignment deltas.
- Expected results must remain requirement-derived.

## Tests Reused Unchanged

- `packages/core/tests/**`
- `packages/platform/tests/**`
- `tests/integration/**`
- Rust tests under `apps/desktop/src-tauri`
- `tests/performance/**`, with `bash scripts/macos/perf.sh` required when
  rendering, scrolling, search, or session behavior changes

## Tests Updated

- `packages/ui/tests/app-shell/redesigned-workspace.test.tsx`
- `packages/ui/tests/app-shell/redesigned-shell-final-a11y.test.tsx`
- `packages/ui/tests/app-shell/redesigned-shell-responsive.test.tsx`
- `packages/ui/tests/app-shell/search-entry-points.test.tsx`
- `packages/ui/tests/pane-rail/pane-layout.test.tsx`
- `packages/ui/tests/log-pane/*.test.tsx`
- `packages/ui/tests/search/pane-search-popover.test.tsx`
- `packages/ui/tests/sync/*.test.tsx`
- `apps/web/tests/ui/*.spec.ts`
- `apps/desktop/tests/ui/*.spec.ts`
- `apps/desktop/tests/ui/macos/*.swift`

Expected updates include:

- `Open logs` -> `Open Source` or supported source-opening action.
- Sync checkbox/text assertions -> icon button state assertions and statusbar
  summary assertions.
- `Split active pane` -> add-pane icon that splits rightmost pane.
- Resize plus/minus clicks -> drag boundary interactions.
- Permanent Copy toolbar assumptions -> selection/context-menu/keyboard copy
  behavior.
- Global popover assumptions -> pane-local popover assertions.

## New Tests

| Requirement | Required coverage |
| --- | --- |
| Obsolete controls absent | Component and UI/E2E assertions for empty and populated workspaces. |
| Empty workspace alignment | Topbar height, activity rail, centered drop zone, `Open Source`, drag/drop entry, drag-over no shift, and recorded source-opening recognition review with reviewer role, empty-workspace start condition, viewport/platform, 5-second result, and pass/fail outcome. |
| Theme variants | Runtime/mockup/test light and dark presentation tokens applied to topbar, rail, panes, popovers, statusbar, log rows, warnings, errors, and tags; no product-visible theme selector is required or added. |
| Platform variants | macOS traffic lights, Windows caption controls, Linux caption controls, and Web no radius/shadow through presentation override coverage, plus default OS chrome evidence from corresponding OS-specific UI gates. |
| Rightmost pane alignment | Fit case reaches workspace right edge; overflow case scrolls horizontally. |
| Drag resize | Pointer drag updates adjacent desired widths and persists them through existing session state. |
| Compact popovers | Pane search and time offset open in left, middle, and right invoking panes; Escape returns focus. |
| Header no-overlap | Long file, directory, current-file, offset, live, find, navigation, and close controls remain non-overlapping. |
| Future controls unavailable | Filter, palette, bookmark, Files MVP-only behavior, and guarded left panel do not execute future behavior. |

## Local macOS Gate

Run from `/Users/Vladimir.Zulin/projects/idea/Crosslog`:

```bash
bash scripts/macos/test.sh
bash scripts/macos/test-ui.sh
```

Run performance and build gates when required:

```bash
bash scripts/macos/perf.sh
bash scripts/macos/build.sh
```

`bash scripts/macos/perf.sh` is required when rendering, scrolling, search, or
session behavior changes, and before release readiness.

## GitHub Actions Gate

Windows:

```powershell
pwsh scripts/windows/test.ps1
pwsh scripts/windows/test-ui.ps1
pwsh scripts/windows/build.ps1
```

macOS:

```bash
bash scripts/macos/test.sh
bash scripts/macos/test-ui.sh
bash scripts/macos/build.sh
```

Linux:

```bash
bash scripts/linux/test.sh
bash scripts/linux/test-ui.sh
bash scripts/linux/build.sh
```

Release readiness requires automated, UI/E2E, and build jobs to pass for all
three operating systems.
