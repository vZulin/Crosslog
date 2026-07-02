# UI Behavior Contract: Crosslog Bug Batch 2 Stabilization

Authoritative behavior for the seven bugs. Each contract item is observable and
testable. Behavior not listed here is unchanged from prior specs.

## Desktop Dark Theme (Bug 1)

- In dark theme, Desktop interface surfaces render the authoritative dark-theme
  color values from `docs/mockups/crosslog-macos-redesign-mockups.html`
  ("Screen / Draft Layout - Activity Rail", dark variant `data-theme="dark"`).
- Light theme and theme-resolution behavior (System/Light/Dark) are unchanged.

## Desktop Source Picker (Bug 2)

- Activating the Desktop add-pane / open-source control opens the native
  file/directory picker.
- Selecting a file or directory opens exactly one Log Pane for that source.
- Cancelling the picker creates no pane and leaves the workspace unchanged.

## Desktop Drag-And-Drop (Bug 3)

- Dropping a supported file or directory onto the Desktop window opens a Log Pane
  for the dropped source.
- Dropping an unsupported item creates no pane and leaves the workspace stable.

## Web Directory Opening (Bug 4)

- The Web source-open flow lets the user choose and open both a file and a
  directory; a Log Pane opens for the selection.
- Where the browser cannot support directory selection, the limitation is reported
  via the capability report rather than failing silently.

## Log Viewport Vertical Scroll (Bug 5)

- Vertical wheel and scrollbar scrolling moves the rendered log text through the
  loaded lines.
- The first line and the last loaded line are reachable at the scroll extremes.
- With synchronization enabled, scrolling moves other eligible panes per existing
  timestamp rules.

## Pane-Header Drag Reorder (Bug 6)

- Pressing and dragging any non-control region of a pane header starts a reorder.
- Crossing another pane's midpoint and releasing moves the pane there; intervening
  panes keep their relative order.
- Clicking an interactive header control (search, close, offset, directory
  navigation) runs its action and never starts a drag.

## Icon Centering (Bug 7)

- Each covered icon (scroll-sync toggle, add-pane, close-pane, activity-rail
  icons, search-popover navigation arrows) is centered within the hover highlight
  zone shown on pointer-over.
- Covered controls remain accessible and non-overlapping across covered viewports.
