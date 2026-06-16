# Crosslog Development

Crosslog is a shared Web/Desktop log analysis workspace. Keep business logic in
`packages/core`, reusable React UI in `packages/ui`, and platform-specific
behavior behind explicit ports in `packages/platform`.

## Local Setup

```bash
pnpm install
```

Required local tools:

- Node.js active LTS.
- pnpm through Corepack.
- Rust stable for Tauri adapter tests and Desktop builds.
- Playwright browser dependencies for Web UI tests.
- Platform Desktop prerequisites for the current OS.

## Core Commands

```bash
corepack pnpm lint
corepack pnpm test:unit
corepack pnpm test:integration
corepack pnpm test:ui:web
corepack pnpm test:ui:desktop
corepack pnpm bench
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml
```

## OS Wrappers

Use the wrapper scripts from the repository root:

```bash
bash scripts/macos/build.sh
bash scripts/macos/test.sh
bash scripts/macos/test-ui.sh
bash scripts/macos/perf.sh

bash scripts/linux/build.sh
bash scripts/linux/test.sh
bash scripts/linux/test-ui.sh
bash scripts/linux/perf.sh

pwsh scripts/windows/build.ps1
pwsh scripts/windows/test.ps1
pwsh scripts/windows/test-ui.ps1
pwsh scripts/windows/perf.ps1
```

Run Windows and Linux Desktop UI wrappers on their target operating systems
before release readiness. macOS validation can only prove the macOS script path.

## Release Readiness

Before marking release tasks complete:

- Validate quickstart structure with `bash scripts/macos/validate-quickstart.sh`.
- Run build, automated test, UI test, and performance wrappers on the target OS.
- Keep log fixtures deterministic and read-only.
- Ensure log content is rendered as inert text and never interpreted as HTML,
  commands, links, or terminal control sequences.
- Do not change expected test results to match broken behavior.

## Security Rules

- Opened logs are read-only inputs.
- Session state is stored outside opened log paths.
- Renderer code must use text rendering for log content.
- Platform adapters must report unsupported capabilities instead of simulating
  unavailable filesystem monitoring.
