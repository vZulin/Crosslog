# Tasks: Crosslog Activity Rail Redesign

**Input**: Design documents from `/Users/Vladimir.Zulin/projects/idea/Crosslog/specs/002-redesign-activity-rail/`  
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Tests are mandatory for this feature. The specification requires UI tests for every user story, and the plan requires local macOS validation plus GitHub Actions validation for Windows, macOS, and Linux UI/E2E gates.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other marked tasks in the same phase because it touches different files or depends only on completed earlier phases.
- **[Story]**: Required only for user story phases.
- Every task includes an exact file path.

## Phase 1: Setup (Shared Planning and Test Scaffolding)

**Purpose**: Capture the Figma audit and create reusable test scaffolding before implementation starts.

- [X] T001 [P] Create the Figma audit artifact for node `11:3` in `specs/002-redesign-activity-rail/figma-audit.md`
- [X] T002 [P] Create the UI test reuse and migration matrix in `specs/002-redesign-activity-rail/test-reuse-audit.md`
- [X] T003 [P] Record the final local-SVG icon strategy and rejected dependency alternatives in `specs/002-redesign-activity-rail/icon-strategy.md`
- [X] T004 [P] Add shared shell render helpers for component tests in `packages/ui/tests/app-shell/renderRedesignedShell.tsx`
- [X] T005 [P] Add redesigned shell Playwright helpers in `apps/web/tests/ui/helpers/redesigned-shell.ts`
- [X] T006 [P] Add redesigned shell WebdriverIO helpers in `apps/desktop/tests/ui/helpers/redesigned-shell.ts`
- [X] T007 [P] Add redesigned shell XCTest assertion helpers in `apps/desktop/tests/ui/macos/RedesignedShellAssertions.swift`
- [X] T008 [P] Add shared UI selector constants in `packages/ui/src/app-shell/testIds.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the redesigned shell primitives and cross-OS test gates that all user stories depend on.

**CRITICAL**: No user story implementation should start until this phase is complete.

- [X] T009 Create design token CSS for the Activity Rail shell in `packages/ui/src/app-shell/activity-rail-theme.css`
- [X] T010 [P] Implement reviewed local SVG icon components in `packages/ui/src/app-shell/icons.tsx`
- [X] T011 [P] Implement the reusable icon button primitive with accessible labels in `packages/ui/src/app-shell/IconButton.tsx`
- [X] T012 [P] Implement the base popover primitive used by search and offset editors in `packages/ui/src/app-shell/Popover.tsx`
- [X] T013 [P] Define activity rail item state and future-action guard helpers in `packages/ui/src/app-shell/activityRailItems.ts`
- [X] T014 Implement the top-level shell layout component in `packages/ui/src/app-shell/ActivityRailShell.tsx`
- [X] T015 Export redesigned shell primitives from `packages/ui/src/index.ts`
- [X] T016 Update macOS Desktop UI execution so `corepack pnpm test:ui:desktop` and `bash scripts/macos/test-ui.sh` run a real XCTest/Accessibility harness through `scripts/run-desktop-ui-tests.mjs`
- [X] T017 Update the GitHub Actions workflow with Windows/macOS/Linux UI/E2E matrix jobs in `.github/workflows/ci.yml`
- [X] T018 [P] Add CI-specific Linux UI prerequisites for Desktop UI tests in `.github/workflows/ci.yml`
- [X] T019 [P] Add shell accessibility component tests for icon-only controls in `packages/ui/tests/app-shell/icon-button-accessibility.test.tsx`
- [X] T020 [P] Add future Activity Rail guard tests in `packages/ui/tests/app-shell/activity-rail-future-actions.test.tsx`
- [X] T021 Run the local foundational automated gate with `bash scripts/macos/test.sh`

**Checkpoint**: Redesigned shell primitives and OS UI/E2E gates are ready for story work.

---

## Phase 3: User Story 1 - Work in the Redesigned Multi-Log Workspace (Priority: P1) MVP

**Goal**: Users can open multiple log sources in the redesigned workspace with topbar, activity rail, pane workspace, horizontal workspace scrolling, pane controls, and status bar.

**Independent Test**: Open one file source and two directory sources, verify redesigned regions, add/split/close/resize panes, scroll the workspace horizontally, and confirm the status bar updates.

### Tests for User Story 1

- [X] T022 [P] [US1] Add component tests for topbar, activity rail, pane workspace, and status bar regions in `packages/ui/tests/app-shell/redesigned-workspace.test.tsx`
- [X] T023 [P] [US1] Update Web multi-pane UI test for redesigned shell regions in `apps/web/tests/ui/multi-pane-layout.spec.ts`
- [X] T024 [P] [US1] Update Desktop WDIO multi-pane UI test for redesigned shell regions in `apps/desktop/tests/ui/multi-pane-layout.spec.ts`
- [X] T025 [P] [US1] Update macOS multi-pane UI test for redesigned shell regions in `apps/desktop/tests/ui/macos/MultiPaneLayoutUITests.swift`
- [X] T026 [P] [US1] Add responsive no-overlap shell test for long labels in `packages/ui/tests/app-shell/redesigned-shell-responsive.test.tsx`

### Implementation for User Story 1

- [X] T027 [US1] Implement the topbar command field, sync button slot, and add-pane button slot in `packages/ui/src/app-shell/Topbar.tsx`
- [X] T028 [US1] Implement the activity rail with MVP and future-unavailable actions in `packages/ui/src/app-shell/ActivityRail.tsx`
- [X] T029 [US1] Implement the redesigned status bar summary in `packages/ui/src/app-shell/StatusBar.tsx`
- [X] T030 [US1] Implement the redesigned pane workspace container and workspace scrollbar in `packages/ui/src/pane-rail/PaneWorkspace.tsx`
- [X] T031 [US1] Update pane rail rendering to use the redesigned pane workspace in `packages/ui/src/pane-rail/PaneRail.tsx`
- [X] T032 [US1] Update `AppShell` to compose the redesigned topbar, activity rail, pane workspace, and status bar in `packages/ui/src/app-shell/AppShell.tsx`
- [X] T033 [US1] Update empty workspace layout to keep the central open action inside the redesigned shell in `packages/ui/src/app-shell/AppShell.tsx`
- [X] T034 [US1] Update Web shell CSS import or root class wiring for the redesigned shell in `apps/web/src/App.tsx`
- [X] T035 [US1] Update Desktop shell CSS import or root class wiring for the redesigned shell in `apps/desktop/src/App.tsx`
- [X] T036 [US1] Run the local US1 gate with `bash scripts/macos/test.sh`
- [X] T037 [US1] Run the local US1 UI gate with `bash scripts/macos/test-ui.sh`

**Checkpoint**: User Story 1 is independently functional and demoable.

---

## Phase 4: User Story 2 - Synchronize Logs by Time in the New Shell (Priority: P1)

**Goal**: Users can see and control synchronization from the redesigned topbar while active pane and sync state remain visible in the workspace and status bar.

**Independent Test**: Open timestamped logs, confirm sync is enabled, move the active pane, verify synchronized target movement, disable sync, and verify independent scrolling.

### Tests for User Story 2

- [X] T038 [P] [US2] Add component tests for topbar sync state and active-pane status summary in `packages/ui/tests/sync/redesigned-sync-controls.test.tsx`
- [X] T039 [P] [US2] Update Web synchronized scrolling UI test for topbar sync control in `apps/web/tests/ui/synchronized-scrolling.spec.ts`
- [X] T040 [P] [US2] Update Desktop WDIO synchronized scrolling UI test for topbar sync control in `apps/desktop/tests/ui/synchronized-scrolling.spec.ts`
- [X] T041 [P] [US2] Update macOS synchronized scrolling UI test for topbar sync control in `apps/desktop/tests/ui/macos/SynchronizedScrollingUITests.swift`

### Implementation for User Story 2

- [X] T042 [US2] Wire topbar synchronization state to the existing synchronization store in `packages/ui/src/app-shell/Topbar.tsx`
- [X] T043 [US2] Add active pane visual and accessibility state to pane headers in `packages/ui/src/log-pane/PaneHeader.tsx`
- [X] T044 [US2] Update status bar synchronization and active source summary wiring in `packages/ui/src/app-shell/StatusBar.tsx`
- [X] T045 [US2] Update `AppShell` active-pane and sync summary props for the redesigned status bar in `packages/ui/src/app-shell/AppShell.tsx`
- [X] T046 [US2] Preserve untimed-pane exclusion messaging in the redesigned topbar or status region in `packages/ui/src/app-shell/AppShell.tsx`
- [X] T047 [US2] Run the local US2 gate with `bash scripts/macos/test.sh`
- [X] T048 [US2] Run the local US2 UI gate with `bash scripts/macos/test-ui.sh`

**Checkpoint**: User Story 2 is independently functional and does not regress User Story 1.

---

## Phase 5: User Story 3 - Search Within a Pane from the Activity Rail or Pane Header (Priority: P2)

**Goal**: Users can open pane search from the redesigned pane header, activity rail, or command field and use text, regex, case-sensitive, previous/next, and match-count controls.

**Independent Test**: Open a log, open pane search, search outside the viewport, navigate matches, toggle regex and case sensitivity, and verify search state remains per-pane.

### Tests for User Story 3

- [X] T049 [P] [US3] Add component tests for the redesigned pane search popover in `packages/ui/tests/search/pane-search-popover.test.tsx`
- [X] T050 [P] [US3] Add component tests for activity rail and command-field search focus in `packages/ui/tests/app-shell/search-entry-points.test.tsx`
- [X] T051 [P] [US3] Update Web pane search UI test for popover behavior in `apps/web/tests/ui/log-search.spec.ts`
- [X] T052 [P] [US3] Update Desktop WDIO pane search UI test for popover behavior in `apps/desktop/tests/ui/log-search.spec.ts`
- [X] T053 [P] [US3] Add macOS pane search UI test for popover behavior in `apps/desktop/tests/ui/macos/PaneSearchUITests.swift`

### Implementation for User Story 3

- [X] T054 [US3] Implement the redesigned pane search popover in `packages/ui/src/search/PaneSearchPopover.tsx`
- [X] T055 [US3] Replace inline pane search controls with pane-header search action wiring in `packages/ui/src/log-pane/LogPane.tsx`
- [X] T056 [US3] Add pane-header search action and popover anchor state in `packages/ui/src/log-pane/PaneHeader.tsx`
- [X] T057 [US3] Wire activity rail search action to focus the active pane search in `packages/ui/src/app-shell/ActivityRail.tsx`
- [X] T058 [US3] Wire command field search action to focus the active pane search in `packages/ui/src/app-shell/Topbar.tsx`
- [X] T059 [US3] Export the redesigned search popover from `packages/ui/src/index.ts`
- [X] T060 [US3] Run the local US3 gate with `bash scripts/macos/test.sh`
- [X] T061 [US3] Run the local US3 UI gate with `bash scripts/macos/test-ui.sh`

**Checkpoint**: User Story 3 is independently functional and search behavior remains per-pane.

---

## Phase 6: User Story 4 - Navigate Directory Sources from Pane Headers (Priority: P2)

**Goal**: Users can see directory and selected-file labels in redesigned pane headers and navigate previous/next directory files without losing MVP directory semantics.

**Independent Test**: Open a directory, verify newest file selection, navigate previous/next, add a newer file, and verify current selection remains stable while navigation availability updates.

### Tests for User Story 4

- [X] T062 [P] [US4] Add component tests for redesigned directory pane headers in `packages/ui/tests/log-pane/directory-pane-header.test.tsx`
- [X] T063 [P] [US4] Update Web directory navigation UI test for redesigned pane headers in `apps/web/tests/ui/directory-navigation.spec.ts`
- [X] T064 [P] [US4] Update Desktop WDIO directory navigation UI test for redesigned pane headers in `apps/desktop/tests/ui/directory-navigation.spec.ts`
- [X] T065 [P] [US4] Add macOS directory navigation UI test for redesigned pane headers in `apps/desktop/tests/ui/macos/DirectoryNavigationUITests.swift`
- [X] T066 [P] [US4] Update empty-directory UI tests for redesigned pane headers in `apps/web/tests/ui/empty-directory.spec.ts`
- [X] T067 [P] [US4] Update Desktop empty-directory UI tests for redesigned pane headers in `apps/desktop/tests/ui/empty-directory.spec.ts`

### Implementation for User Story 4

- [X] T068 [US4] Redesign directory title and selected-file rendering in `packages/ui/src/log-pane/PaneHeader.tsx`
- [X] T069 [US4] Redesign previous/next directory controls as icon buttons in `packages/ui/src/log-pane/DirectoryNavigator.tsx`
- [X] T070 [US4] Preserve empty-directory status inside the redesigned pane header area in `packages/ui/src/log-pane/EmptyDirectoryStatus.tsx`
- [X] T071 [US4] Update pane header truncation behavior for long directory and file names in `packages/ui/src/log-pane/PaneHeader.tsx`
- [X] T072 [US4] Run the local US4 gate with `bash scripts/macos/test.sh`
- [X] T073 [US4] Run the local US4 UI gate with `bash scripts/macos/test-ui.sh`

**Checkpoint**: User Story 4 is independently functional and directory behavior remains requirement-driven.

---

## Phase 7: User Story 5 - Configure Per-Pane Time Offset (Priority: P2)

**Goal**: Users can open a pane-specific Time Offset popover, edit days/hours/minutes/seconds/milliseconds, apply valid values, reject invalid values, and see the offset tag update.

**Independent Test**: Open two timestamped logs, set a non-zero offset for one pane, verify the tag updates, and confirm synchronization applies only that pane's offset.

### Tests for User Story 5

- [X] T074 [P] [US5] Add component tests for the Time Offset popover apply and invalid-input behavior in `packages/ui/tests/sync/time-offset-popover.test.tsx`
- [X] T075 [P] [US5] Add shared time-offset formatting tests for header tags in `packages/core/tests/sync/time-offset-format.test.ts`
- [X] T076 [P] [US5] Add Web UI test for time offset popover behavior in `apps/web/tests/ui/time-offset-popover.spec.ts`
- [X] T077 [P] [US5] Add Desktop WDIO UI test for time offset popover behavior in `apps/desktop/tests/ui/time-offset-popover.spec.ts`
- [X] T078 [P] [US5] Add macOS UI test for time offset popover behavior in `apps/desktop/tests/ui/macos/TimeOffsetUITests.swift`

### Implementation for User Story 5

- [X] T079 [US5] Add reusable offset formatting helper in `packages/core/src/sync/time-offset.ts`
- [X] T080 [US5] Implement the redesigned Time Offset popover with draft/apply validation in `packages/ui/src/sync/TimeOffsetPopover.tsx`
- [X] T081 [US5] Replace inline time offset editor with pane-header offset tag and popover wiring in `packages/ui/src/log-pane/LogPane.tsx`
- [X] T082 [US5] Add pane-header offset tag rendering and popover anchor state in `packages/ui/src/log-pane/PaneHeader.tsx`
- [X] T083 [US5] Preserve per-pane offset store updates from the redesigned popover in `packages/ui/src/app-shell/AppShell.tsx`
- [X] T084 [US5] Run the local US5 gate with `bash scripts/macos/test.sh`
- [X] T085 [US5] Run the local US5 UI gate with `bash scripts/macos/test-ui.sh`

**Checkpoint**: User Story 5 is independently functional and offset behavior remains per-pane.

---

## Phase 8: User Story 6 - Follow Active Logs and Preserve Context (Priority: P2)

**Goal**: Users can see live, deleted, replacement, and pane-local error states in the redesigned pane header while live updates and loaded-content retention continue to work.

**Independent Test**: Open a live file, append lines, delete the file, replace it, and verify live indicators, deleted status, retained content, search availability, and unaffected unrelated panes.

### Tests for User Story 6

- [X] T086 [P] [US6] Add component tests for live/deleted/replaced indicators in `packages/ui/tests/log-pane/pane-lifecycle-header.test.tsx`
- [X] T087 [P] [US6] Update Web live-update or unsupported-monitoring UI tests for redesigned indicators in `apps/web/tests/ui/unsupported-monitoring.spec.ts`
- [X] T088 [P] [US6] Update Desktop WDIO live file update UI tests for redesigned indicators in `apps/desktop/tests/ui/live-file-updates.spec.ts`
- [X] T089 [P] [US6] Add macOS live file state UI test for redesigned indicators in `apps/desktop/tests/ui/macos/LiveFileStateUITests.swift`
- [X] T090 [P] [US6] Update log text copy UI tests to use redesigned pane regions in `apps/web/tests/ui/log-text-copy.spec.ts`
- [X] T091 [P] [US6] Update Desktop log text copy UI tests to use redesigned pane regions in `apps/desktop/tests/ui/log-text-copy.spec.ts`

### Implementation for User Story 6

- [X] T092 [US6] Add live/deleted/replaced/status indicator rendering to pane headers in `packages/ui/src/log-pane/PaneHeader.tsx`
- [X] T093 [US6] Redesign deleted-file status presentation without hiding loaded content in `packages/ui/src/log-pane/DeletedFileStatus.tsx`
- [X] T094 [US6] Preserve lifecycle event handling with redesigned header status props in `packages/ui/src/log-pane/useFileLifecycleEvents.ts`
- [X] T095 [US6] Preserve log text selection and context menu behavior inside redesigned pane workspace in `packages/ui/src/log-pane/LogTextSelection.tsx`
- [X] T096 [US6] Update inert log row rendering styles without using HTML injection in `packages/ui/src/log-pane/VirtualLogViewport.tsx`
- [X] T097 [US6] Run the local US6 gate with `bash scripts/macos/test.sh`
- [X] T098 [US6] Run the local US6 UI gate with `bash scripts/macos/test-ui.sh`

**Checkpoint**: User Story 6 is independently functional and live/error states remain pane-local.

---

## Phase 9: User Story 7 - Restore and Use the Redesigned Experience Across Supported Platforms (Priority: P3)

**Goal**: Users can restart Crosslog and recover the redesigned workspace layout, while Web and Desktop capability boundaries remain explicit on supported platforms.

**Independent Test**: Create a multi-pane session, restart the app, verify restored sources, pane order, sizes, selected directory file, shell layout, status bar summary, no scroll restoration, and browser capability limitations.

### Tests for User Story 7

- [X] T099 [P] [US7] Update Web session restore UI test for redesigned shell restore assertions in `apps/web/tests/ui/session-restore.spec.ts`
- [X] T100 [P] [US7] Update Desktop WDIO session restore UI test for redesigned shell restore assertions in `apps/desktop/tests/ui/session-restore.spec.ts`
- [X] T101 [P] [US7] Add macOS session restore UI test for redesigned shell restore assertions in `apps/desktop/tests/ui/macos/SessionRestoreUITests.swift`
- [X] T102 [P] [US7] Update Web browser capability UI test for redesigned shell messaging in `apps/web/tests/ui/browser-capabilities.spec.ts`
- [X] T103 [P] [US7] Update browser drag/drop UI test for redesigned empty shell in `apps/web/tests/ui/browser-drag-drop.spec.ts`
- [X] T104 [P] [US7] Update manual encoding UI tests for redesigned shell regions in `apps/web/tests/ui/manual-encoding.spec.ts`
- [X] T105 [P] [US7] Update Desktop manual encoding UI tests for redesigned shell regions in `apps/desktop/tests/ui/manual-encoding.spec.ts`

### Implementation for User Story 7

- [X] T106 [US7] Preserve redesigned shell restoration around restored panes in `packages/ui/src/session/useSessionRestore.ts`
- [X] T107 [US7] Preserve restored pane order, pane sizes, directory selections, sync state, and offsets in `packages/ui/src/app-shell/AppShell.tsx`
- [X] T108 [US7] Redesign capability limitation messaging inside the Activity Rail shell in `packages/ui/src/app-shell/CapabilityLimitations.tsx`
- [X] T109 [US7] Ensure browser drag/drop and file input entry points remain available in the redesigned empty shell in `packages/ui/src/app-shell/AppShell.tsx`
- [X] T110 [US7] Run the local US7 gate with `bash scripts/macos/test.sh`
- [X] T111 [US7] Run the local US7 UI gate with `bash scripts/macos/test-ui.sh`

**Checkpoint**: User Story 7 is independently functional across supported Web/Desktop capability boundaries.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Finalize visual quality, accessibility, CI/CD, performance, and release-readiness validation across all stories.

- [ ] T112 [P] Update redesign implementation notes and local validation instructions in `specs/002-redesign-activity-rail/quickstart.md`
- [ ] T113 [P] Update project-level generated guidance after final task changes in `AGENTS.md`
- [ ] T114 [P] Add usability walkthrough protocol for identifying active pane, pane count, synchronization state, and active source in `specs/002-redesign-activity-rail/usability-walkthrough.md`
- [ ] T115 [P] Add final accessibility and no-overlap assertions for supported viewport sizes in `packages/ui/tests/app-shell/redesigned-shell-final-a11y.test.tsx`
- [ ] T116 [P] Add Web UI viewport coverage for desktop-width and narrow-width redesigned shell in `apps/web/tests/ui/redesigned-shell-viewports.spec.ts`
- [ ] T117 [P] Add Desktop WDIO viewport coverage for redesigned shell in `apps/desktop/tests/ui/redesigned-shell-viewports.spec.ts`
- [ ] T118 [P] Add macOS viewport/accessibility coverage for redesigned shell in `apps/desktop/tests/ui/macos/RedesignedShellViewportUITests.swift`
- [ ] T119 Verify read-only and inert-content safety after UI changes with `bash scripts/macos/test.sh`
- [ ] T120 Run local Web/Desktop UI validation on the current OS with `bash scripts/macos/test-ui.sh`
- [ ] T121 Define and record performance reference fixtures and measured-run methodology in `specs/002-redesign-activity-rail/quickstart.md`
- [ ] T122 Run local performance validation after rendering changes with `bash scripts/macos/perf.sh`
- [ ] T123 Run local build validation with `bash scripts/macos/build.sh`
- [ ] T124 Push the branch and verify GitHub Actions Windows/macOS/Linux automated and UI/E2E jobs defined in `.github/workflows/ci.yml`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: No dependencies.
- **Phase 2 Foundational**: Depends on Phase 1; blocks all user stories.
- **US1 and US2 (P1)**: Depend on Phase 2. US1 is the first demoable redesigned workspace slice; US2 completes the P1 synchronization slice.
- **US3, US4, US5, US6 (P2)**: Depend on Phase 2 and can proceed after US1 shell regions exist. They remain independently testable.
- **US7 (P3)**: Depends on Phase 2 and benefits from US1 shell regions; it remains independently testable through restore/capability flows.
- **Phase 10 Polish**: Depends on all desired story phases.

### User Story Dependencies

- **US1**: No story dependency after Phase 2.
- **US2**: Can start after Phase 2, but final status bar assertions use US1 shell regions.
- **US3**: Can start after Phase 2, but pane search entry points use US1 shell regions.
- **US4**: Can start after Phase 2, but header layout uses US1 pane shell.
- **US5**: Can start after Phase 2, but offset tag placement uses US1 pane header shell.
- **US6**: Can start after Phase 2, but lifecycle indicators use US1 pane header shell.
- **US7**: Can start after Phase 2, but restore assertions use US1 shell regions.

### Within Each User Story

- Tests are written first and should fail against the old UI where relevant.
- Shared UI component tests come before Web/Desktop UI tests when they define selector contracts.
- UI implementation comes before shell wiring.
- Web and Desktop shell wiring should remain thin and reuse `packages/ui`.
- Local macOS automated and UI gates close each story phase.

## Parallel Opportunities

- Setup tasks T001-T008 can run in parallel.
- Foundational tasks T010-T013 and T018-T020 can run in parallel after T009 decisions are available.
- User-story test tasks marked `[P]` can run in parallel before implementation in the same story.
- Web, Desktop WDIO, and macOS XCTest UI tests for a story can be updated in parallel.
- US3, US4, US5, and US6 can proceed in parallel after the foundational shell and US1 pane workspace contracts are stable.

## Parallel Example: User Story 1

```text
Task: "T022 Add component tests for topbar, activity rail, pane workspace, and status bar regions in packages/ui/tests/app-shell/redesigned-workspace.test.tsx"
Task: "T023 Update Web multi-pane UI test for redesigned shell regions in apps/web/tests/ui/multi-pane-layout.spec.ts"
Task: "T024 Update Desktop WDIO multi-pane UI test for redesigned shell regions in apps/desktop/tests/ui/multi-pane-layout.spec.ts"
Task: "T025 Update macOS multi-pane UI test for redesigned shell regions in apps/desktop/tests/ui/macos/MultiPaneLayoutUITests.swift"
Task: "T026 Add responsive no-overlap shell test for long labels in packages/ui/tests/app-shell/redesigned-shell-responsive.test.tsx"
```

## Parallel Example: User Story 3

```text
Task: "T049 Add component tests for the redesigned pane search popover in packages/ui/tests/search/pane-search-popover.test.tsx"
Task: "T051 Update Web pane search UI test for popover behavior in apps/web/tests/ui/log-search.spec.ts"
Task: "T052 Update Desktop WDIO pane search UI test for popover behavior in apps/desktop/tests/ui/log-search.spec.ts"
Task: "T053 Add macOS pane search UI test for popover behavior in apps/desktop/tests/ui/macos/PaneSearchUITests.swift"
```

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete US1 to make the redesigned workspace usable and demoable.
3. Complete US2 to restore the full P1 synchronized multi-log analysis value.
4. Stop and validate with local macOS automated and UI gates.

### Incremental Delivery

1. US1: redesigned workspace shell and pane management.
2. US2: synchronization visibility and control in the redesigned shell.
3. US3: pane search popover and search entry points.
4. US4: redesigned directory pane headers and navigation.
5. US5: time offset popover.
6. US6: live/deleted/replacement state in the redesigned shell.
7. US7: restore and platform capability parity.
8. Phase 10: polish, performance, accessibility, and GitHub Actions release gate.

### Release Readiness

Release readiness requires local macOS validation and green GitHub Actions jobs for Windows, macOS, and Linux automated plus UI/E2E gates.
