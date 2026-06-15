# Tasks: Crosslog MVP

**Input**: Design documents from `/specs/001-multi-log-analysis/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Mandatory by constitution. Every user story includes unit tests,
integration tests, UI tests, and performance or contract tests where relevant.

**Organization**: Tasks are grouped by user story to enable independent
implementation and testing. Setup and foundational tasks must complete before
any user story implementation starts.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because the task uses different files and does
  not depend on incomplete tasks.
- **[Story]**: Required only for user story phases.
- Every task includes an exact file path.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the shared Web/Desktop workspace, tooling, scripts,
test harnesses, and icon pipeline.

- [ ] T001 Create pnpm workspace manifest in `pnpm-workspace.yaml`
- [ ] T002 Create root package manifest with workspace scripts in `package.json`
- [ ] T003 Create TypeScript base configuration in `tsconfig.base.json`
- [ ] T004 [P] Create lint configuration in `eslint.config.js`
- [ ] T005 [P] Create formatting configuration in `.prettierrc.json`
- [ ] T006 Create Vite Web app scaffold in `apps/web/package.json`
- [ ] T007 Create Vite Web entrypoint in `apps/web/src/main.tsx`
- [ ] T008 Create Tauri Desktop app package scaffold in `apps/desktop/package.json`
- [ ] T009 Create Tauri Desktop Rust manifest in `apps/desktop/src-tauri/Cargo.toml`
- [ ] T010 Create Tauri Desktop configuration in `apps/desktop/src-tauri/tauri.conf.json`
- [ ] T011 [P] Create core package scaffold in `packages/core/package.json`
- [ ] T012 [P] Create platform package scaffold in `packages/platform/package.json`
- [ ] T013 [P] Create UI package scaffold in `packages/ui/package.json`
- [ ] T014 [P] Configure Vitest workspace in `vitest.config.ts`
- [ ] T015 [P] Configure Playwright Web tests in `playwright.config.ts`
- [ ] T016 [P] Configure WebdriverIO Desktop tests for Windows/Linux in `wdio.conf.ts`
- [ ] T017 [P] Implement macOS Desktop UI XCTest/Accessibility harness in `apps/desktop/tests/ui/macos/CrosslogUITests.swift`
- [ ] T018 [P] Add macOS Desktop UI harness runner documentation in `apps/desktop/tests/ui/macos/README.md`
- [ ] T019 [P] Add macOS Desktop empty-state smoke UI test in `apps/desktop/tests/ui/macos/EmptyStateUITests.swift`
- [ ] T020 [P] Create Windows build script set in `scripts/windows/build.ps1`, `scripts/windows/build-web.ps1`, and `scripts/windows/build-desktop.ps1`
- [ ] T021 [P] Create Windows test script set in `scripts/windows/test.ps1`, `scripts/windows/test-ui.ps1`, and `scripts/windows/perf.ps1`
- [ ] T022 [P] Create macOS build script set in `scripts/macos/build.sh`, `scripts/macos/build-web.sh`, and `scripts/macos/build-desktop.sh`
- [ ] T023 [P] Create macOS test script set in `scripts/macos/test.sh`, `scripts/macos/test-ui.sh`, and `scripts/macos/perf.sh`
- [ ] T024 [P] Create Linux build script set in `scripts/linux/build.sh`, `scripts/linux/build-web.sh`, and `scripts/linux/build-desktop.sh`
- [ ] T025 [P] Create Linux test script set in `scripts/linux/test.sh`, `scripts/linux/test-ui.sh`, and `scripts/linux/perf.sh`
- [ ] T026 [P] Create shared benchmark fixture generator in `tests/fixtures/generate-log-fixtures.ts`
- [ ] T027 Generate app icon assets from `crosslog-icon.svg` into `assets/icons/README.md`
- [ ] T028 Add setup smoke test for workspace imports in `tests/integration/workspace-smoke.test.ts`
- [ ] T029 Run setup validation command documented in `scripts/macos/test.sh`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define shared domain contracts, platform ports, error types,
security constraints, test fixtures, and app shell boundaries required by every
user story.

**Critical**: No user story work can begin until this phase is complete.

- [ ] T030 Create shared domain barrel exports in `packages/core/src/index.ts`
- [ ] T031 [P] Define LogPane domain types in `packages/core/src/log-pane/log-pane.ts`
- [ ] T032 [P] Define FileSource domain types in `packages/core/src/file-source/file-source.ts`
- [ ] T033 [P] Define DirectorySource domain types in `packages/core/src/directory/directory-source.ts`
- [ ] T034 [P] Define LogLine and chunk types in `packages/core/src/log-line/log-line.ts`
- [ ] T035 [P] Define SearchState domain types in `packages/core/src/search/search-state.ts`
- [ ] T036 [P] Define Session domain schema types in `packages/core/src/session/session.ts`
- [ ] T037 [P] Define CapabilityReport types in `packages/core/src/capabilities/capability-report.ts`
- [ ] T038 Define shared typed error model in `packages/core/src/errors/crosslog-error.ts`
- [ ] T039 Define FileAccessPort contract in `packages/platform/src/ports/file-access-port.ts`
- [ ] T040 Define DirectoryAccessPort contract in `packages/platform/src/ports/directory-access-port.ts`
- [ ] T041 Define FileWatcherPort contract in `packages/platform/src/ports/file-watcher-port.ts`
- [ ] T042 Define SessionStorePort contract in `packages/platform/src/ports/session-store-port.ts`
- [ ] T043 Define CapabilityPort contract in `packages/platform/src/ports/capability-port.ts`
- [ ] T044 Define SourcePickerPort contract in `packages/platform/src/ports/source-picker-port.ts`
- [ ] T045 Define DragDropSourcePort contract in `packages/platform/src/ports/drag-drop-source-port.ts`
- [ ] T046 Add platform port contract tests in `packages/platform/tests/ports/platform-ports.contract.test.ts`
- [ ] T047 Add read-only file safety test helpers in `tests/integration/helpers/read-only-assertions.ts`
- [ ] T048 Add inert log rendering test helpers in `tests/integration/helpers/inert-rendering-assertions.ts`
- [ ] T049 Add 20 MB benchmark fixture definition in `tests/fixtures/large-20mb-log.fixture.ts`
- [ ] T050 Add timestamp fixture definitions in `tests/fixtures/timestamped-logs.fixture.ts`
- [ ] T051 Add encoding fixture definitions in `tests/fixtures/encoded-logs.fixture.ts`
- [ ] T052 Create shared React app shell skeleton in `packages/ui/src/app-shell/AppShell.tsx`
- [ ] T053 Create Web shell adapter injection point in `apps/web/src/platform/createWebPlatform.ts`
- [ ] T054 Create Desktop shell adapter injection point in `apps/desktop/src/platform/createDesktopPlatform.ts`
- [ ] T055 Create Rust command module skeleton in `apps/desktop/src-tauri/src/commands/mod.rs`
- [ ] T056 Create Rust event module skeleton in `apps/desktop/src-tauri/src/events/mod.rs`
- [ ] T057 Add FileAccessPort implementation tests in `packages/platform/tests/file-access/file-access.contract.test.ts`
- [ ] T058 Add file open policy tests in `packages/core/tests/file-source/file-open-policy.test.ts`
- [ ] T059 Implement shared file size and memory policy in `packages/core/src/file-source/file-open-policy.ts`
- [ ] T060 Implement browser file access adapter in `packages/platform/src/browser/browser-file-access.ts`
- [ ] T061 Implement Tauri file access binding in `packages/platform/src/tauri/tauri-file-access.ts`
- [ ] T062 Implement Rust read-only file access commands in `apps/desktop/src-tauri/src/commands/file_access.rs`
- [ ] T063 Add encoding detection and manual selection tests in `packages/core/tests/encoding/encoding-selection.test.ts`
- [ ] T064 Implement encoding detection and manual encoding selection model in `packages/core/src/encoding/encoding-selection.ts`
- [ ] T065 Implement encoding chooser UI in `packages/ui/src/log-pane/EncodingChooser.tsx`
- [ ] T066 Add Web manual encoding UI test in `apps/web/tests/ui/manual-encoding.spec.ts`
- [ ] T067 Add Desktop manual encoding UI test in `apps/desktop/tests/ui/manual-encoding.spec.ts`
- [ ] T068 Implement Desktop source picker and drag/drop bindings in `packages/platform/src/tauri/tauri-source-picker.ts`
- [ ] T069 Add Desktop source picker and drag/drop UI tests in `apps/desktop/tests/ui/source-loading.spec.ts`
- [ ] T070 Add no-op future decoration provider interface in `packages/core/src/decorations/line-decoration-provider.ts`
- [ ] T071 Add hidden future UI slot component in `packages/ui/src/log-pane/FuturePaneToolbarSlot.tsx`
- [ ] T072 Verify MVP future controls are hidden in `packages/ui/tests/future-slots-hidden.test.tsx`
- [ ] T073 Run foundational automated tests using `scripts/macos/test.sh`

---

## Phase 3: User Story 1 - Compare Multiple Logs Side by Side (Priority: P1)

**Goal**: Users can open several log sources and view them in independent
side-by-side Log Panes with add, split, close, resize, and horizontal scrolling
behavior.

**Independent Test**: Open two files and one directory-capable placeholder
source, verify separate panes, titles, content, pane order, resizing, closing,
and horizontal scrolling.

### Tests for User Story 1 (MANDATORY)

- [ ] T074 [P] [US1] Add LogPane reducer unit tests in `packages/core/tests/log-pane/log-pane-reducer.test.ts`
- [ ] T075 [P] [US1] Add pane layout state tests in `packages/ui/tests/pane-rail/pane-layout.test.tsx`
- [ ] T076 [P] [US1] Add Web multi-pane UI test in `apps/web/tests/ui/multi-pane-layout.spec.ts`
- [ ] T077 [P] [US1] Add Desktop multi-pane UI test in `apps/desktop/tests/ui/multi-pane-layout.spec.ts`
- [ ] T078 [P] [US1] Add virtualization smoke performance test in `tests/performance/log-pane-virtualization.bench.ts`
- [ ] T079 [P] [US1] Add text selection and copy tests in `packages/ui/tests/log-pane/log-text-copy.test.tsx`
- [ ] T080 [P] [US1] Add Web text copy UI test in `apps/web/tests/ui/log-text-copy.spec.ts`
- [ ] T081 [P] [US1] Add Desktop text copy UI test in `apps/desktop/tests/ui/log-text-copy.spec.ts`

### Implementation for User Story 1

- [ ] T082 [P] [US1] Implement LogPane reducer in `packages/core/src/log-pane/log-pane-reducer.ts`
- [ ] T083 [P] [US1] Implement pane layout model in `packages/core/src/log-pane/pane-layout.ts`
- [ ] T084 [US1] Implement PaneRail component in `packages/ui/src/pane-rail/PaneRail.tsx`
- [ ] T085 [US1] Implement LogPane component in `packages/ui/src/log-pane/LogPane.tsx`
- [ ] T086 [US1] Implement add-pane and split-pane controls in `packages/ui/src/pane-rail/AddPaneButton.tsx`
- [ ] T087 [US1] Implement pane close behavior in `packages/ui/src/log-pane/ClosePaneButton.tsx`
- [ ] T088 [US1] Implement pane resizing behavior in `packages/ui/src/pane-rail/PaneResizer.tsx`
- [ ] T089 [US1] Implement independent horizontal log scrolling in `packages/ui/src/log-pane/HorizontalLogScroller.tsx`
- [ ] T090 [US1] Implement virtual log viewport in `packages/ui/src/log-pane/VirtualLogViewport.tsx`
- [ ] T091 [US1] Implement virtualized log text selection and context menu copy in `packages/ui/src/log-pane/LogTextSelection.tsx`
- [ ] T092 [US1] Wire Web app shell to pane rail in `apps/web/src/App.tsx`
- [ ] T093 [US1] Wire Desktop app shell to pane rail in `apps/desktop/src/App.tsx`
- [ ] T094 [US1] Run US1 automated tests using `scripts/macos/test.sh`
- [ ] T095 [US1] Run US1 UI tests using `scripts/macos/test-ui.sh`

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Synchronize Logs by Time (Priority: P1)

**Goal**: Users can synchronize time-aware panes by active timestamp, exclude
untimed panes, disable synchronization, and apply per-pane offsets.

**Independent Test**: Open timestamped logs, scroll one active pane to time T,
verify other panes move to greatest timestamp <= T, then disable sync and verify
independent scrolling.

### Tests for User Story 2 (MANDATORY)

- [ ] T096 [P] [US2] Add timestamp parser unit tests in `packages/core/tests/timestamps/timestamp-parser.test.ts`
- [ ] T097 [P] [US2] Add synchronization engine unit tests in `packages/core/tests/sync/sync-engine.test.ts`
- [ ] T098 [P] [US2] Add time offset unit tests in `packages/core/tests/sync/time-offset.test.ts`
- [ ] T099 [P] [US2] Add Web synchronization UI test in `apps/web/tests/ui/synchronized-scrolling.spec.ts`
- [ ] T100 [P] [US2] Add Desktop synchronization UI test in `apps/desktop/tests/ui/synchronized-scrolling.spec.ts`
- [ ] T101 [P] [US2] Add synchronization benchmark in `tests/performance/synchronization.bench.ts`
- [ ] T102 [P] [US2] Add timestamp config loading and validation tests in `packages/core/tests/timestamps/timestamp-config.test.ts`

### Implementation for User Story 2

- [ ] T103 [P] [US2] Implement TimestampFormat compiler in `packages/core/src/timestamps/timestamp-format.ts`
- [ ] T104 [P] [US2] Implement timestamp recognition service in `packages/core/src/timestamps/timestamp-recognition-service.ts`
- [ ] T105 [P] [US2] Implement timestamp config loader and validator in `packages/core/src/timestamps/timestamp-config.ts`
- [ ] T106 [US2] Implement invalid timestamp config error UI in `packages/ui/src/sync/TimestampConfigError.tsx`
- [ ] T107 [P] [US2] Implement time offset model in `packages/core/src/sync/time-offset.ts`
- [ ] T108 [US2] Implement synchronization engine in `packages/core/src/sync/synchronization-engine.ts`
- [ ] T109 [US2] Implement active pane anchor tracking in `packages/core/src/sync/time-anchor-pane.ts`
- [ ] T110 [US2] Implement synchronization store binding in `packages/ui/src/sync/useSynchronizationStore.ts`
- [ ] T111 [US2] Implement synchronization toggle UI in `packages/ui/src/sync/SynchronizationToggle.tsx`
- [ ] T112 [US2] Implement time offset editor UI in `packages/ui/src/sync/TimeOffsetEditor.tsx`
- [ ] T113 [US2] Connect synchronized scrolling to virtual viewport in `packages/ui/src/log-pane/VirtualLogViewport.tsx`
- [ ] T114 [US2] Run US2 automated tests using `scripts/macos/test.sh`
- [ ] T115 [US2] Run US2 UI tests using `scripts/macos/test-ui.sh`

**Checkpoint**: User Story 2 is independently functional with timestamped
fixtures and does not require directory navigation, search, or live updates.

---

## Phase 5: User Story 3 - Navigate Directory Logs (Priority: P2)

**Goal**: Users can open a directory, view the newest top-level file by default,
navigate previous/next files, and see navigation update when files change.

**Independent Test**: Open a directory fixture, verify default file selection,
navigate previous/next, add a newer file, and verify the current selection does
not auto-switch.

### Tests for User Story 3 (MANDATORY)

- [ ] T116 [P] [US3] Add navigation index unit tests in `packages/core/tests/directory/navigation-index.test.ts`
- [ ] T117 [P] [US3] Add directory source state tests in `packages/core/tests/directory/directory-source.test.ts`
- [ ] T118 [P] [US3] Add DirectoryAccessPort integration tests in `tests/integration/directory-access.contract.test.ts`
- [ ] T119 [P] [US3] Add Web directory navigation UI test in `apps/web/tests/ui/directory-navigation.spec.ts`
- [ ] T120 [P] [US3] Add Desktop directory navigation UI test in `apps/desktop/tests/ui/directory-navigation.spec.ts`
- [ ] T121 [P] [US3] Add directory switch benchmark in `tests/performance/directory-switch.bench.ts`
- [ ] T122 [P] [US3] Add empty-directory and subdirectory-only tests in `packages/core/tests/directory/empty-directory.test.ts`
- [ ] T123 [P] [US3] Add Web empty-directory UI test in `apps/web/tests/ui/empty-directory.spec.ts`
- [ ] T124 [P] [US3] Add Desktop empty-directory UI test in `apps/desktop/tests/ui/empty-directory.spec.ts`

### Implementation for User Story 3

- [ ] T125 [P] [US3] Implement DirectoryFileEntry model in `packages/core/src/directory/directory-file-entry.ts`
- [ ] T126 [P] [US3] Implement navigation index in `packages/core/src/directory/navigation-index.ts`
- [ ] T127 [US3] Implement directory source reducer in `packages/core/src/directory/directory-source-reducer.ts`
- [ ] T128 [US3] Implement browser directory adapter in `packages/platform/src/browser/browser-directory-access.ts`
- [ ] T129 [US3] Implement Tauri directory commands in `apps/desktop/src-tauri/src/commands/directory_access.rs`
- [ ] T130 [US3] Implement Desktop directory adapter binding in `packages/platform/src/tauri/tauri-directory-access.ts`
- [ ] T131 [US3] Implement DirectoryNavigator UI in `packages/ui/src/log-pane/DirectoryNavigator.tsx`
- [ ] T132 [US3] Implement empty-directory status UI in `packages/ui/src/log-pane/EmptyDirectoryStatus.tsx`
- [ ] T133 [US3] Connect directory source labels in `packages/ui/src/log-pane/PaneHeader.tsx`
- [ ] T134 [US3] Run US3 automated tests using `scripts/macos/test.sh`
- [ ] T135 [US3] Run US3 UI tests using `scripts/macos/test-ui.sh`

**Checkpoint**: User Story 3 is independently functional after setup and
foundation, using directory fixtures and explicit capability reporting.

---

## Phase 6: User Story 4 - Search Within a Log Pane (Priority: P2)

**Goal**: Users can search full loaded content independently per pane using text,
regular expressions, and case-sensitive matching.

**Independent Test**: Search for content outside the current viewport, verify
matches, handle invalid regex, and confirm pane search state isolation.

### Tests for User Story 4 (MANDATORY)

- [ ] T136 [P] [US4] Add search engine unit tests in `packages/core/tests/search/search-engine.test.ts`
- [ ] T137 [P] [US4] Add invalid regex tests in `packages/core/tests/search/search-errors.test.ts`
- [ ] T138 [P] [US4] Add search state isolation tests in `packages/ui/tests/search/search-state.test.tsx`
- [ ] T139 [P] [US4] Add Web search UI test in `apps/web/tests/ui/log-search.spec.ts`
- [ ] T140 [P] [US4] Add Desktop search UI test in `apps/desktop/tests/ui/log-search.spec.ts`
- [ ] T141 [P] [US4] Add 20 MB search benchmark in `tests/performance/search-20mb.bench.ts`

### Implementation for User Story 4

- [ ] T142 [P] [US4] Implement search query model in `packages/core/src/search/search-query.ts`
- [ ] T143 [US4] Implement search engine in `packages/core/src/search/search-engine.ts`
- [ ] T144 [US4] Implement incremental search update logic in `packages/core/src/search/search-index.ts`
- [ ] T145 [US4] Implement pane search store binding in `packages/ui/src/search/usePaneSearchStore.ts`
- [ ] T146 [US4] Implement pane search controls in `packages/ui/src/search/PaneSearchControls.tsx`
- [ ] T147 [US4] Implement search result navigation controls in `packages/ui/src/search/SearchResultNavigator.tsx`
- [ ] T148 [US4] Connect search matches to virtual viewport in `packages/ui/src/log-pane/VirtualLogViewport.tsx`
- [ ] T149 [US4] Run US4 automated tests using `scripts/macos/test.sh`
- [ ] T150 [US4] Run US4 UI tests using `scripts/macos/test-ui.sh`

**Checkpoint**: User Story 4 is independently functional with loaded content
fixtures and does not require live file watching.

---

## Phase 7: User Story 5 - Follow Active Logs Safely (Priority: P2)

**Goal**: Users can keep active logs open while lines append, files are deleted,
or files are replaced, without losing loaded content or affecting other panes.

**Independent Test**: Open a file, append lines, delete it, search retained
content, replace it with the same name, and verify pane-local behavior.

### Tests for User Story 5 (MANDATORY)

- [ ] T151 [P] [US5] Add file lifecycle unit tests in `packages/core/tests/file-source/file-lifecycle.test.ts`
- [ ] T152 [P] [US5] Add watcher event mapping tests in `packages/platform/tests/file-watcher/file-watcher-events.test.ts`
- [ ] T153 [P] [US5] Add read-only safety integration tests in `tests/integration/read-only-file-safety.test.ts`
- [ ] T154 [P] [US5] Add Web unsupported monitoring UI test in `apps/web/tests/ui/unsupported-monitoring.spec.ts`
- [ ] T155 [P] [US5] Add Desktop live update UI test in `apps/desktop/tests/ui/live-file-updates.spec.ts`
- [ ] T156 [P] [US5] Add live append performance test in `tests/performance/live-append.bench.ts`

### Implementation for User Story 5

- [ ] T157 [P] [US5] Implement file lifecycle reducer in `packages/core/src/file-source/file-lifecycle.ts`
- [ ] T158 [P] [US5] Implement append line chunk update in `packages/core/src/file-source/line-chunk-store.ts`
- [ ] T159 [US5] Implement Rust file watcher commands in `apps/desktop/src-tauri/src/commands/file_watcher.rs`
- [ ] T160 [US5] Implement Rust file identity detection in `apps/desktop/src-tauri/src/commands/file_identity.rs`
- [ ] T161 [US5] Implement Tauri watcher adapter binding in `packages/platform/src/tauri/tauri-file-watcher.ts`
- [ ] T162 [US5] Implement browser watcher unsupported adapter in `packages/platform/src/browser/browser-file-watcher.ts`
- [ ] T163 [US5] Implement deleted-file status UI in `packages/ui/src/log-pane/DeletedFileStatus.tsx`
- [ ] T164 [US5] Implement replacement-file transition handling in `packages/ui/src/log-pane/useFileLifecycleEvents.ts`
- [ ] T165 [US5] Run US5 automated tests using `scripts/macos/test.sh`
- [ ] T166 [US5] Run US5 UI tests using `scripts/macos/test-ui.sh`

**Checkpoint**: User Story 5 is independently functional on Desktop and reports
unsupported monitoring clearly in Web.

---

## Phase 8: User Story 6 - Restore Analysis Session (Priority: P3)

**Goal**: Users can restart after normal shutdown or unexpected errors and
recover pane layout, sources, sizes, and selected directory files without
restoring scroll positions.

**Independent Test**: Create a multi-pane session, restart, verify supported
state restores, corrupt the pending snapshot, and verify last-valid recovery.

### Tests for User Story 6 (MANDATORY)

- [ ] T167 [P] [US6] Add session schema unit tests in `packages/core/tests/session/session-schema.test.ts`
- [ ] T168 [P] [US6] Add session migration tests in `packages/core/tests/session/session-migrations.test.ts`
- [ ] T169 [P] [US6] Add SessionStorePort contract tests in `packages/platform/tests/session/session-store.contract.test.ts`
- [ ] T170 [P] [US6] Add Web session restore UI test in `apps/web/tests/ui/session-restore.spec.ts`
- [ ] T171 [P] [US6] Add Desktop session restore UI test in `apps/desktop/tests/ui/session-restore.spec.ts`
- [ ] T172 [P] [US6] Add session write performance test in `tests/performance/session-write.bench.ts`

### Implementation for User Story 6

- [ ] T173 [P] [US6] Implement session schema validation in `packages/core/src/session/session-schema.ts`
- [ ] T174 [P] [US6] Implement session migration registry in `packages/core/src/session/session-migrations.ts`
- [ ] T175 [US6] Implement session serializer without scroll positions in `packages/core/src/session/session-serializer.ts`
- [ ] T176 [US6] Implement Web IndexedDB session store in `packages/platform/src/browser/browser-session-store.ts`
- [ ] T177 [US6] Implement Desktop atomic session commands in `apps/desktop/src-tauri/src/commands/session_store.rs`
- [ ] T178 [US6] Implement Tauri session store binding in `packages/platform/src/tauri/tauri-session-store.ts`
- [ ] T179 [US6] Implement session restore orchestration in `packages/ui/src/session/useSessionRestore.ts`
- [ ] T180 [US6] Implement session recovery error UI in `packages/ui/src/session/SessionRecoveryBanner.tsx`
- [ ] T181 [US6] Run US6 automated tests using `scripts/macos/test.sh`
- [ ] T182 [US6] Run US6 UI tests using `scripts/macos/test-ui.sh`

**Checkpoint**: User Story 6 is independently functional with crash-safe
session recovery and no scroll restoration.

---

## Phase 9: User Story 7 - Use Crosslog in a Browser (Priority: P3)

**Goal**: Users can use the browser version with supported file and directory
loading behavior while unavailable local monitoring features are clearly not
promised.

**Independent Test**: Load files and directories in the browser, verify
side-by-side panes and search work, and verify unsupported capability messaging.

### Tests for User Story 7 (MANDATORY)

- [ ] T183 [P] [US7] Add browser capability unit tests in `packages/platform/tests/browser/browser-capabilities.test.ts`
- [ ] T184 [P] [US7] Add browser file adapter tests in `packages/platform/tests/browser/browser-file-access.test.ts`
- [ ] T185 [P] [US7] Add browser directory adapter tests in `packages/platform/tests/browser/browser-directory-access.test.ts`
- [ ] T186 [P] [US7] Add browser drag-and-drop UI test in `apps/web/tests/ui/browser-drag-drop.spec.ts`
- [ ] T187 [P] [US7] Add browser unsupported capability UI test in `apps/web/tests/ui/browser-capabilities.spec.ts`

### Implementation for User Story 7

- [ ] T188 [P] [US7] Implement browser capability report in `packages/platform/src/browser/browser-capabilities.ts`
- [ ] T189 [US7] Connect browser file access adapter to browser loading flow in `apps/web/src/platform/browserFileSources.ts`
- [ ] T190 [US7] Implement browser drag-and-drop source mapper in `apps/web/src/platform/browserDropSources.ts`
- [ ] T191 [US7] Implement browser directory loading integration in `packages/platform/src/browser/browser-directory-access.ts`
- [ ] T192 [US7] Implement unsupported capability messaging in `packages/ui/src/app-shell/CapabilityLimitations.tsx`
- [ ] T193 [US7] Run US7 automated tests using `scripts/macos/test.sh`
- [ ] T194 [US7] Run US7 UI tests using `scripts/macos/test-ui.sh`

**Checkpoint**: User Story 7 is independently functional for browser-supported
capabilities and explicit about unsupported monitoring.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Complete release readiness, performance validation, documentation,
security validation, and cross-platform script execution.

- [ ] T195 [P] Add release fixture documentation in `tests/fixtures/README.md`
- [ ] T196 [P] Add read-only security audit test in `tests/integration/log-content-inert-security.test.ts`
- [ ] T197 [P] Add memory pressure opening test in `tests/performance/memory-pressure-open.bench.ts`
- [ ] T198 [P] Add 20 MB open benchmark in `tests/performance/open-20mb.bench.ts`
- [ ] T199 [P] Add directory switch benchmark threshold check in `tests/performance/directory-switch-threshold.bench.ts`
- [ ] T200 [P] Add fresh-start three-source workflow benchmark in `tests/performance/fresh-start-three-sources.bench.ts`
- [ ] T201 Add quickstart validation script in `scripts/macos/validate-quickstart.sh`
- [ ] T202 Generate final icon assets into `assets/icons/crosslog.iconset/README.md`
- [ ] T203 Update developer documentation in `docs/development.md`
- [ ] T204 Run Windows build validation using `scripts/windows/build.ps1`
- [ ] T205 Run Windows automated tests using `scripts/windows/test.ps1`
- [ ] T206 Run Windows UI tests using `scripts/windows/test-ui.ps1`
- [ ] T207 Run macOS build validation using `scripts/macos/build.sh`
- [ ] T208 Run macOS automated tests using `scripts/macos/test.sh`
- [ ] T209 Run macOS UI tests using `scripts/macos/test-ui.sh`
- [ ] T210 Run Linux build validation using `scripts/linux/build.sh`
- [ ] T211 Run Linux automated tests using `scripts/linux/test.sh`
- [ ] T212 Run Linux UI tests using `scripts/linux/test-ui.sh`
- [ ] T213 Run performance validation using `scripts/windows/perf.ps1`, `scripts/macos/perf.sh`, and `scripts/linux/perf.sh`

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 Setup has no dependencies.
- Phase 2 Foundational depends on Phase 1 and blocks all user stories.
- US1 and US2 are P1 and can start after Foundation; US2 uses fixture-driven
  panes and does not require live file watching.
- US3, US4, and US5 are P2 and can start after Foundation; US4 can use loaded
  content fixtures without waiting for US5 live updates.
- US6 and US7 are P3 and can start after Foundation; US6 benefits from US1/US3
  for full UI validation but has independent schema and store tests.
- Phase 10 depends on all selected user stories.

### User Story Dependencies

- US1: no story dependency after Foundation.
- US2: no story dependency after Foundation for core synchronization; UI wiring
  reuses pane components from US1 if implemented sequentially.
- US3: no story dependency after Foundation.
- US4: no story dependency after Foundation.
- US5: depends on FileAccessPort and FileWatcherPort from Foundation.
- US6: depends on SessionStorePort from Foundation.
- US7: depends on CapabilityPort and browser adapters from Foundation.

### Within Each User Story

- Write tests first and verify they fail for missing behavior.
- Implement core domain logic before platform adapters.
- Implement platform adapters before UI integration when source data is needed.
- Implement UI components before Web/Desktop shell wiring.
- Run phase-required automated and UI tests before moving to the next phase.

## Parallel Opportunities

- Setup tasks T004-T005, T011-T026 can run in parallel after T001-T003.
- Foundation domain type tasks T031-T037 can run in parallel.
- Platform port tasks T039-T043 can run in parallel after T038.
- Test tasks at the start of each user story can run in parallel.
- Web UI and Desktop UI tests for a story can be authored in parallel.
- Browser adapters in US7 can be developed in parallel with Desktop-specific
  polish after Foundation.

## Parallel Examples

### User Story 1

```bash
Task: "T074 Add LogPane reducer unit tests in packages/core/tests/log-pane/log-pane-reducer.test.ts"
Task: "T075 Add pane layout state tests in packages/ui/tests/pane-rail/pane-layout.test.tsx"
Task: "T076 Add Web multi-pane UI test in apps/web/tests/ui/multi-pane-layout.spec.ts"
Task: "T077 Add Desktop multi-pane UI test in apps/desktop/tests/ui/multi-pane-layout.spec.ts"
```

### User Story 2

```bash
Task: "T096 Add timestamp parser unit tests in packages/core/tests/timestamps/timestamp-parser.test.ts"
Task: "T097 Add synchronization engine unit tests in packages/core/tests/sync/sync-engine.test.ts"
Task: "T099 Add Web synchronization UI test in apps/web/tests/ui/synchronized-scrolling.spec.ts"
Task: "T100 Add Desktop synchronization UI test in apps/desktop/tests/ui/synchronized-scrolling.spec.ts"
```

### User Story 3

```bash
Task: "T116 Add navigation index unit tests in packages/core/tests/directory/navigation-index.test.ts"
Task: "T118 Add DirectoryAccessPort integration tests in tests/integration/directory-access.contract.test.ts"
Task: "T119 Add Web directory navigation UI test in apps/web/tests/ui/directory-navigation.spec.ts"
Task: "T120 Add Desktop directory navigation UI test in apps/desktop/tests/ui/directory-navigation.spec.ts"
```

### User Story 4

```bash
Task: "T136 Add search engine unit tests in packages/core/tests/search/search-engine.test.ts"
Task: "T138 Add search state isolation tests in packages/ui/tests/search/search-state.test.tsx"
Task: "T139 Add Web search UI test in apps/web/tests/ui/log-search.spec.ts"
Task: "T141 Add 20 MB search benchmark in tests/performance/search-20mb.bench.ts"
```

### User Story 5

```bash
Task: "T151 Add file lifecycle unit tests in packages/core/tests/file-source/file-lifecycle.test.ts"
Task: "T152 Add watcher event mapping tests in packages/platform/tests/file-watcher/file-watcher-events.test.ts"
Task: "T154 Add Web unsupported monitoring UI test in apps/web/tests/ui/unsupported-monitoring.spec.ts"
Task: "T155 Add Desktop live update UI test in apps/desktop/tests/ui/live-file-updates.spec.ts"
```

### User Story 6

```bash
Task: "T167 Add session schema unit tests in packages/core/tests/session/session-schema.test.ts"
Task: "T169 Add SessionStorePort contract tests in packages/platform/tests/session/session-store.contract.test.ts"
Task: "T170 Add Web session restore UI test in apps/web/tests/ui/session-restore.spec.ts"
Task: "T171 Add Desktop session restore UI test in apps/desktop/tests/ui/session-restore.spec.ts"
```

### User Story 7

```bash
Task: "T183 Add browser capability unit tests in packages/platform/tests/browser/browser-capabilities.test.ts"
Task: "T184 Add browser file adapter tests in packages/platform/tests/browser/browser-file-access.test.ts"
Task: "T186 Add browser drag-and-drop UI test in apps/web/tests/ui/browser-drag-drop.spec.ts"
Task: "T187 Add browser unsupported capability UI test in apps/web/tests/ui/browser-capabilities.spec.ts"
```

## Implementation Strategy

### MVP First

1. Complete Phase 1 Setup.
2. Complete Phase 2 Foundational.
3. Complete US1 and US2 together as the primary MVP slice because the product
   goal requires both side-by-side viewing and time synchronization.
4. Stop and validate US1 and US2 independently with automated and UI tests.

### Incremental Delivery

1. Setup plus Foundation creates shared boundaries and runnable scripts.
2. US1 delivers side-by-side log workspace.
3. US2 delivers time synchronization.
4. US3 adds directory navigation.
5. US4 adds search.
6. US5 adds live update, deletion, and rotation safety.
7. US6 adds crash-safe session restore.
8. US7 completes browser capability boundaries.
9. Polish validates performance, security, and release readiness.

### Quality Gate Enforcement

- No phase is complete without passing automated tests.
- UI tests are required for every user scenario.
- macOS phase validation runs during active macOS development; Windows and Linux
  UI scripts must pass before release readiness on their corresponding operating
  systems.
- Expected test results must not be changed to match broken implementation
  behavior.
- Opened log files must remain read-only and log content must remain inert.

## Format Validation

- Total tasks: 213.
- Setup tasks: 29.
- Foundational tasks: 44.
- US1 tasks: 22.
- US2 tasks: 20.
- US3 tasks: 20.
- US4 tasks: 15.
- US5 tasks: 16.
- US6 tasks: 16.
- US7 tasks: 12.
- Polish tasks: 19.
- All task checklist lines use `- [ ] T###` format.
- User story phase tasks include `[US#]` labels.
- Setup, Foundational, and Polish tasks omit story labels.
- Every task includes at least one concrete file path.
