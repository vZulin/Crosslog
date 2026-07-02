# Data Model: Crosslog Bug Batch 2 Stabilization

This data model describes only the state needed to stabilize the 7-item bug batch.
It adds no new source types, remote access, recursive directory search, filtering,
bookmarks, saved sets, file-manager behavior, parser models, or backend services.

## Entity: BugBatch

Fields:

- `sourceDocument`: `/Users/Vladimir.Zulin/projects/idea/Crosslog/docs/Bugs_2.txt`.
- `items`: numbered bugs 1 through 7.
- `expectedResults`: authoritative expected behavior for each item.

Validation rules:

- Every bug item maps to requirements, planned work, and at least one test.
- Behavior outside this batch and prior specs remains unchanged.

## Entity: SourceOpeningRequest

Fields:

- `entryPoint`: Desktop add-pane/open-source, Web add-pane/open-source, Desktop
  drag-and-drop, or test-helper setup.
- `platform`: `web` or `desktop`.
- `kind`: `file` or `directory`.
- `selectionState`: `notStarted`, `selecting`, `selected`, `cancelled`, or
  `unsupported`.
- `selectedSources`: zero or more user-selected file or directory references.

Relationships:

- Uses `SourcePickerPort`, `DirectoryAccessPort`, `DragDropSourcePort`, and
  `FileAccessPort`.
- Creates `LogPane` instances only for user-selected or dropped supported sources.

Validation rules:

- Desktop add-pane/open-source must open the native picker (Bug 2).
- Cancellation leaves the workspace unchanged (Bug 2).
- Desktop drops of supported files/directories open panes; unsupported drops do
  not (Bug 3).
- Web must allow both file and directory opening (Bug 4).
- Unsupported platform interactions are reported via `CapabilityReport`, not
  failed silently (FR-009).

## Entity: LogViewportScrollState

Fields:

- `scrollTop`: current vertical scroll position.
- `renderedLineWindow`: first/last rendered line indices.
- `contentOffset`: transform/offset applied to the rendered slice.
- `totalLoadedLines`: total loaded lines in the pane.

Relationships:

- Owned by `VirtualLogViewport`; participates in synchronization via
  `useSynchronizationStore` when sync is enabled.

Validation rules:

- `renderedLineWindow` and `contentOffset` must be derived from `scrollTop` so
  rendered text advances with the scrollbar (Bug 5, FR-010).
- The first line (scrollTop min) and the last loaded line (scrollTop max) must be
  reachable (FR-011).
- Sync propagation semantics from prior specs are preserved (FR-012).

## Entity: PaneReorderInteraction

Fields:

- `dragOrigin`: `headerRegion` or `dragHandle`.
- `isInteractiveControl`: whether the pointer-down target is a header control
  (search, close, offset, directory navigation).
- `dragState`: `idle`, `dragging`, `dropped`, or `cancelled`.
- `targetIndex`: computed drop index using the existing midpoint threshold.

Relationships:

- Started in `PaneHeader`; resolved in `PaneRail`.

Validation rules:

- A drag may start from any non-control header region (Bug 6, FR-013).
- Interactive controls run their own action and never start a drag (FR-015).
- Midpoint threshold and intervening-pane order are preserved (FR-014).

## Entity: ThemePresentation

Fields:

- `variant`: `system`, `light`, or `dark` (resolution unchanged from specs/004).
- `darkTokens`: the `[data-theme="dark"]` CSS custom-property values.
- `authoritativeMockupValues`: the dark values from the design audits.

Validation rules:

- `darkTokens` must equal `authoritativeMockupValues` (Bug 1, FR-016).
- Light tokens and resolution logic remain unchanged (FR-017).

## Entity: IconHoverZone

Fields:

- `control`: sync toggle, add-pane, close-pane, activity-rail icon, or
  search-popover arrow.
- `iconBounds`: the rendered icon bounding box.
- `hoverZoneBounds`: the highlight region shown on pointer-over.

Validation rules:

- `iconBounds` must be centered within `hoverZoneBounds` for every covered control
  (Bug 7, FR-018).
- Controls stay accessible and non-overlapping across covered viewports (FR-019).

## Entity: TestCoverageMap

Fields:

- `bugItem`: a numbered bug from `docs/Bugs_2.txt`.
- `existingTests`, `updatedTests`, `newTests`: the mapped automated and UI/E2E
  tests.

Validation rules:

- Each bug maps to at least one executed test at the appropriate level.
- Expected results derive from the spec and bug report, not current behavior.
