# Research: Crosslog MVP

## Technology Stack Selection

### Decision: React + Vite + TypeScript for shared UI

Rationale: React gives the broadest ecosystem for a dense, work-focused UI,
works cleanly with Vite, Tauri WebView, Playwright, WebdriverIO, Zustand,
TanStack Virtual, and native macOS accessibility-based UI checks, and keeps
Web/Desktop UI reuse straightforward.

Alternatives considered:

- Solid: strong rendering performance, but smaller ecosystem and less standard
  Desktop UI automation coverage.
- Svelte: concise components, but less aligned with the selected state and
  virtualization ecosystem.

### Decision: Zustand for state management

Rationale: Crosslog needs compact UI/session orchestration without global
framework ceremony. Zustand keeps stores small and testable while core business
logic remains plain TypeScript.

Alternatives considered:

- Redux Toolkit: robust but heavier than necessary for MVP state.
- XState: useful for complex lifecycles, but too broad as a global state choice.

### Decision: TanStack Virtual for log row virtualization

Rationale: Large logs require proven virtualization. TanStack Virtual is
headless and fits custom log panes, independent horizontal scrolling, text
selection constraints, and future line decorations.

Alternatives considered:

- react-window: smaller but less flexible for evolving layout and measurement.
- Custom virtualization: avoids a dependency but creates high performance and
  correctness risk.

### Decision: Tauri 2 command/event bridge for Desktop

Rationale: Desktop must support local files, directories, monitoring, deletion,
and rotation on Windows, macOS, and Linux. Native Rust adapters behind Tauri
commands/events keep OS behavior isolated and testable.

Alternatives considered:

- JavaScript-only filesystem handling: insufficient for robust watch and file
  identity behavior.
- Separate Desktop codebase: rejected by the constitution.

### Decision: Workspace packages for shared business logic

Rationale: `packages/core`, `packages/ui`, and `packages/platform` make shared
logic and platform boundaries explicit. Web and Desktop apps remain thin shells.

Alternatives considered:

- Single app package: simpler initially, but weak boundaries invite platform
  leakage and duplicated logic.
- Separate Web/Desktop repos: rejected by the constitution.

### Decision: `notify` for Desktop file watching

Rationale: Desktop append/delete/recreate/replace behavior needs OS filesystem
events. `notify` is a focused Rust watcher dependency that can be hidden behind
`FileWatcherPort`.

Alternatives considered:

- Polling only: simpler but less responsive and more resource intensive.
- Browser watcher abstraction: unavailable for local filesystem monitoring.

### Decision: `encoding_rs` + `chardetng` for Desktop encoding handling

Rationale: Required encodings include UTF variants and Windows code pages.
Desktop adapters need deterministic decode support plus detection beyond BOMs.

Alternatives considered:

- Browser TextDecoder only: not sufficient for Desktop adapter behavior.
- Heavy ICU-based stack: unnecessary dependency and resource cost for MVP.

### Decision: Core timestamp parser compiler

Rationale: Timestamp parsing must be shared across platforms and driven by
configuration. A focused parser compiler for supported tokens avoids a large
date library and keeps behavior deterministic.

Alternatives considered:

- date-fns/dayjs/luxon: capable but add dependency weight and still need a
  mapping layer from parser strings.
- Rust-only parser: would duplicate Web behavior or move business logic out of
  the shared codebase.

### Decision: Atomic snapshots and IndexedDB for session persistence

Rationale: Desktop needs crash-safe filesystem snapshots outside log paths. Web
needs transactional browser storage. Both are hidden behind `SessionStorePort`
and share validation/migration logic.

Alternatives considered:

- LocalStorage: rejected for reliability, size, and transaction limitations.
- Writing state beside opened logs: rejected by read-only log safety.

## Testing Framework Selection

### Decision: Vitest for TypeScript unit, integration, and benchmarks

Rationale: Vitest integrates with Vite and TypeScript, supports fast unit tests,
integration tests with fake adapters, and benchmark suites for core behavior.

Alternatives considered:

- Jest: mature but heavier Vite integration path.
- Node test runner: minimal dependency, but weaker browser-like and benchmark
  ecosystem for this UI-heavy app.

### Decision: cargo test for Rust adapter tests

Rationale: Native file, watcher, decode, and session adapters must be tested at
the Rust boundary where OS behavior exists.

Alternatives considered:

- Testing adapters only through UI: too slow and too indirect for edge cases.

### Decision: Playwright for browser UI/E2E

Rationale: Browser scenarios require reliable file inputs, drag/drop coverage,
multi-browser support, and deterministic assertions.

Alternatives considered:

- Cypress: viable but less aligned with the Desktop WebDriver strategy.

### Decision: OS-specific Desktop UI automation

Rationale: Windows and Linux Desktop UI tests can use Tauri WebDriver through
tauri-driver with WebdriverIO. macOS requires a native XCTest/Accessibility
harness because Tauri WebDriver automation is not available for macOS WebView.
This split keeps the constitutional rule that UI tests run on the corresponding
target OS without pretending one automation backend works everywhere.

Alternatives considered:

- Playwright-only Desktop testing: good for Web but not the primary Tauri
  Desktop automation path.
- WebdriverIO/tauri-driver on all Desktop OS targets: rejected because macOS
  WebView lacks the required WebDriver backend.
- Manual Desktop validation: rejected by the constitution.

### Decision: Fixed-fixture performance benchmarks

Rationale: Performance criteria are explicit. Benchmarks must use repeatable
20 MB fixtures and fail when thresholds regress.

Alternatives considered:

- Manual timing: non-repeatable and not gateable.
- Production log samples only: useful later but unsuitable as baseline tests.

## UI/UX Research Decisions

### Decision: Dense pane-based work surface

Rationale: Target users repeatedly scan and compare logs. The first viewport
must be the analysis workspace, not a landing page. Controls stay compact and
predictable.

Alternatives considered:

- Marketing-style home screen: rejected because it delays primary work.
- Tab-only layout: rejected because it hides simultaneous logs.

### Decision: Future controls remain hidden in MVP

Rationale: Filtering, highlighting, directory-wide search, and saved filter or
highlight sets are excluded from MVP. Showing disabled or decorative controls
would create false affordances and extra UI test burden.

Alternatives considered:

- Visible disabled controls: rejected because they reduce clarity and imply
  near-term behavior not present in MVP.

## Architecture Research Decisions

### Decision: Ports and adapters at platform boundaries

Rationale: The constitution requires platform-specific code behind explicit
interfaces. Ports keep Web/Desktop behavior comparable and testable.

Alternatives considered:

- Direct platform calls from UI components: rejected due duplicated behavior and
  weak testability.

### Decision: Chunked line storage with virtualized rendering

Rationale: 20 MB files and multiple panes require low memory and DOM usage.
Chunking supports search, deletion retention, and future projection for
filtering/highlighting without rendering all lines.

Alternatives considered:

- Load each file as one giant string: simpler but poor for search updates and
  line-level metadata.
- Render all lines: rejected by performance requirements.

## Source References

- Tauri 2 documentation: https://v2.tauri.app/
- Tauri WebDriver testing documentation: https://v2.tauri.app/develop/tests/webdriver/
- Vite guide: https://vite.dev/guide/
- React documentation: https://react.dev/
- Zustand repository/documentation: https://github.com/pmndrs/zustand
- TanStack Virtual documentation: https://tanstack.com/virtual/latest
- Vitest guide: https://vitest.dev/guide/
- Playwright documentation: https://playwright.dev/docs/intro
- WebdriverIO documentation: https://webdriver.io/docs/gettingstarted
- notify crate: https://docs.rs/notify/latest/notify/
- encoding_rs crate: https://docs.rs/encoding_rs/latest/encoding_rs/
- chardetng crate: https://docs.rs/chardetng/latest/chardetng/
