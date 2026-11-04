#!/usr/bin/env bash
# sunucuyu baslat, health'i dogrula, kapat
cd "$(dirname "$0")/.."
PORT=${PORT:-8787}
node src/server/index.ts >/tmp/ym-server.log 2>&1 &
PID=$!
for i in $(seq 1 20); do
  sleep 0.5
  if curl -s -m 2 "http://127.0.0.1:$PORT/api/health" >/tmp/ym-health.json; then break; fi
done
echo "--- health:"; cat /tmp/ym-health.json; echo
echo "--- log:"; tail -3 /tmp/ym-server.log
kill $PID 2>/dev/null
wait $PID 2>/dev/null
