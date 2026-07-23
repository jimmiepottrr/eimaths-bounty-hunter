# แผน: เพิ่ม role "Agent" (เซลล์) + ระบบค่าคอมมิชชั่น

> เอกสารแผนสำหรับทำฟีเจอร์ในเซสชันถัดไป — เริ่มด้วย: "ทำตามแผนใน copper8000/docs/agent-role-plan.md เฟส A ก่อน"

## Context
เว็บ Copper 8000 ตอนนี้มี 2 role (`admin`, `user`) + ธง `approved` — ตรวจสิทธิ์ด้วย hardcode `role === 'admin'` กระจาย 5 ชั้น (ไม่มี constant กลาง)
Jim ต้องการเพิ่ม `agent` (พนักงานขายหาลูกค้า) เป็นระดับกลาง โดยกำหนดกติกาชัดเจนแล้ว:
- **ค่าคอมมิชชั่น**: แอดมินตั้ง rate (%) ให้แต่ละเอเยนต์
- **เปลี่ยนราคาสินค้า**: แอดมินคนเดียวเท่านั้น — เอเยนต์ทำไม่ได้
- **เพิ่มเอเยนต์**: แอดมินคนเดียวเท่านั้น — เอเยนต์สมัครเองไม่ได้ (ไม่มี self-signup เป็น agent)

## ลำดับชั้นสิทธิ์ (ยืนยันแล้ว)
| ทำได้ | admin | agent | member |
|---|---|---|---|
| เปลี่ยนราคาสินค้า | ✅ | ❌ | ❌ |
| เพิ่ม/ลบเอเยนต์ + ตั้ง rate ค่าคอม | ✅ | ❌ | ❌ |
| เห็นลูกค้า+การจอง**ของทุกคน** | ✅ | ❌ (เห็นเฉพาะลูกค้าตัวเอง) | ❌ |
| อนุมัติสมาชิก / ยืนยันการจอง | ✅ | เฉพาะลูกค้าตัวเอง* | ❌ |
| ดูรายงานค่าคอมของตัวเอง | ✅ (เห็นทุกคน) | ✅ (ของตัวเอง) | ❌ |
| จองราคา | — | — | ✅ (approved) |

\* ปรับได้ตอนทำจริง — ถ้าอยากให้แอดมินอนุมัติคนเดียวก็ตัดออกได้

## ข้อกำหนดดีไซน์จาก Jim (ห้ามพลาด)
- **ห้ามแตะหน้า LOGIN เด็ดขาด** — `src/pages/LoginPage.tsx` คงเดิม 100% (ไม่เพิ่ม referral/agent ใดๆ ที่นี่)
- **แยกหน้าจอ** — ฟีเจอร์เอเยนต์อยู่หน้าของตัวเอง (`/agent`) ไม่ยัดรวมหน้าที่มีอยู่ · ส่วนจัดการเอเยนต์ของแอดมินก็แยกหน้า/แยกส่วนชัดเจน (เช่น route `/admin` แยกแท็บ หรือหน้า `/admin/agents` ต่างหาก)
- referral code ที่ลูกค้ากรอก อยู่ที่ **หน้าสมัครสมาชิก (SignupPage) เท่านั้น** — ไม่ยุ่งกับ Login

## การผูกลูกค้ากับเอเยนต์ (ออกแบบให้เข้ากับงานเซลล์)
- เอเยนต์แต่ละคนมี **referral code** (ระบบสร้างให้ตอนแอดมินเพิ่มเอเยนต์)
- ลูกค้ากรอก referral code ตอนสมัคร → ผูกกับเอเยนต์นั้นอัตโนมัติ (เป็นวิธีที่เซลล์ "หาลูกค้า" เข้าระบบ)
- แอดมินมองเห็น/ย้าย/ปลดการผูกลูกค้า↔เอเยนต์ได้ในหน้าแอดมิน (กำกับดูแล)

## การคำนวณค่าคอม
- ฟิลด์ `commission_rate` (%) ต่อเอเยนต์ (แอดมินตั้ง)
- ค่าคอม = rate × ยอด `total_estimate` ของการจองสถานะ **confirmed** ของลูกค้าที่ผูกกับเอเยนต์นั้น
- คิดฝั่งเซิร์ฟเวอร์เสมอ (กันปลอมแปลง) — หน้าเว็บแสดงผลอย่างเดียว

## สิ่งที่ต้องแก้ (แทนที่ hardcode `role==='admin'` ด้วยฟังก์ชันกลาง กันพลาดชั้นใดชั้นหนึ่ง — จุดเสี่ยง security)

**Frontend**
- `data/types.ts` — `role:'user'|'agent'|'admin'`; User เพิ่ม `agent_id`, `referral_code`, `commission_rate`; DataService เพิ่มเมธอด agent/admin
- `components/Protected.tsx` — `RequireRole(roles[])` แทน `RequireAdmin`
- `App.tsx` — route ใหม่ `/agent`
- `components/Layout.tsx` — แท็บ "เอเยนต์" (เฉพาะ role agent), badge, status chip เพิ่ม branch agent
- `pages/AgentPage.tsx` — **ใหม่**: แท็บ ลูกค้าของฉัน / การจองของลูกค้า / ค่าคอมของฉัน (read-only ราคา)
- `pages/AdminPage.tsx` — แท็บ/ส่วน "จัดการเอเยนต์": เพิ่มเอเยนต์ (เลื่อน user→agent หรือสร้างใหม่), ตั้ง commission_rate, ผูก/ย้ายลูกค้า, ดูค่าคอมทุกเอเยนต์
- `pages/ProfilePage.tsx` — status branch agent
- `pages/SignupPage.tsx` — ช่อง referral code (ไม่บังคับ)
- `data/mockAdapter.ts` — `requireRole([...])` แทน requireAdmin, เมธอด agent (listMyMembers/myBookings/myCommission), signup รับ referral, admin setRole/setCommission/assignMember
- `data/httpAdapter.ts` — mirror เมธอดใหม่
- `data/seed.ts` — เพิ่ม user role agent + demo member ผูกกับ agent + rate ตัวอย่าง

**Backend (PHP + DB)**
- `server/_bootstrap.php` — `require_role(array $roles)` (+ helper), serializer เพิ่มฟิลด์ agent
- `server/auth.php` — signup รับ `referral_code` → set `agent_id`; role ยัง default 'user'
- `server/admin.php` — action ใหม่: `set_role`, `set_commission_rate`, `assign_member_agent`, `list_agents` (+ ค่าคอมรวมทุกเอเยนต์)
- `server/agent.php` — **ใหม่**: `my_members`, `my_bookings`, `my_commission` (gate `require_role(['agent','admin'])` + กรองเฉพาะ agent_id ตัวเอง)
- `server/schema.sql` — `role ENUM('user','agent','admin')` + คอลัมน์ `agent_id INT NULL`, `referral_code VARCHAR`, `commission_rate DECIMAL`
- `server/migrate_agent.sql` — **ใหม่**: `ALTER TABLE users MODIFY role ENUM(...)` + `ADD COLUMN agent_id/referral_code/commission_rate` (รันบน VPS ที่มีข้อมูลจริง — idempotent)

**i18n** — `i18n/dictionaries/{th,en,zh}.ts`: `auth.agentRole`, `nav.agent`, ชุด `agent.*` + `adminAgent.*` ครบ 3 ภาษา

**Tests** — `tests/agent.spec.ts` (**ใหม่**): agent เข้า /admin ไม่ได้ · agent เปลี่ยนราคาไม่ได้ · agent เห็นเฉพาะลูกค้าตัวเอง · แอดมินเพิ่มเอเยนต์+ตั้ง rate · ลูกค้ากรอก referral ผูกถูกคน · ค่าคอมคำนวณถูก (rate × ยอด confirmed) · member เข้า /agent ไม่ได้ · ปรับ smoke/i18n เดิมให้เขียว

## ประเมิน token
งานเวอร์ชันเต็มนี้ (role + referral + commission + admin console + agent console) **~500k–850k tokens** รวม build + Playwright ครบชุด + screenshot + deploy VPS (อัปโหลด PHP + รัน migrate_agent.sql ผ่าน Hostinger MCP) + ทดสอบจริง — ใหญ่กว่าระบบ 3 ภาษาเล็กน้อย

## แนะนำโมเดล
**ใช้โมเดลสูงสุด (Opus 4.8 / Fable 5) ตลอดงาน** — งานแก้ระบบสิทธิ์ security-sensitive: พลาด role check ชั้นเดียว = เอเยนต์หลุดเข้าถึงสิทธิ์แอดมิน (เช่นแก้ราคา/เพิ่มเอเยนต์) หรือเห็นลูกค้าคนอื่น ความถูกต้องสำคัญกว่าประหยัด token · ไม่แนะนำสลับโมเดลกลางงาน

**กลยุทธ์ทำ 2 เฟส (คุมความเสี่ยง):**
1. เฟส A — role + สิทธิ์ + referral + agent/admin console (ยังไม่มีค่าคอม) → ทดสอบ boundary ให้แน่น
2. เฟส B — ค่าคอม (ฟิลด์ + คำนวณ + รายงาน) ต่อยอด

## Verification
- `npm run build` (tsc จับ role union ตกหล่น) + Playwright ทั้งชุดเขียว
- ทดสอบ boundary ครบ: agent↛/admin, agent↛เปลี่ยนราคา, agent เห็นเฉพาะลูกค้าตัวเอง, member↛/agent
- Backend: curl บน VPS ตรวจ require_role กันครบทุก endpoint + ค่าคอมคำนวณตรง + migration รันบนข้อมูลจริงไม่พัง
- Deploy → ยืนยันเว็บจริง + บัญชี demo agent (+ลูกค้าที่ผูก) ให้ Jim ลอง

## สถานะปัจจุบันของโปรเจกต์ (ก่อนเริ่มฟีเจอร์นี้)
- เว็บใช้งานจริงครบ: `https://jimmiepottrr.github.io/eimaths-bounty-hunter/copper8000/`
- Backend PHP+MariaDB บน VPS (auth/products/bookings/admin/languages/settings) — role ปัจจุบัน `user`/`admin`
- บัญชี: admin `admin@copper8000.co.th` · demo member `demo@copper8000.co.th`
- ราคาสินค้า 8 รายการใส่ค่าจริงแล้ว
