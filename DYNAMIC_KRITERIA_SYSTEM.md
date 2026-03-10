# Sistem Kriteria Dinamis - KKN AutoGroup

## Konsep Dasar

Sistem kriteria dirancang **sinkron** antara data kriteria dengan parameter autogroup. Jika admin menambah/edit kriteria di tab Kriteria, maka form parameter di Autogroup akan otomatis menyesuaikan.

---

## Alur Kerja

### 1. **Tab Kriteria** (Data Master)
Admin mengelola daftar kriteria di tabel `kriteria`:

**Contoh Data:**
| ID | Nama Kriteria     |
|----|-------------------|
| 1  | Jumlah Peserta    |
| 2  | Jenis Kelamin     |
| 3  | Riwayat Sakit     |
| 4  | Prodi             |
| 5  | Fakultas          |
| 6  | Jumlah Kelompok   |

**Operasi:**
- ✅ Tambah kriteria baru (misal: "IPK", "Domisili")
- ✅ Edit nama kriteria
- ✅ Hapus kriteria

---

### 2. **Tab Autogroup** (Form Dinamis)

**Proses:**
1. Frontend fetch data dari `GET /kriteria`
2. Loop setiap kriteria dan mapping ke tipe input:
   - **"Prodi"** → `<input type="number">` (minimal variasi)
   - **"Fakultas"** → `<input type="number">` (minimal variasi)
   - **"Jenis Kelamin"** → `<select>` (campur/seimbang/dipisah/bebas)
   - **"Riwayat Sakit"** → `<checkbox>` (sebar ke semua kelompok)
   - **"Jumlah Peserta"** → Sudah ada di Min/Max Anggota (skip duplicate)
   - **"Jumlah Kelompok"** → Deprecated (auto-calculated, skip)
   - **Kriteria Lain** → `<input type="number">` (default)

3. Render form fields secara dinamis
4. User input nilai untuk setiap kriteria
5. Saat simpan, data dikirim ke backend

---

## Struktur Database

### Tabel `kriteria`
```sql
CREATE TABLE kriteria (
  id_kriteria INT AUTO_INCREMENT PRIMARY KEY,
  nama_kriteria VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Default Data:**
```sql
INSERT INTO kriteria (nama_kriteria) VALUES
  ('Jumlah Peserta'),
  ('Jenis Kelamin'),
  ('Riwayat Sakit'),
  ('Prodi'),
  ('Fakultas'),
  ('Jumlah Kelompok');
```

---

### Tabel `konfigurasi_autogrup`
```sql
CREATE TABLE konfigurasi_autogrup (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_aturan VARCHAR(255) NOT NULL,
  tahun_ajaran VARCHAR(20),
  angkatan_kkn INT,
  
  -- Backward compatible columns
  min_anggota_per_kelompok INT DEFAULT 8,
  max_anggota_per_kelompok INT DEFAULT 12,
  variasi_prodi INT,
  variasi_fakultas INT,
  aturan_jenis_kelamin VARCHAR(50),
  sebar_peserta_sakit BOOLEAN DEFAULT 1,
  
  -- New dynamic column
  kriteria_config TEXT, -- JSON format
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Contoh `kriteria_config` (JSON):**
```json
{
  "4": {"type": "number", "value": 3, "label": "Prodi"},
  "5": {"type": "number", "value": 2, "label": "Fakultas"},
  "2": {"type": "select", "value": "seimbang", "label": "Jenis Kelamin"},
  "3": {"type": "boolean", "value": true, "label": "Riwayat Sakit"}
}
```

---

## Mapping Nama Kriteria ke Tipe Input

**Frontend Logic** (`Autogroup.jsx`):

```jsx
const nama = kriteria.nama_kriteria.toLowerCase();

if (nama.includes('prodi')) {
  // Render number input untuk minimal variasi prodi
  return <input type="number" value={variasi_prodi} />;
}

if (nama.includes('fakultas')) {
  // Render number input untuk minimal variasi fakultas
  return <input type="number" value={variasi_fakultas} />;
}

if (nama.includes('jenis kelamin') || nama.includes('gender')) {
  // Render select dengan options: campur, seimbang, dipisah, bebas
  return (
    <select>
      <option value="campur">Campur</option>
      <option value="seimbang">Seimbang</option>
      <option value="dipisah">Dipisah</option>
      <option value="bebas">Bebas</option>
    </select>
  );
}

if (nama.includes('sakit') || nama.includes('kesehatan')) {
  // Render checkbox untuk sebar peserta sakit
  return <input type="checkbox" />;
}

if (nama.includes('peserta') || nama.includes('kelompok')) {
  // Skip - sudah ada di Min/Max Anggota
  return null;
}

// Default: number input
return <input type="number" />;
```

---

## Backend Processing

**Endpoint: `POST /konfigurasi-autogrup`**

```javascript
app.post('/konfigurasi-autogrup', (req, res) => {
  const {
    nama_aturan,
    tahun_ajaran,
    angkatan_kkn,
    min_anggota_per_kelompok,
    max_anggota_per_kelompok,
    variasi_prodi,
    variasi_fakultas,
    aturan_jenis_kelamin,
    sebar_peserta_sakit,
    kriteria_config  // ← JSON string
  } = req.body;

  pool.query(
    `INSERT INTO konfigurasi_autogrup (..., kriteria_config) VALUES (?, ...)`,
    [..., kriteria_config]
  );
});
```

**Note:** Sistem tetap simpan di kolom individual (backward compatible) DAN di kolom JSON (future-proof).

---

## Penggunaan Algoritma

**Di `autogroupService.js`:**

```javascript
const config = /* load from database */;

// Baca dari kolom backward compatible
const variasi_prodi = config.variasi_prodi;
const variasi_fakultas = config.variasi_fakultas;
const aturan_jenis_kelamin = config.aturan_jenis_kelamin;
const sebar_peserta_sakit = config.sebar_peserta_sakit;

// Jika kriteria_config ada, override dengan nilai dari JSON
if (config.kriteria_config) {
  const kriteriaValues = JSON.parse(config.kriteria_config);
  // Process dynamic kriteria...
}

// Jalankan algoritma dengan konfigurasi
const result = generateAutogroup(config);
```

---

## Keuntungan Sistem Dinamis

### ✅ **Fleksibilitas**
- Admin bisa tambah kriteria baru kapan saja tanpa edit kode
- Contoh: tambah kriteria "IPK", "Domisili", "Hobi"

### ✅ **Sinkronisasi Otomatis**
- Tab Kriteria ↔ Form Autogroup selalu sync
- Hapus kriteria "Fakultas" di tab Kriteria → form autogroup langsung update

### ✅ **Backward Compatible**
- Data lama tetap berfungsi dengan kolom existing
- Data baru menggunakan JSON untuk fleksibilitas

### ✅ **Easy Maintenance**
- Tidak perlu edit schema database untuk kriteria baru
- Tidak perlu deploy ulang untuk kriteria baru

---

## Contoh Kasus Penggunaan

### Skenario 1: Tambah Kriteria "IPK"

**Admin Action:**
1. Buka tab **Kriteria**
2. Klik "Tambah Kriteria"
3. Input: `IPK`
4. Simpan

**Hasil Otomatis:**
- Tab **Autogroup** → Muncul field baru:
  ```
  IPK: [____] (number input)
  ```

### Skenario 2: Edit Kriteria "Prodi" → "Program Studi"

**Admin Action:**
1. Buka tab **Kriteria**
2. Edit "Prodi" menjadi "Program Studi"
3. Simpan

**Hasil Otomatis:**
- Tab **Autogroup** → Label berubah:
  ```
  Program Studi (min): [__2__]
  ```

### Skenario 3: Hapus Kriteria "Jumlah Kelompok"

**Admin Action:**
1. Buka tab **Kriteria**
2. Hapus "Jumlah Kelompok"
3. Simpan

**Hasil Otomatis:**
- Tab **Autogroup** → Field "Jumlah Kelompok" hilang
- Algoritma tetap hitung otomatis dari min/max anggota

---

## API Reference

### `GET /kriteria`
**Response:**
```json
[
  {
    "id_kriteria": 1,
    "nama_kriteria": "Jumlah Peserta",
    "created_at": "2026-02-14T20:34:33.000Z"
  },
  {
    "id_kriteria": 4,
    "nama_kriteria": "Prodi",
    "created_at": "2026-02-14T20:34:33.000Z"
  }
]
```

### `POST /konfigurasi-autogrup`
**Request Body:**
```json
{
  "nama_aturan": "Aturan 2026",
  "tahun_ajaran": "2025/2026",
  "angkatan_kkn": 11,
  "min_anggota_per_kelompok": 8,
  "max_anggota_per_kelompok": 12,
  "variasi_prodi": 3,
  "variasi_fakultas": 2,
  "aturan_jenis_kelamin": "seimbang",
  "sebar_peserta_sakit": true,
  "kriteria_config": "{\"4\":{\"type\":\"number\",\"value\":3},\"5\":{\"type\":\"number\",\"value\":2}}"
}
```

---

## Troubleshooting

**Q: Form autogroup tidak muncul kriteria yang baru ditambah**
- A: Refresh halaman atau force re-fetch dengan `fetchKriteria()`

**Q: Nilai kriteria tidak tersimpan**
- A: Cek konsol browser untuk error, pastikan `kriteria_config` berformat JSON valid

**Q: Algoritma tidak pakai kriteria baru**
- A: Update `autogroupService.js` untuk parse dan gunakan `kriteria_config` JSON

---

## Future Enhancements

1. **Custom Field Type**
   - Tambah kolom `field_type` di tabel kriteria
   - Admin pilih: number, text, select, checkbox, date, dll

2. **Custom Options untuk Select**
   - Tambah kolom `field_options` (JSON) di tabel kriteria
   - Contoh: `{"options": ["A", "B", "C"]}`

3. **Validation Rules**
   - Min/max value per kriteria
   - Required/optional flag

4. **Weight/Priority**
   - Scoring weight untuk setiap kriteria
   - Admin atur mana yang lebih penting

---

## Kesimpulan

Sistem kriteria dinamis memungkinkan admin mengelola kriteria autogroup tanpa perlu edit kode atau database schema. Form autogroup akan otomatis sync dengan data kriteria, memberikan fleksibilitas maksimal untuk berbagai kebutuhan KKN periode yang berbeda.
