# Research: Crosslog Bug Batch Stabilization

## Decision: Use the newly created stabilization spec as source of truth

**Rationale**: `specs/004-stabilize-bug-batch/spec.md` maps the complete
22-item bug batch to product requirements and explicitly supersedes prior specs
only where a bug says so.

**Alternatives considered**:

- Use current implementation behavior as truth: rejected because multiple
  existing tests encode broken behavior from `docs/Bugs_1.txt`.
- Re-plan the MVP: rejected because `specs/001-multi-log-analysis` remains the
  functional baseline.

## Decision: Keep the current architecture and add no dependency by default

**Rationale**: The fixes fit existing boundaries: `packages/core` for shared
rules, `packages/ui` for shared React UI, `packages/platform` for ports and
adapters, and thin Web/Desktop shells. Dependency additions would violate the
minimal bug-fix scope unless source picking proves impossible with existing
platform APIs.

**Alternatives considered**:

- Add a UI kit or drag/drop library: rejected because the existing components
  and pointer events are sufficient.
- Add a Tauri dialog dependency immediately: rejected for the plan. If Desktop
  native file-manager support cannot be completed with current dependencies and
  existing ports, implementation must request approval before adding it.

## Decision: Separate product source opening from fixture setup

**Rationale**: Bugs 1, 2, 12, 16, and the scope guardrail prohibit product UI
from opening predefined demo sources. Automated tests can still use fixtures
through existing test helpers and UI test bridge actions.

**Alternatives considered**:

- Keep `Open Source` as a sample-data shortcut: rejected because it is the
  reported defect.
- Remove fixture setup entirely: rejected because existing UI/E2E suites need
  deterministic log data.

## Decision: Use existing source picker port boundaries

**Rationale**: `SourcePickerPort` already expresses user-selected file and
directory selection. Wiring it into `CrosslogPlatform` keeps platform-specific
behavior behind existing port architecture and avoids source-selection logic in
shared UI.

**Alternatives considered**:

- Hard-code browser input handling in `AppShell`: rejected because Desktop
  source selection would drift.
- Open demo files from product actions: rejected by the bug report.

## Decision: Treat activity rail source/search and command field as unavailable

**Rationale**: Bugs 12, 13, and 16 say these controls are future global surfaces
and must not open demo sources or pane-local search now. Pane header search
remains the available pane-local search entry point.

**Alternatives considered**:

- Implement full source list, all-pane search, and command search: rejected as
  scope broadening.
- Hide all controls: acceptable only if the resulting UI still satisfies prior
  design contracts. Disabled or inert with accessible unavailable state is the
  safer plan.

## Decision: Preserve desired pane widths and compute rendered width separately

**Rationale**: Prior specs require persisted desired pane widths. Bug 3 requires
efficient visible width and no excessive blank horizontal scroll space. A view
calculation can satisfy display constraints without overwriting user/session
width preferences.

**Alternatives considered**:

- Persist computed fill widths: rejected because it corrupts user-resized
  widths.
- Keep fixed pane widths only: rejected because it preserves the reported blank
  space defect.

## Decision: Add viewport-owned vertical and keyboard navigation state

**Rationale**: Bugs 4 and 20 require vertical wheel scrolling, selected-line
movement, horizontal navigation, and synchronization triggers from navigation.
The viewport is the correct owner for focus and user navigation state, while
sync planning remains shared.

**Alternatives considered**:

- Rely only on click and search navigation: rejected because arrow keys and
  wheel scrolling are explicit requirements.
- Fork Web and Desktop behavior: rejected because behavior must remain shared.

## Decision: Render search matches as inline spans from existing ranges

**Rationale**: Core search already returns line numbers and source ranges.
Rendering those ranges as inline highlighted text fixes bug 9 without changing
search semantics.

**Alternatives considered**:

- Keep row-level `data-search-match` highlighting: rejected because it is the
  reported defect.
- Rebuild the search engine: rejected because existing range output is enough.

## Decision: Search close clears visible highlights but preserves navigation target

**Rationale**: Bug 21 requires highlights to disappear while cursor/selected
line remains at the last navigated match. This is a view-state separation, not a
search-engine rewrite.

**Alternatives considered**:

- Reset all search state on close: rejected because it may lose the last
  navigation target and pane-local query state unnecessarily.

## Decision: Copy-selection action is pointer-positioned and ephemeral

**Rationale**: Bugs 6, 7, and 8 define context action position and lifecycle,
and prohibit product-visible `Copied` feedback. The copy operation remains, but
confirmation text is removed from product UI.

**Alternatives considered**:

- Keep a status message for copy success: rejected by bug 8.
- Anchor the action to pane bounds: rejected by bug 6.

## Decision: Validate time offset drafts before normalization

**Rationale**: Current normalization can turn out-of-range values such as 61
minutes into valid normalized offsets. Bugs 10 and 22 require field-level
limits and blank-as-zero behavior. Draft validation must happen before Apply.

**Alternatives considered**:

- Normalize all whole numbers: rejected because hours/minutes/seconds/ms have
  explicit boundaries.
- Reject blank fields: rejected by bug 22.

## Decision: Add minimal settings surface and System theme preference

**Rationale**: Bugs 14 and 15 explicitly supersede the prior 003 limitation
that theme selectors were not product-visible. The smallest valid product
surface is a settings dialog or panel with System, Light, and Dark theme
choices, defaulting to System.

**Alternatives considered**:

- Keep theme as test-only presentation state: rejected by bugs 14 and 15.
- Build full preferences/settings: rejected as scope broadening.

## Decision: Audit and update tests by requirement, not implementation output

**Rationale**: The constitution and user request require valid tests to remain
unchanged, incorrect expectations to be updated, and missing coverage to be
added for every bug scenario.

**Alternatives considered**:

- Rewrite all UI tests: rejected because prior MVP/alignment coverage remains
  valuable.
- Update expectations only after implementation: rejected because tests should
  encode the authoritative expected results first.
