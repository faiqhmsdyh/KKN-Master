-- ========================================
-- Add nama_dpl column to detail_hasil_autogrup
-- Purpose: Store DPL (Dosen Pembimbing Lapangan) name for each group
-- Date: 2026-03-05
-- ========================================

ALTER TABLE detail_hasil_autogrup 
ADD COLUMN IF NOT EXISTS nama_dpl VARCHAR(255) DEFAULT NULL AFTER kabupaten;

-- Note: nama_dpl is added per detail row, but logically it's per group (nomor_kelompok)
-- When updating, all rows with same id_hasil + nomor_kelompok should have same nama_dpl
