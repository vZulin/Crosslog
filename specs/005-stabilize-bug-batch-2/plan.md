# Implementation Plan: Crosslog Bug Batch 2 Stabilization

**Branch**: `005-stabilize-bug-batch-2` | **Date**: 2026-07-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/Users/Vladimir.Zulin/projects/idea/Crosslog/specs/005-stabilize-bug-batch-2/spec.md`

## Summary

Stabilize the Crosslog Web and Desktop apps by fixing the complete 7-item bug
batch in `/Users/Vladimir.Zulin/projects/idea/Crosslog/docs/Bugs_2.txt`. The
implementation is a minimal delta over the current React 19 / Vite / Zustand,
hand-rolled virtualized log viewport, Tauri 2, shared `packages/core`,
`packages/ui`, and `packages/platform` architecture. Business rules stay in
`packages/core`, shared UI in `packages/ui`, and platform-specific file access,
directory access, source picking, and drag-and-drop stay behind the existing
platform ports; app-shell changes are limited to adapter wiring.

Behavior from `specs/001-multi-log-analysis`, `specs/002-redesign-activity-rail`,
`specs/003-macos-ui-design-alignment`, and `specs/004-stabilize-bug-batch` is
preserved unless a numbered bug in `docs/Bugs_2.txt` explicitly supersedes it.
Bugs 2 (Desktop picker), 3 (Desktop drag-and-drop), and 5 (viewport vertical
scroll) are treated as regressions of `specs/004-stabilize-bug-batch` and are
diagnosed on the Desktop/Tauri path first.

No new dependencies are planned. The Tauri dialog plugin
(`@tauri-apps/plugin-dialog`) is already registered, so bug 2 is expected to be a
capability/permission or wiring defect, not a missing dependency. Bug 3 requires a
native Tauri drag-drop event path (Rust side plus a rewrite of
`tauri-drag-drop-source.ts`, which currently reads a DOM `DragEvent` that Tauri
does not deliver). If a native picker or drag-drop capability genuinely cannot be
reached through the existing platform ports and current dependencies,
implementation MUST stop and request approval before adding anything. Source
reveal actions and file-management operations remain out of scope.

## Technical Context

**Language/Version**: TypeScript 5.x for shared UI/domain code; React 19; Rust 1.77+ stable for Tauri 2 adapters; Node.js 22 in CI; pnpm 9.15.4 via Corepack.
**Primary Dependencies**: Existing dependencies only: React, React DOM, Vite, Zustand, Tauri 2 with `@tauri-apps/plugin-dialog`, Vitest, Playwright, WebdriverIO/tauri-driver, Rust `notify`, `encoding_rs`, and `chardetng`. No new UI kit, icon package, drag-drop library, dialog dependency, parser, or platform adapter dependency is planned.
**Storage**: Existing Browser IndexedDB and Desktop application-data session storage remain the only application-owned persisted storage; no state is written beside opened logs. Theme resolution (System/Light/Dark) from `specs/004` is unchanged; only the dark-theme color *values* are corrected.
**Testing**: Vitest for unit/component/contract tests; cargo test for Rust adapters; Playwright for Web UI/E2E; WebdriverIO/tauri-driver for Desktop UI/E2E; macOS XCTest for macOS Desktop UI.
**Target Platform**: Browser Web plus Desktop on Windows, macOS, and Linux.
**Project Type**: Shared Web/Desktop application bug-fix stabilization.
**Shared Codebase Strategy**: Keep business rules in `packages/core`, shared UI in `packages/ui`, and platform interfaces/adapters in `packages/platform`. Do not duplicate source-opening, drag-drop, scroll, reorder, theme, or icon rules across app shells.
**Platform Interfaces**: Use the existing explicit ports — `SourcePickerPort`, `DirectoryAccessPort`, `DragDropSourcePort`, `FileAccessPort`, `SessionStorePort`, capabilities, and UI test bridge. Platform-specific source selection and drag-drop remain behind those ports.
**OS Build Scripts**: Windows `pwsh scripts/windows/build.ps1`; macOS `bash scripts/macos/build.sh`; Linux `bash scripts/linux/build.sh`.
**OS Automated Test Scripts**: Windows `pwsh scripts/windows/test.ps1 (js|rust)`; macOS `bash scripts/macos/test.sh`; Linux `bash scripts/linux/test.sh`.
**OS UI Test Scripts**: Windows `pwsh scripts/windows/test-ui.ps1 (web|desktop)`; macOS `bash scripts/macos/test-ui.sh (web|desktop)`; Linux `bash scripts/linux/test-ui.sh (web|desktop)`.
**Read-Only/Security Model**: Opened log files remain read-only. Log content, source names, and dropped/selected paths are rendered and processed as inert data; no command, link, script, escape sequence, or instruction from logs is executed.
**Session Recovery Model**: Existing crash-safe session restore remains in force. Fixes must not weaken recovery of panes, pane order, opened sources, selected directory files, synchronization state, and offsets.
**Performance Goals**: Preserve existing benchmark thresholds for the affected rendering/scroll path (`tests/performance/log-pane-virtualization.bench.ts`) and any source/session path touched. Vertical-scroll fixes MUST keep virtualization performance within existing benchmark gates; dark-theme, icon-centering, reorder, and picker/drag-drop fixes have no expected measurable performance impact.
**Constraints**: Do not broaden scope beyond `docs/Bugs_2.txt`. No remote sources, source-reveal actions, file-management operations, filtering, configurable highlighting, bookmarks, saved filter sets, recursive directory search, new UI kits, new icon packages, parser rewrites, backend services, or platform-adapter rewrites beyond what the seven bugs require.
**Scale/Scope**: One bug-fix batch across Desktop theme, Desktop source picker, Desktop drag-and-drop, Web directory opening, log viewport vertical scroll, pane-header drag-reorder, and icon centering.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- PASS: Technology stack is explicitly selected and unchanged.
- PASS: No new dependency is planned; any dependency need (e.g., if a native
  drag-drop capability cannot be reached) must request approval before proceeding.
- PASS: Web and Desktop use one shared codebase; business behavior stays in
  shared modules.
- PASS: Platform-specific source selection, directory access, and drag-drop remain
  behind explicit ports/adapters.
- PASS: Build, automated test, and UI test scripts are defined for Windows,
  macOS, and Linux.
- PASS: Every development phase below includes targeted tests and phase gates.
- PASS: Every stabilization user scenario has mapped UI/E2E coverage, and
  OS-specific Desktop behavior runs on the corresponding target OS.
- PASS: Expected test results are derived from the spec and bug report, not the
  current broken implementation behavior.
- PASS: Opened logs remain read-only and inert.
- PASS: Session recovery remains protected.
- PASS: The affected rendering/scroll path keeps its existing benchmark gate.

## Project Structure

### Documentation (this feature)

```text
/Users/Vladimir.Zulin/projects/idea/Crosslog/specs/005-stabilize-bug-batch-2/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── ui-behavior.md
│   └── test-automation.md
├── checklists/
│   └── requirements.md
└── tasks.md            # created by /speckit-tasks, not this command
```

### Source Code (repository root)

```text
apps/
├── web/                 # Browser shell + Web Playwright UI tests
│   └── src/platform/    # createWebPlatform.ts, browserFileSources.ts
└── desktop/             # Tauri shell, WDIO + macOS XCTest UI tests
    ├── src/platform/    # createDesktopPlatform.ts
    └── src-tauri/       # Rust: lib.rs, events/, tauri.conf.json, capabilities

packages/
├── core/                # Shared pane, layout, scroll, session rules
├── platform/            # Ports + browser/tauri adapters (picker, directory, drag-drop)
│   ├── src/ports/       # source-picker-port, directory-access-port, drag-drop-source-port
│   ├── src/browser/     # browser-source-picker, browser-directory-access
│   └── src/tauri/       # tauri-source-picker, tauri-drag-drop-source
└── ui/                  # Shared shell, panes, viewport, icons, theme CSS
    └── src/app-shell/   # activity-rail-theme.css, IconButton, shellPresentation

tests/
├── integration/         # directory-access contract, read-only/inert safety
└── performance/         # log-pane-virtualization benchmark

scripts/
├── windows/  macos/  linux/   # test / test-ui / build / perf per OS
```

**Structure Decision**: Use the current monorepo and shared Web/Desktop
structure. Implement product rules once in shared packages, use existing platform
ports for platform-specific operations, and limit app-shell changes to adapter
wiring and, for bug 3, a new Tauri/Rust drag-drop event path behind the existing
`DragDropSourcePort`.

## Complexity Tracking

No constitution violations are planned. If bug 3 cannot be implemented through the
existing `DragDropSourcePort` and current Tauri capabilities without a new
dependency, that need MUST be recorded here and approved before implementation.

## Bug-To-Requirement Traceability

| Bug | Spec requirements | Planned work | Planned tests |
| --- | --- | --- | --- |
| 1 Desktop dark theme does not match mockups | FR-016, FR-017, FR-019 | Reconcile the `[data-theme="dark"]` token block in `packages/ui/src/app-shell/activity-rail-theme.css` to the authoritative dark values from `docs/mockups/crosslog-macos-redesign-mockups.html` ("Screen / Draft Layout - Activity Rail", dark variant); do not touch `:root` light values or `shellPresentation.ts` resolution logic. | Update `packages/ui/tests/app-shell/theme-variants.test.tsx`; add dark-token-value assertions; extend `apps/desktop/tests/ui/settings-theme.spec.ts` and `apps/desktop/tests/ui/macos/SettingsThemeUITests.swift` with dark-theme color checks; keep `apps/web/tests/ui/settings-theme.spec.ts` green. |
| 2 Desktop add-pane/open-source does not open picker (regression of 004) | FR-003, FR-004, FR-005 | Diagnose Desktop/Tauri path first: verify `tauri_plugin_dialog` capability/permissions in `apps/desktop/src-tauri/tauri.conf.json` and `gen/schemas/capabilities.json`, and the `TauriSourcePicker.pickFiles/pickDirectory` (`packages/platform/src/tauri/tauri-source-picker.ts`) wiring through `createDesktopPlatform.ts` and `AppShell.tsx` add-pane handlers. Fix the broken link (permission/capability or adapter). | Update `packages/platform/tests/tauri/tauri-source-picker.test.ts`; extend `apps/desktop/tests/ui/source-loading.spec.ts` for picker open/cancel/selected-file/selected-directory; add macOS XCTest source-loading coverage if user-visible. |
| 3 Desktop drag-and-drop does nothing (regression of 004) | FR-006, FR-007, FR-009 | Add a native Tauri drag-drop event path: emit drag-drop events from Rust (`apps/desktop/src-tauri/src/lib.rs`, `src/events/`) or subscribe via `getCurrentWebview().onDragDropEvent`, enable `dragDropEnabled` in `tauri.conf.json`, and rewrite `packages/platform/src/tauri/tauri-drag-drop-source.ts` to consume native drop payloads instead of DOM `DragEvent.dataTransfer`. Keep the `DragDropSourcePort` contract. | Update `packages/platform/tests/tauri/tauri-drag-drop-source.test.ts`; add a Desktop WDIO drag-drop spec and macOS XCTest drop coverage (new); keep `apps/web/tests/ui/browser-drag-drop.spec.ts` green. |
| 4 Web cannot open a directory | FR-008, FR-009 | Confirm/repair `BrowserSourcePicker.pickDirectory` (`webkitdirectory`/`directory` attributes) and `BrowserDirectoryAccess` so the Web add-pane/open-source flow offers and opens directories, reporting a capability limitation where the browser lacks support. | Update `packages/platform/tests/browser/browser-source-picker.test.ts`, `browser-directory-access.test.ts`, `tests/integration/directory-access.contract.test.ts`; extend `apps/web/tests/ui/directory-navigation.spec.ts` and `browser-capabilities.spec.ts` for directory opening. |
| 5 Vertical scroll moves scrollbar but not text (regression of 004) | FR-010, FR-011, FR-012 | Fix the hand-rolled virtualization in `packages/ui/src/log-pane/VirtualLogViewport.tsx` so the rendered slice/offset (transform) updates with the scroll position; verify `LogPane.tsx` scroll container and sync propagation via `useSynchronizationStore.ts`. | Update `packages/ui/tests/log-pane/virtual-log-viewport.test.tsx` (text advances on scroll, first/last line reachable); keep `tests/performance/log-pane-virtualization.bench.ts` within gates; extend `apps/web/`, `apps/desktop/` `synchronized-scrolling.spec.ts` and `SynchronizedScrollingUITests.swift`. |
| 6 Pane reorder only from handle button | FR-013, FR-014, FR-015 | Make the whole `PaneHeader.tsx` a drag origin (bind pointer-down on the header, generalize `onReorderDragStart` off the button-only handler) while excluding interactive controls (search, close, offset, directory nav) from starting a drag; preserve `PaneRail.tsx` midpoint-threshold reorder logic. | Update `packages/ui/tests/pane-rail/pane-layout.test.tsx`, `pane-workspace-alignment.test.tsx`, and pane-header unit tests; extend `apps/web/`, `apps/desktop/` `multi-pane-layout.spec.ts` and `MultiPaneLayoutUITests.swift` for header-anywhere drag plus control-click-does-not-drag. |
| 7 Icons not centered in hover zone | FR-018, FR-019 | Correct icon centering in `packages/ui/src/app-shell/activity-rail-theme.css` for `.crosslog-icon-button`, `.crosslog-activity-rail`, `.crosslog-sync-toggle`, `.crosslog-pane-header__drag-handle`, and search-popover arrow controls; align icon `viewBox`/box sizing in `icons.tsx` where needed. Covers sync toggle, add-pane, close-pane, activity-rail icons, and search arrows. | Update `packages/ui/tests/app-shell/icon-button-accessibility.test.tsx`, `redesigned-shell-final-a11y.test.tsx`, `packages/ui/tests/search/pane-search-popover.test.tsx`, `packages/ui/tests/sync/redesigned-sync-controls.test.tsx`; add icon-centering assertions; extend `redesigned-shell-viewports.spec.ts` (Web/Desktop) and `RedesignedShellViewportUITests.swift`. |

## Test Inventory

### Existing Tests That Remain Valid And Unchanged

- `packages/core/tests/**` domain tests (directory, encoding, file-source,
  session, timestamps, search, sync) remain valid; these bugs are UI/platform
  concerns. Add core tests only if a fix requires a new core rule.
- `packages/platform/tests/browser/browser-file-access*`, session, and
  file-watcher tests remain valid unless a picker/directory contract is extended.
- `tests/integration/read-only-file-safety.test.ts` and the log-content-inert
  safety tests remain valid and must continue to pass.
- `tests/performance/log-pane-virtualization.bench.ts` remains the regression gate
  for bug 5; it is reused, not rewritten, and must stay within its thresholds.
- `apps/web/tests/ui/settings-theme.spec.ts` remains valid for light theme and
  theme selection; only dark-value assertions are added.
- `apps/web/tests/ui/browser-drag-drop.spec.ts` remains valid for the Web drop
  flow; the Desktop drop path is added separately.

### Existing Tests That Must Be Updated (encode wrong expected behavior or need new assertions)

- `packages/ui/tests/app-shell/theme-variants.test.tsx`,
  `shell-presentation.test.tsx`: add authoritative dark-theme token-value
  assertions (Bug 1).
- `packages/platform/tests/tauri/tauri-source-picker.test.ts`: assert the picker
  opens and returns the selected file/directory or cancels cleanly (Bug 2).
- `packages/platform/tests/tauri/tauri-drag-drop-source.test.ts`: replace the
  DOM `DragEvent` expectation with native Tauri drop-payload mapping (Bug 3).
- `packages/platform/tests/browser/browser-source-picker.test.ts`,
  `browser-directory-access.test.ts`,
  `tests/integration/directory-access.contract.test.ts`: assert Web directory
  selection/opening in addition to file opening (Bug 4).
- `packages/ui/tests/log-pane/virtual-log-viewport.test.tsx`: assert rendered
  text advances with scroll position and first/last line reachability (Bug 5).
- `packages/ui/tests/pane-rail/pane-layout.test.tsx`,
  `pane-workspace-alignment.test.tsx`, and pane-header unit tests
  (`pane-lifecycle-header.test.tsx`, `file-pane-header.test.tsx`,
  `directory-pane-header.test.tsx`): assert drag start from a non-control header
  region and that control clicks do not start a drag (Bug 6).
- `packages/ui/tests/app-shell/icon-button-accessibility.test.tsx`,
  `redesigned-shell-final-a11y.test.tsx`, `redesigned-shell-responsive.test.tsx`,
  `packages/ui/tests/search/pane-search-popover.test.tsx`,
  `packages/ui/tests/sync/redesigned-sync-controls.test.tsx`,
  `synchronization-controls.test.tsx`: add icon-centering-within-hover-zone
  assertions (Bug 7).
- `apps/desktop/tests/ui/settings-theme.spec.ts` and
  `apps/desktop/tests/ui/macos/SettingsThemeUITests.swift`: add dark-theme color
  checks (Bug 1).
- `apps/desktop/tests/ui/source-loading.spec.ts`: add picker
  open/cancel/selected-file/selected-directory coverage (Bug 2).
- `apps/web/tests/ui/directory-navigation.spec.ts`,
  `browser-capabilities.spec.ts`: add directory opening coverage (Bug 4).
- `apps/web/tests/ui/synchronized-scrolling.spec.ts`,
  `apps/desktop/tests/ui/synchronized-scrolling.spec.ts`,
  `apps/desktop/tests/ui/macos/SynchronizedScrollingUITests.swift`: add
  "text moves on vertical scroll" assertions (Bug 5).
- `apps/web/tests/ui/multi-pane-layout.spec.ts`,
  `apps/desktop/tests/ui/multi-pane-layout.spec.ts`,
  `apps/desktop/tests/ui/macos/MultiPaneLayoutUITests.swift`: add header-anywhere
  drag reorder and control-click-does-not-drag coverage (Bug 6).
- `apps/web/tests/ui/redesigned-shell-viewports.spec.ts`,
  `apps/desktop/tests/ui/redesigned-shell-viewports.spec.ts`,
  `apps/desktop/tests/ui/macos/RedesignedShellViewportUITests.swift`: add
  icon-centering checks for the covered icons (Bug 7).

### Dual Test Execution Modes (FR-028)

Where a scenario cannot be verified fully automatically on macOS (notably Desktop
drag-and-drop, Bug 3), the suite provides two modes:

- **Automatic mode (default)**: contains only automatable tests; run by the
  standard `scripts/macos/test.sh` / `test-ui.sh` gates and by CI. Must not
  depend on manual confirmation.
- **Manual/interactive mode (opt-in)**: a dedicated script (e.g.
  `scripts/macos/test-ui-manual.sh`) that auto-launches the Desktop app, prints
  the ordered actions the tester must perform, and waits for a pass/fail
  confirmation. Never runs in CI or blocks the automatic gates.

### New Tests Required For Uncovered Scenarios

- Dark-theme-matches-mockup value assertions comparing resolved dark tokens to the
  authoritative values in `docs/mockups/crosslog-macos-redesign-mockups.html`
  (component + Desktop UI).
- Desktop drag-and-drop coverage (Bug 3): automatable portions via WDIO/unit; the
  OS-level native drop is verified through the manual/interactive mode when it
  cannot be automated on macOS.
- A manual-mode runner script that launches the app, prints tester steps, and
  captures pass/fail confirmation.
- macOS XCTest source-loading picker coverage if not already present (Bug 2).
- Icon-centering assertions (bounding-box centering within the hover highlight
  zone) for sync toggle, add-pane, close-pane, activity-rail icons, and
  search-popover arrows (Bug 7).
- Vertical-scroll "text moves" component test isolating the viewport transform
  from the scrollbar position (Bug 5).

## Implementation Phases

### Phase 0: Research And Audit

Output `research.md`. Confirm: dark-theme authoritative token source and the exact
dark values to apply; root cause of the Desktop picker regression (capability vs.
wiring); the native Tauri drag-drop approach for bug 3; the viewport
transform/offset defect for bug 5; the header drag-origin approach that still
protects interactive controls for bug 6; the icon-centering CSS strategy for bug
7; and the Web directory-opening path for bug 4. Record the test-migration rules.

### Phase 1: Design Artifacts And Contracts

Output `data-model.md`, `contracts/ui-behavior.md`,
`contracts/test-automation.md`, and `quickstart.md`. Re-check constitution gates
after these artifacts are written.

### Phase 2: Desktop Dark Theme (Bug 1)

Correct the `[data-theme="dark"]` token values to the authoritative mockups
without changing light values or theme resolution. Targeted tests:
`theme-variants.test.tsx`, Desktop/macOS settings-theme UI tests.

### Phase 3: Desktop Source Picker And Drag-And-Drop (Bugs 2, 3)

Fix the Desktop picker (capability/permission/wiring), then add the native Tauri
drag-drop event path and rewrite the drag-drop adapter behind `DragDropSourcePort`.
Targeted tests: `tauri-source-picker.test.ts`, `tauri-drag-drop-source.test.ts`,
Desktop WDIO source-loading and drag-drop specs, macOS XCTest coverage. If a
native drag-drop capability cannot be reached without a new dependency, stop and
request approval.

### Phase 4: Web Directory Opening (Bug 4)

Ensure the Web source flow offers and opens directories and reports a capability
limitation where unsupported. Targeted tests: browser source-picker/directory
unit tests, directory-access contract test, Web directory-navigation and
capabilities UI tests.

### Phase 5: Viewport Vertical Scroll (Bug 5)

Fix the viewport so rendered text advances with scroll position and first/last
lines are reachable; preserve synchronization semantics. Targeted tests:
`virtual-log-viewport.test.tsx`, synchronized-scrolling UI tests, and the
virtualization benchmark within its gate.

### Phase 6: Pane-Header Drag Reorder (Bug 6)

Make the whole header a drag origin while protecting interactive controls; keep
the midpoint-threshold reorder. Targeted tests: pane-layout and pane-header unit
tests, multi-pane-layout UI tests.

### Phase 7: Icon Centering (Bug 7)

Center the covered icons within their hover zones. Targeted tests: icon-button and
popover/sync component tests, redesigned-shell viewport UI tests.

### Phase 8: Regression, Performance, And Release Validation

Run full local gates before commit, then push and monitor cross-OS CI/CD until
green.

## Local Validation Gates Before Commit

Run targeted tests during each phase, then run the current-OS (macOS) gates from
`/Users/Vladimir.Zulin/projects/idea/Crosslog` before commit:

```bash
bash scripts/macos/test.sh
bash scripts/macos/test-ui.sh web
bash scripts/macos/test-ui.sh desktop
```

Run the build and performance gates when rendering/scroll or release-readiness is
affected (bug 5, theme, icon layout):

```bash
bash scripts/macos/build.sh
bash scripts/macos/perf.sh
```

A commit is not allowed until the current-OS automated and UI/E2E gates pass.

## CI/CD Gates After Push

After push, monitor the GitHub Actions workflow `.github/workflows/ci.yml`
("CI/CD"). Work is not complete until every required job is green:

```text
Automated tests:      automated-tests → linux, macos, windows-js, windows-rust
UI/E2E tests:         ui-tests → linux-web, linux-desktop, macos-web,
                      macos-desktop, windows-web
Windows Desktop UI:   windows-desktop-ui-app → windows-desktop-ui-tests
                      (windows-desktop-layout, windows-desktop-pane-tools,
                       windows-desktop-lifecycle)
Builds:               build-web; build-desktop → linux, macos, windows
```

Runners: linux = ubuntu-22.04, macos = macos-latest, windows = windows-latest.
Any CI/CD failure found after push MUST be diagnosed and fixed before the bug
batch is considered complete.

## Post-Design Constitution Check

- PASS: Phase 0/1 artifacts preserve the selected stack and add no dependency.
- PASS: Planned source opening and drag-drop use explicit platform ports; fixtures
  stay behind test helpers.
- PASS: Tests are mapped to every bug scenario and unchanged behavior remains
  protected.
- PASS: Read-only and inert log safety requirements remain unchanged.
- PASS: The affected rendering/scroll path keeps its benchmark gate.
- PASS: Local and post-push OS gates are explicit.
