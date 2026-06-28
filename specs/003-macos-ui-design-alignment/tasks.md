# Tasks: Crosslog macOS UI Design Alignment

**Input**: Design documents from `/Users/Vladimir.Zulin/projects/idea/Crosslog/specs/003-macos-ui-design-alignment/`  
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Tests are mandatory for this alignment pass. The feature spec requires UI tests for every user story, reuses unchanged non-UI regression tests, and adds only missing alignment coverage.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently. This is a delta plan over `specs/002-redesign-activity-rail`; do not duplicate completed 002 scope as new product work.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and has no dependency on incomplete tasks in the same phase.
- **[Story]**: Required for user story phases only.
- Every task includes at least one exact file path.

## Phase 1: Setup (Shared Alignment Scaffolding)

**Purpose**: Prepare shared selectors, helpers, and implementation notes for the alignment pass.

- [ ] T001 Create the implementation inventory for current-vs-target UI gaps in `specs/003-macos-ui-design-alignment/implementation-inventory.md`
- [ ] T002 Add missing stable test IDs for empty workspace, drop zone, theme variant, platform chrome, resize boundary, and obsolete-control checks in `packages/ui/src/app-shell/testIds.ts`
- [ ] T003 [P] Extend shared component render options for empty workspace, theme variant, platform variant, and long-name panes in `packages/ui/tests/app-shell/renderRedesignedShell.tsx`
- [ ] T004 [P] Extend Web UI shell locators for empty workspace, drop zone, theme/platform chrome, resize boundary, and obsolete-control absence checks in `apps/web/tests/ui/helpers/redesigned-shell.ts`
- [ ] T005 [P] Extend Desktop WDIO shell locators and UI bridge helpers for theme/platform chrome, resize boundary, and lifecycle test actions in `apps/desktop/tests/ui/helpers/redesigned-shell.ts`
- [ ] T006 [P] Extend macOS XCTest shell assertions for theme/platform chrome, empty workspace, resize boundary, and obsolete-control absence in `apps/desktop/tests/ui/macos/RedesignedShellAssertions.swift`
- [ ] T007 Create the running validation log for this alignment pass in `specs/003-macos-ui-design-alignment/validation-log.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add shared presentation state and non-product test plumbing that all user stories depend on.

**CRITICAL**: No user story implementation should begin until this phase is complete.

- [ ] T008 Define `ThemeVariant`, `PlatformShellVariant`, and shell presentation helpers in `packages/ui/src/app-shell/shellPresentation.ts`
- [ ] T009 [P] Export shell presentation helpers and any new app-shell test IDs from `packages/ui/src/index.ts`
- [ ] T010 [P] Add shared app-shell icon coverage for sync, add-pane, platform caption controls, source/drop, and resize affordances in `packages/ui/src/app-shell/icons.tsx`
- [ ] T011 Add UI test bridge shell state fields for theme variant, platform variant, obsolete-control visibility, and workspace layout measurements in `packages/platform/src/ports/ui-test-bridge-port.ts`
- [ ] T012 Update Tauri UI test bridge state publication to expose the new shell state fields in `packages/platform/src/tauri/tauri-ui-test-bridge.ts`
- [ ] T013 Add Web shell presentation override parsing for testable theme/platform variants in `apps/web/src/App.tsx`
- [ ] T014 Add Desktop shell presentation override parsing for testable theme/platform variants in `apps/desktop/src/App.tsx`
- [ ] T015 [P] Add component tests for shell presentation helper defaults and validation in `packages/ui/tests/app-shell/shell-presentation.test.tsx`
- [ ] T016 [P] Add contract tests for the extended UI test bridge shell state shape in `packages/platform/tests/ports/ui-test-bridge-port.test.ts`
- [ ] T017 Run `bash scripts/macos/test.sh` for the foundational phase and record the result in `specs/003-macos-ui-design-alignment/validation-log.md`
- [ ] T018 Review `specs/003-macos-ui-design-alignment/implementation-inventory.md` against `docs/mockups/crosslog-macos-redesign-mockups.html` before starting story work

**Checkpoint**: Shared presentation state, selectors, helpers, and test bridge fields are ready.

---

## Phase 3: User Story 1 - Use the Aligned Shell Without Obsolete Controls (Priority: P1) MVP

**Goal**: The empty and populated shell match the updated topbar/activity-rail/empty-workspace design and no obsolete product controls are visible.

**Independent Test**: Start with no panes, verify the compact topbar, activity rail, centered drop zone, `Open Source`, drag/drop entry point, and absence of removed controls; open panes and verify obsolete controls remain absent.

### Tests for User Story 1 (MANDATORY)

- [ ] T019 [P] [US1] Add component tests for obsolete-control absence, activity rail order/sizing, Files MVP-only behavior, future rail unavailability, and Directory Search left-panel guardrails in `packages/ui/tests/app-shell/obsolete-controls.test.tsx` and `packages/ui/tests/app-shell/activity-rail-future-actions.test.tsx`
- [ ] T020 [P] [US1] Update shell component tests for `Open Source`, compact topbar controls, and no visible sync text in `packages/ui/tests/app-shell/redesigned-workspace.test.tsx`
- [ ] T021 [P] [US1] Update synchronization component tests from checkbox/text assertions to icon-button state assertions in `packages/ui/tests/sync/redesigned-sync-controls.test.tsx`
- [ ] T022 [P] [US1] Update existing synchronization control tests to preserve store behavior without requiring topbar text in `packages/ui/tests/sync/synchronization-controls.test.tsx`
- [ ] T023 [P] [US1] Add empty workspace layout and drag-over no-shift component coverage in `packages/ui/tests/app-shell/empty-workspace.test.tsx`
- [ ] T024 [P] [US1] Update Web shell UI tests from `Open logs` and `Split active pane` to target controls in `apps/web/tests/ui/multi-pane-layout.spec.ts`
- [ ] T025 [P] [US1] Update Web browser drag/drop UI test for the target empty drop zone and `Open Source` action in `apps/web/tests/ui/browser-drag-drop.spec.ts`
- [ ] T026 [P] [US1] Update Desktop WDIO multi-pane UI test for target topbar controls and obsolete-control absence in `apps/desktop/tests/ui/multi-pane-layout.spec.ts`
- [ ] T027 [P] [US1] Update macOS empty-state XCTest coverage for target empty workspace and obsolete-control absence in `apps/desktop/tests/ui/macos/EmptyStateUITests.swift`

### Implementation for User Story 1

- [ ] T028 [US1] Replace visible checkbox/text synchronization UI with an icon-only accessible control in `packages/ui/src/sync/SynchronizationToggle.tsx`
- [ ] T029 [US1] Align the compact topbar command field, sync icon, and add-pane icon placement in `packages/ui/src/app-shell/Topbar.tsx`
- [ ] T030 [US1] Remove the visible `Split active pane` button while keeping add-pane dispatch wiring in `packages/ui/src/pane-rail/AddPaneButton.tsx`
- [ ] T031 [US1] Route the topbar add-pane action to split the rightmost pane when panes exist in `packages/ui/src/app-shell/AppShell.tsx`
- [ ] T032 [US1] Create the aligned empty workspace drop zone and `Open Source` component in `packages/ui/src/app-shell/EmptyWorkspace.tsx`
- [ ] T033 [US1] Replace the old empty workspace content and product-visible workspace action toolbar with target shell content in `packages/ui/src/app-shell/AppShell.tsx`
- [ ] T034 [US1] Remove `FuturePaneToolbarSlot` rendering from the product shell and keep any future surfaces explicitly guarded in `packages/ui/src/app-shell/AppShell.tsx`
- [ ] T035 [US1] Stop exporting product-visible future pane toolbar affordances from `packages/ui/src/index.ts`
- [ ] T036 [US1] Remove the permanent pane copy toolbar and per-pane status footer while preserving selection/context-menu copy behavior in `packages/ui/src/log-pane/LogPane.tsx`
- [ ] T037 [US1] Adjust copy selection behavior so tests use selection, keyboard, or context menu instead of a permanent toolbar in `packages/ui/src/log-pane/LogTextSelection.tsx`
- [ ] T038 [US1] Run `bash scripts/macos/test.sh` and `bash scripts/macos/test-ui.sh` for US1 and record the result in `specs/003-macos-ui-design-alignment/validation-log.md`

**Checkpoint**: User Story 1 is independently functional and demoable.

---

## Phase 4: User Story 2 - Compare Logs in the Aligned Pane Workspace (Priority: P1)

**Goal**: Multiple file and directory panes match the target workspace/header layout, drag resize by boundaries, fill the right edge when they fit, and keep horizontal scrolling behavior.

**Independent Test**: Open one file source and two directory sources, verify headers, add a pane, close a pane, drag a boundary, verify right-edge alignment when panes fit, and verify workspace plus per-pane horizontal scrolling when panes overflow.

### Tests for User Story 2 (MANDATORY)

- [ ] T039 [P] [US2] Update pane rail component tests from plus/minus resize clicks to drag-boundary resize behavior in `packages/ui/tests/pane-rail/pane-layout.test.tsx`
- [ ] T040 [P] [US2] Add component tests for rightmost-pane alignment, overflow-only workspace scroll, and desired-width persistence in `packages/ui/tests/pane-rail/pane-workspace-alignment.test.tsx`
- [ ] T041 [P] [US2] Update responsive no-overlap tests for long pane names and target header spacing in `packages/ui/tests/app-shell/redesigned-shell-responsive.test.tsx`
- [ ] T042 [P] [US2] Update file lifecycle header tests for compact live dot and no per-pane ready footer in `packages/ui/tests/log-pane/pane-lifecycle-header.test.tsx`
- [ ] T043 [P] [US2] Update directory header tests for current-file identity, previous/next controls, and long-name truncation in `packages/ui/tests/log-pane/directory-pane-header.test.tsx`
- [ ] T044 [P] [US2] Add focused file-pane header layout tests with no directory controls in `packages/ui/tests/log-pane/file-pane-header.test.tsx`
- [ ] T045 [P] [US2] Update Web multi-pane layout UI test for drag resize, right-edge alignment, and independent horizontal pane scrolling in `apps/web/tests/ui/multi-pane-layout.spec.ts`
- [ ] T046 [P] [US2] Update Web directory navigation UI test for aligned directory headers and no-overlap behavior in `apps/web/tests/ui/directory-navigation.spec.ts`
- [ ] T047 [P] [US2] Update Desktop WDIO multi-pane layout UI test for drag resize and right-edge alignment in `apps/desktop/tests/ui/multi-pane-layout.spec.ts`
- [ ] T048 [P] [US2] Update Desktop WDIO directory navigation UI test for aligned directory headers in `apps/desktop/tests/ui/directory-navigation.spec.ts`
- [ ] T049 [P] [US2] Update macOS multi-pane XCTest coverage for drag resize and right-edge alignment in `apps/desktop/tests/ui/macos/MultiPaneLayoutUITests.swift`
- [ ] T050 [P] [US2] Update macOS directory navigation XCTest coverage for aligned headers in `apps/desktop/tests/ui/macos/DirectoryNavigationUITests.swift`

### Implementation for User Story 2

- [ ] T051 [US2] Create view-level pane fill and overflow calculation helpers in `packages/ui/src/pane-rail/usePaneWorkspaceLayout.ts`
- [ ] T052 [US2] Apply computed rendered widths and overflow state in the pane workspace container in `packages/ui/src/pane-rail/PaneWorkspace.tsx`
- [ ] T053 [US2] Pass rendered pane widths, overflow state, and resize boundary metadata through pane rail rendering in `packages/ui/src/pane-rail/PaneRail.tsx`
- [ ] T054 [US2] Replace plus/minus resize controls with a draggable editor-style boundary in `packages/ui/src/pane-rail/PaneResizer.tsx`
- [ ] T055 [US2] Add pointer drag handling and accessible separator state for resize boundaries in `packages/ui/src/pane-rail/PaneResizeBoundary.tsx`
- [ ] T056 [US2] Preserve desired pane widths and avoid persisting auto-fill widths when saving sessions in `packages/ui/src/app-shell/AppShell.tsx`
- [ ] T057 [US2] Align file and directory pane header structure, active indicator, live dot, offset tag, find icon, and close spacing in `packages/ui/src/log-pane/PaneHeader.tsx`
- [ ] T058 [US2] Align directory previous/next controls with target icon sizing and disabled boundary states in `packages/ui/src/log-pane/DirectoryNavigator.tsx`
- [ ] T059 [US2] Update pane workspace, resizer, header, scrollbar, and no-overlap CSS in `packages/ui/src/app-shell/activity-rail-theme.css`
- [ ] T060 [US2] Run `bash scripts/macos/test.sh`, `bash scripts/macos/test-ui.sh`, and `bash scripts/macos/perf.sh` for US2 and record the result in `specs/003-macos-ui-design-alignment/validation-log.md`

**Checkpoint**: User Story 2 is independently functional and does not regress User Story 1.

---

## Phase 5: User Story 5 - Preserve Existing MVP Behavior and Test Value (Priority: P1)

**Goal**: Existing Crosslog MVP workflows continue to pass after design alignment, with selector updates only where the UI presentation changed.

**Independent Test**: Run existing MVP behavioral coverage and verify source opening, directory navigation, synchronization, search, offset, live update, encoding, session restore, read-only safety, inert rendering, and platform capability boundaries still match prior specs.

### Tests for User Story 5 (MANDATORY)

- [ ] T061 [P] [US5] Update Web session restore UI test for aligned shell selectors and preserved pane/session outcomes in `apps/web/tests/ui/session-restore.spec.ts`
- [ ] T062 [P] [US5] Update Desktop WDIO session restore UI test for aligned shell selectors and preserved pane/session outcomes in `apps/desktop/tests/ui/session-restore.spec.ts`
- [ ] T063 [P] [US5] Update macOS session restore XCTest coverage for aligned shell selectors and preserved pane/session outcomes in `apps/desktop/tests/ui/macos/SessionRestoreUITests.swift`
- [ ] T064 [P] [US5] Update Web unsupported-monitoring UI test to use aligned lifecycle indicators without old product action buttons in `apps/web/tests/ui/unsupported-monitoring.spec.ts`
- [ ] T065 [P] [US5] Update Desktop live file update UI test to use UI bridge actions instead of visible lifecycle buttons in `apps/desktop/tests/ui/live-file-updates.spec.ts`
- [ ] T066 [P] [US5] Update macOS live file state XCTest coverage to use UI bridge actions and aligned header indicators in `apps/desktop/tests/ui/macos/LiveFileStateUITests.swift`
- [ ] T067 [P] [US5] Update Web log text copy UI test to verify selection/context-menu/keyboard copy without permanent toolbar UI in `apps/web/tests/ui/log-text-copy.spec.ts`
- [ ] T068 [P] [US5] Update Desktop log text copy UI test to verify selection/context-menu/keyboard copy without permanent toolbar UI in `apps/desktop/tests/ui/log-text-copy.spec.ts`
- [ ] T069 [P] [US5] Update macOS log text copy XCTest coverage for aligned copy behavior in `apps/desktop/tests/ui/macos/LogTextCopyUITests.swift`
- [ ] T070 [P] [US5] Add final test reuse audit updates for reused, selector-updated, activity rail/Files guardrail, Directory Search guardrail, and newly added coverage in `specs/003-macos-ui-design-alignment/test-reuse-audit.md`

### Implementation for User Story 5

- [ ] T071 [US5] Keep lifecycle simulation actions available only through UI test bridge command handling in `packages/ui/src/app-shell/AppShell.tsx`
- [ ] T072 [US5] Update the UI test bridge action type list and shell-state publication for lifecycle/source actions in `packages/platform/src/ports/ui-test-bridge-port.ts`
- [ ] T073 [US5] Update Desktop UI bridge command consumption for lifecycle/source actions in `apps/desktop/src-tauri/src/commands/ui_test.rs`
- [ ] T074 [US5] Keep browser and Desktop capability messaging aligned with the new shell in `packages/ui/src/app-shell/CapabilityLimitations.tsx`
- [ ] T075 [US5] Verify read-only and inert rendering regressions remain unchanged by running existing safety tests and recording results in `specs/003-macos-ui-design-alignment/validation-log.md`
- [ ] T076 [US5] Run `bash scripts/macos/test.sh` and `bash scripts/macos/test-ui.sh` for US5 and record the result in `specs/003-macos-ui-design-alignment/validation-log.md`

**Checkpoint**: Prior MVP behavior remains requirement-driven and covered.

---

## Phase 6: User Story 3 - Use Pane-Local Compact Popovers (Priority: P2)

**Goal**: Pane search and time offset popovers are compact, pane-local, correctly anchored, keyboard dismissible, and preserve per-pane search/offset behavior.

**Independent Test**: Open at least three panes, trigger pane search and time offset from left, middle, and right panes, verify compact controls in the invoking pane, validate Escape/focus return, invalid regex, invalid offset input, and pane-local state isolation.

### Tests for User Story 3 (MANDATORY)

- [ ] T077 [P] [US3] Update pane search popover component tests for compact layout, Escape handling, focus return, and mode controls in `packages/ui/tests/search/pane-search-popover.test.tsx`
- [ ] T078 [P] [US3] Update time offset popover component tests for compact layout, no persistent Close button, Escape handling, focus return, and Apply-only action in `packages/ui/tests/sync/time-offset-popover.test.tsx`
- [ ] T079 [P] [US3] Add pane-local popover positioning tests for left, middle, and right panes in `packages/ui/tests/app-shell/pane-local-popovers.test.tsx`
- [ ] T080 [P] [US3] Update search entry point tests for command field, activity rail, and pane find icon to use aligned controls in `packages/ui/tests/app-shell/search-entry-points.test.tsx`
- [ ] T081 [P] [US3] Update Web pane search UI test for compact pane-local popover behavior in `apps/web/tests/ui/log-search.spec.ts`
- [ ] T082 [P] [US3] Update Web time offset UI test for compact pane-local popover behavior in `apps/web/tests/ui/time-offset-popover.spec.ts`
- [ ] T083 [P] [US3] Update Desktop WDIO pane search UI test for compact pane-local popover behavior in `apps/desktop/tests/ui/log-search.spec.ts`
- [ ] T084 [P] [US3] Update Desktop WDIO time offset UI test for compact pane-local popover behavior in `apps/desktop/tests/ui/time-offset-popover.spec.ts`
- [ ] T085 [P] [US3] Update macOS pane search XCTest coverage for compact pane-local popover behavior in `apps/desktop/tests/ui/macos/PaneSearchUITests.swift`
- [ ] T086 [P] [US3] Update macOS time offset XCTest coverage for compact pane-local popover behavior in `apps/desktop/tests/ui/macos/TimeOffsetUITests.swift`

### Implementation for User Story 3

- [ ] T087 [US3] Tighten shared popover anchoring, Escape dismissal, and focus return support in `packages/ui/src/app-shell/Popover.tsx`
- [ ] T088 [US3] Align pane search popover compact content, controls, labels, and owner behavior in `packages/ui/src/search/PaneSearchPopover.tsx`
- [ ] T089 [US3] Align time offset popover compact content, remove the persistent Close button, and keep Apply validation in `packages/ui/src/sync/TimeOffsetPopover.tsx`
- [ ] T090 [US3] Wire pane find and offset trigger refs through the pane header for focus return in `packages/ui/src/log-pane/PaneHeader.tsx`
- [ ] T091 [US3] Keep pane search and time offset popovers owned by the invoking pane in `packages/ui/src/log-pane/LogPane.tsx`
- [ ] T092 [US3] Update popover positioning, compact dimensions, mode tags, count tags, and error styling in `packages/ui/src/app-shell/activity-rail-theme.css`
- [ ] T093 [US3] Run `bash scripts/macos/test.sh` and `bash scripts/macos/test-ui.sh` for US3 and record the result in `specs/003-macos-ui-design-alignment/validation-log.md`

**Checkpoint**: User Story 3 is independently functional and search/offset behavior remains pane-local.

---

## Phase 7: User Story 4 - Use the Same Product Across Themes and Platforms (Priority: P2)

**Goal**: Light/dark themes apply to the actual app UI and macOS, Windows, Linux, and Web shell variants render appropriate chrome while preserving shared product behavior.

**Independent Test**: Render the app in light and dark appearances and in macOS, Windows, Linux, and Web variants; verify chrome, colors, text contrast, unchanged shell regions, and unchanged product workflows.

### Tests for User Story 4 (MANDATORY)

- [ ] T094 [P] [US4] Add component tests for runtime/mockup/test light and dark presentation tokens applied to actual app surfaces in `packages/ui/tests/app-shell/theme-variants.test.tsx`
- [ ] T095 [P] [US4] Add component tests for macOS, Windows, Linux, and Web shell chrome variants in `packages/ui/tests/app-shell/platform-shell-variants.test.tsx`
- [ ] T096 [P] [US4] Update final shell accessibility tests for theme/platform variants and no-overlap contracts in `packages/ui/tests/app-shell/redesigned-shell-final-a11y.test.tsx`
- [ ] T097 [P] [US4] Update Web viewport UI tests for light/dark themes and Web no desktop radius/shadow in `apps/web/tests/ui/redesigned-shell-viewports.spec.ts`
- [ ] T098 [P] [US4] Add Web platform shell UI test for variant query overrides in `apps/web/tests/ui/platform-shell-variants.spec.ts`
- [ ] T099 [P] [US4] Update Desktop WDIO viewport UI tests for default platform shell variants on each OS in `apps/desktop/tests/ui/redesigned-shell-viewports.spec.ts`
- [ ] T100 [P] [US4] Add Desktop WDIO platform shell UI test for macOS/Windows/Linux presentation overrides in `apps/desktop/tests/ui/platform-shell-variants.spec.ts`
- [ ] T101 [P] [US4] Add macOS platform shell XCTest coverage for macOS chrome and shared product regions in `apps/desktop/tests/ui/macos/PlatformShellVariantUITests.swift`

### Implementation for User Story 4

- [ ] T102 [US4] Add light/dark theme token definitions and shell `data-theme` application in `packages/ui/src/app-shell/activity-rail-theme.css`
- [ ] T103 [US4] Add app shell theme variant resolution for runtime/mockup/test presentation input without a product-visible selector or new persisted UI preference storage in `packages/ui/src/app-shell/shellPresentation.ts`
- [ ] T104 [US4] Create platform chrome rendering for macOS, Windows, Linux, and Web variants in `packages/ui/src/app-shell/WindowChrome.tsx`
- [ ] T105 [US4] Integrate theme and platform chrome into the shared shell layout in `packages/ui/src/app-shell/ActivityRailShell.tsx`
- [ ] T106 [US4] Pass theme/platform presentation props from the shared app shell to shell layout in `packages/ui/src/app-shell/AppShell.tsx`
- [ ] T107 [US4] Wire Web app theme/platform mockup/test overrides without changing source capabilities or adding product UI selectors in `apps/web/src/App.tsx`
- [ ] T108 [US4] Wire Desktop app theme/platform mockup/test overrides without changing Tauri adapters or adding product UI selectors in `apps/desktop/src/App.tsx`
- [ ] T109 [US4] Run `bash scripts/macos/test.sh` and `bash scripts/macos/test-ui.sh` for US4 shared implementation and record the result in `specs/003-macos-ui-design-alignment/validation-log.md`; release-level OS-specific completion still depends on T119-T121 corresponding-OS UI evidence.

**Checkpoint**: User Story 4 is independently functional and product behavior is shared across variants.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final migration cleanup, documentation, and release-readiness validation across all stories.

- [ ] T110 Update the UI design implementation notes with completed alignment decisions in `docs/crosslog-ui-design.md`
- [ ] T111 [P] Update Web UI test helper documentation for the new selectors and variant overrides in `apps/web/tests/ui/helpers/redesigned-shell.ts`
- [ ] T112 [P] Update Desktop WDIO helper documentation for UI bridge actions and variant overrides in `apps/desktop/tests/ui/helpers/redesigned-shell.ts`
- [ ] T113 [P] Update macOS XCTest helper documentation for shell state assertions in `apps/desktop/tests/ui/macos/README.md`
- [ ] T114 Record the timed empty-workspace source-opening recognition review for SC-010 in `specs/003-macos-ui-design-alignment/validation-log.md`, including reviewer role, empty-workspace start condition, viewport/platform, 5-second result, and pass/fail outcome.
- [ ] T115 Run `bash scripts/macos/test.sh` and record the final automated gate in `specs/003-macos-ui-design-alignment/validation-log.md`
- [ ] T116 Run `bash scripts/macos/test-ui.sh` and record the final UI gate in `specs/003-macos-ui-design-alignment/validation-log.md`
- [ ] T117 Run `bash scripts/macos/perf.sh` after rendering/scrolling changes and record the result in `specs/003-macos-ui-design-alignment/validation-log.md`
- [ ] T118 Run `bash scripts/macos/build.sh` before release readiness and record the result in `specs/003-macos-ui-design-alignment/validation-log.md`
- [ ] T119 Verify GitHub Actions Windows automated/UI/build gates, including default Windows shell chrome evidence, and record links/results in `specs/003-macos-ui-design-alignment/validation-log.md`
- [ ] T120 Verify GitHub Actions macOS automated/UI/build gates and record links/results in `specs/003-macos-ui-design-alignment/validation-log.md`
- [ ] T121 Verify GitHub Actions Linux automated/UI/build gates, including default Linux shell chrome evidence, and record links/results in `specs/003-macos-ui-design-alignment/validation-log.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user story phases.
- **US1 (Phase 3, P1)**: Depends on Foundational; establishes shell cleanup and obsolete-control removal.
- **US2 (Phase 4, P1)**: Depends on Foundational; can run after US1 tests exist, but final validation should include US1 because topbar add-pane behavior is shared.
- **US5 (Phase 5, P1)**: Depends on Foundational; should be refreshed after US1 and US2 because it validates preserved MVP behavior through changed selectors.
- **US3 (Phase 6, P2)**: Depends on Foundational and benefits from US2 pane header/workspace alignment.
- **US4 (Phase 7, P2)**: Depends on Foundational; can proceed in parallel with US3 after shared shell presentation state exists.
- **Polish (Phase 8)**: Depends on all selected user stories.

### User Story Dependencies

- **US1**: Independent P1 shell alignment and obsolete-control removal.
- **US2**: Independent P1 pane workspace/header alignment; shares add-pane behavior with US1.
- **US5**: Independent P1 regression-preservation story; validates unchanged MVP behavior after selector migration.
- **US3**: Independent P2 popover alignment; depends on pane-local ownership from existing `LogPane`.
- **US4**: Independent P2 theme/platform alignment; uses shared shell presentation state.

### Within Each User Story

- Write or update tests first and verify they fail against the current implementation where the gap is real.
- Implement shared UI changes before Web/Desktop shell-specific test migrations.
- Preserve existing core/platform expected results unless an approved requirement changes.
- Complete each story's local gate before moving to the next priority story.

## Parallel Opportunities

- Setup helper tasks T003-T006 can run in parallel after T002.
- Foundational tests T015-T016 can run in parallel after T008-T014 are drafted.
- US1 tests T019-T027 can be updated in parallel before implementation tasks T028-T037.
- US2 tests T039-T050 can be updated in parallel; implementation tasks T051-T055 are sequential because layout data flows through helpers, workspace, rail, and resizer.
- US5 tests T061-T070 can be updated in parallel because they touch different UI suites.
- US3 tests T077-T086 can be updated in parallel; implementation tasks T087-T092 are sequential because popover focus and anchoring behavior share contracts.
- US4 tests T094-T101 can be updated in parallel; implementation tasks T102-T108 are mostly sequential because theme/platform props flow from shell presentation into app shells.
- Polish documentation tasks T111-T113 can run in parallel.

## Parallel Example: User Story 1

```text
Task: "T019 [P] [US1] Add component tests for obsolete-control absence, activity rail order/sizing, Files MVP-only behavior, future rail unavailability, and Directory Search left-panel guardrails in packages/ui/tests/app-shell/obsolete-controls.test.tsx and packages/ui/tests/app-shell/activity-rail-future-actions.test.tsx"
Task: "T023 [P] [US1] Add empty workspace layout and drag-over no-shift component coverage in packages/ui/tests/app-shell/empty-workspace.test.tsx"
Task: "T024 [P] [US1] Update Web shell UI tests from Open logs and Split active pane to target controls in apps/web/tests/ui/multi-pane-layout.spec.ts"
Task: "T027 [P] [US1] Update macOS empty-state XCTest coverage for target empty workspace and obsolete-control absence in apps/desktop/tests/ui/macos/EmptyStateUITests.swift"
```

## Parallel Example: User Story 2

```text
Task: "T039 [P] [US2] Update pane rail component tests from plus/minus resize clicks to drag-boundary resize behavior in packages/ui/tests/pane-rail/pane-layout.test.tsx"
Task: "T040 [P] [US2] Add component tests for rightmost-pane alignment, overflow-only workspace scroll, and desired-width persistence in packages/ui/tests/pane-rail/pane-workspace-alignment.test.tsx"
Task: "T046 [P] [US2] Update Web directory navigation UI test for aligned directory headers and no-overlap behavior in apps/web/tests/ui/directory-navigation.spec.ts"
Task: "T050 [P] [US2] Update macOS directory navigation XCTest coverage for aligned headers in apps/desktop/tests/ui/macos/DirectoryNavigationUITests.swift"
```

## Parallel Example: User Story 5

```text
Task: "T061 [P] [US5] Update Web session restore UI test for aligned shell selectors and preserved pane/session outcomes in apps/web/tests/ui/session-restore.spec.ts"
Task: "T065 [P] [US5] Update Desktop live file update UI test to use UI bridge actions instead of visible lifecycle buttons in apps/desktop/tests/ui/live-file-updates.spec.ts"
Task: "T067 [P] [US5] Update Web log text copy UI test to verify selection/context-menu/keyboard copy without permanent toolbar UI in apps/web/tests/ui/log-text-copy.spec.ts"
Task: "T070 [P] [US5] Add final test reuse audit updates for reused, selector-updated, activity rail/Files guardrail, Directory Search guardrail, and newly added coverage in specs/003-macos-ui-design-alignment/test-reuse-audit.md"
```

## Parallel Example: User Story 3

```text
Task: "T077 [P] [US3] Update pane search popover component tests for compact layout, Escape handling, focus return, and mode controls in packages/ui/tests/search/pane-search-popover.test.tsx"
Task: "T078 [P] [US3] Update time offset popover component tests for compact layout, no persistent Close button, Escape handling, focus return, and Apply-only action in packages/ui/tests/sync/time-offset-popover.test.tsx"
Task: "T081 [P] [US3] Update Web pane search UI test for compact pane-local popover behavior in apps/web/tests/ui/log-search.spec.ts"
Task: "T086 [P] [US3] Update macOS time offset XCTest coverage for compact pane-local popover behavior in apps/desktop/tests/ui/macos/TimeOffsetUITests.swift"
```

## Parallel Example: User Story 4

```text
Task: "T094 [P] [US4] Add component tests for light and dark tokens applied to actual app surfaces in packages/ui/tests/app-shell/theme-variants.test.tsx"
Task: "T095 [P] [US4] Add component tests for macOS, Windows, Linux, and Web shell chrome variants in packages/ui/tests/app-shell/platform-shell-variants.test.tsx"
Task: "T098 [P] [US4] Add Web platform shell UI test for variant query overrides in apps/web/tests/ui/platform-shell-variants.spec.ts"
Task: "T099 [P] [US4] Update Desktop WDIO viewport UI tests for default platform shell variants on each OS in apps/desktop/tests/ui/redesigned-shell-viewports.spec.ts"
```

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1) to remove obsolete shell controls and align the empty workspace.
3. Validate US1 independently with `bash scripts/macos/test.sh` and `bash scripts/macos/test-ui.sh`.
4. Complete Phase 4 (US2) because pane workspace alignment and rightmost-pane behavior are P1 acceptance criteria.
5. Complete Phase 5 (US5) to prove preserved MVP behavior before moving to P2 polish.

### Incremental Delivery

1. Setup + Foundational -> shared selectors, presentation state, and test bridge ready.
2. US1 -> aligned shell without obsolete controls.
3. US2 -> aligned pane workspace and headers.
4. US5 -> prior MVP behavior still passes with migrated tests.
5. US3 -> compact pane-local popovers.
6. US4 -> actual light/dark themes and platform chrome variants.
7. Polish -> local macOS gates and GitHub Actions Windows/macOS/Linux validation.

Resolved checklist/analyze findings A1, I1, and C1 are treated as documentation
alignment prerequisites before Phase 1 implementation. They do not block
implementation after spec, plan, task, contract, quickstart, and checklist
artifacts agree on theme scope, OS-specific evidence, and timed review evidence.

### Non-Goals During Implementation

- Do not add filtering, configurable highlighting, bookmarks, saved filter sets, recursive directory search, SSH, file-manager behavior, parser rewrites, backend services, UI kits, or platform adapter rewrites.
- Do not change existing expected results for unchanged core/platform/integration/performance behavior.
- Do not leave test-only controls visible in product UI.
