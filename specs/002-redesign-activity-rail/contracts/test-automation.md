# Contract: Test Automation and CI/CD

## Local Current-OS Gate

The current development OS is macOS. Before a redesign phase is complete locally, these commands must pass when the phase touches the relevant area:

- `bash scripts/macos/test.sh`
- `bash scripts/macos/test-ui.sh`
- `bash scripts/macos/perf.sh` when performance-sensitive rendering, scrolling, search, or session behavior changes
- `bash scripts/macos/build.sh` before release readiness

`bash scripts/macos/test-ui.sh` must execute real Web UI tests and real macOS Desktop UI/E2E behavior. Validating that XCTest files exist is not sufficient.

## GitHub Actions Gate for Other OS Targets

GitHub Actions must validate supported OS targets that are not the local execution target. The workflow must include:

| OS | Automated tests | UI/E2E tests | Build |
|----|-----------------|--------------|-------|
| Windows | `pwsh scripts/windows/test.ps1` | `pwsh scripts/windows/test-ui.ps1` | `pwsh scripts/windows/build.ps1` |
| macOS | `bash scripts/macos/test.sh` | `bash scripts/macos/test-ui.sh` | `bash scripts/macos/build.sh` |
| Linux | `bash scripts/linux/test.sh` | `bash scripts/linux/test-ui.sh` | `bash scripts/linux/build.sh` |

Build jobs must depend on both automated tests and UI/E2E tests for their target OS.

## Test Reuse Rules

- Unit, integration, Rust adapter, and performance tests should be reused unless the redesign exposes a real requirement gap.
- Web UI tests should be updated for new topbar, rail, pane header, popover, workspace scrollbar, and status bar contracts.
- Desktop WDIO tests should mirror Web behavior where Tauri WebDriver is supported.
- macOS XCTest/Accessibility tests should cover the same user stories through native accessibility interactions.
- Expected results must remain requirement-derived and must not be rewritten to match broken implementation behavior.

## Required UI/E2E Coverage

- US1: redesigned multi-pane workspace, add/split/close/resize, workspace horizontal scroll, status bar.
- US2: topbar synchronization toggle, active pane, synchronized target movement, disabled sync, and per-pane offset application.
- US3: pane search popover from pane header, activity rail, or command field; text/regex/case modes; previous/next match; match count; invalid regex; per-pane search isolation.
- US4: directory title, selected file title, previous/next controls, empty-directory state, refresh behavior, deleted file, and same-name replacement behavior.
- US5: Time Offset popover, days/hours/minutes/seconds/milliseconds editing, valid apply, invalid input rejection, per-pane offset tag, and synchronization with the applied offset.
- US6: live indicator, appended lines, deleted status, retained loaded content, replacement behavior, log text copy, and pane-local errors.
- US7: restored redesigned workspace, pane order, pane sizes, selected directory file, no scroll restoration, browser capability boundaries, drag/drop entry points, and manual encoding flows.

## Selector Stability

- Prefer role and accessible-name selectors.
- Use `data-testid` for structural regions such as `crosslog-shell`, `topbar`, `activity-rail`, `pane-workspace`, `log-pane`, `pane-search-popover`, `time-offset-popover`, and `status-bar` where semantic roles are insufficient.
- Do not use brittle visual coordinates or screenshot-only checks as the primary assertion mechanism.
