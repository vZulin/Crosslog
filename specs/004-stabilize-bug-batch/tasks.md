# Tasks: Crosslog Bug Batch Stabilization

**Input**: Design documents from `/Users/Vladimir.Zulin/projects/idea/Crosslog/specs/004-stabilize-bug-batch/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Mandatory. The specification requires an audit of existing automated and UI/E2E tests, updates only for tests that encode incorrect bug-report behavior, and missing coverage for every numbered bug scenario.

**Organization**: Tasks are grouped by user story so each bug area can be implemented, tested, and validated independently after the shared foundation is ready.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and does not depend on incomplete tasks.
- **[Story]**: Required only for user story phases.
- Every task includes an exact repository path.

## Phase 1: Setup (Shared Stabilization Audit)

**Purpose**: Confirm the current implementation surface and preserve prior-spec behavior before changing tests or code.

- [X] T001 Audit numbered bug expectations against `docs/Bugs_1.txt` and `specs/004-stabilize-bug-batch/spec.md`.
- [X] T002 [P] Audit preserved MVP behavior in `specs/001-multi-log-analysis/contracts/ui-behavior.md`.
- [X] T003 [P] Audit preserved macOS UI alignment behavior in `specs/003-macos-ui-design-alignment/contracts/ui-alignment-contract.md`.
- [X] T004 [P] Audit existing test reuse and update candidates listed in `specs/004-stabilize-bug-batch/contracts/test-automation.md`.
- [X] T005 [P] Verify no new dependency is needed by reviewing `package.json`, `apps/web/package.json`, `apps/desktop/package.json`, and `packages/ui/package.json`.
- [X] T006 [P] Review product sample-source usage boundaries in `packages/ui/src/app-shell/AppShell.tsx`.
- [X] T007 [P] Review source picker platform boundaries in `packages/platform/src/index.ts` and `packages/platform/src/ports/source-picker-port.ts`.
- [X] T008 [P] Review current UI test bridge fixture setup boundaries in `packages/platform/src/ports/ui-test-bridge-port.ts`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared contracts and guardrails that every user story relies on.

**CRITICAL**: No user story implementation starts until this phase is complete.

- [X] T009 Update the platform contract to expose source picking through `packages/platform/src/index.ts`.
- [X] T010 [P] Add source picker contract coverage for file selection, directory selection, and cancellation in `packages/platform/tests/ports/platform-ports.contract.test.ts`.
- [X] T011 [P] Add source picker adapter tests for Browser selection behavior in `packages/platform/tests/browser/browser-source-picker.test.ts`.
- [X] T012 [P] Add source picker adapter tests for Desktop cancellation and supported selection behavior in `packages/platform/tests/tauri/tauri-source-picker.test.ts`.
- [X] T013 Implement Browser source picker adapter behavior in `packages/platform/src/browser/browser-source-picker.ts`.
- [X] T014 Implement Desktop source picker adapter behavior or stop for dependency approval if existing Tauri APIs cannot satisfy native picking in `packages/platform/src/tauri/tauri-source-picker.ts`.
- [X] T015 Wire the Browser source picker into `apps/web/src/platform/createWebPlatform.ts`.
- [X] T016 Wire the Desktop source picker into `apps/desktop/src/platform/createDesktopPlatform.ts`.
- [X] T017 [P] Add shared test-helper guard assertions that fixture setup is not product source opening in `packages/ui/tests/app-shell/renderRedesignedShell.tsx`.
- [X] T018 [P] Preserve read-only and inert log safeguards by reviewing `tests/integration/read-only-file-safety.test.ts` and `tests/integration/log-content-inert-security.test.ts`.

**Checkpoint**: Source selection ports are available, fixture setup remains test-only, and unchanged safety tests remain protected.

---

## Phase 3: User Story 1 - Open User-Selected Sources From Empty And Topbar Entry Points (Priority: P1) MVP

**Goal**: Empty workspace, add-pane, drag/drop, and unfinished global entry points open only user-selected or dropped sources, while test fixtures remain test-helper only.

**Independent Test**: Start with no panes, cancel source selection, open a file and directory from the empty workspace, add a pane from the topbar, drop a supported source, and verify future rail/search/command controls are disabled or inert.

### Tests for User Story 1 (MANDATORY)

- [X] T019 [P] [US1] Update empty workspace source selection and cancellation tests in `packages/ui/tests/app-shell/empty-workspace.test.tsx`.
- [X] T020 [P] [US1] Update topbar add-pane source selection tests in `packages/ui/tests/app-shell/redesigned-workspace.test.tsx`.
- [X] T021 [P] [US1] Update future entry-point disabled/inert tests in `packages/ui/tests/app-shell/search-entry-points.test.tsx`.
- [X] T022 [P] [US1] Update activity rail future action tests for Open sources, search, and Settings availability in `packages/ui/tests/app-shell/activity-rail-future-actions.test.tsx`.
- [X] T023 [P] [US1] Add Web UI coverage for selected source opening, cancellation, disabled future controls, and empty drag/drop in `apps/web/tests/ui/multi-pane-layout.spec.ts`.
- [X] T024 [P] [US1] Extend Web drag/drop source opening coverage for the empty workspace in `apps/web/tests/ui/browser-drag-drop.spec.ts`.
- [X] T025 [P] [US1] Add Desktop WDIO empty workspace drag/drop coverage in `apps/desktop/tests/ui/source-loading.spec.ts`.
- [X] T026 [P] [US1] Add macOS empty workspace drag/drop coverage in `apps/desktop/tests/ui/macos/EmptyStateUITests.swift`.
- [X] T027 [P] [US1] Update Desktop WDIO source opening and future-control coverage in `apps/desktop/tests/ui/source-loading.spec.ts`.
- [X] T028 [P] [US1] Update Desktop WDIO multi-pane add-source coverage in `apps/desktop/tests/ui/multi-pane-layout.spec.ts`.
- [X] T029 [P] [US1] Update macOS empty state source opening and disabled future-control coverage in `apps/desktop/tests/ui/macos/EmptyStateUITests.swift`.

### Implementation for User Story 1

- [X] T030 [US1] Replace product empty-workspace sample opening with source picker flow in `packages/ui/src/app-shell/AppShell.tsx`.
- [X] T031 [US1] Replace product add-pane sample or adhoc pane creation with source picker flow in `packages/ui/src/app-shell/AppShell.tsx`.
- [X] T032 [US1] Preserve fixture-only sample pane setup behind UI test bridge actions in `packages/ui/src/app-shell/AppShell.tsx`.
- [X] T033 [US1] Disable or make inert the activity rail Open sources action until the source-list side panel exists in `packages/ui/src/app-shell/ActivityRail.tsx`.
- [X] T034 [US1] Disable or make inert activity rail all-pane search while preserving pane-header search in `packages/ui/src/app-shell/ActivityRail.tsx`.
- [X] T035 [US1] Disable or make inert the topbar command field without opening pane search in `packages/ui/src/app-shell/Topbar.tsx`.
- [X] T036 [US1] Keep disabled/inert future controls accessible and non-trapping in `packages/ui/src/app-shell/activity-rail-theme.css`.
- [X] T037 [US1] Ensure empty workspace drag/drop maps supported dropped files and directories into panes in `packages/ui/src/app-shell/AppShell.tsx`.
- [X] T038 [US1] Update empty workspace drop zone states and source-opening callback names in `packages/ui/src/app-shell/EmptyWorkspace.tsx`.
- [X] T039 [US1] Publish source opening and future-control UI test evidence through `packages/platform/src/ports/ui-test-bridge-port.ts`.
- [X] T040 [US1] Run targeted US1 source opening, future-control, and drag/drop tests from `packages/ui/tests/app-shell/`, `apps/web/tests/ui/`, and `apps/desktop/tests/ui/`.

**Checkpoint**: Bugs 1, 2, 12, 13, 16, and 19 are covered and independently testable.

---

## Phase 4: User Story 2 - Navigate And Arrange Panes Without Wasted Workspace Space (Priority: P1)

**Goal**: Pane width, vertical scrolling, pane reordering, gutter sizing, keyboard navigation, and synchronization-triggered navigation work without overlap or wasted workspace.

**Independent Test**: Open panes with short, long, many, and timestamped lines; verify one-pane and multi-pane sizing, wheel scroll, header drag reorder, gutter digit boundaries, arrow keys, and sync-scroll behavior.

### Tests for User Story 2 (MANDATORY)

- [X] T041 [P] [US2] Add pane reorder reducer and order preservation tests in `packages/core/tests/log-pane/log-pane-reducer.test.ts`.
- [X] T042 [P] [US2] Extend pane layout sizing, longest-line reachability, and overflow tests in `packages/ui/tests/pane-rail/pane-workspace-alignment.test.tsx`.
- [X] T043 [P] [US2] Extend pane rail drag reorder and header no-overlap tests in `packages/ui/tests/pane-rail/pane-layout.test.tsx`.
- [X] T044 [P] [US2] Add viewport vertical scroll, keyboard, gutter, and selected-line tests in `packages/ui/tests/log-pane/virtual-log-viewport.test.tsx`.
- [X] T045 [P] [US2] Update Web UI pane width, reorder, gutter, keyboard, and scroll coverage in `apps/web/tests/ui/multi-pane-layout.spec.ts`.
- [X] T046 [P] [US2] Update Web synchronized wheel and keyboard navigation coverage in `apps/web/tests/ui/synchronized-scrolling.spec.ts`.
- [X] T047 [P] [US2] Update Desktop WDIO pane width, reorder, gutter, keyboard, and scroll coverage in `apps/desktop/tests/ui/multi-pane-layout.spec.ts`.
- [X] T048 [P] [US2] Update Desktop WDIO synchronized wheel and keyboard navigation coverage in `apps/desktop/tests/ui/synchronized-scrolling.spec.ts`.
- [X] T049 [P] [US2] Update macOS pane layout and reorder coverage in `apps/desktop/tests/ui/macos/MultiPaneLayoutUITests.swift`.
- [X] T050 [P] [US2] Update macOS synchronized scrolling coverage for keyboard and wheel navigation in `apps/desktop/tests/ui/macos/SynchronizedScrollingUITests.swift`.

### Implementation for User Story 2

- [X] T051 [US2] Add pane reorder state transitions and midpoint-order semantics in `packages/core/src/log-pane/log-pane-reducer.ts`.
- [X] T052 [US2] Preserve desired pane widths while computing efficient visible pane widths and horizontal content ranges in `packages/ui/src/pane-rail/usePaneWorkspaceLayout.ts`.
- [X] T053 [US2] Implement header drag reorder interactions in `packages/ui/src/pane-rail/PaneRail.tsx`.
- [X] T054 [US2] Add reorder affordance and accessible drag state to pane headers in `packages/ui/src/log-pane/PaneHeader.tsx`.
- [X] T055 [US2] Implement vertical wheel scrolling, selected-line state, and arrow-key navigation in `packages/ui/src/log-pane/VirtualLogViewport.tsx`.
- [X] T056 [US2] Emit synchronization anchor changes from wheel and keyboard navigation in `packages/ui/src/log-pane/VirtualLogViewport.tsx`.
- [X] T057 [US2] Size the line-number gutter by total line-count digit count in `packages/ui/src/log-pane/VirtualLogViewport.tsx`.
- [X] T058 [US2] Update pane, gutter, header, and viewport no-overlap styles in `packages/ui/src/app-shell/activity-rail-theme.css`.
- [X] T059 [US2] Publish pane order, gutter, keyboard, and scroll layout evidence through `packages/platform/src/ports/ui-test-bridge-port.ts`.
- [X] T060 [US2] Run targeted US2 pane layout, reorder, gutter, keyboard, and synchronized-scrolling tests from `packages/core/tests/log-pane/`, `packages/ui/tests/pane-rail/`, and UI/E2E suites.

**Checkpoint**: Bugs 3, 4, 17, 18, and 20 are covered and independently testable.

---

## Phase 5: User Story 3 - Search And Copy Text With Correct Highlighting And Popover Lifecycle (Priority: P1)

**Goal**: Pane search highlights only matching text spans and clears visible highlights on close, while copy-selection action appears near the pointer, dismisses or relocates correctly, and does not show product-visible copied feedback.

**Independent Test**: Search plain, case-sensitive, and regex matches; close search; hover the search icon; right-click selected text near multiple viewport edges; left-click dismiss; right-click relocate; copy with no visible copied message.

### Tests for User Story 3 (MANDATORY)

- [X] T061 [P] [US3] Extend pane search popover tests for close cleanup, focus return, and search icon geometry in `packages/ui/tests/search/pane-search-popover.test.tsx`.
- [X] T062 [P] [US3] Add search highlight visibility state tests in `packages/ui/tests/search/search-state.test.tsx`.
- [X] T063 [P] [US3] Add inline search span rendering tests in `packages/ui/tests/log-pane/virtual-log-viewport.test.tsx`.
- [X] T064 [P] [US3] Update copy-selection positioning, lifecycle, and no-copied-text tests in `packages/ui/tests/log-pane/log-text-copy.test.tsx`.
- [X] T065 [P] [US3] Update Web search highlight, cleanup, and entry-point coverage in `apps/web/tests/ui/log-search.spec.ts`.
- [X] T066 [P] [US3] Update Web copy popover position, lifecycle, viewport-boundary, and no-copied-text coverage in `apps/web/tests/ui/log-text-copy.spec.ts`.
- [X] T067 [P] [US3] Update Desktop WDIO search highlight and cleanup coverage in `apps/desktop/tests/ui/log-search.spec.ts`.
- [X] T068 [P] [US3] Update Desktop WDIO copy popover position, lifecycle, and no-copied-text coverage in `apps/desktop/tests/ui/log-text-copy.spec.ts`.
- [X] T069 [P] [US3] Update macOS pane search highlight and close-cleanup coverage in `apps/desktop/tests/ui/macos/PaneSearchUITests.swift`.
- [X] T070 [P] [US3] Update macOS copy-selection position, lifecycle, and no-copied-text coverage in `apps/desktop/tests/ui/macos/LogTextCopyUITests.swift`.

### Implementation for User Story 3

- [X] T071 [US3] Add explicit highlight visibility state and close semantics in `packages/ui/src/search/usePaneSearchStore.ts`.
- [X] T072 [US3] Clear visible highlights while preserving the last navigated match on popover close in `packages/ui/src/search/PaneSearchPopover.tsx`.
- [X] T073 [US3] Render only matched text ranges as inline highlight spans in `packages/ui/src/log-pane/VirtualLogViewport.tsx`.
- [X] T074 [US3] Correct pane search button hover and focus geometry in `packages/ui/src/log-pane/PaneHeader.tsx`.
- [X] T075 [US3] Position the copy-selection action from the context-menu pointer with viewport collision handling in `packages/ui/src/log-pane/LogTextSelection.tsx`.
- [X] T076 [US3] Implement copy-selection left-click dismissal and valid right-click relocation in `packages/ui/src/log-pane/LogTextSelection.tsx`.
- [X] T077 [US3] Remove product-visible copied toast, banner, label, or status text from `packages/ui/src/app-shell/AppShell.tsx`.
- [X] T078 [US3] Update search and copy popover styles for no-overlap and edge positioning in `packages/ui/src/app-shell/activity-rail-theme.css`.
- [X] T079 [US3] Run targeted US3 pane search, inline highlight, copy-selection, and popover lifecycle tests from `packages/ui/tests/search/`, `packages/ui/tests/log-pane/`, and UI/E2E suites.

**Checkpoint**: Bugs 5, 6, 7, 8, 9, and 21 are covered and independently testable.

---

## Phase 6: User Story 4 - Apply Time Offsets With Clear Boundary Validation (Priority: P2)

**Goal**: Time offset fields validate boundaries before apply, treat blank fields as zero, identify invalid fields accessibly, and preserve existing synchronization offset behavior.

**Independent Test**: Enter valid boundaries, out-of-range values, non-whole values, and blank values for days, hours, minutes, seconds, and milliseconds; apply valid drafts and verify synchronized target lines.

### Tests for User Story 4 (MANDATORY)

- [X] T080 [P] [US4] Extend core time offset parsing and formatting boundary tests in `packages/core/tests/sync/time-offset.test.ts`.
- [X] T081 [P] [US4] Update component boundary, blank-field, and accessible invalid-state tests in `packages/ui/tests/sync/time-offset-popover.test.tsx`.
- [X] T082 [P] [US4] Update Web time offset boundary and blank-as-zero coverage in `apps/web/tests/ui/time-offset-popover.spec.ts`.
- [X] T083 [P] [US4] Update Desktop WDIO time offset boundary and blank-as-zero coverage in `apps/desktop/tests/ui/time-offset-popover.spec.ts`.
- [X] T084 [P] [US4] Update macOS time offset boundary and blank-as-zero coverage in `apps/desktop/tests/ui/macos/TimeOffsetUITests.swift`.
- [X] T085 [P] [US4] Add synchronization-after-valid-offset regression coverage in `packages/core/tests/sync/sync-engine.test.ts`.

### Implementation for User Story 4

- [X] T086 [US4] Implement field-specific draft validation and blank-as-zero conversion in `packages/core/src/sync/time-offset.ts`.
- [X] T087 [US4] Apply validation before offset normalization in `packages/ui/src/sync/TimeOffsetEditor.tsx`.
- [X] T088 [US4] Prevent invalid drafts from replacing the previous valid offset in `packages/ui/src/sync/TimeOffsetPopover.tsx`.
- [X] T089 [US4] Expose accessible invalid states and field-specific errors in `packages/ui/src/sync/TimeOffsetEditor.tsx`.
- [X] T090 [US4] Update time offset invalid-state and focus styles in `packages/ui/src/app-shell/activity-rail-theme.css`.
- [X] T091 [US4] Publish time offset boundary and blank-field UI test evidence through `packages/platform/src/ports/ui-test-bridge-port.ts`.
- [X] T092 [US4] Run targeted US4 time offset validation and synchronization-offset tests from `packages/core/tests/sync/`, `packages/ui/tests/sync/`, and UI/E2E suites.

**Checkpoint**: Bugs 10 and 22 are covered and independently testable.

---

## Phase 7: User Story 5 - See Accurate Sync, Settings, And Theme State (Priority: P2)

**Goal**: Sync inactive, active, and hover states are distinct; Settings opens from the activity rail; theme defaults to System and can switch System, Light, or Dark without resetting analysis state.

**Independent Test**: Start fresh, verify System theme default, toggle sync and hover states, open Settings in empty and populated workspaces, switch themes, and verify panes, search, sources, and sync state remain intact.

### Tests for User Story 5 (MANDATORY)

- [ ] T093 [P] [US5] Update sync icon active, inactive, hover, and pressed-state tests in `packages/ui/tests/sync/redesigned-sync-controls.test.tsx`.
- [ ] T094 [P] [US5] Update shell accessibility tests for Settings and theme controls in `packages/ui/tests/app-shell/redesigned-shell-final-a11y.test.tsx`.
- [ ] T095 [P] [US5] Update theme default, System/Light/Dark selection, and live System theme tests in `packages/ui/tests/app-shell/theme-variants.test.tsx`.
- [ ] T096 [P] [US5] Update shell presentation tests for product theme preference compatibility in `packages/ui/tests/app-shell/shell-presentation.test.tsx`.
- [ ] T097 [P] [US5] Add settings surface component tests in `packages/ui/tests/app-shell/settings-surface.test.tsx`.
- [ ] T098 [P] [US5] Update Web viewport/no-overlap coverage for Settings, sync, and theme controls in `apps/web/tests/ui/redesigned-shell-viewports.spec.ts`.
- [ ] T099 [P] [US5] Add Web settings, theme, and live System theme workflow coverage in `apps/web/tests/ui/settings-theme.spec.ts`.
- [ ] T100 [P] [US5] Update Desktop WDIO viewport/no-overlap coverage for Settings, sync, and theme controls in `apps/desktop/tests/ui/redesigned-shell-viewports.spec.ts`.
- [ ] T101 [P] [US5] Add Desktop WDIO settings, theme, and live System theme workflow coverage in `apps/desktop/tests/ui/settings-theme.spec.ts`.
- [ ] T102 [P] [US5] Update macOS viewport assertions for Settings, sync, and theme controls in `apps/desktop/tests/ui/macos/RedesignedShellViewportUITests.swift`.
- [ ] T103 [P] [US5] Add macOS settings, theme, and live System theme workflow coverage in `apps/desktop/tests/ui/macos/SettingsThemeUITests.swift`.

### Implementation for User Story 5

- [ ] T104 [US5] Add System, Light, and Dark theme preference state, default System resolution, and live System theme updates in `packages/ui/src/app-shell/shellPresentation.ts`.
- [ ] T105 [US5] Add minimal settings surface UI in `packages/ui/src/app-shell/SettingsSurface.tsx`.
- [ ] T106 [US5] Wire Settings open, close, focus return, and theme changes in `packages/ui/src/app-shell/AppShell.tsx`.
- [ ] T107 [US5] Wire the activity rail Settings action to the settings surface in `packages/ui/src/app-shell/ActivityRail.tsx`.
- [ ] T108 [US5] Update sync inactive, active, hover, and focus visual states in `packages/ui/src/sync/SynchronizationToggle.tsx`.
- [ ] T109 [US5] Update topbar sync, settings surface, and theme styles in `packages/ui/src/app-shell/activity-rail-theme.css`.
- [ ] T110 [US5] Export settings surface and related types from `packages/ui/src/index.ts`.
- [ ] T111 [US5] Publish settings, theme preference, and sync visual state evidence through `packages/platform/src/ports/ui-test-bridge-port.ts`.
- [ ] T112 [US5] Run targeted US5 sync, settings, theme, live System theme, and viewport/no-overlap tests from `packages/ui/tests/`, `apps/web/tests/ui/`, and `apps/desktop/tests/ui/`.

**Checkpoint**: Bugs 11, 14, and 15 are covered and independently testable.

---

## Phase 8: Polish & Cross-Cutting Validation

**Purpose**: Run targeted and full validation, confirm unchanged behavior remains protected, and prepare post-push CI/CD monitoring.

- [ ] T113 [P] Re-run unchanged core regression suites in `packages/core/tests/directory/`, `packages/core/tests/encoding/`, `packages/core/tests/file-source/`, `packages/core/tests/session/`, and `packages/core/tests/timestamps/`.
- [ ] T114 [P] Re-run unchanged platform regression suites in `packages/platform/tests/browser/`, `packages/platform/tests/file-access/`, `packages/platform/tests/file-watcher/`, and `packages/platform/tests/session/`.
- [ ] T115 [P] Re-run read-only and inert content integration tests in `tests/integration/read-only-file-safety.test.ts` and `tests/integration/log-content-inert-security.test.ts`.
- [ ] T116 Run targeted UI component tests listed in `specs/004-stabilize-bug-batch/quickstart.md`.
- [ ] T117 Run targeted Web UI tests listed in `specs/004-stabilize-bug-batch/quickstart.md`.
- [ ] T118 Run performance benchmarks affected by layout, search, sync, session, and rendering in `tests/performance/`.
- [ ] T119 Run the local macOS automated gate with `scripts/macos/test.sh`.
- [ ] T120 Run the local macOS UI/E2E gate with `scripts/macos/test-ui.sh`.
- [ ] T121 Run the local macOS build gate when release readiness is affected with `scripts/macos/build.sh`.
- [ ] T122 Verify no unresolved bug scenario remains by reviewing `docs/Bugs_1.txt` and `specs/004-stabilize-bug-batch/plan.md`.
- [ ] T123 After push, monitor Windows automated, UI/E2E, and build checks defined by `scripts/windows/test.ps1`, `scripts/windows/test-ui.ps1`, and `scripts/windows/build.ps1`.
- [ ] T124 After push, monitor macOS automated, UI/E2E, and build checks defined by `scripts/macos/test.sh`, `scripts/macos/test-ui.sh`, and `scripts/macos/build.sh`.
- [ ] T125 After push, monitor Linux automated, UI/E2E, and build checks defined by `scripts/linux/test.sh`, `scripts/linux/test-ui.sh`, and `scripts/linux/build.sh`.

---

## Bug Coverage Summary

| Bug | User story | Primary test tasks | Primary implementation tasks |
| --- | --- | --- | --- |
| 1 Empty workspace open uses demo sources | US1 | T019, T023, T027, T029 | T030, T032 |
| 2 Add pane uses demo source | US1 | T020, T023, T028 | T031, T032 |
| 3 Pane too wide | US2 | T042, T045, T047, T049 | T052, T058 |
| 4 Vertical scroll inside pane broken | US2 | T044, T046, T048, T050 | T055, T056 |
| 5 Search icon hover highlight offset | US3 | T061, T065, T067, T069 | T074, T078 |
| 6 Copy action appears in wrong place | US3 | T064, T066, T068, T070 | T075, T078 |
| 7 Copy action lifecycle | US3 | T064, T066, T068, T070 | T076, T078 |
| 8 "Copied" appears after copy | US3 | T064, T066, T068, T070 | T077 |
| 9 Search highlights full row | US3 | T061, T063, T065, T067, T069 | T071, T073 |
| 10 Time offset boundary validation missing | US4 | T080, T081, T082, T083, T084, T085 | T086, T087, T088, T089 |
| 11 Sync icon state identical | US5 | T093, T094, T098, T100, T102 | T108, T109, T111 |
| 12 Open sources rail action wrong | US1 | T021, T022, T023, T027, T029 | T033, T036 |
| 13 Activity rail search wrong | US1 | T021, T022, T023, T027, T029 | T034, T036 |
| 14 Settings does nothing | US5 | T094, T097, T099, T101, T103 | T105, T106, T107, T109 |
| 15 Default theme wrong | US5 | T095, T096, T099, T101, T103 | T104, T106, T109 |
| 16 Command field opens pane search | US1 | T021, T023, T027, T029 | T035, T036 |
| 17 Cannot reorder panes | US2 | T041, T043, T045, T047, T049 | T051, T053, T054 |
| 18 Line-number gutter too wide | US2 | T044, T045, T047, T049 | T057, T058 |
| 19 Empty workspace drag/drop broken | US1 | T019, T024, T025, T026, T029 | T037, T038 |
| 20 Arrow-key navigation broken | US2 | T044, T046, T048, T050 | T055, T056 |
| 21 Search highlight remains after close | US3 | T061, T062, T065, T067, T069 | T071, T072 |
| 22 Blank time offset field invalid | US4 | T080, T081, T082, T083, T084 | T086, T087, T089 |

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: No dependencies.
- **Phase 2 Foundational**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 US1**: Depends on Phase 2. This is the MVP stabilization increment.
- **Phase 4 US2**: Depends on Phase 2. Can run in parallel with US1 after foundation, but sequential execution should keep P1 order.
- **Phase 5 US3**: Depends on Phase 2. Can run in parallel with US1 and US2 after foundation, but search/copy viewport work should coordinate with US2 viewport changes.
- **Phase 6 US4**: Depends on Phase 2. Can run after foundation and does not depend on US1-US3.
- **Phase 7 US5**: Depends on Phase 2. Can run after foundation and should coordinate with US1 disabled activity rail behavior.
- **Phase 8 Polish**: Depends on completed user stories selected for the current implementation pass and their targeted test gate tasks.

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories after foundation. Covers bugs 1, 2, 12, 13, 16, and 19.
- **US2 (P1)**: No dependency on other stories after foundation. Covers bugs 3, 4, 17, 18, and 20.
- **US3 (P1)**: No dependency on other stories after foundation, but implementation should avoid conflicting edits with US2 in `packages/ui/src/log-pane/VirtualLogViewport.tsx`. Covers bugs 5, 6, 7, 8, 9, and 21.
- **US4 (P2)**: No dependency on other stories after foundation. Covers bugs 10 and 22.
- **US5 (P2)**: No dependency on other stories after foundation, but settings activity rail wiring should coordinate with US1 disabled future controls. Covers bugs 11, 14, and 15.

### Within Each User Story

- Write or update tests first and confirm they fail for the current incorrect behavior.
- Implement shared core or platform rules before shared UI wiring.
- Implement shared UI behavior before Web, Desktop WDIO, or macOS XCTest adjustments.
- Run targeted tests before marking a user story checkpoint complete.
- Preserve valid tests unchanged unless they encode the incorrect behavior described in `docs/Bugs_1.txt`.

---

## Parallel Opportunities

- Setup audits T002-T008 can run in parallel.
- Foundational tests T010-T012 and guard tasks T017-T018 can run in parallel.
- US1 test tasks T019-T029 can run in parallel before US1 implementation.
- US2 test tasks T041-T050 can run in parallel before US2 implementation.
- US3 test tasks T061-T070 can run in parallel before US3 implementation.
- US4 test tasks T080-T085 can run in parallel before US4 implementation.
- US5 test tasks T093-T103 can run in parallel before US5 implementation.
- Cross-cutting regression tasks T113-T115 can run in parallel.

---

## Parallel Example: User Story 1

```text
Task: "T019 Update empty workspace source selection and cancellation tests in packages/ui/tests/app-shell/empty-workspace.test.tsx"
Task: "T021 Update future entry-point disabled/inert tests in packages/ui/tests/app-shell/search-entry-points.test.tsx"
Task: "T024 Extend Web drag/drop source opening coverage for the empty workspace in apps/web/tests/ui/browser-drag-drop.spec.ts"
Task: "T026 Add macOS empty workspace drag/drop coverage in apps/desktop/tests/ui/macos/EmptyStateUITests.swift"
```

## Parallel Example: User Story 2

```text
Task: "T041 Add pane reorder reducer and order preservation tests in packages/core/tests/log-pane/log-pane-reducer.test.ts"
Task: "T044 Add viewport vertical scroll, keyboard, gutter, and selected-line tests in packages/ui/tests/log-pane/virtual-log-viewport.test.tsx"
Task: "T046 Update Web synchronized wheel and keyboard navigation coverage in apps/web/tests/ui/synchronized-scrolling.spec.ts"
Task: "T050 Update macOS synchronized scrolling coverage for keyboard and wheel navigation in apps/desktop/tests/ui/macos/SynchronizedScrollingUITests.swift"
```

## Parallel Example: User Story 3

```text
Task: "T061 Extend pane search popover tests for close cleanup, focus return, and search icon geometry in packages/ui/tests/search/pane-search-popover.test.tsx"
Task: "T064 Update copy-selection positioning, lifecycle, and no-copied-text tests in packages/ui/tests/log-pane/log-text-copy.test.tsx"
Task: "T065 Update Web search highlight, cleanup, and entry-point coverage in apps/web/tests/ui/log-search.spec.ts"
Task: "T070 Update macOS copy-selection position, lifecycle, and no-copied-text coverage in apps/desktop/tests/ui/macos/LogTextCopyUITests.swift"
```

## Parallel Example: User Story 4

```text
Task: "T080 Extend core time offset parsing and formatting boundary tests in packages/core/tests/sync/time-offset.test.ts"
Task: "T081 Update component boundary, blank-field, and accessible invalid-state tests in packages/ui/tests/sync/time-offset-popover.test.tsx"
Task: "T082 Update Web time offset boundary and blank-as-zero coverage in apps/web/tests/ui/time-offset-popover.spec.ts"
Task: "T084 Update macOS time offset boundary and blank-as-zero coverage in apps/desktop/tests/ui/macos/TimeOffsetUITests.swift"
```

## Parallel Example: User Story 5

```text
Task: "T093 Update sync icon active, inactive, hover, and pressed-state tests in packages/ui/tests/sync/redesigned-sync-controls.test.tsx"
Task: "T097 Add settings surface component tests in packages/ui/tests/app-shell/settings-surface.test.tsx"
Task: "T099 Add Web settings, theme, and live System theme workflow coverage in apps/web/tests/ui/settings-theme.spec.ts"
Task: "T103 Add macOS settings, theme, and live System theme workflow coverage in apps/desktop/tests/ui/macos/SettingsThemeUITests.swift"
```

---

## Implementation Strategy

### MVP First (P1 Stabilization)

1. Complete Phase 1 setup audits.
2. Complete Phase 2 foundational source picker and fixture guardrails.
3. Complete Phase 3 US1 source opening and disabled future entry points.
4. Complete Phase 4 US2 pane layout, navigation, reordering, gutter, and synchronization movement.
5. Complete Phase 5 US3 search and copy stabilization.
6. Stop and validate all P1 bug scenarios independently before moving to P2.

### Incremental Delivery

1. Add US4 time offset validation after P1 behavior is stable.
2. Add US5 sync icon, settings, and theme behavior after activity rail wiring is stable.
3. Run Phase 8 local validation gates before commit.
4. Push only after local automated and local UI/E2E gates pass.
5. Monitor Windows, macOS, and Linux CI/CD checks after push and fix failures until green.
