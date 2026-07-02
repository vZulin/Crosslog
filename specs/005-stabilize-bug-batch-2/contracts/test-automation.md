# Test Automation Contract: Crosslog Bug Batch 2 Stabilization

Maps each bug to required test levels and target platforms. Expected results
derive from the spec and `docs/Bugs_2.txt`, never from current behavior.

## Levels And Tooling

- Unit/component/contract: Vitest (`packages/**/tests`, `tests/integration`).
- Rust adapters: cargo test (`apps/desktop/src-tauri`).
- Web UI/E2E: Playwright (`apps/web/tests/ui`).
- Desktop UI/E2E: WebdriverIO/tauri-driver (`apps/desktop/tests/ui`).
- macOS Desktop UI: XCTest (`apps/desktop/tests/ui/macos`).

## Required Coverage By Bug

| Bug | Unit/Component | Web Playwright | Desktop WDIO | macOS XCTest |
| --- | --- | --- | --- | --- |
| 1 Dark theme | `theme-variants.test.tsx` dark token values | `settings-theme.spec.ts` (regression) | `settings-theme.spec.ts` dark colors | `SettingsThemeUITests.swift` dark colors |
| 2 Desktop picker | `tauri-source-picker.test.ts` | n/a (Web uses browser picker) | `source-loading.spec.ts` open/cancel/select | source-loading picker (add if user-visible) |
| 3 Desktop drag-drop | `tauri-drag-drop-source.test.ts` native payload | `browser-drag-drop.spec.ts` (regression) | new desktop drag-drop spec | new drop coverage |
| 4 Web directory | `browser-source-picker.test.ts`, `browser-directory-access.test.ts`, `directory-access.contract.test.ts` | `directory-navigation.spec.ts`, `browser-capabilities.spec.ts` | n/a | n/a |
| 5 Vertical scroll | `virtual-log-viewport.test.tsx` + `log-pane-virtualization.bench.ts` gate | `synchronized-scrolling.spec.ts` | `synchronized-scrolling.spec.ts` | `SynchronizedScrollingUITests.swift` |
| 6 Header reorder | `pane-layout.test.tsx`, pane-header unit tests | `multi-pane-layout.spec.ts` | `multi-pane-layout.spec.ts` | `MultiPaneLayoutUITests.swift` |
| 7 Icon centering | `icon-button-accessibility.test.tsx`, `pane-search-popover.test.tsx`, `redesigned-sync-controls.test.tsx` | `redesigned-shell-viewports.spec.ts` | `redesigned-shell-viewports.spec.ts` | `RedesignedShellViewportUITests.swift` |

## Dual Execution Modes (FR-028)

- **Automatic mode (default)**: only automatable tests; run by the OS test/test-ui
  scripts and by CI. Bug 3's automatable portions (adapter payload mapping,
  capability wiring) live here.
- **Manual/interactive mode (opt-in)**: a dedicated macOS script that launches the
  Desktop app, prints ordered tester actions for the native drag-drop, and waits
  for pass/fail confirmation. Never runs in CI or blocks automatic gates.

## Cross-Cutting Assertions

- Accessibility: role/name/state for changed controls (picker triggers, drop
  target, reorder handle affordance, icons).
- Viewport no-overlap for changed surfaces at compact/standard/wide desktop.
- Icon bounding-box centering within the hover zone (Bug 7).
- Capability reporting is asserted where a platform lacks a source interaction.

## Local Gates Before Commit (macOS)

```bash
bash scripts/macos/test.sh
bash scripts/macos/test-ui.sh web
bash scripts/macos/test-ui.sh desktop
# plus build.sh / perf.sh when rendering/scroll is affected
```

## CI/CD Gates After Push

All required jobs in `.github/workflows/ci.yml` must be green: `automated-tests`
(linux, macos, windows-js, windows-rust), `ui-tests` (linux-web, linux-desktop,
macos-web, macos-desktop, windows-web), `windows-desktop-ui-tests`
(layout/pane-tools/lifecycle shards), `build-web`, and `build-desktop`
(linux/macos/windows).
