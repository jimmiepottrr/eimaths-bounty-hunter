export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
echo "=== NGINX bounty config ==="
cat /etc/nginx/sites-enabled/bounty
echo "=== SETUP MCP ==="
mkdir -p ~/eimaths-mcp && cd ~/eimaths-mcp
curl -fsSL https://raw.githubusercontent.com/jimmiepottrr/eimaths-bounty-hunter/assets/mcp-server.mjs -o server.mjs
curl -fsSL https://raw.githubusercontent.com/jimmiepottrr/eimaths-bounty-hunter/assets/mcp-package.json -o package.json
echo "npm install..."; npm install --no-fund --no-audit >/tmp/npmi.log 2>&1 && echo "npm OK" || { echo "npm FAIL"; tail -8 /tmp/npmi.log; }
[ -f .secret ] || { openssl rand -hex 32 > .secret; chmod 600 .secret; }
echo "secret file perms: $(ls -l .secret | awk '{print $1}')  (ไม่ echo ค่า secret)"
echo "files: $(ls)"
echo "=== DONE ==="
