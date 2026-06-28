# Validation Log: macOS UI Design Alignment

This log records validation evidence for the design-alignment implementation.
It should contain only evidence for the current alignment pass and should not
restate the full 001 or 002 validation history.

## Phase 1: Setup Scaffolding

| Date | Scope | Command Or Evidence | Result | Notes |
| --- | --- | --- | --- | --- |
| 2026-06-28 | T001-T007 setup scaffolding | `corepack pnpm lint` | Pass | ESLint completed successfully for the updated TypeScript scaffolding. |
| 2026-06-28 | T001-T007 setup scaffolding | `bash scripts/macos/test.sh` | Pass | Lint passed; Vitest unit suites passed 41 files / 104 tests; integration suites passed 4 files / 5 tests; Rust tests passed 5 tests. |

## Phase 2: Foundational Presentation State And Test Bridge

| Date | Scope | Command Or Evidence | Result | Notes |
| --- | --- | --- | --- | --- |
| 2026-06-28 | T008-T018 foundational phase | `corepack pnpm vitest run packages/ui/tests/app-shell/shell-presentation.test.tsx packages/platform/tests/ports/ui-test-bridge-port.test.ts` | Pass | Shell presentation helper tests passed 4 tests; UI test bridge contract tests passed 2 tests. |
| 2026-06-28 | T008-T018 foundational phase | `corepack pnpm lint` | Pass | ESLint completed successfully after adding shell presentation helpers, app override parsing, icon coverage, and UI test bridge fields. |
| 2026-06-28 | T008-T018 foundational phase | `corepack pnpm test:unit` | Pass | Vitest unit suites passed 43 files / 110 tests. |
| 2026-06-28 | T008-T018 foundational phase | `bash scripts/macos/test.sh` | Pass | Lint passed; Vitest unit suites passed 43 files / 110 tests; integration suites passed 4 files / 5 tests; Rust tests passed 5 tests. |
| 2026-06-28 | T013-T014 app entrypoint overrides | `corepack pnpm --filter @crosslog/web build` and `corepack pnpm --filter @crosslog/desktop build` | Pass | Vite production builds completed for the Web and Desktop shells after presentation override parsing was wired. |

## Future Evidence Slots

- US1 gate: `bash scripts/macos/test.sh` and `bash scripts/macos/test-ui.sh`.
- US2 gate: `bash scripts/macos/test.sh`, `bash scripts/macos/test-ui.sh`,
  and `bash scripts/macos/perf.sh`.
- US3 gate: `bash scripts/macos/test.sh` and `bash scripts/macos/test-ui.sh`.
- US4 shared implementation gate: `bash scripts/macos/test.sh` and
  `bash scripts/macos/test-ui.sh`.
- Release readiness: Windows, macOS, and Linux automated/UI/build GitHub
  Actions evidence.
- Timed empty-workspace review: reviewer role, empty-workspace start condition,
  viewport/platform, 5-second result, and pass/fail outcome.
