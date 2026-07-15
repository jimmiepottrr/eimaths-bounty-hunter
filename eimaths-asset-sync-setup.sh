#!/usr/bin/env bash
# ============================================================
# Eimaths Bounty Hunter — GitHub-pull asset sync (ติดตั้งครั้งเดียว)
# รันบน Hostinger VPS ผ่าน SSH  ->  bash eimaths-asset-sync-setup.sh
#
# หลังตั้งเสร็จ: Claude push ไฟล์เข้า branch "assets" บน GitHub
#   -> VPS pull เอง + คัดลอกเข้าโฟลเดอร์ที่เว็บ serve ทุก 1 นาที
#   -> ไม่ต้องกด batch.html อีกเลย
# ============================================================
set -euo pipefail

# ---------- WEBROOT: หาอัตโนมัติ (โฟลเดอร์ที่มี /staging อยู่ข้างใน) ----------
# ปกติไม่ต้องแก้ — สคริปต์จะหาโฟลเดอร์ staging ที่มีเพลงเดิมอยู่แล้ว
# ถ้าหาไม่เจอ ค่อยใส่เอง เช่น WEBROOT="/home/xxx/public_html"
WEBROOT="${WEBROOT:-}"
if [ -z "$WEBROOT" ]; then
  found="$(find "$HOME" -maxdepth 6 -type d -name staging 2>/dev/null | head -1)"
  [ -z "$found" ] && found="$(find /var/www /srv -maxdepth 6 -type d -name staging 2>/dev/null | head -1)"
  [ -n "$found" ] && WEBROOT="$(dirname "$found")"
fi
if [ -z "$WEBROOT" ] || [ ! -d "$WEBROOT" ]; then
  echo "❌ หาโฟลเดอร์ staging อัตโนมัติไม่เจอ"
  echo "   รัน:  find \$HOME -maxdepth 6 -type d -name staging"
  echo "   แล้วรันใหม่แบบระบุเอง:  WEBROOT=/path/ที่มี/staging  bash $0"
  exit 1
fi
echo "== WEBROOT = $WEBROOT =="
# ------------------------------------------------

REPO="https://github.com/jimmiepottrr/eimaths-bounty-hunter.git"
BRANCH="assets"
SYNC_DIR="$HOME/eimaths-assets"
DEPLOY="$HOME/eimaths-asset-deploy.sh"

echo "== ตรวจเครื่องมือ =="
command -v git >/dev/null || { echo "❌ ไม่มี git"; exit 1; }
HAVE_RSYNC=1; command -v rsync >/dev/null || { HAVE_RSYNC=0; echo "⚠️  ไม่มี rsync จะใช้ cp แทน"; }
[ -d "$WEBROOT" ] || { echo "❌ ไม่พบ WEBROOT: $WEBROOT — แก้ค่า WEBROOT ในสคริปต์ก่อน"; exit 1; }

echo "== clone branch assets (ครั้งแรก) =="
if [ ! -d "$SYNC_DIR/.git" ]; then
  git clone --branch "$BRANCH" --single-branch "$REPO" "$SYNC_DIR"
else
  echo "   มีอยู่แล้ว ข้าม"
fi

echo "== เขียน deploy script =="
cat > "$DEPLOY" <<EOF
#!/usr/bin/env bash
set -e
cd "$SYNC_DIR"
git fetch -q origin "$BRANCH"
git reset -q --hard "origin/$BRANCH"     # เอา asset ล่าสุดเสมอ
mkdir -p "$WEBROOT/staging" "$WEBROOT/assets/worlds" "$WEBROOT/assets/music"
sync_dir(){ # \$1 src  \$2 dst  (ไม่ลบไฟล์อื่นใน dst)
  [ -d "\$1" ] || return 0
  if [ "$HAVE_RSYNC" = "1" ]; then rsync -a "\$1"/ "\$2"/ ; else cp -rf "\$1"/. "\$2"/ ; fi
}
sync_dir "$SYNC_DIR/staging" "$WEBROOT/staging"
sync_dir "$SYNC_DIR/worlds"  "$WEBROOT/assets/worlds"
sync_dir "$SYNC_DIR/music"   "$WEBROOT/assets/music"
EOF
chmod +x "$DEPLOY"

echo "== รัน deploy ครั้งแรก (ดึงเพลง loop เข้า /staging เลย) =="
"$DEPLOY"
echo "   ไฟล์ใน $WEBROOT/staging:"; ls -1 "$WEBROOT/staging" | sed 's/^/     /'

echo "== ติดตั้ง cron ทุก 1 นาที =="
CRON_LINE="* * * * * $DEPLOY >/dev/null 2>&1"
( crontab -l 2>/dev/null | grep -v 'eimaths-asset-deploy' ; echo "$CRON_LINE" ) | crontab -
echo "   cron:"; crontab -l | grep eimaths-asset-deploy | sed 's/^/     /'

echo ""
echo "✅ เสร็จ! ต่อไปนี้ Claude push เข้า branch assets -> VPS ดึงเองใน 1 นาที"
echo "   ทดสอบ: เปิด https://srv1813136.hstgr.cloud/staging/music-p4.mp3 (ควรเป็นเวอร์ชัน loop)"
