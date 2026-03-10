-- Migration: Refactor konfigurasi tables
-- Date: 2026-03-03
-- Description: 
--   1. Drop unused columns from konfigurasi_autogrup (min_anggota_per_kelompok, max_anggota_per_kelompok, variasi_prodi, variasi_fakultas, aturan_jenis_kelamin, sebar_peserta_sakit)
--   2. Add tahun_ajaran and angkatan_kkn to konfigurasi_kriteria

-- Step 1: Drop unused columns from konfigurasi_autogrup
ALTER TABLE konfigurasi_autogrup 
DROP COLUMN IF EXISTS min_anggota_per_kelompok,
DROP COLUMN IF EXISTS max_anggota_per_kelompok,
DROP COLUMN IF EXISTS variasi_prodi,
DROP COLUMN IF EXISTS variasi_fakultas,
DROP COLUMN IF EXISTS aturan_jenis_kelamin,
DROP COLUMN IF EXISTS sebar_peserta_sakit;

-- Step 2: Add tahun_ajaran and angkatan_kkn to konfigurasi_kriteria  
ALTER TABLE konfigurasi_kriteria 
ADD COLUMN IF NOT EXISTS tahun_ajaran VARCHAR(20),
ADD COLUMN IF NOT EXISTS angkatan_kkn VARCHAR(50);

-- Step 3: Ensure konfigurasi_autogrup has correct structure
-- (This is for verification only, CREATE TABLE IF NOT EXISTS will be handled by backend)
-- Final structure should be:
-- konfigurasi_autogrup: id, nama_aturan, tahun_ajaran, angkatan_kkn, kriteria_config, created_at
-- konfigurasi_kriteria: id_konfigurasi, id_kriteria, nama_konfigurasi, tahun_ajaran, angkatan_kkn, nilai_min, nilai_max, nilai_boolean, nilai_gender, is_active, created_at
