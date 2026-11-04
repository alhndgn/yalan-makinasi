#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build 2>&1 | tail -15
