require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const multer = require('multer');
const XLSX = require('xlsx');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const autogroupService = require('./services/autogroupService');
const { exportGroupingToExcel, exportHasilAutogrupToExcel } = require('./services/excelExportService');

const app = express();
const PORT = process.env.PORT || 4000;

// Increase body parser limit to handle large file uploads
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

console.log('Creating MySQL pool with:', { host: process.env.DB_HOST, user: process.env.DB_USER, database: process.env.DB_NAME });

// Create connection pool (callback-based)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'otomatisasi',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.on('error', (err) => {
  console.error('Pool error:', err);
});

pool.on('connection', () => {
  console.log('Pool: new connection created');
});

// Simple CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify email configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration error:', error.message);
    console.log('💡 Pastikan EMAIL_USER dan EMAIL_PASS sudah diisi di .env');
  } else {
    console.log('✓ Email server ready');
  }
});

// ================================================
// WILAYAH TABLES (Provinsi, Kabupaten, Kecamatan, Desa)
// ================================================

// Create table provinsi
console.log('Creating table provinsi...');
pool.query(`
  CREATE TABLE IF NOT EXISTS provinsi (
    id_provinsi VARCHAR(2) PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    INDEX idx_nama (nama)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => {
  if (err) {
    console.error('CREATE TABLE provinsi error:', err);
  } else {
    console.log('✓ Table provinsi ready');
    
    // Insert all 34 Indonesian provinces if table is empty
    pool.query('SELECT COUNT(*) as count FROM provinsi', (countErr, countResult) => {
      if (!countErr && countResult[0].count === 0) {
        pool.query(`
          INSERT INTO provinsi (id_provinsi, nama) VALUES 
          ('11', 'Aceh'),
          ('12', 'Sumatera Utara'),
          ('13', 'Sumatera Barat'),
          ('14', 'Riau'),
          ('15', 'Jambi'),
          ('16', 'Sumatera Selatan'),
          ('17', 'Bengkulu'),
          ('18', 'Lampung'),
          ('19', 'Kepulauan Bangka Belitung'),
          ('21', 'Kepulauan Riau'),
          ('31', 'DKI Jakarta'),
          ('32', 'Jawa Barat'),
          ('33', 'Jawa Tengah'),
          ('34', 'DI Yogyakarta'),
          ('35', 'Jawa Timur'),
          ('36', 'Banten'),
          ('51', 'Bali'),
          ('52', 'Nusa Tenggara Barat'),
          ('53', 'Nusa Tenggara Timur'),
          ('61', 'Kalimantan Barat'),
          ('62', 'Kalimantan Tengah'),
          ('63', 'Kalimantan Selatan'),
          ('64', 'Kalimantan Timur'),
          ('65', 'Kalimantan Utara'),
          ('71', 'Sulawesi Utara'),
          ('72', 'Sulawesi Tengah'),
          ('73', 'Sulawesi Selatan'),
          ('74', 'Sulawesi Tenggara'),
          ('75', 'Gorontalo'),
          ('76', 'Sulawesi Barat'),
          ('81', 'Maluku'),
          ('82', 'Maluku Utara'),
          ('91', 'Papua Barat'),
          ('94', 'Papua')
        `, (insertErr) => {
          if (insertErr) console.error('Insert provinsi error:', insertErr);
          else console.log('✓ All 34 Indonesian provinces inserted');
        });
      }
    });
  }
});

// Create table kabupaten
console.log('Creating table kabupaten...');
pool.query(`
  CREATE TABLE IF NOT EXISTS kabupaten (
    id_kabupaten VARCHAR(5) PRIMARY KEY,
    id_provinsi VARCHAR(2) NOT NULL,
    nama VARCHAR(100) NOT NULL,
    INDEX idx_provinsi (id_provinsi),
    INDEX idx_nama (nama),
    FOREIGN KEY (id_provinsi) REFERENCES provinsi(id_provinsi) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => {
  if (err) {
    console.error('CREATE TABLE kabupaten error:', err);
  } else {
    console.log('✓ Table kabupaten ready');
    
    // Insert sample data for selected kabupaten
    pool.query('SELECT COUNT(*) as count FROM kabupaten', (countErr, countResult) => {
      if (!countErr && countResult[0].count === 0) {
        pool.query(`
          INSERT INTO kabupaten (id_kabupaten, id_provinsi, nama) VALUES 
          ('35.73', '35', 'Kab. Kediri'),
          ('35.78', '35', 'Kab. Malang'),
          ('35.76', '35', 'Kab. Jombang'),
          ('33.01', '33', 'Kab. Cilacap'),
          ('32.01', '32', 'Kab. Bogor')
        `, (insertErr) => {
          if (insertErr) console.error('Insert sample kabupaten error:', insertErr);
          else console.log('✓ Sample kabupaten data inserted');
        });
      }
    });
  }
});

// Create table kecamatan
console.log('Creating table kecamatan...');
pool.query(`
  CREATE TABLE IF NOT EXISTS kecamatan (
    id_kecamatan VARCHAR(8) PRIMARY KEY,
    id_kabupaten VARCHAR(5) NOT NULL,
    nama VARCHAR(100) NOT NULL,
    INDEX idx_kabupaten (id_kabupaten),
    INDEX idx_nama (nama),
    FOREIGN KEY (id_kabupaten) REFERENCES kabupaten(id_kabupaten) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => {
  if (err) {
    console.error('CREATE TABLE kecamatan error:', err);
  } else {
    console.log('✓ Table kecamatan ready');
    
    // Insert sample data for selected kecamatan
    pool.query('SELECT COUNT(*) as count FROM kecamatan', (countErr, countResult) => {
      if (!countErr && countResult[0].count === 0) {
        pool.query(`
          INSERT INTO kecamatan (id_kecamatan, id_kabupaten, nama) VALUES 
          ('35.73.05', '35.73', 'Gurah'),
          ('35.73.06', '35.73', 'Pagu'),
          ('35.73.07', '35.73', 'Kepung'),
          ('35.78.01', '35.78', 'Donomulyo'),
          ('35.78.02', '35.78', 'Kalipare')
        `, (insertErr) => {
          if (insertErr) console.error('Insert sample kecamatan error:', insertErr);
          else console.log('✓ Sample kecamatan data inserted');
        });
      }
    });
  }
});

// Create table desa
console.log('Creating table desa...');
pool.query(`
  CREATE TABLE IF NOT EXISTS desa (
    id_desa VARCHAR(13) PRIMARY KEY,
    id_kecamatan VARCHAR(8) NOT NULL,
    nama VARCHAR(100) NOT NULL,
    INDEX idx_kecamatan (id_kecamatan),
    INDEX idx_nama (nama),
    FOREIGN KEY (id_kecamatan) REFERENCES kecamatan(id_kecamatan) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => {
  if (err) {
    console.error('CREATE TABLE desa error:', err);
  } else {
    console.log('✓ Table desa ready');
    
    // Insert sample data for selected desa
    pool.query('SELECT COUNT(*) as count FROM desa', (countErr, countResult) => {
      if (!countErr && countResult[0].count === 0) {
        pool.query(`
          INSERT INTO desa (id_desa, id_kecamatan, nama) VALUES 
          ('35.73.05.2001', '35.73.05', 'Gurah'),
          ('35.73.05.2002', '35.73.05', 'Sempu'),
          ('35.73.05.2003', '35.73.05', 'Pojok'),
          ('35.73.06.2001', '35.73.06', 'Pagu'),
          ('35.73.06.2002', '35.73.06', 'Kepuhrejo'),
          ('35.73.07.2001', '35.73.07', 'Kepung'),
          ('35.73.07.2002', '35.73.07', 'Tanjungsari'),
          ('35.78.01.2001', '35.78.01', 'Donomulyo'),
          ('35.78.02.2001', '35.78.02', 'Kalipare')
        `, (insertErr) => {
          if (insertErr) console.error('Insert sample desa error:', insertErr);
          else console.log('✓ Sample desa data inserted');
        });
      }
    });
  }
});

// NOTE: Old lokasi table removed - using data_lokasi_kkn instead

// Create new table data_lokasi_kkn per latest schema (with FK fields for wilayah)
console.log('Creating table data_lokasi_kkn...');
pool.query(`
  CREATE TABLE IF NOT EXISTS data_lokasi_kkn (
    id_lokasi INT AUTO_INCREMENT PRIMARY KEY,
    lokasi VARCHAR(150),
    desa VARCHAR(100),
    kecamatan VARCHAR(100),
    kabupaten VARCHAR(100),
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    jarak_ke_puskesmas DECIMAL(5,2) NULL,
    puskesmas_terdekat VARCHAR(200) NULL,
    kategori_jarak VARCHAR(20) NULL,
    id_periode INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_periode (id_periode)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => {
  if (err) console.error('CREATE TABLE data_lokasi_kkn error:', err);
  else console.log('✓ Table data_lokasi_kkn ready');
  
  // Tambahkan kolom jika belum ada (untuk database yang sudah exist)
  pool.query(`
    ALTER TABLE data_lokasi_kkn 
    ADD COLUMN IF NOT EXISTS jarak_ke_puskesmas DECIMAL(5,2) NULL,
    ADD COLUMN IF NOT EXISTS puskesmas_terdekat VARCHAR(200) NULL,
    ADD COLUMN IF NOT EXISTS kategori_jarak VARCHAR(20) NULL,
    ADD COLUMN IF NOT EXISTS id_periode INT NULL,
    ADD INDEX IF NOT EXISTS idx_periode (id_periode)
  `, (alterErr) => {
    if (alterErr && !alterErr.message.includes('Duplicate column') && !alterErr.message.includes('Duplicate key')) {
      console.error('ALTER TABLE error:', alterErr);
    } else {
      console.log('✓ Ensured id_periode column exists on data_lokasi_kkn');
    }
  });
});

// Create table periode_kkn for managing KKN periods
console.log('Creating table periode_kkn...');
pool.query(`
  CREATE TABLE IF NOT EXISTS periode_kkn (
    id_periode INT AUTO_INCREMENT PRIMARY KEY,
    nama_periode VARCHAR(100) NOT NULL,
    tahun_akademik VARCHAR(20),
    angkatan VARCHAR(50),
    tanggal_mulai DATE NULL,
    tanggal_selesai DATE NULL,
    is_active BOOLEAN DEFAULT 0,
    jumlah_lokasi INT DEFAULT 0,
    jumlah_dosen INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_active (is_active),
    INDEX idx_tahun (tahun_akademik)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => {
  if (err) console.error('CREATE TABLE periode_kkn error:', err);
  else {
    console.log('✓ Table periode_kkn ready');
    
    // Auto-seed periode 2024/2025 if not exists
    pool.query(`
      SELECT id_periode FROM periode_kkn WHERE angkatan = '2024' LIMIT 1
    `, (checkErr, rows) => {
      if (checkErr) {
        console.error('Error checking periode 2024:', checkErr);
        return;
      }
      
      if (rows.length === 0) {
        // Insert periode 2024/2025
        console.log('⚙️ Creating periode 2024/2025...');
        pool.query(`
          INSERT INTO periode_kkn (nama_periode, tahun_akademik, angkatan, is_active, tanggal_mulai, tanggal_selesai)
          VALUES ('KKN 2024/2025', '2024/2025', '2024', 1, '2024-07-01', '2025-06-30')
        `, (insertErr, result) => {
          if (insertErr) {
            console.error('❌ Error creating periode 2024/2025:', insertErr.message);
            return;
          }
          
          const newPeriodeId = result.insertId;
          console.log(`✅ Periode 2024/2025 created with ID: ${newPeriodeId}`);
          
          // Update all dosen with NULL id_periode to use this periode
          pool.query(`
            UPDATE data_dosen 
            SET id_periode = ?
            WHERE id_periode IS NULL
          `, [newPeriodeId], (updateErr, updateResult) => {
            if (updateErr) {
              console.error('❌ Error updating dosen to periode 2024/2025:', updateErr.message);
            } else if (updateResult.affectedRows > 0) {
              console.log(`✅ ${updateResult.affectedRows} dosen assigned to periode 2024/2025`);
            } else {
              console.log('✓ No dosen needed periode assignment');
            }
          });
        });
      } else {
        console.log('✓ Periode 2024/2025 already exists');
        
        // Still try to update NULL periode dosens to existing 2024 periode
        const existingPeriodeId = rows[0].id_periode;
        pool.query(`
          UPDATE data_dosen 
          SET id_periode = ?
          WHERE id_periode IS NULL
        `, [existingPeriodeId], (updateErr, updateResult) => {
          if (updateErr) {
            console.error('❌ Error updating dosen to existing periode:', updateErr.message);
          } else if (updateResult.affectedRows > 0) {
            console.log(`✅ ${updateResult.affectedRows} dosen assigned to periode 2024/2025`);
          }
        });
      }
    });
  }
});

// Ensure created_at column exists for older installs
pool.query(`ALTER TABLE data_lokasi_kkn ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`, (err) => {
  if (err) {
    console.error('ALTER TABLE add created_at error (may be OK on some MySQL versions):', err.message);
  } else {
    console.log('✓ ensured created_at column exists on data_lokasi_kkn');
  }
});

// Ensure kontak_person column exists
pool.query(`ALTER TABLE data_lokasi_kkn ADD COLUMN IF NOT EXISTS kontak_person TEXT NULL;`, (err) => {
  if (err) {
    console.error('ALTER TABLE add kontak_person error (may be OK on some MySQL versions):', err.message);
  } else {
    console.log('✓ ensured kontak_person column exists on data_lokasi_kkn');
  }
});

// Migration: Add jumlah_dosen column to periode_kkn if not exists
console.log('Checking if jumlah_dosen column exists in periode_kkn...');
pool.query(`
  SELECT COLUMN_NAME 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'periode_kkn' 
    AND COLUMN_NAME = 'jumlah_dosen'
`, (err, rows) => {
  if (err) {
    console.error('Error checking jumlah_dosen column:', err);
    return;
  }
  
  if (rows.length === 0) {
    // Column doesn't exist, add it
    console.log('⚙️ Adding jumlah_dosen column to periode_kkn...');
    pool.query(`
      ALTER TABLE periode_kkn 
      ADD COLUMN jumlah_dosen INT DEFAULT 0 AFTER jumlah_lokasi
    `, (alterErr) => {
      if (alterErr) {
        console.error('❌ Error adding jumlah_dosen column:', alterErr.message);
      } else {
        console.log('✅ Column jumlah_dosen added successfully to periode_kkn');
        // Immediately update counts for all periodes
        updateAllPeriodeSummary();
      }
    });
  } else {
    console.log('✓ Column jumlah_dosen already exists in periode_kkn');
  }
});

// Helper function to update periode summary counts (lokasi + dosen)
function updatePeriodeSummary(id_periode, callback) {
  if (!id_periode) {
    if (callback) callback(new Error('id_periode is required'));
    return;
  }
  
  // Count lokasi
  pool.query(
    'SELECT COUNT(*) as count FROM data_lokasi_kkn WHERE id_periode = ?',
    [id_periode],
    (err1, lokasiResult) => {
      if (err1) {
        console.error('Error counting lokasi:', err1);
        if (callback) callback(err1);
        return;
      }
      
      const jumlah_lokasi = lokasiResult[0].count;
      
      // Count dosen
      pool.query(
        'SELECT COUNT(*) as count FROM data_dosen WHERE id_periode = ?',
        [id_periode],
        (err2, dosenResult) => {
          if (err2) {
            console.error('Error counting dosen:', err2);
            if (callback) callback(err2);
            return;
          }
          
          const jumlah_dosen = dosenResult[0].count;
          
          // Update periode_kkn
          pool.query(
            'UPDATE periode_kkn SET jumlah_lokasi = ?, jumlah_dosen = ? WHERE id_periode = ?',
            [jumlah_lokasi, jumlah_dosen, id_periode],
            (err3) => {
              if (err3) {
                console.error('Error updating periode summary:', err3);
                if (callback) callback(err3);
              } else {
                console.log(`✓ Updated periode ${id_periode}: ${jumlah_lokasi} lokasi, ${jumlah_dosen} dosen`);
                if (callback) callback(null, { jumlah_lokasi, jumlah_dosen });
              }
            }
          );
        }
      );
    }
  );
}

// Function to update summary for all periodes
function updateAllPeriodeSummary() {
  console.log('🔄 Updating summary for all periodes...');
  pool.query('SELECT id_periode FROM periode_kkn', (err, rows) => {
    if (err) {
      console.error('Error fetching periodes:', err);
      return;
    }
    
    let completed = 0;
    const total = rows.length;
    
    if (total === 0) {
      console.log('✓ No periodes to update');
      return;
    }
    
    rows.forEach(row => {
      updatePeriodeSummary(row.id_periode, (err) => {
        completed++;
        if (completed === total) {
          console.log(`✅ Updated ${total} periode(s) summary successfully`);
        }
      });
    });
  });
}

// Ensure wilayah ID columns exist (id_provinsi, id_kabupaten, id_kecamatan, id_desa)
console.log('Checking wilayah ID columns in data_lokasi_kkn...');
pool.query(`
  SELECT COLUMN_NAME 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'data_lokasi_kkn' 
    AND COLUMN_NAME IN ('id_provinsi', 'id_kabupaten', 'id_kecamatan', 'id_desa')
`, (err, rows) => {
  if (err) {
    console.error('Error checking wilayah columns:', err);
    return;
  }
  
  const existingCols = rows.map(r => r.COLUMN_NAME);
  const neededCols = ['id_provinsi', 'id_kabupaten', 'id_kecamatan', 'id_desa'];
  const missingCols = neededCols.filter(col => !existingCols.includes(col));
  
  if (missingCols.length > 0) {
    console.log(`⚙️ Adding wilayah ID columns: ${missingCols.join(', ')}`);
    
    let alterQuery = 'ALTER TABLE data_lokasi_kkn ';
    const alterParts = [];
    
    if (missingCols.includes('id_provinsi')) {
      alterParts.push('ADD COLUMN id_provinsi VARCHAR(2) NULL AFTER lokasi');
    }
    if (missingCols.includes('id_kabupaten')) {
      alterParts.push('ADD COLUMN id_kabupaten VARCHAR(5) NULL AFTER id_provinsi');
    }
    if (missingCols.includes('id_kecamatan')) {
      alterParts.push('ADD COLUMN id_kecamatan VARCHAR(8) NULL AFTER id_kabupaten');
    }
    if (missingCols.includes('id_desa')) {
      alterParts.push('ADD COLUMN id_desa VARCHAR(13) NULL AFTER id_kecamatan');
    }
    
    alterQuery += alterParts.join(', ');
    
    pool.query(alterQuery, (alterErr) => {
      if (alterErr) {
        console.error('❌ Error adding wilayah ID columns:', alterErr.message);
      } else {
        console.log('✅ Wilayah ID columns added successfully');
        
        // Add indexes for better query performance
        pool.query(`
          ALTER TABLE data_lokasi_kkn 
          ADD INDEX IF NOT EXISTS idx_provinsi (id_provinsi),
          ADD INDEX IF NOT EXISTS idx_kabupaten (id_kabupaten),
          ADD INDEX IF NOT EXISTS idx_kecamatan (id_kecamatan),
          ADD INDEX IF NOT EXISTS idx_desa (id_desa)
        `, (idxErr) => {
          if (idxErr && !idxErr.message.includes('Duplicate key')) {
            console.error('⚠️ Error adding indexes (non-critical):', idxErr.message);
          } else {
            console.log('✅ Wilayah ID indexes ensured');
          }
        });
      }
    });
  } else {
    console.log('✓ All wilayah ID columns already exist');
  }
});

// Ensure fakes column exists for older installs
pool.query(`ALTER TABLE lokasi ADD COLUMN IF NOT EXISTS fakes BOOLEAN DEFAULT 0;`, (err) => {
  if (err) {
    // Not critical, log and continue
    console.error('ALTER TABLE add fakes error (may be OK on some MySQL versions):', err.message);
  } else {
    console.log('✓ ensured fakes column exists on lokasi');
  }
});


// Create table hasil_autogrup for storing autogroup results
console.log('Creating table hasil_autogrup...');
pool.query(`
  CREATE TABLE IF NOT EXISTS hasil_autogrup (
    id_hasil INT AUTO_INCREMENT PRIMARY KEY,
    id_konfigurasi INT,
    angkatan_kkn VARCHAR(50),
    nama_aturan VARCHAR(255),
    jumlah_kelompok INT NOT NULL,
    jumlah_mahasiswa INT NOT NULL,
    jumlah_lokasi INT DEFAULT 0,
    data_kelompok LONGTEXT NOT NULL,
    konfigurasi_snapshot JSON,
    statistik JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_angkatan (angkatan_kkn),
    INDEX idx_konfigurasi (id_konfigurasi)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => {
  if (err) {
    console.error('CREATE TABLE hasil_autogrup error:', err);
  } else {
    console.log('✓ Table hasil_autogrup ready');
    
    // Migration: Fix angkatan_kkn data type from INT to VARCHAR if needed
    pool.query(`
      ALTER TABLE hasil_autogrup 
      MODIFY COLUMN angkatan_kkn VARCHAR(50);
    `, (alterErr) => {
      if (alterErr) {
        console.log('ALTER hasil_autogrup.angkatan_kkn skipped:', alterErr.message);
      } else {
        console.log('✓ Fixed angkatan_kkn column type to VARCHAR');
      }
    });
  }
});

// Create table detail_hasil_autogrup for storing per-student results
console.log('Creating table detail_hasil_autogrup...');
pool.query(`
  CREATE TABLE IF NOT EXISTS detail_hasil_autogrup (
    id_detail INT AUTO_INCREMENT PRIMARY KEY,
    id_hasil INT NOT NULL,
    nomor_kelompok INT NOT NULL,
    id_lokasi INT,
    lokasi VARCHAR(150),
    desa VARCHAR(100),
    kecamatan VARCHAR(100),
    kabupaten VARCHAR(100),
    id_dosen VARCHAR(10) DEFAULT NULL,
    nim VARCHAR(50) NOT NULL,
    nama VARCHAR(255) NOT NULL,
    prodi VARCHAR(100),
    fakultas VARCHAR(100),
    jenis_kelamin VARCHAR(20),
    nomor_telepon VARCHAR(20),
    kesehatan VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_hasil (id_hasil),
    INDEX idx_kelompok (nomor_kelompok),
    INDEX idx_dosen (id_dosen),
    CONSTRAINT fk_detail_hasil_dosen FOREIGN KEY (id_dosen) 
      REFERENCES data_dosen(id_dosen) ON DELETE SET NULL ON UPDATE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => {
  if (err) {
    console.error('CREATE TABLE detail_hasil_autogrup error:', err);
  } else {
    console.log('✓ Table detail_hasil_autogrup ready');
  }
});

// NOTE: Old grouping_results table removed - using detail_hasil_autogrup for new grouping system

// Create table data_dosen for DPL management (simplified structure)
console.log('Creating table data_dosen...');
pool.query(`
  CREATE TABLE IF NOT EXISTS data_dosen (
    id_dosen VARCHAR(10) PRIMARY KEY,
    nip VARCHAR(20) NOT NULL UNIQUE,
    nama VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT NULL,
    no_telepon VARCHAR(20) DEFAULT NULL,
    prodi VARCHAR(255) DEFAULT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nama (nama),
    INDEX idx_nip (nip),
    INDEX idx_active (is_active)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`, (err) => {
  if (err) {
    console.error('CREATE TABLE data_dosen error:', err);
  } else {
    console.log('✓ Table data_dosen ready');
  }
});

// Migration: Add id_dosen column to detail_hasil_autogrup if not exists
console.log('Checking if id_dosen column exists in detail_hasil_autogrup...');
pool.query(`
  SELECT COLUMN_NAME 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'detail_hasil_autogrup' 
    AND COLUMN_NAME = 'id_dosen'
`, (err, rows) => {
  if (err) {
    console.error('Error checking id_dosen column:', err);
    return;
  }
  
  if (rows.length === 0) {
    // Column doesn't exist, add it
    console.log('⚙️ Adding id_dosen column to detail_hasil_autogrup...');
    pool.query(`
      ALTER TABLE detail_hasil_autogrup 
      ADD COLUMN id_dosen VARCHAR(10) DEFAULT NULL AFTER kabupaten,
      ADD INDEX idx_dosen (id_dosen)
    `, (alterErr) => {
      if (alterErr) {
        // Check if error is because index already exists
        if (alterErr.code === 'ER_DUP_KEYNAME') {
          console.log('✓ Index idx_dosen already exists');
          // Try adding column without index
          pool.query(`
            ALTER TABLE detail_hasil_autogrup 
            ADD COLUMN id_dosen VARCHAR(10) DEFAULT NULL AFTER kabupaten
          `, (alterErr2) => {
            if (alterErr2 && alterErr2.code !== 'ER_DUP_FIELDNAME') {
              console.error('❌ Error adding id_dosen column:', alterErr2.message);
            } else {
              console.log('✅ Column id_dosen added successfully');
              // Try to add foreign key
              addForeignKeyToDosen();
            }
          });
        } else if (alterErr.code === 'ER_DUP_FIELDNAME') {
          console.log('✓ Column id_dosen already exists');
        } else {
          console.error('❌ Error adding id_dosen column:', alterErr.message);
        }
      } else {
        console.log('✅ Column id_dosen added successfully');
        // Try to add foreign key
        addForeignKeyToDosen();
      }
    });
  } else {
    console.log('✓ Column id_dosen already exists');
    // Check if foreign key exists
    addForeignKeyToDosen();
  }
});

// Migration: Add nomor_telepon column to detail_hasil_autogrup if not exists
console.log('Checking if nomor_telepon column exists in detail_hasil_autogrup...');
pool.query(`
  SELECT COLUMN_NAME 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'detail_hasil_autogrup' 
    AND COLUMN_NAME = 'nomor_telepon'
`, (err, rows) => {
  if (err) {
    console.error('Error checking nomor_telepon column:', err);
    return;
  }
  
  if (rows.length === 0) {
    // Column doesn't exist, add it
    console.log('⚙️ Adding nomor_telepon column to detail_hasil_autogrup...');
    pool.query(`
      ALTER TABLE detail_hasil_autogrup 
      ADD COLUMN nomor_telepon VARCHAR(20) AFTER jenis_kelamin
    `, (alterErr) => {
      if (alterErr) {
        if (alterErr.code === 'ER_DUP_FIELDNAME') {
          console.log('✓ Column nomor_telepon already exists');
        } else {
          console.error('❌ Error adding nomor_telepon column:', alterErr.message);
        }
      } else {
        console.log('✅ Column nomor_telepon added successfully to detail_hasil_autogrup');
      }
    });
  } else {
    console.log('✓ Column nomor_telepon already exists in detail_hasil_autogrup');
  }
});

// Migration: Add periode column to data_dosen if not exists
// Migration: Change periode from VARCHAR to INT and add foreign key to periode_kkn
console.log('Checking if id_periode column exists in data_dosen...');
pool.query(`
  SELECT COLUMN_NAME, DATA_TYPE
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'data_dosen' 
    AND COLUMN_NAME IN ('periode', 'id_periode')
`, (err, rows) => {
  if (err) {
    console.error('Error checking periode/id_periode column:', err);
    return;
  }
  
  const hasOldPeriode = rows.find(r => r.COLUMN_NAME === 'periode');
  const hasIdPeriode = rows.find(r => r.COLUMN_NAME === 'id_periode');
  
  if (hasOldPeriode && !hasIdPeriode) {
    // Migration: Rename periode to id_periode and change type
    console.log('⚙️ Migrating periode column to id_periode (INT) with FK...');
    
    // Step 1: Add new id_periode column
    pool.query(`
      ALTER TABLE data_dosen 
      ADD COLUMN id_periode INT DEFAULT NULL AFTER prodi
    `, (alterErr) => {
      if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') {
        console.error('❌ Error adding id_periode column:', alterErr.message);
        return;
      }
      
      // Step 2: Migrate data from periode (VARCHAR) to id_periode (INT)
      // Match year in periode field to angkatan in periode_kkn
      // Fix collation mismatch by using CAST or COLLATE
      pool.query(`
        UPDATE data_dosen d
        LEFT JOIN periode_kkn p ON CAST(p.angkatan AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci = CAST(d.periode AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci
        SET d.id_periode = p.id_periode
        WHERE d.periode IS NOT NULL AND d.periode REGEXP '^[0-9]{4}$'
      `, (updateErr) => {
        if (updateErr) {
          console.log('⚠️ Warning: Could not migrate old periode data:', updateErr.message);
        } else {
          console.log('✓ Migrated old periode data to id_periode');
        }
        
        // Step 3: Drop old periode column
        pool.query(`ALTER TABLE data_dosen DROP COLUMN periode`, (dropErr) => {
          if (dropErr && dropErr.code !== 'ER_CANT_DROP_FIELD_OR_KEY') {
            console.log('⚠️ Could not drop old periode column:', dropErr.message);
          } else {
            console.log('✓ Dropped old periode VARCHAR column');
          }
          
          // Step 4: Add foreign key constraint
          pool.query(`
            SELECT CONSTRAINT_NAME 
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = 'data_dosen' 
              AND CONSTRAINT_NAME = 'fk_dosen_periode'
          `, (checkFkErr, fkRows) => {
            if (checkFkErr) {
              console.error('Error checking FK:', checkFkErr);
              return;
            }
            
            if (fkRows.length === 0) {
              pool.query(`
                ALTER TABLE data_dosen
                ADD CONSTRAINT fk_dosen_periode
                FOREIGN KEY (id_periode) REFERENCES periode_kkn(id_periode)
                ON DELETE SET NULL ON UPDATE CASCADE,
                ADD INDEX idx_id_periode (id_periode)
              `, (fkErr) => {
                if (fkErr && fkErr.code !== 'ER_DUP_KEY') {
                  console.error('❌ Error adding FK:', fkErr.message);
                } else {
                  console.log('✅ Foreign key fk_dosen_periode added successfully');
                }
              });
            } else {
              console.log('✓ Foreign key fk_dosen_periode already exists');
            }
          });
        });
      });
    });
  } else if (!hasIdPeriode) {
    // No periode column exists, add id_periode directly
    console.log('⚙️ Adding id_periode column to data_dosen...');
    pool.query(`
      ALTER TABLE data_dosen 
      ADD COLUMN id_periode INT DEFAULT NULL AFTER prodi,
      ADD CONSTRAINT fk_dosen_periode
      FOREIGN KEY (id_periode) REFERENCES periode_kkn(id_periode)
      ON DELETE SET NULL ON UPDATE CASCADE,
      ADD INDEX idx_id_periode (id_periode)
    `, (alterErr) => {
      if (alterErr) {
        if (alterErr.code === 'ER_DUP_FIELDNAME') {
          console.log('✓ Column id_periode already exists');
        } else {
          console.error('❌ Error adding id_periode column:', alterErr.message);
        }
      } else {
        console.log('✅ Column id_periode added successfully to data_dosen');
      }
    });
  } else {
    console.log('✓ Column id_periode already exists in data_dosen');
  }
});

// Helper function to add foreign key constraint
function addForeignKeyToDosen() {
  // First check if data_dosen table exists
  pool.query(`
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'data_dosen'
  `, (err, tables) => {
    if (err) {
      console.error('Error checking data_dosen table:', err);
      return;
    }
    
    if (tables.length === 0) {
      console.log('⚠️ Table data_dosen does not exist yet. Skipping foreign key creation.');
      return;
    }
    
    // Table exists, now check if foreign key already exists
    pool.query(`
      SELECT CONSTRAINT_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'detail_hasil_autogrup' 
        AND CONSTRAINT_NAME = 'fk_detail_hasil_dosen'
    `, (err, rows) => {
      if (err) {
        console.error('Error checking foreign key:', err);
        return;
      }
      
      if (rows.length === 0) {
        console.log('⚙️ Adding foreign key constraint fk_detail_hasil_dosen...');
        pool.query(`
          ALTER TABLE detail_hasil_autogrup
          ADD CONSTRAINT fk_detail_hasil_dosen
          FOREIGN KEY (id_dosen) REFERENCES data_dosen(id_dosen) 
          ON DELETE SET NULL ON UPDATE CASCADE
        `, (fkErr) => {
          if (fkErr && fkErr.code !== 'ER_DUP_KEY') {
            console.error('❌ Error adding foreign key:', fkErr.message);
            console.log('⚠️ Foreign key creation skipped. You may need to add it manually later.');
          } else {
            console.log('✅ Foreign key fk_detail_hasil_dosen added successfully');
          }
        });
      } else {
        console.log('✓ Foreign key fk_detail_hasil_dosen already exists');
      }
    });
  });
}

// Drop old users table and create new akun table
// This migration ensures clean transition from 'users' to 'akun' table
pool.query('DROP TABLE IF EXISTS users', (dropErr) => {
  if (dropErr) {
    console.error('DROP TABLE users error:', dropErr);
  } else {
    console.log('✓ Old users table dropped (if existed)');
  }
  
  // Create akun table for authentication and account management
  // Role system:
  // - 'Admin': Staff PPM with full system access (display as "Admin/Staff PPM")
  // - 'Koordinator': Koordinator PPM with coordinator portal access (display as "Koordinator PPM")
  // Note: NIP is used for authentication (login identifier)
  pool.query(`
    CREATE TABLE IF NOT EXISTS akun (
    id_akun INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    nip VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100),
    password VARCHAR(255) NOT NULL,
    role ENUM('Admin','Koordinator') DEFAULT 'Admin',
    status VARCHAR(20) DEFAULT 'Aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => {
  if (err) {
    console.error('CREATE TABLE akun error:', err);
  } else {
    console.log('✓ Table akun ready');
    
    // Add foto column if it doesn't exist
    pool.query(`
      ALTER TABLE akun 
      ADD COLUMN IF NOT EXISTS foto LONGTEXT
    `, (alterErr) => {
      if (alterErr) {
        // Try without IF NOT EXISTS for MySQL versions that don't support it
        pool.query('ALTER TABLE akun ADD COLUMN foto LONGTEXT', (err2) => {
          if (err2 && !err2.message.includes('Duplicate column')) {
            console.error('ALTER TABLE akun (add foto) error:', err2);
          }
        });
      }
    });
    
    // Insert default akun if table empty
    pool.query('SELECT COUNT(*) as count FROM akun', (countErr, countRows) => {
      if (!countErr && countRows[0].count === 0) {
        const defaultPassword = 'admin123';
        const hash = bcrypt.hashSync(defaultPassword, 8);
        
        // Insert Koordinator PPM
        pool.query('INSERT INTO akun (nama, nip, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)', 
          ['Dr. Ahmad Fauzi, M.Pd', '197501011998021001', 'ahmad.fauzi@univ.ac.id', hash, 'Koordinator', 'Aktif'], 
          (insertErr) => {
            if (insertErr) console.error('Insert koordinator error:', insertErr);
            else console.log('✓ Koordinator PPM account created (NIP: 197501011998021001, password: admin123)');
          }
        );
        
        // Insert Admin account
        pool.query('INSERT INTO akun (nama, nip, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)', 
          ['Admin PPM', '198001152005011002', 'admin.ppm@univ.ac.id', hash, 'Admin', 'Aktif'], 
          (insertErr) => {
            if (insertErr) console.error('Insert admin error:', insertErr);
            else console.log('✓ Admin PPM account created (NIP: 198001152005011002, password: admin123)');
          }
        );
      }
    });
  }
  });
});

// Create table password_resets for handling forgot password requests
console.log('Creating table password_resets...');
pool.query(`
  CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nip VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token),
    INDEX idx_nip (nip)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => {
  if (err) {
    console.error('CREATE TABLE password_resets error:', err);
  } else {
    console.log('✓ Table password_resets ready');
  }
});

// Create table kriteria with flexible tipe_data
pool.query(`
  CREATE TABLE IF NOT EXISTS kriteria (
    id_kriteria INT AUTO_INCREMENT PRIMARY KEY,
    nama_kriteria VARCHAR(100) NOT NULL,
    deskripsi TEXT,
    tipe_data ENUM('minimal','range','boolean','gender') DEFAULT 'minimal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => {
  if (err) {
    console.error('CREATE TABLE kriteria error:', err);
  } else {
    console.log('✓ Table kriteria ready');
    
    // Migration: Add columns if they don't exist
    pool.query(`ALTER TABLE kriteria ADD COLUMN IF NOT EXISTS deskripsi TEXT AFTER nama_kriteria`, () => {});
    pool.query(`ALTER TABLE kriteria ADD COLUMN IF NOT EXISTS tipe_data ENUM('minimal','range','boolean','gender') DEFAULT 'minimal' AFTER deskripsi`, () => {});
    
    // Seed default data if table is empty
    pool.query('SELECT COUNT(*) as count FROM kriteria', (countErr, countRows) => {
      if (!countErr && countRows[0].count === 0) {
        const defaultKriteria = [
          { nama: 'Jumlah Peserta per Kelompok', deskripsi: 'Rentang jumlah mahasiswa dalam satu kelompok', tipe: 'range' },
          { nama: 'Variasi Prodi', deskripsi: 'Minimal jumlah program studi berbeda dalam satu kelompok', tipe: 'minimal' },
          { nama: 'Variasi Fakultas', deskripsi: 'Minimal jumlah fakultas berbeda dalam satu kelompok', tipe: 'minimal' },
          { nama: 'Aturan Jenis Kelamin', deskripsi: 'Pengaturan distribusi jenis kelamin (campur/seimbang/dipisah)', tipe: 'gender' },
          { nama: 'Sebar Peserta Riwayat Sakit', deskripsi: 'Menyebarkan peserta dengan riwayat kesehatan ke kelompok berbeda', tipe: 'boolean' }
        ];
        
        defaultKriteria.forEach((k, index) => {
          pool.query(
            'INSERT INTO kriteria (nama_kriteria, deskripsi, tipe_data) VALUES (?, ?, ?)',
            [k.nama, k.deskripsi, k.tipe],
            (insertErr) => {
              if (!insertErr && index === defaultKriteria.length - 1) {
                console.log('✓ Default kriteria data seeded');
              }
            }
          );
        });
      }
    });
  }
});

// Create table konfigurasi_kriteria for storing parameter values
pool.query(`
  CREATE TABLE IF NOT EXISTS konfigurasi_kriteria (
    id_konfigurasi INT AUTO_INCREMENT PRIMARY KEY,
    id_kriteria INT NOT NULL,
    tahun_ajaran VARCHAR(20),
    angkatan_kkn VARCHAR(50),
    nilai_min INT DEFAULT 0,
    nilai_max INT DEFAULT 0,
    nilai_boolean BOOLEAN DEFAULT 0,
    nilai_gender VARCHAR(20) DEFAULT '',
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_kriteria) REFERENCES kriteria(id_kriteria) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => {
  if (err) {
    console.error('CREATE TABLE konfigurasi_kriteria error:', err);
  } else {
    console.log('✓ Table konfigurasi_kriteria ready');
  }
});

// Migration: Add tahun_ajaran and angkatan_kkn to konfigurasi_kriteria
pool.query(`
  ALTER TABLE konfigurasi_kriteria 
  ADD COLUMN IF NOT EXISTS tahun_ajaran VARCHAR(20),
  ADD COLUMN IF NOT EXISTS angkatan_kkn VARCHAR(50);
`, (err) => {
  if (err && !err.message.includes('Duplicate column')) {
    console.error('ADD tahun_ajaran/angkatan_kkn columns error:', err.message);
  } else {
    console.log('✓ Ensured tahun_ajaran and angkatan_kkn columns exist in konfigurasi_kriteria');
  }
});

// Migration: Update konfigurasi_kriteria default values
pool.query(`
  ALTER TABLE konfigurasi_kriteria 
  MODIFY COLUMN nilai_min INT DEFAULT 0,
  MODIFY COLUMN nilai_max INT DEFAULT 0,
  MODIFY COLUMN nilai_boolean BOOLEAN DEFAULT 0,
  MODIFY COLUMN nilai_gender VARCHAR(20) DEFAULT '';
`, (alterErr) => {
  if (alterErr) {
    console.log('ALTER konfigurasi_kriteria defaults skipped:', alterErr.message);
  } else {
    console.log('✓ Updated konfigurasi_kriteria column defaults');
    
    // Update existing NULL values to defaults
    pool.query(`
      UPDATE konfigurasi_kriteria 
      SET 
        nilai_min = COALESCE(nilai_min, 0),
        nilai_max = COALESCE(nilai_max, 0),
        nilai_boolean = COALESCE(nilai_boolean, 0),
        nilai_gender = COALESCE(nilai_gender, '');
    `, (updateErr, result) => {
      if (updateErr) {
        console.log('UPDATE NULL values skipped:', updateErr.message);
      } else if (result.affectedRows > 0) {
        console.log(`✓ Cleaned ${result.affectedRows} rows with NULL values`);
      } else {
        console.log('✓ No NULL values found in konfigurasi_kriteria');
      }
    });
  }
});

// Create table data_peserta_kkn
pool.query(`
  CREATE TABLE IF NOT EXISTS data_peserta_kkn (
    id_peserta INT AUTO_INCREMENT PRIMARY KEY,
    nim VARCHAR(50) NOT NULL,
    nama VARCHAR(255) NOT NULL,
    prodi VARCHAR(100),
    fakultas VARCHAR(100),
    jenis_kelamin VARCHAR(20),
    nomor_telepon VARCHAR(20),
    kesehatan VARCHAR(50),
    is_reguler TINYINT(1) DEFAULT 1 COMMENT '1=Reguler, 0=Tematik',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => {
  if (err) {
    console.error('CREATE TABLE data_peserta_kkn error:', err);
  } else {
    console.log('✓ Table data_peserta_kkn ready');
    // Add is_reguler column for existing databases
    pool.query(`
      ALTER TABLE data_peserta_kkn 
      ADD COLUMN IF NOT EXISTS is_reguler TINYINT(1) DEFAULT 1 COMMENT '1=Reguler, 0=Tematik'
    `, (alterErr) => {
      if (alterErr && !alterErr.message.includes('Duplicate column')) {
        console.error('ALTER TABLE add is_reguler error:', alterErr);
      } else {
        console.log('✓ Column is_reguler ready');
        // Fix existing data: set NULL values to 1 (reguler by default)
        pool.query(`UPDATE data_peserta_kkn SET is_reguler = 1 WHERE is_reguler IS NULL`, (updateErr, updateResult) => {
          if (updateErr) {
            console.error('UPDATE is_reguler NULL values error:', updateErr);
          } else if (updateResult.affectedRows > 0) {
            console.log(`✓ Fixed ${updateResult.affectedRows} records with NULL is_reguler → set to 1 (reguler)`);
          }
        });
      }
    });
  }
});

// Create table konfigurasi_autogrup (simplified - hanya untuk history/audit)
pool.query(`
  CREATE TABLE IF NOT EXISTS konfigurasi_autogrup (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_aturan VARCHAR(255) NOT NULL,
    tahun_ajaran VARCHAR(20),
    angkatan_kkn VARCHAR(50),
    kriteria_config TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => {
  if (err) {
    console.error('CREATE TABLE konfigurasi_autogrup error:', err);
  } else {
    console.log('✓ Table konfigurasi_autogrup ready (simplified)');
  }
});

// Migration: Drop unused columns from konfigurasi_autogrup
pool.query(`
  SELECT COLUMN_NAME 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = '${process.env.DB_NAME}'
    AND TABLE_NAME = 'konfigurasi_autogrup'
    AND COLUMN_NAME IN ('min_anggota_per_kelompok', 'max_anggota_per_kelompok', 'variasi_prodi', 'variasi_fakultas', 'aturan_jenis_kelamin', 'sebar_peserta_sakit');
`, (err, columns) => {
  if (!err && columns && columns.length > 0) {
    columns.forEach((col) => {
      pool.query(`ALTER TABLE konfigurasi_autogrup DROP COLUMN ${col.COLUMN_NAME}`, (dropErr) => {
        if (dropErr) {
          console.log(`Drop column ${col.COLUMN_NAME} skipped:`, dropErr.message);
        } else {
          console.log(`✓ Dropped unused column: ${col.COLUMN_NAME}`);
        }
      });
    });
  } else {
    console.log('✓ konfigurasi_autogrup schema already clean');
  }
});

// Migration: Fix angkatan_kkn data type from INT to VARCHAR
pool.query(`
  ALTER TABLE konfigurasi_autogrup 
  MODIFY COLUMN angkatan_kkn VARCHAR(50);
`, (alterErr) => {
  if (alterErr) {
    console.log('ALTER konfigurasi_autogrup.angkatan_kkn skipped:', alterErr.message);
  } else {
    console.log('✓ Fixed angkatan_kkn column type to VARCHAR in konfigurasi_autogrup');
  }
});

// ======================== USER AUTH & MANAGEMENT ========================

// Login endpoint - uses NIP for authentication
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body; // 'username' field contains NIP value from frontend
  if (!username || !password) return res.status(400).json({ error: 'NIP and password required' });

  pool.query('SELECT * FROM akun WHERE nip = ?', [username], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows || rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    const match = bcrypt.compareSync(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    // Return basic user info (no token for now)
    res.json({ 
      id_akun: user.id_akun, 
      nama: user.nama, 
      nip: user.nip,
      email: user.email,
      role: user.role,
      foto: user.foto 
    });
  });
});

// Forgot Password - Send reset link via email
app.post('/api/auth/forgot-password', (req, res) => {
  const { nip, email } = req.body;
  
  if (!nip || !email) {
    return res.status(400).json({ error: 'NIP dan Email wajib diisi' });
  }

  // Verify NIP and email match in database
  pool.query('SELECT * FROM akun WHERE nip = ? AND email = ?', [nip, email], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
    
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'NIP dan Email tidak cocok atau tidak terdaftar' });
    }

    const user = rows[0];
    
    // Generate random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    // Save token to database
    pool.query(
      'INSERT INTO password_resets (nip, email, token, expires_at) VALUES (?, ?, ?, ?)',
      [nip, email, token, expiresAt],
      (insertErr) => {
        if (insertErr) {
          console.error('Insert token error:', insertErr);
          return res.status(500).json({ error: 'Gagal menyimpan token reset' });
        }

        // Create reset link
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

        // Send email
        const mailOptions = {
          from: process.env.EMAIL_FROM,
          to: email,
          subject: 'Reset Password - KKN MASTER',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: 'Poppins', sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; background: #3b82f6; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                .info-box { background: white; padding: 15px; border-left: 4px solid #3b82f6; margin: 15px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Reset Password</h1>
                  <p>KKN MASTER - Lembaga Penelitian dan Pengabdian Masyarakat</p>
                </div>
                <div class="content">
                  <p>Halo <strong>${user.nama}</strong>,</p>
                  <p>Kami menerima permintaan untuk reset password akun Anda. Klik tombol di bawah untuk membuat password baru:</p>
                  
                  <div style="text-align: center;">
                    <a href="${resetLink}" class="button">Reset Password</a>
                  </div>
                  
                  <div class="info-box">
                    <strong>Informasi Akun:</strong><br>
                    NIP: ${nip}<br>
                    Email: ${email}
                  </div>
                  
                  <p><strong>⚠️ Penting:</strong></p>
                  <ul>
                    <li>Link ini berlaku selama <strong>1 jam</strong></li>
                    <li>Jika Anda tidak merasa meminta reset password, abaikan email ini</li>
                    <li>Jangan bagikan link ini kepada siapapun</li>
                  </ul>
                  
                  <p>Atau copy link berikut ke browser Anda:</p>
                  <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 5px; font-size: 12px;">${resetLink}</p>
                </div>
                <div class="footer">
                  <p>Email ini dikirim secara otomatis, mohon tidak membalas.</p>
                  <p>&copy; 2026 KKN MASTER - Lembaga Penelitian dan Pengabdian Masyarakat</p>
                </div>
              </div>
            </body>
            </html>
          `
        };

        transporter.sendMail(mailOptions, (emailErr, info) => {
          if (emailErr) {
            console.error('Send email error:', emailErr);
            return res.status(500).json({ error: 'Gagal mengirim email. Pastikan konfigurasi email sudah benar.' });
          }
          
          console.log('Reset email sent:', info.messageId);
          res.json({ 
            message: 'Link reset password telah dikirim ke email Anda',
            email: email 
          });
        });
      }
    );
  });
});

// Reset Password - Verify token and update password
app.post('/api/auth/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token dan password baru wajib diisi' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password minimal 6 karakter' });
  }

  // Find valid token
  pool.query(
    'SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > NOW()',
    [token],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Terjadi kesalahan server' });
      }
      
      if (!rows || rows.length === 0) {
        return res.status(400).json({ error: 'Token tidak valid atau sudah kadaluarsa' });
      }

      const resetRequest = rows[0];
      const hash = bcrypt.hashSync(newPassword, 8);

      // Update password
      pool.query(
        'UPDATE akun SET password = ? WHERE nip = ?',
        [hash, resetRequest.nip],
        (updateErr) => {
          if (updateErr) {
            console.error('Update password error:', updateErr);
            return res.status(500).json({ error: 'Gagal mengubah password' });
          }

          // Mark token as used
          pool.query(
            'UPDATE password_resets SET used = 1 WHERE id = ?',
            [resetRequest.id],
            (markErr) => {
              if (markErr) {
                console.error('Mark token used error:', markErr);
              }

              res.json({ message: 'Password berhasil diubah. Silakan login dengan password baru.' });
            }
          );
        }
      );
    }
  );
});

// CRUD akun
app.get('/api/akun', (req, res) => {
  pool.query('SELECT id_akun, nama, nip, email, role, status, created_at FROM akun ORDER BY id_akun DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/akun', (req, res) => {
  const { nama, nip, email, password, role, status } = req.body;
  console.log('POST /api/akun body:', req.body);
  
  // Validate required fields
  if (!nama || !nip || !password) {
    return res.status(400).json({ error: 'Nama, NIP, dan password wajib diisi' });
  }
  
  const hash = bcrypt.hashSync(password, 8);
  const finalRole = role || 'Admin';
  const finalStatus = status || 'Aktif';
  
  pool.query(
    'INSERT INTO akun (nama, nip, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)', 
    [nama, nip, email || null, hash, finalRole, finalStatus], 
    (err, result) => {
      if (err) {
        console.error('INSERT /api/akun error:', err);
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'NIP sudah terdaftar' });
        return res.status(500).json({ error: err.message });
      }
      pool.query('SELECT id_akun, nama, nip, email, role, status, created_at FROM akun WHERE id_akun = ?', [result.insertId], (e, rows) => {
        if (e) {
          console.error('SELECT after INSERT /api/akun error:', e);
          return res.status(500).json({ error: e.message });
        }
        res.status(201).json(rows[0]);
      });
    }
  );
});

app.put('/api/akun/:id', (req, res) => {
  const id = req.params.id;
  const { nama, nip, email, password, role, status } = req.body;
  console.log('PUT /api/akun/:id', id, 'body:', req.body);
  
  // First, get current akun data to merge with updates
  pool.query('SELECT * FROM akun WHERE id_akun = ?', [id], (selectErr, selectRows) => {
    if (selectErr) return res.status(500).json({ error: selectErr.message });
    if (!selectRows || selectRows.length === 0) return res.status(404).json({ error: 'Account not found' });
    
    const currentUser = selectRows[0];
    
    // Merge current data with updates
    const updatedNama = nama !== undefined ? nama : currentUser.nama;
    const updatedNip = nip !== undefined ? nip : currentUser.nip;
    const updatedEmail = email !== undefined ? email : currentUser.email;
    const updatedRole = role !== undefined ? role : currentUser.role;
    const updatedStatus = status !== undefined ? status : currentUser.status;
    
    // If password provided, hash and include in update
    if (password) {
      const hash = bcrypt.hashSync(password, 8);
      pool.query(
        'UPDATE akun SET nama = ?, nip = ?, email = ?, role = ?, status = ?, password = ? WHERE id_akun = ?', 
        [updatedNama, updatedNip, updatedEmail, updatedRole, updatedStatus, hash, id], 
        (err) => {
          if (err) return res.status(500).json({ error: err.message });
          pool.query('SELECT id_akun, nama, nip, email, role, status, created_at FROM akun WHERE id_akun = ?', [id], (e, rows) => {
            if (e) return res.status(500).json({ error: e.message });
            res.json(rows[0]);
          });
        }
      );
    } else {
      pool.query(
        'UPDATE akun SET nama = ?, nip = ?, email = ?, role = ?, status = ? WHERE id_akun = ?', 
        [updatedNama, updatedNip, updatedEmail, updatedRole, updatedStatus, id], 
        (err) => {
          if (err) return res.status(500).json({ error: err.message });
          pool.query('SELECT id_akun, nama, nip, email, role, status, created_at FROM akun WHERE id_akun = ?', [id], (e, rows) => {
            if (e) return res.status(500).json({ error: e.message });
            res.json(rows[0]);
          });
        }
      );
    }
  });
});

app.delete('/api/akun/:id', (req, res) => {
  const id = req.params.id;
  pool.query('DELETE FROM akun WHERE id_akun = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deletedId: id });
  });
});

// Change password endpoint (for koordinator self-service)
app.put('/api/akun/:id/password', (req, res) => {
  const id = req.params.id;
  const { oldPassword, newPassword } = req.body;
  
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Password lama dan password baru wajib diisi' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password baru minimal 6 karakter' });
  }

  // Verify old password first
  pool.query('SELECT password FROM akun WHERE id_akun = ?', [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Akun tidak ditemukan' });

    const currentHash = rows[0].password;
    const isPasswordValid = bcrypt.compareSync(oldPassword, currentHash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Password lama tidak sesuai' });
    }

    // Hash new password and update
    const newHash = bcrypt.hashSync(newPassword, 8);
    pool.query('UPDATE akun SET password = ? WHERE id_akun = ?', [newHash, id], (updateErr) => {
      if (updateErr) return res.status(500).json({ error: updateErr.message });
      res.json({ message: 'Password berhasil diubah' });
    });
  });
});

// Upload foto profil endpoint
app.put('/api/akun/:id/foto', (req, res) => {
  const id = req.params.id;
  const { foto } = req.body;
  
  if (!foto) {
    return res.status(400).json({ error: 'Foto wajib diisi' });
  }

  // Validate base64 image format
  if (!foto.startsWith('data:image/')) {
    return res.status(400).json({ error: 'Format foto tidak valid' });
  }

  pool.query('UPDATE akun SET foto = ? WHERE id_akun = ?', [foto, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Foto profil berhasil diperbarui', foto });
  });
});

// Helper function: Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius bumi dalam km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Jarak dalam km
}

// ================================================
// WILAYAH ENDPOINTS (Provinsi, Kabupaten, Kecamatan, Desa)
// ================================================

// GET all provinsi
app.get('/api/wilayah/provinsi', (req, res) => {
  pool.query('SELECT id_provinsi, nama FROM provinsi ORDER BY nama', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET kabupaten by provinsi
app.get('/api/wilayah/kabupaten/:id_provinsi', (req, res) => {
  const { id_provinsi } = req.params;
  pool.query('SELECT id_kabupaten, nama FROM kabupaten WHERE id_provinsi = ? ORDER BY nama', [id_provinsi], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET kecamatan by kabupaten
app.get('/api/wilayah/kecamatan/:id_kabupaten', (req, res) => {
  const { id_kabupaten } = req.params;
  pool.query('SELECT id_kecamatan, nama FROM kecamatan WHERE id_kabupaten = ? ORDER BY nama', [id_kabupaten], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET desa by kecamatan
app.get('/api/wilayah/desa/:id_kecamatan', (req, res) => {
  const { id_kecamatan } = req.params;
  pool.query('SELECT id_desa, nama FROM desa WHERE id_kecamatan = ? ORDER BY nama', [id_kecamatan], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ================================================
// LOKASI KKN ENDPOINTS
// ================================================

// GET all (with JOIN to get wilayah names, optional periode filter)
app.get('/api/locations', (req, res) => {
  const id_periode = req.query.id_periode;
  console.log('GET /api/locations called, id_periode:', id_periode);
  
  let query = `
    SELECT 
      l.id_lokasi, l.lokasi, 
      l.id_provinsi, l.id_kabupaten, l.id_kecamatan, l.id_desa, l.id_periode,
      p.nama AS provinsi, k.nama AS kabupaten, kc.nama AS kecamatan, d.nama AS desa,
      l.latitude, l.longitude, l.jarak_ke_puskesmas, l.puskesmas_terdekat, l.kategori_jarak,
      per.nama_periode
    FROM data_lokasi_kkn l
    LEFT JOIN provinsi p ON l.id_provinsi = p.id_provinsi
    LEFT JOIN kabupaten k ON l.id_kabupaten = k.id_kabupaten
    LEFT JOIN kecamatan kc ON l.id_kecamatan = kc.id_kecamatan
    LEFT JOIN desa d ON l.id_desa = d.id_desa
    LEFT JOIN periode_kkn per ON l.id_periode = per.id_periode
  `;
  
  const params = [];
  if (id_periode) {
    query += ` WHERE l.id_periode = ?`;
    params.push(id_periode);
  }
  query += ` ORDER BY l.id_lokasi DESC`;
  
  pool.query(query, params, (err, rows) => {
    if (err) {
      console.error('GET error:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('GET response:', rows.length, 'rows');
    res.json(rows);
  });
});

// GET locations with distance to nearest puskesmas (optional periode filter)
app.get('/api/locations-with-distance', (req, res) => {
  const id_periode = req.query.id_periode;
  console.log('GET /api/locations-with-distance called, id_periode:', id_periode);
  
  let query = `
    SELECT 
      l.id_lokasi, l.lokasi, 
      l.id_provinsi, l.id_kabupaten, l.id_kecamatan, l.id_desa, l.id_periode,
      p.nama AS provinsi, k.nama AS kabupaten, kc.nama AS kecamatan, d.nama AS desa,
      l.latitude, l.longitude, l.jarak_ke_puskesmas, l.puskesmas_terdekat, l.kategori_jarak,
      l.kontak_person,
      per.nama_periode
    FROM data_lokasi_kkn l
    LEFT JOIN provinsi p ON l.id_provinsi = p.id_provinsi
    LEFT JOIN kabupaten k ON l.id_kabupaten = k.id_kabupaten
    LEFT JOIN kecamatan kc ON l.id_kecamatan = kc.id_kecamatan
    LEFT JOIN desa d ON l.id_desa = d.id_desa
    LEFT JOIN periode_kkn per ON l.id_periode = per.id_periode
  `;
  
  const params = [];
  if (id_periode) {
    query += ` WHERE l.id_periode = ?`;
    params.push(id_periode);
  }
  query += ` ORDER BY l.id_lokasi ASC`;
  
  pool.query(query, params, (err, allLocations) => {
    if (err) {
      console.error('GET error:', err);
      return res.status(500).json({ error: err.message });
    }
    
    // Return data langsung dari database (sudah ada field jarak_ke_puskesmas, dll)
    const locationsWithDistance = allLocations.map(loc => ({
      ...loc,
      jarak_ke_faskes: loc.jarak_ke_puskesmas, // Alias untuk frontend
      faskes_terdekat: loc.puskesmas_terdekat
    }));
    
    console.log('GET response:', locationsWithDistance.length, 'rows with puskesmas distance data');
    res.json(locationsWithDistance);
  });
});

// Endpoint untuk recalculate semua jarak ke puskesmas terdekat
app.post('/api/recalculate-distances', async (req, res) => {
  console.log('POST /api/recalculate-distances called - menghitung ulang semua jarak...');
  
  const query = `
    SELECT l.id_lokasi, l.lokasi, l.latitude, l.longitude, k.nama as kabupaten 
    FROM data_lokasi_kkn l 
    LEFT JOIN kabupaten k ON l.id_kabupaten = k.id_kabupaten
    ORDER BY l.id_lokasi ASC
  `;
  pool.query(query, async (err, allLocations) => {
    if (err) {
      console.error('Query error:', err);
      return res.status(500).json({ error: err.message });
    }
    
    try {
      // Hitung jarak untuk semua lokasi menggunakan fungsi otomatis
      console.log(`🏥 Memulai perhitungan untuk ${allLocations.length} lokasi...`);
      const enrichedLocations = await autogroupService.enrichLocationsWithDistance(allLocations);
      
      // Simpan hasil ke database
      let successCount = 0;
      let errorCount = 0;
      
      for (const loc of enrichedLocations) {
        const jarak = loc.jarak_ke_puskesmas !== null && loc.jarak_ke_puskesmas !== undefined ? loc.jarak_ke_puskesmas : null;
        const puskesmas = loc.puskesmas_terdekat || null;
        const kategori = loc.kategori_jarak || null;
        
        await new Promise((resolve, reject) => {
          pool.query(
            'UPDATE data_lokasi_kkn SET jarak_ke_puskesmas = ?, puskesmas_terdekat = ?, kategori_jarak = ? WHERE id_lokasi = ?',
            [jarak, puskesmas, kategori, loc.id_lokasi],
            (updateErr) => {
              if (updateErr) {
                console.error(`Error updating ${loc.lokasi}:`, updateErr);
                errorCount++;
                reject(updateErr);
              } else {
                successCount++;
                resolve();
              }
            }
          );
        });
      }
      
      console.log(`✅ Perhitungan selesai! Berhasil: ${successCount}, Gagal: ${errorCount}`);
      
      res.json({
        success: true,
        message: `Berhasil menghitung jarak untuk ${successCount} lokasi`,
        total: allLocations.length,
        successCount,
        errorCount,
        data: enrichedLocations
      });
    } catch (error) {
      console.error('Error enriching locations:', error);
      res.status(500).json({ error: 'Gagal mencari puskesmas terdekat: ' + error.message });
    }
  });
});

// Geocode endpoint (Nominatim API) - tries multiple query patterns
app.post('/api/geocode', async (req, res) => {
  const { lokasi, desa_kecamatan, kabupaten } = req.body;
  
  // Parse desa and kecamatan from combined string
  const [desa, kecamatan] = (desa_kecamatan || '').split('/').map(s => s.trim());
  const kabClean = (kabupaten || '').replace(/^Kabupaten\s*/i, '').trim();
  
  // Try multiple query patterns from most specific to least specific
  const queryPatterns = [
    // Pattern 1: Full specific
    `${lokasi}, ${desa}, ${kecamatan}, ${kabClean}, Indonesia`,
    // Pattern 2: Without lokasi (use desa as main)
    `${desa}, ${kecamatan}, ${kabClean}, Indonesia`,
    // Pattern 3: Kecamatan + Kabupaten only
    `${kecamatan}, ${kabClean}, Indonesia`,
    // Pattern 4: Just desa + kabupaten
    `${desa}, ${kabClean}, Indonesia`,
    // Pattern 5: Just kecamatan + DIY/Yogyakarta
    `${kecamatan}, Yogyakarta, Indonesia`,
    // Pattern 6: Lokasi + Indonesia
    `${lokasi}, Indonesia`
  ].filter(q => q && !q.includes('undefined') && q.length > 10);
  
  console.log('Geocoding - will try patterns:', queryPatterns);
  
  try {
    for (const query of queryPatterns) {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
      console.log('  Trying:', query);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'KKNAutoGroup/1.0'
        }
      });
      
      if (!response.ok) continue;
      
      const data = await response.json();
      
      if (data.length > 0) {
        const result = data[0];
        console.log('  SUCCESS:', result.display_name);
        return res.json({
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          display_name: result.display_name
        });
      }
      
      // Small delay to respect Nominatim rate limits
      await new Promise(r => setTimeout(r, 200));
    }
    
    // None of the patterns worked
    console.log('  All patterns failed');
    res.status(404).json({ error: 'Lokasi tidak ditemukan di OpenStreetMap' });
  } catch (err) {
    console.error('Geocoding error:', err.message);
    res.status(500).json({ error: 'Gagal mencari koordinat: ' + err.message });
  }
});

// Helper: check nearby health facilities (fasilitas kesehatan) using Overpass API
async function checkNearbyFakes(lat, lon, radiusMeters = 2000) {
  try {
    // Overpass QL: find nodes/ways/relations with amenity tags related to healthcare
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"~"hospital|clinic|doctors|pharmacy"](around:${radiusMeters},${lat},${lon});
        way["amenity"~"hospital|clinic|doctors|pharmacy"](around:${radiusMeters},${lat},${lon});
        relation["amenity"~"hospital|clinic|doctors|pharmacy"](around:${radiusMeters},${lat},${lon});
      );
      out center 1;
    `;

    const url = 'https://overpass-api.de/api/interpreter';
    const resp = await fetch(url, { method: 'POST', body: query, headers: { 'Content-Type': 'text/plain', 'User-Agent': 'KKNAutoGroup/1.0' } });
    if (!resp.ok) return { hasFakes: false, items: [] };
    const data = await resp.json();
    const items = (data.elements || []).map(el => {
      const latv = el.lat || (el.center && el.center.lat);
      const lonv = el.lon || (el.center && el.center.lon);
      return { id: el.id, type: el.type, tags: el.tags || {}, lat: latv, lon: lonv };
    }).filter(i => i.lat && i.lon);

    return { hasFakes: items.length > 0, items };
  } catch (err) {
    console.error('checkNearbyFakes error:', err.message);
    return { hasFakes: false, items: [] };
  }
}

// Multer setup for memory uploads
const upload = multer({ storage: multer.memoryStorage() });

// -------------------- NEW LOKASI ENDPOINTS (data_lokasi_kkn) --------------------

// GET all lokasi
app.get('/lokasi', (req, res) => {
  const query = `
    SELECT l.id_lokasi, l.lokasi, 
           l.id_provinsi, l.id_kabupaten, l.id_kecamatan, l.id_desa,
           p.nama AS provinsi, k.nama AS kabupaten, kc.nama AS kecamatan, d.nama AS desa,
           l.latitude, l.longitude, l.jarak_ke_puskesmas, l.puskesmas_terdekat, l.kategori_jarak 
    FROM data_lokasi_kkn l
    LEFT JOIN provinsi p ON l.id_provinsi = p.id_provinsi
    LEFT JOIN kabupaten k ON l.id_kabupaten = k.id_kabupaten
    LEFT JOIN kecamatan kc ON l.id_kecamatan = kc.id_kecamatan
    LEFT JOIN desa d ON l.id_desa = d.id_desa
    ORDER BY l.id_lokasi ASC
  `;
  pool.query(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// POST single lokasi
app.post('/lokasi', async (req, res) => {
  try {
    let { lokasi, desa, kecamatan, kabupaten, latitude, longitude, desa_kecamatan } = req.body;
    // support legacy combined field `desa_kecamatan` (format: "Desa / Kecamatan" or just "Desa")
    if ((!desa || !kecamatan) && desa_kecamatan) {
      const parts = desa_kecamatan.split('/').map(p => p.trim());
      desa = parts[0] || desa || '';
      kecamatan = parts[1] || kecamatan || parts[0] || '';
    }
    if (!lokasi || !kabupaten) return res.status(400).json({ error: 'Missing required fields: lokasi, kabupaten' });

    let lat = latitude ? parseFloat(latitude) : null;
    let lon = longitude ? parseFloat(longitude) : null;

    // If no coords, try geocoding via nominatim
    if ((!lat || !lon) && lokasi) {
      const query = `${lokasi}, ${desa || ''}, ${kabupaten || ''}`.trim();
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json`;
      const response = await fetch(url, { headers: { 'User-Agent': 'KKNAutoGroup/1.0' } });
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          lat = parseFloat(data[0].lat);
          lon = parseFloat(data[0].lon);
        }
      }
    }

    // ⚠️ NOTE: This is old endpoint. Use POST /api/locations for auto-calculation of puskesmas distance
    pool.query('INSERT INTO data_lokasi_kkn (lokasi, desa, kecamatan, kabupaten, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)',
      [lokasi, desa, kecamatan, kabupaten, lat || null, lon || null], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        pool.query('SELECT id_lokasi, lokasi, desa, kecamatan, kabupaten, latitude, longitude, jarak_ke_puskesmas, puskesmas_terdekat, kategori_jarak FROM data_lokasi_kkn WHERE id_lokasi = ?', [result.insertId], (e, rows) => {
          if (e) return res.status(500).json({ error: e.message });
          res.status(201).json(rows[0]);
        });
      }
    );
  } catch (err) {
    console.error('/lokasi POST error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update lokasi
app.put('/lokasi/:id', async (req, res) => {
  const id = req.params.id;
  try {
    let { lokasi, desa, kecamatan, kabupaten, latitude, longitude, desa_kecamatan, fakes } = req.body;
    if ((!desa || !kecamatan) && desa_kecamatan) {
      const parts = desa_kecamatan.split('/').map(p => p.trim());
      desa = parts[0] || desa || '';
      kecamatan = parts[1] || kecamatan || parts[0] || '';
    }
    if (!lokasi || !kabupaten) return res.status(400).json({ error: 'Missing required fields: lokasi, kabupaten' });

    let lat = latitude ? parseFloat(latitude) : null;
    let lon = longitude ? parseFloat(longitude) : null;

    // OPTIMASI: Hanya lakukan geocoding jika koordinat TIDAK tersedia
    // Ini akan membuat update lebih cepat karena skip API call eksternal
    const needsGeocode = (!lat || !lon);
    
    if (needsGeocode && lokasi) {
      console.log('Geocoding for update:', lokasi);
      const query = `${lokasi}, ${desa || ''}, ${kabupaten || ''}`.trim();
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json`;
      try {
        const response = await fetch(url, { headers: { 'User-Agent': 'KKNAutoGroup/1.0' } });
        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            lat = parseFloat(data[0].lat);
            lon = parseFloat(data[0].lon);
          }
        }
      } catch (e) {
        console.log('Geocoding failed, continuing without coords');
      }
    }

    // ⚠️ NOTE: This is old endpoint. Use PUT /api/locations/:id for auto-recalculation of puskesmas distance
    pool.query('UPDATE data_lokasi_kkn SET lokasi = ?, desa = ?, kecamatan = ?, kabupaten = ?, latitude = ?, longitude = ? WHERE id_lokasi = ?',
      [lokasi, desa, kecamatan, kabupaten, lat || null, lon || null, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        pool.query('SELECT id_lokasi, lokasi, desa, kecamatan, kabupaten, latitude, longitude, jarak_ke_puskesmas, puskesmas_terdekat, kategori_jarak FROM data_lokasi_kkn WHERE id_lokasi = ?', [id], (e, rows) => {
          if (e) return res.status(500).json({ error: e.message });
          res.json(rows[0]);
        });
      }
    );
  } catch (err) {
    console.error('/lokasi PUT error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE lokasi
app.delete('/lokasi/:id', (req, res) => {
  const id = req.params.id;
  pool.query('DELETE FROM data_lokasi_kkn WHERE id_lokasi = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deletedId: id });
  });
});

// GET lokasi sorted by distance to kampus (query params lat,lng or env LAT_KAMPUS/LONG_KAMPUS)
app.get('/lokasi/sort/jarak', (req, res) => {
  const latKampus = parseFloat(req.query.lat || process.env.LAT_KAMPUS || 0);
  const lngKampus = parseFloat(req.query.lng || process.env.LONG_KAMPUS || 0);
  if (!latKampus || !lngKampus) return res.status(400).json({ error: 'kampus lat/lng required via query params or LAT_KAMPUS/LONG_KAMPUS env' });

  const query = `
    SELECT l.id_lokasi, l.lokasi, 
           l.id_provinsi, l.id_kabupaten, l.id_kecamatan, l.id_desa,
           p.nama AS provinsi, k.nama AS kabupaten, kc.nama AS kecamatan, d.nama AS desa,
           l.latitude, l.longitude, l.kuota, l.jarak_ke_puskesmas, l.puskesmas_terdekat, l.kategori_jarak 
    FROM data_lokasi_kkn l
    LEFT JOIN provinsi p ON l.id_provinsi = p.id_provinsi
    LEFT JOIN kabupaten k ON l.id_kabupaten = k.id_kabupaten
    LEFT JOIN kecamatan kc ON l.id_kecamatan = kc.id_kecamatan
    LEFT JOIN desa d ON l.id_desa = d.id_desa
  `;
  pool.query(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const calc = rows.map(r => ({
      ...r,
      distance_km: calculateDistance(latKampus, lngKampus, parseFloat(r.latitude) || 0, parseFloat(r.longitude) || 0)
    })).sort((a,b) => a.distance_km - b.distance_km);
    res.json(calc);
  });
});

// POST /lokasi/import - accept Excel file upload (multipart/form-data, field 'file')
// Updated to use FK references and auto-detect provinsi from kabupaten
app.post('/lokasi/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file is required (multipart/form-data field name: file)' });
    
    // Accept id_periode from form data
    const id_periode = req.body.id_periode || null;
    console.log('Import with id_periode:', id_periode);
    
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

    if (!rows || rows.length === 0) return res.status(400).json({ error: 'Excel kosong' });

    // Validate required columns (kabupaten is required to auto-detect provinsi)
    const requiredCols = ['lokasi', 'kabupaten'];
    const header = Object.keys(rows[0]).map(h => h.toString().toLowerCase());
    const missing = requiredCols.filter(c => !header.includes(c));
    if (missing.length > 0) return res.status(400).json({ error: 'Missing columns: ' + missing.join(', ') });

    // Helper function to find wilayah ID by name
    const findWilayahId = async (table, nameColumn, idColumn, name, parentColumn = null, parentId = null) => {
      if (!name) return null;
      let query = `SELECT ${idColumn} FROM ${table} WHERE LOWER(nama) LIKE ?`;
      const params = [`%${name.toLowerCase().trim()}%`];
      
      if (parentColumn && parentId) {
        query += ` AND ${parentColumn} = ?`;
        params.push(parentId);
      }
      
      const [result] = await pool.promise().query(query + ' LIMIT 1', params);
      return result.length > 0 ? result[0][idColumn] : null;
    };

    // Helper to get provinsi from kabupaten
    const getProvinsiFromKabupaten = async (kabupatenName) => {
      if (!kabupatenName) return null;
      const [result] = await pool.promise().query(
        `SELECT k.id_kabupaten, k.id_provinsi, p.nama as provinsi_nama 
         FROM kabupaten k 
         JOIN provinsi p ON k.id_provinsi = p.id_provinsi 
         WHERE LOWER(k.nama) LIKE ? 
         LIMIT 1`,
        [`%${kabupatenName.toLowerCase().trim()}%`]
      );
      return result.length > 0 ? { id_kabupaten: result[0].id_kabupaten, id_provinsi: result[0].id_provinsi } : null;
    };

    const insertedLocations = [];
    let skippedCount = 0;

    console.log(`📂 Processing ${rows.length} rows from Excel...`);

    for (const r of rows) {
      const lokasi = r.lokasi || r.Lokasi || r.dusun || r.Dusun || null;
      const desaName = r.desa || r.Desa || r.kelurahan || r.Kelurahan || null;
      const kecamatanName = r.kecamatan || r.Kecamatan || null;
      const kabupatenName = r.kabupaten || r.Kabupaten || null;
      const provinsiName = r.provinsi || r.Provinsi || null;
      
      // 📞 SMART KONTAK PERSON READER - Mendukung berbagai format kolom
      let kontakPerson = null;
      
      // 1. Cek kolom gabungan (prioritas utama)
      kontakPerson = r.kontak_person || r['kontak person'] || r['Kontak Person'] || r['KONTAK PERSON'] || 
                     r.kontakperson || r.KontakPerson || r['contact person'] || r['Contact Person'] || null;
      
      // 2. Jika tidak ada, cari kolom terpisah dan gabungkan otomatis
      if (!kontakPerson) {
        // Cari nama dukuh dari berbagai variasi kolom
        const nama = r.nama_dukuh || r['nama dukuh'] || r['Nama Dukuh'] || r.namadukuh || r.NamaDukuh || 
                     r.nama || r.Nama || r.dukuh || r.Dukuh || 
                     r.nama_kontak || r['nama kontak'] || r['Nama Kontak'] || null;
        
        // Cari nomor telepon dari berbagai variasi kolom
        const telp = r.nomor_telepon || r['nomor telepon'] || r['Nomor Telepon'] || r.nomortelepon || 
                     r.no_telp || r['no telp'] || r['No Telp'] || r.notelp || 
                     r.telepon || r.Telepon || r.telp || r.Telp || 
                     r.hp || r.HP || r.no_hp || r['no hp'] || r['No HP'] || 
                     r.phone || r.Phone || r.telephone || null;
        
        // Gabungkan jika ada salah satu atau keduanya
        if (nama && telp) {
          kontakPerson = `${nama}\n${telp}`;
        } else if (nama) {
          kontakPerson = nama;
        } else if (telp) {
          kontakPerson = telp;
        }
      }

      if (!kabupatenName) {
        console.warn(`⚠️  Skipped row: kabupaten kosong untuk lokasi "${lokasi}"`);
        skippedCount++;
        continue;
      }

      // Step 1: Find kabupaten and auto-get provinsi
      let id_provinsi = null;
      let id_kabupaten = null;
      let id_kecamatan = null;
      let id_desa = null;

      // Try to find kabupaten first (this will also give us provinsi)
      const kabupatenData = await getProvinsiFromKabupaten(kabupatenName);
      
      if (kabupatenData) {
        id_kabupaten = kabupatenData.id_kabupaten;
        id_provinsi = kabupatenData.id_provinsi;
        console.log(`  ✓ Found kabupaten: ${kabupatenName} → id_kabupaten=${id_kabupaten}, id_provinsi=${id_provinsi}`);
      } else {
        // If kabupaten not found but provinsi is provided, try to find provinsi
        if (provinsiName) {
          id_provinsi = await findWilayahId('provinsi', 'nama', 'id_provinsi', provinsiName);
        }
        console.warn(`  ⚠️  Kabupaten "${kabupatenName}" tidak ditemukan di database`);
      }

      // Step 2: Find kecamatan (if kabupaten found)
      if (id_kabupaten && kecamatanName) {
        id_kecamatan = await findWilayahId('kecamatan', 'nama', 'id_kecamatan', kecamatanName, 'id_kabupaten', id_kabupaten);
        if (id_kecamatan) {
          console.log(`  ✓ Found kecamatan: ${kecamatanName} → id_kecamatan=${id_kecamatan}`);
        }
      }

      // Step 3: Find desa (if kecamatan found)
      if (id_kecamatan && desaName) {
        id_desa = await findWilayahId('desa', 'nama', 'id_desa', desaName, 'id_kecamatan', id_kecamatan);
        if (id_desa) {
          console.log(`  ✓ Found desa: ${desaName} → id_desa=${id_desa}`);
        }
      }

      // Step 4: Get coordinates
      let lat = null;
      let lon = null;
      if (r.latitude || r.Latitude || r.lat) lat = parseFloat(r.latitude || r.Latitude || r.lat);
      if (r.longitude || r.Longitude || r.lon || r.lng) lon = parseFloat(r.longitude || r.Longitude || r.lon || r.lng);
      
      // Geocode if no coordinates
      if ((!lat || !lon) && (lokasi || desaName)) {
        const geoQuery = `${lokasi || ''}, ${desaName || ''}, ${kecamatanName || ''}, ${kabupatenName || 'Indonesia'}`.trim();
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(geoQuery)}&format=json`, { 
            headers: { 'User-Agent': 'KKNAutoGroup/1.0' } 
          });
          if (response.ok) {
            const data = await response.json();
            if (data.length > 0) {
              lat = parseFloat(data[0].lat);
              lon = parseFloat(data[0].lon);
              console.log(`  📍 Geocoded: ${geoQuery} → [${lat}, ${lon}]`);
            }
          }
          // Delay to avoid rate limit
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (ge) {
          console.warn('  ⚠️  Geocode failed:', ge.message);
        }
      }

      // Insert into database with FK references
      try {
        const [insertResult] = await pool.promise().query(
          'INSERT INTO data_lokasi_kkn (lokasi, id_provinsi, id_kabupaten, id_kecamatan, id_desa, latitude, longitude, id_periode, kontak_person) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [lokasi, id_provinsi, id_kabupaten, id_kecamatan, id_desa, lat, lon, id_periode, kontakPerson]
        );
        
        insertedLocations.push({
          id_lokasi: insertResult.insertId,
          lokasi,
          latitude: lat,
          longitude: lon,
          kabupaten: kabupatenName,
          id_periode
        });
      } catch (insertErr) {
        console.error(`  ❌ Insert failed for "${lokasi}":`, insertErr.message);
        skippedCount++;
      }
    }

    const insertedCount = insertedLocations.length;
    console.log(`✅ ${insertedCount} lokasi berhasil di-import, ${skippedCount} di-skip`);

    if (insertedCount === 0) {
      return res.json({ inserted: 0, skipped: skippedCount, message: 'Tidak ada lokasi yang berhasil di-import' });
    }

    // ⚡ SKIP AUTO-CALCULATE untuk performa cepat
    // Jarak puskesmas bisa dihitung manual dari UI menggunakan tombol "Hitung Jarak Faskes"
    const locationsWithCoords = insertedLocations.filter(l => l.latitude && l.longitude);
    
    console.log(`ℹ️  Import selesai! ${locationsWithCoords.length} lokasi memiliki koordinat.`);
    console.log(`💡 Gunakan tombol "Hitung Jarak Faskes" di UI untuk menghitung jarak ke puskesmas.`);
    
    return res.json({ 
      inserted: insertedCount, 
      skipped: skippedCount,
      has_coordinates: locationsWithCoords.length,
      message: `Import berhasil! ${insertedCount} lokasi ditambahkan dalam ${locationsWithCoords.length > 0 ? 'beberapa detik' : 'sekejap'}. Gunakan tombol "Hitung Jarak Faskes" untuk menghitung jarak ke puskesmas.`
    });
  } catch (err) {
    console.error('/lokasi/import error:', err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------- END LOKASI ENDPOINTS --------------------

// 🔧 HELPER FUNCTION: Geocode address using Nominatim API
async function geocodeAddress(lokasi, desa, kecamatan, kabupaten) {
  const query = [lokasi, desa, kecamatan, kabupaten].filter(Boolean).join(', ');
  if (!query) return { lat: null, lon: null };
  
  try {
    console.log(`🌍 Geocoding: ${query}`);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'KKNAutoGroup/1.0' } }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        console.log(`✅ Geocoded: ${lat}, ${lon}`);
        return { lat, lon };
      }
    }
    console.warn('⚠️  Geocoding failed: No results');
  } catch (err) {
    console.error('❌ Geocoding error:', err.message);
  }
  
  return { lat: null, lon: null };
}

// Endpoint to let frontend check nearby fasilitas kesehatan
app.post('/api/check-fakes', async (req, res) => {
  const { latitude, longitude, radiusMeters } = req.body;
  if (!latitude || !longitude) return res.status(400).json({ error: 'latitude and longitude required' });
  try {
    const result = await checkNearbyFakes(latitude, longitude, radiusMeters || 2000);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create
app.post('/api/locations', async (req, res) => {
  let { lokasi, id_provinsi, id_kabupaten, id_kecamatan, id_desa, latitude, longitude, id_periode, kontak_person } = req.body;
  console.log('POST /api/locations:', { lokasi, id_provinsi, id_kabupaten, id_kecamatan, id_desa, latitude, longitude, id_periode, kontak_person });

  try {
    // Check for duplicate: same lokasi (dusun name) + same id_desa + same periode
    const checkDuplicateQuery = `
      SELECT id_lokasi, lokasi FROM data_lokasi_kkn 
      WHERE id_desa = ? AND LOWER(TRIM(lokasi)) = LOWER(TRIM(?)) 
      ${id_periode ? 'AND id_periode = ?' : 'AND (id_periode IS NULL OR id_periode = ?)'}
      LIMIT 1
    `;
    const checkParams = [id_desa, lokasi || '', id_periode || null];
    
    pool.query(checkDuplicateQuery, checkParams, (checkErr, existingRows) => {
      if (checkErr) {
        console.error('Check duplicate error:', checkErr);
        return res.status(500).json({ error: checkErr.message });
      }
      
      if (existingRows && existingRows.length > 0) {
        console.log('⚠️ Duplicate lokasi found:', existingRows[0]);
        return res.status(409).json({ 
          error: `Lokasi "${lokasi || 'tanpa nama'}" sudah ada di desa ini untuk periode yang sama (ID: ${existingRows[0].id_lokasi})`,
          duplicate: true,
          existing_id: existingRows[0].id_lokasi
        });
      }
      
      // No duplicate, proceed with insert
      pool.query(
        'INSERT INTO data_lokasi_kkn (lokasi, id_provinsi, id_kabupaten, id_kecamatan, id_desa, latitude, longitude, id_periode, kontak_person) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [lokasi || null, id_provinsi || null, id_kabupaten || null, id_kecamatan || null, id_desa || null, latitude || null, longitude || null, id_periode || null, kontak_person || null],
        async (err, result) => {
          if (err) {
            console.error('INSERT error:', err);
            return res.status(500).json({ error: err.message });
          }
          
          const insertedId = result.insertId;
          console.log('✅ Lokasi baru inserted with ID:', insertedId);

          // 📊 AUTO-UPDATE periode summary if location has periode
          if (id_periode) {
            updatePeriodeSummary(id_periode, (updateErr) => {
              if (updateErr) {
                console.warn(`⚠️  Failed to update periode summary for id_periode ${id_periode}:`, updateErr.message);
              } else {
                console.log(`✅ Periode summary updated for id_periode ${id_periode}`);
              }
            });
          }

          // 🏥 AUTO-CALCULATE jarak puskesmas jika ada koordinat
          if (latitude && longitude) {
            console.log('🏥 Auto-calculating puskesmas distance for new location...');
            try {
              const locForCalc = [{
                id_lokasi: insertedId,
                lokasi: lokasi,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                kabupaten: null // Will be looked up if needed
              }];
              
              const enriched = await autogroupService.enrichLocationsWithDistance(locForCalc);
              
              if (enriched && enriched.length > 0 && enriched[0].jarak_ke_puskesmas !== null) {
                await pool.promise().query(
                  'UPDATE data_lokasi_kkn SET jarak_ke_puskesmas = ?, puskesmas_terdekat = ?, kategori_jarak = ? WHERE id_lokasi = ?',
                  [enriched[0].jarak_ke_puskesmas, enriched[0].puskesmas_terdekat, enriched[0].kategori_jarak, insertedId]
                );
                console.log(`✅ Auto-calculated: ${enriched[0].jarak_ke_puskesmas?.toFixed(1)} km ke ${enriched[0].puskesmas_terdekat}`);
              }
            } catch (calcErr) {
              console.warn('⚠️  Auto-calculate distance failed:', calcErr.message);
            }
          }

        // Return data lengkap with JOINs
        const query = `
          SELECT 
            l.id_lokasi, l.lokasi, 
            l.id_provinsi, l.id_kabupaten, l.id_kecamatan, l.id_desa, l.id_periode,
            p.nama AS provinsi, k.nama AS kabupaten, kc.nama AS kecamatan, d.nama AS desa,
            l.latitude, l.longitude, l.jarak_ke_puskesmas, l.puskesmas_terdekat, l.kategori_jarak,
            l.kontak_person,
            per.nama_periode
          FROM data_lokasi_kkn l
          LEFT JOIN provinsi p ON l.id_provinsi = p.id_provinsi
          LEFT JOIN kabupaten k ON l.id_kabupaten = k.id_kabupaten
          LEFT JOIN kecamatan kc ON l.id_kecamatan = kc.id_kecamatan
          LEFT JOIN desa d ON l.id_desa = d.id_desa
          LEFT JOIN periode_kkn per ON l.id_periode = per.id_periode
          WHERE l.id_lokasi = ?
        `;
          pool.query(query, [insertedId], (err, rows) => {
            if (err) {
              console.error('SELECT after INSERT error:', err);
              return res.status(500).json({ error: err.message });
            }
            res.status(201).json(rows[0]);
          });
        }
      );
    });
  } catch (err) {
    console.error('POST /api/locations error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update
app.put('/api/locations/:id', async (req, res) => {
  const id = req.params.id;
  let { lokasi, id_provinsi, id_kabupaten, id_kecamatan, id_desa, latitude, longitude, id_periode, kontak_person } = req.body;
  console.log('PUT /api/locations/:id:', id, { lokasi, id_provinsi, id_kabupaten, id_kecamatan, id_desa, latitude, longitude, id_periode, kontak_person });

  try {
    // Check for duplicate (excluding current ID): same lokasi (dusun name) + same id_desa + same periode
    const checkDuplicateQuery = `
      SELECT id_lokasi, lokasi FROM data_lokasi_kkn 
      WHERE id_desa = ? AND LOWER(TRIM(lokasi)) = LOWER(TRIM(?)) 
      AND id_lokasi != ?
      ${id_periode ? 'AND id_periode = ?' : 'AND (id_periode IS NULL OR id_periode = ?)'}
      LIMIT 1
    `;
    const checkParams = [id_desa, lokasi || '', id, id_periode || null];

    pool.query(checkDuplicateQuery, checkParams, (checkErr, existingRows) => {
      if (checkErr) {
        console.error('Check duplicate error:', checkErr);
        return res.status(500).json({ error: checkErr.message });
      }
      
      if (existingRows && existingRows.length > 0) {
        console.log('⚠️ Duplicate lokasi found on update:', existingRows[0]);
        return res.status(409).json({ 
          error: `Lokasi "${lokasi || 'tanpa nama'}" sudah ada di desa ini untuk periode yang sama (ID: ${existingRows[0].id_lokasi})`,
          duplicate: true,
          existing_id: existingRows[0].id_lokasi
        });
      }

      // No duplicate, proceed with update
      // 📊 First, get old id_periode before updating (to handle periode changes)
      pool.query('SELECT id_periode FROM data_lokasi_kkn WHERE id_lokasi = ?', [id], (selectErr, selectRows) => {
        const old_id_periode = selectRows && selectRows.length > 0 ? selectRows[0].id_periode : null;
        
        const updateQuery = 'UPDATE data_lokasi_kkn SET lokasi = ?, id_provinsi = ?, id_kabupaten = ?, id_kecamatan = ?, id_desa = ?, latitude = ?, longitude = ?, id_periode = ?, kontak_person = ? WHERE id_lokasi = ?';
        const params = [lokasi || null, id_provinsi || null, id_kabupaten || null, id_kecamatan || null, id_desa || null, latitude || null, longitude || null, id_periode || null, kontak_person || null, id];

        pool.query(updateQuery, params, async (err) => {
          if (err) {
            console.error('UPDATE error:', err);
            return res.status(500).json({ error: err.message });
          }
          
          console.log('✅ Lokasi updated ID:', id);
          
          // 📊 AUTO-UPDATE periode summary if periode changed
          const periodesNeedUpdate = new Set();
          if (old_id_periode) periodesNeedUpdate.add(old_id_periode);
          if (id_periode) periodesNeedUpdate.add(id_periode);
          
          if (periodesNeedUpdate.size > 0) {
            periodesNeedUpdate.forEach(periodeId => {
              updatePeriodeSummary(periodeId, (updateErr) => {
                if (updateErr) {
                  console.warn(`⚠️  Failed to update periode summary for id_periode ${periodeId}:`, updateErr.message);
                } else {
                  console.log(`✅ Periode summary updated for id_periode ${periodeId} after lokasi update`);
                }
              });
            });
          }

          // 🏥 AUTO-RECALCULATE jarak puskesmas jika ada koordinat
          if (latitude && longitude) {
          console.log('🏥 Auto-recalculating puskesmas distance for updated location...');
          try {
            const locForCalc = [{
              id_lokasi: id,
              lokasi: lokasi,
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
              kabupaten: null
            }];
            
            const enriched = await autogroupService.enrichLocationsWithDistance(locForCalc);
            
            if (enriched && enriched.length > 0 && enriched[0].jarak_ke_puskesmas !== null) {
              await pool.promise().query(
                'UPDATE data_lokasi_kkn SET jarak_ke_puskesmas = ?, puskesmas_terdekat = ?, kategori_jarak = ? WHERE id_lokasi = ?',
                [enriched[0].jarak_ke_puskesmas, enriched[0].puskesmas_terdekat, enriched[0].kategori_jarak, id]
              );
              console.log(`✅ Auto-recalculated: ${enriched[0].jarak_ke_puskesmas?.toFixed(1)} km ke ${enriched[0].puskesmas_terdekat}`);
            }
          } catch (calcErr) {
            console.warn('⚠️  Auto-recalculate distance failed:', calcErr.message);
          }
        }

        // Return data lengkap with JOINs
      const selectQuery = `
        SELECT 
          l.id_lokasi, l.lokasi, 
          l.id_provinsi, l.id_kabupaten, l.id_kecamatan, l.id_desa, l.id_periode,
          p.nama AS provinsi, k.nama AS kabupaten, kc.nama AS kecamatan, d.nama AS desa,
          l.latitude, l.longitude, l.jarak_ke_puskesmas, l.puskesmas_terdekat, l.kategori_jarak,
          l.kontak_person,
          per.nama_periode
        FROM data_lokasi_kkn l
        LEFT JOIN provinsi p ON l.id_provinsi = p.id_provinsi
        LEFT JOIN kabupaten k ON l.id_kabupaten = k.id_kabupaten
        LEFT JOIN kecamatan kc ON l.id_kecamatan = kc.id_kecamatan
        LEFT JOIN desa d ON l.id_desa = d.id_desa
        LEFT JOIN periode_kkn per ON l.id_periode = per.id_periode
        WHERE l.id_lokasi = ?
      `;
      pool.query(selectQuery, [id], (err, rows) => {
        if (err) {
          console.error('SELECT after UPDATE error:', err);
          return res.status(500).json({ error: err.message });
        }
        res.json(rows[0]);
        });
      });
      });
    });
  } catch (err) {
    console.error('PUT /api/locations error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete
app.delete('/api/locations/:id', (req, res) => {
  const id = req.params.id;
  console.log('DELETE /api/locations/:id:', id);
  
  // 📊 First, get id_periode before deleting (for summary update)
  pool.query('SELECT id_periode FROM data_lokasi_kkn WHERE id_lokasi = ?', [id], (selectErr, selectRows) => {
    const id_periode_to_update = selectRows && selectRows.length > 0 ? selectRows[0].id_periode : null;
    
    pool.query('DELETE FROM data_lokasi_kkn WHERE id_lokasi = ?', [id], (err) => {
      if (err) {
        console.error('DELETE error:', err);
        return res.status(500).json({ error: err.message });
      }
      
      // 📊 AUTO-UPDATE periode summary after deletion
      if (id_periode_to_update) {
        updatePeriodeSummary(id_periode_to_update, (updateErr) => {
          if (updateErr) {
            console.warn(`⚠️  Failed to update periode summary for id_periode ${id_periode_to_update}:`, updateErr.message);
          } else {
            console.log(`✅ Periode summary updated after deletion for id_periode ${id_periode_to_update}`);
          }
        });
      }
      
      res.json({ deletedId: id });
    });
  });
});

// 🏥 Preview Calculate Distance - untuk lokasi yang belum disimpan (hanya koordinat dari form)
app.post('/api/calculate-distance-preview', async (req, res) => {
  const { latitude, longitude, lokasi, id_kabupaten } = req.body;
  console.log('POST /api/calculate-distance-preview - body:', { latitude, longitude, lokasi, id_kabupaten });

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Koordinat (latitude dan longitude) diperlukan' });
  }

  try {
    // Get kabupaten name if id_kabupaten provided
    let kabupatenName = null;
    if (id_kabupaten) {
      const [kabRows] = await pool.promise().query('SELECT nama FROM kabupaten WHERE id_kabupaten = ?', [id_kabupaten]);
      if (kabRows.length > 0) {
        kabupatenName = kabRows[0].nama;
      }
    }

    // Create mock location object for enrichment
    const mockLocation = {
      id_lokasi: 0, // temporary ID
      lokasi: lokasi || 'Preview',
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      kabupaten: kabupatenName
    };

    console.log('🏥 Preview: Menghitung jarak ke puskesmas terdekat untuk koordinat:', mockLocation.latitude, mockLocation.longitude);

    const enriched = await autogroupService.enrichLocationsWithDistance([mockLocation]);

    if (enriched && enriched[0]) {
      const { jarak_ke_puskesmas, puskesmas_terdekat, kategori_jarak } = enriched[0];
      console.log(`✅ Preview: Jarak calculated: ${jarak_ke_puskesmas?.toFixed(1)} km ke ${puskesmas_terdekat}`);

      return res.json({
        jarak_ke_puskesmas,
        puskesmas_terdekat,
        kategori_jarak,
        preview: true // flag to indicate this is a preview, not saved
      });
    } else {
      return res.status(500).json({ error: 'Gagal menghitung jarak - tidak ada data puskesmas' });
    }
  } catch (error) {
    console.error('⚠️ Preview calculate distance error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 🏥 Manual Calculate Distance - untuk tombol "Hitung Jarak Puskesmas" di frontend
app.post('/api/locations/:id/calculate-distance', async (req, res) => {
  const id = req.params.id;
  console.log('POST /api/locations/:id/calculate-distance - raw body:', req.body);
  console.log('POST /api/locations/:id/calculate-distance - id:', id);
  
  // Accept coordinates from request body (in case form has unsaved changes)
  const { latitude: formLat, longitude: formLon, lokasi: formLokasi } = req.body || {};
  console.log('Parsed from body:', { formLat, formLon, formLokasi, typeOfLat: typeof formLat });

  try {
    // Get lokasi data from database with JOIN to get kabupaten name
    pool.query(
      `SELECT l.id_lokasi, l.lokasi, l.latitude, l.longitude, l.id_kabupaten, k.nama as kabupaten 
       FROM data_lokasi_kkn l 
       LEFT JOIN kabupaten k ON l.id_kabupaten = k.id_kabupaten 
       WHERE l.id_lokasi = ?`,
      [id],
      async (err, rows) => {
        if (err) {
          console.error('SELECT error:', err);
          return res.status(500).json({ error: err.message });
        }

        if (!rows || rows.length === 0) {
          return res.status(404).json({ error: 'Lokasi tidak ditemukan' });
        }

        const lokasi = rows[0];
        
        // Use form coordinates if provided, otherwise use database values
        const useLatitude = formLat || lokasi.latitude;
        const useLongitude = formLon || lokasi.longitude;
        const useLokasi = formLokasi || lokasi.lokasi;

        // Validate koordinat
        if (!useLatitude || !useLongitude) {
          return res.status(400).json({ error: 'Lokasi tidak memiliki koordinat. Silakan klik "Cari Koordinat" terlebih dahulu.' });
        }
        
        // Update coordinates in database if provided from form
        if (formLat && formLon && (!lokasi.latitude || !lokasi.longitude)) {
          console.log('📍 Updating coordinates from form:', useLatitude, useLongitude);
          await pool.promise().query(
            'UPDATE data_lokasi_kkn SET latitude = ?, longitude = ? WHERE id_lokasi = ?',
            [useLatitude, useLongitude, id]
          );
        }

        console.log('🏥 Menghitung jarak ke puskesmas terdekat untuk:', useLokasi);

        try {
          // Create location object with form coordinates
          const locationForCalc = {
            ...lokasi,
            lokasi: useLokasi,
            latitude: useLatitude,
            longitude: useLongitude
          };
          
          const enriched = await autogroupService.enrichLocationsWithDistance([locationForCalc]);

          if (enriched && enriched[0]) {
            const { jarak_ke_puskesmas, puskesmas_terdekat, kategori_jarak } = enriched[0];

            // Update dengan data jarak puskesmas
            pool.query(
              'UPDATE data_lokasi_kkn SET jarak_ke_puskesmas = ?, puskesmas_terdekat = ?, kategori_jarak = ? WHERE id_lokasi = ?',
              [jarak_ke_puskesmas, puskesmas_terdekat, kategori_jarak, id],
              (updateErr) => {
                if (updateErr) {
                  console.error('⚠️  Error updating distance data:', updateErr);
                  return res.status(500).json({ error: 'Gagal menyimpan data jarak' });
                }

                console.log(`✅ Jarak calculated: ${jarak_ke_puskesmas?.toFixed(1)} km ke ${puskesmas_terdekat}`);

                // Return updated data with JOINs
                pool.query(
                  `SELECT l.id_lokasi, l.lokasi, d.nama as desa, kec.nama as kecamatan, kab.nama as kabupaten, 
                          l.latitude, l.longitude, l.jarak_ke_puskesmas, l.puskesmas_terdekat, l.kategori_jarak 
                   FROM data_lokasi_kkn l
                   LEFT JOIN desa d ON l.id_desa = d.id_desa
                   LEFT JOIN kecamatan kec ON l.id_kecamatan = kec.id_kecamatan
                   LEFT JOIN kabupaten kab ON l.id_kabupaten = kab.id_kabupaten
                   WHERE l.id_lokasi = ?`,
                  [id],
                  (selectErr, updatedRows) => {
                    if (selectErr) {
                      return res.status(500).json({ error: selectErr.message });
                    }
                    res.json({
                      success: true,
                      data: updatedRows[0],
                      jarak_ke_puskesmas,
                      puskesmas_terdekat,
                      kategori_jarak
                    });
                  }
                );
              }
            );
          } else {
            return res.status(500).json({ error: 'Gagal menghitung jarak puskesmas' });
          }
        } catch (distErr) {
          console.error('⚠️  Distance calculation failed:', distErr);
          return res.status(500).json({ error: 'Gagal menghitung jarak: ' + distErr.message });
        }
      }
    );
  } catch (err) {
    console.error('POST /api/locations/:id/calculate-distance error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ======================== PERIODE KKN ENDPOINTS ========================

// GET all periode
app.get('/api/periode', (req, res) => {
  console.log('GET /api/periode called');
  const query = `
    SELECT p.*, 
           (SELECT COUNT(*) FROM data_lokasi_kkn WHERE id_periode = p.id_periode) as lokasi_realtime,
           (SELECT COUNT(*) FROM data_dosen WHERE id_periode = p.id_periode) as dosen_realtime
    FROM periode_kkn p
    ORDER BY p.id_periode DESC
  `;
  pool.query(query, (err, rows) => {
    if (err) {
      console.error('GET periode error:', err);
      return res.status(500).json({ error: err.message });
    }
    // Return with both stored and realtime counts
    const result = rows.map(row => ({
      ...row,
      jumlah_lokasi: row.lokasi_realtime, // Use realtime count
      jumlah_dosen: row.dosen_realtime    // Use realtime count
    }));
    res.json(result || []);
  });
});

// GET active periode
app.get('/api/periode/active', (req, res) => {
  console.log('GET /api/periode/active called');
  pool.query('SELECT * FROM periode_kkn WHERE is_active = 1 LIMIT 1', (err, rows) => {
    if (err) {
      console.error('GET active periode error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows[0] || null);
  });
});

// GET single periode by ID
app.get('/api/periode/:id', (req, res) => {
  const id = req.params.id;
  console.log('GET /api/periode/:id called:', id);
  const query = `
    SELECT p.*, 
           (SELECT COUNT(*) FROM data_lokasi_kkn WHERE id_periode = p.id_periode) as lokasi_realtime,
           (SELECT COUNT(*) FROM data_dosen WHERE id_periode = p.id_periode) as dosen_realtime
    FROM periode_kkn p
    WHERE p.id_periode = ?
  `;
  pool.query(query, [id], (err, rows) => {
    if (err) {
      console.error('GET periode by id error:', err);
      return res.status(500).json({ error: err.message });
    }
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Periode tidak ditemukan' });
    }
    const result = {
      ...rows[0],
      jumlah_lokasi: rows[0].lokasi_realtime,
      jumlah_dosen: rows[0].dosen_realtime
    };
    res.json(result);
  });
});

// POST create new periode
app.post('/api/periode', (req, res) => {
  const { nama_periode, tahun_akademik, angkatan, tanggal_mulai, tanggal_selesai, is_active } = req.body;
  console.log('POST /api/periode called:', req.body);
  
  if (!nama_periode) {
    return res.status(400).json({ error: 'Nama periode wajib diisi' });
  }

  // If this periode is active, deactivate others first
  const createPeriode = () => {
    pool.query(
      `INSERT INTO periode_kkn (nama_periode, tahun_akademik, angkatan, tanggal_mulai, tanggal_selesai, is_active) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nama_periode, tahun_akademik || null, angkatan || null, tanggal_mulai || null, tanggal_selesai || null, is_active ? 1 : 0],
      (err, result) => {
        if (err) {
          console.error('INSERT periode error:', err);
          return res.status(500).json({ error: err.message });
        }
        res.json({ id_periode: result.insertId, ...req.body });
      }
    );
  };

  if (is_active) {
    pool.query('UPDATE periode_kkn SET is_active = 0', (err) => {
      if (err) console.error('Deactivate other periode error:', err);
      createPeriode();
    });
  } else {
    createPeriode();
  }
});

// PUT update periode
app.put('/api/periode/:id', (req, res) => {
  const id = req.params.id;
  const { nama_periode, tahun_akademik, angkatan, tanggal_mulai, tanggal_selesai, is_active } = req.body;
  console.log('PUT /api/periode/:id called:', id, req.body);

  const updatePeriode = () => {
    pool.query(
      `UPDATE periode_kkn SET nama_periode = ?, tahun_akademik = ?, angkatan = ?, tanggal_mulai = ?, tanggal_selesai = ?, is_active = ? WHERE id_periode = ?`,
      [nama_periode, tahun_akademik || null, angkatan || null, tanggal_mulai || null, tanggal_selesai || null, is_active ? 1 : 0, id],
      (err, result) => {
        if (err) {
          console.error('UPDATE periode error:', err);
          return res.status(500).json({ error: err.message });
        }
        res.json({ id_periode: id, ...req.body });
      }
    );
  };

  if (is_active) {
    pool.query('UPDATE periode_kkn SET is_active = 0 WHERE id_periode != ?', [id], (err) => {
      if (err) console.error('Deactivate other periode error:', err);
      updatePeriode();
    });
  } else {
    updatePeriode();
  }
});

// DELETE periode
app.delete('/api/periode/:id', (req, res) => {
  const id = req.params.id;
  console.log('DELETE /api/periode/:id called:', id);

  // Check if periode has locations
  pool.query('SELECT COUNT(*) as count FROM data_lokasi_kkn WHERE id_periode = ?', [id], (err, rows) => {
    if (err) {
      console.error('Count locations error:', err);
      return res.status(500).json({ error: err.message });
    }
    
    const count = rows[0]?.count || 0;
    if (count > 0) {
      return res.status(400).json({ error: `Tidak dapat menghapus periode karena masih memiliki ${count} lokasi. Hapus atau pindahkan lokasi terlebih dahulu.` });
    }

    pool.query('DELETE FROM periode_kkn WHERE id_periode = ?', [id], (deleteErr, result) => {
      if (deleteErr) {
        console.error('DELETE periode error:', deleteErr);
        return res.status(500).json({ error: deleteErr.message });
      }
      res.json({ deletedId: id });
    });
  });
});

// POST duplicate periode (copy locations from one periode to another)
app.post('/api/periode/:id/duplicate', async (req, res) => {
  const sourceId = req.params.id;
  const { nama_periode, tahun_akademik, angkatan, is_active } = req.body;
  console.log('POST /api/periode/:id/duplicate called:', sourceId, req.body);

  try {
    // Create new periode
    const createResult = await pool.promise().query(
      `INSERT INTO periode_kkn (nama_periode, tahun_akademik, angkatan, is_active) VALUES (?, ?, ?, ?)`,
      [nama_periode || `Copy of Periode ${sourceId}`, tahun_akademik || null, angkatan || null, is_active ? 1 : 0]
    );
    const newPeriodeId = createResult[0].insertId;

    // Copy all locations from source periode
    const [locations] = await pool.promise().query(
      `SELECT lokasi, id_provinsi, id_kabupaten, id_kecamatan, id_desa, latitude, longitude, jarak_ke_puskesmas, puskesmas_terdekat, kategori_jarak
       FROM data_lokasi_kkn WHERE id_periode = ?`,
      [sourceId]
    );

    if (locations.length > 0) {
      for (const loc of locations) {
        await pool.promise().query(
          `INSERT INTO data_lokasi_kkn (lokasi, id_provinsi, id_kabupaten, id_kecamatan, id_desa, latitude, longitude, jarak_ke_puskesmas, puskesmas_terdekat, kategori_jarak, id_periode)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [loc.lokasi, loc.id_provinsi, loc.id_kabupaten, loc.id_kecamatan, loc.id_desa, loc.latitude, loc.longitude, loc.jarak_ke_puskesmas, loc.puskesmas_terdekat, loc.kategori_jarak, newPeriodeId]
        );
      }
    }

    // If new periode is active, deactivate others
    if (is_active) {
      await pool.promise().query('UPDATE periode_kkn SET is_active = 0 WHERE id_periode != ?', [newPeriodeId]);
    }

    res.json({
      success: true,
      id_periode: newPeriodeId,
      nama_periode,
      jumlah_lokasi_copied: locations.length
    });
  } catch (err) {
    console.error('Duplicate periode error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST set periode as active
app.post('/api/periode/:id/activate', (req, res) => {
  const id = req.params.id;
  console.log('POST /api/periode/:id/activate called:', id);

  // Deactivate all, then activate this one
  pool.query('UPDATE periode_kkn SET is_active = 0', (err) => {
    if (err) {
      console.error('Deactivate all error:', err);
      return res.status(500).json({ error: err.message });
    }
    pool.query('UPDATE periode_kkn SET is_active = 1 WHERE id_periode = ?', [id], (updateErr, result) => {
      if (updateErr) {
        console.error('Activate periode error:', updateErr);
        return res.status(500).json({ error: updateErr.message });
      }
      res.json({ success: true, id_periode: id });
    });
  });
});

// POST recalculate periode summary (lokasi + dosen counts)
app.post('/api/periode/:id/recalculate', (req, res) => {
  const id = req.params.id;
  console.log('POST /api/periode/:id/recalculate called:', id);
  
  updatePeriodeSummary(id, (err, result) => {
    if (err) {
      console.error('Recalculate error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ 
      success: true, 
      id_periode: id,
      jumlah_lokasi: result.jumlah_lokasi,
      jumlah_dosen: result.jumlah_dosen
    });
  });
});

// POST recalculate ALL periode summaries
app.post('/api/periode/recalculate-all', (req, res) => {
  console.log('POST /api/periode/recalculate-all called');
  
  pool.query('SELECT id_periode FROM periode_kkn', (err, rows) => {
    if (err) {
      console.error('Error fetching periodes:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (rows.length === 0) {
      return res.json({ success: true, updated: 0, message: 'No periodes to update' });
    }
    
    let completed = 0;
    let errors = 0;
    const total = rows.length;
    
    rows.forEach(row => {
      updatePeriodeSummary(row.id_periode, (err) => {
        if (err) errors++;
        completed++;
        
        if (completed === total) {
          res.json({ 
            success: true, 
            updated: total - errors,
            failed: errors,
            total: total
          });
        }
      });
    });
  });
});

// ======================== KRITERIA ENDPOINTS ========================

// GET all kriteria with optional konfigurasi
app.get('/kriteria', (req, res) => {
  console.log('GET /kriteria called');
  pool.query('SELECT * FROM kriteria ORDER BY id_kriteria ASC', (err, rows) => {
    if (err) {
      console.error('GET kriteria error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// GET single kriteria by ID with its configurations
app.get('/kriteria/:id', (req, res) => {
  const id = req.params.id;
  console.log('GET /kriteria/:id called:', id);
  
  pool.query('SELECT * FROM kriteria WHERE id_kriteria = ?', [id], (err, rows) => {
    if (err) {
      console.error('GET kriteria by ID error:', err);
      return res.status(500).json({ error: err.message });
    }
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Kriteria tidak ditemukan' });
    }
    
    // Also get configurations for this kriteria
    pool.query('SELECT * FROM konfigurasi_kriteria WHERE id_kriteria = ? ORDER BY created_at DESC', [id], (confErr, confRows) => {
      if (confErr) {
        console.error('GET konfigurasi for kriteria error:', confErr);
        return res.json({ ...rows[0], konfigurasi: [] });
      }
      res.json({ ...rows[0], konfigurasi: confRows || [] });
    });
  });
});

// POST new kriteria
app.post('/kriteria', (req, res) => {
  const { nama_kriteria, deskripsi, tipe_data } = req.body;
  console.log('POST /kriteria:', { nama_kriteria, deskripsi, tipe_data });
  
  if (!nama_kriteria) {
    return res.status(400).json({ error: 'nama_kriteria harus diisi' });
  }
  
  const validTipeData = ['minimal', 'range', 'boolean', 'gender'];
  const tipe = validTipeData.includes(tipe_data) ? tipe_data : 'minimal';
  
  pool.query(
    'INSERT INTO kriteria (nama_kriteria, deskripsi, tipe_data) VALUES (?, ?, ?)',
    [nama_kriteria, deskripsi || null, tipe],
    (err, result) => {
      if (err) {
        console.error('INSERT kriteria error:', err);
        return res.status(500).json({ error: 'Database error: ' + err.message });
      }
      console.log('Inserted kriteria with ID:', result.insertId);
      
      pool.query('SELECT * FROM kriteria WHERE id_kriteria = ?', [result.insertId], (err, rows) => {
        if (err) {
          console.error('SELECT after INSERT error:', err);
          return res.status(500).json({ error: 'Database error: ' + err.message });
        }
        res.status(201).json({ message: 'Kriteria berhasil ditambahkan', data: rows[0] });
      });
    }
  );
});

// PUT update kriteria
app.put('/kriteria/:id', (req, res) => {
  const id = req.params.id;
  const { nama_kriteria, deskripsi, tipe_data } = req.body;
  console.log('PUT /kriteria/:id:', id, { nama_kriteria, deskripsi, tipe_data });
  
  if (!nama_kriteria) {
    return res.status(400).json({ error: 'nama_kriteria harus diisi' });
  }
  
  const validTipeData = ['minimal', 'range', 'boolean', 'gender'];
  const tipe = validTipeData.includes(tipe_data) ? tipe_data : 'minimal';
  
  pool.query(
    'UPDATE kriteria SET nama_kriteria = ?, deskripsi = ?, tipe_data = ? WHERE id_kriteria = ?',
    [nama_kriteria, deskripsi || null, tipe, id],
    (err, result) => {
      if (err) {
        console.error('UPDATE kriteria error:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Kriteria tidak ditemukan' });
      }
      
      pool.query('SELECT * FROM kriteria WHERE id_kriteria = ?', [id], (err, rows) => {
        if (err) {
          console.error('SELECT after UPDATE error:', err);
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Kriteria berhasil diperbarui', data: rows[0] });
      });
    }
  );
});

// DELETE kriteria
app.delete('/kriteria/:id', (req, res) => {
  const id = req.params.id;
  console.log('DELETE /kriteria/:id:', id);
  
  pool.query('DELETE FROM kriteria WHERE id_kriteria = ?', [id], (err, result) => {
    if (err) {
      console.error('DELETE kriteria error:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Kriteria tidak ditemukan' });
    }
    
    res.json({ message: 'Kriteria berhasil dihapus', deletedId: parseInt(id) });
  });
});

// ======================== KONFIGURASI KRITERIA ENDPOINTS ========================

// GET all konfigurasi_kriteria (with kriteria info)
app.get('/konfigurasi-kriteria', (req, res) => {
  console.log('GET /konfigurasi-kriteria called');
  pool.query(`
    SELECT kk.*, k.nama_kriteria, k.tipe_data 
    FROM konfigurasi_kriteria kk 
    JOIN kriteria k ON kk.id_kriteria = k.id_kriteria 
    ORDER BY kk.created_at DESC
  `, (err, rows) => {
    if (err) {
      console.error('GET konfigurasi-kriteria error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// GET active konfigurasi for all kriteria (for autogrup use)
app.get('/konfigurasi-kriteria/active', (req, res) => {
  console.log('GET /konfigurasi-kriteria/active called');
  pool.query(`
    SELECT kk.*, k.nama_kriteria, k.deskripsi as kriteria_deskripsi, k.tipe_data 
    FROM konfigurasi_kriteria kk 
    JOIN kriteria k ON kk.id_kriteria = k.id_kriteria 
    WHERE kk.is_active = 1
    ORDER BY k.id_kriteria ASC
  `, (err, rows) => {
    if (err) {
      console.error('GET active konfigurasi-kriteria error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// POST new konfigurasi_kriteria
app.post('/konfigurasi-kriteria', (req, res) => {
  const { id_kriteria, tahun_ajaran, angkatan_kkn, nilai_min, nilai_max, nilai_boolean, nilai_gender, is_active } = req.body;
  console.log('POST /konfigurasi-kriteria:', req.body);
  
  if (!id_kriteria) {
    return res.status(400).json({ error: 'id_kriteria harus diisi' });
  }
  
  pool.query(
    `INSERT INTO konfigurasi_kriteria 
     (id_kriteria, tahun_ajaran, angkatan_kkn, nilai_min, nilai_max, nilai_boolean, nilai_gender, is_active) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id_kriteria, 
      tahun_ajaran || null,
      angkatan_kkn || null,
      nilai_min || null, 
      nilai_max || null, 
      nilai_boolean !== undefined ? nilai_boolean : null, 
      nilai_gender || null,
      is_active !== undefined ? is_active : 1
    ],
    (err, result) => {
      if (err) {
        console.error('INSERT konfigurasi_kriteria error:', err);
        return res.status(500).json({ error: 'Database error: ' + err.message });
      }
      
      pool.query('SELECT * FROM konfigurasi_kriteria WHERE id_konfigurasi = ?', [result.insertId], (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Konfigurasi berhasil ditambahkan', data: rows[0] });
      });
    }
  );
});

// PUT update konfigurasi_kriteria
app.put('/konfigurasi-kriteria/:id', (req, res) => {
  const id = req.params.id;
  const { tahun_ajaran, angkatan_kkn, nilai_min, nilai_max, nilai_boolean, nilai_gender, is_active } = req.body;
  console.log('PUT /konfigurasi-kriteria/:id:', id, req.body);
  
  pool.query(
    `UPDATE konfigurasi_kriteria SET 
     tahun_ajaran = ?, angkatan_kkn = ?, nilai_min = ?, nilai_max = ?, nilai_boolean = ?, nilai_gender = ?, is_active = ?
     WHERE id_konfigurasi = ?`,
    [tahun_ajaran || null, angkatan_kkn || null, nilai_min || null, nilai_max || null, nilai_boolean, nilai_gender || null, is_active !== undefined ? is_active : 1, id],
    (err, result) => {
      if (err) {
        console.error('UPDATE konfigurasi_kriteria error:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Konfigurasi tidak ditemukan' });
      }
      
      pool.query('SELECT * FROM konfigurasi_kriteria WHERE id_konfigurasi = ?', [id], (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Konfigurasi berhasil diperbarui', data: rows[0] });
      });
    }
  );
});

// DELETE konfigurasi_kriteria
app.delete('/konfigurasi-kriteria/:id', (req, res) => {
  const id = req.params.id;
  console.log('DELETE /konfigurasi-kriteria/:id:', id);
  
  pool.query('DELETE FROM konfigurasi_kriteria WHERE id_konfigurasi = ?', [id], (err, result) => {
    if (err) {
      console.error('DELETE konfigurasi_kriteria error:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Konfigurasi tidak ditemukan' });
    }
    
    res.json({ message: 'Konfigurasi berhasil dihapus', deletedId: parseInt(id) });
  });
});

// Batch save/update konfigurasi for autogrup
app.post('/konfigurasi-kriteria/batch', (req, res) => {
  const { konfigurasi, tahun_ajaran, angkatan_kkn } = req.body;
  console.log('=== POST /konfigurasi-kriteria/batch ===');
  console.log('Tahun Ajaran:', tahun_ajaran, 'Angkatan KKN:', angkatan_kkn);
  console.log('Received kriteria count:', konfigurasi ? konfigurasi.length : 0);
  console.log('Raw data:', JSON.stringify(konfigurasi, null, 2));
  
  if (!Array.isArray(konfigurasi) || konfigurasi.length === 0) {
    return res.status(400).json({ error: 'konfigurasi harus berupa array yang tidak kosong' });
  }
  
  // Deactivate all existing configurations first
  pool.query('UPDATE konfigurasi_kriteria SET is_active = 0', (deactErr) => {
    if (deactErr) {
      console.error('Deactivate konfigurasi error:', deactErr);
    }
    
    // Insert/update each configuration
    let completed = 0;
    let errors = [];
    
    konfigurasi.forEach((config) => {
      const { id_kriteria, nilai_min, nilai_max, nilai_boolean, nilai_gender } = config;
      
      // Validate and clean values based on type
      let cleanNilaiMin = 0;
      let cleanNilaiMax = 0;
      let cleanNilaiBoolean = 0;
      let cleanNilaiGender = '';
      
      // Parse nilai_min
      if (nilai_min !== null && nilai_min !== undefined && nilai_min !== '') {
        const parsed = parseInt(nilai_min, 10);
        if (!isNaN(parsed)) {
          cleanNilaiMin = parsed;
        }
      }
      
      // Parse nilai_max
      if (nilai_max !== null && nilai_max !== undefined && nilai_max !== '') {
        const parsed = parseInt(nilai_max, 10);
        if (!isNaN(parsed)) {
          cleanNilaiMax = parsed;
        }
      }
      
      // Parse nilai_boolean (must be 0 or 1)
      if (nilai_boolean !== null && nilai_boolean !== undefined) {
        cleanNilaiBoolean = (nilai_boolean === 1 || nilai_boolean === true || nilai_boolean === '1') ? 1 : 0;
      }
      
      // Parse nilai_gender (must be string)
      if (nilai_gender !== null && nilai_gender !== undefined && typeof nilai_gender === 'string' && nilai_gender !== '') {
        cleanNilaiGender = nilai_gender;
      }
      
      console.log('Saving kriteria:', {
        id_kriteria,
        tahun_ajaran,
        angkatan_kkn,
        nilai_min: cleanNilaiMin,
        nilai_max: cleanNilaiMax,
        nilai_boolean: cleanNilaiBoolean,
        nilai_gender: cleanNilaiGender
      });
      
      pool.query(
        `INSERT INTO konfigurasi_kriteria (id_kriteria, tahun_ajaran, angkatan_kkn, nilai_min, nilai_max, nilai_boolean, nilai_gender, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [id_kriteria, tahun_ajaran || null, angkatan_kkn || null, cleanNilaiMin, cleanNilaiMax, cleanNilaiBoolean, cleanNilaiGender],
        (err) => {
          completed++;
          if (err) {
            console.error('Insert error:', err.message);
            errors.push(err.message);
          }
          
          if (completed === konfigurasi.length) {
            if (errors.length > 0) {
              res.status(500).json({ message: 'Sebagian konfigurasi gagal disimpan', errors });
            } else {
              res.json({ message: 'Semua konfigurasi berhasil disimpan', count: konfigurasi.length });
            }
          }
        }
      );
    });
  });
});

// Deactivate all konfigurasi kriteria
app.post('/konfigurasi-kriteria/deactivate-all', (req, res) => {
  console.log('POST /konfigurasi-kriteria/deactivate-all');
  
  pool.query('UPDATE konfigurasi_kriteria SET is_active = 0', (err, result) => {
    if (err) {
      console.error('Deactivate all error:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.json({ 
      success: true, 
      message: 'Semua konfigurasi kriteria telah dinonaktifkan',
      affected: result.affectedRows 
    });
  });
});

// ======================== MAHASISWA KKN ENDPOINTS ========================

// Import mahasiswa from Excel
app.post('/mahasiswa/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File tidak ditemukan' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      return res.status(400).json({ error: 'File Excel kosong' });
    }

    // Clear existing data
    pool.query('DELETE FROM data_peserta_kkn', (err) => {
      if (err) {
        console.error('Clear mahasiswa error:', err);
        return res.status(500).json({ error: 'Gagal menghapus data lama' });
      }

      let insertedCount = 0;
      let errors = [];

      // Insert each row
      data.forEach((row, index) => {
        // Extract only allowed columns (case-insensitive)
        const nim = row.nim || row.NIM || row.Nim || '';
        const nama = row.nama || row.Nama || row.NAMA || '';
        const prodi = row.prodi || row.Prodi || row.PRODI || '';
        const fakultas = row.fakultas || row.Fakultas || row.FAKULTAS || '';
        const jenis_kelamin = row.jenis_kelamin || row['Jenis Kelamin'] || row.JENIS_KELAMIN || '';
        const nomor_telepon = row.nomor_telepon || row['Nomor Telepon'] || row.NOMOR_TELEPON || '';
        const kesehatan = row.kesehatan || row.Kesehatan || row.KESEHATAN || '';

        // Skip if no NIM or nama
        if (!nim || !nama) {
          errors.push(`Baris ${index + 2}: NIM atau Nama kosong`);
          return;
        }

        pool.query(
          'INSERT INTO data_peserta_kkn (nim, nama, prodi, fakultas, jenis_kelamin, nomor_telepon, kesehatan, is_reguler) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
          [nim, nama, prodi, fakultas, jenis_kelamin, nomor_telepon, kesehatan],
          (err) => {
            if (err) {
              console.error('Insert mahasiswa error:', err);
              errors.push(`Baris ${index + 2}: ${err.message}`);
            } else {
              insertedCount++;
            }

            // Send response after processing all rows
            if (insertedCount + errors.length === data.length) {
              res.json({
                message: 'Import selesai',
                inserted: insertedCount,
                total: data.length,
                errors: errors.length > 0 ? errors : null
              });
            }
          }
        );
      });
    });
  } catch (err) {
    console.error('Import mahasiswa error:', err);
    res.status(500).json({ error: 'Gagal import data: ' + err.message });
  }
});

// Import mahasiswa from JSON (frontend-parsed)
app.post('/mahasiswa/import-json', async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'Data tidak valid atau kosong' });
    }

    // Clear existing data first
    await new Promise((resolve, reject) => {
      pool.query('DELETE FROM data_peserta_kkn', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    let insertedCount = 0;
    let errors = [];
    const insertedData = [];

    // Process each row
    for (let index = 0; index < data.length; index++) {
      const row = data[index];
      
      // Extract only allowed columns (case-insensitive)
      // KOLOM WAJIB: nim, nama, prodi, fakultas, jenis_kelamin, nomor_telepon, kesehatan
      // Kolom lain di Excel akan diabaikan (tidak dimasukkan ke database)
      const nim = row.nim || row.NIM || row.Nim || '';
      const nama = row.nama || row.Nama || row.NAMA || '';
      const prodi = row.prodi || row.Prodi || row.PRODI || '';
      const fakultas = row.fakultas || row.Fakultas || row.FAKULTAS || '';
      const jenis_kelamin = row.jenis_kelamin || row['Jenis Kelamin'] || row.JENIS_KELAMIN || row.gender || '';
      const nomor_telepon = row.nomor_telepon || row['Nomor Telepon'] || row.NOMOR_TELEPON || row.no_telepon || row.telepon || row['No.Telepon'] || '';
      const kesehatan = row.kesehatan || row.Kesehatan || row.KESEHATAN || '';

      // Validasi kolom wajib
      const missingFields = [];
      if (!nim) missingFields.push('NIM');
      if (!nama) missingFields.push('Nama');
      if (!prodi) missingFields.push('Prodi');
      if (!fakultas) missingFields.push('Fakultas');
      if (!jenis_kelamin) missingFields.push('Jenis Kelamin');
      if (!nomor_telepon) missingFields.push('No.Telepon');
      if (!kesehatan) missingFields.push('Kesehatan');

      if (missingFields.length > 0) {
        errors.push(`Baris ${index + 2}: Data wajib kosong (${missingFields.join(', ')})`);
        continue;
      }

      try {
        await new Promise((resolve, reject) => {
          pool.query(
            'INSERT INTO data_peserta_kkn (nim, nama, prodi, fakultas, jenis_kelamin, nomor_telepon, kesehatan, is_reguler) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
            [nim, nama, prodi, fakultas, jenis_kelamin, nomor_telepon, kesehatan],
            (err, result) => {
              if (err) {
                errors.push(`Baris ${index + 2}: ${err.message}`);
                resolve(); // Continue even on error
              } else {
                insertedCount++;
                insertedData.push({
                  id_peserta: result.insertId,
                  nim, nama, prodi, fakultas, jenis_kelamin, nomor_telepon, kesehatan, is_reguler: 1
                });
                resolve();
              }
            }
          );
        });
      } catch (insertErr) {
        errors.push(`Baris ${index + 2}: ${insertErr.message}`);
      }
    }

    res.json({
      message: 'Import selesai',
      inserted: insertedCount,
      total: data.length,
      data: insertedData,
      errors: errors.length > 0 ? errors : null
    });
  } catch (err) {
    console.error('Import mahasiswa JSON error:', err);
    res.status(500).json({ error: 'Gagal import data: ' + err.message });
  }
});

// ======================== IMPORT WITH TEMATIK MATCHING ========================
/**
 * Import mahasiswa dengan matching tematik
 * - Menerima data_master (semua pendaftar KKN)
 * - Menerima data_tematik (daftar NIM mahasiswa tematik)
 * - Menandai is_reguler = 0 jika NIM ada di tematik, otherwise is_reguler = 1
 * - Bulk insert ke database
 */
app.post('/mahasiswa/import-with-tematik', async (req, res) => {
  try {
    const { data_master, data_tematik } = req.body;
    
    // Validasi input
    if (!data_master || !Array.isArray(data_master) || data_master.length === 0) {
      return res.status(400).json({ error: 'Data master (pendaftar KKN) tidak valid atau kosong' });
    }
    
    console.log(`📥 Import dengan tematik matching:`);
    console.log(`   - Data Master: ${data_master.length} records`);
    console.log(`   - Data Tematik: ${data_tematik?.length || 0} records`);
    
    // Helper function: Cari nilai NIM dari row dengan berbagai kemungkinan nama kolom
    // Ini mengatasi masalah Excel parser yang kadang menambah spasi/karakter tersembunyi
    const extractNIM = (row) => {
      if (!row) return '';
      
      // Coba akses langsung dulu
      const directAccess = row.nim || row.NIM || row.Nim || row.NPM || row.npm || row.NRP || row.nrp;
      if (directAccess) return directAccess.toString().trim();
      
      // Iterasi semua keys dan cari yang mengandung 'nim', 'npm', 'nrp', atau 'no induk'
      for (const key of Object.keys(row)) {
        const keyLower = key.toLowerCase().trim();
        if (keyLower === 'nim' || keyLower === 'npm' || keyLower === 'nrp' || 
            keyLower.includes('nim') || keyLower.includes('npm') || keyLower.includes('nrp') ||
            keyLower.includes('no induk') || keyLower.includes('no_induk') ||
            keyLower.includes('nomor induk')) {
          const val = row[key];
          if (val !== undefined && val !== null && val !== '') {
            return val.toString().trim();
          }
        }
      }
      return '';
    };
    
    // Debug: lihat struktur data tematik
    if (data_tematik && data_tematik.length > 0) {
      const keys = Object.keys(data_tematik[0]);
      console.log(`   - Kolom tersedia di file tematik (${keys.length}):`, keys);
      console.log(`   - Sample baris pertama:`, JSON.stringify(data_tematik[0]));
      // Test extractNIM pada baris pertama
      const testNIM = extractNIM(data_tematik[0]);
      console.log(`   - Test extractNIM baris pertama: "${testNIM}"`);
    }
    
    // Step 1: Build Set dari NIM tematik untuk pencocokan cepat O(1)
    // Menggunakan WHILE LOOP untuk membaca file tematik baris demi baris
    const nimTematikSet = new Set();
    const nimTematikList = []; // Untuk logging lengkap
    
    if (data_tematik && Array.isArray(data_tematik)) {
      let idx = 0;
      console.log(`\n   🔍 Memulai pembacaan file tematik dengan WHILE LOOP...`);
      
      while (idx < data_tematik.length) {
        const row = data_tematik[idx];
        console.log(`      [Baris ${idx + 1}] Processing: ${JSON.stringify(row)}`);
        
        const nim = extractNIM(row);
        
        if (nim && nim.length >= 5) { // NIM biasanya minimal 5 digit
          nimTematikSet.add(nim.toLowerCase());
          nimTematikList.push(nim);
          console.log(`      ✅ [Baris ${idx + 1}] NIM "${nim}" berhasil ditambahkan`);
        } else {
          console.log(`      ❌ [Baris ${idx + 1}] NIM tidak valid atau kosong (nim="${nim}", length=${nim?.length || 0})`);
        }
        
        idx++; // Increment untuk lanjut ke baris berikutnya
      }
      
      console.log(`\n   ✅ WHILE LOOP selesai. Total iterasi: ${idx} baris`);
    }
    
    console.log(`   ✅ Total NIM Tematik berhasil dibaca: ${nimTematikSet.size} dari ${data_tematik?.length || 0} baris`);
    
    // Tampilkan SEMUA NIM tematik untuk verifikasi
    if (nimTematikList.length > 0) {
      console.log(`   📋 Daftar lengkap NIM Tematik:`);
      let listIdx = 0;
      while (listIdx < nimTematikList.length) {
        console.log(`      ${listIdx + 1}. ${nimTematikList[listIdx]}`);
        listIdx++;
      }
    }
    
    // Step 2: Clear existing data
    await new Promise((resolve, reject) => {
      pool.query('DELETE FROM data_peserta_kkn', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Step 3: Process dan flag setiap mahasiswa menggunakan WHILE loop
    let insertedCount = 0;
    let tematikCount = 0;
    let regulerCount = 0;
    let errors = [];
    const insertedData = [];
    
    // Menggunakan WHILE untuk iterasi baris demi baris (sesuai penjelasan ke dosen)
    let index = 0;
    while (index < data_master.length) {
      const row = data_master[index];
      
      // Extract kolom (case-insensitive) - gunakan helper untuk NIM
      const nim = extractNIM(row);
      const nama = row.nama || row.Nama || row.NAMA || '';
      const prodi = row.prodi || row.Prodi || row.PRODI || '';
      const fakultas = row.fakultas || row.Fakultas || row.FAKULTAS || '';
      const jenis_kelamin = row.jenis_kelamin || row['Jenis Kelamin'] || row.JENIS_KELAMIN || row.gender || row.JK || row.jk || '';
      const nomor_telepon = row.nomor_telepon || row['Nomor Telepon'] || row.NOMOR_TELEPON || row.telepon || '';
      const kesehatan = row.kesehatan || row.Kesehatan || row.KESEHATAN || '';
      
      // Validasi kolom wajib
      const missingFields = [];
      if (!nim) missingFields.push('NIM');
      if (!nama) missingFields.push('Nama');
      if (!prodi) missingFields.push('Prodi');
      if (!fakultas) missingFields.push('Fakultas');
      if (!jenis_kelamin) missingFields.push('Jenis Kelamin');
      if (!kesehatan) missingFields.push('Kesehatan');
      
      if (missingFields.length > 0) {
        errors.push(`Baris ${index + 2}: Data wajib kosong (${missingFields.join(', ')})`);
        continue;
      }
      
      // Step 4: Matching - cek apakah NIM ada di Set tematik
      // Jika ada di tematik → is_reguler = 0
      // Jika tidak ada → is_reguler = 1
      const nimLower = nim.toLowerCase();
      const foundInTematik = nimTematikSet.has(nimLower);
      const is_reguler = foundInTematik ? 0 : 1;
      
      // Debug: log matching untuk mahasiswa yang ditemukan di tematik
      if (foundInTematik) {
        console.log(`   🔍 MATCH TEMATIK: NIM "${nim}" (${nama}) → is_reguler = 0`);
      }
      
      if (is_reguler === 0) {
        tematikCount++;
      } else {
        regulerCount++;
      }
      
      try {
        await new Promise((resolve, reject) => {
          pool.query(
            'INSERT INTO data_peserta_kkn (nim, nama, prodi, fakultas, jenis_kelamin, nomor_telepon, kesehatan, is_reguler) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [nim, nama, prodi, fakultas, jenis_kelamin, nomor_telepon, kesehatan, is_reguler],
            (err, result) => {
              if (err) {
                errors.push(`Baris ${index + 2}: ${err.message}`);
                resolve();
              } else {
                insertedCount++;
                insertedData.push({
                  id_peserta: result.insertId,
                  nim, nama, prodi, fakultas, jenis_kelamin, nomor_telepon, kesehatan, is_reguler
                });
                resolve();
              }
            }
          );
        });
      } catch (insertErr) {
        errors.push(`Baris ${index + 2}: ${insertErr.message}`);
      }
      
      // Increment index untuk iterasi while berikutnya
      index++;
    }
    
    console.log(`✅ Import selesai:`);
    console.log(`   - Total inserted: ${insertedCount}`);
    console.log(`   - Reguler (is_reguler=1): ${regulerCount}`);
    console.log(`   - Tematik (is_reguler=0): ${tematikCount}`);
    
    res.json({
      message: 'Import dengan tematik matching selesai',
      inserted: insertedCount,
      total: data_master.length,
      reguler_count: regulerCount,
      tematik_count: tematikCount,
      data: insertedData,
      errors: errors.length > 0 ? errors : null
    });
  } catch (err) {
    console.error('Import with tematik matching error:', err);
    res.status(500).json({ error: 'Gagal import data: ' + err.message });
  }
});

// Get all mahasiswa
app.get('/mahasiswa', (req, res) => {
  pool.query('SELECT * FROM data_peserta_kkn ORDER BY id_peserta ASC', (err, rows) => {
    if (err) {
      console.error('GET mahasiswa error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// Get mahasiswa statistik
app.get('/mahasiswa/statistik', (req, res) => {
  pool.query('SELECT * FROM data_peserta_kkn', (err, rows) => {
    if (err) {
      console.error('GET mahasiswa statistik error:', err);
      return res.status(500).json({ error: err.message });
    }

    const total = rows.length;
    const lakiLaki = rows.filter(m => {
      const jk = (m.jenis_kelamin || '').toLowerCase();
      return jk.includes('laki') || jk === 'l' || jk === 'male';
    }).length;
    const perempuan = rows.filter(m => {
      const jk = (m.jenis_kelamin || '').toLowerCase();
      return jk.includes('perempuan') || jk === 'p' || jk === 'female';
    }).length;
    const sakit = rows.filter(m => {
      const kes = (m.kesehatan || '').toLowerCase();
      return kes.includes('sakit') || kes.includes('tidak sehat');
    }).length;

    res.json({
      total,
      laki_laki: lakiLaki,
      perempuan,
      sakit
    });
  });
});

// Get mahasiswa analytics per tahun (untuk grafik)
app.get('/mahasiswa/analytics', (req, res) => {
  // Ambil data dari hasil_autogrup yang punya angkatan_kkn
  pool.query(
    `SELECT 
      angkatan_kkn, 
      jumlah_mahasiswa,
      jumlah_kelompok,
      created_at
     FROM hasil_autogrup 
     WHERE angkatan_kkn IS NOT NULL 
     ORDER BY angkatan_kkn ASC`,
    (err, rows) => {
      if (err) {
        console.error('GET mahasiswa analytics error:', err);
        return res.status(500).json({ error: err.message });
      }

      // Group by angkatan_kkn
      const groupedByAngkatan = {};
      rows.forEach(row => {
        const angkatan = row.angkatan_kkn;
        if (!groupedByAngkatan[angkatan]) {
          groupedByAngkatan[angkatan] = {
            angkatan: angkatan,
            total_mahasiswa: 0,
            total_kelompok: 0,
            count: 0
          };
        }
        groupedByAngkatan[angkatan].total_mahasiswa += row.jumlah_mahasiswa || 0;
        groupedByAngkatan[angkatan].total_kelompok += row.jumlah_kelompok || 0;
        groupedByAngkatan[angkatan].count++;
      });

      // Convert to array and sort
      const analytics = Object.values(groupedByAngkatan).sort((a, b) => {
        // Parse tahun dari angkatan (misal '2023/2024' -> 2023)
        const yearA = parseInt(a.angkatan.split('/')[0]);
        const yearB = parseInt(b.angkatan.split('/')[0]);
        return yearA - yearB;
      });

      res.json(analytics);
    }
  );
});

// Delete all mahasiswa
app.delete('/mahasiswa', (req, res) => {
  pool.query('DELETE FROM data_peserta_kkn', (err) => {
    if (err) {
      console.error('DELETE all mahasiswa error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Semua data mahasiswa berhasil dihapus' });
  });
});

// ======================== KONFIGURASI AUTOGRUP ENDPOINTS ========================

// Save konfigurasi autogrup
app.post('/konfigurasi-autogrup', (req, res) => {
  const {
    nama_aturan,
    tahun_ajaran,
    angkatan_kkn,
    kriteria_config
  } = req.body;

  console.log('POST /konfigurasi-autogrup:', req.body);

  pool.query(
    `INSERT INTO konfigurasi_autogrup 
    (nama_aturan, tahun_ajaran, angkatan_kkn, kriteria_config) 
    VALUES (?, ?, ?, ?)`,
    [
      nama_aturan || `Aturan ${tahun_ajaran || angkatan_kkn}`,
      tahun_ajaran,
      angkatan_kkn,
      kriteria_config || null
    ],
    (err, result) => {
      if (err) {
        console.error('INSERT konfigurasi error:', err);
        return res.status(500).json({ error: err.message });
      }

      pool.query('SELECT * FROM konfigurasi_autogrup WHERE id = ?', [result.insertId], (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json(rows[0]);
      });
    }
  );
});

// Get latest konfigurasi
app.get('/konfigurasi-autogrup/latest', (req, res) => {
  pool.query('SELECT * FROM konfigurasi_autogrup ORDER BY created_at DESC LIMIT 1', (err, rows) => {
    if (err) {
      console.error('GET latest konfigurasi error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows.length > 0 ? rows[0] : null);
  });
});

// Get all konfigurasi
app.get('/konfigurasi-autogrup', (req, res) => {
  pool.query('SELECT * FROM konfigurasi_autogrup ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      console.error('GET konfigurasi error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// ======================== GENERATE AUTOGROUP ENDPOINT ========================

// Generate autogroup menggunakan Rule-Based Algorithm
app.post('/autogroup/generate', async (req, res) => {
  try {
    console.log('Starting autogroup generation...');
    const { saveResult } = req.body; // Optional: auto-save to hasil_autogrup
    
    // Panggil service autogroup
    const result = await autogroupService.generateAutogroup(pool);
    
    console.log('Autogroup generated successfully:', {
      jumlah_kelompok: result.groups.length,
      total_mahasiswa: result.statistics.total_mahasiswa
    });
    
    // Return hasil (dengan opsi save nanti)
    res.json({
      success: true,
      rules: result.rules,
      konfigurasi: result.konfigurasi,
      groups: result.groups,
      statistics: result.statistics
    });
  } catch (err) {
    console.error('Generate autogroup error:', err);
    res.status(500).json({ 
      success: false,
      error: err.message || 'Gagal generate autogroup'
    });
  }
});

// Save hasil autogroup ke tabel hasil_autogrup
app.post('/autogroup/save', async (req, res) => {
  try {
    const { groups, rules, konfigurasi, statistics } = req.body;
    
    if (!groups || groups.length === 0) {
      return res.status(400).json({ error: 'Data kelompok kosong' });
    }
    
    console.log('Saving autogroup result...');
    
    // Prepare data
    const dataKelompok = JSON.stringify(groups);
    const konfSnapshot = JSON.stringify({ rules, konfigurasi });
    const statistikJson = JSON.stringify(statistics);
    
    // Insert ke hasil_autogrup
    pool.query(
      `INSERT INTO hasil_autogrup 
       (id_konfigurasi, angkatan_kkn, nama_aturan, jumlah_kelompok, jumlah_mahasiswa, jumlah_lokasi, data_kelompok, konfigurasi_snapshot, statistik) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        konfigurasi?.id || null,
        konfigurasi?.angkatan_kkn || null,
        konfigurasi?.nama_aturan || 'Hasil Autogroup',
        statistics?.jumlah_kelompok || groups.length,
        statistics?.total_mahasiswa || 0,
        statistics?.jumlah_lokasi || 0,
        dataKelompok,
        konfSnapshot,
        statistikJson
      ],
      (err, result) => {
        if (err) {
          console.error('INSERT hasil_autogrup error:', err);
          return res.status(500).json({ error: 'Gagal menyimpan hasil: ' + err.message });
        }
        
        const idHasil = result.insertId;
        console.log('✅ Hasil autogrup saved with ID:', idHasil);
        
        // Insert detail per mahasiswa menggunakan Promise.all untuk memastikan semua selesai
        const insertPromises = [];
        
        groups.forEach(group => {
          if (!group.anggota || group.anggota.length === 0) {
            console.warn(`⚠️ Group ${group.nomor_kelompok} has no anggota`);
            return;
          }
          
          group.anggota.forEach(mhs => {
            const promise = new Promise((resolve, reject) => {
              pool.query(
                `INSERT INTO detail_hasil_autogrup 
                 (id_hasil, nomor_kelompok, id_lokasi, lokasi, desa, kecamatan, kabupaten, nim, nama, prodi, fakultas, jenis_kelamin, nomor_telepon, kesehatan) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  idHasil,
                  group.nomor_kelompok,
                  group.id_lokasi || null,
                  group.lokasi || null,
                  group.desa || null,
                  group.kecamatan || null,
                  group.kabupaten || null,
                  mhs.nim || null,
                  mhs.nama || null,
                  mhs.prodi || null,
                  mhs.fakultas || null,
                  mhs.jenis_kelamin || null,
                  mhs.nomor_telepon || null,
                  mhs.kesehatan || null
                ],
                (detailErr) => {
                  if (detailErr) {
                    console.error('❌ INSERT detail error:', detailErr.message);
                    reject(detailErr);
                  } else {
                    resolve();
                  }
                }
              );
            });
            insertPromises.push(promise);
          });
        });
        
        // Wait for all inserts to complete
        Promise.allSettled(insertPromises)
          .then(results => {
            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;
            
            console.log(`📊 Insert detail results: ${successful} sukses, ${failed} gagal dari ${insertPromises.length} total`);
            
            return res.json({
              success: true,
              id_hasil: idHasil,
              inserted_details: successful,
              failed_details: failed,
              message: `Hasil autogroup berhasil disimpan (${successful} detail mahasiswa)`
            });
          })
          .catch(err => {
            console.error('❌ Error during detail inserts:', err);
            return res.json({
              success: true,
              id_hasil: idHasil,
              message: 'Hasil autogroup disimpan, tapi ada masalah saat menyimpan detail'
            });
          });
      }
    );
  } catch (err) {
    console.error('❌ Save autogroup error:', err);
    res.status(500).json({ error: err.message || 'Gagal menyimpan hasil' });
  }
});

// GET semua hasil autogroup
app.get('/autogroup/hasil', (req, res) => {
  pool.query(
    'SELECT id_hasil, angkatan_kkn, nama_aturan, jumlah_kelompok, jumlah_mahasiswa, jumlah_lokasi, statistik, created_at FROM hasil_autogrup ORDER BY created_at DESC',
    (err, rows) => {
      if (err) {
        console.error('GET hasil_autogrup error:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows || []);
    }
  );
});

// GET detail hasil autogroup by ID
app.get('/autogroup/hasil/:id', (req, res) => {
  const id = req.params.id;
  
  pool.query('SELECT * FROM hasil_autogrup WHERE id_hasil = ?', [id], (err, rows) => {
    if (err) {
      console.error('GET hasil_autogrup by ID error:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Hasil tidak ditemukan' });
    }
    
    const hasil = rows[0];
    
    // Parse JSON fields
    hasil.data_kelompok = hasil.data_kelompok ? JSON.parse(hasil.data_kelompok) : [];
    hasil.konfigurasi_snapshot = hasil.konfigurasi_snapshot ? JSON.parse(hasil.konfigurasi_snapshot) : null;
    hasil.statistik = hasil.statistik ? JSON.parse(hasil.statistik) : null;
    
    res.json(hasil);
  });
});

// GET detail per-mahasiswa dari hasil autogroup
app.get('/autogroup/hasil/:id/detail', (req, res) => {
  const id = req.params.id;
  console.log('📥 GET /autogroup/hasil/:id/detail - id_hasil:', id);
  
  // Try to fetch with JOIN first
  pool.query(
    `SELECT 
      d.*,
      m.nama AS nama_dpl
    FROM detail_hasil_autogrup d
    LEFT JOIN data_dosen m ON d.id_dosen = m.id_dosen
    WHERE d.id_hasil = ? 
    ORDER BY d.nomor_kelompok, d.nama`,
    [id],
    (err, rows) => {
      if (err) {
        console.error('❌ GET detail_hasil_autogrup error:', err.message);
        console.error('❌ Error code:', err.code);
        
        // If data_dosen table doesn't exist, try without JOIN
        if (err.code === 'ER_NO_SUCH_TABLE' || (err.sqlMessage && err.sqlMessage.includes('data_dosen'))) {
          console.warn('⚠️ Table data_dosen not found, fetching without DPL info');
          pool.query(
            `SELECT * FROM detail_hasil_autogrup WHERE id_hasil = ? ORDER BY nomor_kelompok, nama`,
            [id],
            (err2, rows2) => {
              if (err2) {
                console.error('❌ Fallback query error:', err2.message);
                return res.status(500).json({ error: err2.message });
              }
              
              // Process rows without DPL
              const grouped2 = {};
              rows2.forEach(row => {
                if (!grouped2[row.nomor_kelompok]) {
                  grouped2[row.nomor_kelompok] = {
                    nomor_kelompok: row.nomor_kelompok,
                    id_lokasi: row.id_lokasi,
                    lokasi: row.lokasi,
                    desa: row.desa,
                    kecamatan: row.kecamatan,
                    kabupaten: row.kabupaten,
                    id_dosen: row.id_dosen || null,
                    nama_dpl: '',
                    anggota: []
                  };
                }
                grouped2[row.nomor_kelompok].anggota.push({
                  nim: row.nim,
                  nama: row.nama,
                  prodi: row.prodi,
                  fakultas: row.fakultas,
                  jenis_kelamin: row.jenis_kelamin,
                  kesehatan: row.kesehatan
                });
              });
              
              const groupsArray2 = Object.values(grouped2);
              console.log(`✅ Returning ${groupsArray2.length} groups (no DPL) with ${rows2.length} total members`);
              
              return res.json({
                total: rows2.length,
                groups: groupsArray2
              });
            }
          );
          return;
        }
        
        return res.status(500).json({ error: err.message });
      }
      
      console.log(`📊 Found ${rows.length} rows for id_hasil ${id}`);
      
      if (rows.length === 0) {
        console.warn(`⚠️ No detail data found for id_hasil ${id}`);
        return res.json({
          total: 0,
          groups: [],
          message: 'Tidak ada data detail untuk hasil ini'
        });
      }
      
      // Group by nomor_kelompok
      const grouped = {};
      rows.forEach(row => {
        if (!grouped[row.nomor_kelompok]) {
          grouped[row.nomor_kelompok] = {
            nomor_kelompok: row.nomor_kelompok,
            id_lokasi: row.id_lokasi,
            lokasi: row.lokasi,
            desa: row.desa,
            kecamatan: row.kecamatan,
            kabupaten: row.kabupaten,
            id_dosen: row.id_dosen || null,
            nama_dpl: row.nama_dpl || '',
            anggota: []
          };
        }
        grouped[row.nomor_kelompok].anggota.push({
          nim: row.nim,
          nama: row.nama,
          prodi: row.prodi,
          fakultas: row.fakultas,
          jenis_kelamin: row.jenis_kelamin,
          kesehatan: row.kesehatan
        });
      });
      
      const groupsArray = Object.values(grouped);
      console.log(`✅ Returning ${groupsArray.length} groups with ${rows.length} total members`);
      
      res.json({
        total: rows.length,
        groups: groupsArray
      });
    }
  );
});

// Export hasil autogroup to Excel (Structured Format)
app.get('/autogroup/hasil/:id/export-excel', async (req, res) => {
  console.log('GET /autogroup/hasil/:id/export-excel:', req.params.id);
  await exportHasilAutogrupToExcel(req, res, pool);
});

// PATCH - Update DPL for a specific group
app.patch('/autogroup/hasil/:id/group/:nomor_kelompok/dpl', (req, res) => {
  const { id, nomor_kelompok } = req.params;
  const { id_dosen } = req.body;
  
  console.log(`PATCH /autogroup/hasil/${id}/group/${nomor_kelompok}/dpl:`, id_dosen);
  
  // Update all rows with same id_hasil + nomor_kelompok
  pool.query(
    'UPDATE detail_hasil_autogrup SET id_dosen = ? WHERE id_hasil = ? AND nomor_kelompok = ?',
    [id_dosen || null, id, nomor_kelompok],
    (err, result) => {
      if (err) {
        console.error('UPDATE DPL error:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Kelompok tidak ditemukan' });
      }
      
      res.json({ 
        success: true, 
        message: `DPL berhasil diupdate untuk kelompok ${nomor_kelompok}`,
        affectedRows: result.affectedRows 
      });
    }
  );
});

// ======================== MASTER DOSEN CRUD ENDPOINTS ========================

// GET all dosen (with optional search and filter)
app.get('/api/dosen', (req, res) => {
  const { search, is_active, periode, angkatan } = req.query;
  
  // Use LEFT JOIN with periode_kkn to allow filtering by year/angkatan
  let sql = `
    SELECT d.*, p.nama_periode, p.angkatan, p.tahun_akademik
    FROM data_dosen d
    LEFT JOIN periode_kkn p ON d.id_periode = p.id_periode
    WHERE 1=1
  `;
  const params = [];
  
  if (search) {
    sql += ' AND (d.nama LIKE ? OR d.nip LIKE ? OR d.id_dosen LIKE ?)';
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }
  
  if (is_active !== undefined) {
    sql += ' AND d.is_active = ?';
    params.push(is_active === 'true' ? 1 : 0);
  }
  
  // Support filtering by angkatan (year from periode_kkn.angkatan field)
  if (angkatan) {
    sql += ' AND (p.angkatan = ? OR p.angkatan LIKE ?)';
    params.push(angkatan, `${angkatan}%`); // Match "2024" or "2024/2025"
  }
  
  // Legacy support for direct periode filter (if needed)
  if (periode) {
    sql += ' AND d.id_periode = ?';
    params.push(periode);
  }
  
  sql += ' ORDER BY d.nama ASC';
  
  pool.query(sql, params, (err, rows) => {
    if (err) {
      console.error('GET dosen error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// POST import dosen from Excel - MUST BE BEFORE :id ROUTES
app.post('/api/dosen/import', upload.single('file'), async (req, res) => {
  console.log('📥 Import endpoint hit');
  console.log('File received:', req.file ? 'Yes' : 'No');
  
  try {
    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({ error: 'File tidak ditemukan' });
    }

    console.log('📄 File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Read from buffer (memoryStorage)
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📊 Parsed ${data.length} rows from Excel`);

    if (data.length === 0) {
      return res.status(400).json({ error: 'File Excel kosong' });
    }

    // Get last id_dosen for auto-generation
    const [lastIdRows] = await pool.promise().query(
      'SELECT id_dosen FROM data_dosen ORDER BY id_dosen DESC LIMIT 1'
    );
    
    let currentIdNum = 0;
    if (lastIdRows.length > 0) {
      const lastId = lastIdRows[0].id_dosen;
      currentIdNum = parseInt(lastId.substring(1)); // Extract number from 'D001' -> 1
    }

    let successCount = 0;
    let failedCount = 0;
    const errors = [];

    // Log first row to see column names
    if (data.length > 0) {
      console.log('📋 Sample row columns:', Object.keys(data[0]));
      console.log('📋 First row data:', data[0]);
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // Excel row number (header is row 1)

      // Helper function to find column value (case-insensitive + trim spaces)
      const findValue = (row, ...possibleNames) => {
        for (const key of Object.keys(row)) {
          const normalizedKey = key.toString().toLowerCase().trim();
          for (const name of possibleNames) {
            if (normalizedKey === name.toLowerCase().trim() || 
                normalizedKey.replace(/[\s_]/g, '') === name.toLowerCase().replace(/[\s_]/g, '')) {
              const value = row[key];
              return value !== null && value !== undefined && value !== '' ? String(value).trim() : null;
            }
          }
        }
        return null;
      };

      // Normalize column names with flexible matching
      let id_dosen = findValue(row, 'id_dosen', 'ID_DOSEN', 'Id_Dosen', 'iddosen', 'ID Dosen', 'id dosen');
      const nip = findValue(row, 'nip', 'NIP', 'Nip', 'NIDN', 'nidn');
      const nama = findValue(row, 'nama', 'NAMA', 'Nama', 'name', 'Name', 'NAME', 'Nama Lengkap', 'nama lengkap');
      const email = findValue(row, 'email', 'EMAIL', 'Email', 'E-mail', 'e-mail');
      const no_telepon = findValue(row, 'no_telepon', 'NO_TELEPON', 'No_Telepon', 'no telepon', 'telepon', 'phone', 'no hp', 'nohp', 'hp');
      const prodi = findValue(row, 'prodi', 'PRODI', 'Prodi', 'program studi', 'Program Studi', 'jurusan');

      // Validation
      if (!nip || !nama) {
        console.log(`❌ Row ${rowNum} validation failed - NIP: ${nip}, Nama: ${nama}`);
        errors.push(`Baris ${rowNum}: NIP dan Nama wajib diisi`);
        failedCount++;
        continue;
      }

      // Auto-generate id_dosen if not provided
      if (!id_dosen) {
        currentIdNum++;
        id_dosen = 'D' + String(currentIdNum).padStart(3, '0');
      }

      try {
        await new Promise((resolve, reject) => {
          pool.query(
            'INSERT INTO data_dosen (id_dosen, nip, nama, email, no_telepon, prodi, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
            [id_dosen, nip, nama, email, no_telepon, prodi],
            (err) => {
              if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                  errors.push(`Baris ${rowNum}: ID Dosen atau NIP sudah terdaftar (${id_dosen})`);
                } else {
                  errors.push(`Baris ${rowNum}: ${err.message}`);
                }
                failedCount++;
                reject(err);
              } else {
                successCount++;
                resolve();
              }
            }
          );
        }).catch(() => {}); // Suppress error to continue loop
      } catch (err) {
        // Already handled in callback
      }
    }

    res.json({
      success: true,
      message: `Import selesai: ${successCount} berhasil, ${failedCount} gagal`,
      total: data.length,
      success_count: successCount,
      failed_count: failedCount,
      errors: errors.slice(0, 50) // Limit to 50 errors
    });

    console.log(`✅ Import complete: ${successCount}/${data.length} successful`);
    
    // 📊 AUTO-UPDATE all periode summaries after bulk import
    if (successCount > 0) {
      updateAllPeriodeSummary();
      console.log('🔄 Updating all periode summaries after bulk dosen import...');
    }

  } catch (err) {
    console.error('❌ Import dosen error:', err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Error saat import: ' + err.message });
  }
});

// GET single dosen by ID
app.get('/api/dosen/:id', (req, res) => {
  pool.query('SELECT * FROM data_dosen WHERE id_dosen = ?', [req.params.id], (err, rows) => {
    if (err) {
      console.error('GET dosen by ID error:', err);
      return res.status(500).json({ error: err.message });
    }
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Dosen tidak ditemukan' });
    }
    res.json(rows[0]);
  });
});

// POST create new dosen
app.post('/api/dosen', async (req, res) => {
  const { nip, nama, prodi, email, no_telepon, id_periode, is_active } = req.body;
  
  if (!nip || !nama) {
    return res.status(400).json({ error: 'NIP dan Nama wajib diisi' });
  }
  
  try {
    // Auto-generate id_dosen
    const [rows] = await pool.promise().query(
      'SELECT id_dosen FROM data_dosen ORDER BY id_dosen DESC LIMIT 1'
    );
    
    let newIdDosen;
    if (rows.length === 0) {
      // First dosen
      newIdDosen = 'D001';
    } else {
      const lastId = rows[0].id_dosen;
      const numPart = parseInt(lastId.substring(1)); // Extract number from 'D001' -> 1
      const nextNum = numPart + 1;
      newIdDosen = 'D' + String(nextNum).padStart(3, '0'); // D002, D003, etc.
    }
    
    await pool.promise().query(
      'INSERT INTO data_dosen (id_dosen, nip, nama, prodi, id_periode, email, no_telepon, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [newIdDosen, nip, nama, prodi || null, id_periode || null, email || null, no_telepon || null, is_active !== undefined ? is_active : 1]
    );
    
    // 📊 AUTO-UPDATE periode summary if dosen has periode
    if (id_periode) {
      updatePeriodeSummary(id_periode, (updateErr) => {
        if (updateErr) {
          console.warn(`⚠️  Failed to update periode summary for id_periode ${id_periode}:`, updateErr.message);
        } else {
          console.log(`✅ Periode summary updated for id_periode ${id_periode} after adding dosen`);
        }
      });
    }
    
    res.status(201).json({ 
      success: true, 
      id_dosen: newIdDosen,
      message: 'Dosen berhasil ditambahkan'
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'NIP sudah terdaftar' });
    }
    console.error('INSERT dosen error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// PUT update dosen
app.put('/api/dosen/:id', (req, res) => {
  const { nip, nama, prodi, email, no_telepon, id_periode, is_active } = req.body;
  
  if (!nip || !nama) {
    return res.status(400).json({ error: 'NIP dan Nama wajib diisi' });
  }
  
  // 📊 First, get old id_periode before updating (to handle periode changes)
  pool.query('SELECT id_periode FROM data_dosen WHERE id_dosen = ?', [req.params.id], (selectErr, selectRows) => {
    const old_id_periode = selectRows && selectRows.length > 0 ? selectRows[0].id_periode : null;
    
    pool.query(
      'UPDATE data_dosen SET nip = ?, nama = ?, prodi = ?, id_periode = ?, email = ?, no_telepon = ?, is_active = ? WHERE id_dosen = ?',
      [nip, nama, prodi || null, id_periode || null, email || null, no_telepon || null, is_active !== undefined ? is_active : 1, req.params.id],
      (err, result) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'NIP sudah digunakan oleh dosen lain' });
          }
          console.error('UPDATE dosen error:', err);
          return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Dosen tidak ditemukan' });
        }
        
        // 📊 AUTO-UPDATE periode summary if periode changed
        const periodesNeedUpdate = new Set();
        if (old_id_periode) periodesNeedUpdate.add(old_id_periode);
        if (id_periode) periodesNeedUpdate.add(id_periode);
        
        if (periodesNeedUpdate.size > 0) {
          periodesNeedUpdate.forEach(periodeId => {
            updatePeriodeSummary(periodeId, (updateErr) => {
              if (updateErr) {
                console.warn(`⚠️  Failed to update periode summary for id_periode ${periodeId}:`, updateErr.message);
              } else {
                console.log(`✅ Periode summary updated for id_periode ${periodeId} after dosen update`);
              }
            });
          });
        }
        
        res.json({ 
          success: true, 
          message: 'Dosen berhasil diupdate'
        });
      }
    );
  });
});

// DELETE dosen (soft delete: set is_active = 0)
app.delete('/api/dosen/:id', (req, res) => {
  const { permanent } = req.query;
  
  if (permanent === 'true') {
    // 📊 First, get id_periode before deleting (for summary update)
    pool.query('SELECT id_periode FROM data_dosen WHERE id_dosen = ?', [req.params.id], (selectErr, selectRows) => {
      const id_periode_to_update = selectRows && selectRows.length > 0 ? selectRows[0].id_periode : null;
      
      // Hard delete
      pool.query('DELETE FROM data_dosen WHERE id_dosen = ?', [req.params.id], (err, result) => {
        if (err) {
          console.error('DELETE dosen error:', err);
          return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Dosen tidak ditemukan' });
        }
        
        // 📊 AUTO-UPDATE periode summary after deletion
        if (id_periode_to_update) {
          updatePeriodeSummary(id_periode_to_update, (updateErr) => {
            if (updateErr) {
              console.warn(`⚠️  Failed to update periode summary for id_periode ${id_periode_to_update}:`, updateErr.message);
            } else {
              console.log(`✅ Periode summary updated after dosen deletion for id_periode ${id_periode_to_update}`);
            }
          });
        }
        
        res.json({ success: true, message: 'Dosen berhasil dihapus permanen' });
      });
    });
  } else {
    // Soft delete
    pool.query('UPDATE data_dosen SET is_active = 0 WHERE id_dosen = ?', [req.params.id], (err, result) => {
      if (err) {
        console.error('SOFT DELETE dosen error:', err);
        return res.status(500).json({ error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Dosen tidak ditemukan' });
      }
      res.json({ success: true, message: 'Dosen berhasil dinonaktifkan' });
    });
  }
});

// ======================== END MASTER DOSEN ENDPOINTS ========================

// DELETE hasil autogroup
app.delete('/autogroup/hasil/:id', (req, res) => {
  const id = req.params.id;
  
  pool.query('DELETE FROM hasil_autogrup WHERE id_hasil = ?', [id], (err, result) => {
    if (err) {
      console.error('DELETE hasil_autogrup error:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Hasil tidak ditemukan' });
    }
    
    res.json({ success: true, deletedId: id });
  });
});

// ======================== AUTOGROUP ENDPOINTS ========================

// Rule-based autogroup algorithm
function performAutoGroup(mahasiswaList, filterCriteria) {
  console.log('Processing autogroup with:', { totalMahasiswa: mahasiswaList.length, filterCriteria });
  
  // Filter mahasiswa berdasarkan kriteria jenis kelamin jika dipilih
  let filtered = mahasiswaList;
  
  if (filterCriteria.jenisKelamin && filterCriteria.jenisKelamin !== 'semua') {
    filtered = filtered.filter(m => {
      const kelamin = (m.jenis_kelamin || m['Jenis Kelamin'] || '').toLowerCase();
      if (filterCriteria.jenisKelamin === 'laki-laki') return kelamin.includes('laki') || kelamin === 'l' || kelamin === 'male';
      if (filterCriteria.jenisKelamin === 'perempuan') return kelamin.includes('perempuan') || kelamin === 'p' || kelamin === 'female';
      return true;
    });
  }
  
  // Prioritize 12 groups: target 8-12 members per group
  // If less than 96 mahasiswa (12 * 8), create fewer groups
  // If more than 144 mahasiswa (12 * 12), create more groups or allow larger groups
  let jumlahKelompok = 12;
  const avgPerGroup = filtered.length / 12;
  
  if (avgPerGroup < 8) {
    // If average is less than 8, reduce number of groups
    jumlahKelompok = Math.ceil(filtered.length / 8);
  } else if (avgPerGroup > 12) {
    // If average is more than 12, allow groups to be larger (up to 20 members)
    // Target to keep max 20 per group
    jumlahKelompok = Math.ceil(filtered.length / 20);
  }
  
  const groups = [];
  
  // Inisialisasi kelompok kosong
  for (let i = 0; i < jumlahKelompok; i++) {
    groups.push({
      nomor_kelompok: i + 1,
      anggota: [],
      prodi_count: {},
      fakultas_count: {},
      kelamin_count: {}
    });
  }
  
  // Distribusi mahasiswa ke kelompok (round-robin dengan smart placement)
  filtered.forEach((mahasiswa, index) => {
    // Cari kelompok dengan anggota paling sedikit
    let targetGroup = groups.reduce((min, group, idx) => 
      group.anggota.length < groups[min].anggota.length ? idx : min, 0
    );
    
    groups[targetGroup].anggota.push(mahasiswa);
    
    // Track prodi distribution
    const prodi = mahasiswa.prodi || mahasiswa.Prodi || 'Tidak Tercantum';
    groups[targetGroup].prodi_count[prodi] = (groups[targetGroup].prodi_count[prodi] || 0) + 1;
    
    // Track fakultas distribution
    const fakultas = mahasiswa.fakultas || mahasiswa.Fakultas || 'Tidak Tercantum';
    groups[targetGroup].fakultas_count[fakultas] = (groups[targetGroup].fakultas_count[fakultas] || 0) + 1;
    
    // Track jenis kelamin distribution
    const kelamin = mahasiswa.jenis_kelamin || mahasiswa['Jenis Kelamin'] || 'Tidak Tercantum';
    groups[targetGroup].kelamin_count[kelamin] = (groups[targetGroup].kelamin_count[kelamin] || 0) + 1;
  });
  
  return groups.filter(g => g.anggota.length > 0);
}

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Function to assign locations to groups based on distance
function assignLocationsToGroups(groups, locations, kampusLat, kampusLng) {
  if (locations.length === 0) {
    groups.forEach((group) => {
      group.lokasi = null;
      group.desa_kecamatan = null;
      group.kabupaten = null;
      group.latitude = null;
      group.longitude = null;
    });
    return { groups, sortedLocations: [] };
  }

  // Sort locations by distance from kampus
  const sortedLocations = locations
    .map(loc => ({
      ...loc,
      distance: calculateDistance(kampusLat, kampusLng, parseFloat(loc.latitude) || 0, parseFloat(loc.longitude) || 0),
      used_count: 0
    }))
    .sort((a, b) => a.distance - b.distance);

  // Assign locations to groups respecting quota limits
  groups.forEach((group) => {
    // Find location round-robin (no quota limit)
    const availableLoc = sortedLocations[groups.indexOf(group) % sortedLocations.length];
    
    if (availableLoc) {
      // Assign location to group
      group.lokasi = availableLoc.lokasi;
      group.desa_kecamatan = availableLoc.desa_kecamatan || availableLoc.dusun_kecamatan;
      group.kabupaten = availableLoc.kabupaten;
      group.latitude = availableLoc.latitude;
      group.longitude = availableLoc.longitude;
      
      // Increment usage count
      availableLoc.used_count++;
    } else {
      // No location available (all quotas full)
      group.lokasi = null;
      group.desa_kecamatan = null;
      group.kabupaten = null;
      group.latitude = null;
      group.longitude = null;
    }
  });

  return { groups, sortedLocations };
}

// POST autogroup - process dan save grouping history
app.post('/api/autogroup', async (req, res) => {
  const { nama_angkatan, angkatan_ke, kampus_lat, kampus_lng, mahasiswaList, filterCriteria, locations } = req.body;
  
  console.log('\n🎯 POST /api/autogroup:', { nama_angkatan, angkatan_ke, totalMahasiswa: mahasiswaList.length, locations: locations?.length });
  
  if (!mahasiswaList || mahasiswaList.length === 0) {
    return res.status(400).json({ error: 'Mahasiswa list kosong' });
  }

  if (!locations || locations.length === 0) {
    return res.status(400).json({ error: 'Tidak ada lokasi tersedia' });
  }
  
  try {
    // ✅ AMBIL DATA LENGKAP LOKASI DENGAN JARAK PUSKESMAS DARI DATABASE
    // URUTAN LOKASI TETAP SESUAI ID_LOKASI ASC (TIDAK BERUBAH)
    const [fullLocations] = await pool.promise().query(`
      SELECT l.id_lokasi, l.lokasi, 
             d.nama AS desa, kc.nama AS kecamatan, k.nama AS kabupaten,
             l.latitude, l.longitude, l.kuota,
             l.jarak_ke_puskesmas, l.puskesmas_terdekat, l.kategori_jarak
      FROM data_lokasi_kkn l
      LEFT JOIN kabupaten k ON l.id_kabupaten = k.id_kabupaten
      LEFT JOIN kecamatan kc ON l.id_kecamatan = kc.id_kecamatan
      LEFT JOIN desa d ON l.id_desa = d.id_desa
      ORDER BY l.id_lokasi ASC
    `);

    console.log(`✅ Loaded ${fullLocations.length} locations (urutan tetap sesuai id_lokasi)`);

    // ✅ PISAHKAN MAHASISWA BERDASARKAN RIWAYAT SAKIT
    let sakitStudents = mahasiswaList.filter(m => 
      m['Riwayat Sakit'] && m['Riwayat Sakit'].toLowerCase() !== 'tidak'
    );
    let healthyStudents = mahasiswaList.filter(m => 
      !m['Riwayat Sakit'] || m['Riwayat Sakit'].toLowerCase() === 'tidak'
    );

    console.log(`\n👥 DISTRIBUSI MAHASISWA AWAL:`);
    console.log(`🏥 Mahasiswa dengan riwayat sakit: ${sakitStudents.length}`);
    console.log(`💪 Mahasiswa sehat: ${healthyStudents.length}`);

    // ✅ FILTER BERDASARKAN KRITERIA GENDER (jika ada)
    if (filterCriteria && filterCriteria.filter_value) {
      const genderFilter = filterCriteria.filter_value.toLowerCase();
      
      sakitStudents = sakitStudents.filter(m => {
        const gender = (m['Jenis Kelamin'] || '').toLowerCase();
        return gender.includes(genderFilter) || 
               (genderFilter === 'l' && (gender === 'laki-laki' || gender === 'male')) ||
               (genderFilter === 'p' && (gender === 'perempuan' || gender === 'female'));
      });
      
      healthyStudents = healthyStudents.filter(m => {
        const gender = (m['Jenis Kelamin'] || '').toLowerCase();
        return gender.includes(genderFilter) || 
               (genderFilter === 'l' && (gender === 'laki-laki' || gender === 'male')) ||
               (genderFilter === 'p' && (gender === 'perempuan' || gender === 'female'));
      });
      
      console.log(`🔍 Filter Gender: ${genderFilter}`);
      console.log(`   → Mahasiswa sakit setelah filter: ${sakitStudents.length}`);
      console.log(`   → Mahasiswa sehat setelah filter: ${healthyStudents.length}`);
    }

    const totalMahasiswaFiltered = sakitStudents.length + healthyStudents.length;
    
    if (totalMahasiswaFiltered === 0) {
      return res.status(400).json({ error: 'Tidak ada mahasiswa yang sesuai kriteria filter' });
    }

    // ✅ HITUNG JUMLAH KELOMPOK (1 KELOMPOK = 1 LOKASI)
    // Batasan: Min 3 mahasiswa per kelompok
    const minPerGroup = 3;
    const maxPossibleGroups = Math.floor(totalMahasiswaFiltered / minPerGroup);
    const groupCount = Math.min(maxPossibleGroups, fullLocations.length);

    console.log(`\n🎯 TARGET PENGELOMPOKAN:`);
    console.log(`📦 Jumlah kelompok: ${groupCount} (= ${groupCount} lokasi akan digunakan)`);
    console.log(`👤 Total mahasiswa: ${totalMahasiswaFiltered}`);
    console.log(`👤 Target per kelompok: ~${Math.ceil(totalMahasiswaFiltered / groupCount)} mahasiswa`);

    // ✅ ALGORITMA BARU: LOCATION-BASED ASSIGNMENT
    // Urutan lokasi TETAP, yang dipilih adalah MAHASISWANYA
    console.log(`\n📍 MULAI DISTRIBUSI MAHASISWA KE LOKASI (urutan lokasi tetap):\n`);

    const groups = [];
    let sakitIndex = 0;
    let healthyIndex = 0;

    for (let i = 0; i < groupCount; i++) {
      const loc = fullLocations[i];
      const group = {
        nomor_kelompok: i + 1,
        anggota: [],
        lokasi: loc.lokasi,
        desa_kecamatan: `${loc.desa || ''} / ${loc.kecamatan || ''}`,
        kabupaten: loc.kabupaten,
        jarak_puskesmas: `${loc.jarak_ke_puskesmas?.toFixed(1) || '0.0'} km`,
        kategori_jarak: loc.kategori_jarak,
        has_sakit: false
      };

      // Hitung berapa mahasiswa yang harus masuk kelompok ini
      const remainingGroups = groupCount - i;
      const remainingStudents = (totalMahasiswaFiltered - sakitIndex - healthyIndex);
      const targetSize = Math.ceil(remainingStudents / remainingGroups);

      // ✅ CEK APAKAH LOKASI INI AMAN UNTUK MAHASISWA SAKIT (< 5 km ke puskesmas)
      const kategori = (loc.kategori_jarak || '').toLowerCase();
      const isLokasiAman = kategori.includes('sangat') || kategori === 'dekat';

      // ✅ PRIORITAS: Jika lokasi AMAN dan masih ada mahasiswa SAKIT → tempatkan di sini
      if (isLokasiAman && sakitIndex < sakitStudents.length) {
        group.anggota.push(sakitStudents[sakitIndex]);
        group.has_sakit = true;
        console.log(`   ✅ Lokasi ${i + 1}: ${loc.lokasi} (${loc.jarak_ke_puskesmas?.toFixed(1)} km) → AMAN`);
        console.log(`      🏥 Mahasiswa sakit: ${sakitStudents[sakitIndex].Nama}`);
        sakitIndex++;
      }

      // ✅ ISI SISA SLOT DENGAN MAHASISWA SEHAT
      let addedCount = group.anggota.length;
      while (addedCount < targetSize && healthyIndex < healthyStudents.length) {
        group.anggota.push(healthyStudents[healthyIndex]);
        healthyIndex++;
        addedCount++;
      }

      if (!group.has_sakit) {
        console.log(`   📍 Lokasi ${i + 1}: ${loc.lokasi} (${loc.jarak_ke_puskesmas?.toFixed(1)} km)`);
      }
      console.log(`      👥 Total anggota: ${group.anggota.length} mahasiswa\n`);

      groups.push(group);
    }

    // ✅ DISTRIBUSI SISA MAHASISWA SAKIT (jika masih ada) ke lokasi SEDANG (5-10 km)
    if (sakitIndex < sakitStudents.length) {
      console.log(`\n⚠️  Masih ada ${sakitStudents.length - sakitIndex} mahasiswa sakit, coba lokasi SEDANG (5-10 km):`);
      
      for (let i = 0; i < groups.length && sakitIndex < sakitStudents.length; i++) {
        const group = groups[i];
        const kategori = (group.kategori_jarak || '').toLowerCase();
        const isLokasiSedang = kategori === 'sedang' || kategori.includes('sedang');
        
        if (isLokasiSedang && !group.has_sakit) {
          group.anggota.push(sakitStudents[sakitIndex]);
          group.has_sakit = true;
          console.log(`   ⚠️  Lokasi: ${group.lokasi} (${group.jarak_puskesmas}) → Mahasiswa sakit: ${sakitStudents[sakitIndex].Nama}`);
          sakitIndex++;
        }
      }
    }

    // ✅ WARNING jika masih ada mahasiswa sakit yang tidak dapat lokasi aman/sedang
    if (sakitIndex < sakitStudents.length) {
      console.log(`\n❌ WARNING: ${sakitStudents.length - sakitIndex} mahasiswa sakit TIDAK dapat lokasi aman/sedang!`);
      console.log(`   → Akan ditempatkan ke lokasi terjauh yang tersedia`);
      
      for (let i = 0; i < groups.length && sakitIndex < sakitStudents.length; i++) {
        if (!groups[i].has_sakit) {
          groups[i].anggota.push(sakitStudents[sakitIndex]);
          groups[i].has_sakit = true;
          console.log(`   ❌ Lokasi: ${groups[i].lokasi} (${groups[i].jarak_puskesmas}) → Mahasiswa sakit: ${sakitStudents[sakitIndex].Nama}`);
          sakitIndex++;
        }
      }
    }

    console.log(`\n✅ AUTOGROUP COMPLETED (Location-Based Assignment)`);
    console.log(`📦 Total kelompok: ${groups.length}`);
    console.log(`👥 Total mahasiswa: ${groups.reduce((sum, g) => sum + g.anggota.length, 0)}`);
    console.log(`🏥 Kelompok dengan mahasiswa sakit: ${groups.filter(g => g.has_sakit).length}`);
    console.log(`📍 Semua kelompok PASTI dapat lokasi (urutan sesuai id_lokasi)\n`);
    
    // Rename untuk konsistensi dengan kode lama
    const groupsWithLocations = groups;
    
    const dataGrouping = JSON.stringify(groupsWithLocations);
    const filterJson = JSON.stringify(filterCriteria);
    
    // Get unique locations used
    const uniqueLocations = [...new Set(groupsWithLocations.map(g => g.lokasi))];
    const lokasi_terpilih = fullLocations.filter(loc => uniqueLocations.includes(loc.lokasi));
      
    pool.query(
      'INSERT INTO grouping_history (nama_angkatan, angkatan_ke, jumlah_kelompok, jumlah_mahasiswa, data_grouping, filter_criteria) VALUES (?, ?, ?, ?, ?, ?)',
      [nama_angkatan, angkatan_ke, groupsWithLocations.length, mahasiswaList.length, dataGrouping, filterJson],
      (err, result) => {
        if (err) {
          console.error('INSERT grouping error:', err);
          return res.status(500).json({ error: err.message });
        }
        
        const id_grouping = result.insertId;
        console.log('Grouping saved with ID:', id_grouping);

        // Insert detail hasil grouping ke tabel grouping_results
        let detailCount = 0;
        const totalDetails = groupsWithLocations.reduce((acc, g) => acc + g.anggota.length, 0);
        
        groupsWithLocations.forEach((group) => {
          group.anggota.forEach((member) => {
            const detailSql = 'INSERT INTO grouping_results (id_grouping, nomor_kelompok, lokasi, desa_kecamatan, kabupaten, nim, nama, prodi, fakultas, nomor_telepon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
            const detailParams = [
              id_grouping,
              group.nomor_kelompok,
              group.lokasi || null,
              group.desa_kecamatan || null,
              group.kabupaten || null,
              member.nim || member.NIM || null,
              member.nama || member.Nama || null,
              member.prodi || member.Prodi || null,
              member.fakultas || member.Fakultas || null,
              member.nomor_telepon || member['Nomor Telepon'] || member.no_telepon || member['No. Telepon'] || null
            ];

            pool.query(detailSql, detailParams, (detailErr) => {
              if (detailErr) {
                console.error('INSERT grouping_results error:', detailErr);
              }
              detailCount++;
              
              if (detailCount === totalDetails) {
                return res.json({
                  id_grouping,
                  nama_angkatan,
                  angkatan_ke,
                  kampus_lat,
                  kampus_lng,
                  lokasi_terpilih,
                  jumlah_kelompok: groupsWithLocations.length,
                  jumlah_mahasiswa: mahasiswaList.length,
                  groups: groupsWithLocations
                });
              }
            });
          });
        });

        // Handle case where there are no details
        if (totalDetails === 0) {
          res.json({
            id_grouping,
            nama_angkatan,
            angkatan_ke,
            kampus_lat,
            kampus_lng,
            lokasi_terpilih,
            jumlah_kelompok: groupsWithLocations.length,
            jumlah_mahasiswa: mahasiswaList.length,
            groups: groupsWithLocations
          });
        }
      }
    );
  } catch (err) {
    console.error('Autogroup error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET all grouping history
app.get('/api/grouping-history', (req, res) => {
  console.log('GET /api/grouping-history called');
  
  pool.query(
    'SELECT id_grouping, nama_angkatan, angkatan_ke, jumlah_kelompok, jumlah_mahasiswa, created_at FROM grouping_history ORDER BY created_at DESC',
    (err, rows) => {
      if (err) {
        console.error('GET grouping history error:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows || []);
    }
  );
});

// GET grouping detail
app.get('/api/grouping-history/:id', (req, res) => {
  const id = req.params.id;
  
  pool.query(
    'SELECT * FROM grouping_history WHERE id_grouping = ?',
    [id],
    (err, rows) => {
      if (err) {
        console.error('GET grouping detail error:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Grouping tidak ditemukan' });
      }
      
      const result = rows[0];
      res.json({
        ...result,
        data_grouping: JSON.parse(result.data_grouping),
        filter_criteria: result.filter_criteria ? JSON.parse(result.filter_criteria) : null
      });
    }
  );
});

// GET hasil grouping detail dari tabel grouping_results
app.get('/api/grouping-results/:id', (req, res) => {
  const id = req.params.id;
  console.log('GET /api/grouping-results/:id:', id);
  
  pool.query(
    'SELECT * FROM grouping_results WHERE id_grouping = ? ORDER BY nomor_kelompok, nama',
    [id],
    (err, rows) => {
      if (err) {
        console.error('GET grouping results error:', err);
        return res.status(500).json({ error: err.message });
      }
      
      // Group by nomor_kelompok
      const grouped = {};
      rows.forEach((row) => {
        if (!grouped[row.nomor_kelompok]) {
          grouped[row.nomor_kelompok] = {
            nomor_kelompok: row.nomor_kelompok,
            lokasi: row.lokasi,
            desa_kecamatan: row.desa_kecamatan,
            kabupaten: row.kabupaten,
            anggota: []
          };
        }
        grouped[row.nomor_kelompok].anggota.push({
          nim: row.nim,
          nama: row.nama,
          prodi: row.prodi,
          fakultas: row.fakultas,
          nomor_telepon: row.nomor_telepon
        });
      });
      
      res.json({
        total: rows.length,
        groups: Object.values(grouped)
      });
    }
  );
});

// Export grouping to Excel (Structured Format)
app.get('/api/grouping-export/:id_grouping', async (req, res) => {
  console.log('GET /api/grouping-export/:id_grouping:', req.params.id_grouping);
  await exportGroupingToExcel(req, res, pool);
});

// DELETE grouping
app.delete('/api/grouping-history/:id', (req, res) => {
  const id = req.params.id;
  console.log('DELETE /api/grouping-history/:id:', id);
  
  pool.query('DELETE FROM grouping_history WHERE id_grouping = ?', [id], (err) => {
    if (err) {
      console.error('DELETE grouping error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ deletedId: id });
  });
});

app.listen(PORT, () => {
  console.log(`✓ Backend API listening on http://localhost:${PORT}`);
});
