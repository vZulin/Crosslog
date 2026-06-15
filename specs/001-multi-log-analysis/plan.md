# Implementation Plan: Crosslog MVP

**Branch**: `001-multi-log-analysis` | **Date**: 2026-06-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-multi-log-analysis/spec.md`

## Summary

Crosslog MVP is a shared Web/Desktop log analyzer for opening multiple files or
directories, displaying logs side by side, synchronizing panes by timestamp,
searching full loaded content, following active files, handling deletion and
rotation safely, and restoring sessions without scroll positions.

The implementation uses one TypeScript domain and UI codebase with explicit
platform adapters. Desktop uses Tauri 2 for Windows, macOS, and Linux native
filesystem capabilities. Web uses browser file and directory capabilities where
available and exposes unsupported local monitoring behavior as unavailable
rather than simulating it.

Future features requested during planning - filtering, highlighting, directory
wide search, and saving/loading filter or highlight sets - are not part of the
MVP because the specification excludes them. The architecture reserves extension
points and future UI regions for those capabilities without implementing or
surfacing functional controls in the MVP.

## Technical Context

**Language/Version**: TypeScript 5.x for shared domain/UI and Web shell; Rust
stable compatible with Tauri 2 for Desktop adapters; Node.js active LTS for
tooling.
**Primary Dependencies**: Tauri 2; Vite; React; Zustand; TanStack Virtual;
Vitest; Playwright; WebdriverIO; tauri-driver; macOS XCTest/Accessibility UI
harness; notify; encoding_rs; chardetng.
  - Tauri 2: required Desktop shell and OS bridge.
  - Vite: Web and Desktop frontend build/dev server.
  - React: shared UI component framework.
  - Zustand: small state store for UI/session orchestration.
  - TanStack Virtual: row virtualization for large log panes.
  - Vitest: TypeScript unit, integration, and benchmark tests.
  - Playwright: browser UI/E2E tests.
  - WebdriverIO + tauri-driver: Windows/Linux Desktop UI/E2E tests through
    Tauri WebDriver.
  - macOS XCTest/Accessibility UI harness: macOS Desktop UI/E2E tests because
    Tauri WebDriver automation is not available for macOS WebView.
  - notify: Desktop filesystem watching adapter.
  - encoding_rs + chardetng: Desktop decoding and charset detection.
  - tempfile/assert_fs equivalents for Rust adapter tests where needed.
**Storage**: Browser IndexedDB for Web session state; Desktop application data
directory for crash-safe session snapshots; user-provided timestamp config file
loaded read-only. No application state is written beside opened logs.
**Testing**: Vitest for core/unit/integration/performance; Rust cargo test for
native adapters; Playwright for Web UI/E2E; WebdriverIO with tauri-driver for
Windows/Linux Desktop UI/E2E; macOS XCTest/Accessibility harness for macOS
Desktop UI/E2E; OS scripts execute tests on Windows, macOS, and Linux.
**Target Platform**: Web plus Desktop on Windows, macOS, and Linux.
**Project Type**: Shared Web/Desktop application.
**Shared Codebase Strategy**: `packages/core` owns business logic;
  `packages/ui` owns reusable React UI; `packages/platform` owns TypeScript
  interfaces and browser/Tauri adapter bindings; `apps/web` and `apps/desktop`
  are thin shells.
**Platform Interfaces**: filesystem, directory listing, file identity,
  file watching, drag/drop, dialogs, encoding decode/detect, session store,
  app lifecycle, and OS-specific test automation.
**OS Build Scripts**: `scripts/windows/build.ps1`,
  `scripts/macos/build.sh`, `scripts/linux/build.sh`.
**OS Automated Test Scripts**: `scripts/windows/test.ps1`,
  `scripts/macos/test.sh`, `scripts/linux/test.sh`.
**OS UI Test Scripts**: `scripts/windows/test-ui.ps1`,
  `scripts/macos/test-ui.sh`, `scripts/linux/test-ui.sh`.
**Read-Only/Security Model**: Opened logs are accessed only through read-only
  handles and commands; log content is text data only; renderer uses text nodes,
  never HTML injection; links, shell-like text, and terminal escape sequences are
  inert; session data is stored outside opened log paths.
**Session Recovery Model**: Write session snapshots with validate-then-commit:
  serialize next state, write to a temporary file or transaction, validate,
  atomically replace the current snapshot, retain the last valid snapshot, and
  recover from the last valid snapshot on startup.
**Performance Goals**: Open a 20 MB file in <= 1 second; search a 20 MB loaded
  log in <= 1 second; switch directory files in <= 200 ms; keep rendering
  virtualized; stop opening before loading when configured size or memory limits
  are exceeded.
**Constraints**: No MVP remote access, file manager, filtering, highlighting,
  saved filter/highlight sets, or recursive directory search. Business logic must
  not be duplicated across Web/Desktop. Platform-specific code must remain behind
  interfaces. UI tests must run on corresponding target OS.
**Scale/Scope**: MVP handles multiple simultaneous panes with 20 MB default
  file limit per source, configurable higher limits, top-level directory files
  only, and arbitrary timestamp format count.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- PASS: Technology stack is explicitly selected for Web, Desktop, UI, testing,
  benchmarking, and build tooling.
- PASS: Each dependency has a direct requirement-based reason and avoids
  large all-in-one UI/data grids.
- PASS: Web and Desktop share `packages/core`, `packages/ui`, and
  `packages/platform`; apps are shells.
- PASS: Platform-specific behavior is isolated behind explicit filesystem,
  watcher, dialog, drag/drop, persistence, and lifecycle interfaces.
- PASS: Build scripts are defined for Windows, macOS, and Linux.
- PASS: Automated test scripts are defined for Windows, macOS, and Linux.
- PASS: UI test scripts are defined for Windows, macOS, and Linux.
- PASS: Every development phase below includes automated tests and phase-exit
  commands.
- PASS: Every user scenario maps to UI tests in the test strategy.
- PASS: Desktop UI tests run on the corresponding target OS.
- PASS: Expected results are derived from `spec.md` and
  `crosslog-requirement-specification.md`; changing expected results to match
  broken behavior is prohibited.
- PASS: Opened log files remain read-only and log content is never executed.
- PASS: Session state uses crash-safe write and recovery rules.
- PASS: Performance requirements have benchmark and integration test coverage.

## Phase 0: Research and Stack Selection

### Selected Stack Recommendation

- Frontend framework: React.
- State management: Zustand with plain immutable domain objects from
  `packages/core`.
- Virtualization library: TanStack Virtual.
- Desktop bridge: Tauri 2 commands/events with Rust-owned read-only filesystem,
  directory, watcher, encoding, and session adapters.
- Shared business logic: TypeScript packages in a workspace:
  `packages/core`, `packages/ui`, `packages/platform`.
- File watching: `FileWatcherPort` interface; Desktop adapter backed by Rust
  `notify`; Web adapter reports unsupported monitoring capabilities.
- Encoding detection: BOM-first detection in shared adapter contract; Desktop
  adapter uses `encoding_rs` and `chardetng`; Web adapter uses browser decoding
  capabilities and reports unsupported labels explicitly.
- Timestamp parsing: dependency-free parser compiler in `packages/core` for the
  supported parser tokens used by configuration; regex detection stays
  user-configurable.
- Session persistence: `SessionStorePort`; Desktop atomic file snapshots;
  Web IndexedDB transactional snapshots.
- Unit/integration/performance tests: Vitest for TypeScript and cargo test for
  Rust adapters.
- Browser UI tests: Playwright.
- Desktop UI tests: WebdriverIO with tauri-driver on Windows/Linux and
  macOS XCTest/Accessibility harness on macOS.
- Benchmarks: Vitest benchmark suites for shared logic plus adapter benchmarks
  for file open, search, navigation, session write, and decode paths.

### Alternatives Considered

Frontend framework:

- React: selected. Mature, broad ecosystem, good compatibility with Vite,
  Tauri WebView, Playwright, WebdriverIO, Zustand, TanStack Virtual, and
  native macOS accessibility-based UI checks.
- Solid: strong performance, but smaller ecosystem and higher onboarding risk.
- Svelte: concise UI, but fewer mature cross-platform testing patterns for this
  specific stack.

State management:

- Zustand: selected. Small, direct, low boilerplate, works well with local UI
  stores and immutable domain state.
- Redux Toolkit: robust but heavier and more ceremony than this MVP needs.
- XState: strong for complex workflow state, but unnecessary for most domain
  state; use explicit reducers/state machines only for file lifecycle if needed.

Virtualization:

- TanStack Virtual: selected. Headless virtualization fits custom log pane UI,
  horizontal layouts, and variable measurements.
- react-window: smaller but less flexible for evolving pane features.
- Custom virtualization: no dependency, but too risky for performance-critical
  scrolling and selection behavior.

Desktop bridge architecture:

- Tauri 2 Rust commands/events: selected. Keeps filesystem access, watching,
  decoding, and session writes native and testable.
- JavaScript-only desktop bridge: rejected because file watching, identity, and
  rotation behavior require OS-specific handling.
- Separate desktop codebase: rejected by constitution.

Encoding detection:

- encoding_rs + chardetng: selected for Desktop adapters.
- Browser TextDecoder only: insufficient for Desktop and inconsistent detection.
- Large ICU-based stack: rejected for dependency and resource cost.

Timestamp parsing:

- Core parser compiler: selected to keep parsing shared and dependency-light.
- date-fns/dayjs/luxon: useful but add dependencies and do not map directly to
  the configured parser contract without adapter code.
- Rust chrono in Desktop only: rejected because parsing rules must be shared
  with Web.

Session persistence:

- Atomic snapshot files on Desktop and IndexedDB transactions on Web: selected.
- LocalStorage: rejected due size, reliability, and transactional limitations.
- Writing state beside log files: rejected by read-only input principle.

Testing:

- Vitest + Playwright + WebdriverIO/tauri-driver + macOS
  XCTest/Accessibility: selected.
- Cypress for browser UI: viable but less aligned with the selected split
  between browser automation and Desktop OS automation.
- Manual cross-platform validation: rejected by constitution.

## Phase 1: UI/UX Design

### MVP UI Rules

- Log Pane layout: full-window work surface with horizontally scrollable pane
  rail; each pane has a compact header, toolbar row, virtualized log viewport,
  horizontal text scroll, and status strip.
- Empty state: centered primary open action for file/directory plus drag/drop
  target; no marketing or explanatory landing page.
- Add/split pane behavior: add control sits to the right of the rightmost pane;
  adding splits the rightmost pane 50/50.
- Resizing behavior: pane boundaries are draggable; sizes persist in session
  until changed or panes are closed.
- Horizontal scrolling behavior: each pane has independent log-line horizontal
  scroll; pane rail scrolls horizontally when pane count exceeds viewport width.
- Directory navigation controls: previous and next icon buttons in directory
  pane header; disabled at boundaries; directory name and selected file name are
  both visible.
- Search controls: per-pane search input, plain/regex mode, case toggle,
  match count, previous/next match actions, invalid regex error state.
- Synchronization toggle: global toolbar toggle, enabled by default, with pane
  exclusion status for untimed panes.
- Time offset controls: per-pane compact offset editor with day/hour/minute/
  second/millisecond fields and reset action.
- Deleted-file status: non-blocking status strip in affected pane; loaded content
  remains visible and searchable.
- Error states: pane-local errors for read/decode/search/config issues; global
  error only for unrecoverable app-level failures.
- Application icon: derive generated PNG/ICO/ICNS assets from
  `./crosslog-icon.svg`, preserving the two-pane log motif and synchronization
  crossing lines.

### Future UI Slots Not Implemented in MVP

- Filter/highlight bar: reserved region in pane toolbar/component model only;
  hidden in MVP.
- Filtered logs: no filtering behavior in MVP; log viewport model exposes a
  future line projection extension.
- Highlighted logs: no highlighting behavior in MVP; renderer accepts a future
  decoration provider but MVP provider returns no decorations.
- Directory search bar: no directory-wide search in MVP; sidebar/toolbar slot is
  reserved for future search across directory files.
- Save/load filter and highlight sets: no MVP controls or persistence fields are
  active; session schema includes versioned extension space for future data.

## Phase 2: Architecture Design

- Shared domain layer: pure TypeScript modules for source lifecycle, navigation
  index, timestamp recognition, synchronization, search, session validation,
  file-size policy, and future filter/highlight extension interfaces.
- Platform adapters: TypeScript port interfaces with browser and Tauri
  implementations. Tauri adapters call Rust commands for filesystem-sensitive
  operations.
- Source loading adapters: `FileAccessPort`, `SourcePickerPort`, and
  `DragDropSourcePort` isolate file selection, drag/drop mapping, read-only file
  opening, decode/detect behavior, user-selected encodings, size checks, and
  memory checks from shared UI and domain logic.
- File source abstraction: `FileSource` owns file identity, display name, size,
  encoding, loaded line chunks, follow status, deletion/replacement status, and
  read errors.
- Directory source abstraction: `DirectorySource` owns directory identity,
  top-level file entries, ordering strategy, current file identity, and
  navigation availability.
- Navigation index: immutable ordered index over directory files with current,
  previous, and next lookup; recalculated when directory contents change.
- Timestamp recognition service: compiles configured regex patterns and parser
  tokens; returns first valid timestamp per line.
- Synchronization engine: receives anchor pane/time and pane offsets; excludes
  untimed panes; selects greatest timestamp <= target time.
- Search engine: per-pane full-content search over loaded line chunks; supports
  text, regex, case-sensitive mode, invalid regex errors, and incremental update
  when appended lines arrive.
- Session storage: versioned session schema, validation, migration hooks,
  atomic/transactional writes, last-valid fallback, and no scroll restoration.
- File watching and log rotation detection: Desktop watcher reports append,
  delete, recreate, and replace events using file identity; Web watcher reports
  unsupported where browser capabilities cannot provide monitoring.
- Filtering/highlighting: extension interfaces only; no MVP behavior.
- Memory management: chunk loaded lines; virtualize rendering; release inactive
  file chunks when switching directory files if memory pressure is detected;
  keep searchable loaded content for deleted files; stop before loading when size
  or memory limits fail; future filtering/highlighting must operate over
  viewport-window projections rather than full DOM rendering.
- UI component structure: `AppShell`, `GlobalToolbar`, `PaneRail`,
  `LogPane`, `PaneHeader`, `DirectoryNavigator`, `PaneSearch`,
  `SyncToggle`, `TimeOffsetEditor`, `VirtualLogViewport`, `PaneStatus`,
  `ErrorBanner`, and future `LineDecorationProvider`.

## Phase 3: Development Phases

### Phase 3.1 - Workspace and Automation Foundation

- Scope: initialize monorepo structure, lint/format, Vite app shells, Tauri 2
  shell, package boundaries, OS scripts, CI-compatible command names, macOS
  XCTest/Accessibility Desktop UI harness, and icon asset generation from
  `crosslog-icon.svg`.
- Automated tests: smoke unit test for package imports; script smoke tests.
- UI tests: open empty shell and verify empty state on Web and Desktop.
- OS scripts: create all build/test/test-ui scripts for Windows, macOS, Linux.
- Acceptance criteria: all scripts exist, run from clean checkout, and empty
  app renders without console errors.
- Required commands: `scripts/<os>/test`, `scripts/<os>/test-ui`,
  `scripts/<os>/build` on the current OS; corresponding scripts on each target
  OS before phase completion.

### Phase 3.2 - Shared Source and Read-Only File Opening

- Scope: file source port, directory source port, read-only Desktop adapter,
  browser file loading adapter, size limit check, encoding detection, decode
  errors, manual encoding selection when automatic detection fails,
  corrupted-file handling, source picker and drag/drop source mapping, and
  first-line display.
- Automated tests: unit tests for file policies; adapter contract tests; Rust
  tests for read-only open and decode paths; encoding detection and manual
  selection tests.
- UI tests: open file, open oversized file, open invalid/corrupted file, browser
  file load where supported, Desktop source picker and drag/drop where
  supported, and manual encoding selection.
- Acceptance criteria: files open read-only; no bytes change; default 20 MB
  limit applies; one source error does not affect other panes.
- Required commands: OS automated tests plus Web UI tests; Desktop UI tests on
  Windows, macOS, and Linux.

### Phase 3.3 - Multi-Pane Layout and Directory Navigation

- Scope: pane rail, add/split/close behavior, resizing, horizontal scrolling,
  directory top-level listing, creation-time/name ordering, navigation index,
  directory refresh, empty-directory status, subdirectory-only directory status,
  recreated-file identity behavior, and log text selection/copy behavior.
- Automated tests: navigation index unit tests; layout state tests; adapter
  contract tests for directory listing identity; text selection/copy tests.
- UI tests: add panes, resize panes, close pane, open directory, navigate
  previous/next, add newer file, recreate same-name file, handle empty
  directories, and copy selected log text with keyboard and context menu.
- Acceptance criteria: user stories 1 and 3 pass; pane sizes persist in session
  state; directory current file does not auto-switch when a newer file appears.
- Required commands: all OS automated tests and affected UI tests on each target
  OS.

### Phase 3.4 - Timestamp Recognition and Synchronization

- Scope: timestamp config loading, parser compiler, first-valid timestamp
  recognition, invalid config handling, untimed-line handling, synchronization
  toggle, active/anchor pane updates, per-pane offsets.
- Automated tests: parser/token tests; synchronization engine tests; offset
  tests; timestamp config validation tests; untimed pane exclusion tests.
- UI tests: scroll sync, search-triggered anchor change, directory navigation
  anchor change, disable sync, untimed pane exclusion, offset adjustment.
- Acceptance criteria: user story 2 passes; SC-005 passes on reference data.
- Required commands: all OS automated tests, browser UI tests, Desktop UI tests
  on Windows/macOS/Linux.

### Phase 3.5 - Search and Live Updates

- Scope: per-pane search state, text/regex/case modes, invalid regex handling,
  full loaded content search, appended-line updates, Desktop watcher append
  events, deleted-file behavior, replacement/rotation behavior.
- Automated tests: search engine tests; watcher event mapping tests; file
  lifecycle state tests; performance tests for 20 MB search.
- UI tests: search scenarios, appended-line update, deleted-file status,
  replacement switch, browser unsupported monitoring messaging.
- Acceptance criteria: user stories 4 and 5 pass; SC-003 and SC-006 pass.
- Required commands: all OS automated tests; Desktop UI tests on each target OS;
  browser UI tests for Web-supported behavior.

### Phase 3.6 - Session Restore and Crash Safety

- Scope: session schema, validation, migrations, Web IndexedDB store, Desktop
  atomic snapshot store, last-valid recovery, no scroll restoration.
- Automated tests: session schema tests, migration tests, corrupt snapshot tests,
  adapter tests for atomic/transactional persistence.
- UI tests: restore multi-pane session, restore selected directory file, verify
  scroll positions are not restored, simulate corrupt session fallback.
- Acceptance criteria: user story 6 passes; SC-007 passes.
- Required commands: all OS automated tests and UI tests on each target OS.

### Phase 3.7 - Browser Parity and Capability Boundaries

- Scope: browser shell polish, drag/drop, browser directory loading where
  available, unsupported capability messaging, shared behavior parity checks.
- Automated tests: browser adapter contract tests and parity tests against core
  behavior.
- UI tests: browser user story 7, file load, directory load where available,
  unsupported monitoring messaging.
- Acceptance criteria: browser version supports available MVP behavior and does
  not promise unsupported filesystem monitoring.
- Required commands: Web build, Web UI tests, all OS automated tests.

### Phase 3.8 - Performance, Reliability, and Release Readiness

- Scope: benchmark suites, fresh-start three-source workflow timing, memory
  pressure handling, virtualization tuning, security/read-only audit tests, icon
  packaging, documentation, quickstart validation.
- Automated tests: performance benchmarks for SC-001, SC-002, SC-003, SC-004;
  read-only safety tests; inert-content rendering tests; memory-limit tests.
- UI tests: full critical user journey on Web and Desktop.
- Acceptance criteria: all success criteria pass; release readiness gates pass;
  no unresolved constitution violations.
- Required commands: all script matrix commands on Windows, macOS, and Linux.

## Phase 4: Build and Test Automation

### Script Matrix by OS

| Purpose | Windows | macOS | Linux |
|---------|---------|-------|-------|
| Build all | `pwsh scripts/windows/build.ps1` | `bash scripts/macos/build.sh` | `bash scripts/linux/build.sh` |
| Unit/integration | `pwsh scripts/windows/test.ps1` | `bash scripts/macos/test.sh` | `bash scripts/linux/test.sh` |
| UI tests | `pwsh scripts/windows/test-ui.ps1` | `bash scripts/macos/test-ui.sh` | `bash scripts/linux/test-ui.sh` |
| Web build | `pwsh scripts/windows/build-web.ps1` | `bash scripts/macos/build-web.sh` | `bash scripts/linux/build-web.sh` |
| Desktop build | `pwsh scripts/windows/build-desktop.ps1` | `bash scripts/macos/build-desktop.sh` | `bash scripts/linux/build-desktop.sh` |
| Performance | `pwsh scripts/windows/perf.ps1` | `bash scripts/macos/perf.sh` | `bash scripts/linux/perf.sh` |

During active development on macOS, phase validation tasks run the macOS scripts
as the local executable gate. Windows and Linux scripts are still required to
exist, remain documented, exit non-zero on failure, and pass before release
readiness when executed manually or in CI on their corresponding operating
systems.

### Canonical Package Commands

- `pnpm lint`: lint all TypeScript packages and apps.
- `pnpm test:unit`: run shared TypeScript unit tests.
- `pnpm test:integration`: run TypeScript integration tests.
- `pnpm test:ui:web`: run Playwright Web UI tests.
- `pnpm test:ui:desktop`: run Desktop UI tests for the current OS; Windows and
  Linux use WebdriverIO/tauri-driver, macOS uses XCTest/Accessibility.
- `pnpm bench`: run TypeScript performance benchmarks.
- `cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml`: run Rust
  adapter tests.
- `cargo bench --manifest-path apps/desktop/src-tauri/Cargo.toml`: run Rust
  adapter benchmarks if native bottlenecks are confirmed.

## Quality Gates

- No phase is complete until its required automated tests pass.
- UI tests for affected user scenarios are required before phase completion.
- macOS phase validation runs during active macOS development; Windows and Linux
  UI scripts must pass before release readiness on their corresponding operating
  systems.
- Web UI tests must run for browser-supported behavior.
- Expected test results must be changed only after an approved requirement
  change, never to match defective implementation behavior.
- Read-only log safety tests must pass in every phase that touches file access,
  session persistence, rendering, or adapters.
- Performance tests or benchmarks must validate SC-002, SC-003, and SC-004
  before release readiness.

## Risk List

| Risk | Impact | Mitigation |
|------|--------|------------|
| Browser filesystem capability variance | Web behavior differs by browser | Adapter capability reporting, explicit UI messaging, browser-specific UI tests |
| Cross-platform file identity and rotation differences | Incorrect deletion/replacement behavior | Rust adapter contract tests on each OS with created, deleted, and recreated files |
| Large-log rendering or search exceeds goals | Core value degraded | Chunked line storage, TanStack Virtual, benchmark gates, memory pressure tests |
| Timestamp parser ambiguity | Incorrect synchronization | Explicit parser token support, invalid timestamp tests, first-valid candidate rule |
| Desktop UI automation variance | UI tests flaky or unsupported on one OS | Use WebdriverIO/tauri-driver on Windows/Linux, macOS XCTest/Accessibility on macOS, deterministic fixtures, and OS-isolated suites |
| Session corruption | User loses analysis context | Validate-then-commit writes, last-valid fallback, corrupt snapshot tests |
| Future feature leakage into MVP | Scope creep and test burden | Keep filter/highlight/search-all controls hidden; only extension interfaces are allowed |
| Dependency growth | Performance/security burden | Dependency justification required in plan and review |

## Test Strategy

- Unit tests cover pure domain behavior: parser compiler, timestamp recognition,
  synchronization, navigation index, search, session validation, file policy,
  and future extension interface no-op behavior.
- Integration tests cover adapter contracts: file open, directory list, file
  identity, append/delete/replace events, decode, session store, and capability
  reporting.
- UI/E2E tests cover every user story:
  - US1: multi-pane layout, split/close/resize/horizontal scrolling.
  - US2: time synchronization, offsets, untimed pane exclusion, disabled sync.
  - US3: directory ordering and navigation refresh.
  - US4: search modes and appended-line results.
  - US5: live updates, deletion, replacement, pane-local errors.
  - US6: session restore and crash-safe fallback.
  - US7: browser loading and unsupported capability messaging.
- Cross-platform Desktop tests run the affected Desktop UI suite on Windows,
  macOS, and Linux using the automation backend supported by that OS.
- Browser tests run in the selected browser targets during planning and CI
  setup; unsupported filesystem features are asserted as unavailable rather than
  skipped silently.
- Performance benchmarks use fixed 20 MB fixtures, repeated runs, and failure
  thresholds matching success criteria.

## Project Structure

### Documentation (this feature)

```text
specs/001-multi-log-analysis/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── platform-ports.md
│   ├── ui-behavior.md
│   └── test-scripts.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/
├── web/
│   ├── src/
│   └── tests/ui/
└── desktop/
    ├── src/
    ├── src-tauri/
    └── tests/ui/

packages/
├── core/
│   ├── src/
│   │   ├── directory/
│   │   ├── file-source/
│   │   ├── search/
│   │   ├── session/
│   │   ├── sync/
│   │   └── timestamps/
│   └── tests/
├── platform/
│   ├── src/
│   │   ├── ports/
│   │   ├── browser/
│   │   └── tauri/
│   └── tests/
└── ui/
    ├── src/
    │   ├── app-shell/
    │   ├── log-pane/
    │   ├── pane-rail/
    │   ├── search/
    │   ├── session/
    │   └── sync/
    └── tests/

tests/
├── fixtures/
├── integration/
├── performance/
└── ui/

scripts/
├── windows/
├── macos/
└── linux/

assets/
└── icons/
```

**Structure Decision**: Use a workspace monorepo with shared packages and thin
app shells. This satisfies the one-codebase rule, keeps platform-specific code
behind explicit interfaces, and supports independent testing of core logic,
platform adapters, and UI behavior.

## Complexity Tracking

No constitution violations are planned. The Tauri Desktop shell is required by
the product constraints; it remains a shell and adapter host, not a duplicated
business-logic implementation.
