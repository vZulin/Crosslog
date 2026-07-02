---

description: "Task list for Crosslog Bug Batch 2 Stabilization"
---

# Tasks: Crosslog Bug Batch 2 Stabilization

**Input**: Design documents from `/Users/Vladimir.Zulin/projects/idea/Crosslog/specs/005-stabilize-bug-batch-2/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Test tasks ARE included — the spec mandates auditing, updating, and
adding automated and UI/E2E coverage (FR-020…FR-024, CR-006). For each bug, the
test is updated/added to the authoritative expected result BEFORE the fix, so it
fails first and passes after the fix.

**Organization**: Tasks are grouped by user story. Each story maps to one or more
numbered bugs in `docs/Bugs_2.txt` and is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1–US4 from spec.md
- Paths are repo-relative to `/Users/Vladimir.Zulin/projects/idea/Crosslog`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare a clean, reproducible baseline before any fix.

- [X] T001 Install dependencies from a clean state: `corepack enable && corepack pnpm install --frozen-lockfile`
- [X] T002 [P] Capture the current baseline by running `bash scripts/macos/test.sh` and `bash scripts/macos/test-ui.sh web` and `bash scripts/macos/test-ui.sh desktop`; record which tests pass now so regressions are detectable (baseline recorded in research.md "Baseline captured (Phase 1)")
- [X] T003 [P] Audit existing tests against `specs/005-stabilize-bug-batch-2/plan.md` Test Inventory; confirm the exact list of tests to keep, update, and add (all 42 referenced test/source paths verified to exist)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Regression triage that informs the Desktop/Tauri fixes.

**⚠️ CRITICAL**: Complete before starting the regression bugs (2, 3, 5) in US1/US2.

- [X] T004 Reproduce bugs 2, 3, and 5 on the current Desktop build and record root cause (Desktop picker capability/wiring, missing native drag-drop event path, viewport offset/transform) in `specs/005-stabilize-bug-batch-2/research.md`

**Checkpoint**: Root causes confirmed — user story implementation can begin.

---

## Phase 3: User Story 1 - Open User-Selected Files And Directories On Desktop And Web (Priority: P1) 🎯 MVP

**Goal**: Desktop opens the native picker and accepts drag-and-drop; Web opens both files and directories (bugs 2, 3, 4).

**Independent Test**: On Desktop, activate add-pane/open-source → picker opens; select a file and a directory → panes open; cancel → nothing changes; drag a file and a directory onto the window → each opens. On Web, open both a file and a directory.

### Tests for User Story 1 (write/update first, ensure they fail)

- [X] T005 [P] [US1] Update `packages/platform/tests/tauri/tauri-source-picker.test.ts` to assert the picker opens and returns the selected file/directory or cancels cleanly (bug 2)
- [X] T006 [P] [US1] Update `packages/platform/tests/tauri/tauri-drag-drop-source.test.ts` to expect native Tauri drop-payload mapping instead of DOM `DragEvent.dataTransfer` (bug 3)
- [X] T007 [P] [US1] Update `packages/platform/tests/browser/browser-source-picker.test.ts`, `packages/platform/tests/browser/browser-directory-access.test.ts`, and `tests/integration/directory-access.contract.test.ts` to assert Web directory selection/opening (bug 4)
- [X] T008 [P] [US1] Extend `apps/desktop/tests/ui/source-loading.spec.ts` for Desktop picker open/cancel/selected-file/selected-directory (bug 2)
- [X] T009 [P] [US1] Add Desktop drag-drop coverage in two modes (FR-028, bug 3): (a) automatable WDIO/unit coverage under `apps/desktop/tests/ui/` that runs by default, and (b) a manual/interactive runner script (e.g. `scripts/macos/test-ui-manual.sh`) that auto-launches the Desktop app, prints the ordered tester actions for the native file/directory drop, and waits for pass/fail confirmation; the manual runner is opt-in and never runs in CI or default gates
- [X] T010 [P] [US1] Extend `apps/web/tests/ui/directory-navigation.spec.ts` and `apps/web/tests/ui/browser-capabilities.spec.ts` for Web directory opening and capability reporting (bug 4)

### Implementation for User Story 1

- [X] T011 [US1] Fix the Desktop picker: verify/enable the dialog capability in `apps/desktop/src-tauri/tauri.conf.json` and `apps/desktop/src-tauri/gen/schemas/capabilities.json`, and repair the wiring from `packages/platform/src/tauri/tauri-source-picker.ts` through `apps/desktop/src/platform/createDesktopPlatform.ts` to the `AppShell` add-pane handlers (bug 2)
- [X] T012 [US1] Add the native Tauri drag-drop event path: set `dragDropEnabled` in `apps/desktop/src-tauri/tauri.conf.json` and emit/subscribe drag-drop events in `apps/desktop/src-tauri/src/lib.rs` and `apps/desktop/src-tauri/src/events/` (bug 3)
- [X] T013 [US1] Rewrite `packages/platform/src/tauri/tauri-drag-drop-source.ts` to consume native drop payloads while keeping the `DragDropSourcePort` contract stable (bug 3)
- [X] T014 [P] [US1] Repair Web directory opening in `packages/platform/src/browser/browser-source-picker.ts` and `packages/platform/src/browser/browser-directory-access.ts`, reporting a `CapabilityReport` limitation where the browser lacks directory support (bug 4)
- [X] T015 [US1] Verify `packages/ui/src/app-shell/AppShell.tsx` add-pane/open-source paths create a pane only for the user-selected or dropped supported source on both platforms; unsupported drops/selection create no pane

**Checkpoint**: Source opening works on Desktop (picker + drag-drop) and Web (file + directory).

---

## Phase 4: User Story 2 - Scroll Log Content So The Text Moves (Priority: P1)

**Goal**: Vertical scrolling moves the rendered log text, not only the scrollbar (bug 5).

**Independent Test**: Open a long log; wheel and scrollbar scroll advance and return the visible text; first and last loaded lines are reachable; sync still works when enabled.

### Tests for User Story 2 (write/update first, ensure they fail)

- [ ] T016 [P] [US2] Update `packages/ui/tests/log-pane/virtual-log-viewport.test.tsx` to assert the rendered text advances with scroll position and first/last line reachability (bug 5)
- [ ] T017 [P] [US2] Extend `apps/web/tests/ui/synchronized-scrolling.spec.ts`, `apps/desktop/tests/ui/synchronized-scrolling.spec.ts`, and `apps/desktop/tests/ui/macos/SynchronizedScrollingUITests.swift` with "text moves on vertical scroll" assertions (bug 5)

### Implementation for User Story 2

- [ ] T018 [US2] Fix the hand-rolled virtualization in `packages/ui/src/log-pane/VirtualLogViewport.tsx` so the rendered slice offset/transform is derived from the live `scrollTop` (bug 5)
- [ ] T019 [US2] Verify the scroll container in `packages/ui/src/log-pane/LogPane.tsx` and sync propagation via `packages/ui/src/sync/useSynchronizationStore.ts` preserve existing synchronization semantics (FR-012)

**Checkpoint**: Scrolling moves text through all loaded lines with sync intact.

---

## Phase 5: User Story 3 - Reorder Panes By Dragging Anywhere On The Header (Priority: P2)

**Goal**: A pane reorder can start from any non-control region of the header while interactive controls still act (bug 6).

**Independent Test**: Drag a pane by its header title across another pane → it reorders with intervening order preserved; clicking header controls runs their action and never starts a drag.

### Tests for User Story 3 (write/update first, ensure they fail)

- [ ] T020 [P] [US3] Update `packages/ui/tests/pane-rail/pane-layout.test.tsx`, `packages/ui/tests/pane-rail/pane-workspace-alignment.test.tsx`, and the pane-header unit tests (`packages/ui/tests/log-pane/pane-lifecycle-header.test.tsx`, `file-pane-header.test.tsx`, `directory-pane-header.test.tsx`) for header-region drag start and control-click-does-not-drag (bug 6)
- [ ] T021 [P] [US3] Extend `apps/web/tests/ui/multi-pane-layout.spec.ts`, `apps/desktop/tests/ui/multi-pane-layout.spec.ts`, and `apps/desktop/tests/ui/macos/MultiPaneLayoutUITests.swift` for header-anywhere drag reorder (bug 6)

### Implementation for User Story 3

- [ ] T022 [US3] Make the whole header a drag origin in `packages/ui/src/log-pane/PaneHeader.tsx` (bind pointer-down on the header container, generalize `onReorderDragStart` off the button-only handler) and exclude interactive controls (search, close, offset, directory navigation) from starting a drag (bug 6, FR-015)
- [ ] T023 [US3] Verify `packages/ui/src/pane-rail/PaneRail.tsx` midpoint-threshold reorder and intervening-pane order are preserved (FR-014)

**Checkpoint**: Panes reorder from anywhere on the header; controls still act.

---

## Phase 6: User Story 4 - See The Correct Dark Theme And Centered Icons (Priority: P2)

**Goal**: Desktop dark theme matches the mockups and every covered icon is centered in its hover zone (bugs 1, 7).

**Independent Test**: Compare Desktop dark-theme colors to the mockups; hover the sync toggle, add-pane, close-pane, activity-rail icons, and search-popover arrows — each icon is centered in its hover zone.

### Tests for User Story 4 (write/update first, ensure they fail)

- [ ] T024 [P] [US4] Update `packages/ui/tests/app-shell/theme-variants.test.tsx` and `packages/ui/tests/app-shell/shell-presentation.test.tsx` to assert the authoritative dark-theme token values sourced from `docs/mockups/crosslog-macos-redesign-mockups.html` (dark variant) (bug 1)
- [ ] T025 [P] [US4] Update `packages/ui/tests/app-shell/icon-button-accessibility.test.tsx`, `packages/ui/tests/app-shell/redesigned-shell-final-a11y.test.tsx`, `packages/ui/tests/search/pane-search-popover.test.tsx`, and `packages/ui/tests/sync/redesigned-sync-controls.test.tsx` to assert icon centering within the hover zone (bug 7)
- [ ] T026 [P] [US4] Extend `apps/desktop/tests/ui/settings-theme.spec.ts` and `apps/desktop/tests/ui/macos/SettingsThemeUITests.swift` with dark-theme color checks (bug 1)
- [ ] T027 [P] [US4] Extend `apps/web/tests/ui/redesigned-shell-viewports.spec.ts`, `apps/desktop/tests/ui/redesigned-shell-viewports.spec.ts`, and `apps/desktop/tests/ui/macos/RedesignedShellViewportUITests.swift` with icon-centering checks for the covered icons (bug 7)

### Implementation for User Story 4

- [ ] T028 [US4] Correct the `[data-theme="dark"]` token values in `packages/ui/src/app-shell/activity-rail-theme.css` to the authoritative values in `docs/mockups/crosslog-macos-redesign-mockups.html` ("Screen / Draft Layout - Activity Rail", dark variant `data-theme="dark"`); `specs/002-redesign-activity-rail/figma-audit.md` and `specs/003-macos-ui-design-alignment/contracts/figma-design-deltas.md` are secondary references only; leave `:root` light values and `packages/ui/src/app-shell/shellPresentation.ts` unchanged (bug 1, FR-016, FR-017)
- [ ] T029 [US4] Center icons in `packages/ui/src/app-shell/activity-rail-theme.css` for `.crosslog-icon-button`, `.crosslog-activity-rail`, `.crosslog-sync-toggle`, `.crosslog-pane-header__drag-handle`, and the search-popover arrow controls, aligning icon `viewBox`/box sizing in `packages/ui/src/app-shell/icons.tsx` where the SVG is off-center (bug 7, FR-018)

**Checkpoint**: Dark theme matches mockups; all covered icons are centered.

---

## Phase 7: Polish & Cross-Cutting Concerns (Regression, Performance, Release)

**Purpose**: Full validation before commit and after push.

- [ ] T030 Run the local pre-commit gates on macOS in automatic mode only: `bash scripts/macos/test.sh`, `bash scripts/macos/test-ui.sh web`, `bash scripts/macos/test-ui.sh desktop` — all must pass (FR-025, FR-028). The manual/interactive drag-drop runner from T009 is opt-in and not part of these gates.
- [ ] T031 [P] Run `bash scripts/macos/build.sh` and `bash scripts/macos/perf.sh`; confirm `tests/performance/log-pane-virtualization.bench.ts` stays within its threshold (CR-005)
- [ ] T032 [P] Run the `specs/005-stabilize-bug-batch-2/quickstart.md` manual validation for all seven bugs
- [ ] T033 Confirm no scope creep and no new dependencies were introduced, and that behavior from specs/001–004 outside these bugs is preserved (FR-027, FR-002)
- [ ] T034 Commit, push, and monitor `.github/workflows/ci.yml`; fix any failure in `automated-tests` (linux, macos, windows-js, windows-rust), `ui-tests` (linux-web, linux-desktop, macos-web, macos-desktop, windows-web), `windows-desktop-ui-tests` (layout/pane-tools/lifecycle), `build-web`, and `build-desktop` (linux/macos/windows) until every required job is green (FR-026)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup; blocks the regression bugs (US1 bugs 2/3, US2 bug 5).
- **User Stories (Phase 3–6)**: Depend on Foundational. US1 and US2 (P1) first; US3 and US4 (P2) next. Bug 4 (Web directory, T014) has no Desktop dependency and can proceed in parallel with the Desktop work.
- **Polish (Phase 7)**: Depends on all targeted stories being complete.

### User Story Dependencies

- **US1 (P1)**: Independent. Bugs 2, 3, 4 touch different adapters/ports and can be worked in parallel.
- **US2 (P1)**: Independent (viewport only).
- **US3 (P2)**: Independent (pane header/rail only).
- **US4 (P2)**: Independent (theme CSS + icon CSS/SVG only).

### Within Each User Story

- Update/write the test to the authoritative expected result first (it fails), then implement the fix (it passes).
- Platform adapter/port before app-shell wiring.
- Component/unit before UI/E2E.

### Parallel Opportunities

- Setup: T002 and T003 in parallel.
- US1 tests T005–T010 in parallel; T014 (Web) can run alongside T011–T013 (Desktop).
- US2 tests T016–T017 in parallel.
- US3 tests T020–T021 in parallel.
- US4 tests T024–T027 in parallel; T028 (theme) and T029 (icons) touch the same CSS file — coordinate or sequence to avoid conflicts.
- All four user stories can be staffed in parallel once Foundational completes.

---

## Parallel Example: User Story 1

```bash
# Update all US1 tests together (they should fail first):
Task: "Update tauri-source-picker.test.ts (bug 2)"
Task: "Update tauri-drag-drop-source.test.ts (bug 3)"
Task: "Update browser directory tests (bug 4)"
Task: "Extend desktop source-loading.spec.ts (bug 2)"
Task: "Add desktop drag-drop spec + macOS drop coverage (bug 3)"
Task: "Extend web directory-navigation + browser-capabilities specs (bug 4)"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 Setup → Phase 2 Foundational (triage).
2. Phase 3 US1 (source opening on Desktop + Web) — the app is unusable on Desktop without it.
3. STOP and VALIDATE US1 independently, then continue.

### Incremental Delivery

US1 (source opening) → US2 (scrolling) → US3 (header reorder) → US4 (theme + icons),
each validated independently, then the Phase 7 full gate and CI/CD.

---

## Notes

- [P] = different files, no dependencies.
- Expected results derive from `docs/Bugs_2.txt` and the spec, never from current
  behavior (constitution Test Integrity).
- Bugs 2, 3, 5 are regressions of specs/004 — diagnose the Desktop/Tauri path first.
- Bug 3 likely needs a new Rust/Tauri event path plus an adapter rewrite, not a
  one-line change. If a native capability cannot be reached without a new
  dependency, stop and request approval (plan Complexity Tracking).
- T028 and T029 edit the same CSS file — sequence them to avoid conflicts.
- Commit after each task or logical group; run the local gate before commit.
