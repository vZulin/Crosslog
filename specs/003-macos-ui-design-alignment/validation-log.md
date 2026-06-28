# Validation Log: macOS UI Design Alignment

This log records validation evidence for the design-alignment implementation.
It should contain only evidence for the current alignment pass and should not
restate the full 001 or 002 validation history.

## Phase 1: Setup Scaffolding

| Date | Scope | Command Or Evidence | Result | Notes |
| --- | --- | --- | --- | --- |
| 2026-06-28 | T001-T007 setup scaffolding | `corepack pnpm lint` | Pass | ESLint completed successfully for the updated TypeScript scaffolding. |
| 2026-06-28 | T001-T007 setup scaffolding | `bash scripts/macos/test.sh` | Pass | Lint passed; Vitest unit suites passed 41 files / 104 tests; integration suites passed 4 files / 5 tests; Rust tests passed 5 tests. |

## Phase 2: Foundational Presentation State And Test Bridge

| Date | Scope | Command Or Evidence | Result | Notes |
| --- | --- | --- | --- | --- |
| 2026-06-28 | T008-T018 foundational phase | `corepack pnpm vitest run packages/ui/tests/app-shell/shell-presentation.test.tsx packages/platform/tests/ports/ui-test-bridge-port.test.ts` | Pass | Shell presentation helper tests passed 4 tests; UI test bridge contract tests passed 2 tests. |
| 2026-06-28 | T008-T018 foundational phase | `corepack pnpm lint` | Pass | ESLint completed successfully after adding shell presentation helpers, app override parsing, icon coverage, and UI test bridge fields. |
| 2026-06-28 | T008-T018 foundational phase | `corepack pnpm test:unit` | Pass | Vitest unit suites passed 43 files / 110 tests. |
| 2026-06-28 | T008-T018 foundational phase | `bash scripts/macos/test.sh` | Pass | Lint passed; Vitest unit suites passed 43 files / 110 tests; integration suites passed 4 files / 5 tests; Rust tests passed 5 tests. |
| 2026-06-28 | T013-T014 app entrypoint overrides | `corepack pnpm --filter @crosslog/web build` and `corepack pnpm --filter @crosslog/desktop build` | Pass | Vite production builds completed for the Web and Desktop shells after presentation override parsing was wired. |

## Phase 3: User Story 1 Aligned Shell Without Obsolete Controls

| Date | Scope | Command Or Evidence | Result | Notes |
| --- | --- | --- | --- | --- |
| 2026-06-28 | T019-T037 US1 implementation | `corepack pnpm test:unit` | Pass | Vitest unit suites passed 45 files / 115 tests, including obsolete-control absence, empty workspace, compact topbar, icon-only sync, Activity Rail guardrails, and context-menu copy coverage. |
| 2026-06-28 | T024-T027 US1 UI selector migration | `corepack pnpm test:ui:web` | Pass | Playwright Web UI suite passed 14 tests after migrating source-opening, sync, add-pane, directory refresh, empty-directory, drag/drop, and copy flows away from removed controls. |
| 2026-06-28 | T026-T027 US1 Desktop UI selector migration | `corepack pnpm test:ui:desktop` | Pass | Desktop WDIO and macOS XCTest UI suite passed; XCTest executed 10 tests with updated empty workspace and obsolete-control absence checks for the empty shell. |
| 2026-06-28 | T038 US1 automated gate | `bash scripts/macos/test.sh` | Pass | Lint passed; Vitest unit suites passed 45 files / 115 tests; integration suites passed 4 files / 5 tests; Rust tests passed 5 tests. |
| 2026-06-28 | T038 US1 UI gate | `bash scripts/macos/test-ui.sh` | Pass | Playwright Web UI passed 14 tests; Desktop/macOS UI tests built the app and XCTest suite passed 10 tests. Populated-workspace `obsolete=visible` remains expected until Phase 4 replaces resize plus/minus controls. |
| 2026-06-28 | T038 US1 UI test bridge follow-up | `bash scripts/macos/test.sh` | Pass | Re-ran after stabilizing UI test action polling so consumed actions cannot be dropped during React rerenders; lint passed, Vitest unit suites passed 45 files / 115 tests, integration suites passed 4 files / 5 tests, and Rust tests passed 5 tests. |
| 2026-06-28 | T038 US1 UI test bridge follow-up | `bash scripts/macos/test-ui.sh` | Pass | Re-ran after the polling fix; Playwright Web UI passed 14 tests and macOS XCTest passed 10 tests, including live file state, pane search, session restore, and time offset action flows. |

## Phase 4: User Story 2 Aligned Pane Workspace And Headers

| Date | Scope | Command Or Evidence | Result | Notes |
| --- | --- | --- | --- | --- |
| 2026-06-29 | T039-T044 US2 component coverage | `corepack pnpm exec vitest run packages/ui/tests/pane-rail/pane-layout.test.tsx packages/ui/tests/pane-rail/pane-workspace-alignment.test.tsx packages/ui/tests/app-shell/redesigned-shell-responsive.test.tsx packages/ui/tests/log-pane/pane-lifecycle-header.test.tsx packages/ui/tests/log-pane/directory-pane-header.test.tsx packages/ui/tests/log-pane/file-pane-header.test.tsx` | Pass | Targeted component tests passed 6 files / 18 tests, covering draggable resize boundaries, right-edge fill/overflow calculation, desired-width preservation, file and directory header spacing, live-dot rendering, and no ready footer. |
| 2026-06-29 | T045-T050 US2 UI coverage | `corepack pnpm test:ui:web` | Pass | Playwright Web UI passed 14 tests, including drag resize by pane boundary, fit-case right-edge alignment, overflow-only workspace scrollbar visibility, directory header controls, and session restore through the new resize boundary selector. |
| 2026-06-29 | T047-T050 US2 Desktop/macOS UI coverage | `bash scripts/macos/test-ui.sh` | Pass | Full UI gate passed: Playwright Web UI passed 14 tests; macOS Desktop app built successfully; XCTest suite passed 10 tests with resize-boundary publication, right-edge/overflow state, obsolete-control absence, and aligned directory header evidence. |
| 2026-06-29 | T060 US2 automated gate | `bash scripts/macos/test.sh` | Pass | Lint passed; Vitest unit suites passed 47 files / 120 tests; integration suites passed 4 files / 5 tests; Rust tests passed 5 tests. |
| 2026-06-29 | T060 US2 performance gate | `bash scripts/macos/perf.sh` | Pass | Performance benchmark gate completed after rendering and scrolling layout changes. Existing performance scenarios for source opening, search, synchronization, session writing, directory navigation, virtualization, live append, and memory pressure completed successfully. |

## Phase 5: User Story 5 MVP Behavior Preservation

| Date | Scope | Command Or Evidence | Result | Notes |
| --- | --- | --- | --- | --- |
| 2026-06-29 | T061-T074 US5 targeted bridge and obsolete-control coverage | `corepack pnpm exec vitest run packages/platform/tests/ports/ui-test-bridge-port.test.ts packages/ui/tests/app-shell/obsolete-controls.test.tsx packages/ui/tests/app-shell/redesigned-workspace.test.tsx` | Pass | Targeted component/contract tests passed 3 files / 7 tests, covering the shared UI test action whitelist, shell-state formatting, hidden lifecycle/source action removal, and obsolete-control absence. |
| 2026-06-29 | T061, T064, T067 Web preservation coverage | `corepack pnpm exec playwright test --config playwright.config.ts apps/web/tests/ui/session-restore.spec.ts apps/web/tests/ui/directory-navigation.spec.ts apps/web/tests/ui/empty-directory.spec.ts apps/web/tests/ui/unsupported-monitoring.spec.ts apps/web/tests/ui/log-text-copy.spec.ts apps/web/tests/ui/browser-capabilities.spec.ts` | Pass | Targeted Playwright suite passed 6 tests, including Web test bridge source setup, restored session outcomes, browser capability messaging, unsupported monitoring indicators, directory refresh, empty directory, and copy without permanent toolbar UI. |
| 2026-06-29 | T075 read-only and inert rendering safety | `corepack pnpm test:integration` | Pass | Integration suites passed 4 files / 5 tests, including read-only file safety and inert log content security. |
| 2026-06-29 | T076 US5 automated gate | `bash scripts/macos/test.sh` | Pass | Lint passed; Vitest unit suites passed 47 files / 121 tests; integration suites passed 4 files / 5 tests; Rust tests passed 5 tests. |
| 2026-06-29 | T076 US5 UI gate | `bash scripts/macos/test-ui.sh` | Pass | Playwright Web UI passed 14 tests; Desktop/macOS UI tests built the app and XCTest suite passed 10 tests with `obsolete=absent` evidence across session restore, live lifecycle, copy, and aligned shell preservation flows. |

## Future Evidence Slots

- US3 gate: `bash scripts/macos/test.sh` and `bash scripts/macos/test-ui.sh`.
- US4 shared implementation gate: `bash scripts/macos/test.sh` and
  `bash scripts/macos/test-ui.sh`.
- Release readiness: Windows, macOS, and Linux automated/UI/build GitHub
  Actions evidence.
- Timed empty-workspace review: reviewer role, empty-workspace start condition,
  viewport/platform, 5-second result, and pass/fail outcome.
