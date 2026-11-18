#!/usr/bin/env bash
# Android paketleri: cihaz içi motor (VITE_LOCAL_ENGINE=1) ile web build + APK + AAB.
# Sunucu modunda derlersen APK'da /api istekleri 404 döner ve kayıtlar sessizce kaybolur.
set -euo pipefail
cd "$(dirname "$0")/.."
source /c/dev/flutter-env.sh >/dev/null 2>&1 || true

DEST=${DEST:-/c/Users/alhndgn/Desktop/yalan-makinasi-apk}
VERSION=$(node -p "require('./package.json').version")

echo "==> web build (VITE_LOCAL_ENGINE=1)"
VITE_LOCAL_ENGINE=1 npx vite build 2>&1 | tail -4

echo "==> capacitor sync"
npx cap sync android 2>&1 | tail -3

echo "==> gradle assembleDebug + bundleRelease"
( cd android && ./gradlew assembleDebug bundleRelease --console=plain 2>&1 | tail -5 )

mkdir -p "$DEST"
cp android/app/build/outputs/apk/debug/app-debug.apk "$DEST/yalan-makinasi-$VERSION.apk"
cp android/app/build/outputs/bundle/release/app-release.aab "$DEST/yalan-makinasi-$VERSION.aab"
cd "$DEST"
sha256sum "yalan-makinasi-$VERSION.apk" "yalan-makinasi-$VERSION.aab" | awk '{print substr($1,1,16), $2}'
ls -lh "yalan-makinasi-$VERSION.apk" "yalan-makinasi-$VERSION.aab" | awk '{print $5, $9}'
