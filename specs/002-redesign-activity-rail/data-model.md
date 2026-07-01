# Data Model: Crosslog Activity Rail Redesign

## Entity: ApplicationShell

Fields:

- `topbar`: global command and action region.
- `activityRail`: vertical rail of primary and future actions.
- `paneWorkspace`: horizontally scrollable log pane region.
- `statusBar`: current workspace summary.
- `platformKind`: web or desktop.

Relationships:

- Owns `Topbar`, `ActivityRail`, `PaneWorkspace`, and `StatusBar`.
- Reads capability limitations from the platform layer.

Validation rules:

- Shell regions must remain visible and non-overlapping across supported viewport sizes.
- Platform-specific window controls may vary, but shell structure must remain consistent.

## Entity: Topbar

Fields:

- `commandField`: command entry point state.
- `syncEnabled`: global synchronization state.
- `addPaneAvailable`: whether a pane can be added.

Relationships:

- Controls global synchronization state from the existing synchronization store.
- Dispatches pane add/split actions to the existing pane reducer.

Validation rules:

- The sync control must be keyboard-accessible and report current state.
- The add-pane control must split the rightmost pane when panes exist.
- The command field must not expose non-MVP commands.

## Entity: CommandField

Fields:

- `query`: current command/search input.
- `open`: whether command UI is active.
- `availableActions`: MVP actions available from the current context.

Relationships:

- Can focus pane search, open source actions, toggle sync, add panes, and open settings.
- Reads platform capability limitations before offering source actions.

Validation rules:

- Non-MVP actions must be absent or unavailable.
- User-entered text must be treated as inert text.

## Entity: ActivityRail

Fields:

- `items`: ordered `ActivityRailItem` records.
- `activeItemId`: selected rail item when applicable.
- `settingsAvailable`: whether settings can be opened.

Relationships:

- Can focus workspace search, source/file actions, and settings.
- Contains future extension points for filter, palette, and bookmark features.

Validation rules:

- Future non-MVP items must not perform filtering, highlighting, bookmark, saved-filter, or recursive-directory behavior.
- Icon-only controls must have accessible names.

## Entity: ActivityRailItem

Fields:

- `id`: stable item identifier.
- `label`: accessible label.
- `icon`: icon identifier.
- `capability`: MVP action, future action, or unavailable action.
- `state`: enabled, active, disabled, or hidden.

Validation rules:

- Disabled future items must not be focus traps.
- Hidden future items must not be reachable by keyboard or assistive technology.

## Entity: PaneWorkspace

Fields:

- `panes`: ordered Log Pane references.
- `horizontalScroll`: workspace-level horizontal scroll position.
- `resizeState`: active pane-boundary resize state.

Relationships:

- Owns the visual arrangement of existing `LogPane` entities.
- Uses pane layout reducers from the core package.

Validation rules:

- Pane order and sizes must remain consistent with session state.
- Workspace scrolling must not remove access to pane controls.
- Resize handles must have keyboard-accessible alternatives or testable accessible controls where supported.

## Entity: LogPane

Fields:

- `id`: stable pane identifier.
- `sourceRef`: file or directory source reference.
- `active`: whether this pane is the active pane.
- `width`: persisted pane width.
- `header`: `PaneHeader` state.
- `searchState`: per-pane search state.
- `timeOffset`: per-pane time offset.
- `status`: ready, loading, deleted, error, unsupported, empty, or memory-limited.

Relationships:

- Owns one `PaneHeader`.
- Owns one `PaneSearchPopover` when search is active.
- Owns one `TimeOffsetPopover` when offset editing is active.

Validation rules:

- Active pane must be visually and accessibly distinguishable.
- Pane status changes must not automatically close the pane.
- Long source names must not overlap header controls.

## Entity: PaneHeader

Fields:

- `sourceTitle`: file or directory title.
- `selectedFileTitle`: selected directory file title when applicable.
- `liveIndicator`: whether live updates are active.
- `deletedIndicator`: whether source was deleted.
- `offsetLabel`: formatted time offset.
- `directoryNavigation`: previous/next availability.
- `actions`: close, search, offset, previous, and next controls.

Validation rules:

- Required controls must remain accessible under long titles.
- Directory navigation controls must be disabled at boundaries.
- Live/deleted indicators must reflect source lifecycle state without modifying log content.

## Entity: PaneSearchPopover

Fields:

- `paneId`: owner pane.
- `query`: current query.
- `mode`: text or regex.
- `caseSensitive`: boolean.
- `currentMatchIndex`: selected match.
- `totalMatches`: total match count.
- `error`: invalid regex or null.

Relationships:

- Uses existing `SearchState`.
- Sends previous/next actions to the search store.

Validation rules:

- Search state is per-pane.
- Invalid regex must not replace the last valid results.
- Match count must reflect current full-content search results.

## Entity: TimeOffsetPopover

Fields:

- `paneId`: owner pane.
- `days`: numeric day offset.
- `hours`: numeric hour offset.
- `minutes`: numeric minute offset.
- `seconds`: numeric second offset.
- `milliseconds`: numeric millisecond offset.
- `draftValid`: whether current draft values can be applied.

Relationships:

- Uses existing `TimeOffset` normalization.
- Applies changes to only the owner pane.

Validation rules:

- Invalid draft values must not replace the previous valid offset.
- Applied values must be normalized before synchronization.

## Entity: StatusBar

Fields:

- `paneCount`: number of open panes.
- `syncState`: on or off.
- `activeSourceLabel`: current active file or directory file label.
- `message`: optional status message.

Validation rules:

- Summary must update after pane add, pane close, active-pane change, and sync toggle.
- Long labels must be truncated without hiding pane count or sync state.

## Entity: TestAutomationMatrix

Fields:

- `localOs`: current development OS.
- `automatedScripts`: OS-specific non-UI scripts.
- `uiScripts`: OS-specific UI/E2E scripts.
- `ciJobs`: GitHub Actions jobs required for non-local OS validation.

Validation rules:

- Current OS scripts must pass locally before phase completion.
- Windows, macOS, and Linux UI/E2E jobs must run on corresponding GitHub runners before release readiness.
- Presence-only UI harness validation is not sufficient as a release gate.
