# Feature Specification: Crosslog macOS UI Design Alignment

**Feature Branch**: `003-macos-ui-design-alignment`  
**Created**: 2026-06-28  
**Status**: Draft  
**Input**: User description: "Create a specification for aligning the existing Crosslog Activity Rail redesign with the updated UI design document and HTML mockups. This is not a new product feature. Reuse `specs/001-multi-log-analysis` as the functional baseline and `specs/002-redesign-activity-rail` as the redesign baseline. Add only the deltas required by `docs/crosslog-ui-design.md` and `docs/mockups/crosslog-macos-redesign-mockups.html`."

**Authoritative Inputs**:

- `docs/crosslog-ui-design.md`
- `docs/mockups/crosslog-macos-redesign-mockups.html`
- `crosslog-requirement-specification.md`
- `specs/001-multi-log-analysis`
- `specs/002-redesign-activity-rail`

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Use the Aligned Shell Without Obsolete Controls (Priority: P1)

A user starts Crosslog and sees the updated Activity Rail shell with a compact
topbar, activity rail, empty workspace entry point when no logs are open, and no
legacy test or development controls in the product UI.

**Why this priority**: The shell is the first visible surface of the redesign.
If obsolete controls remain or the empty state differs from the design contract,
the application no longer matches the approved UI direction.

**Independent Test**: Start Crosslog with no open panes, verify the updated
topbar, activity rail, centered drop zone, Open Source action, drag-and-drop
entry point, and verify that all obsolete controls are absent.

**Required UI Test**: A UI test opens the empty workspace and a populated
workspace, asserts the topbar command field, sync icon, add-pane icon, activity
rail order, empty drop zone, and absence of removed controls.

**Acceptance Scenarios**:

1. **Given** no panes are open, **When** the application starts, **Then** the
   user sees the aligned empty workspace with the shared topbar height,
   activity rail, centered drop zone, and Open Source action.
2. **Given** the shell is visible, **When** the user reviews the topbar, **Then**
   the command field, synchronization icon, and add-pane icon are immediately
   adjacent as defined by the design, and no Split button, synchronization
   checkbox, or text sync label appears.
3. **Given** the workspace is visible, **When** the user reviews product
   controls, **Then** permanent copy toolbar, workspace test-action toolbar,
   plus/minus resize buttons, and per-pane ready footers are absent.

---

### User Story 2 - Compare Logs in the Aligned Pane Workspace (Priority: P1)

A user opens multiple files or directories and compares logs in panes whose
headers, sizing, right-edge behavior, scrolling, and directory controls match
the updated design while preserving the existing multi-log analysis behavior.

**Why this priority**: Crosslog's primary value is side-by-side log comparison.
The design alignment must improve the workspace without changing the proven MVP
pane behavior.

**Independent Test**: Open one file source and two directory sources, verify
file and directory pane headers, add a pane, close a pane, resize boundaries by
dragging, and confirm the rightmost pane aligns to the workspace edge when the
pane set does not overflow.

**Required UI Test**: A UI test exercises pane creation, close, drag resize,
right-edge alignment, horizontal workspace overflow, independent pane horizontal
scrolling, directory previous/next controls, and header no-overlap with long
source names.

**Acceptance Scenarios**:

1. **Given** multiple panes fit within the workspace, **When** the layout is
   rendered, **Then** the right edge of the rightmost pane reaches the workspace
   edge without unused blank space.
2. **Given** panes exceed the available width, **When** the user navigates the
   workspace, **Then** horizontal workspace scrolling is available and every
   pane keeps independent horizontal scrolling for long log lines.
3. **Given** a directory pane is open, **When** the header is rendered, **Then**
   it shows the directory name, current file name, previous/next controls,
   offset tag, find icon, close action, and live/status indicators where
   applicable without overlapping text.
4. **Given** a file pane is open, **When** the header is rendered, **Then** it
   shows the file identity, live dot when watching is active, offset tag, find
   icon, and close action without directory navigation controls.

---

### User Story 3 - Use Pane-Local Compact Popovers (Priority: P2)

A user opens pane search or time offset from any pane and the compact popover
appears in the pane that invoked it, preserving independent per-pane search and
per-pane offset behavior.

**Why this priority**: Search and time offset are core analysis tools. The
updated UI fixes previous positioning ambiguity and keeps controls local to the
pane where the user is working.

**Independent Test**: Open at least three panes, trigger pane search and time
offset from each pane in turn, and verify that each popover appears within the
invoking pane while search state and offset state remain pane-local.

**Required UI Test**: A UI test opens pane search and time offset from left,
middle, and right panes; verifies compact controls, keyboard dismissal,
previous/next search navigation, search mode toggles, invalid regex handling,
offset validation, and pane-local anchoring.

**Acceptance Scenarios**:

1. **Given** the user activates pane find in any pane, **When** the search
   popover opens, **Then** it appears in the invoking pane and contains compact
   query, previous, next, case-sensitive, regex, and match-count controls.
2. **Given** the user activates an offset tag in any pane, **When** the time
   offset popover opens, **Then** it appears in the invoking pane and contains
   days, hours, minutes, seconds, milliseconds, and Apply controls.
3. **Given** a popover is open, **When** the user opens the same popover type
   from another pane, **Then** the popover moves to the newly invoking pane
   without carrying over another pane's draft state.
4. **Given** the user presses Escape, **When** a popover is open, **Then** it
   closes and focus returns to the triggering control.

---

### User Story 4 - Use the Same Product Across Themes and Platforms (Priority: P2)

A user renders Crosslog through the configured runtime, mockup, or test
appearance and platform presentation state, or uses Crosslog on macOS, Windows,
Linux, or Web, and sees appropriate shell chrome while the same product
workflow, pane behavior, and capability boundaries remain intact.

**Why this priority**: The updated mockups define both theme and platform
variants. A shell-only mockup switch is insufficient; the actual application UI
must reflect the selected appearance and platform conventions.

**Independent Test**: Render the workspace in light and dark appearances and in
each supported platform variant, then verify shell chrome, colors, text
contrast, and unchanged product behavior.

**Required UI Test**: A UI test verifies theme-applied application surfaces,
platform-specific window chrome, shared topbar/activity-rail/pane/statusbar
structure, and preserved Web/Desktop capability messaging.

**Acceptance Scenarios**:

1. **Given** dark appearance is selected through runtime, mockup, or test
   presentation state, **When** the workspace renders,
   **Then** the actual application topbar, rail, pane, statusbar, popovers, and
   log severity surfaces use the dark design tokens.
2. **Given** light appearance is selected through runtime, mockup, or test
   presentation state, **When** the workspace renders, **Then** the application
   uses the light design tokens and preserves readable contrast.
3. **Given** the app is rendered for macOS, Windows, Linux, or Web, **When** the
   shell chrome is visible, **Then** platform-appropriate window controls appear
   while the Crosslog topbar, activity rail, pane workspace, and statusbar
   remain structurally consistent.
4. **Given** the runtime, mockup, or test presentation state changes
   appearance, **When** the shell rerenders, **Then** the appearance changes
   actual UI surfaces without exposing a new product-visible theme selector or
   adding persisted preference storage in this alignment scope.

---

### User Story 5 - Preserve Existing MVP Behavior and Test Value (Priority: P1)

A user continues to rely on existing Crosslog MVP workflows after the design
alignment: opening sources, live updates, directory navigation, timestamp
synchronization, per-pane search, time offsets, encoding handling, safe log
rendering, and session restore all behave as before.

**Why this priority**: This specification is a design-alignment pass, not a new
feature. Regressing existing behavior would reduce product value and invalidate
the prior MVP and Activity Rail specifications.

**Independent Test**: Run the existing MVP behavioral coverage and update only
UI selectors or visual assertions that changed because of the aligned design.
The functional outcomes from prior specs must remain the same.

**Required UI Test**: Existing Web, Desktop, and native accessibility UI tests
are updated for new roles, accessible names, shell regions, and visual
contracts; new tests are added only for uncovered alignment deltas.

**Acceptance Scenarios**:

1. **Given** existing MVP analysis workflows are available, **When** design
   alignment is complete, **Then** source opening, directory navigation,
   synchronization, search, offset, live update, encoding, session restore, and
   safety outcomes still match the prior specifications.
2. **Given** existing automated and UI tests cover unchanged behavior, **When**
   tests are migrated, **Then** they are reused or updated instead of rewritten
   from scratch unless a real coverage gap is identified.
3. **Given** a future rail or left-panel surface is visible, **When** the user
   activates it before its feature exists, **Then** it does not create new MVP
   filtering, highlighting, bookmark, saved set, recursive search, SSH, or
   file-manager behavior.

### Edge Cases

- The workspace has no open panes.
- Only one pane is open and the user adds a pane.
- Panes fit within the visible workspace and would otherwise leave blank space
  to the right.
- Panes exceed the visible workspace width.
- A pane title, directory name, current file name, offset tag, or status label
  is longer than the available header space.
- A file pane and a directory pane both have live indicators.
- The user opens pane search or time offset from each pane in a three-pane
  workspace.
- Theme variant changes in a mockup or test environment while a popover is
  open.
- The user switches platform variant in a mockup or test environment.
- A future activity rail control is visible before its feature exists.
- The Directory Search left panel is shown while directory-wide search remains
  future-scoped.
- Search input is an invalid regular expression.
- Time offset input is invalid, incomplete, or out of range.
- A selected file is deleted or replaced while the aligned pane header is
  visible.
- Browser environment lacks local file monitoring or automatic local new-file
  discovery.
- Logs contain text that resembles commands, links, terminal escapes, or
  executable instructions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The aligned UI MUST reuse `specs/001-multi-log-analysis` as the
  functional baseline and MUST NOT alter MVP behavior except where the updated
  design changes presentation.
- **FR-002**: The aligned UI MUST reuse `specs/002-redesign-activity-rail` as
  the redesign baseline and MUST add only the deltas required by the updated UI
  design document and HTML mockups.
- **FR-003**: The aligned UI MUST NOT introduce remote source access, filtering,
  configurable highlighting, bookmarks, saved filter sets, recursive directory
  search, file-manager behavior, a new parser model, a new source capability,
  or a new product architecture.
- **FR-004**: The topbar MUST contain a compact command field, synchronization
  icon control, and add-pane icon control, with the synchronization and add-pane
  controls positioned immediately to the right of the command field.
- **FR-005**: The topbar MUST NOT show a Split button, Synchronize by time
  checkbox text, or Sync on text label.
- **FR-006**: The activity rail MUST follow the target button order and sizing:
  search, filter, palette, files, bookmark, and settings.
- **FR-007**: Future activity rail controls for filter, palette, and bookmark
  behavior MUST be hidden, disabled, or clearly unavailable until their feature
  specifications are implemented.
- **FR-008**: The Files activity rail control MUST remain limited to available
  MVP source-opening behavior unless a later specification adds a full source
  browser.
- **FR-009**: The empty workspace MUST show the aligned topbar height, activity
  rail, centered drop zone, Open Source action, and drag-and-drop entry point.
- **FR-010**: The empty workspace MUST hide secondary panels and pane-specific
  controls while no panes exist.
- **FR-011**: The product UI MUST NOT show the permanent pane Copy toolbar,
  Discover newer directory file, Append live line, Delete active file, Replace
  active file, plus/minus pane resize controls, per-pane ready footer, or
  persistent workspace action toolbar.
- **FR-012**: Users MUST resize panes by dragging the boundary between panes.
- **FR-013**: User-resized pane widths MUST continue to persist according to the
  existing session and pane layout behavior.
- **FR-014**: When the total pane width is less than the workspace width, the
  layout MUST avoid unused blank space to the right of the rightmost pane.
- **FR-015**: When panes exceed available workspace width, horizontal workspace
  scrolling MUST be available.
- **FR-016**: Each Log Pane MUST keep independent horizontal scrolling for long
  log lines.
- **FR-017**: File pane headers MUST show file identity, live indicator when
  applicable, offset tag, pane find icon, close action, and active status
  without directory previous/next controls.
- **FR-018**: Directory pane headers MUST show directory identity, current file
  identity, previous/next file controls, live indicator when applicable, offset
  tag, pane find icon, close action, and active status.
- **FR-019**: Pane header text MUST truncate or otherwise adapt so that long
  names do not overlap close, search, offset, live, or directory navigation
  controls.
- **FR-020**: The pane search popover MUST use the compact target layout and
  MUST appear in the pane whose find icon invoked it.
- **FR-021**: The time offset popover MUST use the compact target layout and
  MUST appear in the pane whose offset tag invoked it.
- **FR-022**: Opening a pane search or time offset popover from a different pane
  MUST move the corresponding popover to that pane and preserve pane-local
  state boundaries.
- **FR-023**: Light and dark appearances MUST apply to the actual application
  surfaces, including topbar, activity rail, panes, popovers, statusbar, log
  rows, and state indicators; this alignment pass MUST NOT add a
  product-visible theme selector or new persisted theme preference storage
  unless a later specification defines it.
- **FR-024**: macOS, Windows, Linux, and Web variants MUST render
  platform-appropriate shell chrome while preserving the same Crosslog product
  layout and behavior; OS-specific validation MUST verify the default runtime
  shell chrome on the corresponding OS in addition to mockup/test overrides.
- **FR-025**: The Directory Search left panel MUST remain feature-gated unless
  directory-wide search requirements are implemented; it MUST NOT introduce new
  MVP behavior by accident.
- **FR-026**: Existing read-only log rendering, inert content treatment, file
  watching, directory navigation, timestamp synchronization, per-pane search,
  time offset, session restore, encoding, performance, and platform capability
  behavior MUST remain unchanged.
- **FR-027**: Existing tests for unchanged behavior MUST be reused or updated
  for selectors and visual contracts instead of rewritten from scratch.
- **FR-028**: New tests MUST be added only for alignment deltas not already
  covered: empty workspace, theme variants, platform variants, right-edge pane
  alignment, drag resize, compact popover positioning, header no-overlap,
  obsolete-control removal, Files/Directory Search guardrails, default platform
  chrome evidence, and timed empty-state review.

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

- **Design Alignment Baseline**: The set of prior specifications and updated
  design documents that define what must be preserved and what must change.
- **Application Shell**: The visible product frame containing topbar, activity
  rail, pane workspace, optional left panel, and statusbar.
- **Topbar**: The global control area containing command entry, synchronization
  control, and add-pane control.
- **Activity Rail**: The vertical rail containing available MVP entry points and
  guarded future controls.
- **Empty Workspace**: The no-pane state containing the central source-opening
  drop zone and primary open action.
- **Pane Workspace**: The area that lays out Log Panes, pane boundaries, and
  workspace-level horizontal overflow.
- **Log Pane Header**: The pane-local source identity and action area for file
  and directory sources.
- **Pane Search Popover**: The compact pane-local search surface anchored to the
  pane that invoked it.
- **Time Offset Popover**: The compact pane-local offset editor anchored to the
  pane that invoked it.
- **Theme Variant**: The runtime, mockup, or test presentation appearance whose
  tokens apply to all application surfaces; it is not a product-visible
  selector in this alignment pass.
- **Platform Variant**: The shell chrome variant for macOS, Windows, Linux, or
  Web.
- **Test Coverage Map**: The trace from existing and newly added tests to the
  alignment requirements and preserved MVP behavior.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In all covered empty and populated workspace states, 100% of the
  explicitly removed legacy controls are absent from the user-facing product UI.
- **SC-002**: In covered workspace states where panes do not overflow, the
  rightmost pane reaches the workspace right edge in 100% of layout checks.
- **SC-003**: In covered workspace states where panes overflow, horizontal
  workspace scrolling remains available and every pane remains reachable in
  100% of layout checks.
- **SC-004**: In covered pane header states with long file or directory names,
  primary pane controls remain visible and non-overlapping in 100% of layout
  checks.
- **SC-005**: Pane search and time offset popovers appear in the pane that
  invoked them in 100% of left, middle, and right pane invocation checks.
- **SC-006**: Light and dark appearances apply to all primary application
  surfaces in 100% of theme coverage checks.
- **SC-007**: macOS, Windows, Linux, and Web platform variants show distinct
  shell chrome while preserving the same product regions in 100% of platform
  coverage checks, including default Windows and Linux chrome evidence from the
  corresponding OS UI gates.
- **SC-008**: Existing MVP workflow outcomes from the prior multi-log analysis
  and Activity Rail redesign specifications continue to pass in 100% of reused
  regression checks.
- **SC-009**: New tests are limited to documented alignment gaps, and every new
  alignment requirement has at least one associated validation check before
  planning is considered complete.
- **SC-010**: Users can start from an empty workspace and identify how to open a
  source in no more than 5 seconds during review of the aligned empty state.
  Evidence MUST record one reviewer starting from the empty workspace with no
  instruction beyond the app title and review protocol, whether the
  source-opening path was identifiable within 5 seconds, and the pass/fail
  result in `validation-log.md`.

## Assumptions

- The updated UI design document and HTML mockups are authoritative for visual
  alignment, while `specs/001-multi-log-analysis` remains authoritative for
  MVP product behavior.
- `specs/002-redesign-activity-rail` remains the implementation and test reuse
  baseline; this specification describes only the remaining or newly clarified
  design-alignment deltas.
- The Directory Search left panel is treated as a guarded future/search-scope
  surface unless a separate implemented requirement enables directory-wide
  search.
- Future activity rail controls may remain visible only if their unavailable
  state is explicit and testable.
- Existing performance thresholds and read-only safety requirements remain in
  force.
- Scroll positions remain intentionally excluded from session restore, as
  specified by the MVP baseline.
