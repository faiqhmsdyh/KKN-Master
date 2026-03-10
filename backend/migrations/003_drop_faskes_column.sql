-- Migration: Drop kolom 'faskes' yang sudah tidak digunakan
-- Tanggal: 2026-02-24
-- Alasan: Sistem sekarang menggunakan jarak_ke_puskesmas, puskesmas_terdekat, kategori_jarak
-- 
-- Kolom 'faskes' sudah digantikan dengan sistem otomatis pencarian puskesmas terdekat
-- menggunakan Overpass API dan Nominatim API yang lebih akurat berdasarkan koordinat geografis
--
-- CARA MENJALANKAN:
-- 1. Via phpMyAdmin: Copy paste SQL ini ke tab SQL
-- 2. Via MySQL CLI: mysql -u root -p kkn_db < backend/migrations/003_drop_faskes_column.sql

-- ============================================
-- BACKUP DATA (OPSIONAL - RECOMMENDED)
-- ============================================
-- CREATE TABLE data_lokasi_kkn_backup_20260224 AS SELECT * FROM data_lokasi_kkn;
-- SELECT 'Backup created successfully' AS Status;

-- ============================================
-- DROP KOLOM FASKES
-- ============================================
ALTER TABLE data_lokasi_kkn DROP COLUMN IF EXISTS faskes;

-- ============================================
-- VERIFIKASI STRUKTUR TABEL
-- ============================================
DESCRIBE data_lokasi_kkn;

-- ============================================
-- EXPECTED COLUMNS AFTER MIGRATION:
-- ============================================
-- id_lokasi (INT, PRIMARY KEY, AUTO_INCREMENT)
-- lokasi (VARCHAR)
-- desa (VARCHAR)
-- kecamatan (VARCHAR)
-- kabupaten (VARCHAR)
-- latitude (DECIMAL)
-- longitude (DECIMAL)
-- kuota (INT)
-- jarak_ke_puskesmas (DECIMAL)
-- puskesmas_terdekat (VARCHAR)
-- kategori_jarak (VARCHAR)
-- created_at (TIMESTAMP)
