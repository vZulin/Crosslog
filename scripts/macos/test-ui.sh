#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

mode="${1:-all}"

run_web_tests() {
  corepack pnpm test:ui:web
}

run_desktop_tests() {
  corepack pnpm test:ui:desktop
}

case "$mode" in
  all)
    run_web_tests
    run_desktop_tests
    ;;
  web)
    run_web_tests
    ;;
  desktop)
    run_desktop_tests
    ;;
  *)
    echo "Usage: $0 [all|web|desktop]" >&2
    exit 64
    ;;
esac
