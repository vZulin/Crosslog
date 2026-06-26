# Implementation Plan: Crosslog Activity Rail Redesign

**Branch**: `002-redesign-activity-rail` | **Date**: 2026-06-27 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/Users/Vladimir.Zulin/projects/idea/Crosslog/specs/002-redesign-activity-rail/spec.md`

## Summary

Redesign the existing Crosslog MVP UI around the Figma `Screen / Draft Layout - Activity Rail` frame while preserving the functional behavior already specified and implemented for multi-log analysis. The work is primarily a shared UI-shell redesign: topbar command field, activity rail, pane workspace, per-pane headers, search popover, time offset popover, horizontal workspace scrolling, and status bar.

The implementation keeps the current shared Web/Desktop architecture and core behavior. Existing domain logic, platform ports, session behavior, parsing, search, synchronization, file watching, and performance tests remain the functional baseline. UI and UI/E2E tests must be updated where selectors or visible structure change, and CI must be expanded so OS-specific UI/E2E tests run through GitHub Actions for Windows, macOS, and Linux while the current macOS development OS runs the full local gate.

## Technical Context

**Language/Version**: TypeScript 5.x for shared UI/domain code; React 19; Rust 1.77+ stable for Tauri 2 adapters; Node.js 22 in CI; pnpm 9.15.4 via Corepack.
**Primary Dependencies**: React; React DOM; Vite; Zustand; TanStack Virtual; Tauri 2; Vitest; Playwright; WebdriverIO; Rust `notify`, `encoding_rs`, and `chardetng`.
**Dependency Policy**: Add `lucide-react` only if implementation confirms the required action icons are available and tree-shaken; otherwise use a small local icon module with reviewed SVGs exported from Figma. No full UI kit is planned.
**Storage**: Unchanged from MVP: browser session state in IndexedDB; Desktop session snapshots in the application data directory; no state written beside opened logs.
**Testing**: Vitest for shared unit/integration/performance tests; cargo test for Rust adapters; Playwright for Web UI/E2E; WebdriverIO with the Tauri WebDriver path for Windows/Linux Desktop UI/E2E; macOS XCTest/Accessibility for macOS Desktop UI/E2E.
**Target Platform**: Browser Web plus Desktop on Windows, macOS, and Linux.
**Project Type**: Shared Web/Desktop application with a redesigned shared UI shell.
**Shared Codebase Strategy**: Keep `packages/core` for product logic, `packages/platform` for ports/adapters, `packages/ui` for redesigned React UI, and `apps/web`/`apps/desktop` as thin shells.
**Platform Interfaces**: Existing filesystem, directory, drag/drop, file watching, session store, and capability ports remain unchanged. The redesign adds no new platform capability.
**OS Build Scripts**: Windows `pwsh scripts/windows/build.ps1`; macOS `bash scripts/macos/build.sh`; Linux `bash scripts/linux/build.sh`.
**OS Automated Test Scripts**: Windows `pwsh scripts/windows/test.ps1`; macOS `bash scripts/macos/test.sh`; Linux `bash scripts/linux/test.sh`.
**OS UI Test Scripts**: Windows `pwsh scripts/windows/test-ui.ps1`; macOS `bash scripts/macos/test-ui.sh`; Linux `bash scripts/linux/test-ui.sh`. These scripts must become real release gates, not selector-only or harness-presence checks.
**Read-Only/Security Model**: Unchanged. Opened logs remain read-only, rendered as inert text, and never executed. The redesign must not introduce HTML injection through command/search fields, log rows, or popovers.
**Session Recovery Model**: Extend existing session restoration expectations to include redesigned shell state that is already part of MVP behavior: pane order, pane sizes, sync state, selected directory files, and per-pane time offsets. Scroll positions remain excluded.
**Performance Goals**: Preserve MVP thresholds and add UI-specific gates: no primary-control overlap across supported viewport sizes; opening three sources in the redesigned workspace remains under 30 seconds; 20 MB open/search thresholds remain unchanged.
**Performance Reference Conditions**: Performance thresholds use checked-in fixtures under `tests/fixtures/` or generated deterministic equivalents, run after a production build on the current OS with no debugger attached. Each measured scenario must include at least one warm-up run and three measured runs; the reported value is the worst measured run. The 20 MB open/search scenarios must use a timestamped log fixture with representative severity and message text. Directory switching must use a directory fixture with at least 100 top-level files. Synchronization accuracy must use deterministic overlapping timestamp fixtures with sampled anchor movements recorded in the test.
**Constraints**: No remote sources, filtering, user-configurable highlighting, saved filter sets, bookmarks, recursive directory search, or file-manager behavior in MVP. Figma rail controls for future capabilities must be disabled, hidden, or non-functional without false affordance.
**Scale/Scope**: One redesigned application shell, reusable pane components, all seven MVP user scenarios, Web UI suite, Desktop UI suites for Windows/macOS/Linux, and GitHub Actions CI/CD coverage for non-local OS validation.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- PASS: Technology stack is explicitly selected for Web, Desktop, UI, testing, benchmarking, and build tooling.
- PASS: Dependency additions are constrained. The only potential addition is `lucide-react`, justified by icon-button coverage; it must be rejected if local reviewed icons cover the design with less risk.
- PASS: Web and Desktop continue using one shared UI and business codebase.
- PASS: Platform-specific behavior remains behind existing ports; the redesign adds no new platform interface.
- PASS: Build scripts are defined for Windows, macOS, and Linux.
- PASS: Automated test scripts are defined for Windows, macOS, and Linux.
- PASS WITH ACTION: UI test scripts exist for Windows, macOS, and Linux, but current CI does not run the full OS UI matrix and the current macOS Desktop script validates XCTest harness files instead of executing a full native UI run. This plan requires fixing both before release readiness.
- PASS: Every development phase below includes automated tests and phase-exit commands.
- PASS: Every user scenario maps to UI/E2E tests in the test strategy.
- PASS WITH ACTION: UI tests for OS-specific Desktop behavior must be wired into GitHub Actions for Windows, macOS, and Linux; local macOS execution remains the current-OS gate.
- PASS: Expected results are derived from `spec.md`, the Figma frame, and existing MVP requirements; changing tests to match broken UI is prohibited.
- PASS: Opened log files remain read-only and log content is never executed.
- PASS: Session state remains recoverable after unexpected errors.
- PASS: Performance requirements have planned UI checks and existing benchmark coverage.

## Phase 0: Research and Mockup Audit

### Required Research Outputs

- Figma audit of frame `Crosslog Window` node `11:3`: identify mandatory UI regions, visible MVP interactions, future/non-MVP controls, responsive risks, and accessibility expectations.
- Stack assessment: decide whether current React/Tauri/shared packages are enough, whether a UI kit is needed, and whether an icon dependency is justified.
- Test reuse assessment: classify existing unit, integration, performance, Web UI, Desktop WDIO, and macOS XCTest tests as reusable, selector-update-only, or replacement-required.
- CI/CD assessment: identify current GitHub Actions gaps and required jobs for OS automated tests plus OS UI/E2E tests.

### Research Conclusions

- Keep the existing stack. The redesign is layout and interaction composition over existing shared behavior, not a reason to change framework, state management, runtime, or test framework.
- Do not add a component library. The Figma design is a compact product UI with custom pane layout, popovers, status bar, and log rows; a full UI kit would add styling drift and dependency cost.
- Prefer a small icon solution. Add `lucide-react` only if it covers the required toolbar/rail/pane icons with accessible SVG output and acceptable dependency impact; otherwise implement reviewed local SVG icons exported from Figma.
- Reuse core, platform, integration, and performance tests. Update UI tests around stable roles/test IDs because the visual structure moves from the old toolbar/pane-rail layout to the Activity Rail shell.
- Update CI/CD. Current GitHub Actions runs automated tests on Windows/macOS/Linux and Web UI on Linux only. It must add an OS UI matrix that runs `scripts/<os>/test-ui` on the corresponding runner.

## Phase 1: Design and Contracts

### Design Artifacts

- [research.md](./research.md): stack, Figma, test reuse, and CI decisions.
- [data-model.md](./data-model.md): UI shell and interaction-state entities added by the redesign.
- [contracts/figma-design-contract.md](./contracts/figma-design-contract.md): design interpretation and scope boundary from Figma.
- [contracts/ui-behavior.md](./contracts/ui-behavior.md): redesigned UI behavior contract.
- [contracts/test-automation.md](./contracts/test-automation.md): local and GitHub CI test matrix contract.
- [quickstart.md](./quickstart.md): local macOS and GitHub CI validation workflow.

### Post-Design Constitution Check

- PASS: The plan keeps shared code boundaries and avoids duplicated Web/Desktop UI behavior.
- PASS: The plan preserves read-only log safety and inert rendering.
- PASS: The plan requires explicit UI test mapping for every user story.
- PASS: The plan requires local current-OS validation and GitHub Actions validation for other supported OS targets.
- PASS WITH ACTION: Release readiness is blocked until `.github/workflows/ci.yml` includes the OS UI/E2E matrix and macOS Desktop UI execution is a real UI gate.

## Phase 2: Implementation Approach

### Phase 2.1 - Figma Audit and Design Token Extraction

- Scope: create a local Figma audit note from node `11:3`; extract layout regions, dimensions, spacing, colors, typography, icon inventory, popover behavior, and responsive constraints.
- Automated tests: none beyond existing lint; artifact review required.
- UI tests: no UI test changes yet.
- Exit gate: `research.md` and design contract reflect the Figma frame and explicitly mark future rail controls as non-MVP.

### Phase 2.2 - Shell Structure and Styling Foundation

- Scope: introduce redesigned shared shell components in `packages/ui/src/app-shell/`: topbar, command field, activity rail, pane workspace, status bar, and responsive layout primitives.
- Reuse: keep existing `AppShell` state orchestration and domain events; move controls into redesigned regions.
- Automated tests: component tests for shell landmarks, command field actions, activity rail state, status bar summary, and future-control non-behavior.
- UI tests: update empty workspace and multi-pane selectors to assert new regions.
- Local gate: `bash scripts/macos/test.sh`.

### Phase 2.3 - Pane Header, Search Popover, and Time Offset Popover

- Scope: redesign `PaneHeader`, `PaneSearchControls`, `TimeOffsetEditor`, directory navigation, live indicators, active pane indicator, close/search/offset actions, and popover placement.
- Reuse: keep search store, synchronization store, time-offset normalization, directory reducer, and line viewport behavior.
- Automated tests: update UI component tests for header truncation, offset validation, search mode toggles, match count, disabled directory navigation, and no overlap-critical states.
- UI tests: update Web, WDIO, and macOS XCTest suites for pane search, directory navigation, offset editing, and active/live indicators.
- Local gate: `bash scripts/macos/test.sh` and affected Web UI tests through `bash scripts/macos/test-ui.sh` after macOS UI gate is made executable.

### Phase 2.4 - Workspace Scrolling, Resize, and Status Summary

- Scope: implement Figma-like pane workspace horizontal scrolling, pane resize handles, visible workspace scrollbar behavior, active-pane state, and status bar summary.
- Reuse: keep `pane-layout` reducers and pane width session persistence.
- Automated tests: layout reducer tests remain reusable; add UI component tests for status summary and resize affordances.
- UI tests: update multi-pane layout suites for add/split/close/resize/horizontal scrolling and status bar assertions.
- Local gate: `bash scripts/macos/test.sh` and `bash scripts/macos/test-ui.sh`.

### Phase 2.5 - Test Suite Migration and CI/CD Enforcement

- Scope: classify all existing UI tests, migrate brittle visual/text selectors to stable accessible names and `data-testid` only where roles are insufficient, and add missing tests for topbar, activity rail, command field, status bar, search popover, and time offset popover.
- Required CI change: update `.github/workflows/ci.yml` with a UI/E2E matrix that runs:
  - Linux: `bash scripts/linux/test-ui.sh`
  - macOS: `bash scripts/macos/test-ui.sh`
  - Windows: `pwsh scripts/windows/test-ui.ps1`
- Required macOS change: make `corepack pnpm test:ui:desktop` execute the macOS XCTest/Accessibility UI harness or clearly call an executable harness script; presence-only validation is insufficient.
- Reuse policy: keep existing unit/integration/performance expected results unless requirements change; update only UI selectors and layout assertions required by the redesign.
- Local gate: full current OS commands on macOS: `bash scripts/macos/test.sh`, `bash scripts/macos/test-ui.sh`, and `bash scripts/macos/perf.sh` when performance-affecting UI work lands.
- Remote gate: push branch and require GitHub Actions green for Windows/macOS/Linux automated tests and UI/E2E tests.

### Phase 2.6 - Final Performance, Accessibility, and Release Readiness

- Scope: verify viewport coverage, text truncation, no overlapping primary controls, keyboard accessibility for command/search/offset controls, screen-reader names for icon buttons, read-only safety, and performance thresholds.
- Automated tests: all unit, integration, Rust, and performance suites.
- UI tests: all Web, WDIO Desktop, and macOS XCTest/Accessibility suites.
- Local gate: `bash scripts/macos/build.sh`, `bash scripts/macos/test.sh`, `bash scripts/macos/test-ui.sh`, `bash scripts/macos/perf.sh`.
- Remote gate: GitHub Actions workflow must pass for all Windows, macOS, and Linux jobs before release readiness.

## Project Structure

### Documentation (this feature)

```text
/Users/Vladimir.Zulin/projects/idea/Crosslog/specs/002-redesign-activity-rail/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── figma-design-contract.md
│   ├── test-automation.md
│   └── ui-behavior.md
└── tasks.md
```

### Source Code (repository root)

```text
/Users/Vladimir.Zulin/projects/idea/Crosslog/
├── apps/
│   ├── web/
│   │   ├── src/
│   │   └── tests/ui/
│   └── desktop/
│       ├── src/
│       ├── src-tauri/
│       └── tests/ui/
├── packages/
│   ├── core/
│   ├── platform/
│   └── ui/
│       ├── src/app-shell/
│       ├── src/log-pane/
│       ├── src/pane-rail/
│       ├── src/search/
│       └── src/sync/
├── tests/
│   ├── fixtures/
│   ├── integration/
│   └── performance/
├── scripts/
│   ├── windows/
│   ├── macos/
│   └── linux/
└── .github/workflows/
```

**Structure Decision**: Keep the current monorepo and shared packages. Implement the redesign in `packages/ui` and leave app shells thin. CI changes belong in `.github/workflows/ci.yml`; OS-specific command behavior belongs in existing `scripts/<os>/` files.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Temporary PASS WITH ACTION on OS UI gates | Current CI and macOS Desktop UI script do not yet satisfy the stricter redesign plan gate | Ignoring the gap would violate the user's requirement and the constitution; the plan makes it a release blocker |
