#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."
bash scripts/macos/build-web.sh
bash scripts/macos/build-desktop.sh

