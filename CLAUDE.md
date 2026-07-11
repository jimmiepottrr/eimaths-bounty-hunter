# Eimaths Bounty Hunter — Working Principles (ข้อตกลงถาวรกับ Jim)

## กฎเหล็กเรื่องระบบอัตโนมัติ (Automation-First — ตั้งโดย Jim 2026-07-11)
- **พยายามทุกทางที่ทำได้เองก่อนเสมอ** ก่อนจะขอให้ Jim ลงมือ. เป้าหมายคือ zero-touch ให้มากที่สุด สมกับการใช้ Cowork.
- ให้ Jim ลงมือทำเอง **เป็นหนทางสุดท้ายเท่านั้น** — เมื่อทุกช่องทางอัตโนมัติถูกลองและติดข้อจำกัดจริง (device binding, CSP, CORS, credential policy ฯลฯ) แล้วเท่านั้น.
- เวลาต้องพึ่ง Jim ให้ลดจำนวน "จังหวะ" ที่เขาต้องแตะให้เหลือน้อยที่สุด (เช่น 1 คลิก) และอธิบายเหตุผลทางเทคนิคสั้นๆ ตรงไปตรงมาว่าทำไม AI ทำแทนช่วงนั้นไม่ได้.

## Security guardrails (คงเดิมตลอดโปรเจกต์)
- Jim พิมพ์รหัสผ่าน/OTP/credentials เองทุกครั้ง — ห้าม AI พิมพ์/กรอก/จัดการ credentials แทนเด็ดขาด.
- ขอ confirm ก่อนทำ browser action ที่มีผลข้างเคียง (ใช้ปุ่มยืนยัน).
- API_KEY / INSPECT_KEY / รหัส DB: แสดงให้ Jim ก๊อปเก็บ ห้ามเขียนลงไฟล์ใน repo. บน repo ใช้ GitHub Actions secrets (VITE_API_BASE / VITE_API_KEY) แทนค่าจริง.
- Model policy: ใช้โมเดลสูงสุดเสมอ (Claude Fable 5).

## Asset pipeline ที่ใช้ได้จริง (media hand-off)
- ช่องทางที่พิสูจน์แล้วว่าเวิร์ค: หน้า `https://srv1813136.hstgr.cloud/batch.html` (multi-file uploader ยิงตรงเข้า VPS ผ่าน X-Ingest-Token, ไม่ผูกกับ device bridge, เห็นผล realtime). Jim เลือกไฟล์รูปในโฟลเดอร์ → Ctrl+A → Open.
- ช่องที่ใช้ไม่ได้ในแอปเวอร์ชันปัจจุบัน: แนบ/วางรูปในแชท (แอปแปลงเป็น inline image, ไฟล์จริงไม่ถึง), device bridge (แชทผูก device id เก่า แก้กลางคันไม่ได้), ดึง URL Gemini ตรง (ต้องใช้ cookie บัญชี + โดน CORS/CSP).
- workspace นี้ egress ถูกบล็อกไป VPS + github.io; push repo ทำผ่าน GitHub web หรือ claude.ai/code session พร้อม zip แนบ.

## Art direction (มาตรา 8)
- Stylized 3D render เท่านั้น — ห้าม flat vector เด็ดขาด. ตัวละครคงเดิม. prompt ต้องมี "stylized 3D render, soft lighting, depth of field, game asset".
