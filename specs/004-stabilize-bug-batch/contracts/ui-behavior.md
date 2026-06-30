# Contract: Bug Batch Stabilization UI Behavior

This contract extends:

- `/Users/Vladimir.Zulin/projects/idea/Crosslog/specs/001-multi-log-analysis/contracts/ui-behavior.md`
- `/Users/Vladimir.Zulin/projects/idea/Crosslog/specs/003-macos-ui-design-alignment/contracts/ui-alignment-contract.md`

## Scope Boundary

- Fix only the behavior required by `/Users/Vladimir.Zulin/projects/idea/Crosslog/docs/Bugs_1.txt`.
- Preserve all MVP and macOS UI alignment behavior not explicitly superseded.
- Do not add remote sources, file-manager behavior, filtering, configurable
  highlighting, bookmarks, saved sets, recursive directory search, SSH, parser
  rewrites, backend services, UI kits, or platform adapter rewrites.

## Source Opening

- Empty workspace `Open Source` opens user source selection.
- Topbar `Add pane` opens user source selection and creates a pane only after
  the user selects a file or directory.
- Cancelling user source selection leaves the workspace unchanged.
- Product source-opening actions never open predefined demo/sample sources.
- Automated tests may open fixture/sample panes only through existing test
  helpers or UI test bridge actions.
- Empty workspace drag/drop opens panes for supported dropped files or
  directories.
- Activity rail `Open sources` is disabled or inert until the source-list side
  panel exists.

## Future Global Entry Points

- Activity rail all-pane search is disabled or inert until all-active-pane
  search exists.
- Topbar command field is disabled or inert until command/all-active-pane
  search exists.
- Pane header search remains available and pane-local.
- Disabled/inert controls are accessible and must not trap focus.

## Pane Layout And Navigation

- Pane rendered width uses application space efficiently and avoids excessive
  blank horizontal scroll space.
- A single pane whose content is narrower than the workspace fills the
  workspace.
- Multiple panes preserve existing fit/overflow behavior and keep every pane
  reachable.
- Vertical wheel scrolling inside a log viewport reaches all loaded lines.
- Header drag reorders panes after crossing another pane midpoint.
- Intervening panes preserve relative order during reorder.
- Line-number gutter width follows the digit count of the pane's total line
  count.
- Focused log viewport arrow keys navigate horizontally and vertically as
  specified by the stabilization spec.
- Keyboard and wheel navigation preserve synchronization behavior when enabled.

## Search

- Pane search button hover/focus highlight surrounds the search icon.
- Pane search highlights only matching text spans.
- Plain text, regex, and case-sensitive search modes use the existing search
  semantics.
- Closing pane search hides search highlights and preserves the current
  selected/cursor line at the last navigated match.

## Copy Selection

- Right-clicking selected log text shows `Copy selected text` beside the
  pointer.
- The action may adjust position only to remain visible in the viewport.
- Left-click outside dismisses the action.
- Right-click at another valid selection position moves the action.
- Copying does not show product-visible `Copied` toast, banner, label, or
  status text.

## Time Offset

- Days accept any whole-number value.
- Hours accept only 0-23.
- Minutes and seconds accept only 0-59.
- Milliseconds accept only 0-999.
- Blank fields apply as zero.
- Invalid drafts are not applied and identify invalid fields accessibly.

## Sync, Settings, And Theme

- Topbar sync inactive, active, and hover states are visually distinct.
- Sync accessible pressed state matches actual synchronization state.
- Activity rail Settings opens a settings surface.
- Settings contains at least System, Light, and Dark theme choices.
- Fresh default theme preference is System.
- Theme changes update application surfaces without closing panes, changing
  opened sources, resetting search state, or changing synchronization state.

## Accessibility And Viewport

- Changed controls have accessible names and states.
- Changed visible surfaces pass no-overlap checks in supported viewports.
- Popovers stay visible within viewport boundaries.
- Keyboard users can reach and operate changed controls.
