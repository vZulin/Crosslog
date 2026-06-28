# Crosslog Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-06-28

## Active Technologies
- TypeScript 5.x for shared UI/domain code; React 19; Rust 1.77+ stable for
  Tauri 2 adapters; Node.js 22 in CI; pnpm 9.15.4 via Corepack.
- Current UI/runtime stack remains React, Vite, Zustand, TanStack Virtual,
  Tauri 2, Vitest, Playwright, WebdriverIO, Rust `notify`, `encoding_rs`, and
  `chardetng`; the redesign uses reviewed local SVG icons instead of a new UI
  or icon dependency. (002-redesign-activity-rail)
- Browser session state remains in IndexedDB; Desktop session snapshots remain
  in the application data directory; no state is written beside opened logs.
  (002-redesign-activity-rail)
- Activity Rail release readiness requires final viewport/no-overlap,
  accessibility, performance, local macOS, and GitHub Actions Windows/macOS/Linux
  automated plus UI/E2E validation. (002-redesign-activity-rail)
- macOS UI design alignment keeps the existing React/Vite/Zustand/TanStack
  Virtual/Tauri 2 stack with no new UI kit, parser, backend, or platform adapter
  dependency. (003-macos-ui-design-alignment)
- UI alignment reuses existing IndexedDB and Desktop application-data session
  storage; pane widths remain persisted as desired widths while right-edge fill
  widths are view-computed. (003-macos-ui-design-alignment)

- TypeScript 5.x for shared domain/UI and Web shell; Rust stable compatible with
  Tauri 2 for Desktop adapters; Node.js active LTS for tooling.
- Tauri 2; Vite; React; Zustand; TanStack Virtual; Vitest; Playwright;
  WebdriverIO; tauri-driver; macOS XCTest/Accessibility UI harness; notify;
  encoding_rs; chardetng.
- Browser IndexedDB for Web session state; Desktop application data directory
  for crash-safe session snapshots; user-provided timestamp config file loaded
  read-only.

## Project Structure

```text
apps/
├── web/
└── desktop/

packages/
├── core/
├── platform/
└── ui/

tests/
├── fixtures/
├── integration/
├── performance/
└── ui/

scripts/
├── windows/
├── macos/
└── linux/
```

## Commands

- `pnpm lint`
- `pnpm test:unit`
- `pnpm test:integration`
- `pnpm test:ui:web`
- `pnpm test:ui:desktop`
- `pnpm bench`
- `bash scripts/macos/test.sh`
- `bash scripts/macos/test-ui.sh`
- `bash scripts/macos/perf.sh`
- `bash scripts/macos/build.sh`
- `cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml`

## Code Style

- Keep business logic in shared packages and platform-specific behavior behind
  explicit ports.
- Treat opened logs as read-only input and render log content as inert text.
- Preserve expected test results unless the underlying requirement changes.

## Recent Changes
- 003-macos-ui-design-alignment: Planned the delta UI alignment for updated
  mockups, including theme/platform shell variants, obsolete-control removal,
  pane right-edge alignment, drag resize, compact popovers, and test migration.
- 002-redesign-activity-rail: Completed final Activity Rail redesign polish with
  viewport/no-overlap coverage, accessibility assertions, usability walkthrough
  protocol, performance reference methodology, local macOS gates, and required
  GitHub Actions release validation.

- 002-redesign-activity-rail: Planned the Activity Rail UI redesign using the
  current shared React/Tauri stack, Figma mockup audit, UI contract updates, and
  required Windows/macOS/Linux UI/E2E CI gates.

- 001-multi-log-analysis: Added Crosslog MVP planning for shared Web/Desktop
  log analysis, Tauri 2 Desktop adapters, React UI, strict test gates, and
  cross-platform build/test scripts with OS-specific Desktop UI automation.

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
