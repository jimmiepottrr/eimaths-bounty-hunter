# eimaths-assets (branch: assets)

Asset delivery สำหรับ Eimaths Bounty Hunter — **GitHub-pull automation**
VPS ดึง branch นี้ทุก 1 นาที แล้ว sync เข้าโฟลเดอร์ที่เว็บ serve

- `staging/`  → serve ที่ `/staging/` (เพลงประกอบ music-*.mp3)
- `worlds/`   → serve ที่ `/assets/worlds/` (อาร์ตฉาก/บอส .webp)
- `music/`    → serve ที่ `/assets/music/` (สำรอง)

อัปเดต: Claude push ไฟล์เข้า branch นี้ → VPS pull เอง ไม่ต้องกด batch.html
