# Crosslog UI Design

## Purpose

This document defines the target Crosslog interface for the Activity Rail
redesign. It replaces the older inspector/sidebar-heavy design with the layout
shown in `docs/mockups/crosslog-macos-redesign-mockups.html` and keeps the UI
aligned with `crosslog-requirement-specification.md`.

The product is a dense log analysis tool. The main screen must prioritize log
text, side-by-side comparison, synchronized navigation, and fast per-pane
actions. Controls should appear close to the pane or workflow that owns them.
The UI must not add product features that are outside the current requirements
unless they are explicitly feature-gated as future surfaces.

## Design Sources

- `docs/mockups/crosslog-macos-redesign-mockups.html`
  - `Screen / Empty Workspace - Light`
  - `Screen / Draft Layout - Activity Rail`
  - `Screen / Draft Layout - Left Panel Open`
  - Standalone `Pane Search Popover`
  - Standalone `Time Offset Popover`
- `docs/mockups/crosslog-current-implementation-mockup.html`
  - Used only as the before-state reference.
- `crosslog-requirement-specification.md`
  - Defines MVP behavior for files, directories, pane layout, search, sync,
    offsets, session restore, performance, reliability, security, and platform
    capability differences.

## Scope

### MVP UI

The MVP UI must support:

- Opening files and directories.
- Empty workspace open/drop flow.
- Multiple log panes.
- Directory panes with current file name and previous/next file controls.
- Drag resizing between panes.
- Independent horizontal scrolling per pane.
- Per-pane search with text, regex, and case-sensitive modes.
- Per-pane time offset.
- Synchronized scrolling by timestamp.
- Live appended lines on Desktop.
- File deletion and file rotation states.
- Session restore for panes, order, sizes, sources, and selected directory file.
- Light and dark themes.
- macOS, Windows, Linux, and Web shell variants.

### Future UI Surfaces

The activity rail includes final positions for future panels:

- Filters.
- Highlight palette.
- Bookmarks or saved investigations.
- Directory-wide search panel.
- Settings.

Filters, highlighting, saved sets, recursive directory search, and SSH are not
MVP features. Production UI must either hide these surfaces or show them as
clearly unavailable until the matching requirement is implemented. The mockup
defines their eventual placement, not permission to ship incomplete controls.

## Core Principles

1. **Log text is the primary surface.** The default screen is the usable
   workspace, not a landing page or marketing-style hero.
2. **Global controls stay sparse.** The topbar contains only command search,
   sync, and add pane.
3. **Pane controls are local.** Search, offset, directory navigation, close, and
   active state live inside the pane header.
4. **Advanced workflows are disclosed from the activity rail.** Side panels
   open only when they add value to the current task.
5. **Resizing behaves like an editor.** Panes are resized by dragging the
   boundary between panes, not by plus/minus buttons.
6. **No orphan space after the rightmost pane.** If pane content is narrower
   than the workspace, the rightmost pane stretches or the layout distributes
   space so its right edge reaches the application edge.
7. **Themes are designed independently.** Dark mode is not a direct inversion
   of light mode.
8. **Logs are read-only and inert.** The UI must never execute or mutate log
   content.

## Explicit Removals From Current UI

The following before-state controls must not appear in the redesigned product
UI:

- `Copy` button as a permanent pane toolbar row.
- `Discover newer directory file`.
- `Append live line`.
- `Delete active file`.
- `Replace active file`.
- `Split` button in the topbar.
- `Synchronize by time` checkbox text.
- `Sync on` topbar text label.
- Pane resize controls implemented as `-` and `+` buttons.
- Per-pane `ready` footer.
- Persistent workspace action toolbar above panes.

Copy remains available through native text selection, keyboard shortcut, and
context menu. File deletion, rotation, and live append are product states, not
always-visible test controls.

## Application Shell

### Desktop Window

The target desktop shell uses a compact native-feeling window:

| Element | Target |
| --- | --- |
| Window size in mockup | `1375 x 825.79 px` |
| Window radius | `11.853 px` |
| Window border | `0.988 px` |
| Window shadow | `0 15.805px 47.414px rgba(0, 0, 0, 0.13)` in light mode |
| Topbar height | `35.56 px` |
| App body top | `35.56 px` |
| Statusbar height | `27 px` |
| Activity rail width | `40 px` |

The topbar is also the desktop drag zone. Keep it visually quiet and avoid
adding extra text labels or tool groups.

### Platform Variants

The shared React UI must render platform-specific chrome while preserving the
same product layout.

| Platform | Shell chrome |
| --- | --- |
| macOS | Traffic lights at the top-left, integrated into the topbar. |
| Windows | Hide traffic lights, show `Crosslog` title and Windows caption controls. |
| Linux | Hide traffic lights, show `Crosslog` title and compact round caption controls. |
| Web | Hide traffic lights, show title, remove desktop window shadow and radius. |

Platform differences must not fork product behavior. Use capability adapters for
file watching, directory picking, and persistence.

## Topbar

### Layout

The topbar contains:

1. Platform chrome.
2. Center command field.
3. Sync icon button.
4. Add pane icon button.

Target dimensions:

| Control | Target |
| --- | --- |
| Command field | `375.36 x 27.66 px` |
| Command field radius | `6.915 px` |
| Command field text | `11.853 px`, muted |
| Sync button | `27 x 27 px`, active accent background |
| Add pane button | `27 x 27 px` |
| Button radius | `6.915 px` |

The sync and add buttons must sit immediately to the right of the command
field. Do not move them to the far-right edge of the window.

### Behavior

- Command field opens command/workspace search.
- Sync button toggles synchronized scrolling. It is active by default.
- Add pane splits the rightmost pane as required by `UI-002` through `UI-004`.
- Keyboard shortcuts:
  - `Command+K` or `Ctrl+K`: command/workspace search.
  - `Command+T` or `Ctrl+T`: add pane.
  - `Command+Shift+L` or `Ctrl+Shift+L`: toggle synchronization.

## Activity Rail

The activity rail is a `40 px` vertical strip below the topbar. Buttons are
`27 x 27 px`, use monoline icons, and have subtle border/radius treatment.

Button order:

1. Search.
2. Filter.
3. Palette.
4. Files.
5. Bookmark.
6. Settings at the bottom.

Active button state uses the accent background and accent foreground. In the
Left Panel Open mockup, Search is active because the Directory Search panel is
open.

MVP gating:

- Search may open per-workspace or directory search only when the implemented
  search scope exists.
- Files opens the source workflow in MVP. If a full source browser is not
  implemented yet, it opens the same Open Source picker or a compact recent
  sources popover.
- Filter, palette, and bookmark controls are future surfaces and must be hidden
  or disabled until implemented.
- Settings can open MVP settings if available; otherwise it must not be a dead
  control.

## Empty Workspace

The empty workspace uses the same topbar height and rail as the active screen.
It must show only the controls needed to start.

Target layout:

| Element | Target |
| --- | --- |
| Empty window | `1056 x 596 px` in mockup |
| Empty topbar | `35.56 px` |
| Drop zone | `460 x 230 px` |
| Drop zone radius | `12 px` |
| Drop zone border | `1 px dashed` |

Content:

- Icon: folder/source icon in accent color.
- Title: `Drop logs here`.
- Supporting text: `Open a file or directory into the first pane.`
- Primary action: `Open Source`.

Behavior:

- Click `Open Source` opens the file/directory picker appropriate to the
  platform.
- Dropping files or directories opens the first pane.
- Drag-over state highlights the drop zone without shifting layout.
- Secondary panels and pane-specific controls stay hidden while no panes exist.

## Pane Workspace

The pane workspace starts after the activity rail. When the left panel is
closed, it occupies the full remaining body width. When the left panel is open,
it starts after the `260 px` panel.

Target positions from the mockup:

| State | Workspace left | Workspace width |
| --- | --- | --- |
| Activity Rail screen | `40.03 px` | `1335.97 px` |
| Left Panel Open screen | `300.01 px` | `1074.99 px` |

In production code, prefer a resilient flex/grid model over absolute Figma
coordinates:

```text
+----------+---------------------------------------------+
| rail 40 | pane workspace                              |
+----------+---------------------------------------------+

+----------+-------------+-------------------------------+
| rail 40 | panel 260   | pane workspace                 |
+----------+-------------+-------------------------------+
```

### Pane Sizing

- Default pane width: `444 px`.
- Minimum pane width: enough to preserve header controls without overlap.
- Pane height fills the workspace above the horizontal scrollbar/statusbar.
- Panes are adjacent with no visible gap.
- Boundaries between panes are draggable.
- User-resized widths persist in session state.
- Adding a pane splits the rightmost pane into two equal widths.
- Closing a pane redistributes freed space among remaining panes.
- If the total pane width is less than the workspace width, distribute or
  stretch panes so the right edge of the rightmost pane aligns with the
  workspace right edge.
- If the total pane width exceeds the workspace width, use horizontal overflow.

### Horizontal Scrollbar

The workspace scrollbar uses the target `7.902 px` height and rounded thumb.
It appears only when pane content overflows horizontally. Individual log viewports
also keep independent horizontal scrolling for long lines.

## Log Pane

### Anatomy

```text
+------------------------------------------------+
| active top border                              |
|           [file or directory title]        [x] |
| [prev] [current file / offset / find] [next]   |
+------------------------------------------------+
| log viewport                                   |
| line timestamp severity message                |
+------------------------------------------------+
```

Target dimensions:

| Element | Target |
| --- | --- |
| Pane width | `444 px` |
| Pane height in mockup | `732 px` |
| Pane border | `0.988 px` |
| Header height | `55 px` |
| Active top border | about `1.976 px` |
| Viewport top | `55 px` |

### File Pane Header

For a file source:

- Show file icon and file name centered in the header.
- Show live dot near the file name when Desktop file watching is active.
- Show close button at the top-right.
- Show compact offset pill below the title.
- Show pane find icon to the right of the offset pill.
- Do not show directory previous/next controls.

### Directory Pane Header

For a directory source:

- Show folder icon and directory name as the main title.
- Show current selected file name below the directory name.
- Show live dot near the current file name when watching applies.
- Show previous and next file buttons at the lower left and lower right.
- Disable previous/next when there is no file in that direction.
- Do not automatically switch current file when newer files appear.
- Recompute previous/next availability when directory contents change.

This directly supports `DIR-004`, `DIR-005`, and `NAV-001` through `NAV-010`.

### Header Controls

| Control | Target | Behavior |
| --- | --- | --- |
| Close | `25 x 25 px` icon button | Closes the pane. |
| Previous file | `27 x 27 px` icon button | Directory source only. |
| Next file | `27 x 27 px` icon button | Directory source only. |
| Offset tag | `140 x 15 px` pill | Toggles time offset popover. |
| Find icon | `15 x 15 px` icon | Toggles pane search popover. |
| Live dot | `8 x 8 px` | Indicates active live monitoring. |

Spacing between the title, live dot, offset tag, and find icon must match the
mockup proportions and must not collapse when titles change. Truncate titles
with ellipsis instead of moving controls.

## Log Viewport

The viewport uses compact monospace text and a structured row layout.

Target typography:

- Font family: `"Roboto Mono", "SF Mono", Menlo, Monaco, Consolas, monospace`.
- Font size: `10.866 px` in the mockup baseline.
- Line height: `15.805 px`.
- Line number color: muted gray.
- Timestamp color: accent blue.
- `INFO` severity color: accent blue.
- `WARN` severity color: warning text with warning row background.
- `ERROR` severity color: error text with error row background.

Structured row columns:

1. Line number.
2. Timestamp.
3. Severity.
4. Message.

If a line cannot be parsed into structured fields, render the whole log line as
inert monospace text while preserving line number and selection behavior.

Performance:

- Row rendering must be virtualized.
- Search must run over the full file content, not only visible rows.
- Filtering and highlighting, when implemented later, must apply only to the
  configured viewport buffer.

Safety:

- Log text is inert text.
- Escape sequences are not executed.
- Links in logs are not auto-activated.
- Opened files are read-only.

## Pane Search Popover

Pane search is a compact popover anchored to the pane that invoked it. It must
not be globally fixed to the left or center pane.

Target dimensions:

| Element | Target |
| --- | --- |
| Popover | `351 x 37 px` |
| Popover radius | `9.878 px` |
| Search field | `170 x 25 px` |
| Previous/next buttons | `27 x 27 px` |
| Mode tags | `32 x 18 px` |
| Count tag | `41 x 18 px` |

Controls:

- Search field.
- Previous match.
- Next match.
- Case-sensitive toggle `Aa`.
- Regex toggle `.*`.
- Match count, for example `4/12`.

Behavior:

- Click the pane find icon to show or hide the popover for that pane.
- Opening search in another pane moves the popover to that pane.
- `Command+F` or `Ctrl+F` opens search for the active pane.
- `Enter` goes to the next match.
- `Shift+Enter` goes to the previous match.
- Invalid regex is displayed within the popover without affecting other panes.
- `Escape` closes the popover and returns focus to the triggering control.

## Time Offset Popover

Time offset is a compact pane-scoped popover anchored to the offset tag that
invoked it.

Target dimensions:

| Element | Target |
| --- | --- |
| Popover | `302.22 x 114.08 px` |
| Popover radius | `9.739 px` |
| Input | `50.644 x 25.322 px` |
| Apply button | `50.644 x 25.322 px` |

Content:

- Title: `Time Offset`.
- Source name, such as `idea.log`.
- Fields: Days, Hours, Min, Sec, Ms.
- Apply button.

Behavior:

- Click the offset tag to show or hide the popover for that pane.
- Opening offset in another pane moves the popover to that pane.
- Values are pane-local and participate in synchronized scrolling.
- Apply validates all numeric fields before committing.
- `Escape` closes without applying.
- There is no persistent `Close` button in the target popover.

## Left Panel: Directory Search

The `Screen / Draft Layout - Left Panel Open` mockup defines the side panel
pattern. Directory-wide search is a future feature in the requirements, so this
panel is feature-gated until `SEARCH-DIR-001` through `SEARCH-DIR-003` are
implemented.

Target dimensions:

| Element | Target |
| --- | --- |
| Panel width | `260 px` |
| Panel background | `#fbfbfd` light, `#25262a` dark |
| Search field | `228 x 28 px` |
| Result card | `228 x 91 px` |
| Source row | `228 x 40 px` |

Content:

- Title: `Directory Search`.
- Search action icon.
- Query field.
- Case-sensitive tag `Aa`.
- Regex tag `.*`.
- Result card with file name, line number, and excerpt.
- `Work directories` section.
- Open directory sources with selected current file labels.

Behavior:

- The active rail search button opens the panel.
- The panel shifts the workspace right by `260 px`.
- Results navigate to the matching directory file and line.
- The panel must not steal independent per-pane search state.

## Statusbar

The statusbar is a compact global readout at the bottom of the window.

Target:

- Height: `27 px`.
- Background: rail background.
- Text size: about `10.858 px`.
- Example text: `3 panes, sync on, active: daemon-10770.log`.

Use the statusbar for global state only:

- Pane count.
- Sync state.
- Active pane/source.
- Capability warning summary when needed.
- Background work summary when needed.

Do not duplicate per-pane `ready` footers.

## Theme System

Use design tokens that match the mockup. Dark mode must be designed
independently from light mode.

### Light Theme

```css
:root {
  --crosslog-screen-bg: #ececf1;
  --crosslog-window-bg: #f5f5f7;
  --crosslog-topbar-bg: #fafafa;
  --crosslog-rail-bg: #f0f0f3;
  --crosslog-pane-bg: #ffffff;
  --crosslog-border: #d9d9df;
  --crosslog-scroll-track: #dcdde1;
  --crosslog-scroll-thumb: #a6a9af;
  --crosslog-accent: #007aff;
  --crosslog-accent-bg: #d9ebff;
  --crosslog-muted: #6e6e73;
  --crosslog-line-number: #8e8e93;
  --crosslog-text: #1d1d1f;
  --crosslog-warn-bg: #fff4d7;
  --crosslog-warn-text: #9a6500;
  --crosslog-error-bg: #ffe5e5;
  --crosslog-error-text: #ff3b30;
  --crosslog-tag-bg: #f0f1f3;
}
```

### Dark Theme

```css
[data-theme="dark"] {
  --crosslog-screen-bg: #111214;
  --crosslog-window-bg: #1c1c1e;
  --crosslog-topbar-bg: #25262a;
  --crosslog-rail-bg: #1f2024;
  --crosslog-pane-bg: #202124;
  --crosslog-border: #3a3b40;
  --crosslog-scroll-track: #34363c;
  --crosslog-scroll-thumb: #6d7078;
  --crosslog-accent: #0a84ff;
  --crosslog-accent-bg: rgba(10, 132, 255, 0.24);
  --crosslog-muted: #a1a1a6;
  --crosslog-line-number: #8f949c;
  --crosslog-text: #f5f5f7;
  --crosslog-warn-bg: rgba(255, 159, 10, 0.18);
  --crosslog-warn-text: #ffd60a;
  --crosslog-error-bg: rgba(255, 69, 58, 0.2);
  --crosslog-error-text: #ff453a;
  --crosslog-tag-bg: #2c2d31;
}
```

## Typography

UI font:

```css
font-family: Inter, -apple-system, BlinkMacSystemFont, "SF Pro Text",
  "Helvetica Neue", Arial, sans-serif;
```

Log font:

```css
font-family: "Roboto Mono", "SF Mono", Menlo, Monaco, Consolas, monospace;
```

Rules:

- Do not scale font size with viewport width.
- Use stable dimensions for buttons, panes, headers, tags, and popovers.
- Truncate long file and directory names.
- Preserve text selection in log rows.
- Avoid decorative typography. This is a technical utility.

## Interaction Model

### Pane Focus

- Clicking a pane or any control inside it makes it active.
- The active pane shows the accent top border.
- The active pane becomes the time anchor when the user scrolls, searches, or
  navigates directory files.

### Synchronization

- Synchronization is enabled by default.
- Untimed panes are excluded from sync and cannot become the anchor.
- Time offset is applied per pane before synchronization.
- Sync target rows may flash with accent background without causing layout
  shift.

### File Deletion and Rotation

- Deleted files keep their loaded content visible.
- Deleted files stop receiving appended data.
- The pane header shows a deleted status.
- Replaced files with the same name are treated as new files.
- Rotation must switch the opened pane to the new file when a watched file is
  replaced by a new file with the same name.

### Text Selection

- Users can select log text.
- Users can copy through keyboard shortcut and context menu.
- Do not add a permanent `Copy` toolbar row.

## Menus and Context Menus

### Pane Header Context Menu

- Set time offset.
- Select encoding.
- Reload source.
- Open containing directory on Desktop.
- Copy path.
- Close pane.
- Close other panes.

### Log Text Context Menu

- Copy.
- Copy line.
- Copy with line number.
- Find selection in pane.
- Search selection in directory panel when available.

### Desktop Application Menu

Desktop should expose native menu equivalents for:

- Open File.
- Open Directory.
- Close Pane.
- Find.
- Find Next.
- Find Previous.
- Toggle Synchronization.
- Set Time Offset.
- Next Pane.
- Previous Pane.
- Next Directory File.
- Previous Directory File.
- Settings.

Web should expose equivalent actions through in-app menus where native menus are
not available.

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Command+O` / `Ctrl+O` | Open source. |
| `Command+Shift+O` / `Ctrl+Shift+O` | Open directory. |
| `Command+T` / `Ctrl+T` | Add pane. |
| `Command+W` / `Ctrl+W` | Close active pane when focus is in the app. |
| `Command+F` / `Ctrl+F` | Find in active pane. |
| `Command+G` / `Ctrl+G` | Next search match. |
| `Command+Shift+G` / `Ctrl+Shift+G` | Previous search match. |
| `Command+Shift+L` / `Ctrl+Shift+L` | Toggle synchronized scrolling. |
| `Command+Option+T` / `Ctrl+Alt+T` | Open active pane time offset. |
| `Command+K` / `Ctrl+K` | Command/workspace search. |
| `Escape` | Dismiss popover, panel, or dialog. |

## Settings

Settings should cover only implemented behavior in MVP:

- Theme: System, Light, Dark, when a product-visible settings surface is
  implemented.
- Default pane width.
- Maximum file size, default `20 MB`.
- Encoding detection and manual encoding fallback.
- Timestamp configuration file path and reload.
- Directory sort strategy, default creation time with name fallback.
- Session restore.
- Confirm before closing many panes.

Future settings for filters, highlights, directory-wide search, saved sets, and
SSH must be added only with those features.

Implementation note: this alignment pass wires light and dark appearance as
runtime, mockup, and test presentation state. It intentionally does not add a
product-visible theme selector or persisted theme preference storage.

## Accessibility

- Every icon button requires an accessible label and tooltip.
- Popovers must return focus to the triggering control on close.
- `Escape` closes the active popover.
- Search result count changes use polite announcements.
- Disabled previous/next directory controls expose disabled state.
- Color is never the only state signal for severity, deletion, sync exclusion,
  or active pane.
- Pane resize separators are keyboard reachable and announce current width.
- Log text remains selectable with native selection semantics.

## Motion

Use short, predictable feedback:

- Hover/press states: `120-150 ms`.
- Popover open/close: `120-180 ms`.
- Left panel open/close: `200-260 ms`.
- Sync target row flash: up to `600 ms`, opacity/background only.

Respect `prefers-reduced-motion` by removing slide/spring effects and keeping
opacity-only transitions.

## Component Mapping

### Components to Replace or Refactor

- `AppShell`
  - Owns platform chrome, topbar, activity rail, app body, statusbar, and theme
    tokens.
- `Topbar`
  - Replaces old checkbox/text/split controls with command field, sync icon,
    and add pane icon.
- `ActivityRail`
  - Owns vertical rail buttons and active panel state.
- `PaneWorkspace`
  - Owns pane sizing, drag boundaries, horizontal overflow, and right-edge
    alignment.
- `LogPane`
  - Owns header, viewport, source state, and pane-local popover anchors.
- `PaneHeader`
  - Separates file and directory source layouts.
- `PaneSearchPopover`
  - Replaces vertical form-style search UI with the compact target popover.
- `TimeOffsetPopover`
  - Replaces sheet/form-style editor with compact pane-scoped popover.
- `StatusBar`
  - Keeps only global state.

### Components to Remove From Product UI

- Workspace test action toolbar.
- Permanent pane copy toolbar.
- Plus/minus resize separator buttons.
- Per-pane ready footer.
- Topbar split button.
- Topbar synchronization checkbox and text label.

### Feature-Gated Future Components

- `DirectorySearchPanel`.
- `FilterPanel`.
- `HighlightPalettePanel`.
- `BookmarkPanel`.
- `SshSourceDialog`.

## Completed Alignment Decisions

These notes describe the implementation decisions completed by the 003
alignment pass and should guide follow-up UI work:

- The shared shell owns theme and platform presentation. `AppShell` passes
  resolved light/dark and macOS/Windows/Linux/Web variants into the shell
  layout, while Web and Desktop app entrypoints expose only mockup/test
  override inputs.
- Platform chrome is visual treatment only. macOS traffic lights, Windows
  caption controls, Linux caption controls, and Web no-radius/no-shadow
  rendering do not change source capabilities, file watching, session restore,
  search, synchronization, offsets, or pane behavior.
- Pane widths keep the existing persisted desired-width model. The workspace
  computes rendered fill widths at view time so fitting panes reach the right
  edge without mutating session data.
- Source lifecycle simulation, deletion, rotation, and live append controls are
  no longer product UI. Automated coverage drives these states through the UI
  test bridge and internal test actions.
- The empty workspace source-opening path is intentionally reduced to the
  centered drop zone and `Open Source` action. Secondary panels and pane-local
  controls stay absent until a source is open.
- Pane search and time offset remain owned by the invoking pane. Escape closes
  each compact popover and returns focus to the trigger.
- Future rail and left-panel surfaces remain guarded. Files keeps MVP
  source-opening behavior; Directory Search, filters, palette, bookmarks, saved
  sets, recursive search, SSH, and file-manager behavior require separate
  specifications before becoming active product features.

## Validation Checklist

- Empty workspace matches the target topbar height and contains only the drop
  zone plus `Open Source`.
- Topbar search is compact and centered, with sync/add immediately to its right.
- No obsolete current-implementation buttons are visible.
- Activity rail is `40 px` wide and uses the target button order.
- Directory panes show both directory name and current file name.
- File panes show the file title and live dot spacing without overlap.
- Offset and search popovers appear in the pane where they were invoked.
- Pane resize is done by dragging boundaries, not by plus/minus buttons.
- The right edge of the rightmost pane aligns with the workspace edge when
  content does not overflow.
- Horizontal overflow appears only when panes exceed workspace width.
- Light and dark themes change the actual app UI, not only mockup chrome.
- macOS, Windows, Linux, and Web variants render distinct shell chrome.
- Search works over full file content and updates when new lines append.
- Time offset fields support days, hours, minutes, seconds, and milliseconds.
- Logs remain read-only and inert.
- UI passes no-overlap checks for topbar, pane headers, popovers, left panel,
  statusbar, and empty workspace.
