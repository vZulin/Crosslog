#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

mode="${1:-all}"

run_web_tests() {
  corepack pnpm test:ui:web
}

run_desktop_tests() {
  if [[ -n "${DISPLAY:-}" ]]; then
    NO_AT_BRIDGE="${NO_AT_BRIDGE:-1}" corepack pnpm test:ui:desktop
    return
  fi

  if command -v dbus-run-session >/dev/null 2>&1; then
    NO_AT_BRIDGE="${NO_AT_BRIDGE:-1}" dbus-run-session -- \
      xvfb-run -a --server-args="-screen 0 1280x960x24" corepack pnpm test:ui:desktop
    return
  fi

  NO_AT_BRIDGE="${NO_AT_BRIDGE:-1}" \
    xvfb-run -a --server-args="-screen 0 1280x960x24" corepack pnpm test:ui:desktop
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
