# Icon Strategy: Local Reviewed SVG Module

**Feature**: Crosslog Activity Rail Redesign  
**Decision**: Use a local reviewed SVG icon module for the Activity Rail shell.

## Recommendation

Implement icons in `packages/ui/src/app-shell/icons.tsx` as small React SVG
components owned by the Crosslog UI package. Do not add `lucide-react` or a UI
kit for this redesign phase.

## Why Local SVG Is Preferred

- The Figma frame uses a compact and specific icon set: topbar sync/add, command
  search, rail actions, pane close/search/navigation, file/folder, live dot,
  search navigation, and time offset.
- The icon set is small enough that a dependency adds more maintenance and
  visual-matching risk than it removes.
- Local SVGs can use `currentColor`, inherited sizing, and accessible wrapper
  semantics from the future `IconButton` primitive.
- Figma MCP asset URLs are short-lived and must not be runtime dependencies.
- Keeping icons in one reviewed module prevents ad hoc SVG copies across pane,
  rail, and popover components.

## Required Icons

Topbar:

- `CommandSearchIcon`
- `SyncIcon`
- `AddPaneIcon`

Activity rail:

- `SearchIcon`
- `FilterIcon`
- `PaletteIcon`
- `FilesIcon`
- `BookmarkIcon`
- `SettingsIcon`

Pane header:

- `CloseIcon`
- `FindIcon`
- `FileIcon`
- `FolderIcon`
- `PreviousIcon`
- `NextIcon`
- `LiveDotIcon`

Popovers:

- `TimeOffsetIcon`
- `SearchPreviousIcon`
- `SearchNextIcon`

## Accessibility Rules

- SVG components are decorative by default and must render with `aria-hidden`.
- Accessible names belong on the owning button, input, tag button, or control.
- Disabled future-action icons must remain understandable through control labels
  and unavailable state, not through color alone.
- Icons must not be the only indicator for active synchronization, active pane,
  errors, or unsupported capabilities.

## Rejected Alternatives

| Alternative | Reason rejected |
| --- | --- |
| `lucide-react` | Good general-purpose library, but the required set is small and Figma-specific. Adding it now increases dependency surface without clear value. |
| Full UI kit | Would impose unrelated layout, density, and interaction conventions on a custom log-analysis workspace. |
| Figma MCP asset URLs at runtime | URLs are tool outputs, short-lived, and unsuitable as application assets. |
| Scattered hand-written SVGs | Harder to review, harder to keep visually consistent, and more likely to drift from accessibility rules. |
| Raster icons | Poor scaling and theming, and less suitable for accessible icon buttons. |

## Implementation Notes

- Keep the module dependency-free.
- Use `width="1em"` and `height="1em"` unless a specific viewBox requires
  another default.
- Keep strokes and fills tied to `currentColor` where possible.
- Export icons by semantic name, not by Figma layer name.
- Add icon-button accessibility tests before wiring icons into the shell.

