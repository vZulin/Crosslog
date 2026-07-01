# Research: Crosslog macOS UI Design Alignment

This research records only decisions that remain relevant after
`specs/002-redesign-activity-rail`. It does not restate the full Activity Rail
redesign plan.

## Decision: Keep The Existing Stack And Shared Package Boundaries

**Rationale**: The updated design changes layout, shell chrome, tokens, and
control placement. It does not change parsing, indexing, source opening,
directory navigation, search, synchronization, file watching, session restore,
or platform capability behavior. The current React, Vite, Zustand, TanStack
Virtual, Tauri 2, Vitest, Playwright, WebdriverIO, and macOS XCTest stack is
already used by `specs/001-multi-log-analysis` and
`specs/002-redesign-activity-rail`.

**Alternatives considered**:

- Add a UI kit: rejected because the target needs compact, product-specific
  pane layout and would increase dependency and styling drift.
- Rewrite platform adapters: rejected because platform behavior is unchanged.
- Introduce a backend or parser rewrite: rejected because no new product
  capability is in scope.

## Decision: Map The Updated Design Tokens Onto Existing CSS Entry Points

**Rationale**: `packages/ui/src/app-shell/activity-rail-theme.css` already owns
the Activity Rail shell styling. The correct delta is to align its variables to
`docs/crosslog-ui-design.md`, add dark-theme values, and apply those tokens to
all app surfaces. This keeps style ownership local and avoids a new theming
dependency.

**Alternatives considered**:

- Keep current light-only tokens: rejected because the spec requires light and
  dark themes on actual application UI.
- Duplicate a separate dark stylesheet: rejected because shared tokens make
  cross-surface consistency and tests simpler.

## Decision: Treat Theme Variant As Minimal Presentation State

**Rationale**: The design requires a selectable light/dark appearance. This is
UI presentation state, not log-analysis state. It must affect actual topbar,
rail, panes, popovers, statusbar, severity rows, and tags, but it must not
modify sources, parser output, or session source data.

**Alternatives considered**:

- Use only OS color-scheme: rejected because tests and user selection require
  deterministic light/dark states.
- Store theme in each pane: rejected because theme is shell-level state.

## Decision: Treat Platform Chrome Variant As Shell Presentation State

**Rationale**: Current `CrosslogPlatform.kind` only separates `web` and
`desktop`, while the updated mockups require macOS, Windows, Linux, and Web
chrome variants. The variant should render shell chrome and CSS differences
without forking product behavior or rewriting platform adapters.

**Alternatives considered**:

- Expand source capability adapters by OS: rejected because file/source behavior
  does not change.
- Hard-code macOS chrome for all Desktop builds: rejected because the spec
  requires Windows and Linux variants.

## Decision: Preserve Desired Pane Widths And Compute Fill Widths In The View

**Rationale**: Existing reducer and session logic preserve pane widths. The new
right-edge alignment requirement is a rendering rule: when the sum of desired
pane widths is less than workspace width, distribute the extra visual space so
the rightmost pane reaches the workspace edge. Persisting auto-filled widths
would overwrite user intent and create session churn.

**Alternatives considered**:

- Persist auto-stretched widths: rejected because responsive viewport changes
  would mutate saved user layout.
- Keep fixed widths and tolerate blank space: rejected by the updated spec.

## Decision: Route Topbar Add Through Rightmost-Pane Split

**Rationale**: Existing `splitPaneLayout` already implements split behavior and
`closePaneLayout` already redistributes closed pane width. The topbar add
control should reuse that behavior against the rightmost pane when panes exist,
and add the first pane only when the workspace is empty.

**Alternatives considered**:

- Keep a separate visible Split button: rejected as an explicit removal.
- Append a new fixed-width pane: rejected because it does not match the target
  add-pane behavior.

## Decision: Remove Product Obsolete Controls, Keep Test Operations Behind Test APIs

**Rationale**: `Discover newer directory file`, `Append live line`, `Delete
active file`, `Replace active file`, permanent `Copy`, `Split`, sync text, and
plus/minus resize controls are product UI regressions against the target
mockups. Tests that need lifecycle simulation should use the existing UI test
bridge or internal test-only actions instead of visible product controls.

**Alternatives considered**:

- Hide obsolete controls only with CSS: rejected because hidden-but-present
  controls can remain reachable by tests or assistive technology.
- Remove lifecycle test coverage: rejected because MVP behavior must remain
  covered.

## Decision: Keep Popovers Pane-Owned And Tighten Their Anchors

**Rationale**: Current `LogPane` renders pane search and time offset popovers
inside the owning pane, which is the correct direction and avoids the previous
global left/center positioning bug. The remaining delta is compact sizing,
alignment to the invoking control, opening from any pane, Escape/focus return,
and removing the time-offset Close button from the target UI.

**Alternatives considered**:

- Move popovers to a global portal: rejected because it risks reintroducing
  pane-position ambiguity.
- Keep the current larger popover layouts: rejected because the updated mockups
  define compact standalone popovers.

## Decision: Keep Directory Search Left Panel Feature-Gated

**Rationale**: The left panel mockup documents a future/search-scope surface.
Directory-wide search, recursive search, saved filters, and related navigation
are outside MVP unless another specification implements them. The alignment work
may render a guarded shell only if it cannot execute future behavior.

**Alternatives considered**:

- Implement directory-wide search as part of alignment: rejected because it is
  new product functionality.
- Remove all rail search affordances: rejected because existing per-pane search
  remains MVP behavior.

## Reuse And Gap Audit Summary

| Classification | Items |
| --- | --- |
| CSS/token update | Light/dark design tokens, compact topbar sizing, activity rail sizing, pane header spacing, popover dimensions, scrollbars, Web no radius/shadow. |
| Component layout update | Platform chrome, topbar command/sync/add grouping, empty workspace drop zone, pane headers, drag resize handles, compact popovers. |
| Behavior wiring update | Theme selection, shell platform variant, add-pane splits rightmost pane, drag resizing, view-computed pane fill widths, test bridge lifecycle operations, Escape/focus return. |
| Obsolete-control removal | Visible Split, Sync text/checkbox text, workspace action toolbar, permanent Copy toolbar, plus/minus resize buttons, pane ready footer, FuturePaneToolbarSlot in product UI. |
| Test selector update | Existing Web, WDIO, macOS XCTest, and component tests that assert old labels such as `Open logs`, `Synchronize by time`, `Sync on`, `Split active pane`, or resize `+`/`-`. |
| Missing test | Empty workspace target layout, timed source-opening recognition review, theme variants, platform variants including default OS chrome evidence, right-edge pane alignment, drag resize, compact popover positioning, header no-overlap, obsolete-control absence, explicit Files/Directory Search guardrails. |
| No-op because already implemented | Activity rail order/future guard behavior, core pane width persistence, close redistribution, directory navigation semantics, independent pane horizontal scrolling, search/sync/offset core behavior, read-only safety, inert rendering, session restore. |

## Test Reuse Decision

Reuse unchanged:

- `packages/core/tests/**`
- `packages/platform/tests/**`
- `tests/integration/**`
- `tests/performance/**` unless rendering/scrolling changes require a perf
  measurement run
- Rust adapter tests under `apps/desktop/src-tauri`

Update existing UI tests:

- `packages/ui/tests/app-shell/*.test.tsx`
- `packages/ui/tests/pane-rail/*.test.tsx`
- `packages/ui/tests/log-pane/*.test.tsx`
- `packages/ui/tests/search/*.test.tsx`
- `packages/ui/tests/sync/*.test.tsx`
- `apps/web/tests/ui/*.spec.ts`
- `apps/desktop/tests/ui/*.spec.ts`
- `apps/desktop/tests/ui/macos/*.swift`

Add only missing alignment tests:

- obsolete-control absence
- empty workspace target layout
- timed empty-workspace source-opening recognition review
- light/dark application UI
- platform chrome variants, including default OS chrome evidence
- rightmost-pane alignment and overflow behavior
- drag resize and persisted desired widths
- compact popover positioning in left, middle, and right panes
- header no-overlap with long names
- future rail, Files MVP-only behavior, and left-panel guardrails

## Unresolved Clarifications

None. All implementation decisions above can be made from the existing spec,
design document, mockups, and prior Activity Rail artifacts.
