require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const multer = require('multer');
const XLSX = require('xlsx');

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
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

console.log('Creating table lokasi...');

// Ensure table exists
pool.query(`
  CREATE TABLE IF NOT EXISTS lokasi (
    id_lokasi INT AUTO_INCREMENT PRIMARY KEY,
    lokasi VARCHAR(255) NOT NULL,
    desa_kecamatan VARCHAR(255),
    kabupaten VARCHAR(255),
    kuota INT DEFAULT 0,
    fakes BOOLEAN DEFAULT 0,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => {
  if (err) {
    console.error('CREATE TABLE error:', err);
  } else {
    console.log('✓ Table lokasi ready');
  }
});

// Create new table data_lokasi_kkn per latest schema
console.log('Creating table data_lokasi_kkn...');
pool.query(`
  CREATE TABLE IF NOT EXISTS data_lokasi_kkn (
    id_lokasi INT AUTO_INCREMENT PRIMARY KEY,
    lokasi VARCHAR(150),
    desa VARCHAR(100),
    kecamatan VARCHAR(100),
    kabupaten VARCHAR(100),
    kuota_total INT,
    kuota_terpakai INT DEFAULT 0,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    faskes BOOLEAN DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => {
  if (err) console.error('CREATE TABLE data_lokasi_kkn error:', err);
  else console.log('✓ Table data_lokasi_kkn ready');
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

// Create table filter_criteria
pool.query(`
  CREATE TABLE IF NOT EXISTS filter_criteria (
    id_criteria INT AUTO_INCREMENT PRIMARY KEY,
    nama_kriteria VARCHAR(255) NOT NULL UNIQUE,
    min_jumlah_mahasiswa INT NOT NULL DEFAULT 8,
    max_jumlah_mahasiswa INT NOT NULL DEFAULT 12,
    min_prodi INT NOT NULL DEFAULT 2,
    min_fakultas INT NOT NULL DEFAULT 1,
    jenis_kelamin VARCHAR(50) DEFAULT 'semua',
    deskripsi TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => {
  if (err) {
    console.error('CREATE TABLE filter_criteria error:', err);
  } else {
    console.log('✓ Table filter_criteria ready');
    
    // Insert default criteria if not exists
    pool.query('SELECT COUNT(*) as count FROM filter_criteria', (countErr, countRows) => {
      if (!countErr && countRows[0].count === 0) {
        pool.query(
          'INSERT INTO filter_criteria (nama_kriteria, min_jumlah_mahasiswa, max_jumlah_mahasiswa, min_prodi, min_fakultas, jenis_kelamin, deskripsi, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          ['Default', 8, 12, 2, 1, 'semua', 'Kriteria default untuk pengelompokan', 1],
          (insertErr) => {
            if (!insertErr) {
              console.log('✓ Default criteria inserted');
            }
          }
        );
      }
    });
  }
});

// Create table grouping_history
pool.query(`
  CREATE TABLE IF NOT EXISTS grouping_history (
    id_grouping INT AUTO_INCREMENT PRIMARY KEY,
    nama_angkatan VARCHAR(255) NOT NULL,
    angkatan_ke INT NOT NULL,
    jumlah_kelompok INT NOT NULL,
    jumlah_mahasiswa INT NOT NULL,
    data_grouping LONGTEXT NOT NULL,
    filter_criteria JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => {
  if (err) {
    console.error('CREATE TABLE grouping_history error:', err);
  } else {
    console.log('✓ Table grouping_history ready');
  }
});

// Create table grouping_results untuk menyimpan detail hasil grouping
pool.query(`
  CREATE TABLE IF NOT EXISTS grouping_results (
    id_result INT AUTO_INCREMENT PRIMARY KEY,
    id_grouping INT NOT NULL,
    nomor_kelompok INT NOT NULL,
    lokasi VARCHAR(255),
    desa_kecamatan VARCHAR(255),
    kabupaten VARCHAR(255),
    nim VARCHAR(50) NOT NULL,
    nama VARCHAR(255) NOT NULL,
    prodi VARCHAR(255),
    fakultas VARCHAR(255),
    nomor_telepon VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_grouping) REFERENCES grouping_history(id_grouping) ON DELETE CASCADE,
    INDEX idx_grouping (id_grouping)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => {
  if (err) {
    console.error('CREATE TABLE grouping_results error:', err);
  } else {
    console.log('✓ Table grouping_results ready');
  }
});

// Create users table for authentication and account management
pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('petugas','pimpinan') DEFAULT 'petugas',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => {
  if (err) {
    console.error('CREATE TABLE users error:', err);
  } else {
    console.log('✓ Table users ready');
    // Insert default admin if table empty
    pool.query('SELECT COUNT(*) as count FROM users', (countErr, countRows) => {
      if (!countErr && countRows[0].count === 0) {
        const defaultPassword = 'admin123';
        const hash = bcrypt.hashSync(defaultPassword, 8);
        pool.query('INSERT INTO users (nama, username, password, role) VALUES (?, ?, ?, ?)', ['Admin', 'admin', hash, 'pimpinan'], (insertErr) => {
          if (insertErr) console.error('Insert default admin error:', insertErr);
          else console.log('✓ Default admin user created (username: admin, password: admin123)');
        });
      }
    });
  }
});

// ======================== USER AUTH & MANAGEMENT ========================

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });

  pool.query('SELECT * FROM users WHERE username = ?', [username], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows || rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    const match = bcrypt.compareSync(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    // Return basic user info (no token for now)
    res.json({ id: user.id, nama: user.nama, username: user.username, role: user.role });
  });
});

// CRUD users
app.get('/api/users', (req, res) => {
  pool.query('SELECT id, nama, username, role, created_at FROM users ORDER BY id DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/users', (req, res) => {
  const { nama, username, password, role } = req.body;
  console.log('POST /api/users body:', req.body);
  if (!nama || !username || !password) return res.status(400).json({ error: 'nama, username, password required' });
  const hash = bcrypt.hashSync(password, 8);
  pool.query('INSERT INTO users (nama, username, password, role) VALUES (?, ?, ?, ?)', [nama, username, hash, role || 'petugas'], (err, result) => {
    if (err) {
      console.error('INSERT /api/users error:', err);
      if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Username sudah digunakan' });
      return res.status(500).json({ error: err.message });
    }
    pool.query('SELECT id, nama, username, role, created_at FROM users WHERE id = ?', [result.insertId], (e, rows) => {
      if (e) {
        console.error('SELECT after INSERT /api/users error:', e);
        return res.status(500).json({ error: e.message });
      }
      res.status(201).json(rows[0]);
    });
  });
});

app.put('/api/users/:id', (req, res) => {
  const id = req.params.id;
  const { nama, username, password, role } = req.body;
  console.log('PUT /api/users/:id', id, 'body:', req.body);
  const updateFields = [nama, username, role || 'petugas', id];
  // If password provided, hash and use different query
  if (password) {
    const hash = bcrypt.hashSync(password, 8);
    pool.query('UPDATE users SET nama = ?, username = ?, role = ?, password = ? WHERE id = ?', [nama, username, role || 'petugas', hash, id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      pool.query('SELECT id, nama, username, role, created_at FROM users WHERE id = ?', [id], (e, rows) => {
        if (e) return res.status(500).json({ error: e.message });
        res.json(rows[0]);
      });
    });
  } else {
    pool.query('UPDATE users SET nama = ?, username = ?, role = ? WHERE id = ?', updateFields, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      pool.query('SELECT id, nama, username, role, created_at FROM users WHERE id = ?', [id], (e, rows) => {
        if (e) return res.status(500).json({ error: e.message });
        res.json(rows[0]);
      });
    });
  }
});

app.delete('/api/users/:id', (req, res) => {
  const id = req.params.id;
  pool.query('DELETE FROM users WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deletedId: id });
  });
});


// GET all
app.get('/api/locations', (req, res) => {
  console.log('GET /api/locations called');
  pool.query('SELECT id_lokasi, lokasi, desa AS desa, kecamatan AS kecamatan, kabupaten, kuota_total, kuota_terpakai, latitude, longitude, faskes, (kuota_total - kuota_terpakai) AS sisa_kuota FROM data_lokasi_kkn ORDER BY id_lokasi DESC', (err, rows) => {
    if (err) {
      console.error('GET error:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('GET response:', rows.length, 'rows');
    res.json(rows);
  });
});

// Geocode endpoint (Nominatim API)
app.post('/api/geocode', async (req, res) => {
  const { lokasi, desa_kecamatan, kabupaten } = req.body;
  const query = `${lokasi}, ${desa_kecamatan || ''}, ${kabupaten || 'Indonesia'}`.trim();
  
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json`;
    console.log('Geocoding query:', query);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'KKNAutoGroup/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.length > 0) {
      const result = data[0];
      console.log('Geocoding result:', result.display_name);
      res.json({
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        display_name: result.display_name
      });
    } else {
      res.status(404).json({ error: 'Lokasi tidak ditemukan di OpenStreetMap' });
    }
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

// GET all lokasi (with sisa_kuota)
app.get('/lokasi', (req, res) => {
  pool.query('SELECT id_lokasi, lokasi, desa, kecamatan, kabupaten, kuota_total, kuota_terpakai, latitude, longitude, faskes, (kuota_total - kuota_terpakai) AS sisa_kuota FROM data_lokasi_kkn ORDER BY id_lokasi DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// POST single lokasi
app.post('/lokasi', async (req, res) => {
  try {
    let { lokasi, desa, kecamatan, kabupaten, kuota_total, latitude, longitude, desa_kecamatan } = req.body;
    // support legacy combined field `desa_kecamatan` (format: "Desa / Kecamatan")
    if ((!desa || !kecamatan) && desa_kecamatan) {
      const parts = desa_kecamatan.split('/').map(p => p.trim());
      desa = parts[0] || desa;
      kecamatan = parts[1] || kecamatan;
    }
    if (!lokasi || !desa || !kecamatan || !kabupaten || !kuota_total) return res.status(400).json({ error: 'Missing required fields' });

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

    // Determine faskes based on nearby facilities within 7km
    let faskesFlag = 0;
    if (lat && lon) {
      const chk = await checkNearbyFakes(lat, lon, 7000);
      faskesFlag = chk.hasFakes ? 1 : 0;
    }

    pool.query('INSERT INTO data_lokasi_kkn (lokasi, desa, kecamatan, kabupaten, kuota_total, kuota_terpakai, latitude, longitude, faskes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [lokasi, desa, kecamatan, kabupaten, parseInt(kuota_total, 10) || 0, 0, lat || null, lon || null, faskesFlag], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        pool.query('SELECT id_lokasi, lokasi, desa, kecamatan, kabupaten, kuota_total, kuota_terpakai, latitude, longitude, faskes, (kuota_total - kuota_terpakai) AS sisa_kuota FROM data_lokasi_kkn WHERE id_lokasi = ?', [result.insertId], (e, rows) => {
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
    let { lokasi, desa, kecamatan, kabupaten, kuota_total, latitude, longitude, desa_kecamatan } = req.body;
    if ((!desa || !kecamatan) && desa_kecamatan) {
      const parts = desa_kecamatan.split('/').map(p => p.trim());
      desa = parts[0] || desa;
      kecamatan = parts[1] || kecamatan;
    }
    if (!lokasi || !desa || !kecamatan || !kabupaten || !kuota_total) return res.status(400).json({ error: 'Missing required fields' });

    let lat = latitude ? parseFloat(latitude) : null;
    let lon = longitude ? parseFloat(longitude) : null;

    // If coords missing, attempt geocode
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

    let faskesFlag = 0;
    if (lat && lon) {
      const chk = await checkNearbyFakes(lat, lon, 7000);
      faskesFlag = chk.hasFakes ? 1 : 0;
    }

    pool.query('UPDATE data_lokasi_kkn SET lokasi = ?, desa = ?, kecamatan = ?, kabupaten = ?, kuota_total = ?, latitude = ?, longitude = ?, faskes = ? WHERE id_lokasi = ?',
      [lokasi, desa, kecamatan, kabupaten, parseInt(kuota_total, 10) || 0, lat || null, lon || null, faskesFlag, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        pool.query('SELECT id_lokasi, lokasi, desa, kecamatan, kabupaten, kuota_total, kuota_terpakai, latitude, longitude, faskes, (kuota_total - kuota_terpakai) AS sisa_kuota FROM data_lokasi_kkn WHERE id_lokasi = ?', [id], (e, rows) => {
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

  pool.query('SELECT id_lokasi, lokasi, desa, kecamatan, kabupaten, kuota_total, kuota_terpakai, latitude, longitude, faskes FROM data_lokasi_kkn', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const calc = rows.map(r => ({
      ...r,
      distance_km: calculateDistance(latKampus, lngKampus, parseFloat(r.latitude) || 0, parseFloat(r.longitude) || 0)
    })).sort((a,b) => a.distance_km - b.distance_km).map(r => ({
      ...r,
      sisa_kuota: (r.kuota_total || 0) - (r.kuota_terpakai || 0)
    }));
    res.json(calc);
  });
});

// POST /lokasi/import - accept Excel file upload (multipart/form-data, field 'file')
app.post('/lokasi/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file is required (multipart/form-data field name: file)' });
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

    if (!rows || rows.length === 0) return res.status(400).json({ error: 'Excel kosong' });

    // Validate required columns
    const requiredCols = ['lokasi','desa','kecamatan','kabupaten','kuota_total'];
    const header = Object.keys(rows[0]).map(h => h.toString().toLowerCase());
    const missing = requiredCols.filter(c => !header.includes(c));
    if (missing.length > 0) return res.status(400).json({ error: 'Missing columns: ' + missing.join(', ') });

    const insertValues = [];

    for (const r of rows) {
      const lokasi = r.lokasi || r.Lokasi || null;
      const desa = r.desa || r.Desa || null;
      const kecamatan = r.kecamatan || r.Kecamatan || null;
      const kabupaten = r.kabupaten || r.Kabupaten || null;
      const kuota_total = parseInt(r.kuota_total || r.Kuota_total || r.kuota || 0, 10) || 0;

      // Try geocoding if latitude/longitude present in sheet use them otherwise attempt Nominatim
      let lat = null;
      let lon = null;
      if (r.latitude || r.Latitude || r.lat) lat = parseFloat(r.latitude || r.Latitude || r.lat);
      if (r.longitude || r.Longitude || r.lon) lon = parseFloat(r.longitude || r.Longitude || r.lon);
      if ((!lat || !lon) && lokasi) {
        const query = `${lokasi}, ${desa || ''}, ${kabupaten || ''}`.trim();
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json`, { headers: { 'User-Agent': 'KKNAutoGroup/1.0' } });
          if (response.ok) {
            const data = await response.json();
            if (data.length > 0) {
              lat = parseFloat(data[0].lat);
              lon = parseFloat(data[0].lon);
            }
          }
        } catch (ge) {
          console.warn('Geocode failed for row', lokasi, ge.message);
        }
      }

      // Determine faskes by checking nearby facilities within 7km
      let faskesFlag = 0;
      if (lat && lon) {
        try {
          const chk = await checkNearbyFakes(lat, lon, 7000);
          faskesFlag = chk.hasFakes ? 1 : 0;
        } catch (e) {
          console.warn('checkNearbyFakes failed', e.message);
        }
      }

      insertValues.push([lokasi, desa, kecamatan, kabupaten, kuota_total, 0, lat || null, lon || null, faskesFlag]);
    }

    if (insertValues.length === 0) return res.status(400).json({ error: 'No valid rows to import' });

    pool.query('INSERT INTO data_lokasi_kkn (lokasi, desa, kecamatan, kabupaten, kuota_total, kuota_terpakai, latitude, longitude, faskes) VALUES ?', [insertValues], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ inserted: result.affectedRows });
    });
  } catch (err) {
    console.error('/lokasi/import error:', err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------- END LOKASI ENDPOINTS --------------------

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
  let { lokasi, desa_kecamatan, kabupaten, kuota, latitude, longitude, fakes } = req.body;
  console.log('POST /api/locations:', { lokasi, desa_kecamatan, kabupaten, kuota, latitude, longitude, fakes });
  if (!lokasi) return res.status(400).json({ error: 'lokasi required' });

  // Support combined desa_kecamatan
  let desa = null;
  let kecamatan = null;
  if (desa_kecamatan) {
    const parts = desa_kecamatan.split('/').map(p => p.trim());
    desa = parts[0] || null;
    kecamatan = parts[1] || null;
  }

  try {
    let computedFakes = fakes !== undefined ? (fakes ? 1 : 0) : 0;
    if ((latitude || longitude) && fakes === undefined) {
      const chk = await checkNearbyFakes(latitude, longitude, 2000);
      computedFakes = chk.hasFakes ? 1 : 0;
      console.log('Computed fakes on create:', computedFakes, 'nearby count:', chk.items.length);
    }

    pool.query(
      'INSERT INTO data_lokasi_kkn (lokasi, desa, kecamatan, kabupaten, kuota_total, kuota_terpakai, latitude, longitude, faskes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [lokasi, desa || null, kecamatan || null, kabupaten || null, kuota || 0, 0, latitude || null, longitude || null, computedFakes],
      (err, result) => {
        if (err) {
          console.error('INSERT error:', err);
          return res.status(500).json({ error: err.message });
        }
        console.log('Inserted with ID:', result.insertId);
        pool.query('SELECT id_lokasi, lokasi, desa, kecamatan, kabupaten, kuota_total, kuota_terpakai, latitude, longitude, faskes, (kuota_total - kuota_terpakai) AS sisa_kuota FROM data_lokasi_kkn WHERE id_lokasi = ?', [result.insertId], (err, rows) => {
          if (err) {
            console.error('SELECT after INSERT error:', err);
            return res.status(500).json({ error: err.message });
          }
          res.status(201).json(rows[0]);
        });
      }
    );
  } catch (err) {
    console.error('POST /api/locations error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update
app.put('/api/locations/:id', async (req, res) => {
  const id = req.params.id;
  let { lokasi, desa_kecamatan, kabupaten, kuota, latitude, longitude, fakes } = req.body;
  console.log('PUT /api/locations/:id:', id, { lokasi, desa_kecamatan, kabupaten, kuota, latitude, longitude, fakes });
  let desa = null;
  let kecamatan = null;
  if (desa_kecamatan) {
    const parts = desa_kecamatan.split('/').map(p => p.trim());
    desa = parts[0] || null;
    kecamatan = parts[1] || null;
  }

  try {
    let computedFakes = fakes !== undefined ? (fakes ? 1 : 0) : undefined;
    if ((latitude || longitude) && fakes === undefined) {
      const chk = await checkNearbyFakes(latitude, longitude, 2000);
      computedFakes = chk.hasFakes ? 1 : 0;
      console.log('Computed fakes on update:', computedFakes, 'nearby count:', chk.items.length);
    }

    // Update into data_lokasi_kkn
    const query = 'UPDATE data_lokasi_kkn SET lokasi = ?, desa = ?, kecamatan = ?, kabupaten = ?, kuota_total = ?, latitude = ?, longitude = ?, faskes = ? WHERE id_lokasi = ?';
    const params = [lokasi, desa || null, kecamatan || null, kabupaten || null, kuota || 0, latitude || null, longitude || null, computedFakes !== undefined ? computedFakes : 0, id];

    pool.query(query, params, (err) => {
      if (err) {
        console.error('UPDATE error:', err);
        return res.status(500).json({ error: err.message });
      }
      pool.query('SELECT id_lokasi, lokasi, desa, kecamatan, kabupaten, kuota_total, kuota_terpakai, latitude, longitude, faskes, (kuota_total - kuota_terpakai) AS sisa_kuota FROM data_lokasi_kkn WHERE id_lokasi = ?', [id], (err, rows) => {
        if (err) {
          console.error('SELECT after UPDATE error:', err);
          return res.status(500).json({ error: err.message });
        }
        res.json(rows[0]);
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
  
  pool.query('DELETE FROM data_lokasi_kkn WHERE id_lokasi = ?', [id], (err) => {
    if (err) {
      console.error('DELETE error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ deletedId: id });
  });
});

// ======================== FILTER CRITERIA ENDPOINTS ========================

// GET all criteria
app.get('/api/filter-criteria', (req, res) => {
  console.log('GET /api/filter-criteria called');
  pool.query('SELECT * FROM filter_criteria ORDER BY is_active DESC, created_at DESC', (err, rows) => {
    if (err) {
      console.error('GET criteria error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// GET single criteria
app.get('/api/filter-criteria/:id', (req, res) => {
  const id = req.params.id;
  pool.query('SELECT * FROM filter_criteria WHERE id_criteria = ?', [id], (err, rows) => {
    if (err) {
      console.error('GET criteria error:', err);
      return res.status(500).json({ error: err.message });
    }
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Kriteria tidak ditemukan' });
    }
    res.json(rows[0]);
  });
});

// CREATE criteria
app.post('/api/filter-criteria', (req, res) => {
  const { nama_kriteria, min_jumlah_mahasiswa, max_jumlah_mahasiswa, min_prodi, min_fakultas, jenis_kelamin, deskripsi } = req.body;
  console.log('POST /api/filter-criteria:', { nama_kriteria, min_jumlah_mahasiswa, max_jumlah_mahasiswa, min_prodi, min_fakultas, jenis_kelamin });
  
  if (!nama_kriteria) return res.status(400).json({ error: 'Nama kriteria harus diisi' });
  
  pool.query(
    'INSERT INTO filter_criteria (nama_kriteria, min_jumlah_mahasiswa, max_jumlah_mahasiswa, min_prodi, min_fakultas, jenis_kelamin, deskripsi) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [nama_kriteria, min_jumlah_mahasiswa || 8, max_jumlah_mahasiswa || 12, min_prodi || 2, min_fakultas || 1, jenis_kelamin || 'semua', deskripsi || null],
    (err, result) => {
      if (err) {
        console.error('INSERT criteria error:', err);
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'Nama kriteria sudah ada, gunakan nama lain' });
        }
        return res.status(500).json({ error: 'Database error: ' + err.message });
      }
      console.log('Inserted criteria with ID:', result.insertId);
      pool.query('SELECT * FROM filter_criteria WHERE id_criteria = ?', [result.insertId], (err, rows) => {
        if (err) {
          console.error('SELECT after INSERT error:', err);
          return res.status(500).json({ error: 'Database error: ' + err.message });
        }
        res.status(201).json(rows[0]);
      });
    }
  );
});

// UPDATE criteria
app.put('/api/filter-criteria/:id', (req, res) => {
  const id = req.params.id;
  const { nama_kriteria, min_jumlah_mahasiswa, max_jumlah_mahasiswa, min_prodi, min_fakultas, jenis_kelamin, deskripsi, is_active } = req.body;
  console.log('PUT /api/filter-criteria/:id:', id, { nama_kriteria, min_jumlah_mahasiswa, max_jumlah_mahasiswa, min_prodi, min_fakultas, jenis_kelamin });
  
  pool.query(
    'UPDATE filter_criteria SET nama_kriteria = ?, min_jumlah_mahasiswa = ?, max_jumlah_mahasiswa = ?, min_prodi = ?, min_fakultas = ?, jenis_kelamin = ?, deskripsi = ?, is_active = ? WHERE id_criteria = ?',
    [nama_kriteria, min_jumlah_mahasiswa || 8, max_jumlah_mahasiswa || 12, min_prodi || 2, min_fakultas || 1, jenis_kelamin || 'semua', deskripsi || null, is_active !== undefined ? is_active : 1, id],
    (err) => {
      if (err) {
        console.error('UPDATE criteria error:', err);
        return res.status(500).json({ error: err.message });
      }
      pool.query('SELECT * FROM filter_criteria WHERE id_criteria = ?', [id], (err, rows) => {
        if (err) {
          console.error('SELECT after UPDATE error:', err);
          return res.status(500).json({ error: err.message });
        }
        res.json(rows[0]);
      });
    }
  );
});

// DELETE criteria
app.delete('/api/filter-criteria/:id', (req, res) => {
  const id = req.params.id;
  console.log('DELETE /api/filter-criteria/:id:', id);
  
  pool.query('DELETE FROM filter_criteria WHERE id_criteria = ?', [id], (err) => {
    if (err) {
      console.error('DELETE criteria error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ deletedId: id });
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
  // Sort locations by distance from kampus
  const sortedLocations = locations
    .map(loc => ({
      ...loc,
      distance: calculateDistance(kampusLat, kampusLng, parseFloat(loc.latitude) || 0, parseFloat(loc.longitude) || 0)
    }))
    .sort((a, b) => a.distance - b.distance);

  // Assign locations to groups in round-robin fashion
  groups.forEach((group, idx) => {
    const locationIndex = idx % sortedLocations.length;
    const selectedLoc = sortedLocations[locationIndex];
    group.lokasi = selectedLoc.lokasi;
    group.desa_kecamatan = selectedLoc.desa_kecamatan || selectedLoc.dusun_kecamatan;
    group.kabupaten = selectedLoc.kabupaten;
    group.latitude = selectedLoc.latitude;
    group.longitude = selectedLoc.longitude;
  });

  return { groups, sortedLocations };
}

// POST autogroup - process dan save grouping history
app.post('/api/autogroup', (req, res) => {
  const { nama_angkatan, angkatan_ke, kampus_lat, kampus_lng, mahasiswaList, filterCriteria, locations } = req.body;
  
  console.log('POST /api/autogroup:', { nama_angkatan, angkatan_ke, totalMahasiswa: mahasiswaList.length, locations: locations?.length });
  
  if (!mahasiswaList || mahasiswaList.length === 0) {
    return res.status(400).json({ error: 'Mahasiswa list kosong' });
  }

  if (!locations || locations.length === 0) {
    return res.status(400).json({ error: 'Tidak ada lokasi tersedia' });
  }
  
  try {
    const groupingResult = performAutoGroup(mahasiswaList, filterCriteria);
    
    // Auto-assign locations to groups based on distance
    const { groups: groupsWithLocations, sortedLocations } = assignLocationsToGroups(groupingResult, locations, kampus_lat, kampus_lng);
    
    const dataGrouping = JSON.stringify(groupsWithLocations);
    const filterJson = JSON.stringify(filterCriteria);
    
    // Get unique locations used
    const uniqueLocations = [...new Set(groupsWithLocations.map(g => g.lokasi))];
    const lokasi_terpilih = locations.filter(loc => uniqueLocations.includes(loc.lokasi));
      
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
              
              // Respond after all details are inserted
              if (detailCount === groupsWithLocations.reduce((acc, g) => acc + g.anggota.length, 0)) {
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
            });
          });
        });

        // Handle case where there are no details
        if (groupsWithLocations.reduce((acc, g) => acc + g.anggota.length, 0) === 0) {
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
