#!/usr/bin/env bash
# sunucuyu ayaga kaldirir (arka planda, log dosyasina yazar)
cd "$(dirname "$0")/.."
export DB_PATH=${DB_PATH:-data/yalan.db}
export PORT=${PORT:-8787}
nohup node --env-file-if-exists=.env --env-file-if-exists=.env.local src/server/index.ts > /tmp/ym-server.log 2>&1 &
echo "pid=$!"
sleep 2
curl -s -m 3 "http://127.0.0.1:$PORT/api/health" || echo "health yok"
echo
tail -3 /tmp/ym-server.log
