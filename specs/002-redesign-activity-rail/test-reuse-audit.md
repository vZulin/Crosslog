# UI Test Reuse And Migration Audit

**Feature**: Crosslog Activity Rail Redesign  
**Purpose**: Classify existing tests before migrating the UI to the Activity Rail
shell.

## Summary

The redesign keeps product behavior intact and changes the visual shell,
structural regions, and control placement. Core, platform, integration, Rust,
and performance tests remain reusable unless a later task exposes a real
requirement gap. UI tests need selector migration to topbar, activity rail, pane
workspace, redesigned pane headers, popovers, workspace scrollbar, and status
bar.

## Reuse Matrix

| Area | Current coverage | Migration action | Rationale |
| --- | --- | --- | --- |
| Core reducers and domain rules | `packages/core/tests/**` | Reuse | Functional requirements are unchanged. |
| Platform adapters | `packages/platform/tests/**` and Rust tests | Reuse | The redesign adds no platform capability. |
| Search state | `packages/ui/tests/search/search-state.test.tsx` | Reuse, add popover tests later | Search behavior remains per-pane; visual entry points move. |
| Synchronization controls | `packages/ui/tests/sync/synchronization-controls.test.tsx` | Reuse logic, add topbar tests | Store and planning behavior remain; topbar control is new. |
| Pane layout reducer/UI | `packages/ui/tests/pane-rail/pane-layout.test.tsx` | Update selectors and region assertions | Pane management remains, but shell regions and workspace scrollbar change. |
| Future slot guard | `packages/ui/tests/future-slots-hidden.test.tsx` | Replace with Activity Rail guard tests | Future controls move from hidden pane slot to rail affordances. |
| Log text copy | `packages/ui/tests/log-pane/log-text-copy.test.tsx` | Reuse, add redesigned-region coverage | Read-only and inert text behavior must remain unchanged. |
| Web UI tests | `apps/web/tests/ui/*.spec.ts` | Selector update and missing coverage | Web tests must assert topbar, rail, pane workspace, popovers, and status bar. |
| Desktop WDIO tests | `apps/desktop/tests/ui/*.spec.ts` | Mirror Web UI behavior where supported | Windows/Linux Desktop UI coverage should match shared UI behavior. |
| macOS XCTest tests | `apps/desktop/tests/ui/macos/*.swift` | Expand native accessibility assertions | macOS must execute real UI/E2E behavior, not only harness presence. |
| Performance tests | `tests/performance/**` and benchmark scripts | Reuse, add UI no-overlap/perf gates later | Existing thresholds remain; redesigned rendering adds viewport risks. |

## Existing UI Tests By User Story

| User story | Existing files | Required migration |
| --- | --- | --- |
| US1 Multi-log workspace | `apps/web/tests/ui/multi-pane-layout.spec.ts`, `apps/desktop/tests/ui/multi-pane-layout.spec.ts`, `apps/desktop/tests/ui/macos/MultiPaneLayoutUITests.swift` | Assert `crosslog-shell`, `topbar`, `activity-rail`, `pane-workspace`, `log-pane`, workspace scrollbar, and `status-bar`. |
| US2 Synchronization | `apps/web/tests/ui/synchronized-scrolling.spec.ts`, `apps/desktop/tests/ui/synchronized-scrolling.spec.ts`, `apps/desktop/tests/ui/macos/SynchronizedScrollingUITests.swift` | Move sync assertions to topbar and status bar; preserve active-pane and offset expectations. |
| US3 Pane search | `apps/web/tests/ui/log-search.spec.ts`, `apps/desktop/tests/ui/log-search.spec.ts` | Add pane header, activity rail, command field, and popover entry-point assertions. Add macOS coverage. |
| US4 Directory navigation | `apps/web/tests/ui/directory-navigation.spec.ts`, `apps/desktop/tests/ui/directory-navigation.spec.ts`, empty-directory tests | Update to redesigned pane header controls and disabled states. Add macOS coverage. |
| US5 Time offset | No complete redesigned popover suite | Add component, Web, WDIO, and macOS popover tests. |
| US6 Live/source lifecycle | `apps/web/tests/ui/unsupported-monitoring.spec.ts`, `apps/desktop/tests/ui/live-file-updates.spec.ts`, log copy tests | Update indicators to pane header and preserve retained-content assertions. |
| US7 Restore/platform boundaries | session restore, browser capability, drag/drop, manual encoding tests | Assert restored shell regions and explicit platform capability messaging. |

## Selector Migration Rules

- Prefer role and accessible-name selectors for interactive controls.
- Use shared test IDs only for structural regions and popovers where ARIA roles
  are too broad or unstable.
- Do not use visual coordinates as primary assertions.
- Do not change expected results to match a broken intermediate UI state.
- Keep old behavior assertions where the MVP function has not changed.

## Shared Selector Contract

Structural test IDs are defined in `packages/ui/src/app-shell/testIds.ts` and
must be reused by component tests, Playwright helpers, WDIO helpers, and macOS
accessibility assertions.

Required structural IDs:

- `crosslog-shell`
- `topbar`
- `command-field`
- `activity-rail`
- `pane-workspace`
- `workspace-scrollbar`
- `log-pane`
- `pane-header`
- `log-viewport`
- `pane-search-popover`
- `time-offset-popover`
- `status-bar`

## Phase 1 Output

The helper files introduced in Phase 1 intentionally do not assert the current
old UI. They define the target selector and accessibility contract so Phase 2
and story tests can be written before the redesigned components are fully wired.

