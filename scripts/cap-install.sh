#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm install --no-fund --no-audit @capacitor/core @capacitor/android
npm install --no-fund --no-audit --save-dev @capacitor/cli
