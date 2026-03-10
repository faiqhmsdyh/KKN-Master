-- Simplify master_dosen structure to match Excel format
-- Only keep: id_dosen, nip, nama, email, no_telepon, prodi

-- Drop existing table and recreate with simplified structure
DROP TABLE IF EXISTS master_dosen;

CREATE TABLE master_dosen (
  id_dosen VARCHAR(10) PRIMARY KEY,
  nip VARCHAR(20) NOT NULL UNIQUE,
  nama VARCHAR(255) NOT NULL,
  email VARCHAR(255) DEFAULT NULL,
  no_telepon VARCHAR(20) DEFAULT NULL,
  prodi VARCHAR(255) DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for faster lookup
CREATE INDEX idx_nama ON master_dosen(nama);
CREATE INDEX idx_nip ON master_dosen(nip);
CREATE INDEX idx_active ON master_dosen(is_active);

-- Insert sample data
INSERT INTO master_dosen (id_dosen, nip, nama, email, no_telepon, prodi, is_active) VALUES
('D001', '19800101', 'Ahmad Fauzi', 'ahmad.fauzi@kampus.ac.id', '81234567801', 'Informatika', 1),
('D002', '19800202', 'Siti Nurhaliza', 'siti.nurhaliza@kampus.ac.id', '81234567802', 'Informatika', 1),
('D003', '19800303', 'Budi Santoso', 'budi.santoso@kampus.ac.id', '81234567803', 'Sistem Informasi', 1);
