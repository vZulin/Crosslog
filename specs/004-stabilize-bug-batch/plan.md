# Implementation Plan: Crosslog Bug Batch Stabilization

**Branch**: `004-stabilize-bug-batch` | **Date**: 2026-06-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/Users/Vladimir.Zulin/projects/idea/Crosslog/specs/004-stabilize-bug-batch/spec.md`

## Summary

Stabilize the existing Crosslog MVP and macOS-aligned Activity Rail UI by fixing
the complete 22-item bug batch from `/Users/Vladimir.Zulin/projects/idea/Crosslog/docs/Bugs_1.txt`.
The implementation remains a minimal delta over the current React/Vite/Zustand,
TanStack Virtual, Tauri 2, shared `packages/core`, shared `packages/ui`, and
`packages/platform` architecture. Product source-opening paths must use
user-selected files or directories instead of demo sources. Existing behavior
from `specs/001-multi-log-analysis` and `specs/003-macos-ui-design-alignment`
is preserved unless the new stabilization spec explicitly supersedes it.

No new dependencies are planned. If Desktop native source picker/dialog behavior
cannot be completed through the existing platform port/adapter structure and
current dependencies, implementation must stop and request approval before
adding a dialog dependency. Native source picker/dialog behavior is allowed only
for user source selection; source reveal actions and file-management operations
such as rename, delete, or move remain out of scope.

## Technical Context

**Language/Version**: TypeScript 5.x for shared UI/domain code; React 19; Rust 1.77+ stable for Tauri 2 adapters; Node.js 22 in CI; pnpm 9.15.4 via Corepack.
**Primary Dependencies**: Existing dependencies only: React, React DOM, Vite, Zustand, TanStack Virtual, Tauri 2, Vitest, Playwright, WebdriverIO, Rust `notify`, `encoding_rs`, and `chardetng`; no new UI kit, icon package, parser, backend, or platform adapter dependency is planned.
**Storage**: Existing Browser IndexedDB and Desktop application-data session storage remain the only application-owned persisted storage; no state is written beside opened logs; theme resolution adds `System`, `Light`, and `Dark` product state with `System` as the fresh default; when `System` is selected, resolved theme changes follow operating system theme changes while the app is open.
**Testing**: Vitest for unit/component/contract tests; cargo test for Rust adapters; Playwright for Web UI/E2E; WebdriverIO/Tauri WebDriver for Desktop UI/E2E; macOS XCTest/Accessibility for macOS Desktop UI.
**Target Platform**: Browser Web plus Desktop on Windows, macOS, and Linux.
**Project Type**: Shared Web/Desktop application bug-fix stabilization.
**Shared Codebase Strategy**: Keep business rules in `packages/core`, shared
  UI in `packages/ui`, platform interfaces/adapters in `packages/platform`, and
  app shells in `apps/web` and `apps/desktop`. Avoid duplicating source opening,
  search, sync, offset, pane layout, or theme rules across app shells.
**Platform Interfaces**: Use existing explicit platform ports for file
  access, directory access, drag/drop, session storage, capabilities, UI test
  bridge, and source picking. Platform-specific source selection remains behind
  the source picker port.
**OS Build Scripts**: Windows `pwsh scripts/windows/build.ps1`; macOS
  `bash scripts/macos/build.sh`; Linux `bash scripts/linux/build.sh`.
**OS Automated Test Scripts**: Windows `pwsh scripts/windows/test.ps1`;
  macOS `bash scripts/macos/test.sh`; Linux `bash scripts/linux/test.sh`.
**OS UI Test Scripts**: Windows `pwsh scripts/windows/test-ui.ps1`; macOS
  `bash scripts/macos/test-ui.sh`; Linux `bash scripts/linux/test-ui.sh`.
**Read-Only/Security Model**: Opened log files remain read-only. Log content,
  source names, selected text, search queries, time offset values, and settings
  labels are rendered and processed as inert data; no command, link, script,
  escape sequence, or instruction from logs is executed.
**Session Recovery Model**: Existing crash-safe session restore remains in
  force. Fixes must not weaken recovery of panes, pane order, desired pane
  widths, opened sources, selected directory files, synchronization state, and
  offsets. Scroll positions remain intentionally excluded from restore.
**Performance Goals**: Preserve existing MVP thresholds for source opening,
  20 MB search, synchronization, rendering, directory switching, session write,
  live append, and memory pressure. New UI-specific validation must prove no
  excessive horizontal blank space, reachable vertical scrolling, no-overlap
  changed surfaces, and stable popover positioning.
**Constraints**: Do not broaden scope beyond `/Users/Vladimir.Zulin/projects/idea/Crosslog/docs/Bugs_1.txt`.
  Do not add remote sources, source reveal actions, file-management operations,
  filtering, configurable highlighting, bookmarks, saved filter sets, recursive
  directory search, SSH, parser rewrites, backend services, UI kits, or platform
  adapter rewrites.
**Scale/Scope**: One bug-fix batch across source opening, empty workspace,
  pane layout/scroll/reorder/gutter/keyboard navigation, pane search/copy
  popovers, time offset validation, synchronization icon state, settings, and
  theme default.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- PASS: Technology stack is explicitly selected and unchanged.
- PASS: No new dependency is planned; any dependency need must request approval
  before implementation proceeds.
- PASS: Web and Desktop use one shared codebase; business behavior stays in
  shared modules.
- PASS: Platform-specific source selection, filesystem, drag/drop, session, and
  Desktop behavior remain behind explicit ports/adapters.
- PASS: Build scripts are defined for Windows, macOS, and Linux.
- PASS: Automated test scripts are defined for Windows, macOS, and Linux.
- PASS: UI test scripts are defined for Windows, macOS, and Linux.
- PASS: Every development phase below includes targeted tests and phase gates.
- PASS: Every stabilization user scenario has mapped UI/E2E coverage.
- PASS: OS-specific Desktop UI behavior runs on the corresponding target OS.
- PASS: Expected test results are derived from the spec and bug report, not
  current broken implementation behavior.
- PASS: Opened logs remain read-only and inert.
- PASS: Session recovery remains protected.
- PASS: Rendering, search, scrolling, synchronization, and session performance
  keep existing benchmark gates where affected.

## Project Structure

### Documentation (this feature)

```text
/Users/Vladimir.Zulin/projects/idea/Crosslog/specs/004-stabilize-bug-batch/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── ui-behavior.md
│   └── test-automation.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/
├── web/                 # Browser shell, browser source picker, Web UI tests
└── desktop/             # Tauri shell, Desktop adapters, WDIO/XCTest UI tests

packages/
├── core/                # Shared pane, layout, search, sync, offset, session rules
├── platform/            # Source picker, file/directory, drag/drop, session ports/adapters
└── ui/                  # Shared shell, panes, viewport, popovers, settings, theme UI

tests/
├── integration/         # Read-only and inert rendering safety
└── performance/         # Existing source/search/render/sync/session benchmarks

scripts/
├── windows/
├── macos/
└── linux/
```

**Structure Decision**: Use the current monorepo and shared Web/Desktop
structure. Implement all product rules once in shared packages, use existing
platform ports for platform-specific operations, and limit app-shell changes to
adapter wiring.

## Complexity Tracking

No constitution violations are planned.

## Bug-To-Requirement Traceability

| Bug | Spec requirements | Planned work | Planned tests |
| --- | --- | --- | --- |
| 1 Empty workspace open uses demo sources | FR-003, FR-005, FR-007 | Replace `Open Source` product action with user source selection; leave fixture setup only in test bridge. | Update `packages/ui/tests/app-shell/empty-workspace.test.tsx`; add Web/Desktop UI coverage for picker open/cancel/selected source. |
| 2 Add pane uses demo source | FR-003, FR-006, FR-007 | Route topbar add-pane through source selection before pane creation; create pane only after selection. | Update `packages/ui/tests/app-shell/redesigned-workspace.test.tsx`, `apps/web/tests/ui/multi-pane-layout.spec.ts`, Desktop WDIO/macOS layout tests. |
| 3 Pane too wide | FR-012, FR-013, FR-014, FR-021 | Separate visible pane width from horizontal content width so the longest loaded line remains reachable while visible pane widths follow workspace, pane count, and existing resize/layout rules. | Extend `packages/ui/tests/pane-rail/pane-workspace-alignment.test.tsx`; add UI viewport checks for one-pane, fit, overflow, and longest-line reachability cases. |
| 4 Vertical scroll inside pane broken | FR-015, FR-016 | Make log viewport vertically scrollable through all loaded lines and trigger sync anchor updates when required. | Add component tests for wheel/scroll; update Web/Desktop synchronized scrolling UI tests. |
| 5 Search icon hover highlight offset | FR-022, FR-021 | Correct pane header search control focus/hover geometry in shared header styles. | Add header control no-overlap/focus assertions in component and viewport UI tests. |
| 6 Copy action appears in wrong place | FR-025, FR-029 | Anchor copy-selection action to pointer coordinates with viewport boundary correction. | Update copy component tests and Web/Desktop copy UI tests for pointer-relative position. |
| 7 Copy action lifecycle | FR-026, FR-027, FR-029 | Dismiss on outside left click and relocate on valid right click. | Add component tests for left-click dismissal and right-click relocation; mirror in Web UI. |
| 8 "Copied" appears after copy | FR-028 | Remove product-visible copied toast/status text; keep copy operation and test bridge evidence where needed. | Update `packages/ui/tests/log-pane/log-text-copy.test.tsx`, Web/WDIO copy UI tests, macOS copy XCTest. |
| 9 Search highlights full row | FR-023 | Render search match ranges as inline highlighted spans, not row-level result highlights. | Extend search engine/range rendering tests; update `apps/web/tests/ui/log-search.spec.ts` and Desktop equivalents. |
| 10 Time offset boundary validation missing | FR-030-FR-035 | Validate days unbounded and hours/minutes/seconds/milliseconds field ranges before apply. | Update `packages/ui/tests/sync/time-offset-popover.test.tsx`; add boundary cases to Web/WDIO/macOS offset UI tests. |
| 11 Sync icon state identical | FR-036, FR-037 | Add distinct inactive, active, and hover states while preserving accessible pressed state. | Update sync component tests, topbar a11y tests, Web/Desktop visual-state assertions. |
| 12 Open sources rail action wrong | FR-009 | Disable or make inert the activity rail source-list entry until the side panel exists. | Update `activity-rail-future-actions.test.tsx`, `redesigned-workspace.test.tsx`, and UI/E2E future-control guard tests. |
| 13 Activity rail search wrong | FR-010 | Disable or make inert rail all-pane search until global search exists; do not open pane-local search. | Update `search-entry-points.test.tsx`, Web/WDIO log-search entry-point assertions, macOS PaneSearchUITests. |
| 14 Settings does nothing | FR-038, FR-039, FR-041 | Add minimal settings surface opened from rail with System/Light/Dark theme setting. | Add settings component tests and Web/Desktop/macOS UI tests for empty/populated workspaces. |
| 15 Default theme wrong | FR-039, FR-040, FR-041, FR-049 | Resolve fresh default as System, map System to current environment theme, and update the resolved theme live when the operating system theme changes. | Update theme tests and viewport tests; add fresh-state default System and live system theme assertions. |
| 16 Command field opens pane search | FR-011 | Disable or make inert command field until command/all-pane search exists. | Update `search-entry-points.test.tsx`, Web/WDIO/macOS command-field assertions. |
| 17 Cannot reorder panes | FR-017, FR-018, FR-021 | Add pane header drag-reorder behavior with midpoint threshold and stable intervening order. | Add core reducer/order tests, `PaneRail` drag tests, Web/WDIO/macOS pane reordering UI tests. |
| 18 Line-number gutter too wide | FR-019, FR-021 | Size gutter by digit count of total pane line count plus readable spacing. | Add viewport component tests for 9/10/99/100/999/1000 line boundaries and no-overlap checks. |
| 19 Empty workspace drag/drop broken | FR-008 | Ensure empty workspace drop zone and shell-level drop both map dropped files/directories into panes on Web and Desktop targets. | Extend Web, Desktop WDIO, and macOS drag/drop coverage. |
| 20 Arrow-key navigation broken | FR-016, FR-020, FR-021 | Add focused viewport arrow navigation for horizontal movement and selected-line changes; sync on up/down when enabled. | Add viewport keyboard tests and update Web/Desktop synchronized scrolling UI tests. |
| 21 Search highlight remains after close | FR-024 | Clear visible search highlighting on popover close while keeping cursor/selected line at last navigated match. | Update pane search store/viewport tests and Web/WDIO/macOS search-close UI assertions. |
| 22 Blank time offset field invalid | FR-034, FR-035 | Treat blank field as zero on apply without whole-number warning. | Add blank-field tests to component, Web, WDIO, and macOS offset suites. |

## Test Inventory

### Existing Tests That Remain Valid And Unchanged

- `packages/core/tests/directory/**`, `packages/core/tests/encoding/**`,
  `packages/core/tests/file-source/**`, `packages/core/tests/session/**`,
  `packages/core/tests/timestamps/**`: unaffected by UI bug fixes.
- `packages/core/tests/search/search-engine.test.ts` remains valid for match
  range calculation; add tests only if range rendering reveals a missing case.
- `packages/core/tests/sync/sync-engine.test.ts` remains valid for timestamp
  synchronization; add tests only for keyboard-triggered anchor changes if core
  state changes are introduced.
- `packages/platform/tests/browser/**`, `packages/platform/tests/file-access/**`,
  `packages/platform/tests/file-watcher/**`, `packages/platform/tests/session/**`,
  and existing Rust adapter tests remain valid unless the source picker adapter
  contract is extended.
- `tests/integration/log-content-inert-security.test.ts`,
  `tests/integration/read-only-file-safety.test.ts`, and related safety tests
  remain valid and must continue to pass.
- Existing performance benchmarks under `tests/performance/**` remain valid and
  are reused for regression gates.

### Existing Tests That Must Be Updated

- `packages/ui/tests/app-shell/empty-workspace.test.tsx`: assert source picker
  invocation/cancel/selected-source behavior instead of only rendering the
  action.
- `packages/ui/tests/app-shell/redesigned-workspace.test.tsx`: stop expecting
  product `Open Source` or topbar add-pane to create sample panes; use test
  bridge/fixtures for setup and assert product source selection for user flows.
- `packages/ui/tests/app-shell/search-entry-points.test.tsx`: pane header search
  remains valid; activity rail search and command field must become disabled or
  inert.
- `packages/ui/tests/app-shell/activity-rail-future-actions.test.tsx`: files
  and search rail entries are unavailable for this batch; settings remains
  executable.
- `packages/ui/tests/app-shell/redesigned-shell-final-a11y.test.tsx`: previous
  "no product-visible theme selector" assertion is superseded by bugs 14 and
  15; replace with accessible settings/theme assertions.
- `packages/ui/tests/app-shell/theme-variants.test.tsx` and
  `shell-presentation.test.ts`: add System theme preference and default
  resolution.
- `packages/ui/tests/pane-rail/pane-layout.test.tsx` and
  `pane-workspace-alignment.test.tsx`: add pane reorder, longest-line sizing,
  vertical scroll, keyboard, and gutter cases.
- `packages/ui/tests/search/pane-search-popover.test.tsx`: add search close
  cleanup and hover/focus geometry assertions.
- `packages/ui/tests/log-pane/log-text-copy.test.tsx`: remove expected
  `Copied` status and add pointer positioning/lifecycle assertions.
- `packages/ui/tests/sync/time-offset-popover.test.tsx`: replace current
  minutes `61` normalization expectation with rejection; add blank-as-zero and
  field boundary cases.
- `apps/web/tests/ui/log-search.spec.ts`,
  `apps/desktop/tests/ui/log-search.spec.ts`, and
  `apps/desktop/tests/ui/macos/PaneSearchUITests.swift`: update entry points
  and highlight cleanup/range expectations.
- `apps/web/tests/ui/log-text-copy.spec.ts`,
  `apps/desktop/tests/ui/log-text-copy.spec.ts`, and
  `apps/desktop/tests/ui/macos/LogTextCopyUITests.swift`: remove copied status
  expectations and add context action placement/lifecycle.
- `apps/web/tests/ui/time-offset-popover.spec.ts`,
  `apps/desktop/tests/ui/time-offset-popover.spec.ts`, and
  `apps/desktop/tests/ui/macos/TimeOffsetUITests.swift`: add boundary and blank
  value coverage.
- `apps/web/tests/ui/multi-pane-layout.spec.ts`,
  `apps/desktop/tests/ui/multi-pane-layout.spec.ts`, and
  `apps/desktop/tests/ui/macos/MultiPaneLayoutUITests.swift`: add source
  opening, pane width, reordering, gutter, keyboard, and scroll coverage.
- `apps/web/tests/ui/redesigned-shell-viewports.spec.ts`,
  `apps/desktop/tests/ui/redesigned-shell-viewports.spec.ts`, and
  macOS viewport tests: add changed-surface no-overlap checks.

### New Tests Required For Uncovered Scenarios

- Source picker contract tests for user-selected files/directories and cancel
  behavior.
- `AppShell` component tests proving product source-opening actions call source
  selection rather than sample panes.
- Empty workspace drag/drop tests for Web and Desktop file and directory drops,
  including no pane creation for unsupported drops.
- Pane header drag-reorder tests with midpoint threshold and multi-position
  movement.
- `VirtualLogViewport` tests for vertical wheel/scroll, arrow navigation,
  selected-line state, gutter digit boundaries, and inline search-match spans.
- Copy-selection popover component tests for pointer position, viewport
  collision adjustment, left-click dismissal, right-click relocation, and no
  copied status.
- Settings surface tests for open/close, keyboard navigation, System/Light/Dark
  theme choices, live resolved system theme changes, and preservation of
  pane/search/sync state.
- UI/E2E tests for changed visible surfaces on Web, Desktop WDIO, and macOS
  XCTest where the scenario is available.

## UI Validation Coverage

- **Pane width**: component and UI/E2E tests for single pane fill, multi-pane
  fit, multi-pane overflow, longest-line reachability through horizontal
  content scrolling, and absence of unnecessary blank horizontal scroll space.
- **Pane header controls**: search, offset, close, live/status, directory
  navigation, and active state remain visible, accessible, and non-overlapping.
- **Search highlighting**: only matched text ranges are highlighted for text,
  regex, and case-sensitive searches; full-row highlight is not used for search
  results.
- **Copy popover**: appears beside pointer, stays in viewport, dismisses on
  outside left click, relocates on valid right click, copies text, and shows no
  product-visible `Copied` feedback.
- **Time offset validation**: days unbounded; hours 0-23; minutes and seconds
  0-59; milliseconds 0-999; blank fields apply as zero.
- **Settings/theme behavior**: Settings opens from rail, exposes System/Light/Dark,
  fresh default is System, System follows operating system theme changes live,
  and theme changes preserve current analysis state.
- **Disabled future controls**: activity rail source-list, all-pane search, and
  command field are disabled or inert until their future surfaces exist; filter,
  palette, and bookmark remain unavailable.
- **Drag/drop**: empty workspace and shell drop handling open dropped supported
  sources on Web and Desktop targets and ignore unsupported drops without layout
  breakage.
- **Pane reordering**: header drag changes order after crossing another pane's
  midpoint; intervening panes keep relative order.
- **Gutter width**: line number gutter width follows digit count boundaries and
  does not waste left-side workspace.
- **Keyboard navigation**: focused log viewport handles left/right/up/down and
  syncs other panes on selected-line changes when synchronization is enabled.
- **Sync-scroll behavior**: wheel, click, search navigation, and keyboard
  navigation keep existing timestamp synchronization semantics.

## Accessibility And Viewport Coverage

Changed visible surfaces must have role/name/state assertions and no-overlap
checks in component tests plus UI/E2E where practical:

- Empty workspace open action, drop zone, and drag-over state.
- Topbar sync icon state, add-pane control, and inert command field.
- Activity rail disabled/inert entries and settings entry.
- Settings surface, theme radio/segmented controls, focus trapping/return, and
  Escape/outside close behavior.
- Pane headers, search icon hover/focus treatment, offset tag, close button,
  directory navigation controls, live/status indicators, and drag handle affordance.
- Log viewport selected line, keyboard focus, line number gutter, and inline
  search highlights.
- Copy-selection action pointer placement and lifecycle.
- Time offset popover fields, invalid states, errors, Apply button, and blank
  field behavior.
- Pane search popover controls, match counts, regex/case toggles, close cleanup,
  and focus return.

Viewport coverage must include at least compact desktop, standard desktop, and
wide desktop states for changed shell, pane, popover, and settings surfaces.

## Implementation Phases

### Phase 0: Research And Audit

Output `research.md`. Confirm source picker approach, theme preference model,
pane width strategy, viewport navigation strategy, search range rendering,
copy action lifecycle, time offset validation, and test migration rules.

### Phase 1: Design Artifacts And Contracts

Output `data-model.md`, `contracts/ui-behavior.md`,
`contracts/test-automation.md`, and `quickstart.md`. Re-check constitution
gates after these artifacts are written.

### Phase 2: Source Opening And Disabled Future Entry Points

Wire product source-opening actions through source selection; keep test bridge
fixture actions separate. Disable or make inert activity rail source-list,
activity rail all-pane search, and topbar command field. Preserve pane header
search.

Targeted tests: source picker contract/component tests, empty workspace tests,
search entry point tests, activity rail guard tests, Web/WDIO/macOS entry-point
coverage, and Web/WDIO/macOS drag/drop coverage.

### Phase 3: Pane Layout, Scroll, Reorder, Gutter, Keyboard

Update shared pane layout/rendering to satisfy width, vertical scroll,
header-drag reorder, digit-count gutter, and arrow-key navigation requirements.
Keep existing resize/session semantics.

Targeted tests: pane layout unit tests, viewport component tests, Web/WDIO/macOS
multi-pane and synchronized scrolling tests.

### Phase 4: Search Highlighting And Copy Popover

Render inline search match spans from existing search ranges, clear visible
highlighting on popover close, and implement pointer-positioned copy-selection
action lifecycle without `Copied` product feedback.

Targeted tests: search popover/store/viewport tests, copy component tests, Web
and Desktop copy/search UI tests.

### Phase 5: Time Offset Validation

Apply field-specific range validation and blank-as-zero semantics without
normalizing invalid drafts into valid offsets before Apply.

Targeted tests: time offset component tests, Web/WDIO/macOS offset UI tests,
synchronization-with-offset regression tests.

### Phase 6: Sync Icon, Settings, And Theme

Add distinct sync inactive/active/hover states; add minimal settings surface
with System/Light/Dark theme choice; resolve default theme as System, map it to
the current environment theme, and update the resolved theme live when the
operating system theme changes.

Targeted tests: sync control tests, settings/theme tests, shell viewport and
no-overlap tests, Web/WDIO/macOS settings coverage, and live System theme
coverage.

### Phase 7: Regression, Performance, And Release Validation

Run full local gates before commit, then push and monitor cross-OS CI/CD until
green.

## Local Validation Gates Before Commit

Run targeted tests during each implementation phase, then run the current OS
gates from `/Users/Vladimir.Zulin/projects/idea/Crosslog` before commit:

```bash
bash scripts/macos/test.sh
bash scripts/macos/test-ui.sh
```

Run performance and build gates when rendering, scrolling, search,
synchronization, session, or release-readiness validation is affected:

```bash
bash scripts/macos/perf.sh
bash scripts/macos/build.sh
```

## CI/CD Gates After Push

After push, monitor GitHub Actions or the configured CI/CD checks. Work is not
complete until every required Windows, macOS, and Linux automated test, UI/E2E
test, and build check is green.

Required target gates:

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

Any CI/CD failure found after push must be investigated and fixed before the
bug batch is considered complete.

## Post-Design Constitution Check

- PASS: Phase 0/1 artifacts preserve the selected stack and add no dependency.
- PASS: Planned source opening uses explicit platform ports and keeps fixtures
  behind test helpers.
- PASS: Tests are mapped to every bug scenario and unchanged behavior remains
  protected.
- PASS: Read-only and inert log safety requirements remain unchanged.
- PASS: Local and post-push OS gates are explicit.
