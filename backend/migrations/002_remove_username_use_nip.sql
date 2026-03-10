-- Migration: Remove username column and use NIP for authentication
-- Date: 2026-02-22
-- Description: Simplify login by using NIP instead of username

-- Step 1: Make sure all users have NIP (update if needed)
-- Note: Run this manually if you have users without NIP
-- UPDATE akun SET nip = username WHERE nip IS NULL OR nip = '';

-- Step 2: Add UNIQUE constraint to nip column
ALTER TABLE akun 
MODIFY COLUMN nip VARCHAR(50) NOT NULL,
ADD UNIQUE KEY unique_nip (nip);

-- Step 3: Drop username column
ALTER TABLE akun 
DROP COLUMN username;

-- Verify the changes
-- SELECT * FROM akun LIMIT 5;
