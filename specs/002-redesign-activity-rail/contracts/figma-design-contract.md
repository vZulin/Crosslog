# Contract: Figma Design Interpretation

## Source

- File: `Crosslog Log Viewer UI Design`
- Frame: `Screen / Draft Layout - Activity Rail`
- Node: `11:3`
- Local feature spec: `/Users/Vladimir.Zulin/projects/idea/Crosslog/specs/002-redesign-activity-rail/spec.md`

## Mandatory MVP Regions

- Topbar with command field, synchronization control, and add-pane control.
- Activity rail with search/source/settings entry points and safe future-action treatment.
- Pane workspace with side-by-side panes and workspace-level horizontal scrolling.
- Per-pane header with source title, file title when directory-backed, close action, search action, offset tag, directory previous/next controls when applicable, live indicator, and active-pane indicator.
- Log viewport with line numbers, timestamp text, severity text when recognized, and raw message text.
- Pane search popover with query input, previous/next match actions, case-sensitive toggle, regex toggle, and current/total count.
- Time offset popover with days, hours, minutes, seconds, milliseconds, and apply action.
- Status bar with pane count, synchronization state, and active source.

## Scope Boundaries

- The design does not add filtering, user-configurable highlighting, saved filter sets, bookmarks, recursive directory search, remote sources, or file-manager behavior.
- Future controls shown in the rail must be hidden, disabled, or unavailable until their feature specifications exist.
- Static severity visual emphasis is allowed only as a display treatment of recognized values; it must not become user-configurable highlighting.
- Figma-generated MCP asset URLs must not be used as runtime application assets.

## Acceptance Contract

- All mandatory regions are visible in the non-empty workspace.
- Essential controls remain reachable by keyboard and screen-reader name.
- Long pane titles and long status labels do not overlap primary controls.
- Platform-specific window controls may differ, but the Crosslog shell layout must remain consistent.
- Empty workspace still provides the central open action and drag/drop where supported.
