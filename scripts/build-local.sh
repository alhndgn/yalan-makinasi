#!/usr/bin/env bash
# Cihaz içi (offline) web build — APK ile aynı çıktı
set -euo pipefail
cd "$(dirname "$0")/.."
VITE_LOCAL_ENGINE=1 npx vite build 2>&1 | tail -6
