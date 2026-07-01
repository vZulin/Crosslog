
https://github.github.com/spec-kit/quickstart.html

/speckit.constitution

Create the project constitution for "Crosslog".

Include these mandatory principles:

1. The code should be clean, well-structured, and annotated.
2. No unnecessary dependencies
3. Performance and low resource consumption are critical.
4. Every development phase must include automated tests.
5. Expected test results must never be changed to fit actual implementation behavior.
6. Besides unit tests, UI tests are required for all user scenarios.
7. The project must provide build scripts for each supported OS: Windows, macOS, and Linux.
8. The project must provide automated test scripts for each supported OS: Windows, macOS, and Linux.
9. The project must provide UI test scripts for each supported OS: Windows, macOS, and Linux.
10. After each development phase, automated tests must be executed and must pass.
11. UI tests must be executed on the corresponding target OS.
12. The technology stack must be selected explicitly in the plan
13. The application must use one shared codebase for Web and Desktop versions.
14. Business logic must be implemented once and reused across platforms.
15. Platform-specific code must be isolated behind explicit interfaces.
16. The application must never modify opened log files.
17. The application must treat logs as read-only input and must never execute commands found in logs.
18. Performance requirements must be validated by tests or benchmarks where applicable.
19. Session state must be protected from data loss on unexpected errors.

Also define:
- quality gates;
- testing rules;
- cross-platform rules;
- review rules;
- release readiness rules;
- rules for future feature extensibility.

Use precise, enforceable language.


/speckit.specify

Create the MVP specification for "Crosslog".

Build a cross-platform application for analyzing multiple log files simultaneously.

Primary goal:
Help users analyze distributed processes that write to different log files by showing multiple logs side by side and synchronizing navigation by time.

Target platforms:
- Desktop: Windows, macOS, Linux via Tauri 2 + Web Frontend.
- Web: browser-based version using the same UI and shared business logic where possible.

Use the requirements from @crosslog-requirement-specification.md as authoritative input.



/speckit.plan

Create the implementation plan for the Crosslog MVP.

The plan must include explicit phases for:

1. Technology stack selection.
   Evaluate options for:
   - frontend framework;
   - state management;
   - virtualization library;
   - desktop bridge architecture for Tauri 2;
   - shared business-logic package structure;
   - file watching abstraction;
   - encoding detection;
   - timestamp parsing;
   - session persistence.

2. Automated testing framework selection.
   Evaluate options for:
   - unit tests;
   - integration tests;
   - UI/E2E tests;
   - cross-platform desktop tests;
   - browser tests;
   - performance benchmarks.

3. UI/UX design phase.
   Define:
   - Log Pane layout;
   - empty state;
   - add/split pane behavior;
   - resizing behavior;
   - horizontal scrolling behavior;
   - directory navigation controls;
   - search controls;
   - synchronization toggle;
   - time offset controls;
   - deleted-file status;
   - filter/highlight bar;
   - filtered logs;
   - highlighted logs;
   - directory search bar;
   - save and load filters and highlights sers;
   - error states.
   Use ./crosslog-icon.svg as the basis for creating an icon for the application

4. Architecture design.
   Include:
   - shared domain layer;
   - platform adapters;
   - file source abstraction;
   - directory source abstraction;
   - navigation index;
   - timestamp recognition service;
   - synchronization engine;
   - search engine;
   - session storage;
   - file watching and log rotation detection;
   - filtering;
   - highlighting;
   - working with memory when switching files, filtering and highlighting lines;
   - UI component structure.

5. Development phases.
   Each phase must include:
   - implementation scope;
   - automated tests;
   - UI tests where user scenarios are affected;
   - OS-specific scripts if applicable;
   - acceptance criteria;
   - required test command execution after the phase.

6. Build and test automation.
   Define scripts for:
   - build: Windows, macOS, Linux;
   - unit/integration tests: Windows, macOS, Linux;
   - UI tests: Windows, macOS, Linux;
   - web build;
   - desktop build;
   - performance checks.

7. Quality gates.
   Enforce the constitution:
   - no phase is complete without passing automated tests;
   - expected test results must not be changed to match broken behavior;
   - all user scenarios must have UI tests;
   - UI tests must run on the corresponding OS.

Planning constraints:
- Desktop stack must use Tauri 2.
- Web and Desktop must share as much UI and business logic as possible.
- Business logic must be reusable across platforms.
- Platform-specific code must be isolated behind interfaces.
- MVP must not implement future features, but architecture must allow them.

Produce:
- selected stack recommendation with rationale;
- alternatives considered;
- phase breakdown;
- risk list;
- test strategy;
- script matrix by OS;
- initial project structure.



Prompt for speckit specify

  Create a specification for aligning the existing Crosslog Activity Rail redesign with the updated UI design document and HTML mockups.

  Feature name suggestion: macos-ui-design-alignment

  Authoritative inputs:
  - docs/crosslog-ui-design.md
  - docs/mockups/crosslog-macos-redesign-mockups.html
  - crosslog-requirement-specification.md
  - specs/001-multi-log-analysis
  - specs/002-redesign-activity-rail

  This is not a new product feature. It is a design-alignment and implementation-gap specification for the existing Crosslog MVP UI. Do not add new functional capabilities
  beyond the MVP requirements and the existing Activity Rail redesign scope.

  Reuse rules:
  - Treat specs/001-multi-log-analysis as the functional baseline.
  - Treat specs/002-redesign-activity-rail as the redesign baseline.
  - Reuse existing user stories, functional requirements, contracts, data model, test strategy, and acceptance criteria wherever they still apply.
  - Add only the deltas required by docs/crosslog-ui-design.md and docs/mockups/crosslog-macos-redesign-mockups.html.
  - Do not duplicate previously completed scope as if it were new work.
  - Do not introduce a new UI framework, new product architecture, new parser model, new file/source capabilities, SSH, filtering, configurable highlighting, bookmarks, saved
  filter sets, recursive directory search, or file-manager behavior.

  The specification must cover these design-alignment outcomes:
  - Topbar matches the new target: compact command field, sync icon, add-pane icon immediately to the right of the command field; no Split button, no Synchronize by time
  checkbox, no Sync on text label.
  - Activity rail follows the target button order and sizing; future filter/palette/bookmark controls are hidden, disabled, or clearly unavailable until their features exist.
  - Empty workspace matches the new mockup: same topbar height, activity rail, centered drop zone, Open Source action, drag-and-drop entry point.
  - Pane workspace supports editor-like drag resizing by pane boundaries, persists user-resized sizes, and never leaves unused blank space to the right of the rightmost pane
  when panes do not overflow.
  - Horizontal workspace scrolling appears only when panes exceed available width; each Log Pane keeps independent horizontal scrolling for long lines.
  - File pane and directory pane headers match the target layout: source identity, current file for directory panes, live dot spacing, close, previous/next directory
  controls, offset tag, and pane find icon without overlap.
  - The pane search popover is compact and appears in the pane where it was invoked.
  - The time offset popover is compact and appears in the pane where it was invoked.
  - Light and dark themes apply to the actual application UI, not only mockup chrome.
  - macOS, Windows, Linux, and Web platform variants render appropriate shell chrome while keeping shared product behavior.
  - The Directory Search left panel is treated as a future/search-scope surface unless the corresponding directory-wide search requirements are implemented; it must not
  create new MVP behavior by accident.
  - Existing read-only, inert log rendering, file watching, directory navigation, timestamp sync, per-pane search, offset, session restore, encoding, performance, and
  platform-capability behavior must remain unchanged.

  Explicit removals from the old implementation:
  - Permanent pane Copy toolbar.
  - Discover newer directory file.
  - Append live line.
  - Delete active file.
  - Replace active file.
  - Split topbar button.
  - Synchronize by time checkbox text.
  - Sync on topbar text.
  - Plus/minus resize controls.
  - Per-pane ready footer.
  - Persistent workspace action toolbar above panes.

  Testing expectations:
  - Existing core, platform, integration, performance, Rust, search, sync, directory navigation, session restore, and safety tests should be reused unless a real requirement
  gap is found.
  - Existing Web UI, Desktop WDIO, and macOS XCTest/Accessibility tests should be updated for new selectors, accessible names, shell regions, and visual contracts rather than
  rewritten from scratch.
  - Add only missing UI tests for new design deltas: empty workspace, platform/theme variants, right-edge pane alignment, drag resize, compact popovers, header no-overlap,
  and obsolete-control removal.
  - Requirements and success criteria must be testable and technology-agnostic.

  Prompt for speckit plan

  Plan the implementation for the UI design-alignment specification using the existing Crosslog codebase and prior specs as the baseline.

  Authoritative inputs:
  - The current feature spec produced for macos-ui-design-alignment.
  - docs/crosslog-ui-design.md
  - docs/mockups/crosslog-macos-redesign-mockups.html
  - specs/001-multi-log-analysis
  - specs/002-redesign-activity-rail
  - specs/002-redesign-activity-rail/test-reuse-audit.md
  - specs/002-redesign-activity-rail/contracts/ui-behavior.md
  - specs/002-redesign-activity-rail/contracts/figma-design-contract.md
  - specs/002-redesign-activity-rail/contracts/test-automation.md

  Planning constraints:
  - This is not a new functional feature. It is an implementation alignment pass for the existing MVP redesign.
  - Keep the existing stack: TypeScript, React, Vite, Zustand, TanStack Virtual, Tauri 2, Rust adapters, Vitest, Playwright, WebdriverIO, macOS XCTest/Accessibility.
  - Do not add a UI kit, parser rewrite, platform adapter rewrite, backend service, or new product capability.
  - Reuse existing components, stores, reducers, ports, test helpers, and CI scripts wherever possible.
  - Preserve the behavior and expected results from specs/001-multi-log-analysis unless the updated UI design document explicitly changes presentation.
  - Treat specs/002-redesign-activity-rail as the main implementation baseline and produce a delta plan, not a duplicate of already completed redesign tasks.

  The plan must start with a gap audit:
  - Compare current implementation and tests against docs/crosslog-ui-design.md and docs/mockups/crosslog-macos-redesign-mockups.html.
  - Classify each gap as: CSS/token update, component layout update, behavior wiring update, obsolete-control removal, test selector update, missing test, or no-op because
  already implemented.
  - Identify existing tests to reuse unchanged, tests needing selector/assertion updates, and tests requiring new coverage.

  Required implementation phases:
  1. Design token and theme alignment
     - Update light/dark tokens for window, topbar, rail, pane, borders, scrollbars, accent, warning, error, text, tag backgrounds.
     - Ensure theme switching affects actual application UI.

  2. Platform shell variant alignment
     - macOS traffic lights.
     - Windows caption controls.
     - Linux caption controls.
     - Web no desktop radius/shadow.
     - Shared product behavior across all variants.

  3. Topbar and obsolete-control cleanup
     - Compact command field.
     - Sync icon and add-pane icon immediately to the right of the command field.
     - Remove Split, Synchronize by time checkbox, Sync on label, and old workspace action toolbar.

  4. Empty workspace alignment
     - Same topbar height as non-empty shell.
     - Activity rail visible.
     - Centered drop zone and Open Source action.
     - Drag-over state without layout shift.

  5. Pane workspace alignment
     - Editor-like drag resize handles between panes.
     - Persist user-resized widths using existing session/pane layout state.
     - Split rightmost pane on add.
     - Redistribute space on close.
     - No blank space beyond rightmost pane when panes do not overflow.
     - Horizontal workspace scroll only when needed.

  6. Pane header alignment
     - File pane title, icon, live dot, offset tag, find icon, close.
     - Directory pane title, current file, previous/next controls, live dot, offset tag, find icon, close.
     - Long-name truncation and no-overlap behavior.
     - Active pane indicator.

  7. Popover alignment
     - Compact pane search popover anchored to invoking pane.
     - Compact time offset popover anchored to invoking pane.
     - Escape/keyboard/focus behavior.
     - No global left/center pane positioning bug.

  8. Activity rail and left panel guardrails
     - Keep source/files/settings MVP actions usable.
     - Future filter/palette/bookmark controls hidden, disabled, or clearly unavailable.
     - Directory Search left panel remains feature-gated unless directory-wide search is intentionally implemented elsewhere.

  9. Test migration and reuse
     - Reuse existing core/platform/integration/performance tests.
     - Update existing Web UI, Desktop WDIO, and macOS XCTest tests for new shell structure.
     - Add missing tests for:
       - obsolete controls absent;
       - empty workspace target layout;
       - light/dark application UI;
       - macOS/Windows/Linux/Web chrome variants;
       - pane right-edge alignment;
       - drag resize;
       - compact popover positioning per invoking pane;
       - pane header no-overlap with long names;
       - future rail controls unavailable.

  10. Validation gates
     - Local macOS:
       - bash scripts/macos/test.sh
       - bash scripts/macos/test-ui.sh
       - bash scripts/macos/perf.sh when rendering, scrolling, search, or session behavior changes
       - bash scripts/macos/build.sh before release readiness
     - GitHub Actions:
       - Windows automated + UI/E2E + build
       - macOS automated + UI/E2E + build
       - Linux automated + UI/E2E + build

  Research outputs:
  - research.md should document only unresolved implementation decisions and the reuse/gap audit. Do not restate the whole existing redesign plan.
  - data-model.md should be amended only if new UI state is required; otherwise document that existing ApplicationShell, PaneWorkspace, LogPane, PaneHeader,
  PaneSearchPopover, TimeOffsetPopover, StatusBar, and ActivityRail entities remain valid.
  - contracts should update existing UI behavior, Figma design interpretation, and test automation contracts with the new design deltas.
  - quickstart.md should include the exact validation flow and any changed test commands.

  Acceptance for the plan:
  - The plan must be incremental and delta-oriented.
  - The plan must explicitly say which existing specs/002 tasks or artifacts are reused unchanged.
  - The plan must explicitly say which tests are updated versus newly added.
  - The plan must not create tasks for new product capabilities.
  - The plan must treat obsolete-control removal and rightmost-pane alignment as first-class acceptance criteria.








  Prompt For speckit specify

  Create a Crosslog bug-fix stabilization specification for the full bug batch described in docs/Bugs_1.txt.

  Authoritative inputs:
  - docs/Bugs_1.txt: every numbered bug is in scope and its expected result is authoritative.
  - specs/001-multi-log-analysis: MVP functional baseline.
  - specs/003-macos-ui-design-alignment: current macOS UI alignment baseline.
  - Existing contracts under those specs, especially UI behavior and test automation contracts.

  Scope guardrails:
  - Preserve all functionality not explicitly described in docs/Bugs_1.txt or the prior specs.
  - Source opening must use user-selected files/directories, not predefined demo sources, except where automated tests intentionally use fixtures through existing test helpers.


  Group the requirements around these areas:
  1. Source opening and empty workspace behavior: bugs 1, 2, 12, 16, 19.
  2. Pane layout, scrolling, reordering, gutter, and keyboard navigation: bugs 3, 4, 17, 18, 20.
  3. Pane search, search highlighting, copy-selection popover, and popover lifecycle: bugs 5, 6, 7, 8, 9, 21.
  4. Time offset validation: bugs 10 and 22.
  5. Sync icon state, settings, and default theme behavior: bugs 11, 13, 14, 15.


  Testing requirements:
  - Audit existing automated and UI/E2E tests.
  - Keep valid tests unchanged.
  - Update tests only when they encode the incorrect behavior described in docs/Bugs_1.txt.
  - Add missing test cases for every bug scenario not currently covered.
  - Include accessibility, viewport/no-overlap, popover positioning, keyboard, drag/drop, and pane layout coverage where relevant.
  - The specification must state that before commit, local automated tests and local UI/E2E tests for the current OS must pass.
  - The specification must state that after push, CI/CD results for Windows, macOS, and Linux must be monitored and failures fixed until green.

  Write the spec as testable product requirements and success criteria. Avoid implementation details, framework-specific instructions, and code-level design decisions.

  Prompt For speckit plan

  Create an implementation plan for the current bug-fix stabilization spec.

  Planning constraints:
  - Use the newly created spec as the source of truth.
  - Read docs/Bugs_1.txt and the prior specs under specs/001-multi-log-analysis and specs/003-macos-ui-design-alignment before planning.
  - Preserve all behavior not explicitly changed by the bug specification.
  - Keep changes minimal and aligned with the existing React/Vite/Zustand/TanStack Virtual/Tauri 2 architecture.
  - Do not add new dependencies unless the plan documents a clear need and asks for approval.
  - Keep platform-specific behavior behind existing platform ports.

  The plan must include:
  1. A bug-to-requirement traceability section mapping every item from docs/Bugs_1.txt to planned work and tests.
  2. A test inventory:
     - Existing tests that remain valid and unchanged.
     - Existing tests that must be updated because they assert the incorrect behavior from the bug report.
     - New automated or UI/E2E tests required for uncovered bug scenarios.
  3. UI validation coverage for pane width, pane header controls, search highlighting, copy popover position/lifecycle, time offset validation, settings/theme behavior, disabled future
  controls, drag/drop, pane reordering, gutter width, keyboard navigation, and sync-scroll behavior.
  5. Accessibility and viewport/no-overlap checks for every changed visible UI surface.
  6. Local validation gates before commit:
     - Run targeted tests during implementation.
     - Run the local OS automated test script.
     - Run the local OS UI/E2E test script.
  7. CI/CD gates after push:
     - Monitor GitHub Actions or the configured CI/CD checks.
     - Windows, macOS, and Linux automated tests, UI/E2E tests, and build checks must pass.
     - Any CI/CD failure found after push must be investigated and fixed before the work is considered complete.

  The plan must be concrete enough for implementation, but it must not broaden scope beyond docs/Bugs_1.txt and the existing specifications.