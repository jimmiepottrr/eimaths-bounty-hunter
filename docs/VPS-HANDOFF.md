# VPS-HANDOFF — สำหรับ Claude Code ที่รันบน Hostinger VPS (srv1813136)

> อ่านไฟล์นี้ + `CLAUDE.md` (working principles) ก่อนเริ่มงานเสมอ

## บทบาทของคุณ
คุณคือ Claude Code ที่รัน **บน VPS โดยตรง** มีสิทธิ์ shell เต็ม ไม่มีกำแพง egress
หน้าที่: งานฝั่ง VPS ที่ Cowork (คลาวด์) ทำไม่ได้ — **backend PHP, ฐานข้อมูล, การ serve asset, cron, deploy บนเครื่อง**

## สถาปัตยกรรม
- **Frontend**: React+TS → GitHub Pages. deploy อัตโนมัติ (push `main` → GitHub Actions → `gh-pages`). **Cowork ดูแลส่วนนี้ — อย่าแตะ build/deploy เว้นแต่จำเป็น**
- **Backend**: PHP บน VPS นี้ — `auth.php`, `quiz_start.php`, `quiz_answer.php`, `reward_redeem.php` + DB (น่าจะ MySQL/MariaDB) เสิร์ฟจาก webroot (มี `/staging`, `/assets/worlds`, `/assets/music`)
- **Asset delivery**: branch `assets` บน GitHub → cron `eimaths-asset-deploy.sh` pull มาลง webroot ทุก 1 นาที

## สถานะปัจจุบัน (2026-07-15)
เฟส v2 เสร็จ+deploy แล้ว: แผนที่ ป.4-6, SFX ตอบถูก 3 ระดับ+กลองคอมโบ, มาสคอตสิงโตมุมจอ, responsive (กัน h-scroll), เพลงหยุดตอนทำข้อสอบ, WebP, เพลง hook-loop

## 🔴 งานเร่งด่วน #1 — /quiz timeout (สำคัญสุด: เล่น ป.4-6 ไม่ได้)
Frontend เรียก `quiz_start.php?grade=4&scene=1` แล้ว **timeout** (หน้าเกมขึ้น "เชื่อมต่อนานเกินไป")
วินิจฉัย root-cause:
1. ทดสอบ endpoint ตรงๆ บนเครื่อง: `curl "http://localhost/quiz_start.php?grade=4&scene=1" -H "X-Api-Key: <key จาก config>"` — ดูว่า return อะไร / ค้างตรงไหน
2. เช็ค DB: มีโจทย์ ป.4, ป.5, ป.6 ในตารางไหม? เทียบกับ ป.3 (ที่เล่นได้)
3. สมมติฐานหลัก: **ขาดโจทย์ ป.4-6 ในฐานข้อมูล** → query อาจ loop/รอ / หรือ return ว่างจน frontend timeout
แก้: เติมโจทย์ ป.4-6 (คุยกับ Jim เรื่องเนื้อหา/จำนวนข้อก่อน) — **ห้าม DROP/แก้ schema โดยไม่ confirm Jim**

## งาน #2 — ยืนยัน asset sync
เช็ค `crontab -l | grep eimaths` + ว่าเพลง loop อยู่ `webroot/staging/music-*.mp3` (เวอร์ชัน ~16s)

## ประสานงานกับ Cowork (คลาวด์)
- Cowork = เจ้าของ frontend + GitHub · คุณ = เจ้าของ backend + DB + server
- ถ้าแก้/สร้าง backend ให้ commit เก็บใน repo (branch เช่น `backend`) เพื่อ Cowork เห็นด้วย
- อัปเดตความคืบหน้าให้ Jim ตรงไปตรงมา ทุกครั้งที่ทำเสร็จ 1 ก้อน

## กฎเหล็ก (Jim)
- **ความปลอดภัย**: ห้ามเขียน DB creds / API key ลง repo. Jim จัดการ credential เอง
- ขอ confirm ก่อนคำสั่งมีผลถาวร (DROP, DELETE, rm -rf, แก้ prod DB)
- Automation-first · root-cause · ตรงไปตรงมา · ประเมินขีดความสามารถก่อนทำ (fail-fast)
