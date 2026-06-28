# Implementation Plan: Crosslog macOS UI Design Alignment

**Branch**: `003-macos-ui-design-alignment` | **Date**: 2026-06-28 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/Users/Vladimir.Zulin/projects/idea/Crosslog/specs/003-macos-ui-design-alignment/spec.md`

## Gap Audit

This plan is a delta over `/Users/Vladimir.Zulin/projects/idea/Crosslog/specs/002-redesign-activity-rail`.
It does not re-plan the completed Activity Rail redesign. It identifies the
remaining gaps between the current implementation, `docs/crosslog-ui-design.md`,
and `docs/mockups/crosslog-macos-redesign-mockups.html`.

| Area | Current implementation evidence | Target delta | Classification | Test action |
| --- | --- | --- | --- | --- |
| Design tokens and colors | `packages/ui/src/app-shell/activity-rail-theme.css` defines light-only `--crosslog-shell-bg`, `--crosslog-surface`, and related tokens. | Align tokens with `--crosslog-screen-bg`, window, topbar, rail, pane, border, scrollbar, accent, warning, error, text, and tag tokens from the design doc; add dark theme tokens. | CSS/token update | Add theme surface tests; update visual/style assertions. |
| Theme application | No `data-theme` or equivalent app-level theme variant is wired in the shared UI. | Light and dark appearances must apply to actual topbar, rail, pane, popover, statusbar, and log row surfaces. | Behavior wiring update; CSS/token update; missing test | Add light/dark application UI tests. |
| Platform shell variants | `CrosslogPlatform.kind` distinguishes only `web` and `desktop`; `ActivityRailShell` renders no macOS, Windows, Linux, or Web chrome variant. | Add presentation-level shell variant support for macOS traffic lights, Windows caption controls, Linux caption controls, and Web no desktop radius/shadow. | Component layout update; behavior wiring update; missing test | Add platform chrome tests for macOS, Windows, Linux, and Web, including default runtime chrome evidence on OS-specific UI gates. |
| Web shell chrome | `.crosslog-shell` always uses desktop radius. | Web variant removes desktop window radius and shadow while preserving product layout. | CSS/token update | Covered by platform variant tests. |
| Topbar layout | `Topbar.tsx` places command field in `minmax(180px, 1fr)` and actions in a right-side area. | Command field must be compact, centered, and followed immediately by sync icon and add-pane icon. | Component layout update; CSS/token update | Update topbar selector/layout assertions. |
| Sync control | `SynchronizationToggle.tsx` renders a checkbox labeled `Synchronize by time`; `Topbar.tsx` renders `Sync on` / `Sync off` text. | Replace visible checkbox/text label with icon-only sync control using accessible state. No `Synchronize by time`, `Sync on`, or `Sync off` text in topbar. | Obsolete-control removal; component layout update; test selector update | Update sync tests to assert icon/button state and statusbar summary separately. |
| Add pane and Split | `AddPaneButton.tsx` renders `Add pane` and a visible `Split active pane` button. | Keep only the add-pane icon immediately after sync; add action splits the rightmost pane when panes exist. | Obsolete-control removal; behavior wiring update; test selector update | Update multi-pane tests; add obsolete-control absence test. |
| Empty workspace | `AppShell.tsx` renders `Crosslog`, `Open logs`, browser file inputs, `Open empty directory`, and platform text. | Show aligned empty workspace with shared topbar height, visible activity rail, centered drop zone, `Open Source`, and drag/drop entry point. | Component layout update; obsolete-control removal; missing test | Add empty workspace target layout and drag-over no-shift tests. |
| Workspace action toolbar | `AppShell.tsx` renders a persistent `Workspace tools` toolbar with `Discover newer directory file`, `Append live line`, `Delete active file`, and `Replace active file`. | Remove these from product UI; keep lifecycle simulation only through existing test bridge or internal test hooks. | Obsolete-control removal; behavior wiring update; test selector update | Add obsolete-control absence tests; update lifecycle tests to use supported test bridge actions. |
| Future pane toolbar | `AppShell.tsx` still renders `FuturePaneToolbarSlot` through `systemBanners`. | Remove from product UI unless a future surface is explicitly feature-gated and unavailable. | Obsolete-control removal | Extend obsolete-control absence coverage. |
| Permanent pane Copy toolbar | `LogPane.tsx` renders `crosslog-pane-tools` with `LogTextSelection` permanent Copy UI. | Remove permanent copy toolbar; preserve text selection, keyboard copy, and context-menu copy behavior. | Obsolete-control removal; behavior wiring update; test selector update | Reuse copy behavior tests with updated trigger/assertions. |
| Per-pane ready footer | `LogPane.tsx` renders `<footer className="crosslog-pane-status">{pane.status}</footer>`. | Remove per-pane ready footer; use header lifecycle indicators and global statusbar only. | Obsolete-control removal | Add absence test and update lifecycle/status tests. |
| Pane resize | `PaneResizer.tsx` exposes `-` and `+` buttons. | Replace with editor-like draggable boundary handles between panes; keep accessible keyboard-compatible behavior where required by tests. | Behavior wiring update; component layout update; test selector update | Update component/Web/WDIO/macOS tests for drag resize; remove plus/minus expectations. |
| Pane width persistence | Core reducer and session serializer already preserve pane `width`. | Reuse existing desired-width persistence; compute render widths to fill the workspace when panes do not overflow without persisting auto-fill widths. | No-op because already implemented for persistence; behavior wiring update for fill computation | Add right-edge alignment tests. |
| Add/close distribution | `splitPaneLayout` and `closePaneLayout` already split and redistribute widths, but topbar add currently appends a new pane. | Route topbar add to split the rightmost pane when panes exist; keep close redistribution. | Behavior wiring update; no-op for close redistribution | Update multi-pane tests. |
| Rightmost pane alignment | `LogPane` renders fixed inline width and workspace scroll; no visible fill-to-right normalization exists. | If panes fit, rightmost pane edge must align to workspace right edge; if panes overflow, workspace horizontal scroll appears. | Behavior wiring update; CSS/token update; missing test | Add layout tests for fit and overflow cases. |
| Independent pane horizontal scroll | `HorizontalLogScroller` and pane `horizontalScroll` state already exist. | Preserve independent pane horizontal scroll for long lines. | No-op because already implemented | Reuse existing horizontal scroll tests. |
| File pane header | `PaneHeader.tsx` has title, lifecycle badges, offset tag, search icon, and close. | Match target spacing, live dot treatment, active indicator, compact offset tag, find icon distance, and no overlap. | Component layout update; CSS/token update; missing test | Add header no-overlap and live-dot spacing tests. |
| Directory pane header | `PaneHeader.tsx` and `DirectoryNavigator` already show directory name, selected file, and previous/next controls. | Preserve behavior while matching target spacing, current-file identity, live dot placement, offset/find gaps, and long-name truncation. | Component layout update; no-op for core behavior | Update directory header tests and add long-name no-overlap coverage. |
| Pane search popover | `PaneSearchPopover` is rendered inside `LogPane`, but current CSS/content is taller and less compact than the mockup. | Compact `351 x 37` style; anchor to the invoking pane/control; open from another pane moves it there. | CSS/token update; component layout update; behavior wiring update | Reuse search state tests; add compact pane-local positioning tests. |
| Time offset popover | `TimeOffsetPopover` is rendered inside `LogPane`, includes a persistent `Close` button, and uses a larger grid. | Compact target popover anchored to invoking pane; fields days/hours/min/sec/ms plus Apply only; Escape closes and returns focus. | Component layout update; obsolete-control removal; behavior wiring update | Update offset tests; add pane-local positioning and Escape/focus tests. |
| Activity rail | `activityRailItems.ts` already orders search, filter, palette, files, bookmark, settings and disables future items. | Keep order and sizing; ensure future filter/palette/bookmark remain hidden, disabled, or unavailable. | No-op because already implemented; CSS/token update for sizing | Reuse future-action guard tests; update visual sizing assertions. |
| Directory Search left panel | No production directory-wide search panel is implemented. | Treat panel as future/search-scope surface unless directory-wide search is implemented elsewhere; do not add recursive search behavior. | No-op because not implemented; behavior guardrail | Add explicit guardrail coverage that proves the panel is absent, disabled, or inert. |
| Statusbar | `StatusBar.tsx` already summarizes pane count, sync state, and active source. | Keep statusbar; ensure topbar no longer duplicates sync text. | No-op for global summary; test selector update | Reuse statusbar tests with topbar label updates. |
| UI tests | Multiple tests assert `Open logs`, `Split active pane`, `Synchronize by time`, `Sync on/off`, and plus/minus resize controls. | Migrate selectors/assertions to target names and design contracts. | Test selector update | Update existing Web, WDIO, and macOS suites instead of rewriting. |
| Core/platform tests | Core reducers, search, sync, session, directory, file safety, Rust adapters, integration, and performance tests do not depend on presentation labels. | Keep expected results unchanged. | No-op because already implemented | Reuse unchanged. |

### Existing Tests To Reuse Unchanged

- `packages/core/tests/**`: log pane reducer, pane layout, search engine,
  sync engine, time offset, directory navigation, encoding, session schema, and
  file lifecycle tests.
- `packages/platform/tests/**` and Rust adapter tests: browser/Tauri platform
  contracts, session stores, file access, directory access, capabilities, and
  file watching.
- `tests/integration/**`: read-only file safety, inert log rendering, workspace
  smoke, and directory access contracts.
- `tests/performance/**`: existing open/search/sync/render/session/live
  benchmark scenarios unless layout changes measurably affect rendering.
- `packages/ui/tests/app-shell/activity-rail-future-actions.test.tsx` behavior
  coverage, with only selector/style additions if visible state changes.

### Existing Tests Needing Selector Or Assertion Updates

- `packages/ui/tests/app-shell/redesigned-workspace.test.tsx`: replace `Open logs`,
  `Split active pane`, and old status/topbar assumptions with `Open Source`,
  add-pane icon, and obsolete-control absence checks.
- `packages/ui/tests/sync/redesigned-sync-controls.test.tsx` and
  `packages/ui/tests/sync/synchronization-controls.test.tsx`: replace checkbox
  and topbar text assertions with icon button `aria-pressed`/state assertions.
- `packages/ui/tests/pane-rail/pane-layout.test.tsx`: replace plus/minus resize
  button clicks with drag boundary simulation and accessible separator checks.
- `packages/ui/tests/search/pane-search-popover.test.tsx` and
  `packages/ui/tests/sync/time-offset-popover.test.tsx`: update compact layout,
  no persistent offset Close button, Escape/focus behavior, and pane-local
  anchoring assertions.
- `packages/ui/tests/log-pane/log-text-copy.test.tsx`: remove permanent copy
  toolbar assumptions while preserving selection/copy behavior.
- `apps/web/tests/ui/*.spec.ts`, `apps/desktop/tests/ui/*.spec.ts`, and
  `apps/desktop/tests/ui/macos/*.swift`: migrate visible labels and resize
  interactions while preserving MVP workflow outcomes.

### New Tests Required

- Obsolete controls absent in empty and populated workspaces.
- Empty workspace target layout, `Open Source`, drag/drop entry point, and
  drag-over no-layout-shift behavior.
- Light and dark theme application across actual shell, pane, popover,
  statusbar, and log severity surfaces.
- macOS, Windows, Linux, and Web shell chrome variants.
- Rightmost-pane alignment when panes fit, and workspace horizontal scroll only
  when panes overflow.
- Drag resize by pane boundary with persisted desired widths.
- Compact pane search and time offset popover positioning for left, middle, and
  right panes.
- Pane header no-overlap with long file, directory, current-file, offset, live,
  find, navigation, and close controls.
- Future rail controls, Files activity behavior, and Directory Search left-panel
  guardrails remain unavailable or MVP-limited as specified.

## Summary

Align the existing Activity Rail implementation with the updated Crosslog UI
design document and HTML mockups. The work is a presentation and interaction
alignment pass over the existing MVP. It keeps the current shared React/Tauri
stack, reuses the Activity Rail redesign artifacts from `specs/002`, preserves
the functional baseline from `specs/001`, removes obsolete product controls,
and updates tests only where design selectors, layout, or visual contracts have
changed.

## Technical Context

**Language/Version**: TypeScript 5.x for shared UI/domain code; React 19; Rust
1.77+ stable for Tauri 2 adapters; Node.js 22 in CI; pnpm 9.15.4 via Corepack.

**Primary Dependencies**: Existing dependencies only: React, React DOM, Vite,
Zustand, TanStack Virtual, Tauri 2, Vitest, Playwright, WebdriverIO, Rust
`notify`, `encoding_rs`, and `chardetng`. No new UI kit, icon package, parser,
backend, or platform adapter dependency is planned.

**Storage**: Unchanged from MVP: browser session state in IndexedDB; Desktop
session snapshots in the application data directory; no state written beside
opened logs. Existing pane widths remain persisted as desired widths. Computed
auto-fill widths for right-edge alignment are view state and must not overwrite
user-resized session widths. Theme and platform shell variants are presentation
state for the current shell session, runtime default, mockup, or test override;
this alignment pass does not add new persisted UI preference storage.

**Testing**: Vitest for shared unit/component/integration/performance tests;
cargo test for Rust adapters; Playwright for Web UI/E2E; WebdriverIO with Tauri
WebDriver for Desktop UI/E2E; macOS XCTest/Accessibility for macOS Desktop UI.

**Target Platform**: Browser Web plus Desktop on Windows, macOS, and Linux.

**Project Type**: Shared Web/Desktop application alignment pass.

**Shared Codebase Strategy**: Keep `packages/core` for business logic,
`packages/platform` for explicit ports/adapters, `packages/ui` for shared React
UI, and `apps/web` / `apps/desktop` as thin shells. Platform chrome variants
are presentation state in the shared shell, not new product architecture.

**Platform Interfaces**: Existing filesystem, directory, drag/drop, file
watching, session store, capabilities, and UI test bridge ports remain. The plan
adds no source type, parser, recursive search, SSH, file-manager operation, or
backend service.

**OS Build Scripts**: Windows `pwsh scripts/windows/build.ps1`; macOS
`bash scripts/macos/build.sh`; Linux `bash scripts/linux/build.sh`.

**OS Automated Test Scripts**: Windows `pwsh scripts/windows/test.ps1`; macOS
`bash scripts/macos/test.sh`; Linux `bash scripts/linux/test.sh`.

**OS UI Test Scripts**: Windows `pwsh scripts/windows/test-ui.ps1`; macOS
`bash scripts/macos/test-ui.sh`; Linux `bash scripts/linux/test-ui.sh`.

**Read-Only/Security Model**: Unchanged. Opened logs remain read-only input.
Log text, command/search text, popover values, file names, and directory names
are rendered as inert text and must not execute commands, links, scripts, or
escape sequences.

**Session Recovery Model**: Unchanged for source/session data. Existing session
restore continues to preserve panes, pane order, desired pane sizes, opened
sources, selected directory files, sync state, and per-pane offsets. Scroll
positions remain intentionally excluded.

**Performance Goals**: Preserve the MVP and Activity Rail thresholds. Add
layout-specific gates for no overlapping primary controls, rightmost-pane
alignment when panes fit, workspace scrolling only when panes overflow, and no
layout shift during empty-workspace drag-over.

**Constraints**: No new functional capability beyond MVP and existing Activity
Rail scope. Explicitly removed controls must not appear in product UI.
Directory Search, filters, palette/highlighting, bookmarks, saved filters,
recursive search, SSH, and file-manager behavior remain out of scope unless a
separate specification implements them.

**Scale/Scope**: One shared UI alignment pass across topbar, activity rail,
empty workspace, pane workspace, pane headers, compact popovers, theme tokens,
platform shell variants, and UI tests.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- PASS: Technology stack is explicitly selected and unchanged.
- PASS: No new dependency is planned; dependency risk is minimized.
- PASS: Web and Desktop continue using one shared UI and business codebase.
- PASS: Platform-specific behavior remains behind existing ports; platform
  chrome is presentation state only.
- PASS: Build scripts are defined for Windows, macOS, and Linux.
- PASS: Automated test scripts are defined for Windows, macOS, and Linux.
- PASS: UI test scripts are defined for Windows, macOS, and Linux.
- PASS: Every implementation phase below has automated and UI validation gates.
- PASS: Every user scenario in `spec.md` maps to reused, updated, or new UI
  tests.
- PASS: OS-specific Desktop UI behavior remains validated on the corresponding
  OS through local macOS and GitHub Actions gates.
- PASS: Expected test results remain requirement-derived and must not be
  rewritten to match broken intermediate UI.
- PASS: Opened logs remain read-only and inert.
- PASS: Session state remains recoverable after unexpected errors.
- PASS: Performance requirements have planned tests or benchmark gates.

## Reused 002 Baseline

### Reused Artifacts Without Replanning

- `/Users/Vladimir.Zulin/projects/idea/Crosslog/specs/002-redesign-activity-rail/spec.md`
  remains the redesign baseline.
- `/Users/Vladimir.Zulin/projects/idea/Crosslog/specs/002-redesign-activity-rail/test-reuse-audit.md`
  remains the starting test reuse matrix.
- `/Users/Vladimir.Zulin/projects/idea/Crosslog/specs/002-redesign-activity-rail/contracts/ui-behavior.md`
  remains valid except where the 003 contracts explicitly tighten layout,
  obsolete-control removal, theme, and platform chrome requirements.
- `/Users/Vladimir.Zulin/projects/idea/Crosslog/specs/002-redesign-activity-rail/contracts/figma-design-contract.md`
  remains valid as the Activity Rail baseline; this plan adds updated mockup
  deltas from `docs/mockups/crosslog-macos-redesign-mockups.html`.
- `/Users/Vladimir.Zulin/projects/idea/Crosslog/specs/002-redesign-activity-rail/contracts/test-automation.md`
  remains the OS validation baseline.

### Reused 002 Tasks

- Reuse unchanged: T001-T008 planning/test helper scaffolding, test IDs, and
  shell helper artifacts.
- Reuse unchanged: T010-T013 icon primitives, popover primitive, activity rail
  item state, and future-action guard helper behavior.
- Reuse with CSS/layout deltas: T009, T014, T027-T033, T042-T046, T054-T058,
  T068-T071, T080-T083.
- Reuse unchanged for behavior: T016-T018 CI gate wiring, T020 future rail guard
  behavior, T075/T079 time-offset core helpers, T094 lifecycle event handling,
  T096 inert log row rendering, and T107 session restore behavior.
- Update tests rather than rewrite: T022-T026, T038-T041, T049-T053,
  T062-T067, T074-T078, T086-T091, and T099-T103 where visible labels,
  selectors, shell regions, or layout contracts changed.

## Phase 0: Research And Gap Audit Output

**Goal**: Document unresolved implementation decisions and the reuse/gap audit
without restating the full 002 redesign plan.

**Outputs**:

- [research.md](./research.md): decisions for token/theme mapping, platform
  variants, pane width fill strategy, obsolete-control migration, popover
  anchoring, and test reuse.

**Exit Criteria**:

- Every gap is classified as CSS/token update, component layout update,
  behavior wiring update, obsolete-control removal, test selector update,
  missing test, or no-op because already implemented.
- There are no unresolved clarification markers.

## Phase 1: Design Token And Theme Alignment

**Scope**:

- Update `packages/ui/src/app-shell/activity-rail-theme.css` tokens to match
  `docs/crosslog-ui-design.md`.
- Add dark theme tokens and app-level theme application.
- Ensure window, topbar, activity rail, panes, borders, scrollbars, accent,
  warning, error, text, tag backgrounds, popovers, statusbar, and log rows use
  tokens.
- Keep theme variants as runtime, mockup, or test presentation input without
  adding a product-visible selector or new persisted preference storage.

**Reuse**:

- Reuse 002 token file location and shell CSS import wiring.
- Reuse existing severity rendering and accessibility helpers.

**Tests**:

- Update existing shell viewport/style tests.
- Add missing light/dark application surface tests using runtime/mockup/test
  presentation inputs, not product UI controls.

**Gate**:

- `bash scripts/macos/test.sh`

## Phase 2: Platform Shell Variant Alignment

**Scope**:

- Add presentation-level shell variants for macOS, Windows, Linux, and Web.
- Render macOS traffic lights, Windows caption controls, Linux caption
  controls, and Web title/no desktop radius/shadow.
- Keep product topbar, activity rail, pane workspace, and statusbar behavior
  shared across variants.

**Reuse**:

- Reuse existing platform adapters and capabilities.
- Do not rewrite `CrosslogPlatform` source capabilities unless a minimal
  shell-variant field is needed for rendering or tests.

**Tests**:

- Add platform chrome variant tests in shared component tests and UI/E2E where
  supported.
- Assert default runtime chrome in OS-specific UI gates; use overrides only for
  mockup and cross-variant coverage.
- Update Web shell tests to assert no desktop chrome shadow/radius.

**Gate**:

- `bash scripts/macos/test.sh`
- `bash scripts/macos/test-ui.sh` for affected UI shell coverage.

## Phase 3: Topbar And Obsolete-Control Cleanup

**Scope**:

- Implement compact command field and place sync icon plus add-pane icon
  immediately to its right.
- Remove visible `Split`, `Synchronize by time`, topbar `Sync on/off`, and old
  workspace action toolbar.
- Move lifecycle simulation actions behind the existing UI test bridge or
  internal test-only commands.

**Reuse**:

- Reuse existing synchronization store and pane reducer.
- Reuse `IconButton`, local SVG icons, and `redesignedShellTestIds`.

**Tests**:

- Update topbar/sync/multi-pane tests for icon controls.
- Add obsolete-control absence coverage for topbar and workspace.

**Gate**:

- `bash scripts/macos/test.sh`
- `bash scripts/macos/test-ui.sh`

## Phase 4: Empty Workspace Alignment

**Scope**:

- Replace sample/test-oriented empty state with target drop zone and
  `Open Source` action.
- Keep same topbar height and visible activity rail as the populated shell.
- Preserve platform-appropriate source opening and drag/drop behavior.
- Add drag-over visual state without layout shift.

**Reuse**:

- Reuse existing open file/directory ports, browser file input behavior, and
  drag/drop source mapping.

**Tests**:

- Update existing empty/browser drag-drop tests from `Open logs` to
  `Open Source`.
- Add missing target layout and drag-over no-shift tests.

**Gate**:

- `bash scripts/macos/test.sh`
- `bash scripts/macos/test-ui.sh`

## Phase 5: Pane Workspace Alignment

**Scope**:

- Replace plus/minus resize controls with drag handles between panes.
- Persist user-resized desired widths through existing pane/session state.
- Make topbar add split the rightmost pane when panes exist.
- Keep close redistribution.
- Compute rendered widths so the rightmost pane aligns to the workspace right
  edge when panes do not overflow.
- Show horizontal workspace scrolling only when panes exceed available width.
- Preserve independent pane horizontal scrolling for long lines.

**Reuse**:

- Reuse `packages/core/src/log-pane/pane-layout.ts` split/close/resize rules.
- Reuse session serializer pane width persistence.
- Reuse `HorizontalLogScroller` and pane `horizontalScroll` state.

**Tests**:

- Update pane layout component tests and Web/WDIO/macOS multi-pane tests for
  drag resize.
- Add missing right-edge alignment, overflow, and persisted desired-width tests.

**Gate**:

- `bash scripts/macos/test.sh`
- `bash scripts/macos/test-ui.sh`
- `bash scripts/macos/perf.sh` if render/scroll performance changes.

## Phase 6: Pane Header Alignment

**Scope**:

- Align file and directory pane header spacing, title hierarchy, live dot,
  offset tag, find icon, close action, active indicator, and directory
  previous/next controls with the mockup.
- Ensure long names truncate without overlapping controls.
- Preserve directory navigation boundaries and lifecycle state behavior.

**Reuse**:

- Reuse `PaneHeader`, `DirectoryNavigator`, `useFileLifecycleEvents`, directory
  reducer, and lifecycle behavior.

**Tests**:

- Update file/directory header tests.
- Add long-name no-overlap and live-dot/offset/find spacing tests.

**Gate**:

- `bash scripts/macos/test.sh`
- `bash scripts/macos/test-ui.sh`

## Phase 7: Popover Alignment

**Scope**:

- Make pane search popover compact and anchored to the invoking pane/control.
- Make time offset popover compact, anchored to the invoking pane/control, and
  remove the persistent Close button from the target UI.
- Preserve Escape dismissal, focus return, invalid regex handling, invalid
  offset rejection, and pane-local state boundaries.

**Reuse**:

- Reuse `Popover`, `PaneSearchPopover`, `TimeOffsetPopover`, pane search store,
  synchronization store, and time-offset normalization.
- Existing in-pane rendering already prevents the old global left/center pane
  positioning bug; keep this property while tightening anchor placement.

**Tests**:

- Update component/Web/WDIO/macOS popover tests.
- Add left/middle/right pane invocation positioning checks and Escape/focus
  return coverage.

**Gate**:

- `bash scripts/macos/test.sh`
- `bash scripts/macos/test-ui.sh`

## Phase 8: Activity Rail And Left Panel Guardrails

**Scope**:

- Keep search, files/source, and settings MVP actions usable.
- Keep filter, palette, and bookmark hidden, disabled, or explicitly
  unavailable.
- Keep Directory Search left panel feature-gated unless directory-wide search
  requirements are implemented in a separate scope.
- Keep the Files rail control limited to MVP source opening and document reused
  coverage for activity rail order and sizing.

**Reuse**:

- Reuse `activityRailItems.ts` future-action guards.
- Reuse `activity-rail-future-actions.test.tsx` behavior coverage.

**Tests**:

- Update sizing/order assertions and Files-control MVP behavior traceability.
- Add left-panel guardrail tests that assert the panel is absent, disabled, or
  inert while directory-wide search remains out of scope.

**Gate**:

- `bash scripts/macos/test.sh`

## Phase 9: Test Migration And Reuse

**Scope**:

- Reuse core, platform, integration, Rust, performance, search, sync, directory,
  session, and safety tests unchanged unless a real requirement gap appears.
- Update Web UI, Desktop WDIO, and macOS XCTest/Accessibility tests for new
  selectors, accessible names, shell regions, and visual contracts.
- Add only missing UI tests listed in the gap audit.

**Updated Test Sets**:

- `packages/ui/tests/app-shell/*.test.tsx`
- `packages/ui/tests/pane-rail/*.test.tsx`
- `packages/ui/tests/log-pane/*.test.tsx`
- `packages/ui/tests/search/*.test.tsx`
- `packages/ui/tests/sync/*.test.tsx`
- `apps/web/tests/ui/*.spec.ts`
- `apps/desktop/tests/ui/*.spec.ts`
- `apps/desktop/tests/ui/macos/*.swift`

**New Coverage**:

- Obsolete controls absent.
- Empty workspace target layout.
- Light/dark application UI.
- Platform chrome variants, including default OS chrome evidence on
  corresponding UI gates.
- Pane right-edge alignment.
- Drag resize.
- Compact popover positioning per invoking pane.
- Pane header no-overlap with long names.
- Future rail controls unavailable.
- Empty-state source-opening recognition review for the 5-second usability
  criterion.
- Files MVP-only behavior and Directory Search guardrails.

**Gate**:

- `bash scripts/macos/test.sh`
- `bash scripts/macos/test-ui.sh`

## Phase 10: Validation Gates

**Local macOS**:

```bash
bash scripts/macos/test.sh
bash scripts/macos/test-ui.sh
bash scripts/macos/perf.sh
bash scripts/macos/build.sh
```

Run `bash scripts/macos/perf.sh` when rendering, scrolling, search, or session
behavior changes, and always before release readiness.

**GitHub Actions**:

- Windows: `pwsh scripts/windows/test.ps1`,
  `pwsh scripts/windows/test-ui.ps1`, `pwsh scripts/windows/build.ps1`; record
  default Windows shell chrome evidence from the UI gate.
- macOS: `bash scripts/macos/test.sh`, `bash scripts/macos/test-ui.sh`,
  `bash scripts/macos/build.sh`.
- Linux: `bash scripts/linux/test.sh`, `bash scripts/linux/test-ui.sh`,
  `bash scripts/linux/build.sh`; record default Linux shell chrome evidence
  from the UI gate.

Release readiness requires green automated, UI/E2E, and build jobs for Windows,
macOS, and Linux. Default OS chrome evidence MUST include the target OS, UI
gate command or job link, captured shell variant, and pass/fail result in
`validation-log.md`.

**Timed Empty-State Review Evidence**:

- Reviewer role: implementation reviewer or QA reviewer who has not received
  step-by-step source-opening instructions for the current build.
- Start condition: app loaded at the aligned empty workspace with no panes open.
- Evidence: reviewer identifier or role, date, viewport/platform, whether the
  source-opening path was identified within 5 seconds, and pass/fail result.
- Pass threshold: the path is identifiable within 5 seconds.

## Phase 1 Design Outputs

- [research.md](./research.md): unresolved implementation decisions and
  reuse/gap audit.
- [data-model.md](./data-model.md): existing entities retained, plus minimal UI
  presentation state needed for theme, platform chrome, pane layout view state,
  popover anchors, and test coverage mapping.
- [contracts/ui-alignment-contract.md](./contracts/ui-alignment-contract.md):
  UI behavior deltas from the updated design.
- [contracts/figma-design-deltas.md](./contracts/figma-design-deltas.md):
  interpretation of the updated HTML mockups against the 002 Figma baseline.
- [contracts/test-automation.md](./contracts/test-automation.md): reused,
  updated, and newly added test contracts.
- [quickstart.md](./quickstart.md): exact validation workflow.

## Post-Design Constitution Check

- PASS: The plan keeps shared code boundaries and avoids duplicated Web/Desktop
  product behavior.
- PASS: The plan adds no new dependency and no new product architecture.
- PASS: The plan preserves read-only log safety and inert rendering.
- PASS: The plan preserves existing session and pane state models, adding only
  presentation state where needed for theme/platform/layout.
- PASS: The plan maps each user scenario to reused, updated, or new tests.
- PASS: The plan treats obsolete-control removal and rightmost-pane alignment
  as first-class acceptance criteria.
- PASS: The plan includes local macOS and GitHub Actions validation gates;
  local US4 completion validates shared implementation, while release-level
  OS-specific default behavior remains incomplete until Windows, macOS, and
  Linux UI gates provide corresponding-OS evidence.

## Project Structure

### Documentation

```text
/Users/Vladimir.Zulin/projects/idea/Crosslog/specs/003-macos-ui-design-alignment/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── figma-design-deltas.md
│   ├── test-automation.md
│   └── ui-alignment-contract.md
└── tasks.md
```

### Source Code

```text
/Users/Vladimir.Zulin/projects/idea/Crosslog/
├── apps/
│   ├── web/
│   │   ├── src/
│   │   └── tests/ui/
│   └── desktop/
│       ├── src/
│       ├── src-tauri/
│       └── tests/ui/
├── packages/
│   ├── core/
│   ├── platform/
│   └── ui/
│       ├── src/app-shell/
│       ├── src/log-pane/
│       ├── src/pane-rail/
│       ├── src/search/
│       └── src/sync/
├── tests/
│   ├── integration/
│   ├── fixtures/
│   └── performance/
└── scripts/
    ├── linux/
    ├── macos/
    └── windows/
```

**Structure Decision**: Use the existing monorepo and shared package layout.
All design alignment work belongs in shared UI components, existing core layout
reducers, existing platform shell entry points, existing test helpers, and
existing OS scripts. No new application, backend service, UI framework, parser
package, or platform adapter rewrite is introduced.

## Complexity Tracking

No constitution violations or complexity exceptions are required.
