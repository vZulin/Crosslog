#!/usr/bin/env bash
#
# Manual / interactive UI test runner (macOS).
#
# Native OS drag-and-drop (Bug 3) cannot be reliably simulated by WebdriverIO or
# XCTest on macOS, so this opt-in runner launches the real Desktop app, prints
# the ordered actions a tester must perform, and records a pass/fail result.
#
# This runner is NEVER invoked by CI or by the default local gates
# (scripts/macos/test.sh, scripts/macos/test-ui.sh). Run it by hand:
#
#   bash scripts/macos/test-ui-manual.sh
#
set -euo pipefail

cd "$(dirname "$0")/../.."

if [ "${CI:-}" = "true" ]; then
  echo "test-ui-manual.sh is interactive and must not run in CI." >&2
  exit 64
fi

command -v corepack >/dev/null || {
  echo "corepack is required to run the pinned pnpm package manager." >&2
  exit 127
}

if [ -f "$HOME/.cargo/env" ]; then
  . "$HOME/.cargo/env"
fi

echo "Launching the Crosslog Desktop app (Tauri dev). First launch compiles Rust and may take a few minutes..."
corepack pnpm --filter @crosslog/desktop tauri dev &
APP_PID=$!

cleanup() {
  if kill -0 "$APP_PID" 2>/dev/null; then
    echo "Stopping the Desktop app (pid $APP_PID)..."
    kill "$APP_PID" 2>/dev/null || true
    wait "$APP_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

RESULT=0

confirm_step() {
  local title="$1"
  shift
  echo ""
  echo "======================================================================"
  echo "MANUAL CHECK: $title"
  echo "----------------------------------------------------------------------"
  local step_number=1
  for action in "$@"; do
    echo "  ${step_number}. ${action}"
    step_number=$((step_number + 1))
  done
  echo "----------------------------------------------------------------------"
  local answer=""
  while true; do
    read -r -p "Did this behave as expected? [y/N] " answer || answer="n"
    case "$answer" in
      [yY]) echo "PASS: $title"; return 0 ;;
      [nN]|"") echo "FAIL: $title"; RESULT=1; return 0 ;;
      *) echo "Please answer y or n." ;;
    esac
  done
}

echo ""
echo "Wait until the Crosslog window is visible before answering the prompts."
read -r -p "Press Enter once the app window is open and ready... " _

confirm_step "Bug 2 — native file/directory picker opens" \
  "Click 'Open Source' (or 'Add pane / Open source')." \
  "Confirm the native macOS file dialog opens." \
  "Select a single log file and confirm it opens in a new pane." \
  "Open the picker again, select a directory, and confirm its newest file opens in a pane." \
  "Open the picker again and press Cancel; confirm nothing changes."

confirm_step "Bug 3 — native drag-and-drop of a file" \
  "From Finder, drag a single .log file onto the Crosslog window." \
  "Confirm a new pane opens showing that file's contents."

confirm_step "Bug 3 — native drag-and-drop of a directory" \
  "From Finder, drag a directory that contains log files onto the Crosslog window." \
  "Confirm a directory pane opens with the directory's newest file selected."

echo ""
if [ "$RESULT" -eq 0 ]; then
  echo "All manual checks PASSED."
else
  echo "One or more manual checks FAILED."
fi

exit "$RESULT"
