-- Copper 8000 — schema (DB: copper8000, utf8mb4)
-- ใช้ตอนติดตั้งครั้งแรก: mysql copper8000 < schema.sql

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(190) NOT NULL,
  phone VARCHAR(32) NOT NULL DEFAULT '',
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  approved TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sessions (
  token CHAR(64) PRIMARY KEY,
  user_id INT NOT NULL,
  expires_at DATETIME NOT NULL,
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  material ENUM('copper','brass','aluminium') NOT NULL,
  name_th VARCHAR(190) NOT NULL,
  name_en VARCHAR(190) NOT NULL DEFAULT '',
  price_per_kg DECIMAL(10,2) NOT NULL,
  prev_price_per_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
  high_of_day DECIMAL(10,2) NOT NULL DEFAULT 0,
  low_of_day DECIMAL(10,2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity DECIMAL(12,3) NOT NULL,
  unit ENUM('kg','ton') NOT NULL DEFAULT 'ton',
  price_at_booking DECIMAL(10,2) NOT NULL,
  total_estimate DECIMAL(14,2) NOT NULL,
  status ENUM('pending','confirmed') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_bookings_product FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_user_created (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS languages (
  code VARCHAR(16) PRIMARY KEY,
  name_native VARCHAR(100) NOT NULL,
  dict LONGTEXT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  built_in TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO languages (code, name_native, dict, enabled, built_in, sort_order) VALUES
('th', 'ไทย',        NULL, 1, 1, 1),
('en', 'English',    NULL, 1, 1, 2),
('zh', '中文(简体)',  NULL, 1, 1, 3);

CREATE TABLE IF NOT EXISTS settings (
  skey VARCHAR(64) PRIMARY KEY,
  sval VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO settings (skey, sval) VALUES ('theme', 'gold');

-- สินค้าเริ่มต้น (ราคา บาท/กก. — แอดมินแก้ได้จากหน้าเว็บ)
INSERT INTO products (material, name_th, name_en, price_per_kg, prev_price_per_kg, high_of_day, low_of_day, sort_order) VALUES
('copper',    'ทองแดงเงา (เบอร์ 1)',   'Bright Copper #1',  285, 282, 288, 280, 1),
('copper',    'ทองแดงช็อต',            'Copper Shot',       272, 273, 275, 270, 2),
('copper',    'ทองแดงหนา (เบอร์ 2)',   'Heavy Copper #2',   260, 258, 263, 256, 3),
('brass',     'ทองเหลืองหนา',          'Heavy Brass',       185, 183, 187, 181, 4),
('brass',     'ทองเหลืองบาง / ฝอย',    'Light Brass',       172, 173, 175, 170, 5),
('aluminium', 'อลูมิเนียมหนา',          'Heavy Aluminium',    62,  61,  63,  60, 6),
('aluminium', 'อลูมิเนียมฉาก / เส้น',   'Aluminium Profile',  55,  55,  56,  54, 7),
('aluminium', 'กระป๋องอลูมิเนียม',      'Aluminium Cans',     38,  39,  40,  37, 8);
