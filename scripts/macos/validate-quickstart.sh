#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

required_paths=(
  "pnpm-workspace.yaml"
  "package.json"
  "apps/web/package.json"
  "apps/desktop/package.json"
  "apps/desktop/src-tauri/Cargo.toml"
  "scripts/macos/build.sh"
  "scripts/macos/test.sh"
  "scripts/macos/test-ui.sh"
  "scripts/macos/perf.sh"
  "scripts/windows/build.ps1"
  "scripts/windows/test.ps1"
  "scripts/windows/test-ui.ps1"
  "scripts/windows/perf.ps1"
  "scripts/linux/build.sh"
  "scripts/linux/test.sh"
  "scripts/linux/test-ui.sh"
  "scripts/linux/perf.sh"
  "tests/fixtures/README.md"
)

for path in "${required_paths[@]}"; do
  if [ ! -e "$path" ]; then
    echo "Missing quickstart path: $path" >&2
    exit 1
  fi
done

required_scripts=(
  "dev:web"
  "dev:desktop"
  "build:web"
  "build:desktop"
  "lint"
  "test:unit"
  "test:integration"
  "test:ui:web"
  "test:ui:desktop"
  "bench"
)

for script_name in "${required_scripts[@]}"; do
  if ! node -e "const pkg = JSON.parse(require('fs').readFileSync('package.json', 'utf8')); process.exit(pkg.scripts && pkg.scripts['$script_name'] ? 0 : 1)"; then
    echo "Missing package script: $script_name" >&2
    exit 1
  fi
done

echo "Quickstart validation passed."
