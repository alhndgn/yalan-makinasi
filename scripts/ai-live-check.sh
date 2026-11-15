#!/usr/bin/env bash
# Web proxy'sini gerçek sağlayıcıya karşı dener. Anahtarı yazdırmaz.
set -uo pipefail
cd "$(dirname "$0")/.."

PORT=${PORT:-8787}
BASE="http://127.0.0.1:$PORT"

echo "== sağlık"
curl -s -m 10 "$BASE/api/health" || { echo "sunucu kapalı → bash scripts/serve.sh"; exit 1; }
echo

echo "== AI proxy (şiddet 8)"
curl -s -m 60 -X POST "$BASE/api/ai/chat" \
  -H 'content-type: application/json' \
  -H 'x-device-id: 11111111-1111-4111-8111-111111111111' \
  -d '{"model":"deepseek-v4.1-flash","temperature":0.9,"max_tokens":1200,"messages":[{"role":"system","content":"Sen Türkçe yazan bir kıvırma asistanısın. Sadece JSON döndür: {\"variants\":[{\"text\":\"\",\"strategy\":\"sade\",\"riskScore\":0,\"riskLevel\":\"dusuk\",\"riskReasons\":[],\"queries\":[{\"q\":\"\",\"a\":\"\"}]}]}"},{"role":"user","content":"{\"target\":\"patron\",\"situation\":\"gec_kaldim\",\"channel\":\"whatsapp\",\"style\":\"ciddi\",\"intensity\":8}"}]}' \
  | head -c 1200
echo
