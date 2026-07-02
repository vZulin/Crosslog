# Research: Crosslog Bug Batch 2 Stabilization

## Decision: Use the new stabilization spec as source of truth

**Rationale**: `specs/005-stabilize-bug-batch-2/spec.md` maps the 7-item batch in
`docs/Bugs_2.txt` to product requirements and supersedes prior specs only where a
bug says so. Several bugs are regressions of `specs/004-stabilize-bug-batch`.

**Alternatives considered**:

- Use current implementation behavior as truth: rejected — some tests may encode
  the regressed behavior and must be corrected to the authoritative expected
  result.
- Re-plan from the MVP: rejected — specs/001–004 remain the functional baseline.

## Decision: Keep the current architecture and add no dependency by default

**Rationale**: The fixes fit the existing boundaries — `packages/core` for shared
rules, `packages/ui` for shared React UI and theme CSS, `packages/platform` for
ports/adapters, thin Web/Desktop shells. The Tauri dialog plugin is already a
dependency, so bug 2 needs no new dependency.

**Alternatives considered**:

- Add a drag-drop or dialog library: rejected; existing ports and Tauri APIs are
  expected to be sufficient. If bug 3's native drag-drop cannot be reached without
  a dependency, implementation stops and requests approval (recorded in plan
  Complexity Tracking).

## Decision (Bug 1): Correct only the dark-theme token values

**Rationale**: Colors are CSS custom properties in one file,
`packages/ui/src/app-shell/activity-rail-theme.css` (`[data-theme="dark"]` block,
line 47+). The authoritative values come from
`docs/mockups/crosslog-macos-redesign-mockups.html` ("Screen / Draft Layout -
Activity Rail", dark variant `data-theme="dark"`), locked as THE source per the
2026-07-02 clarification; `specs/002-redesign-activity-rail/figma-audit.md` and
`specs/003-macos-ui-design-alignment/contracts/figma-design-deltas.md` are
secondary references only. Theme resolution in `shellPresentation.ts` and light
`:root` values are left untouched.

**Alternatives considered**: Introduce a JS token module — rejected as scope creep
and a new abstraction; the single CSS file is the established source of truth.

## Decision (Bug 2): Diagnose the Desktop picker regression on the Tauri path first

**Rationale**: `tauri_plugin_dialog::init()` is registered in
`apps/desktop/src-tauri/src/lib.rs`, and `TauriSourcePicker` calls the plugin's
`open()`. The regression is therefore most likely a missing dialog capability/
permission in `tauri.conf.json` / `gen/schemas/capabilities.json`, or a wiring
break between `AppShell` add-pane handlers and the port. Fix the actual broken
link rather than replacing the picker.

**Alternatives considered**: Reimplement picking via a Rust command — rejected;
the plugin path is already in place and in scope.

## Decision (Bug 3): Add a native Tauri drag-drop event path

**Rationale**: `tauri-drag-drop-source.ts` currently reads
`event.dataTransfer.files` from a DOM `DragEvent`, but Tauri delivers native
drag-drop through `getCurrentWebview().onDragDropEvent` / Rust events, and the
Rust side emits none today. The fix enables `dragDropEnabled`, adds the native
event path, and rewrites the adapter to consume native drop payloads while keeping
the `DragDropSourcePort` contract stable for the Web adapter.

**Alternatives considered**: Rely on the webview's DOM drop events — rejected;
Tauri intercepts native OS drops and does not surface them as usable DOM
`DragEvent.dataTransfer` file paths.

## Decision (Bug 4): Repair the Web directory-open flow behind existing ports

**Rationale**: `BrowserSourcePicker.pickDirectory()` sets `webkitdirectory`/
`directory` and `BrowserDirectoryAccess` lists files; the flow already exists.
Ensure the Web add-pane/open-source surface actually offers directory selection
and reports a capability limitation where the browser lacks support, per
`CapabilityReport`.

**Alternatives considered**: File System Access API adoption — rejected as scope
creep; reuse the existing directory-access port and capability reporting.

## Decision (Bug 5): Fix the hand-rolled viewport offset/transform

**Rationale**: `VirtualLogViewport.tsx` implements virtualization by hand (no
`@tanstack/react-virtual`). The defect is that the rendered slice offset/transform
does not follow the scroll position, so the scrollbar moves but text does not.
Recompute the visible line window and apply the offset transform from the live
scroll position; preserve sync propagation via `useSynchronizationStore`.

**Alternatives considered**: Swap in TanStack Virtual — rejected as a larger
change than the bug requires and a potential performance/behavior regression risk
against the existing benchmark.

## Decision (Bug 6): Make the header a drag origin, protect interactive controls

**Rationale**: In `PaneHeader.tsx`, pointer-down for reorder is bound only to the
drag-handle button. Bind the drag start to the header container and exclude
interactive controls (search, close, offset, directory navigation) so clicking a
control runs its action instead of starting a drag. `PaneRail.tsx` midpoint
threshold and order logic are preserved.

**Alternatives considered**: Keep the handle only and enlarge it — rejected; the
bug explicitly requires dragging from anywhere on the header.

## Decision (Bug 7): Fix icon centering in the shared CSS

**Rationale**: Hover zones and icon boxes are defined in
`activity-rail-theme.css` (`.crosslog-icon-button`, `.crosslog-activity-rail`,
`.crosslog-sync-toggle`, `.crosslog-pane-header__drag-handle`, search-popover
arrow controls). Center icons within their hover highlight zones and align icon
`viewBox`/box sizing in `icons.tsx` where the SVG is off-center.

**Alternatives considered**: Per-component inline styles — rejected; the shared
CSS is the established, testable surface.

## Decision: Test-migration rules

**Rationale**: Per constitution Test Integrity, expected results derive from the
spec and `docs/Bugs_2.txt`, not from current behavior. Existing valid tests stay
unchanged; tests that assert regressed behavior are updated to the authoritative
expected result; missing coverage is added (notably a Desktop drag-drop UI test,
which does not exist today). Every user scenario has a UI test, and OS-specific
Desktop behavior is tested on the corresponding OS.

## Decision (I1): Two test execution modes for non-automatable macOS scenarios

**Rationale**: Native OS-level drag-and-drop (Bug 3) cannot be reliably simulated
in XCTest/WebdriverIO on macOS. Per the 2026-07-02 clarification, the suite has an
automatic mode (default, CI-safe, automatable tests only) and a manual/interactive
mode invoked by a dedicated script that launches the app, prints ordered tester
actions, and captures a pass/fail confirmation. Default CI and pre-commit gates
run only the automatic mode; the manual mode is opt-in and never blocks gates.

**Alternatives considered**: Force a brittle automated native-drop simulation —
rejected as flaky; drop Bug 3 UI coverage entirely — rejected because the scenario
must be verifiable.

## Decision: Validation gates

**Rationale**: Before commit, run macOS `test.sh`, `test-ui.sh web`,
`test-ui.sh desktop` (plus `build.sh`/`perf.sh` when rendering/scroll is
affected). After push, monitor all required jobs in `.github/workflows/ci.yml`
until green. This matches the process used for `specs/004-stabilize-bug-batch`.
