# ปัญหา: .bak อยู่ใน sites-enabled -> nginx โหลดซ้ำ = duplicate default server. ย้ายออก
rm -f /etc/nginx/sites-enabled/bounty.bak
cp /etc/nginx/sites-enabled/bounty /root/bounty.nginx.bak   # backup นอก sites-enabled
if grep -q "location /mcp/" /etc/nginx/sites-enabled/bounty; then echo "/mcp already"; else
  awk '/listen 443 ssl/ && !d { print "    location /mcp/ { proxy_pass http://127.0.0.1:8848; proxy_http_version 1.1; proxy_set_header Connection \"\"; proxy_buffering off; proxy_read_timeout 3600s; }"; d=1 } {print}' /etc/nginx/sites-enabled/bounty > /tmp/b.new && mv /tmp/b.new /etc/nginx/sites-enabled/bounty; echo "/mcp added"
fi
if nginx -t 2>/tmp/ngt; then systemctl reload nginx; echo "nginx: reloaded OK"; else echo "nginx TEST FAIL:"; cat /tmp/ngt; cp /root/bounty.nginx.bak /etc/nginx/sites-enabled/bounty; fi
echo "service: $(systemctl is-active eimaths-mcp) | listen8848: $(ss -ltn|grep -q :8848 && echo YES||echo NO)"
echo "files sites-enabled: $(ls /etc/nginx/sites-enabled/)"
