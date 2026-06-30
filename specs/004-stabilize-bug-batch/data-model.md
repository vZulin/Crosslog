# Data Model: Crosslog Bug Batch Stabilization

This data model describes only the state needed to stabilize the bug batch. It
does not add new source types, remote access, recursive directory search,
filtering, bookmarks, saved sets, file-manager behavior, parser models, backend
services, or UI framework concepts.

## Entity: BugBatch

Fields:

- `sourceDocument`: `/Users/Vladimir.Zulin/projects/idea/Crosslog/docs/Bugs_1.txt`.
- `items`: numbered bugs 1 through 22.
- `expectedResults`: authoritative expected behavior for each item.

Validation rules:

- Every bug item must map to requirements, planned work, and at least one test.
- Existing behavior outside this batch and prior specs must remain unchanged.

## Entity: SourceOpeningRequest

Fields:

- `entryPoint`: empty workspace open action, topbar add-pane action, drag/drop,
  or test helper setup.
- `selectionState`: `notStarted`, `selecting`, `selected`, `cancelled`, or
  `unsupported`.
- `selectedSources`: zero or more user-selected file or directory references.

Relationships:

- Uses platform source picker, file access, directory access, and drag/drop
  ports.
- Creates `LogPane` instances only when a user-selected or dropped supported
  source exists.

Validation rules:

- Product UI entry points must not create demo/sample panes.
- Cancellation leaves the workspace unchanged.
- Automated fixtures are allowed only through existing test helpers.

## Entity: LogPaneLayout

Fields:

- `paneOrder`: ordered pane ids.
- `desiredWidths`: persisted pane widths.
- `renderedWidths`: view-computed widths.
- `longestLineWidth`: reachable horizontal content width for each pane.
- `verticalScrollPosition`: current vertical viewport position.
- `selectedLineNumber`: current keyboard/cursor line when applicable.
- `horizontalScrollPosition`: current horizontal viewport position.

Relationships:

- Owns `LogViewport`.
- Participates in synchronization through active pane anchor changes.

Validation rules:

- A single narrow pane fills the workspace.
- Multiple panes use available width efficiently without excessive blank
  horizontal scroll space.
- Pane order changes only through explicit reorder interaction or session
  restore.
- Desired widths are not overwritten by rendered fill widths.

## Entity: PaneReorderDrag

Fields:

- `draggedPaneId`: pane whose header is dragged.
- `startIndex`: pane index at drag start.
- `currentPointerX`: current pointer location.
- `targetIndex`: index after crossing another pane midpoint.

Relationships:

- Updates `LogPaneLayout.paneOrder`.

Validation rules:

- Reorder happens after crossing another pane midpoint.
- Intervening panes preserve relative order.
- Dropping outside the workspace must not corrupt pane order.

## Entity: LogViewport

Fields:

- `lines`: loaded inert log lines.
- `lineCount`: total loaded line count.
- `lineNumberDigitCount`: digit count used for gutter width.
- `visibleWindow`: currently rendered line range.
- `selectedLineNumber`: current selected or cursor line.
- `searchHighlightsVisible`: whether search result spans are visible.

Relationships:

- Renders `SearchMatch` ranges.
- Emits time anchor changes for synchronization when navigation selects a
  timestamped line.

Validation rules:

- Vertical scrolling reaches all loaded lines.
- Arrow up/down moves selected line.
- Arrow left/right moves horizontal caret or viewport position.
- Gutter width follows line count digit boundaries.

## Entity: SearchPresentationState

Fields:

- `paneId`: owner pane id.
- `query`: current pane-local search query.
- `mode`: text or regex.
- `caseSensitive`: active case mode.
- `matches`: ranges returned by the shared search engine.
- `currentMatch`: current match index and line number.
- `highlightsVisible`: visible highlight state.

Relationships:

- Uses existing pane-local search store and core search ranges.
- Drives `LogViewport` inline highlights.

Validation rules:

- Highlight only matching text spans.
- Respect case-sensitive and regex rules.
- Closing the popover hides highlights while keeping the last navigated line.

## Entity: CopySelectionAction

Fields:

- `selectedText`: current selected log text.
- `pointerPosition`: viewport coordinates from the context-menu event.
- `visiblePosition`: adjusted action position inside the viewport.
- `visibility`: visible or hidden.

Relationships:

- Uses clipboard writer where available.
- Lives outside permanent pane toolbars.

Validation rules:

- Appears beside the pointer, not pane top-left.
- Dismisses on outside left click.
- Relocates on valid right click.
- Copy completion does not show product-visible `Copied` feedback.

## Entity: TimeOffsetDraft

Fields:

- `days`: string draft.
- `hours`: string draft.
- `minutes`: string draft.
- `seconds`: string draft.
- `milliseconds`: string draft.
- `validationErrors`: field-level validation results.

Relationships:

- Applies to one pane's time offset only after valid Apply.
- Affects synchronization through existing offset logic.

Validation rules:

- Blank field applies as zero.
- Days accept any whole number.
- Hours accept 0-23.
- Minutes and seconds accept 0-59.
- Milliseconds accept 0-999.
- Invalid drafts do not replace previous valid offsets.

## Entity: SynchronizationControlState

Fields:

- `enabled`: global synchronization state.
- `visualState`: inactive, active, hover, focus, or disabled.
- `pressedState`: accessible pressed/unpressed state.

Validation rules:

- Active, inactive, and hover visuals are distinct.
- Accessible state remains synchronized with actual behavior.

## Entity: SettingsSurface

Fields:

- `open`: whether settings is visible.
- `themePreference`: `system`, `light`, or `dark`.
- `resolvedTheme`: actual visual theme after applying system preference.

Relationships:

- Opens from the activity rail settings entry.
- Applies to the application shell and visible surfaces.

Validation rules:

- Fresh state defaults to `system`.
- Settings contains at least theme selection.
- Theme changes do not close panes or reset source, search, or sync state.

## Entity: TestCoverageMap

Fields:

- `bugId`: bug number from 1 to 22.
- `requirements`: linked FR ids.
- `existingTestsUnchanged`: tests retained as-is.
- `testsToUpdate`: tests whose expectations encoded the defect.
- `newTests`: missing coverage to add.
- `validationGate`: targeted, local OS, or CI/CD gate.

Validation rules:

- Every bug must have mapped coverage.
- Valid tests remain unchanged.
- Incorrect expectations are updated to the authoritative expected result.
