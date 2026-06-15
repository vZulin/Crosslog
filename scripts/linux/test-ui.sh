#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."
corepack pnpm test:ui:web
corepack pnpm test:ui:desktop

