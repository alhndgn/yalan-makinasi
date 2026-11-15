#!/usr/bin/env bash
# API anahtarını .env.local'a yazar. Girdi ekranda GÖRÜNMEZ, geçmişe düşmez.
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .env.local ] || cp .env.local.example .env.local

printf 'opencode-go API anahtarını yapıştır (ekranda görünmez, Enter ile bitir): '
IFS= read -rs KEY
echo
[ -n "${KEY:-}" ] || { echo "Boş girdin, iptal."; exit 1; }

tmp=$(mktemp)
while IFS= read -r line; do
  case "$line" in
    VITE_AI_KEY=*) echo "VITE_AI_KEY=$KEY" ;;
    AI_KEY=*)      echo "AI_KEY=$KEY" ;;
    *)             echo "$line" ;;
  esac
done < .env.local > "$tmp"
mv "$tmp" .env.local
chmod 600 .env.local 2>/dev/null || true

echo "Yazıldı. Kontrol:"
bash scripts/ai-key-check.sh
