#!/usr/bin/env bash
# .env.local içindeki anahtarların varlığını, DEĞERİNİ YAZDIRMADAN kontrol eder.
cd "$(dirname "$0")/.."
f=.env.local
[ -f "$f" ] || { echo "DOSYA YOK: $f"; exit 1; }

get() { grep -E "^$1=" "$f" | head -1 | cut -d= -f2- | tr -d '\r' | xargs; }

URL=$(get VITE_AI_BASE_URL); MODEL=$(get VITE_AI_MODEL); K1=$(get VITE_AI_KEY)
SURL=$(get AI_BASE_URL);     SMODEL=$(get AI_MODEL);     K2=$(get AI_KEY)

echo "APK (gömülü) : ${URL:-YOK}  ·  ${MODEL:-YOK}"
echo "Web (proxy)   : ${SURL:-YOK}  ·  ${SMODEL:-YOK}"

show() {
  local name="$1" key="$2"
  if [ -z "$key" ]; then echo "$name: BOS"; return 1; fi
  echo "$name: VAR (${#key} karakter, ${key:0:4}…${key: -2})"
}

show "anahtar VITE_AI_KEY" "$K1"; a=$?
show "anahtar AI_KEY" "$K2"; b=$?
[ $a -eq 0 ] && [ $b -eq 0 ] && exit 0 || exit 2
