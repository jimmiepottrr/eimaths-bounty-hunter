echo "=== RECON ==="
echo "whoami: $(whoami)  host: $(hostname)"
NODE=$(command -v node); [ -z "$NODE" ] && NODE=$(ls -d ~/.nvm/versions/node/*/bin/node 2>/dev/null | tail -1)
echo "node bin: ${NODE:-none}"; [ -n "$NODE" ] && echo "node ver: $("$NODE" -v)"
NPM=$(command -v npm); [ -z "$NPM" ] && NPM=$(ls -d ~/.nvm/versions/node/*/bin/npm 2>/dev/null | tail -1); echo "npm bin: ${NPM:-none}"
echo "pm2: $(command -v pm2 || ls -d ~/.nvm/versions/node/*/bin/pm2 2>/dev/null | tail -1 || echo none)"
nginx -v 2>&1 | sed 's/^/nginx: /'
echo "sites-enabled:"; ls /etc/nginx/sites-enabled/ 2>/dev/null
echo "conf.d:"; ls /etc/nginx/conf.d/ 2>/dev/null
echo "server_name ที่ตั้งไว้:"; grep -rhoE 'server_name[^;]+' /etc/nginx/sites-enabled /etc/nginx/conf.d 2>/dev/null | sort -u | head
echo "webroot bounty: $(ls -d /var/www/bounty 2>/dev/null || echo '?')"
(ss -ltn 2>/dev/null | grep -q :8848 && echo "port 8848: in use") || echo "port 8848: free"
