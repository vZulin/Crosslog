# Test Reuse Audit: macOS UI Design Alignment

This audit is the Phase 5 delta over
`specs/002-redesign-activity-rail/test-reuse-audit.md`. It records how the
existing MVP behavioral coverage remains valuable after the aligned shell,
obsolete-control removal, and pane workspace updates.

## Reused Unchanged

| Area | Files | Reason |
| --- | --- | --- |
| Core log/session behavior | `packages/core/tests/**` | Pane reducers, session serialization, search, sync, offsets, encoding, directory navigation, and lifecycle rules are unchanged. |
| Platform ports and adapters | `packages/platform/tests/**` except UI test bridge contract additions; Rust adapter tests | File access, directory access, capabilities, session stores, and watcher contracts keep the same product behavior. |
| Integration safety | `tests/integration/**` | Opened logs remain read-only input and rendered as inert text. |
| Performance benchmarks | `tests/performance/**` | Existing source opening, rendering, search, sync, session, directory, live append, and memory pressure scenarios remain valid. |

## Selector Or Bridge Updated

| Coverage | Files | Update |
| --- | --- | --- |
| Web session restore | `apps/web/tests/ui/session-restore.spec.ts` | Keeps pane/session assertions and adds aligned shell plus obsolete-control absence checks. |
| Desktop session restore | `apps/desktop/tests/ui/session-restore.spec.ts`, `apps/desktop/tests/ui/macos/SessionRestoreUITests.swift` | Keeps restored pane order, selected directory file, offset, sync, and width assertions; uses aligned shell selectors and shell-state publication. |
| Browser monitoring limitation | `apps/web/tests/ui/unsupported-monitoring.spec.ts`, `apps/web/tests/ui/browser-capabilities.spec.ts` | Keeps browser capability messaging and verifies old lifecycle action buttons are absent. |
| Desktop live file lifecycle | `apps/desktop/tests/ui/live-file-updates.spec.ts`, `apps/desktop/tests/ui/macos/LiveFileStateUITests.swift` | Replaces visible lifecycle buttons with UI test bridge actions while preserving append, delete, replacement, retained-content, and search assertions. |
| Web and Desktop copy behavior | `apps/web/tests/ui/log-text-copy.spec.ts`, `apps/desktop/tests/ui/log-text-copy.spec.ts`, `apps/desktop/tests/ui/macos/LogTextCopyUITests.swift` | Removes permanent Copy toolbar expectations; keeps context-menu, keyboard/test-bridge copy, copied-state, and inert text behavior. |
| Directory refresh and empty-directory setup | `apps/web/tests/ui/directory-navigation.spec.ts`, `apps/web/tests/ui/empty-directory.spec.ts`, Desktop equivalents | Moves test-only source setup to the UI test bridge instead of hidden DOM action buttons. |

## New Or Tightened Guardrails

| Guardrail | Evidence |
| --- | --- |
| Product-visible obsolete controls stay absent | Component, Web, WDIO, and macOS tests assert `obsolete=absent` or absence of obsolete test IDs/classes. |
| Hidden test-action DOM controls are not product escape hatches | `AppShell` no longer renders hidden lifecycle/source action buttons; UI tests enqueue lifecycle/source setup through the bridge. |
| UI test bridge action contract is explicit | `packages/platform/src/ports/ui-test-bridge-port.ts` defines the action whitelist and shared shell-state formatter; contract tests cover lifecycle/source actions and unsupported action rejection. |
| Browser and Desktop capability messaging remains presentation-only | Browser limitation text remains in the shell capability region; no action buttons or new file-watching behavior are exposed. |
| Directory Search remains future-scoped | Existing Activity Rail and obsolete-control tests keep the left panel absent or unavailable; no directory-wide search behavior was added. |

## No New Product Capability

Phase 5 did not add source types, recursive search, filters, bookmarks,
file-manager operations, SSH, parser behavior, or UI preferences. Lifecycle,
directory refresh, empty-directory setup, and copy simulation are test-only
operations exposed through the UI test bridge so MVP behavior can remain covered
after obsolete product controls are removed.
