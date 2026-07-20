echo "node direct  (คาดหวัง 404): $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8848/mcp/wrongsecret)"
echo "via nginx https (คาดหวัง 404): $(curl -sk -o /dev/null -w '%{http_code}' https://srv1813136.hstgr.cloud/mcp/wrongsecret)"
echo "ยิง secret ถูกต้อง (คาดหวัง 200/405/406 = ถึง node จริง): $(curl -sk -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' -d '{}' https://srv1813136.hstgr.cloud/mcp/$(cat ~/eimaths-mcp/.secret))"
