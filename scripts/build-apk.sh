#!/usr/bin/env bash
# Çevrimdışı (cihaz içi motor) web build + Android APK
set -euo pipefail
cd "$(dirname "$0")/.."
source /c/dev/flutter-env.sh >/dev/null 2>&1 || true

echo "==> web build (VITE_LOCAL_ENGINE=1)"
VITE_LOCAL_ENGINE=1 npx vite build 2>&1 | tail -6

echo "==> capacitor sync"
npx cap sync android 2>&1 | tail -6

echo "==> gradle assembleDebug"
cd android
./gradlew assembleDebug --console=plain 2>&1 | tail -20
cd ..
ls -lh android/app/build/outputs/apk/debug/*.apk
