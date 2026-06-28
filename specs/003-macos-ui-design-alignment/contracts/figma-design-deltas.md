# Contract: Updated Mockup Design Deltas

This contract interprets the updated HTML mockups as deltas over the Activity
Rail design baseline from `specs/002-redesign-activity-rail`.

## Authoritative Inputs

- `/Users/Vladimir.Zulin/projects/idea/Crosslog/docs/crosslog-ui-design.md`
- `/Users/Vladimir.Zulin/projects/idea/Crosslog/docs/mockups/crosslog-macos-redesign-mockups.html`
- `/Users/Vladimir.Zulin/projects/idea/Crosslog/specs/002-redesign-activity-rail/contracts/figma-design-contract.md`

## Required Screens

- `Screen / Empty Workspace - Light`
- `Screen / Draft Layout - Activity Rail`
- `Screen / Draft Layout - Left Panel Open`
- Standalone `Pane Search Popover`
- Standalone `Time Offset Popover`
- Light and dark variants.
- macOS, Windows, Linux, and Web variants.

## Dimensions And Layout Targets

- Desktop topbar height: approximately `35.56px`.
- Activity rail width: `40px`.
- Statusbar height: `27px`.
- Command field: approximately `375.36 x 27.66px`.
- Sync and add-pane icon buttons: approximately `27 x 27px`.
- Default pane width target: `444px`.
- Pane header height target: `55px`.
- Workspace scrollbar height target: approximately `7.902px`.
- Empty drop zone target: approximately `460 x 230px`.
- Left panel target width: `260px`.

Implementation may use resilient CSS/flex/grid values instead of absolute
Figma coordinates, but visible structure must match the target behavior:
compact topbar cluster, rail at 40px, no pane gaps, no unused space to the right
of the rightmost pane when panes fit, and horizontal overflow only when needed.

## Visual Treatment

- Use the light and dark tokens from the design document for all application
  surfaces.
- Dark mode is independently designed and must not be a naive inversion.
- Log text uses a compact monospace font and structured line columns.
- Severity colors remain display treatment only and do not become configurable
  highlighting.
- Long text truncates with ellipsis and does not overlap primary controls.

## Platform Chrome Interpretation

- macOS: traffic lights in the top-left topbar area.
- Windows: no traffic lights; show title and Windows caption controls.
- Linux: no traffic lights; show title and compact round caption controls.
- Web: no desktop radius/shadow; show title without desktop chrome behavior.

Platform chrome is visual shell treatment. It must not fork source handling,
directory behavior, search, sync, offsets, or session logic.

## Popover Interpretation

- Pane Search Popover is compact and pane-local.
- Time Offset Popover is compact and pane-local.
- The popovers may be implemented with the existing popover primitive if size,
  anchor, keyboard, and focus contracts are satisfied.
- Time Offset target contains Apply only as a persistent action; Close is by
  Escape or outside/trigger behavior according to the shared popover contract.

## Left Panel Interpretation

The `Screen / Draft Layout - Left Panel Open` mockup defines the shell pattern
for a future directory/search panel. It is not permission to add directory-wide
search, recursive search, saved sets, filtering, highlighting, or bookmarks in
this alignment pass.

If a left panel shell is rendered before directory-wide search exists, it must
be guarded, unavailable, or limited to already implemented behavior.

## Explicit Non-Goals

- No runtime dependency on Figma-exported assets or MCP URLs.
- No new UI kit.
- No marketing/landing page treatment.
- No new product features beyond MVP and existing Activity Rail scope.
