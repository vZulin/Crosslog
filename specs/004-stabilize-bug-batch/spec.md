# Feature Specification: Crosslog Bug Batch Stabilization

**Feature Branch**: `004-stabilize-bug-batch`
**Created**: 2026-06-30
**Status**: Draft
**Input**: User description: "Create a Crosslog bug-fix stabilization specification for the full bug batch described in docs/Bugs_1.txt. Every numbered bug is in scope and its expected result is authoritative. Preserve all functionality not explicitly described in docs/Bugs_1.txt or prior specifications. Source opening must use user-selected files or directories, not predefined demo sources, except where automated tests intentionally use fixtures through existing test helpers."

**Authoritative Inputs**:

- `docs/Bugs_1.txt`
- `specs/001-multi-log-analysis`
- `specs/003-macos-ui-design-alignment`
- Existing UI behavior and test automation contracts under the prior specifications

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open User-Selected Sources From Empty And Topbar Entry Points (Priority: P1)

A user starts from an empty workspace or uses the add-pane control and opens only
the file or directory they choose, while unfinished global source and command
entry points remain unavailable instead of opening demo or unrelated sources.

**Why this priority**: Source opening is the first required workflow. Opening
predefined demo sources or invoking future global surfaces breaks trust and
prevents real log analysis.

**Independent Test**: Start with no panes, activate the empty workspace open
action, cancel once, then select a file and a directory through supported source
selection flows. Repeat from the add-pane control and verify every created pane
uses the user-selected source only.

**Required UI Test**: UI/E2E coverage MUST verify empty workspace source
opening, add-pane source opening, user cancellation, empty workspace drag and
drop, inactive activity rail source/search entries, inactive command field
behavior, and absence of predefined demo-source creation in product flows.

**Acceptance Scenarios**:

1. **Given** the empty workspace is visible, **When** the user activates the
   empty workspace open action and selects a file or directory, **Then** one new
   Log Pane opens for the selected source.
2. **Given** the empty workspace is visible, **When** the user activates the
   empty workspace open action and cancels source selection, **Then** no pane is
   opened and no predefined source appears.
3. **Given** the add-pane control is activated, **When** the user selects a file
   or directory, **Then** a new Log Pane opens for that selected source using
   the existing pane layout rules.
4. **Given** the user drops a supported file or directory onto the empty
   workspace, **When** the drop completes, **Then** a new Log Pane opens for the
   dropped source.
5. **Given** the activity rail source list, activity rail search, or topbar
   command field represents a future global surface, **When** the user activates
   it before that surface exists, **Then** it remains disabled or inert and does
   not open panes, demo sources, or pane-local search.

---

### User Story 2 - Navigate And Arrange Panes Without Wasted Workspace Space (Priority: P1)

A user reads log content inside each pane, scrolls vertically and horizontally,
reorders panes by dragging headers, sees compact line-number gutters, and uses
keyboard arrows to navigate without losing synchronization behavior.

**Why this priority**: Crosslog's primary value is side-by-side comparison of
real logs. Pane sizing, scrolling, ordering, gutters, and keyboard navigation
must work before search and synchronization can be trusted.

**Independent Test**: Open panes containing short lines, long lines, many lines,
and timestamped lines. Verify horizontal sizing in one-pane and multi-pane
states, wheel scrolling inside a pane, pane reordering by header drag, compact
line-number gutter widths, and arrow-key navigation with synchronization both
enabled and disabled.

**Required UI Test**: UI/E2E coverage MUST include pane layout fit and overflow
viewports, no-overlap checks, vertical wheel scrolling inside the log viewport,
header drag reordering including multi-position moves, line-number gutter
widths at digit-count boundaries, keyboard left/right/up/down navigation, and
synchronized scrolling triggered by keyboard and wheel navigation where
applicable.

**Acceptance Scenarios**:

1. **Given** one pane is open and every loaded log line is shorter than the
   workspace, **When** the pane is rendered, **Then** the visible pane fills the
   workspace width without creating unnecessary scrollable blank space.
2. **Given** one or more panes contain a line longer than the visible pane
   width, **When** the user scrolls a pane horizontally, **Then** the full
   longest loaded line is reachable through the pane's horizontal content range
   without making the visible pane wider than the workspace.
3. **Given** any pane has more lines than fit vertically, **When** the user
   wheels inside the log viewport, **Then** the pane scrolls up and down through
   all available loaded lines.
4. **Given** synchronization is enabled, **When** vertical or keyboard
   navigation changes the active pane's anchor line, **Then** other eligible
   panes synchronize according to the existing timestamp rules.
5. **Given** the user drags a pane header across another pane's midpoint,
   **When** the drag is released, **Then** the dragged pane moves to the target
   position and intervening panes shift while preserving their relative order.
6. **Given** a pane has 10-99, 100-999, or 1000-9999 lines, **When** line
   numbers render, **Then** the gutter reserves only the matching two, three, or
   four digit character width plus required readable spacing.
7. **Given** a log viewport is focused, **When** the user presses arrow keys,
   **Then** left/right move horizontal caret or viewport position and up/down
   move the selected line, preserving synchronization rules when enabled.

---

### User Story 3 - Search And Copy Text With Correct Highlighting And Popover Lifecycle (Priority: P1)

A user searches within a pane and copies selected log text from a context action
that appears at the pointer, highlights only exact matches, and disappears or
moves according to normal click behavior.

**Why this priority**: Search and copying are core troubleshooting workflows.
Incorrect highlights, misplaced context actions, or stale popovers cause users
to copy or inspect the wrong text.

**Independent Test**: Open a pane with mixed-case plain text and regular
expression matches. Hover the pane search button, search with case-sensitive and
regular expression modes, close the search popover, select text, right-click in
multiple viewport positions, copy the selection, and verify no product-visible
"Copied" message appears.

**Required UI Test**: UI/E2E coverage MUST include search button hover/focus
positioning, pane-local search highlighting for plain text, case-sensitive, and
regular expression matches, search close cleanup, context action positioning
near the pointer and within the viewport, left-click dismissal, right-click
relocation, copy action result, absence of copy confirmation text, keyboard
accessibility, and popover no-overlap checks at viewport edges.

**Acceptance Scenarios**:

1. **Given** the pane search button is hovered or focused, **When** its visual
   highlight appears, **Then** the highlight surrounds the search icon and is
   not offset away from the control.
2. **Given** pane search contains a query that matches part of a line, **When**
   results are displayed, **Then** only the matching text spans are highlighted,
   not the full row.
3. **Given** case-sensitive or regular expression mode is active, **When** the
   query is evaluated, **Then** highlighted spans exactly match the active
   search mode and character-case rules.
4. **Given** search navigation has moved to a match, **When** the pane search
   popover closes, **Then** search highlighting is removed and the current
   cursor or selected line remains at the last navigated match.
5. **Given** text is selected inside a pane, **When** the user right-clicks the
   selection, **Then** the copy-selection action appears immediately to the
   right of the pointer, adjusted only as needed to remain visible.
6. **Given** the copy-selection action is visible, **When** the user left-clicks
   elsewhere, **Then** the action disappears.
7. **Given** the copy-selection action is visible, **When** the user right-clicks
   a valid selection position elsewhere, **Then** the action moves to the new
   pointer position.
8. **Given** the copy-selection action is activated, **When** the selected text
   is copied, **Then** no product-visible "Copied" toast, banner, label, or
   status text appears.

---

### User Story 4 - Apply Time Offsets With Clear Boundary Validation (Priority: P2)

A user edits pane time offsets with predictable field limits, can leave fields
blank to mean zero, and cannot apply out-of-range hour, minute, second, or
millisecond values.

**Why this priority**: Time offset values directly affect synchronized
navigation. Silent acceptance of invalid boundaries makes cross-pane timestamp
alignment unreliable.

**Independent Test**: Open the time offset editor, enter valid boundary values,
enter out-of-range values for hours, minutes, seconds, and milliseconds, clear
each field, and apply changes while verifying the resulting offset used for
synchronization.

**Required UI Test**: UI/E2E coverage MUST include valid and invalid boundary
values for every field, blank-field application as zero, pane-local validation
messages, keyboard entry, accessible invalid states, and synchronization after a
valid offset is applied.

**Acceptance Scenarios**:

1. **Given** the time offset editor is open, **When** the user enters any whole
   number of days, **Then** the value is accepted.
2. **Given** the time offset editor is open, **When** the user enters hours
   outside 0-23, minutes outside 0-59, seconds outside 0-59, or milliseconds
   outside 0-999, **Then** the value is rejected and the offset is not applied.
3. **Given** the time offset editor is open, **When** the user clears any offset
   field and applies the editor, **Then** the blank field is treated as zero and
   no whole-number warning is shown for that blank field.
4. **Given** a valid offset is applied, **When** synchronized navigation occurs,
   **Then** the applied offset affects that pane according to the existing
   synchronization rules.

---

### User Story 5 - See Accurate Sync, Settings, And Theme State (Priority: P2)

A user can distinguish synchronization on/off state from hover state, open a
settings dialog from the activity rail, change theme from settings, and starts
from the system theme by default.

**Why this priority**: Global application state must be visible and controllable.
The prior design alignment made theme presentation test-only, but this bug
batch explicitly requires a product settings surface with at least theme
selection.

**Independent Test**: Start from a fresh state, verify the theme follows the
system default, toggle synchronization and compare off/on/hover states, open
settings from the activity rail, change theme to light and dark, return to
system theme, and verify the choice applies without changing unrelated
workflows.

**Required UI Test**: UI/E2E coverage MUST include sync icon state assertions,
accessible pressed/unpressed state, settings dialog opening from empty and
populated workspaces, theme selection controls, default system theme behavior,
viewport/no-overlap checks for settings, keyboard navigation, and preservation
of pane, search, source, and synchronization behavior after theme changes.

**Acceptance Scenarios**:

1. **Given** synchronization is disabled, **When** the user views the topbar
   sync control, **Then** the icon uses the inactive visual state.
2. **Given** synchronization is enabled, **When** the user views the topbar sync
   control without hovering it, **Then** the icon uses a distinct active visual
   state such as blue and does not use the hover highlight treatment.
3. **Given** the settings activity rail control is activated, **When** settings
   opens, **Then** the user sees a settings dialog or panel containing at least
   a theme setting.
4. **Given** no stored theme preference exists, **When** the application starts,
   **Then** the application uses the system theme.
5. **Given** the user changes the theme in settings, **When** the setting is
   applied, **Then** the application surfaces update to the selected theme while
   existing panes and analysis state remain intact.
6. **Given** the selected theme preference is System, **When** the operating
   system theme changes while Crosslog is open, **Then** application surfaces
   update to the new resolved system theme without closing panes or resetting
   analysis state.

### Edge Cases

- The user cancels source selection from the empty workspace or add-pane control.
- Source opening is requested when the current platform does not support a
  specific source selection or drag-and-drop interaction.
- Automated tests use fixture sources through existing test helpers while
  product UI flows require user-selected files or directories.
- The workspace contains no panes, one pane, panes that fit, and panes that
  overflow horizontally.
- A pane contains an empty file, a single very long line, many short lines, or a
  line count crossing 9, 99, 999, and 9999.
- The user drags a pane header over multiple panes, back to its original
  position, or releases outside the pane workspace.
- The log viewport is focused while synchronization is enabled, disabled, or
  unavailable because other panes have no timestamps.
- Search has zero matches, overlapping text-like matches, invalid regular
  expressions, case differences, and matches outside the current viewport.
- Search or copy popovers are opened near the right, left, top, or bottom edge
  of the visible workspace.
- The selected copy range becomes empty before the context action is activated.
- The user opens or closes search, copy, time offset, or settings surfaces while
  another popover is already visible.
- Time offset fields contain boundary values, blank values, non-whole values,
  and out-of-range values.
- The application starts with no stored theme preference, and the system theme
  changes while the application is open with System selected.
- Future global command, source list, or all-pane search surfaces are activated
  before their feature specifications exist.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The stabilization MUST cover every numbered bug in
  `docs/Bugs_1.txt`; the expected result for each numbered bug is authoritative.
- **FR-002**: The stabilization MUST preserve behavior from
  `specs/001-multi-log-analysis` and `specs/003-macos-ui-design-alignment`
  except where a numbered bug explicitly supersedes it.
- **FR-003**: Product source-opening actions MUST open only user-selected files
  or directories and MUST NOT open predefined demo sources.
- **FR-004**: Automated tests MAY use fixture files or directories only through
  existing test helpers intended for automated setup.
- **FR-005**: The empty workspace open action MUST open a supported source
  selection flow and create a pane only for the selected file or directory.
- **FR-006**: The add-pane control MUST open a supported source selection flow
  and create a new pane only after the user selects a file or directory.
- **FR-007**: Cancelling source selection from the empty workspace or add-pane
  control MUST leave the workspace unchanged.
- **FR-008**: Empty workspace drag and drop MUST open a new pane for each
  supported dropped file or directory according to existing source-opening
  rules on both Web and Desktop targets.
- **FR-009**: The activity rail source-list entry MUST be disabled or inert
  until the source list side panel exists; it MUST NOT open demo sources or
  panes.
- **FR-010**: The activity rail search entry MUST be disabled or inert until
  all-active-pane search exists; it MUST NOT open pane-local search.
- **FR-011**: The topbar command field MUST be disabled or inert until command
  and all-active-pane search exists; it MUST NOT open pane-local search.
- **FR-012**: Pane horizontal content width MUST avoid unnecessary blank
  scrollable space while still allowing the full longest loaded line in that
  pane to be reached through horizontal scrolling.
- **FR-013**: A single pane with all loaded lines narrower than the workspace
  MUST fill the workspace width.
- **FR-014**: Multiple visible panes MUST size from the workspace width, pane
  count, and existing resize/layout rules; long log lines MUST extend only the
  pane's horizontal content range and MUST NOT force the visible pane wider than
  the workspace.
- **FR-015**: Vertical wheel scrolling inside any log viewport MUST allow the
  user to reach all loaded lines above and below the current position.
- **FR-016**: When synchronization is enabled, pane scrolling and keyboard
  navigation MUST continue to move other eligible panes according to the
  existing timestamp synchronization rules.
- **FR-017**: Users MUST be able to reorder panes by dragging a pane header.
- **FR-018**: During pane reordering, the dragged pane MUST move once the pointer
  reaches the midpoint of another pane, and intervening panes MUST retain their
  relative order.
- **FR-019**: Line-number gutter width MUST be based on the digit count of the
  pane's total line count and MUST avoid unnecessary left padding.
- **FR-020**: Focused log viewports MUST support arrow-key navigation:
  left/right for horizontal caret or viewport movement and up/down for selected
  line movement.
- **FR-021**: Pane layout, reordering, gutter, scrolling, and keyboard
  navigation MUST remain accessible and non-overlapping across covered
  viewports.
- **FR-022**: The pane search button hover and focus treatment MUST visually
  surround the search icon.
- **FR-023**: Pane search results MUST highlight only matching text spans,
  respecting the active plain-text, regular expression, and case-sensitive
  search rules.
- **FR-024**: Closing pane search MUST remove search-result highlight styling
  while preserving the current cursor or selected-line location at the last
  navigated match.
- **FR-025**: The copy-selection action MUST appear beside the pointer that
  opened it and MUST NOT be anchored to the pane's top-left corner.
- **FR-026**: A visible copy-selection action MUST dismiss on a left click
  outside the action.
- **FR-027**: A visible copy-selection action MUST move to the new pointer
  position on a valid right click.
- **FR-028**: Copying selected text MUST NOT show a product-visible "Copied"
  toast, banner, label, or status message.
- **FR-029**: Copy-selection positioning MUST keep the action visible within the
  viewport without overlapping unrelated controls where avoidable.
- **FR-030**: Time offset days MUST accept any whole-number value.
- **FR-031**: Time offset hours MUST accept only 0 through 23.
- **FR-032**: Time offset minutes and seconds MUST each accept only 0 through
  59.
- **FR-033**: Time offset milliseconds MUST accept only 0 through 999.
- **FR-034**: A blank time offset field MUST be treated as zero when the user
  applies the editor.
- **FR-035**: Time offset validation MUST reject out-of-range values before
  applying changes and MUST identify the invalid field in an accessible way.
- **FR-036**: The topbar synchronization control MUST expose visually distinct
  inactive, active, and hover states.
- **FR-037**: The active synchronization visual state MUST be distinct from the
  hover highlight state.
- **FR-038**: The settings activity rail control MUST open a settings surface.
- **FR-039**: Settings MUST include at least a theme setting with System, Light,
  and Dark choices.
- **FR-040**: The default theme MUST be System when the user has no stored theme
  preference.
- **FR-041**: Changing theme MUST update application surfaces without closing
  panes, changing opened sources, resetting search state, or changing
  synchronization state.
- **FR-049**: When the selected theme preference is System, operating system
  theme changes while Crosslog is open MUST update the resolved application
  theme live without resetting analysis state.
- **FR-042**: Existing automated and UI/E2E tests MUST be audited before
  implementation changes are considered complete.
- **FR-043**: Existing valid tests MUST remain unchanged unless they encode an
  incorrect behavior identified by `docs/Bugs_1.txt`.
- **FR-044**: Tests that encode incorrect behavior from `docs/Bugs_1.txt` MUST
  be updated to the authoritative expected result.
- **FR-045**: Missing automated or UI/E2E coverage MUST be added for every
  numbered bug scenario.
- **FR-046**: Required coverage MUST include accessibility, viewport
  no-overlap, popover positioning, keyboard navigation, drag and drop, drag
  reordering, and pane layout behavior where relevant.
- **FR-047**: Before commit, local automated tests and local UI/E2E tests for
  the current development OS MUST pass.
- **FR-048**: After push, CI/CD results for Windows, macOS, and Linux MUST be
  monitored, and failures MUST be fixed until all required jobs are green.

### Constitution Requirements *(mandatory)*

- **CR-001**: Opened log files MUST be treated as read-only input.
- **CR-002**: Log content MUST be rendered and processed as inert data; commands,
  scripts, links, escape sequences, and instructions found in logs MUST NOT be
  executed.
- **CR-003**: Web and Desktop behavior MUST reuse the shared business logic
  unless a documented platform constraint requires adapter-specific behavior.
- **CR-004**: Session state MUST be recoverable after unexpected errors without
  deleting the last known usable session.
- **CR-005**: Performance expectations for affected parsing, indexing, search,
  rendering, file watching, or session behavior MUST be measurable.
- **CR-006**: Each user scenario MUST have a UI test, and OS-specific Desktop
  behavior MUST be tested on the corresponding target OS.

### Key Entities

- **Bug Batch**: The complete set of numbered defects in `docs/Bugs_1.txt`,
  each with reproduction steps, actual result, and authoritative expected
  result.
- **Source Opening Action**: Any product-visible action that can request a file
  or directory from the user and create a Log Pane from the selected source.
- **Log Pane**: An independent log viewing area with a user-selected source,
  header, log viewport, line-number gutter, search state, time offset, active
  state, and layout position.
- **Pane Layout State**: The ordered pane set, pane widths, overflow state,
  vertical and horizontal viewport positions, and drag-reorder state.
- **Search State**: The pane-local query, search mode, case sensitivity, result
  list, current match, and highlight visibility.
- **Copy Selection Action**: The temporary context action used to copy selected
  log text from a pointer position.
- **Time Offset Draft**: The editable pane-local days, hours, minutes, seconds,
  and milliseconds values before they are applied to synchronization.
- **Synchronization State**: The global on/off state, topbar icon state, active
  time anchor pane, and synchronized movement rules.
- **Settings Surface**: The product-visible settings dialog or panel opened from
  the activity rail, containing at least theme selection.
- **Test Coverage Map**: The trace from each numbered bug and preserved prior
  requirement to existing, updated, or newly added automated and UI/E2E tests.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the 22 numbered bug scenarios have explicit automated or
  UI/E2E coverage mapped to their authoritative expected result.
- **SC-002**: In source-opening validation, 100% of product source-opening
  actions create panes only from user-selected or dropped sources and never from
  predefined demo sources.
- **SC-003**: In covered pane layout viewports, visible pane sizing, horizontal
  content reachability for the longest loaded line, vertical scrolling, drag
  reordering, line-number gutter width, and keyboard navigation match the
  stabilization requirements in 100% of checks.
- **SC-004**: In covered search and copy workflows, matching text highlighting,
  search cleanup, copy-selection positioning, dismissal, relocation, and absence
  of "Copied" product text match requirements in 100% of checks.
- **SC-005**: Time offset validation accepts all documented valid boundary and
  blank-field cases and rejects all documented out-of-range cases in 100% of
  checks.
- **SC-006**: Sync icon state, settings opening, theme selection, default
  System theme behavior, and live resolved-system-theme updates match
  requirements in 100% of covered empty and populated workspace states.
- **SC-007**: Existing valid regression tests for unaffected MVP and macOS UI
  alignment behavior continue to pass in 100% of required local validation.
- **SC-008**: Before commit, the current-OS local automated and UI/E2E gates
  pass; after push, required Windows, macOS, and Linux CI/CD gates are monitored
  and pass before the stabilization is considered complete.
- **SC-009**: No regression introduces remote source access, source reveal
  actions, file-management operations, filtering, bookmarks, saved filter sets,
  recursive directory search, or other future-scoped capabilities not required by
  this bug batch.

## Assumptions

- The current local development OS for this specification is macOS; Windows and
  Linux validation occurs through CI/CD after push.
- Source selection cancellation is a normal user action and should leave the
  pane layout unchanged.
- Existing test helpers may prepare fixture files and directories for automated
  tests, but those helpers are not product source-opening behavior.
- The required settings scope for this stabilization is limited to theme
  selection unless a prior valid requirement already covers another setting.
- Future global surfaces for source lists, all-pane search, and command search
  remain out of scope and should be disabled or inert instead of partially
  implemented.
- Product-visible "Copied" feedback is unnecessary for this stabilization; the
  copy operation still completes when permitted by the user's environment.
