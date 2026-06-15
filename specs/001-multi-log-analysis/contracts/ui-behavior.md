# Contract: UI Behavior

## Log Pane Layout

- The main screen is the analysis workspace.
- Empty state shows one central open action and accepts drag/drop where
  supported.
- Each source opens in a Log Pane with a compact header and virtualized content.
- The add-pane control sits to the right of the rightmost pane.
- Adding a pane splits the rightmost pane 50/50.
- Closing a pane redistributes freed space.
- Each pane has independent horizontal text scrolling.
- The pane rail scrolls horizontally when panes exceed viewport width.

## Directory Navigation

- Directory panes show directory name and selected file name.
- Previous and next controls navigate within the current navigation index.
- Boundary controls are disabled.
- Newer files do not automatically replace the selected file.
- Deleted or recreated files update navigation availability.

## Search

- Search state is per-pane.
- Search covers full loaded content.
- Text, regex, and case-sensitive matching are supported.
- Invalid regex shows a pane-local error.
- New appended lines update active search results.

## Synchronization

- Synchronization is enabled by default.
- Active pane is the Time Anchor Pane.
- Scroll, search, and directory navigation can change the anchor pane.
- Untimed panes are excluded and cannot drive synchronization.
- Disabling synchronization makes all panes scroll independently.
- Per-pane time offsets affect synchronization.

## Deleted and Replaced Files

- Deleted files keep the pane open.
- Loaded content remains visible and searchable.
- New data collection stops.
- The pane shows deleted-file status.
- Replacement with the same name is treated as a new file.

## MVP Future Slots

- Filter/highlight bar is hidden in MVP.
- Filtered logs are not implemented.
- Highlighted logs are not implemented.
- Directory-wide search bar is hidden in MVP.
- Save/load filter and highlight sets are not implemented.
- UI components may expose future extension slots with no active controls.
