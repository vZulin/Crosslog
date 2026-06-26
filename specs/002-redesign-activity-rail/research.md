# Research: Crosslog Activity Rail Redesign

## Figma Frame Interpretation

### Decision: Treat Figma node `11:3` as the authoritative redesigned MVP shell

Rationale: The user identified `Screen / Draft Layout - Activity Rail` as the replacement for the poor MVP UI. The inspected node contains the complete shell: topbar, command field, synchronization and add-pane controls, activity rail, pane workspace, log panes, directory headers, search popover, time offset popover, workspace scrollbar, and status bar.

Alternatives considered:

- Use the existing MVP UI and only adjust styling: rejected because the request is explicitly a redesign from the new mockup.
- Treat the Figma frame as illustrative only: rejected because the frame covers all MVP interactions and is the user's prepared design reference.

### Decision: Keep non-MVP rail controls as visible-but-non-functional extension points only when UX makes that safe

Rationale: The mockup shows filter, palette, and bookmark rail controls, but the MVP specification excludes filtering, user-configurable highlighting, saved filter sets, and bookmarks. These controls must not create a false promise. They may be hidden, disabled, or marked unavailable depending on final UX review.

Alternatives considered:

- Implement filter, palette, and bookmark behavior now: rejected because it changes scope.
- Leave active-looking controls that do nothing: rejected because it creates broken affordances and test ambiguity.

## Technology Stack Assessment

### Decision: Keep React, TypeScript, Vite, Zustand, TanStack Virtual, and Tauri 2

Rationale: The redesign is a UI composition change over already shared behavior. Existing domain logic and platform adapters cover file loading, directory navigation, search, synchronization, live updates, session restore, and read-only safety. React is already in both app shells, and `packages/ui` is the correct place for the new shell.

Alternatives considered:

- Replace the UI framework: rejected because it would add risk without solving a requirement.
- Introduce a separate Desktop UI stack: rejected by the shared-codebase constitution.
- Adopt a full component library: rejected because the Figma design is custom, compact, and log-workspace-specific.

### Decision: Add no broad UI dependency

Rationale: A UI kit would impose its own layout and interaction model on a dense log viewer. The planned components are specific: topbar, command field, activity rail, pane workspace, pane headers, popovers, and status bar.

Alternatives considered:

- Full UI kit: rejected for dependency, styling, and accessibility drift risk.
- CSS framework: rejected because the app already needs precise product-specific layout and stable component contracts.

### Decision: Use a small icon strategy

Rationale: The redesign depends on icon buttons. The implementation should prefer `lucide-react` if the required icons are available and tree-shaken. If that dependency is not justified during implementation, use a local reviewed SVG icon module exported from Figma.

Alternatives considered:

- Figma MCP asset URLs at runtime: rejected because they are short-lived tool outputs, not product assets.
- Hand-drawn ad hoc SVGs scattered across components: rejected because it harms consistency and maintainability.
- Raster icons: rejected for scaling and accessibility concerns.

## Test Reuse Assessment

### Decision: Reuse core, integration, Rust, and performance tests

Rationale: Functional requirements did not change. Tests for reducers, search, synchronization, directory navigation, file lifecycle, read-only safety, inert rendering, session serialization, Rust adapters, and performance thresholds should remain valid.

Alternatives considered:

- Rewrite all tests: rejected because it would risk losing validated behavior and waste effort.
- Remove failing UI tests during migration: rejected because expected results must remain requirement-driven.

### Decision: Update UI/E2E tests around stable accessible contracts

Rationale: The redesigned layout changes visible hierarchy and control placement. UI tests that assert old headings, toolbar locations, button text, or pane structure must be updated to the new topbar, rail, pane header, popover, and status bar contracts. Role/name selectors remain preferred; `data-testid` is acceptable for layout regions where roles are not enough.

Alternatives considered:

- Keep old selectors and force new UI to mimic old structure: rejected because it would undermine the redesign.
- Use screenshot-only assertions: rejected because they are brittle and weaker than behavior-focused UI tests.

### Decision: Expand macOS Desktop UI execution beyond harness presence validation

Rationale: The current `scripts/run-desktop-ui-tests.mjs` validates XCTest files on macOS but does not execute full macOS UI behavior. The user's requirement and the constitution require UI/E2E tests to pass locally on the current OS.

Alternatives considered:

- Keep presence validation as the macOS UI gate: rejected because it does not validate the UI.
- Use WebdriverIO/Tauri WebDriver on macOS: rejected by the existing plan because macOS WebView automation support differs from Windows/Linux.

## CI/CD Assessment

### Decision: Add GitHub Actions OS UI/E2E matrix

Rationale: Current CI runs automated tests on Windows, macOS, and Linux, and Web UI tests on Linux. It does not run `scripts/windows/test-ui.ps1`, `scripts/macos/test-ui.sh`, or `scripts/linux/test-ui.sh` as an OS matrix. The redesign plan must require those jobs before release readiness.

Alternatives considered:

- Run UI tests only locally: rejected because Windows and Linux validation must use GitHub CI/CD when the current local OS is macOS.
- Keep Web UI only: rejected because Desktop behavior and OS automation are explicit requirements.

### Decision: Keep build jobs but make them depend on automated tests and UI/E2E matrix

Rationale: Build artifacts should not be published before both non-UI and UI behavior pass on supported OS targets.

Alternatives considered:

- Build before UI tests: faster feedback for artifacts but weaker release safety.
- Single Linux-only gate: rejected by OS-specific Desktop requirements.

## Source References

- Figma design file: `Crosslog Log Viewer UI Design`, frame `Screen / Draft Layout - Activity Rail`, node `11:3`.
- Local MVP baseline: `/Users/Vladimir.Zulin/projects/idea/Crosslog/specs/001-multi-log-analysis/spec.md`.
- Current redesign spec: `/Users/Vladimir.Zulin/projects/idea/Crosslog/specs/002-redesign-activity-rail/spec.md`.
- Current package stack: `/Users/Vladimir.Zulin/projects/idea/Crosslog/package.json`.
- Current CI workflow: `/Users/Vladimir.Zulin/projects/idea/Crosslog/.github/workflows/ci.yml`.
- Current shared UI package: `/Users/Vladimir.Zulin/projects/idea/Crosslog/packages/ui/src`.
