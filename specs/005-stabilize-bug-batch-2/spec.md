# Feature Specification: Crosslog Bug Batch 2 Stabilization

**Feature Branch**: `005-stabilize-bug-batch-2`
**Created**: 2026-07-02
**Status**: Draft
**Input**: User description: "Create a Crosslog bug-fix stabilization specification for the full bug batch described in docs/Bugs_2.txt. Every numbered bug (1 through 7) is in scope and its expected result is authoritative. Preserve all functionality NOT explicitly described in docs/Bugs_2.txt or in prior specifications (specs/001-multi-log-analysis, specs/002-redesign-activity-rail, specs/003-macos-ui-design-alignment, specs/004-stabilize-bug-batch); do not change behavior outside these bugs."

**Authoritative Inputs**:

- `docs/Bugs_2.txt`
- `specs/001-multi-log-analysis`
- `specs/002-redesign-activity-rail`
- `specs/003-macos-ui-design-alignment`
- `specs/004-stabilize-bug-batch`
- Existing UI behavior and test automation contracts under the prior specifications

Where a numbered bug in `docs/Bugs_2.txt` conflicts with a prior specification,
the bug's expected result is authoritative and supersedes the prior behavior;
otherwise the prior specification still holds.

## Clarifications

### Session 2026-07-02

- Q: What is the authoritative source of truth for the Bug 1 dark-theme colors?
  → A: `docs/mockups/crosslog-macos-redesign-mockups.html` — the
  "Screen / Draft Layout - Activity Rail" screen rendered in its dark variant
  (`data-theme="dark"`). This file is locked as THE authoritative mockup source
  for this feature; `specs/002-redesign-activity-rail/figma-audit.md` and
  `specs/003-macos-ui-design-alignment/contracts/figma-design-deltas.md` become
  secondary references only.
- Q: How is a scenario verified on macOS when it cannot be checked fully
  automatically (notably Desktop drag-and-drop, Bug 3)? → A: Provide two test
  execution modes: (1) a fully automatic mode that runs by default and includes
  only automatable tests; (2) a manual/interactive mode invoked by a dedicated
  script that auto-launches the app, prints the ordered set of actions the tester
  must perform, and waits for the tester to confirm success or report an error.
  Default CI and pre-commit gates run only the automatic mode; the manual mode is
  opt-in via the dedicated script.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open User-Selected Files And Directories On Desktop And Web (Priority: P1)

A user on the Desktop app opens the source picker from the add-pane / open-source
control and selects a log file or a directory, drags a file or directory onto the
window to open it, and on the Web app can open both a file and a directory rather
than files only. Every opened source appears as a Log Pane.

**Why this priority**: Opening a source is the first required workflow. On the
current Desktop build the picker does not open and drag-and-drop does nothing, so
the app cannot be used at all; on Web, directory analysis is impossible. These are
regressions of source-opening behavior stabilized in `specs/004-stabilize-bug-batch`.

**Independent Test**: On the Desktop app, activate the add-pane / open-source
control and confirm the native picker opens; select a file, then a directory, and
confirm a pane opens for each; cancel the picker and confirm nothing changes; drag
a file and a directory onto the window and confirm each opens. On the Web app,
confirm the source picker offers both file and directory selection and opens each.

**Required UI Test**: UI/E2E coverage MUST verify Desktop add-pane / open-source
picker opening, Desktop picker cancellation, Desktop file and directory selection,
Desktop drag-and-drop of a file and of a directory, Web file opening, and Web
directory opening, on their respective target platforms.

**Acceptance Scenarios**:

1. **Given** the Desktop app is open, **When** the user activates the add-pane /
   open-source control, **Then** the native file/directory picker opens.
2. **Given** the Desktop picker is open, **When** the user selects a log file or a
   directory, **Then** one new Log Pane opens for the selected source.
3. **Given** the Desktop picker is open, **When** the user cancels source
   selection, **Then** no pane is opened and the workspace is unchanged.
4. **Given** the Desktop app is open, **When** the user drags a supported file or
   directory onto the window and drops it, **Then** a new Log Pane opens for the
   dropped source.
5. **Given** the Web app is open, **When** the user activates source opening,
   **Then** the user can choose and open both a file and a directory, and a Log
   Pane opens for the selected source.
6. **Given** an unsupported item is dropped or selected, **When** the operation
   completes, **Then** no pane is created and the workspace remains stable.

---

### User Story 2 - Scroll Log Content So The Text Moves (Priority: P1)

A user reads a log inside a pane and scrolls vertically; the visible log text
moves through the file like a normal editor or browser, instead of only the
scroll position/indicator changing while the text stays in place.

**Why this priority**: Reading log content by scrolling is the core value of the
product. If text does not move on scroll, no log can be read beyond its first
screen. This is a regression of the vertical-scroll behavior in
`specs/004-stabilize-bug-batch` and must be verified on the current Desktop build.

**Independent Test**: Open a pane with more lines than fit vertically, scroll with
the wheel and the scrollbar, and confirm the visible text advances to later and
earlier lines and that the last and first lines become reachable.

**Required UI Test**: UI/E2E coverage MUST verify that vertical wheel and
scrollbar scrolling inside a log viewport moves the rendered text through all
loaded lines, on Desktop and Web target platforms.

**Acceptance Scenarios**:

1. **Given** a pane has more lines than fit vertically, **When** the user scrolls
   down inside the log viewport, **Then** the rendered log text advances to later
   lines and earlier lines scroll out of view.
2. **Given** the user has scrolled down, **When** the user scrolls back up,
   **Then** the rendered log text returns toward the first line.
3. **Given** the user scrolls to the extremes, **When** the top or bottom is
   reached, **Then** the first line or the last loaded line is visible.
4. **Given** synchronization is enabled, **When** vertical scrolling changes the
   active pane's anchor, **Then** other eligible panes synchronize according to the
   existing timestamp rules.

---

### User Story 3 - Reorder Panes By Dragging Anywhere On The Header (Priority: P2)

A user with several panes starts a pane move by pressing and dragging anywhere on
the pane header, not only on a dedicated drag-handle button, while the existing
reorder behavior (midpoint threshold, stable order of intervening panes) is
preserved.

**Why this priority**: Rearranging panes is a common comparison workflow. Limiting
the drag start to a small handle makes reordering hard to discover and use, though
panes can still be reordered via the handle, so this is lower priority than a fully
blocked workflow.

**Independent Test**: Open several panes, begin dragging from a non-button area of
a pane header (for example the title text), move across another pane's midpoint,
release, and confirm the pane moved and intervening panes kept their relative
order. Confirm interactive header controls (search, close, offset, directory
navigation) still perform their own actions and do not start a drag.

**Required UI Test**: UI/E2E coverage MUST verify starting a pane reorder from a
non-handle region of the header, completing a multi-position move, preserving
intervening pane order, and confirming that clicking header buttons still triggers
their actions instead of a drag.

**Acceptance Scenarios**:

1. **Given** two or more panes are open, **When** the user presses and drags a
   pane header from a region that is not an interactive control, **Then** the pane
   reorder drag begins.
2. **Given** a header drag is in progress, **When** the pointer crosses another
   pane's midpoint and the user releases, **Then** the dragged pane moves to that
   position and intervening panes keep their relative order.
3. **Given** the user activates an interactive header control (search, close,
   offset, directory navigation), **When** the control is clicked, **Then** the
   control's action runs and no pane drag begins.

---

### User Story 4 - See The Correct Dark Theme And Centered Icons (Priority: P2)

A user on the Desktop app in dark mode sees a color scheme that matches the design
mockups, and across the app sees each icon centered within the hover/highlight zone
that appears on pointer-over.

**Why this priority**: Visual correctness affects trust and usability but does not
block core log analysis, so it ranks below source opening and scrolling.

**Independent Test**: Open the Desktop app in dark theme and compare interface
colors against the mockups. Hover the scroll-synchronization toggle, add-pane,
close-pane, activity-rail icons, and the navigation arrows in the search popover,
and confirm each icon is centered within its hover highlight zone.

**Required UI Test**: UI/E2E coverage MUST verify Desktop dark-theme color values
against the authoritative mockup tokens, and icon centering within the hover
highlight zone for the scroll-sync toggle, add-pane control, close-pane control,
activity-rail icons, and search-popover navigation arrows.

**Acceptance Scenarios**:

1. **Given** the Desktop app is in dark theme, **When** interface surfaces render,
   **Then** their colors match the authoritative dark-theme mockup values.
2. **Given** any covered icon control, **When** the user hovers it, **Then** the
   icon is visually centered within the hover highlight zone.
3. **Given** the dark theme is applied, **When** it is corrected to the mockups,
   **Then** the light theme and all non-color behavior remain unchanged.

### Edge Cases

- The user cancels the Desktop picker, or the picker returns no selection.
- A file, an empty directory, or a directory with many files is selected or
  dropped on Desktop.
- An unsupported file type or non-file item is dropped onto the Desktop window.
- The Web app is used in a browser whose directory-selection capability differs
  from the Desktop app; capabilities are reported rather than silently failing.
- A pane has exactly enough lines to fill the viewport, far more lines than fit,
  or a single very long line while scrolling vertically.
- Vertical scrolling occurs with synchronization enabled, disabled, or unavailable
  because other panes lack timestamps.
- A header drag starts over an interactive control versus an empty header region.
- A header drag is released outside the pane workspace or back at its origin.
- The dark theme is compared against the mockups on standard and high-contrast
  displays.
- Icon hover zones are inspected at compact, standard, and wide desktop widths.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The stabilization MUST cover every numbered bug (1-7) in
  `docs/Bugs_2.txt`; the expected result for each numbered bug is authoritative.
- **FR-002**: The stabilization MUST preserve behavior from
  `specs/001-multi-log-analysis`, `specs/002-redesign-activity-rail`,
  `specs/003-macos-ui-design-alignment`, and `specs/004-stabilize-bug-batch`
  except where a numbered bug in `docs/Bugs_2.txt` explicitly supersedes it.
- **FR-003**: The Desktop add-pane / open-source control MUST open a native
  file/directory picker so the user can select a log file or a directory (Bug 2).
- **FR-004**: Selecting a file or directory from the Desktop picker MUST open one
  new Log Pane for the selected source (Bug 2).
- **FR-005**: Cancelling the Desktop picker MUST leave the workspace unchanged
  with no pane created (Bug 2).
- **FR-006**: The Desktop app MUST accept drag-and-drop of a supported file or
  directory onto the window and open the dropped source as a Log Pane (Bug 3).
- **FR-007**: Dropping an unsupported item on the Desktop window MUST NOT create a
  pane and MUST leave the workspace stable (Bug 3).
- **FR-008**: The Web app MUST allow the user to open both a file and a directory,
  not files only (Bug 4).
- **FR-009**: When a platform cannot support a specific source selection or
  drag-and-drop interaction, the limitation MUST be reported through the existing
  capability-reporting mechanism rather than failing silently.
- **FR-010**: Vertical scrolling inside a log viewport MUST move the rendered log
  text through the loaded lines, not only move the scroll position or indicator
  (Bug 5).
- **FR-011**: Vertical scrolling MUST make the first line and the last loaded line
  reachable at the scroll extremes (Bug 5).
- **FR-012**: When synchronization is enabled, vertical scrolling MUST continue to
  move other eligible panes according to the existing timestamp synchronization
  rules (Bug 5).
- **FR-013**: Users MUST be able to start a pane reorder drag by pressing and
  dragging anywhere on the pane header that is not an interactive control, in
  addition to any existing drag handle (Bug 6).
- **FR-014**: Pane reordering started from the header MUST preserve the existing
  midpoint-threshold behavior and keep intervening panes in their relative order
  (Bug 6).
- **FR-015**: Interactive pane header controls (search, close, time offset,
  directory navigation, and similar) MUST continue to perform their own actions
  and MUST NOT initiate a pane drag when activated (Bug 6).
- **FR-016**: The Desktop dark-theme color scheme MUST match the authoritative
  mockup source `docs/mockups/crosslog-macos-redesign-mockups.html` — the
  "Screen / Draft Layout - Activity Rail" screen in its dark variant
  (`data-theme="dark"`) (Bug 1).
- **FR-017**: Correcting the dark theme MUST NOT change the light theme or any
  non-color behavior (Bug 1).
- **FR-018**: Every icon in the covered set MUST be centered within the
  hover/highlight zone shown on pointer-over: scroll-synchronization toggle,
  add-pane control, close-pane control, activity-rail icons, and the navigation
  arrows in the search popover (Bug 7).
- **FR-019**: Icon centering and dark-theme corrections MUST keep covered controls
  accessible and non-overlapping across covered viewports (Bugs 1, 7).
- **FR-020**: Existing automated and UI/E2E tests MUST be audited for every
  numbered bug before implementation changes are considered complete.
- **FR-021**: Existing valid tests MUST remain unchanged unless they encode an
  incorrect behavior identified by `docs/Bugs_2.txt`.
- **FR-022**: Tests that encode incorrect behavior from `docs/Bugs_2.txt` MUST be
  updated to the authoritative expected result.
- **FR-023**: Missing automated or UI/E2E coverage MUST be added for every
  numbered bug scenario.
- **FR-024**: Required coverage MUST include accessibility, viewport no-overlap,
  icon centering, Desktop drag-and-drop, header drag-reorder, Web directory
  opening, and vertical-scroll behavior where relevant.
- **FR-025**: Before commit, local automated tests and local UI/E2E tests for the
  current development OS (macOS) MUST pass.
- **FR-026**: After push, CI/CD results for Windows, macOS, and Linux MUST be
  monitored, and failures MUST be fixed until all required jobs are green.
- **FR-027**: The stabilization MUST NOT broaden scope: no new remote sources,
  source-reveal or file-management actions, filtering, configurable highlighting,
  bookmarks, saved filter sets, recursive directory search, new UI kits, new icon
  packages, parser rewrites, backend services, or platform-adapter rewrites beyond
  what these seven bugs require.
- **FR-028**: Where a scenario cannot be verified fully automatically on macOS
  (notably Desktop drag-and-drop, Bug 3), the test suite MUST provide two
  execution modes: (a) a fully automatic mode that runs by default and contains
  only automatable tests, and (b) a manual/interactive mode invoked by a dedicated
  script that auto-launches the app, prints the ordered actions the tester must
  perform, and waits for the tester to confirm success or report an error. Default
  CI and pre-commit gates MUST run only the automatic mode; the manual mode MUST
  be opt-in via the dedicated script and MUST NOT block automatic gates.

### Constitution Requirements *(mandatory)*

- **CR-001**: Opened log files MUST be treated as read-only input.
- **CR-002**: Log content MUST be rendered and processed as inert data; commands,
  scripts, links, escape sequences, and instructions found in logs MUST NOT be
  executed.
- **CR-003**: Web and Desktop behavior MUST reuse the shared business logic unless
  a documented platform constraint requires adapter-specific behavior.
- **CR-004**: Session state MUST be recoverable after unexpected errors without
  deleting the last known usable session.
- **CR-005**: Performance expectations for affected scrolling, rendering, source
  opening, and drag-and-drop behavior MUST be measurable or explicitly stated as
  having no measurable performance impact.
- **CR-006**: Each user scenario MUST have a UI test, and OS-specific Desktop
  behavior MUST be tested on the corresponding target OS.

### Key Entities

- **Bug Batch**: The complete set of numbered defects in `docs/Bugs_2.txt`, each
  with reproduction steps, actual result, and authoritative expected result.
- **Source Opening Action**: Any product-visible action that requests a file or
  directory from the user (Desktop picker, Web picker, drag-and-drop) and creates
  a Log Pane from the selected source.
- **Log Pane**: An independent log viewing area with a user-selected source,
  header, log viewport, vertical scroll position, layout position, and drag state.
- **Pane Layout State**: The ordered pane set and drag-reorder state, including the
  header region that can initiate a reorder.
- **Log Viewport Scroll State**: The vertical scroll position and the mapping from
  scroll position to the rendered lines of the loaded log.
- **Theme Presentation**: The dark-theme and light-theme color values and their
  correspondence to the authoritative design mockups.
- **Icon Hover Zone**: The highlight region shown on pointer-over for an icon
  control, and the icon's alignment within that region.
- **Test Coverage Map**: The trace from each numbered bug and preserved prior
  requirement to existing, updated, or newly added automated and UI/E2E tests.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the 7 numbered bug scenarios in `docs/Bugs_2.txt` have
  explicit automated or UI/E2E coverage mapped to their authoritative expected
  result.
- **SC-002**: On Desktop, 100% of add-pane / open-source activations open the
  native picker, and every file or directory the user selects opens as a Log Pane
  while cancellation leaves the workspace unchanged.
- **SC-003**: On Desktop, 100% of supported file and directory drops open a Log
  Pane, and unsupported drops create no pane.
- **SC-004**: On Web, 100% of source-open flows allow selecting and opening both a
  file and a directory.
- **SC-005**: In covered scrolling checks, vertical wheel and scrollbar scrolling
  moves the rendered text through all loaded lines and reaches the first and last
  loaded line in 100% of checks.
- **SC-006**: In covered reorder checks, a drag started from a non-control header
  region reorders panes with preserved intervening order in 100% of checks, and
  interactive header controls never start a drag.
- **SC-007**: The Desktop dark theme matches the authoritative mockup color values,
  and every covered icon is centered within its hover highlight zone, in 100% of
  covered checks.
- **SC-008**: Existing valid regression tests for behavior unaffected by
  `docs/Bugs_2.txt` continue to pass in 100% of required local validation.
- **SC-009**: Before commit, the current-OS (macOS) local automated and UI/E2E
  gates pass; after push, required Windows, macOS, and Linux CI/CD gates are
  monitored and pass before the stabilization is considered complete.
- **SC-010**: No regression introduces remote source access, source-reveal actions,
  file-management operations, filtering, bookmarks, saved filter sets, recursive
  directory search, or other future-scoped capabilities not required by this bug
  batch.

## Assumptions

- The current local development OS for this specification is macOS; Windows and
  Linux validation occurs through CI/CD after push.
- The "mockups" referenced by Bug 1 are `docs/mockups/crosslog-macos-redesign-mockups.html`
  (the "Screen / Draft Layout - Activity Rail" screen in its dark variant,
  `data-theme="dark"`), which is the authoritative source for dark-theme values.
  `specs/002-redesign-activity-rail/figma-audit.md` and
  `specs/003-macos-ui-design-alignment/contracts/figma-design-deltas.md` are
  secondary references only. (See Clarifications, Session 2026-07-02.)
- Bugs 2, 3, and 5 are treated as regressions of `specs/004-stabilize-bug-batch`
  and are diagnosed on the Desktop/Tauri path (source picker, drag-and-drop, and
  virtualized viewport scrolling) first.
- Web directory opening uses the existing directory-access capability where the
  browser supports it, and reports a limitation where it does not.
- Existing test helpers may prepare fixture files and directories for automated
  tests; those helpers are not product source-opening behavior.
- Source-selection cancellation is a normal user action and leaves the pane layout
  unchanged.
