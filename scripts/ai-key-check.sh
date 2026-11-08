#!/usr/bin/env bash
# .env.local içindeki anahtarın varlığını, değerini YAZDIRMADAN kontrol eder.
cd "$(dirname "$0")/.."
FILE=.env.local
if [ ! -f "$FILE" ]; then echo "DOSYA YOK: $FILE"; exit 1; fi
KEY=$(grep -E '^VITE_AI_KEY=' "$FILE" | head -1 | cut -d= -f2- | tr -d '\r' | xargs)
URL=$(grep -E '^VITE_AI_BASE_URL=' "$FILE" | head -1 | cut -d= -f2- | xargs)
MODEL=$(grep -E '^VITE_AI_MODEL=' "$FILE" | head -1 | cut -d= -f2- | xargs)
echo "adres : ${URL:-YOK}"
echo "model : ${MODEL:-YOK}"
if [ -z "$KEY" ]; then
  echo "anahtar: BOS  → Ayarlar gizli, şablon motoru kullanılır"
  exit 2
fi
echo "anahtar: VAR (${#KEY} karakter, ${KEY:0:3}…${KEY: -2})"
