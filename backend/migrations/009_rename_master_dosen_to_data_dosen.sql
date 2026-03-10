-- Migration: Rename master_dosen table to data_dosen
-- Date: 2026-03-06
-- Description: Rename table name from master_dosen to data_dosen for consistency

-- Step 1: Check if master_dosen exists and data_dosen doesn't exist
-- Step 2: Rename the table
-- Step 3: Update any foreign keys if needed

-- Note: Foreign keys will automatically reference the renamed table

RENAME TABLE master_dosen TO data_dosen;
