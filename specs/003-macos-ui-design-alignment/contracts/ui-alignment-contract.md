# Contract: UI Alignment Behavior

This contract extends
`/Users/Vladimir.Zulin/projects/idea/Crosslog/specs/002-redesign-activity-rail/contracts/ui-behavior.md`
with the updated design deltas from
`/Users/Vladimir.Zulin/projects/idea/Crosslog/docs/crosslog-ui-design.md` and
`/Users/Vladimir.Zulin/projects/idea/Crosslog/docs/mockups/crosslog-macos-redesign-mockups.html`.

## Scope Boundary

- This is a design-alignment pass for the existing MVP UI.
- It must not add remote sources, filtering, configurable highlighting,
  bookmarks, saved filter sets, recursive directory search, SSH, file-manager
  behavior, a new parser model, a new backend, or a new UI framework.
- Existing source opening, directory navigation, search, sync, offset, file
  watching, encoding, session restore, performance, and safety behavior remain
  requirement-driven by prior specs.

## Shell

- The shell contains topbar, activity rail, optional guarded left panel, pane
  workspace, and statusbar.
- The topbar height is shared between empty and populated workspaces.
- Light and dark theme tokens apply to all actual shell surfaces.
- Theme selection is current-session presentation state in this alignment pass;
  no new persisted theme preference storage is added.
- macOS, Windows, Linux, and Web variants render appropriate shell chrome while
  preserving shared product behavior.
- OS-specific UI gates validate the default runtime chrome on their
  corresponding OS; override rendering is limited to mockup/test coverage.
- Web shell does not render desktop radius or shadow.

## Topbar

- The topbar contains only the compact command field, sync icon control, and
  add-pane icon control.
- Sync and add-pane controls sit immediately to the right of the command field.
- The following visible text/controls are prohibited in the topbar: `Split`,
  `Synchronize by time`, `Sync on`, and `Sync off`.
- Add pane splits the rightmost pane when panes exist and opens the first pane
  path when the workspace is empty.

## Empty Workspace

- Empty workspace uses the same topbar and activity rail as populated workspace.
- Empty workspace shows a centered drop zone and `Open Source` action.
- Drag-over state highlights the drop zone without moving it.
- Pane-specific controls, workspace test-action toolbar, and secondary panels
  stay hidden while no panes exist.

## Pane Workspace

- Panes are resized by dragging boundaries between panes.
- Plus/minus resize buttons are prohibited in product UI.
- Desired pane widths persist through existing pane/session state.
- Computed fill widths may be used to avoid blank space, but must not overwrite
  persisted desired widths.
- When panes fit, the right edge of the rightmost pane reaches the workspace
  right edge.
- When panes overflow, workspace horizontal scrolling appears and all panes
  remain reachable.
- Each pane keeps independent horizontal scrolling for long log lines.

## Pane Headers

- File pane headers show file identity, live indicator when applicable, offset
  tag, pane find icon, close action, and active pane state.
- Directory pane headers show directory identity, current file identity,
  previous/next controls, live indicator when applicable, offset tag, pane find
  icon, close action, and active pane state.
- File panes must not show directory previous/next controls.
- Long file, directory, and current-file names truncate without overlapping
  live, offset, find, close, or navigation controls.
- Per-pane `ready` footers are prohibited.

## Popovers

- Pane search popover opens from the invoking pane and remains visually anchored
  to that pane/control.
- Time offset popover opens from the invoking pane and remains visually anchored
  to that pane/control.
- Opening the same popover type from another pane moves it to that pane.
- Escape closes the popover and returns focus to the triggering control.
- Pane search remains query, previous, next, case-sensitive, regex, and match
  count.
- Time offset remains days, hours, minutes, seconds, milliseconds, and Apply.
- The target time offset popover has no persistent Close button.

## Obsolete Controls

The following controls must not appear in user-facing product UI:

- Permanent pane `Copy` toolbar.
- `Discover newer directory file`.
- `Append live line`.
- `Delete active file`.
- `Replace active file`.
- `Split`.
- `Synchronize by time`.
- Topbar `Sync on` / `Sync off` text.
- Plus/minus pane resize controls.
- Per-pane `ready` footer.
- Persistent workspace action toolbar above panes.

Test-only lifecycle operations may remain available only through test bridge or
internal test APIs that are not visible in product UI.

## Activity Rail And Left Panel

- Activity rail order is search, filter, palette, files, bookmark, settings.
- Future filter, palette, and bookmark controls are hidden, disabled, or
  explicitly unavailable until implemented by a separate feature.
- Files control remains limited to MVP source-opening behavior.
- Directory Search left panel is a future/search-scope surface unless
  directory-wide search requirements are implemented elsewhere.
- If a Directory Search panel shell is visible, it must be disabled or inert; if
  it is not visible, its absence must be recorded in guardrail coverage.

## Accessibility

- Icon-only controls have accessible names and testable state.
- Disabled future controls are not focus traps.
- Structural regions keep stable roles or `data-testid` values where semantic
  selectors are insufficient.
- Expected results come from requirements and design contracts, not from current
  broken UI output.
