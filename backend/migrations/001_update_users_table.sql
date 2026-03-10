-- Migration: Update users table for Manajemen Akun redesign
-- Date: 2025
-- Description: Adds nip, email, status columns and updates role system to Admin/Koordinator

-- Step 1: Add new columns if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS nip VARCHAR(50),
ADD COLUMN IF NOT EXISTS email VARCHAR(100),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Aktif';

-- Step 2: Update role column to support new values
-- Note: MySQL doesn't support ALTER ENUM directly, so we use VARCHAR temporarily
ALTER TABLE users MODIFY COLUMN role VARCHAR(20);

-- Step 3: Migrate existing roles
UPDATE users SET role = 'Koordinator' WHERE role = 'pimpinan';
UPDATE users SET role = 'Admin' WHERE role = 'petugas';

-- Step 4: Set default status for existing records
UPDATE users SET status = 'Aktif' WHERE status IS NULL OR status = '';

-- Step 5: Convert role back to ENUM with new values
ALTER TABLE users MODIFY COLUMN role ENUM('Admin','Koordinator') DEFAULT 'Admin';

-- Step 6: Update existing default users with sample data
UPDATE users 
SET 
  nip = '197501011998021001',
  email = 'ahmad.fauzi@univ.ac.id',
  status = 'Aktif'
WHERE username = 'koordinator';

UPDATE users 
SET 
  nip = '198001152005011002',
  email = 'admin.ppm@univ.ac.id',
  status = 'Aktif',
  nama = 'Admin PPM'
WHERE username = 'staff';

-- Update username 'staff' to 'admin' if it exists
UPDATE users SET username = 'admin' WHERE username = 'staff';

-- Verification queries
SELECT 'Migration completed successfully!' as message;
SELECT id, nama, username, nip, email, role, status, created_at FROM users ORDER BY id;
