# Copper 8000 API — PHP + MariaDB บน VPS

โฟลเดอร์นี้คือ **สำเนา source of truth** ของ backend ที่ deploy อยู่ที่
`/var/www/bounty/copper8000-api/` บน VPS (`https://srv1813136.hstgr.cloud/copper8000-api/`)

## ไฟล์

| ไฟล์ | หน้าที่ |
|---|---|
| `schema.sql` | สร้างตาราง users / sessions / products / bookings + seed สินค้า 8 รายการ |
| `_bootstrap.php` | config, CORS, JSON helpers, API key check, PDO, auth (Bearer token) |
| `auth.php` | POST signup / login · GET = me |
| `products.php` | GET รายการสินค้า (สาธารณะ, ตรวจ API key) |
| `bookings.php` | POST สร้างการจอง (ต้อง approved, ราคา snapshot ฝั่ง server) · GET 10 รายการล่าสุดของฉัน |
| `admin.php` | อนุมัติสมาชิก / ยืนยันการจอง / แก้ราคา (role=admin) |
| `config.example.php` | template ของ `config.php` — **ค่าจริงอยู่บนเซิร์ฟเวอร์เท่านั้น ห้าม commit** |

## ติดตั้งใหม่ (ถ้าต้องทำเอง)

```bash
# 1) DB + user
mysql -e "CREATE DATABASE copper8000 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
          CREATE USER 'copper8000'@'localhost' IDENTIFIED BY '<รหัสใหม่>';
          GRANT ALL ON copper8000.* TO 'copper8000'@'localhost'; FLUSH PRIVILEGES;"
mysql copper8000 < schema.sql

# 2) วางไฟล์ PHP
mkdir -p /var/www/bounty/copper8000-api
cp *.php /var/www/bounty/copper8000-api/
cp config.example.php /var/www/bounty/copper8000-api/config.php  # แล้วกรอกค่าจริง

# 3) สร้างบัญชีแอดมิน
php -r "echo password_hash('<รหัสแอดมิน>', PASSWORD_DEFAULT);"
mysql copper8000 -e "INSERT INTO users (email,password_hash,name,role,approved)
  VALUES ('admin@copper8000.co.th','<hash>','ผู้ดูแลระบบ','admin',1);"
```

nginx ของ site `bounty` มี `location ~ /(config\.php|...)` deny ไว้อยู่แล้ว —
ครอบคลุม `copper8000-api/config.php` ด้วย

## เชื่อม frontend

ตั้ง GitHub Actions secrets ของ repo:
- `COPPER_VITE_API_BASE` = `https://srv1813136.hstgr.cloud/copper8000-api`
- `COPPER_VITE_API_KEY` = ค่า `API_KEY` ใน config.php บนเซิร์ฟเวอร์

ยังไม่ตั้ง secrets → เว็บรันโหมดสาธิต (mock ใน localStorage) อัตโนมัติ
