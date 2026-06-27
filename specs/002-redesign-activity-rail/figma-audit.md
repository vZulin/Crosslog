# Figma Audit: Activity Rail Shell

**Feature**: Crosslog Activity Rail Redesign  
**Figma file**: Crosslog Log Viewer UI Design  
**Figma file key**: `ElnRrprtGhFDaM9YpHHsWr`
**Frame**: Screen / Draft Layout - Activity Rail  
**Node**: 11:3  
**Figma URL**: Derivable from the file key and node above; no requester URL is
required for follow-up access.
**Audit source**: Figma MCP design context, existing research notes, and design contracts.

## Frame Inventory

The referenced frame represents a complete non-empty Crosslog workspace in a
macOS-style window. The natural screenshot size is 1024 x 637 pixels, scaled
from an application frame of roughly 1375 x 825 logical pixels.

Mandatory visible regions:

- Topbar: 35px high, light background, bottom border, macOS traffic lights,
  centered command field, synchronization control, and add-pane control.
- Activity rail: 40px wide vertical rail with search, filter, palette, files,
  bookmark, and settings controls.
- Pane workspace: horizontally scrollable content area containing three log
  panes and a visible workspace-level scrollbar near the bottom.
- Log panes: three 444px-wide panes with per-pane header, close action, search
  action, offset tag, and log viewport.
- Directory pane headers: directory title, selected file title, optional
  selected-file live dot, previous/next controls, and file/folder icons.
- Search popover: pane-local search field, previous/next controls, case toggle,
  regex toggle, and match count.
- Time offset popover: pane label, day/hour/min/sec/ms inputs, and apply button.
- Status bar: 27px high region with pane count, sync state, and active source.

## Visual Tokens

Colors observed in the frame:

- Window background: `#f5f5f7`
- App body and panes: `#ffffff`
- Topbar and neutral controls: `#fafafa`
- Rail and status surfaces: `#f0f0f3`
- Border color: `#d9d9df`
- Secondary scrollbar track: `#dcdde1`
- Scrollbar thumb: `#a6a9af`
- Accent blue: `#007aff`
- Accent blue surface: `#d9ebff`
- Primary text: `#1d1d1f`
- Muted text: `#6e6e73`
- Line number text: `#8e8e93`
- Warning surface/text: `#fff4d7` / `#9a6500`
- Error surface/text: `#ffe5e5` / `#ff3b30`

Typography observed in the frame:

- Shell UI: Inter, regular/medium/semi-bold, mostly 10-13px.
- Log viewport: Roboto Mono, regular/medium, roughly 10.9px with 15.8px line
  height.
- Command and pane search placeholders: Inter regular, roughly 11.9px.

Shape and spacing:

- Window radius is about 12px.
- Toolbar, rail, pane header, and popover controls use about 6-7px radius.
- Pill tags use about 10px radius.
- Icon buttons are about 25-27px square.
- Activity rail buttons have about 6px left offset and 7px vertical rhythm.
- Pane headers are about 55px high.

## MVP Interaction Mapping

Topbar:

- Command field is the global action entry point and workspace search entry.
- Sync button is visually active in the frame and maps to synchronization on.
- Add-pane button maps to the MVP pane split/add action.

Activity rail:

- Search maps to focusing pane/workspace search.
- Files maps to source/file actions.
- Settings maps to available settings.
- Filter, palette, and bookmark are visible extension points only. They must not
  execute filtering, user-configurable highlighting, bookmarks, saved filters,
  recursive search, remote access, or file-manager behavior in the MVP.

Pane headers:

- File panes show a file title, live dot where applicable, offset tag, close
  action, and search action.
- Directory panes show directory title, selected file, optional selected-file
  live dot, previous/next controls, offset tag, close action, and search action.
- Active pane is indicated by a blue top border.

Popovers:

- Time offset popover is anchored to the log pane that invoked it and includes
  days, hours, minutes, seconds, milliseconds, and apply.
- Pane search popover is anchored near the pane header and includes plain query,
  previous/next, case, regex, and match count controls.

Log viewport:

- Rows preserve line number, timestamp text, severity, and raw message text as
  separate visual segments.
- Severity color and row background are static recognition treatments. They
  must not become user-configurable highlighting in the MVP.

## Icon Inventory

Required local icon module coverage:

- Window traffic indicators for desktop chrome only when the platform shell owns
  that rendering.
- Topbar: sync, add pane, command search.
- Activity rail: search, filter, palette, files, bookmark, settings.
- Pane header: close, find/search, file, folder, previous, next, live dot,
  time offset.
- Popovers: time offset, pane search, previous result, next result.

Figma MCP asset URLs are short-lived inspection outputs and must not be used as
runtime application assets.

## Responsive And Accessibility Risks

- The centered command field and right-side topbar controls can collide in narrow
  widths unless the layout defines min/max constraints.
- Pane headers combine title, close, search, directory controls, and offset tag;
  long names must truncate before controls overlap.
- The activity rail contains icon-only controls. Every enabled or disabled
  button needs an accessible name and a non-ambiguous unavailable state.
- Popovers need focus management, accessible labels, and keyboard-operable
  controls.
- Workspace horizontal scrolling must not hide pane controls permanently or
  prevent keyboard access to off-screen panes.
- Status bar text must truncate without hiding pane count or synchronization
  state.

## Implementation Boundaries

- Keep existing product behavior and platform ports. This audit adds no new
  filesystem, monitoring, remote, filtering, bookmark, or highlighting
  capability.
- Implement the visual shell in shared UI code so Web and Desktop use the same
  structure.
- Prefer stable roles and accessible names. Use `data-testid` for structural
  regions where semantics are insufficient.
- Treat all log text, command field input, search input, and copied text as inert
  text.
