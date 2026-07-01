# Data Model: Crosslog macOS UI Design Alignment

The existing entities from `specs/002-redesign-activity-rail/data-model.md`
remain valid. This alignment pass adds only minimal presentation state required
for updated themes, shell variants, pane layout rendering, popover anchoring,
and test coverage mapping. It does not add new source, parser, backend,
directory-search, filtering, highlighting, bookmark, SSH, or file-manager data.

## Entity: DesignAlignmentBaseline

Fields:

- `functionalBaseline`: `specs/001-multi-log-analysis`.
- `redesignBaseline`: `specs/002-redesign-activity-rail`.
- `designDocument`: `docs/crosslog-ui-design.md`.
- `htmlMockup`: `docs/mockups/crosslog-macos-redesign-mockups.html`.

Validation rules:

- Functional behavior follows the baseline unless the design document changes
  presentation only.
- Redesign work must be expressed as deltas over the 002 artifacts.

## Entity: ApplicationShell

Existing entity retained with amended fields:

- `themeVariant`: `ThemeVariant`.
- `platformShellVariant`: `PlatformShellVariant`.
- `topbar`: `Topbar`.
- `activityRail`: `ActivityRail`.
- `leftPanel`: guarded optional future/search-scope panel.
- `paneWorkspace`: `PaneWorkspace`.
- `statusBar`: `StatusBar`.

Validation rules:

- Shell regions stay visible and non-overlapping across supported viewport
  sizes.
- Platform chrome variants do not fork product behavior.
- Web shell does not render desktop radius or shadow.

## Entity: ThemeVariant

Fields:

- `mode`: `light` or `dark`.
- `tokens`: resolved CSS custom properties for screen, window, topbar, rail,
  pane, borders, scrollbars, accent, warning, error, text, muted text, line
  numbers, and tag backgrounds.

Relationships:

- Owned by `ApplicationShell`.
- Applied to all shared UI surfaces through the shell root.

Validation rules:

- Theme changes must affect actual application UI, not only mockup chrome.
- Theme state must not change source data, log content, parser output, or pane
  order.
- Theme state is shell presentation state for the current session, runtime
  default, mockup, or test override; this alignment pass does not add persisted
  UI preference storage.

## Entity: PlatformShellVariant

Fields:

- `kind`: `macos`, `windows`, `linux`, or `web`.
- `chrome`: traffic lights, Windows caption controls, Linux caption controls,
  or Web title/no desktop chrome.
- `windowTreatment`: radius, shadow, border, and title treatment.

Relationships:

- Owned by `ApplicationShell`.
- Derived from the runtime shell or an explicit test/storybook/mockup override.

Validation rules:

- Product behavior remains shared across variants.
- Web removes desktop radius and shadow.
- macOS, Windows, and Linux render distinct testable chrome.
- OS-specific UI gates validate the default runtime variant on the corresponding
  OS; presentation overrides are limited to mockup and cross-variant tests.

## Entity: Topbar

Existing entity retained with amended fields:

- `commandField`: compact global command/search entry.
- `syncControl`: icon-only global synchronization control.
- `addPaneControl`: icon-only add-pane control.

Validation rules:

- Sync and add-pane controls sit immediately to the right of the command field.
- The topbar must not expose visible `Split`, `Synchronize by time`, `Sync on`,
  or `Sync off` text.
- Add pane splits the rightmost pane when panes exist.

## Entity: EmptyWorkspace

Fields:

- `dropZone`: centered drop target.
- `openSourceAction`: primary `Open Source` action.
- `dragOver`: visual drag-over state.

Relationships:

- Uses existing platform source opening and drag/drop ports.
- Lives inside the same `ApplicationShell` topbar and activity rail structure.

Validation rules:

- Drag-over state must not shift layout.
- Empty workspace hides pane-specific controls and secondary panels.

## Entity: PaneWorkspace

Existing entity retained with amended fields:

- `panes`: ordered `LogPane` references.
- `desiredWidths`: persisted pane widths from existing pane state.
- `renderedWidths`: view-computed widths after fill or overflow calculation.
- `overflowing`: whether total rendered pane width exceeds workspace width.
- `resizeState`: active drag boundary state or null.

Relationships:

- Uses existing pane reducer/session desired widths.
- Owns draggable boundaries between adjacent panes.

Validation rules:

- Desired widths persist through existing session behavior.
- Computed fill widths must not overwrite desired widths in session state.
- If panes fit, the rightmost rendered pane reaches the workspace right edge.
- If panes overflow, workspace horizontal scrolling is available.

## Entity: PaneResizeBoundary

Fields:

- `leftPaneId`: pane to the left of the boundary.
- `rightPaneId`: pane to the right of the boundary.
- `dragStartX`: pointer start position when dragging.
- `initialLeftWidth`: desired left pane width at drag start.
- `initialRightWidth`: desired right pane width at drag start.

Relationships:

- Dispatches existing `resizePane` action with a delta.

Validation rules:

- Minimum pane width is preserved.
- Dragging a boundary updates adjacent desired widths only.
- Keyboard-accessible behavior remains testable where required.

## Entity: LogPaneHeader

Existing entity retained with amended fields:

- `sourceIdentity`: file or directory identity label.
- `currentFileIdentity`: selected directory file label when applicable.
- `liveDot`: compact live indicator when watching applies.
- `offsetTag`: compact pane-local offset control.
- `findControl`: compact pane-local search control.
- `closeControl`: pane close action.
- `directoryNavigation`: previous/next controls for directory panes.
- `activeIndicator`: active pane visual/accessibility state.

Validation rules:

- File panes do not render directory previous/next controls.
- Directory panes render current file and navigation controls.
- Long names truncate without overlapping offset, find, close, live, or
  navigation controls.

## Entity: PopoverAnchorState

Fields:

- `paneId`: owning pane id.
- `popoverKind`: `paneSearch` or `timeOffset`.
- `triggerControl`: pane find icon or offset tag.
- `focusReturnTarget`: triggering control for Escape/close focus return.

Relationships:

- Extends existing open search/time-offset pane id state.
- Owned by the invoking `LogPane`.

Validation rules:

- Opening a popover in another pane moves ownership to that pane.
- Draft state remains pane-local.
- Escape closes and returns focus to the trigger.

## Entity: PaneSearchPopover

Existing entity retained with amended fields:

- `compactLayout`: target compact width/height treatment.
- `anchorState`: `PopoverAnchorState`.

Validation rules:

- Search controls remain query, previous, next, case-sensitive, regex, and
  match count.
- Invalid regex stays pane-local and does not replace last valid results.

## Entity: TimeOffsetPopover

Existing entity retained with amended fields:

- `compactLayout`: target compact width/height treatment.
- `anchorState`: `PopoverAnchorState`.
- `fields`: days, hours, minutes, seconds, milliseconds.
- `applyAction`: only persistent action in the target popover.

Validation rules:

- No persistent Close button appears in the target UI.
- Invalid draft values do not replace the previous valid offset.
- Applied offset updates only the owner pane.

## Entity: ActivityRail

Existing entity retained.

Validation rules:

- Ordered items remain search, filter, palette, files, bookmark, settings.
- Future filter, palette, and bookmark controls stay hidden, disabled, or
  clearly unavailable.
- Files remains limited to MVP source-opening behavior.

## Entity: TestCoverageMap

Fields:

- `reusedUnchanged`: tests reused without expected-result changes.
- `updatedSelectors`: tests migrated for accessible names, test IDs, or shell
  layout assertions.
- `newAlignmentCoverage`: tests added for uncovered design deltas.
- `validationGates`: local macOS and GitHub Actions commands.

Validation rules:

- Existing tests for unchanged behavior must not be rewritten from scratch.
- New tests cover only documented alignment deltas.
- Obsolete-control removal and rightmost-pane alignment are first-class mapped
  acceptance criteria.
