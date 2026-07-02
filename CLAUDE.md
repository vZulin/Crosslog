# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Crosslog is a cross-platform log analysis workspace for comparing multiple log files side by side with time-based synchronization. It runs as both a Desktop app (Tauri 2 + Rust) and browser app (Web) from a shared codebase.

## Development Commands

### Setup
```bash
corepack pnpm install
```

### Development
```bash
corepack pnpm dev:web          # Run web app
corepack pnpm dev:desktop      # Run desktop app
```

### Testing
```bash
corepack pnpm lint                    # ESLint
corepack pnpm test:unit               # Unit tests (Vitest)
corepack pnpm test:integration        # Integration tests (Vitest)
corepack pnpm test:ui:web             # Browser UI tests (Playwright)
corepack pnpm test:ui:desktop         # Desktop UI tests (WebdriverIO)
corepack pnpm bench                   # Performance benchmarks

# Rust tests
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml

# OS-specific test scripts
bash scripts/macos/test.sh
bash scripts/macos/test-ui.sh
bash scripts/linux/test.sh
bash scripts/windows/test.ps1
```

### Building
```bash
corepack pnpm build:web        # Build web app
corepack pnpm build:desktop    # Build desktop app

# OS-specific build scripts
bash scripts/macos/build.sh
bash scripts/linux/build.sh
bash scripts/windows/build.ps1
```

### Running Individual Tests
```bash
# Run specific unit test file
corepack pnpm vitest run packages/core/tests/log-pane/log-pane-reducer.test.ts

# Run specific UI test
corepack pnpm playwright test apps/web/tests/ui/some-test.spec.ts

# Run tests in watch mode
corepack pnpm vitest packages/core/tests
```

## Architecture Overview

### Monorepo Structure

This is a **pnpm workspace monorepo** with clear separation of concerns:

```
apps/
├── web/          Web shell (Vite + React)
└── desktop/      Desktop shell (Tauri 2 + Rust)

packages/
├── core/         Pure TypeScript domain logic (no React/framework dependencies)
├── platform/     Platform abstraction layer (Browser & Tauri adapters)
└── ui/           React UI components and UI state (Zustand stores)

tests/
├── fixtures/     Test data
├── integration/  Integration tests
└── performance/  Benchmark tests
```

### Package Import Aliases

Use TypeScript path aliases for cross-package imports:
```typescript
import { LogPane, logPaneReducer } from "@crosslog/core";
import { CrosslogPlatform } from "@crosslog/platform";
import { AppShell } from "@crosslog/ui";
```

### Core Architecture Principles

1. **Platform Independence**: Same domain logic and UI run on both web and desktop
2. **Ports Pattern**: Platform-specific behavior is abstracted behind interfaces in `packages/platform`
3. **Pure Domain Logic**: `packages/core` contains pure TypeScript with no React or I/O dependencies
4. **Reducer Pattern**: State management uses reducers for pane state and Zustand stores for UI state
5. **Immutability**: All types use `readonly` modifiers; state updates create new objects

## Key Domain Concepts

| Concept | Location | Purpose |
|---------|----------|---------|
| **Pane** | `packages/core/src/log-pane/` | Container for a single log view; managed via reducer |
| **Source** | `packages/core/src/file-source/`, `packages/core/src/directory/` | Log content (file or directory) |
| **Session** | `packages/core/src/session/` | Serializable workspace state for persistence |
| **Synchronization** | `packages/core/src/sync/` | Align multiple logs by timestamp |
| **Search** | `packages/core/src/search/` | Find text/regex in log content |
| **Timestamps** | `packages/core/src/timestamps/` | Parse and recognize timestamp formats |
| **File Lifecycle** | `packages/core/src/file-source/file-lifecycle.ts` | Track file deletions/replacements |

## Platform Abstraction Layer

The platform layer uses the **Ports Pattern** to abstract runtime-specific capabilities:

### Core Port Interfaces
- `CrosslogPlatform` - Main platform interface injected at app root
- `FileAccessPort` - File reading and decoding
- `DirectoryAccessPort` - Directory listing and navigation
- `SessionStorePort` - Session persistence (localStorage on web, file on desktop)
- `SourcePickerPort` - File/directory picker UI
- `DragDropSourcePort` - Drag-and-drop file handling

### Platform Implementations
- **Browser** (`packages/platform/src/browser/`): Uses File API, IndexedDB, localStorage
- **Tauri** (`packages/platform/src/tauri/`): Uses Tauri IPC to Rust commands

### Capability Reporting
Platforms report their capabilities via `CapabilityReport`:
```typescript
platform.capabilities = {
  canWatchFiles: boolean,
  canDiscoverNewDirectoryFiles: boolean,
  limitations: string[]  // Browser reports unsupported features here
}
```

## UI Architecture

### Design Mockups
The project's UI mockups are stored in Figma: https://www.figma.com/design/ElnRrprtGhFDaM9YpHHsWr/Crosslog-Log-Viewer-UI-Design?node-id=11-2&t=yzFkScnVybTC8vWz-0

### Component Organization
- `packages/ui/src/app-shell/` - Main application container (`AppShell.tsx`)
- `packages/ui/src/pane-rail/` - Pane layout and resizing
- `packages/ui/src/log-pane/` - Log viewing components with virtualization
- `packages/ui/src/search/` - Search UI and state management
- `packages/ui/src/sync/` - Synchronization controls
- `packages/ui/src/session/` - Session restore banner

### State Management
- **Reducers** for core state transitions: `logPaneReducer` in `packages/core`
- **Zustand stores** for UI state:
  - `usePaneSearchStore()` - Per-pane search state
  - `useSynchronizationStore()` - Global sync coordination

### Virtualization
Uses TanStack Virtual for efficient rendering of large log files:
```typescript
// VirtualLogViewport uses TanStack Virtual
import { useVirtualizer } from "@tanstack/react-virtual";
```

## Testing Patterns

### Test Organization
- **Unit tests**: `packages/*/tests/` - Pure logic testing
- **Integration tests**: `tests/integration/` - End-to-end domain logic
- **Performance tests**: `tests/performance/` - Benchmark time-critical operations
- **UI tests (web)**: `apps/web/tests/ui/` - Playwright browser tests
- **UI tests (desktop)**: `apps/desktop/tests/ui/` - WebdriverIO tests

### Contract Tests
The platform layer uses **contract tests** to ensure browser and Tauri implementations behave identically:
```typescript
// packages/platform/tests/ports/platform-ports.contract.test.ts
// Single test suite runs against both browser and Tauri platforms
```

### UI Test Bridge
The `UiTestBridge` port allows test harnesses to drive app state and collect evidence:
```typescript
platform.uiTestBridge?.publishTestEvidence({
  kind: "ui-metrics",
  data: { ... }
});
```

### Test Data
Use fixtures from `tests/fixtures/` for consistent test data across unit, integration, and UI tests.

## Rust/Tauri Integration

Desktop platform adapters call Rust commands via Tauri IPC:

### Rust Command Structure
```
apps/desktop/src-tauri/src/
├── commands/          Tauri commands invoked from TypeScript
│   ├── file.rs       File reading, encoding detection
│   ├── directory.rs  Directory listing
│   ├── session.rs    Session persistence
│   └── watcher.rs    File watching
├── events/            Tauri events emitted to frontend
└── lib.rs            Main Tauri app setup
```

### Calling Rust from TypeScript
```typescript
// packages/platform/src/tauri/TauriFileAccess.ts
import { invoke } from "@tauri-apps/api/core";

const result = await invoke<ReadFileResult>("read_file", {
  path: sourceRef.path,
  encoding: encodingChoice
});
```

## Code Style Guidelines

### Separation of Concerns
- Keep business logic in `packages/core` (pure TypeScript, no React)
- Put platform-specific behavior behind ports in `packages/platform`
- UI components in `packages/ui` should be platform-agnostic

### Immutability and Type Safety
- Use `readonly` modifiers on all types
- Prefer discriminated unions for result types:
  ```typescript
  type Result<T> =
    | { ok: true; value: T }
    | { ok: false; error: CrosslogError };
  ```

### Security Boundaries
- Treat opened logs as **read-only input**
- Render log content as **inert text** (never as HTML, links, or executable code)
- Never write files beside opened logs

### Session Persistence
- Browser: Uses IndexedDB (via `BrowserSessionStore`)
- Desktop: Uses application data directory (via `TauriSessionStore`)
- Session schema version: `CURRENT_SESSION_SCHEMA_VERSION = 1` (supports future migrations)

## Common Development Tasks

### Adding a New Core Feature
1. Add pure logic to `packages/core/src/<feature>/`
2. Export public API from `packages/core/src/index.ts`
3. Add unit tests to `packages/core/tests/<feature>/`
4. Update UI components in `packages/ui/src/` if needed

### Adding Platform-Specific Behavior
1. Define port interface in `packages/platform/src/index.ts`
2. Implement for browser in `packages/platform/src/browser/`
3. Implement for Tauri in `packages/platform/src/tauri/`
4. Add Rust command in `apps/desktop/src-tauri/src/commands/` if needed
5. Add contract tests in `packages/platform/tests/ports/`

### Adding a UI Component
1. Create component in `packages/ui/src/<feature>/`
2. Export from `packages/ui/src/index.ts`
3. Add test IDs (`data-testid`) for UI testing
4. Add snapshot tests in `packages/ui/tests/`

### Running Tests During Development
```bash
# Watch mode for rapid iteration
corepack pnpm vitest packages/core/tests

# Run specific test file
corepack pnpm vitest run packages/core/tests/log-pane/log-pane-reducer.test.ts

# Debug UI tests
corepack pnpm playwright test --debug
```

## Key Files for Onboarding

Start with these files to understand the architecture:

1. **Project overview**: `/README.md`
2. **Domain types**: `packages/core/src/index.ts`
3. **Platform ports**: `packages/platform/src/index.ts`
4. **App bootstrap**: `apps/web/src/App.tsx`
5. **Main container**: `packages/ui/src/app-shell/AppShell.tsx`
6. **Pane state**: `packages/core/src/log-pane/log-pane-reducer.ts`
7. **Sync algorithm**: `packages/core/src/sync/synchronization-engine.ts`
8. **Search logic**: `packages/core/src/search/search-engine.ts`

## Important Notes

- **Always use `corepack pnpm`** (not global `pnpm`) to ensure correct version
- **Package manager**: pnpm 9.15.4 (managed via Corepack)
- **TypeScript**: 5.x with strict mode enabled
- **React**: 19.x
- **Tauri**: 2.x
- **Test runner**: Vitest for unit/integration, Playwright for web UI, WebdriverIO for desktop UI
- **No remote log access** in MVP - files are opened explicitly by user
- **No filtering/highlighting UI** in MVP - extension points exist for future features
