-- ========================================
-- Create master_dosen table
-- Purpose: Store DPL (Dosen Pembimbing Lapangan) master data
-- Date: 2026-03-05
-- ========================================

CREATE TABLE IF NOT EXISTS master_dosen (
  id_dosen INT AUTO_INCREMENT PRIMARY KEY,
  nip VARCHAR(50) UNIQUE NOT NULL,
  nama_dosen VARCHAR(255) NOT NULL,
  nidn VARCHAR(50),
  prodi VARCHAR(100),
  fakultas VARCHAR(100),
  email VARCHAR(150),
  no_telepon VARCHAR(20),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_nama (nama_dosen),
  INDEX idx_nip (nip),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: Insert sample data
INSERT INTO master_dosen (nip, nama_dosen, nidn, prodi, fakultas, email, no_telepon) VALUES
('198901012015041001', 'Dr. Budi Santoso, M.T.', '0101018901', 'Teknik Informatika', 'Fakultas Teknik', 'budi.santoso@univ.ac.id', '081234567890'),
('199002012016042002', 'Dr. Siti Nurhaliza, M.Kom.', '0102019902', 'Sistem Informasi', 'Fakultas Teknik', 'siti.nurhaliza@univ.ac.id', '081234567891'),
('198803012017043003', 'Prof. Dr. Ahmad Fauzi, M.Sc.', '0103018803', 'Manajemen', 'Fakultas Ekonomi', 'ahmad.fauzi@univ.ac.id', '081234567892');
