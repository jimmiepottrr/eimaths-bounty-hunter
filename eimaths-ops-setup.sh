#!/usr/bin/env bash
# ============================================================
# Eimaths ops relay — ให้ Claude สั่งงาน VPS ผ่าน GitHub เป็นตัวกลาง
# Claude push คำสั่งเข้า branch "ops"  ->  VPS รันเอง  ->  push ผลกลับ  ->  Claude อ่าน
#
# ⚠️ นี่เปิดช่องรันคำสั่ง (root) ผ่าน GitHub token — ใช้ชั่วคราวเท่านั้น
#    ถอนเมื่อเสร็จ:  bash ~/eimaths-ops-remove.sh   แล้ว rotate token
#
# ติดตั้ง:  curl -fsSL <url> | TOKEN=ghp_xxxxx bash
# ============================================================
set -euo pipefail
: "${TOKEN:?ต้องระบุ TOKEN=ghp_... นำหน้า bash}"
REPO="https://x-access-token:${TOKEN}@github.com/jimmiepottrr/eimaths-bounty-hunter.git"
DIR="$HOME/eimaths-ops"

echo "== clone branch ops =="
rm -rf "$DIR"
git clone -q --branch ops --single-branch "$REPO" "$DIR"

echo "== เขียน runner =="
cat > "$HOME/eimaths-ops-run.sh" <<'RUN'
#!/usr/bin/env bash
DIR="$HOME/eimaths-ops"; cd "$DIR" || exit 0
git fetch -q origin ops 2>/dev/null || exit 0
git reset -q --hard origin/ops 2>/dev/null
[ -f ops/cmd.sh ] || exit 0
H=$(sha256sum ops/cmd.sh | cut -d" " -f1)
LAST=$(cat "$HOME/.eimaths-ops-last" 2>/dev/null || true)
[ "$H" = "$LAST" ] && exit 0            # คำสั่งเดิม รันไปแล้ว ข้าม
echo "$H" > "$HOME/.eimaths-ops-last"
echo "=== run $(date -u) ===" > ops/out.txt
bash ops/cmd.sh >> ops/out.txt 2>&1
echo "=== exit $? ===" >> ops/out.txt
git add ops/out.txt
git -c user.email=vps@local -c user.name=vps-ops commit -q -m "ops result" 2>/dev/null || true
git push -q origin ops 2>/dev/null || true
RUN
chmod +x "$HOME/eimaths-ops-run.sh"

echo "== เขียน remover (ไว้ถอนทีหลัง) =="
cat > "$HOME/eimaths-ops-remove.sh" <<'RM'
#!/usr/bin/env bash
crontab -l 2>/dev/null | grep -v eimaths-ops-run | crontab - 2>/dev/null || true
rm -rf "$HOME/eimaths-ops" "$HOME/eimaths-ops-run.sh" "$HOME/.eimaths-ops-last"
echo "✅ ops relay ถอนออกแล้ว — อย่าลืม rotate GitHub token"
rm -f "$HOME/eimaths-ops-remove.sh"
RM
chmod +x "$HOME/eimaths-ops-remove.sh"

echo "== ติดตั้ง cron (ทุก 1 นาที) =="
( crontab -l 2>/dev/null | grep -v eimaths-ops-run; echo "* * * * * $HOME/eimaths-ops-run.sh >/dev/null 2>&1" ) | crontab -

echo ""
echo "✅ ops relay ติดตั้งแล้ว — Claude push คำสั่ง -> VPS รันเองใน ~1 นาที"
echo "   ถอนเมื่อเสร็จ:  bash ~/eimaths-ops-remove.sh"
crontab -l | grep eimaths-ops-run | sed 's/^/   cron: /'
