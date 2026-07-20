export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh" 2>/dev/null
NODEBIN=$(command -v node); [ -z "$NODEBIN" ] && NODEBIN=$(ls -d ~/.nvm/versions/node/*/bin/node | tail -1)
cd ~/eimaths-mcp
echo "MCP_SECRET=$(cat .secret)" > .env; echo "MCP_PORT=8848" >> .env; chmod 600 .env
cat > /etc/systemd/system/eimaths-mcp.service <<UNIT
[Unit]
Description=eimaths-infra MCP
After=network.target
[Service]
Type=simple
EnvironmentFile=/root/eimaths-mcp/.env
WorkingDirectory=/root/eimaths-mcp
ExecStart=$NODEBIN /root/eimaths-mcp/server.mjs
Restart=always
[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now eimaths-mcp >/dev/null 2>&1
sleep 2
echo "service active: $(systemctl is-active eimaths-mcp)"
echo "listen 8848: $(ss -ltn | grep -q :8848 && echo YES || echo NO)"
echo "log:"; journalctl -u eimaths-mcp -n 4 --no-pager 2>/dev/null | sed 's/^/  /'
if grep -q "location /mcp/" /etc/nginx/sites-enabled/bounty; then echo "nginx /mcp: already"; else
  cp /etc/nginx/sites-enabled/bounty /etc/nginx/sites-enabled/bounty.bak
  awk '/listen 443 ssl/ && !d { print "    location /mcp/ { proxy_pass http://127.0.0.1:8848; proxy_http_version 1.1; proxy_set_header Connection \"\"; proxy_buffering off; proxy_read_timeout 3600s; }"; d=1 } {print}' /etc/nginx/sites-enabled/bounty > /tmp/b.new && mv /tmp/b.new /etc/nginx/sites-enabled/bounty
  echo "nginx /mcp: added"
fi
if nginx -t 2>/tmp/ngt; then systemctl reload nginx; echo "nginx: reloaded OK"; else echo "nginx TEST FAIL -> restore"; cp /etc/nginx/sites-enabled/bounty.bak /etc/nginx/sites-enabled/bounty; cat /tmp/ngt; fi
echo "=== connector URL (secret ปิดไว้) ==="
echo "https://srv1813136.hstgr.cloud/mcp/****(อ่านด้วย: cat ~/eimaths-mcp/.secret)"
