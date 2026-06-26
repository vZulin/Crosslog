# Contract: Redesigned UI Behavior

## Shell Layout

- The primary screen is the log-analysis workspace, not a landing page.
- The topbar contains global actions only.
- The activity rail contains workspace-level action entry points.
- The pane workspace contains all Log Panes and supports horizontal scrolling when panes exceed visible width.
- The status bar summarizes current pane count, synchronization state, and active source.

## Pane Management

- Adding a pane from the topbar or workspace action splits the rightmost pane when panes exist.
- Closing a pane from its header redistributes available space.
- Pane resize behavior must preserve user-adjusted sizes until changed or restored from session.
- The active pane must be visually distinguishable and must remain the Time Anchor Pane.

## Directory Pane Headers

- Directory panes show both directory title and selected file title.
- Previous and next controls navigate within the current directory ordering.
- Previous and next controls are disabled at boundaries.
- Newer files update navigation availability without auto-selecting the new file.
- Deleted and recreated same-name files update state according to MVP file identity behavior.

## Search

- Pane search opens from the pane header and may also be focused from the activity rail or command field.
- Search operates on full loaded pane content.
- Text, regex, and case-sensitive modes remain per-pane.
- Current/total match count must be visible when search has a query.
- Invalid regex must show a pane-local error and retain last valid results.

## Synchronization and Time Offset

- Synchronization is controlled from the topbar and is enabled by default.
- Disabling synchronization makes panes scroll independently.
- Time offset is displayed in each pane header.
- Activating the offset tag opens the Time Offset popover for that pane.
- Applying valid offset values updates only the selected pane.
- Invalid offset values are rejected without replacing the previous valid offset.

## Live, Deleted, and Error States

- Live file state is visible in the pane header when updates are active.
- Deleted files keep loaded content visible and searchable.
- Pane-local read/decode/search/config errors do not close other panes.
- Browser capability limitations are visible only where the browser cannot support Desktop behavior.

## Future Feature Guardrails

- Filter, palette, bookmark, saved-filter, recursive-search, and remote-source controls must not execute behavior in MVP.
- Any visible future control must have an unavailable state that is testable and understandable.
- Future extension slots must not affect existing user flows or keyboard navigation.
