#!/usr/bin/env bash
# Everything VM (192.168.1.12) üzerinde Ollama'yı LAN'a açar ve /ai proxy'sini kurar.
# Kullanım (VM'de root):  bash everything-ai-setup.sh [model]
set -euo pipefail

MODEL="${1:-qwen2.5:14b-instruct-q4_K_M}"
LAN_CIDR="${LAN_CIDR:-192.168.1.0/24}"

echo "==> 1/5 Ollama LAN'a dinletiliyor"
mkdir -p /etc/systemd/system/ollama.service.d
cat > /etc/systemd/system/ollama.service.d/override.conf <<'EOF'
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_ORIGINS=*"
Environment="OLLAMA_KEEP_ALIVE=30m"
EOF
systemctl daemon-reload
systemctl restart ollama
sleep 2

echo "==> 2/5 Model çekiliyor: $MODEL"
ollama pull "$MODEL"
ollama list | head -5

echo "==> 3/5 nginx /ai proxy"
cat > /etc/nginx/sites-available/yalan-ai <<'EOF'
# Yalan Makinası -> Ollama (OpenAI uyumlu). Uygulama baseUrl: http://192.168.1.12/ai/v1
server {
    listen 80;
    server_name 192.168.1.12;

    client_max_body_size 4m;

    location /ai/ {
        proxy_pass http://127.0.0.1:11434/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_read_timeout 300s;

        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Headers "authorization, content-type" always;
        add_header Access-Control-Allow-Methods "POST, GET, OPTIONS" always;
        if ($request_method = OPTIONS) { return 204; }
    }
}
EOF
ln -sf /etc/nginx/sites-available/yalan-ai /etc/nginx/sites-enabled/yalan-ai
nginx -t
systemctl reload nginx

echo "==> 4/5 Güvenlik duvarı"
if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q "Status: active"; then
    ufw allow from "$LAN_CIDR" to any port 80 proto tcp
    ufw allow from "$LAN_CIDR" to any port 11434 proto tcp
    ufw reload
    echo "ufw: $LAN_CIDR için 80 ve 11434 açıldı"
else
    echo "ufw aktif değil (veya yok) — ek kural gerekmedi"
fi

echo "==> 5/5 Doğrulama"
sleep 2
curl -s --max-time 10 http://127.0.0.1/ai/api/tags | head -c 400 || echo "PROXY YANIT YOK"
echo
curl -s --max-time 60 http://127.0.0.1/ai/v1/chat/completions \
  -H 'content-type: application/json' \
  -d "{\"model\":\"$MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"tek kelimeyle selamla\"}],\"max_tokens\":16}" \
  | head -c 400
echo
echo "Bitti. Uygulamada Ayarlar → AI sunucusu: http://192.168.1.12/ai/v1 · model: $MODEL"
