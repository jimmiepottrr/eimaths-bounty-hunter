#!/usr/bin/env bash
# ============================================================
# ติดตั้ง Claude Code บน Hostinger VPS (ทำครั้งเดียว)
# รันบน VPS:  bash claude-code-vps-setup.sh
# หลังเสร็จ = มี Claude ตัวหนึ่งอยู่บน VPS มีสิทธิ์ shell เต็ม
# ============================================================
set -euo pipefail
echo "== 1) ตรวจ/ติดตั้ง Node.js (>=18) ผ่าน nvm (ไม่ต้อง root) =="
NEED_NODE=1
if command -v node >/dev/null 2>&1; then
  V=$(node -v | sed 's/v//' | cut -d. -f1); [ "$V" -ge 18 ] && NEED_NODE=0
fi
if [ "$NEED_NODE" = "1" ]; then
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] || curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  . "$NVM_DIR/nvm.sh"
  nvm install --lts >/dev/null
fi
. "$HOME/.nvm/nvm.sh" 2>/dev/null || true
echo "   node $(node -v) · npm $(npm -v)"

echo "== 2) ติดตั้ง Claude Code =="
npm install -g @anthropic-ai/claude-code >/dev/null 2>&1 || npm install -g @anthropic-ai/claude-code
echo "   claude $(claude --version 2>/dev/null || echo 'installed')"

echo "== 3) เตรียมโฟลเดอร์งาน + clone repo =="
WORK="$HOME/eimaths-work"
[ -d "$WORK/.git" ] || git clone https://github.com/jimmiepottrr/eimaths-bounty-hunter.git "$WORK"
echo "   $WORK พร้อม"

cat <<TIP

============================================================
✅ ติดตั้งเสร็จ! ขั้นต่อไป (auth — ต้องใส่ credential ของ Jim เอง):

   cd $WORK
   export ANTHROPIC_API_KEY=sk-ant-xxxxxxxx      # key จาก console.anthropic.com
   claude

พอเปิด claude แล้ว พิมพ์คำสั่งแรก:
   "อ่าน CLAUDE.md + docs/VPS-HANDOFF.md แล้ววินิจฉัย /quiz timeout ของ ป.4-6"

หมายเหตุ: ANTHROPIC_API_KEY = จ่ายตามการใช้ (pay-per-use) แยกจาก subscription
ถ้าจะใช้ subscription แทน: รัน  claude  แล้วทำตามขั้นตอน login ที่มันบอก
============================================================
TIP
