# Crosslog Full UI Design

## Purpose

This document defines the target Crosslog user interface for the complete
product, not only the MVP. It covers the shared Web/Desktop experience,
macOS-native desktop behavior, light and dark themes, multi-log viewing,
time synchronization, per-pane search, directory-wide search, filters,
highlight templates, settings, menus, popovers, sheets, and dialogs.

The design keeps log content as the primary surface. Controls are dense,
predictable, and close to the workflow, because users will keep this app open
during troubleshooting sessions and compare long technical text repeatedly.

## Design Direction

### Alternatives Considered

1. **Single horizontal pane rail with floating tools**
   - Strong for maximum log density and side-by-side comparison.
   - Weak for advanced filter/search management because controls can become
     scattered.

2. **IDE-style shell with side panels**
   - Strong for complex tools: filters, highlights, directory search, source
     browsing, and saved presets.
   - Weak if every panel is visible at once, because it reduces log width.

3. **Tabbed workspace**
   - Strong for many unrelated investigations.
   - Weak for Crosslog's primary value: simultaneous visual comparison.

### Recommendation

Use an IDE-style shell with a horizontal pane rail as the main workspace and
collapsible side panels for advanced workflows. This keeps the default view
focused on log text while still giving full-power users persistent controls for
filters, highlights, and directory search.

The shell must use the same React component model across Desktop and Web. Native
platform differences are expressed through capabilities, menus, file pickers,
drag-and-drop behavior, and messaging.

## Shell Layout

### Desktop Window

```text
+----------------------------------------------------------------------------+
| [traffic lights] Crosslog      [ Search or Command... ] [Sync] [Tools]      |
+---------------+-----------------------------------------------+------------+
| Sources       | Pane rail                                     | Inspectors |
| Sessions      | +----------+----------+----------+    +       | Filters    |
| Saved Sets    | | app.log  | api.log  | worker   |            | Highlights |
| Recent        | | log text | log text | log text |            | Search     |
|               | |          |          |          |            | Details    |
+---------------+-----------------------------------------------+------------+
| Status: 3 panes, sync on, 1 untimed pane excluded, watching 2 sources       |
+----------------------------------------------------------------------------+
```

### Web Shell

```text
+----------------------------------------------------------------------------+
| Crosslog              [ Search or Command... ] [Sync] [Open] [Settings]     |
+---------------+-----------------------------------------------+------------+
| Sources       | Pane rail                                     | Inspectors |
| Sessions      | Same workspace behavior as Desktop            | Same tools |
+---------------+-----------------------------------------------+------------+
| Web limitations are shown only when they affect the current source.         |
+----------------------------------------------------------------------------+
```

### Regions

- **Title bar / global toolbar**: 52 px high on desktop, draggable on macOS.
  Contains traffic lights, window title, command/search field, sync toggle,
  pane layout controls, and global actions.
- **Left sidebar**: 240 px default, resizable from 200-320 px. Contains Sources,
  Recent, Sessions, and Saved Filter/Highlight Sets. Collapsible to an icon rail.
- **Pane rail**: horizontal virtualized log workspace. Panes are resizable,
  independently horizontally scrollable, and can overflow the window.
- **Right inspector**: 320 px default, resizable from 280-460 px. Contains tabs
  for Filters, Highlights, Directory Search, Details, and Problems.
- **Status bar**: 28 px. Shows live source state, active pane, sync state,
  selected timestamp, encoding, line count, and background work.

## Main Toolbar

The toolbar stays sparse and uses icons with tooltips. Text labels are reserved
for ambiguous actions.

| Control | Type | Shortcut | Behavior |
| --- | --- | --- | --- |
| Sidebar toggle | Icon button | `Cmd+B` | Shows/hides the source sidebar. |
| Open source | Split button | `Cmd+O` | Opens file, directory, or SSH source. |
| Command field | Search/command field | `Cmd+K` | Opens command palette and cross-workspace search. |
| Find in active pane | Search mode | `Cmd+F` | Focuses active pane search. |
| Synchronize scrolling | Toggle | `Cmd+Shift+L` | Enables/disables time sync globally. |
| Add pane | Icon button | `Cmd+T` | Splits the rightmost pane. |
| Inspector toggle | Icon button | `Cmd+Option+I` | Shows/hides right inspector. |
| Settings | Icon button | `Cmd+,` | Opens Settings window/sheet. |

Desktop uses native application menus in addition to toolbar controls. Web shows
equivalent actions in an application menu button.

## Left Sidebar

### Sources

The Sources section shows opened sources and their capability state.

Row content:

- Source icon: file, folder, SSH host, warning, deleted, or watching.
- Display name.
- Secondary label: path, selected directory file, host, or limitation.
- Small badges: `Live`, `Deleted`, `Rotated`, `Web`, `Untimed`, `Encoding`.

Row interactions:

- Click selects the related pane.
- Double click opens in a new pane if not already visible.
- Drag into pane rail opens the source at that position.
- Context menu: Reveal, Copy Path, Add to Pane, Close Source, Reload, Select
  Encoding, Set Time Offset.

### Sessions

Shows recent and saved sessions. Session rows include pane count, source count,
last opened time, and warning badges for missing sources. Restoring a session
does not restore scroll positions.

### Saved Sets

Saved filter/highlight sets are visible from the left sidebar for fast global
application. The right inspector is used for editing the selected set.

## Pane Rail

The pane rail is the primary workspace. It must remain usable with many panes,
wide log lines, and narrow windows.

### Pane Anatomy

```text
+----------------------------------------------------------+
| title.log                      [Dir < >] [Find] [...] [x] |
| /var/log/service/title.log, UTF-8, Live, +00:00:00        |
+----------------------------------------------------------+
| inline pane search / filter chips / active highlights     |
+----------------------------------------------------------+
| 12345  2026-06-16 09:01:15.122 INFO request accepted      |
| 12346  2026-06-16 09:01:15.181 WARN retry scheduled       |
| 12347  2026-06-16 09:01:15.222 ERROR upstream failed      |
+----------------------------------------------------------+
| 250,000 lines, 12 matches, synced to 09:01:15.222         |
+----------------------------------------------------------+
```

Pane header:

- Primary title: file name or selected directory file.
- Secondary title: path, directory name, host, encoding, live state.
- Active pane indicator: subtle accent line at the top edge.
- Directory navigation: previous/next buttons only for directory sources.
- Pane menu: source actions, filter scope, offset, encoding, copy, close.
- Close button: visible on hover/focus, always keyboard reachable.

Log viewport:

- Uses `SF Mono`, `Menlo`, or platform monospace.
- Virtualizes rows and applies filtering/highlighting only around the viewport
  plus configured pre-processing buffer.
- Shows line number, timestamp segment, severity segment, message text, and
  optional match markers.
- Renders log text as inert text. Links and terminal escape sequences are not
  executable.
- Maintains independent horizontal scrolling per pane.

### Pane States

| State | Visual Treatment | Primary Action |
| --- | --- | --- |
| Ready | Normal header and content. | View and analyze. |
| Loading | Header progress strip and skeleton rows. | Cancel open. |
| Watching | Small live pulse badge, no noisy animation in content. | Pause follow. |
| Deleted | Amber badge, content retained, live badge removed. | Reopen or close. |
| Rotated | Blue info badge and toast; new file content loaded. | Show previous buffer if available. |
| Empty directory | Centered compact state inside pane. | Choose another directory. |
| Error | Red badge and concise message. | Retry, select encoding, or close. |
| Memory-limited | Error sheet before load completes. | Increase limit or cancel. |
| Untimed | Gray `Untimed` badge. | Configure timestamp format. |

## Search

### Per-Pane Search

Each pane has independent search state:

- Plain text.
- Regular expression.
- Case sensitive mode.
- Previous/next result navigation.
- Result count and current index.
- Invalid regex error scoped to that pane.
- Live updates when appended lines match.

The pane search field appears below the pane header when active and collapses to
a compact chip when inactive.

### Directory-Wide Search Panel

Directory-wide search lives in the right inspector under the **Directory Search**
tab. It searches all files in opened directory sources across all panes.

Panel sections:

- Query field with text/regex/case controls.
- Scope selector: Active directory, all opened directories, selected sources.
- File filters: name pattern, size range, modified range, encoding.
- Result list grouped by source and file.
- Result row: file name, line number, timestamp, excerpt, match highlight.
- Navigation buttons: Open in current pane, Open in new pane, Reveal in source,
  Copy result.

Desktop can use filesystem watchers for fresh directory contents. Web must show
capability messaging when automatic discovery is unavailable.

## Filters

Filters are managed in the right inspector under **Filters**. Filtering can be
applied to the active pane, selected panes, or all panes.

### Filter Model

Filter set:

- Name.
- Scope: active pane, selected panes, all panes, or source pattern.
- Positive rules: show lines matching at least one enabled positive rule.
- Negative rules: hide lines matching any enabled negative rule.
- Rule type: plain text or regex.
- Case mode: case-insensitive or case-sensitive.
- Match target: full line, timestamp, severity, message, source name.
- Enabled state per rule.

### Filter Panel Layout

```text
Filters
[Set: Production Errors v] [Save] [...]

Scope
( ) Active pane  ( ) Selected panes  (*) All panes

Positive filters
[+]  text  "ERROR"              [Aa] [.*] [on]
[+]  regex "timeout|refused"    [Aa] [.*] [on]

Negative filters
[-]  text  "healthcheck"        [Aa] [.*] [on]

Preview
Shown: 12,420 of 250,000 lines, Hidden: 237,580
```

Interactions:

- Adding a positive filter from selected log text is available from the text
  selection popover and context menu.
- Invalid regex shows inline validation before applying.
- Applying a filter is immediate and reversible.
- Empty positive filter list means all lines pass the positive phase.
- Negative filters are applied after positive filters.

## Highlighting

Highlight controls are placed below filters in the same right inspector tab
group, matching the requirement that filters and highlight styles are managed
together.

### Built-In Highlight Templates

Crosslog ships with five templates:

1. **Errors and Warnings**: ERROR, FATAL, WARN.
2. **HTTP Status**: 2xx, 3xx, 4xx, 5xx status patterns.
3. **Latency**: duration values, slow thresholds, timeout patterns.
4. **Identifiers**: request IDs, trace IDs, session IDs, correlation IDs.
5. **Timestamps and Services**: timestamp segments and common service prefixes.

### Highlight Rule Model

Rule fields:

- Name.
- Pattern and type: text or regex.
- Foreground color.
- Background color.
- Font style: regular, medium, bold, italic, underline.
- Match target: full line, timestamp, severity, message, source name.
- Priority when multiple rules match.
- Enabled state.

### Quick Highlight Menu for Selected Text

When the user selects text in a log pane, show a compact floating popover near
the selection.

Actions:

- Copy.
- Find in pane.
- Filter include.
- Filter exclude.
- Highlight as...
- Add timestamp format from selection.

`Highlight as...` opens a submenu:

- Error.
- Warning.
- Success.
- Request ID.
- Custom color...
- Add to current template.
- Create new template.

The popover disappears on Escape, scrolling, clicking outside, or completing an
action. It must not obscure the selected line when possible.

## Context Menus

### Log Text Context Menu

- Copy.
- Copy line.
- Copy with line numbers.
- Copy timestamp.
- Find selection in pane.
- Search selection in directories.
- Include filter from selection.
- Exclude filter from selection.
- Highlight selection.
- Add timestamp parser from selection.
- Reveal source.

### Pane Header Context Menu

- Rename pane label.
- Set time offset.
- Select encoding.
- Reload source.
- Open containing directory.
- Duplicate pane.
- Close pane.
- Close other panes.
- Disable sync for this pane.
- Export visible lines.

### Source Sidebar Context Menu

- Open in new pane.
- Open in active pane.
- Reveal in Finder / file manager.
- Copy path.
- Reload.
- Select encoding.
- Remove from workspace.
- Stop watching.

## Time Synchronization and Offset

### Synchronization

Global synchronization is enabled by default. The active pane becomes the time
anchor after user scroll, search navigation, or directory navigation. Untimed
panes are excluded and cannot drive synchronization.

Visual feedback:

- Active anchor pane has a subtle accent indicator.
- Target panes show a short flash on the synchronized target row.
- Untimed panes show `Untimed` in the header and an action to configure
  timestamp formats.
- Status bar shows `Sync on`, active timestamp, and excluded pane count.

### Time Offset Dialog

Time offset is configured per pane from the pane menu or header badge.

Dialog fields:

- Days.
- Hours.
- Minutes.
- Seconds.
- Milliseconds.
- Sign selector: ahead / behind.
- Preview: original timestamp, adjusted timestamp.
- Apply to: active pane, panes from same source, selected panes.

The dialog is a sheet on desktop and a modal on Web. Reset is explicit and
undoable through toast.

## Opening Sources

### Open Source Menu

The Open split button contains:

- Open File...
- Open Files...
- Open Directory...
- Open Recent.
- Open SSH Source...
- Paste Path.
- Drop files here.

Desktop uses native file/directory pickers. Web uses browser file input,
directory input when supported, and drag-and-drop. Unsupported options remain
visible only when their limitation helps explain the platform behavior.

### Open Directory Dialog

Controls:

- Directory picker.
- Top-level files only notice.
- Sort strategy: creation time, modified time, name.
- Initial file: newest, oldest, choose manually.
- Search directory after open toggle.
- Open each selected file in separate pane toggle.

### SSH Source Dialog

SSH is a future full-product capability. It should be designed now but disabled
or hidden until implemented.

Fields:

- Host alias from OpenSSH config.
- Hostname.
- Port.
- Username.
- Authentication method: OpenSSH config, key, password.
- Remote path.
- Test connection.
- Open read-only.

Password prompts must use platform-secure input controls and never store
passwords unless a platform credential store is explicitly supported.

## Dialogs and Sheets

| Interaction | Desktop Pattern | Web Pattern |
| --- | --- | --- |
| First run onboarding | Centered modal | Centered modal |
| Open file/directory | Native picker | Browser picker/dropzone |
| File too large | Window sheet | Modal |
| Encoding not detected | Window sheet | Modal |
| Invalid timestamp config | Settings sheet with Problems tab | Modal/settings page |
| Time offset | Window sheet | Modal |
| Save filter/highlight set | Popover or sheet | Modal |
| Delete saved set | Confirmation popover | Modal |
| Import/export settings | Native picker | Download/upload |
| SSH credentials | Secure sheet | Modal with browser limitations |
| Session restore conflict | Window sheet | Modal |

### File Too Large

Message content:

- File name.
- File size.
- Current configured limit.
- Actions: Increase limit once, Change settings, Cancel.

The file must not be partially loaded after this dialog appears.

### Encoding Not Detected

Message content:

- File name.
- Preview rows rendered with candidate encoding.
- Encoding selector.
- Actions: Apply, Apply to source, Cancel.

### Session Recovery

When a recoverable session exists:

- Show compact banner at top of workspace.
- Actions: Restore, Start clean, Review sources.
- Missing sources are listed in a sheet before restore completes.

## Settings

Settings use a native macOS Preferences window on Desktop and an in-app settings
route/modal on Web. The same sections and labels are reused.

### General

- Restore previous session on launch.
- Confirm before closing many panes.
- Default pane width.
- Default directory sort strategy.
- Recent source retention.
- UI density: Comfortable, Compact.

### Appearance

- Theme: System, Light, Dark.
- Accent color: System, Blue, Green, Orange, Purple, Custom.
- Log font family.
- Log font size.
- Line height.
- Show line numbers.
- Show timestamp column.
- Active pane indicator style.

### Logs

- Maximum file size, default 20 MB.
- Pre-processing buffer size for filters/highlights.
- Encodings and detection priority.
- Live update behavior.
- Log rotation behavior.
- Treat opened logs as read-only reminder.

### Timestamps

- Timestamp format list.
- Pattern.
- Parser.
- Test input.
- First valid timestamp rule.
- Import/export timestamp config.

### Filters and Highlights

- Default filter scope.
- Built-in highlight template toggles.
- Saved sets.
- Import/export sets.
- Rule conflict priority.

### Search

- Default search mode.
- Case sensitivity default.
- Directory search maximum files.
- Directory search maximum result count.
- Context lines around directory results.

### Shortcuts

Displays all shortcuts grouped by Workspace, Search, Filters, Highlights,
Panes, Sources, and Settings. Shortcuts are editable only when the platform can
support reliable shortcut customization.

### Security

- Read-only source policy.
- SSH credential storage policy.
- Disable link activation in logs.
- Clear recent sources.
- Clear saved sessions.

## Theme System

### Light Theme

```css
:root {
  --crosslog-bg-window: #f5f5f7;
  --crosslog-bg-content: #ffffff;
  --crosslog-bg-sidebar: rgba(246, 246, 246, 0.78);
  --crosslog-bg-toolbar: rgba(250, 250, 250, 0.82);
  --crosslog-bg-pane: #ffffff;
  --crosslog-bg-pane-active: #fbfdff;
  --crosslog-bg-input: #ffffff;
  --crosslog-bg-hover: rgba(0, 0, 0, 0.04);
  --crosslog-bg-selected: rgba(0, 122, 255, 0.12);
  --crosslog-text-primary: #1d1d1f;
  --crosslog-text-secondary: #6e6e73;
  --crosslog-text-muted: #8e8e93;
  --crosslog-border-subtle: rgba(0, 0, 0, 0.08);
  --crosslog-border-strong: rgba(0, 0, 0, 0.16);
  --crosslog-accent: #007aff;
  --crosslog-danger: #ff3b30;
  --crosslog-warning: #ff9500;
  --crosslog-success: #34c759;
  --crosslog-log-info: #0a84ff;
  --crosslog-log-warning-bg: #fff4d7;
  --crosslog-log-error-bg: #ffe5e5;
  --crosslog-log-match-bg: #fff2a8;
}
```

### Dark Theme

```css
@media (prefers-color-scheme: dark) {
  :root {
    --crosslog-bg-window: #1c1c1e;
    --crosslog-bg-content: #202124;
    --crosslog-bg-sidebar: rgba(30, 30, 32, 0.78);
    --crosslog-bg-toolbar: rgba(36, 36, 38, 0.84);
    --crosslog-bg-pane: #242528;
    --crosslog-bg-pane-active: #282b30;
    --crosslog-bg-input: #2c2c2e;
    --crosslog-bg-hover: rgba(255, 255, 255, 0.06);
    --crosslog-bg-selected: rgba(10, 132, 255, 0.2);
    --crosslog-text-primary: #f5f5f7;
    --crosslog-text-secondary: #aeaeb2;
    --crosslog-text-muted: #8e8e93;
    --crosslog-border-subtle: rgba(255, 255, 255, 0.08);
    --crosslog-border-strong: rgba(255, 255, 255, 0.16);
    --crosslog-accent: #0a84ff;
    --crosslog-danger: #ff453a;
    --crosslog-warning: #ff9f0a;
    --crosslog-success: #30d158;
    --crosslog-log-info: #64d2ff;
    --crosslog-log-warning-bg: rgba(255, 159, 10, 0.18);
    --crosslog-log-error-bg: rgba(255, 69, 58, 0.18);
    --crosslog-log-match-bg: rgba(255, 214, 10, 0.24);
  }
}
```

Dark mode uses stronger background separation than light mode. It must not be a
direct color inversion.

## Typography and Density

- UI font: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text",
  "Helvetica Neue", Helvetica, Arial, sans-serif`.
- Log font: `"SF Mono", Menlo, Monaco, "Courier New", monospace`.
- Toolbar text: 13 px.
- Sidebar row: 13 px, 30 px row height in comfortable density, 26 px in compact.
- Pane header title: 13 px semibold.
- Log text: 12-13 px, user configurable.
- Status bar: 11 px.

Do not scale type with viewport width. Use stable dimensions and responsive
panel collapse rules instead.

## Menus

### Desktop Application Menu

File:

- Open File...
- Open Files...
- Open Directory...
- Open SSH Source...
- Open Recent.
- Close Pane.
- Close Window.

Edit:

- Copy.
- Copy Line.
- Copy With Line Numbers.
- Find.
- Find Next.
- Find Previous.

View:

- Toggle Sidebar.
- Toggle Inspector.
- Toggle Status Bar.
- Compact Density.
- Comfortable Density.
- Light Theme.
- Dark Theme.
- System Theme.

Navigate:

- Next Pane.
- Previous Pane.
- Next Directory File.
- Previous Directory File.
- Go to Line...
- Go to Timestamp...

Tools:

- Synchronize Scrolling.
- Set Time Offset...
- Filters.
- Highlights.
- Directory Search.
- Command Palette.

Window:

- Minimize.
- Zoom.
- New Window.
- Bring All to Front.

Help:

- Keyboard Shortcuts.
- Open Logs Safely.
- Report Issue.

### Web Application Menu

The Web menu mirrors Desktop actions where possible and replaces native picker
items with browser-safe actions.

## Command Palette

The command palette is opened by `Cmd+K` on macOS and `Ctrl+K` on Windows/Linux.
It supports:

- Opening files/directories.
- Switching panes.
- Running searches.
- Applying saved filter/highlight sets.
- Toggling sync.
- Opening settings sections.
- Jumping to line or timestamp.

Results are grouped by Actions, Panes, Sources, Saved Sets, Settings, and
Recent Sessions.

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Cmd+O` | Open source. |
| `Cmd+Shift+O` | Open directory. |
| `Cmd+T` | Add pane. |
| `Cmd+W` | Close active pane or window depending on focus. |
| `Cmd+F` | Find in active pane. |
| `Cmd+Shift+F` | Directory-wide search. |
| `Cmd+G` | Next match. |
| `Cmd+Shift+G` | Previous match. |
| `Cmd+Shift+L` | Toggle synchronized scrolling. |
| `Cmd+Option+T` | Set active pane time offset. |
| `Cmd+Option+F` | Focus filters. |
| `Cmd+Option+H` | Focus highlights. |
| `Cmd+Option+I` | Toggle inspector. |
| `Cmd+B` | Toggle sidebar. |
| `Cmd+,` | Settings. |
| `Cmd+/` | Keyboard shortcuts overlay. |
| `Esc` | Dismiss popover, dialog, or search focus. |

On Windows/Linux, replace `Cmd` with `Ctrl` unless the platform shell reserves
the shortcut.

## Responsive Behavior

- Width below 980 px: left sidebar collapses automatically; inspector becomes a
  slide-over panel.
- Width below 760 px: pane rail keeps horizontal scrolling; each pane keeps a
  minimum width of 420 px.
- Height below 620 px: status bar remains visible, side panel content scrolls,
  toolbar controls collapse into menus.
- Web embedded mode: traffic lights are hidden; title bar spacing is adjusted.

## Accessibility

- All toolbar icon buttons require labels and tooltips.
- All popovers and dialogs must trap focus while open and return focus to the
  triggering control.
- Log viewport supports keyboard line navigation and selection.
- Search results announce count changes with polite live regions.
- Filter and highlight validation errors are inline and announced.
- Color is never the only indicator for severity, filter state, or sync state.
- Highlight foreground/background combinations must pass contrast checks.
- Large log panes preserve text selection semantics for copy operations.

## Motion

- Panel open/close: 220-260 ms.
- Hover/press feedback: 120-150 ms.
- Sync target row flash: 600 ms fade, no layout shift.
- Toasts: bottom-right on desktop, bottom-center on narrow Web.
- Respect `prefers-reduced-motion` by removing slide/spring effects and keeping
  opacity-only transitions.

## Security and Safety UX

- Opened logs are always read-only.
- Log content is rendered as inert text.
- Terminal escape sequences are visible as text or safely normalized.
- SSH password entry is never persisted without explicit credential-store
  support.
- Export actions clearly show destination and content scope.
- Web capability limitations are precise and contextual, not generic warnings.

## Implementation Mapping

### Existing Components to Evolve

- `AppShell`: add desktop/web shell chrome, sidebars, inspector, status bar,
  command palette, settings entry point.
- `PaneRail`: keep horizontal pane model, add drag insertion targets and stable
  pane minimum widths.
- `LogPane`: split pane header, pane search strip, viewport, pane footer/status.
- `PaneHeader`: add source metadata, directory controls, pane menu, active sync
  indicator.
- `PaneSearchControls`: convert to collapsible pane search strip with mode
  toggles and validation.
- `TimeOffsetEditor`: move into a sheet/popover with preview and scope controls.
- `FuturePaneToolbarSlot`: replace with real filter/highlight inspector entry
  points when those features are implemented.

### New Component Groups

- `app-shell/TitleToolbar`
- `app-shell/SourceSidebar`
- `app-shell/RightInspector`
- `app-shell/StatusBar`
- `command/CommandPalette`
- `filters/FilterInspector`
- `highlights/HighlightInspector`
- `directory-search/DirectorySearchInspector`
- `selection/LogSelectionPopover`
- `settings/SettingsWindow`
- `dialogs/OpenSourceDialog`
- `dialogs/FileTooLargeDialog`
- `dialogs/EncodingSelectionDialog`
- `dialogs/TimeOffsetDialog`
- `dialogs/SshSourceDialog`

## Acceptance Checklist

- The first screen is the usable Crosslog workspace, not a landing page.
- Empty state contains one primary open action and accepts drag-and-drop.
- Multi-pane comparison remains the visual center of the app.
- Filters and highlights are managed together in the inspector.
- Five built-in highlight templates are present.
- Positive and negative filters support text and regex.
- Directory-wide search has a dedicated side panel.
- Per-pane search remains independent.
- Selected log text exposes a quick highlight/filter/copy menu.
- Time offset is available per pane through a sheet/dialog.
- Settings cover general, appearance, logs, timestamps, filters/highlights,
  search, shortcuts, and security.
- All major user interactions have menus, keyboard shortcuts, and feedback.
- Desktop and Web use the same UI model with capability-specific affordances.
- Light and dark themes are designed independently.
- Log content remains inert and read-only.
