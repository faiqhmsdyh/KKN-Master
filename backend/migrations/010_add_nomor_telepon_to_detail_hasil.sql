-- Migration: Add nomor_telepon column to detail_hasil_autogrup table
-- Date: 2026-03-06
-- Description: Menambahkan kolom nomor_telepon ke table detail_hasil_autogrup
--              karena No.Telepon sekarang menjadi field wajib dan harus masuk ke hasil grouping

ALTER TABLE detail_hasil_autogrup
ADD COLUMN nomor_telepon VARCHAR(20) AFTER jenis_kelamin;
