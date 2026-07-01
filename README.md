# Crosslog

Crosslog is a cross-platform log analysis workspace for comparing multiple log
files side by side and navigating them by time. It is intended for debugging
distributed systems where related events are written into separate files,
rotated files, or directory-based log sets.

## What It Does

- Opens multiple log files or top-level log directories in independent panes.
- Keeps panes visible side by side with resize, close, split, and horizontal
  scrolling behavior.
- Synchronizes time-aware panes by timestamp so related events line up across
  logs.
- Searches full loaded log content per pane with text, regular expression, and
  case-sensitive modes.
- Follows active Desktop logs as they append, and keeps already loaded content
  visible when a file is deleted or replaced.
- Restores analysis sessions without restoring scroll positions.
- Runs as both a Desktop app for Windows, macOS, and Linux, and as a browser
  version with explicit browser capability limits.

## Product Boundaries

Crosslog treats opened logs as read-only input. Log text is rendered as inert
text and is never interpreted as HTML, terminal control sequences, shell
commands, or links.

The MVP intentionally does not include remote log access, a file manager,
recursive directory search, filtering, highlighting, or saved filter/highlight
sets. The codebase keeps extension points for future filtering and highlighting
without exposing inactive controls in the UI.

## Architecture

The project is a shared Web/Desktop monorepo:

- `packages/core`: pure TypeScript domain logic for panes, file lifecycle,
  directories, timestamps, synchronization, search, session schema, and file
  open policy.
- `packages/ui`: reusable React UI components and UI state bindings.
- `packages/platform`: browser and Tauri adapter bindings behind explicit
  platform ports.
- `apps/web`: Vite Web shell.
- `apps/desktop`: Tauri 2 Desktop shell and Rust filesystem/session/watch
  commands.

Desktop-specific filesystem behavior stays behind Tauri/Rust adapters. Web
adapters report unsupported local monitoring behavior instead of simulating it.

## Tech Stack

- TypeScript 5, React, Vite, Zustand, and TanStack Virtual.
- Tauri 2 and Rust for Desktop platform integration.
- Vitest for unit, integration, and performance tests.
- Playwright for Web UI tests.
- WebdriverIO/tauri-driver for Windows/Linux Desktop UI tests.
- macOS XCTest/Accessibility harness for macOS Desktop UI tests.

## Getting Started

Use Corepack-provided pnpm; a global `pnpm` installation is not required.

Install dependencies:

```bash
corepack pnpm install
```

Run the Web app:

```bash
corepack pnpm dev:web
```

Run the Desktop app:

```bash
corepack pnpm dev:desktop
```

## Common Commands

```bash
corepack pnpm lint
corepack pnpm test:unit
corepack pnpm test:integration
corepack pnpm test:ui:web
corepack pnpm test:ui:desktop
corepack pnpm bench
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml
```

OS-specific wrappers are available under `scripts/windows`, `scripts/macos`,
and `scripts/linux`.

## Repository Layout

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
└── performance/

scripts/
├── windows/
├── macos/
└── linux/

specs/
└── 001-multi-log-analysis/
```
