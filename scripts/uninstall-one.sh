#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm uninstall "$1" --no-fund --no-audit
