# Contract: Build and Test Scripts

Every script must be runnable from the repository root and must exit non-zero on
failure.

## Windows

- `pwsh scripts/windows/build.ps1`: build Web and Desktop artifacts.
- `pwsh scripts/windows/build-web.ps1`: build Web artifact only.
- `pwsh scripts/windows/build-desktop.ps1`: build Desktop artifact only.
- `pwsh scripts/windows/test.ps1`: run lint, TypeScript unit/integration tests,
  Rust adapter tests, and non-UI performance checks required for the phase.
- `pwsh scripts/windows/test-ui.ps1`: run Web UI tests and Windows Desktop UI
  tests.
- `pwsh scripts/windows/perf.ps1`: run performance benchmarks.

## macOS

- `bash scripts/macos/build.sh`: build Web and Desktop artifacts.
- `bash scripts/macos/build-web.sh`: build Web artifact only.
- `bash scripts/macos/build-desktop.sh`: build Desktop artifact only.
- `bash scripts/macos/test.sh`: run lint, TypeScript unit/integration tests,
  Rust adapter tests, and non-UI performance checks required for the phase.
- `bash scripts/macos/test-ui.sh`: run Web UI tests and macOS Desktop UI tests
  through the macOS XCTest/Accessibility harness.
- `bash scripts/macos/perf.sh`: run performance benchmarks.

## Linux

- `bash scripts/linux/build.sh`: build Web and Desktop artifacts.
- `bash scripts/linux/build-web.sh`: build Web artifact only.
- `bash scripts/linux/build-desktop.sh`: build Desktop artifact only.
- `bash scripts/linux/test.sh`: run lint, TypeScript unit/integration tests,
  Rust adapter tests, and non-UI performance checks required for the phase.
- `bash scripts/linux/test-ui.sh`: run Web UI tests and Linux Desktop UI tests.
- `bash scripts/linux/perf.sh`: run performance benchmarks.

## Phase Completion Rule

A development phase is complete only after the phase-required scripts pass on the
corresponding target OS. Expected test results must remain tied to requirements,
not changed to fit actual implementation behavior.
