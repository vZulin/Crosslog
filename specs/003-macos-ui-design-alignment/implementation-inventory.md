# Implementation Inventory: macOS UI Design Alignment

This inventory tracks the current implementation gaps that will be closed by
`specs/003-macos-ui-design-alignment/tasks.md`. It is intentionally a delta
over `specs/002-redesign-activity-rail` and should not be used to add new
product capabilities.

## Scope Rules

- Reuse the existing React, Vite, Zustand, TanStack Virtual, Tauri 2, Vitest,
  Playwright, WebdriverIO, and macOS XCTest stack.
- Keep source opening, file watching, directory navigation, search,
  synchronization, offsets, encoding, session restore, read-only safety, and
  platform capability behavior unchanged.
- Add only design-alignment test scaffolding, selectors, shell presentation
  state, layout updates, and obsolete-control removals required by the target
  mockups.
- Treat theme and platform variants as runtime, mockup, or test presentation
  state in this alignment pass; do not add product-visible selectors or
  persisted preferences.

## Current-To-Target Gaps

| Area | Current Evidence | Target Delta | First Task |
| --- | --- | --- | --- |
| Test IDs and helpers | `packages/ui/src/app-shell/testIds.ts` covers the prior Activity Rail shell but lacks stable empty-workspace, theme, platform, resize, and obsolete-control selectors. | Add stable selectors and helper accessors that future UI tests can share. | T002-T006 |
| Theme presentation | No shared `ThemeVariant` helper or deterministic test override exists yet. | Add presentation state helpers and apply light/dark tokens to actual app surfaces. | T008, T102-T103 |
| Platform chrome | The shell has no macOS, Windows, Linux, or Web chrome variant rendering. | Add shared chrome components and OS/default evidence gates without changing source behavior. | T008, T095, T104-T108 |
| Topbar controls | `Topbar.tsx` still exposes old sync text/checkbox layout and `AddPaneButton.tsx` still exposes split affordances. | Compact command field with sync and add icons immediately to the right; no visible `Split`, `Synchronize by time`, or `Sync on/off` text. | T019-T031 |
| Empty workspace | `AppShell.tsx` still uses old `Open logs`, browser input, and platform text layout. | Shared topbar height, activity rail, centered drop zone, `Open Source`, and drag/drop entry. | T023, T032-T033 |
| Workspace action toolbar | Product UI still contains lifecycle simulation controls through the workspace action toolbar. | Remove product-visible lifecycle controls and keep lifecycle operations behind the UI test bridge. | T019, T033-T034, T072 |
| Pane resize | `PaneResizer.tsx` uses plus/minus controls. | Editor-like drag boundaries, persisted desired widths, and no right-edge blank space when panes fit. | T039-T056 |
| Pane headers | File and directory headers exist but need target spacing, live-dot gaps, offset/find gaps, and long-name no-overlap coverage. | Match target file/directory header structure and no-overlap behavior. | T041-T044, T057-T059 |
| Popovers | Search and time-offset popovers are pane-owned but still need compact target sizing and stronger focus/anchor coverage. | Compact pane-local popovers anchored to the invoking pane/control. | T077-T092 |
| Future surfaces | Activity Rail future actions are disabled, and Directory Search is not implemented. | Keep future controls unavailable and document Files/Directory Search guardrails as design-alignment deltas only. | T019, T070 |

## Phase 1 Scaffolding Status

Phase 1 prepares selectors, helper APIs, and tracking documents. It does not
change production behavior or close user-story acceptance criteria by itself.

| Task | Purpose | Status |
| --- | --- | --- |
| T001 | Record this implementation inventory. | Complete |
| T002 | Extend shared test IDs for alignment deltas. | Complete |
| T003 | Extend shared React shell fixture options. | Complete |
| T004 | Extend Web Playwright shell locators. | Complete |
| T005 | Extend Desktop WDIO shell locators and bridge helpers. | Complete |
| T006 | Extend macOS XCTest shell assertions. | Complete |
| T007 | Create the running validation log. | Complete |

## Follow-Up Checks Before Story Work

- Compare this inventory against
  `docs/mockups/crosslog-macos-redesign-mockups.html` before beginning US1.
- Keep new tests tied to documented deltas from `contracts/test-automation.md`.
- Use `specs/003-macos-ui-design-alignment/validation-log.md` for local gate
  results, OS-specific chrome evidence, and timed empty-workspace review
  evidence.
