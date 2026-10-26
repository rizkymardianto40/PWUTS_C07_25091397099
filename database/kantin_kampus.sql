-- =====================================================================
-- DATABASE KANTIN KAMPUS
-- Tugas UTS Pemrograman Web - PWUTS_C07_25091397099
-- Rizky Mardianto / 25091397099
-- =====================================================================
-- Cara import (XAMPP):
--   1. Jalankan Apache + MySQL di XAMPP Control Panel
--   2. Buka http://localhost/phpmyadmin
--   3. Tab "Import" -> pilih file ini -> Go
--   ATAU lewat terminal:
--   C:\xampp\mysql\bin\mysql.exe -u root < database/kantin_kampus.sql
-- =====================================================================

CREATE DATABASE IF NOT EXISTS kantin_kampus
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kantin_kampus;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS detail_pesanan;
DROP TABLE IF EXISTS pesanan;
DROP TABLE IF EXISTS menu;
DROP TABLE IF EXISTS kategori;
DROP TABLE IF EXISTS penjual;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1. USERS  (mahasiswa & admin)
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id_user  INT AUTO_INCREMENT PRIMARY KEY,
  nama     VARCHAR(100) NOT NULL,
  username VARCHAR(50)  NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role     ENUM('mahasiswa','admin') NOT NULL DEFAULT 'mahasiswa',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 2. KATEGORI
-- ---------------------------------------------------------------------
CREATE TABLE kategori (
  id_kategori   INT AUTO_INCREMENT PRIMARY KEY,
  nama_kategori VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 3. PENJUAL (stan kantin)
-- ---------------------------------------------------------------------
CREATE TABLE penjual (
  id_penjual      INT AUTO_INCREMENT PRIMARY KEY,
  nama_penjual    VARCHAR(100) NOT NULL,
  lokasi          VARCHAR(100),
  jam_operasional VARCHAR(100),
  deskripsi       TEXT,
  aktif           TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 4. MENU
-- ---------------------------------------------------------------------
CREATE TABLE menu (
  id_menu     INT AUTO_INCREMENT PRIMARY KEY,
  id_kategori INT NOT NULL,
  id_penjual  INT NULL,
  nama_menu   VARCHAR(100) NOT NULL,
  harga       DECIMAL(12,2) NOT NULL,
  stok        INT NOT NULL DEFAULT 0,
  deskripsi   TEXT,
  foto        VARCHAR(255),
  populer     TINYINT(1) DEFAULT 0,
  aktif       TINYINT(1) DEFAULT 1,
  CONSTRAINT fk_menu_kategori FOREIGN KEY (id_kategori) REFERENCES kategori(id_kategori),
  CONSTRAINT fk_menu_penjual  FOREIGN KEY (id_penjual)  REFERENCES penjual(id_penjual) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 5. PESANAN (header transaksi)
-- ---------------------------------------------------------------------
CREATE TABLE pesanan (
  id_pesanan INT AUTO_INCREMENT PRIMARY KEY,
  id_user    INT NOT NULL,
  tanggal    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total      DECIMAL(12,2) NOT NULL,
  status     ENUM('Menunggu','Diproses','Siap diambil','Selesai','Dibatalkan')
             NOT NULL DEFAULT 'Menunggu',
  catatan    VARCHAR(500),
  CONSTRAINT fk_pesanan_user FOREIGN KEY (id_user) REFERENCES users(id_user)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 6. DETAIL_PESANAN (rincian item per transaksi)
-- ---------------------------------------------------------------------
CREATE TABLE detail_pesanan (
  id_detail    INT AUTO_INCREMENT PRIMARY KEY,
  id_pesanan   INT NOT NULL,
  id_menu      INT NOT NULL,
  jumlah       INT NOT NULL,
  harga_satuan DECIMAL(12,2) NOT NULL,
  subtotal     DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_detail_pesanan FOREIGN KEY (id_pesanan) REFERENCES pesanan(id_pesanan) ON DELETE CASCADE,
  CONSTRAINT fk_detail_menu    FOREIGN KEY (id_menu)    REFERENCES menu(id_menu)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- DATA CONTOH
-- =====================================================================

-- Password: admin123   (hash bcrypt hasil password_hash('admin123', PASSWORD_DEFAULT))
INSERT INTO users (nama, username, password, role) VALUES
('Rizky Mardianto',  'rizky', '$2y$10$Ois9DVRgnnr87SAZCroVt.Aclj8TZX4V5ZbMPk0Zb74v36fmeknNu', 'mahasiswa'),
('Nadia Putri',      'nadia', '$2y$10$Ois9DVRgnnr87SAZCroVt.Aclj8TZX4V5ZbMPk0Zb74v36fmeknNu', 'mahasiswa'),
('Bagas Prakoso',    'bagas', '$2y$10$Ois9DVRgnnr87SAZCroVt.Aclj8TZX4V5ZbMPk0Zb74v36fmeknNu', 'mahasiswa'),
('Administrator Kantin', 'admin', '$2y$10$Ois9DVRgnnr87SAZCroVt.Aclj8TZX4V5ZbMPk0Zb74v36fmeknNu', 'admin');

INSERT INTO kategori (nama_kategori) VALUES
('Makanan'), ('Minuman'), ('Camilan'), ('Dessert');

INSERT INTO penjual (nama_penjual, lokasi, jam_operasional, deskripsi) VALUES
('Warung Bu Sari',    'Stan A-01', '07.30 - 16.00', 'Masakan rumahan porsi mahasiswa.'),
('Kedai Segar Kampus','Stan A-02', '08.00 - 17.00', 'Minuman dingin dan jus buah segar.'),
('Camilan Ceria',     'Stan B-01', '09.00 - 16.00', 'Gorengan dan camilan ringan.');

-- Foto mengikuti file yang benar-benar ada di folder assets/
INSERT INTO menu (id_kategori, id_penjual, nama_menu, harga, stok, deskripsi, foto, populer) VALUES
(1, 1, 'Nasi Goreng Spesial',   15000, 20, 'Nasi goreng dengan telur, ayam, dan kerupuk.', 'assets/Nasi Goreng.jpg', 1),
(1, 1, 'Ayam Geprek Sambal Ijo',18000, 15, 'Ayam crispy digeprek sambal ijo, plus nasi hangat.', 'assets/Ayam Geprek.jpg', 1),
(2, 2, 'Es Teh Manis',           5000, 40, 'Teh manis dingin, segar untuk siang hari.', 'assets/Es Teh.jpg', 1),
(2, 2, 'Jus Alpukat',           12000, 12, 'Alpukat segar diblender dengan susu.', 'assets/Jus Alpukat.jpg', 0),
(3, 3, 'Pisang Goreng Keju',     8000, 18, 'Pisang goreng renyah topping keju dan susu.', 'assets/Pisang Goreng.jpg', 0);

INSERT INTO pesanan (id_user, tanggal, total, status, catatan) VALUES
(1, '2025-10-20 09:15:00', 20000, 'Selesai',      'Tanpa sambal'),
(2, '2025-10-20 11:40:00', 18000, 'Siap diambil',  ''),
(3, '2025-10-21 08:05:00',  5000, 'Selesai',      'Es sedikit'),
(1, '2025-10-21 12:30:00', 27000, 'Diproses',     'Dibungkus'),
(2, '2025-10-22 10:10:00', 15000, 'Menunggu',     ''),
(3, '2025-10-22 13:45:00', 12000, 'Menunggu',     'Jus tanpa susu');

INSERT INTO detail_pesanan (id_pesanan, id_menu, jumlah, harga_satuan, subtotal) VALUES
(1, 1, 1, 15000, 15000),
(1, 3, 1,  5000,  5000),
(2, 2, 1, 18000, 18000),
(3, 3, 1,  5000,  5000),
(4, 2, 1, 18000, 18000),
(4, 5, 1,  8000,  8000),
(4, 3, 1,  5000,  5000),
(5, 1, 1, 15000, 15000),
(6, 4, 1, 12000, 12000);
