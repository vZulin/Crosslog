#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."
bash scripts/linux/build-web.sh
bash scripts/linux/build-desktop.sh

