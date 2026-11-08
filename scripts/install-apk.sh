#!/usr/bin/env bash
# USB ile bağlı Android cihaza APK kurar.
set -euo pipefail
cd "$(dirname "$0")/.."
source /c/dev/flutter-env.sh >/dev/null 2>&1 || true

APK=${1:-/c/Users/alhndgn/Desktop/yalan-makinasi-apk/yalan-makinasi-0.1.0.apk}

echo "==> cihazlar"
adb devices -l

COUNT=$(adb devices | awk 'NR>1 && $2=="device"' | wc -l | tr -d ' ')
if [ "$COUNT" = "0" ]; then
  echo "!! Bağlı/yetkili cihaz yok."
  echo "   - USB hata ayıklama açık mı?"
  echo "   - Telefonda 'USB hata ayıklamasına izin ver' uyarısını onayladın mı?"
  echo "   - Kablo veri kablosu mu (sadece şarj değil)?"
  adb devices | awk 'NR>1 && $2!="" {print "   durum:", $0}'
  exit 1
fi

echo "==> kuruluyor: $APK"
adb install -r "$APK"
echo "==> uygulamayı başlat"
adb shell monkey -p com.teqstudio.yalan -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 || true
echo "bitti."
