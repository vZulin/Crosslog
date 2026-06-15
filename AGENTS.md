# Crosslog Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-06-15

## Active Technologies

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
- `cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml`

## Code Style

- Keep business logic in shared packages and platform-specific behavior behind
  explicit ports.
- Treat opened logs as read-only input and render log content as inert text.
- Preserve expected test results unless the underlying requirement changes.

## Recent Changes

- 001-multi-log-analysis: Added Crosslog MVP planning for shared Web/Desktop
  log analysis, Tauri 2 Desktop adapters, React UI, strict test gates, and
  cross-platform build/test scripts with OS-specific Desktop UI automation.

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
