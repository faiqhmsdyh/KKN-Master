-- Migration: Drop nama_konfigurasi column from konfigurasi_kriteria table
-- Reason: Column is not used anywhere in frontend/backend and always contains NULL values
-- Created: 2026-03-03

ALTER TABLE konfigurasi_kriteria 
DROP COLUMN IF EXISTS nama_konfigurasi;

-- Verification query (run after migration to confirm)
-- DESCRIBE konfigurasi_kriteria;
