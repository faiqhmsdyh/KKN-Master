# Rule-Based Autogroup Algorithm

## Aturan Distribusi Peserta

### 1. Distribusi Peserta Sakit
**Kondisi:** IF `sebar_peserta_sakit = true`

**Aturan:**
- ✅ Maksimal 1 peserta sakit per kelompok
- ✅ Distribusikan peserta sakit ke kelompok yang berbeda-beda
- ✅ Jika jumlah peserta sakit > jumlah kelompok, sisanya ditempatkan di kelompok dengan anggota paling sedikit

**Implementasi:**
- Fungsi: `distributePesertaSakit(groups, pesertaSakit, config)`
- Check di `canAddToGroup()`: `if (sebar_peserta_sakit && isSakit(mahasiswa) && group.stats.sakit >= 1) return false`

---

### 2. Variasi Prodi
**Kondisi:** IF `variasi_prodi > 0`

**Aturan:**
- ✅ Setiap kelompok harus memiliki **minimal** `variasi_prodi` prodi berbeda
- ✅ Scoring system memberikan bonus tinggi (80 poin) untuk kelompok yang belum memenuhi minimal
- ✅ Tetap memberikan bonus kecil (30 poin) untuk menambah variasi meskipun sudah memenuhi minimal

**Implementasi:**
- Fungsi: `countProdi(group)` - menghitung jumlah prodi unik dalam kelompok
- Scoring di `findBestGroup()`:
  ```javascript
  if (variasi_prodi > 0) {
    const currentProdiCount = countProdi(group);
    if (currentProdiCount < variasi_prodi) {
      if (!group.stats.prodi[mahasiswa.prodi]) score += 80;
    } else {
      if (!group.stats.prodi[mahasiswa.prodi]) score += 30;
    }
  }
  ```

---

### 3. Variasi Fakultas
**Kondisi:** IF `variasi_fakultas > 0`

**Aturan:**
- ✅ Setiap kelompok harus memiliki **minimal** `variasi_fakultas` fakultas berbeda
- ✅ Scoring system memberikan bonus tinggi (60 poin) untuk kelompok yang belum memenuhi minimal
- ✅ Tetap memberikan bonus kecil (20 poin) untuk menambah variasi meskipun sudah memenuhi minimal

**Implementasi:**
- Fungsi: `countFakultas(group)` - menghitung jumlah fakultas unik dalam kelompok
- Scoring di `findBestGroup()` - mirip dengan variasi prodi

---

### 4. Aturan Jenis Kelamin

#### 4.1 Jika `aturan_jenis_kelamin = "seimbang"`
**Aturan:**
- ✅ Distribusi Laki-laki dan Perempuan merata di setiap kelompok
- ✅ Scoring memberikan bonus (40 poin) jika menambahkan mahasiswa dari gender yang kurang

**Implementasi:**
```javascript
if (aturan_jenis_kelamin === 'seimbang' || aturan_jenis_kelamin === 'campur' || aturan_jenis_kelamin === 'bebas') {
  const balance = balanceGender(group);
  if (isLaki && balance.perempuan > balance.laki) score += 40;
  else if (!isLaki && balance.laki > balance.perempuan) score += 40;
}
```

#### 4.2 Jika `aturan_jenis_kelamin = "dipisah"`
**Aturan:**
- ✅ Kelompok hanya berisi Laki-laki ATAU hanya Perempuan
- ✅ **HARD RULE:** Tidak boleh campur dalam satu kelompok

**Implementasi:**
```javascript
if (aturan_jenis_kelamin === 'dipisah') {
  if (isLaki && group.stats.perempuan > 0) return false;
  if (isPerempuan && group.stats.laki_laki > 0) return false;
}
```

#### 4.3 Jika `aturan_jenis_kelamin = "bebas"`
**Aturan:**
- ✅ Tidak ada pengaturan gender
- ✅ Boleh campur seperti apapun

---

### 5. Kapasitas Kelompok
**Aturan:**
- ✅ Setiap kelompok **maksimal** `max_anggota_per_kelompok` anggota
- ✅ Setiap kelompok **minimal** `min_anggota_per_kelompok` anggota
- ✅ Jumlah kelompok dihitung optimal dengan formula:
  ```javascript
  jumlahKelompok = Math.ceil(totalMahasiswa / max_anggota_per_kelompok)
  if (totalMahasiswa / jumlahKelompok < min_anggota_per_kelompok) {
    jumlahKelompok = Math.floor(totalMahasiswa / min_anggota_per_kelompok)
  }
  ```

**Implementasi:**
- Hard limit di `canAddToGroup()`: `if (group.stats.total >= max_anggota_per_kelompok) return false`
- Optimal calculation di `calculateOptimalGroups()`

---

## Penempatan Lokasi

### Algoritma Assignment
1. ✅ Ambil semua lokasi dari `data_lokasi_kkn` yang `sisa_kuota > 0`
2. ✅ Pisahkan lokasi berdasarkan `faskes = true` atau `faskes = false`
3. ✅ **Prioritas 1:** Kelompok yang ada peserta sakit → Lokasi dengan `faskes = true`
4. ✅ **Prioritas 2:** Sisa kelompok dengan sakit → Lokasi biasa
5. ✅ **Prioritas 3:** Kelompok tanpa sakit → Lokasi yang tersisa
6. ✅ Update `kuota_terpakai` pada lokasi setelah assignment

**Implementasi:**
- Fungsi: `assignLocationsToGroups(groups, locations)`
- Query UPDATE: `UPDATE data_lokasi_kkn SET kuota_terpakai = kuota_terpakai + ? WHERE id_lokasi = ?`

---

## Helper Functions

### 1. `shuffleArray(array)`
- **Algoritma:** Fisher-Yates shuffle
- **Tujuan:** Randomisasi order mahasiswa sebelum distribusi

### 2. `countProdi(group)`
- **Return:** Jumlah prodi unik dalam kelompok (integer)
- **Digunakan:** Validasi variasi prodi

### 3. `countFakultas(group)`
- **Return:** Jumlah fakultas unik dalam kelompok (integer)
- **Digunakan:** Validasi variasi fakultas

### 4. `balanceGender(group)`
- **Return:** `{ laki, perempuan, diff }`
- **Digunakan:** Scoring untuk gender balance

### 5. `distributePesertaSakit(groups, pesertaSakit, config)`
- **Algoritma:** Greedy + Rule Checking
- **Maksimal:** 1 sakit per kelompok
- **Fallback:** Jika semua kelompok sudah ada sakit, paksa ke kelompok paling sedikit

---

## Scoring System Priority

**Total Score Calculation dalam `findBestGroup()`:**

1. **Load Balancing** (100 points per slot kosong)
   - `score += (max_anggota - current_total) * 100`
   - Prioritas tertinggi: kelompok dengan anggota paling sedikit

2. **Variasi Prodi** (80 points jika belum minimal, 30 points jika sudah)
   - Bonus besar jika `currentProdiCount < variasi_prodi`
   - Bonus kecil jika sudah tercapai tapi menambah variasi

3. **Variasi Fakultas** (60 points jika belum minimal, 20 points jika sudah)
   - Mirip dengan prodi, prioritas lebih rendah

4. **Gender Balance** (40 points)
   - Bonus jika menambah gender yang kurang
   - Hanya untuk aturan 'seimbang', 'campur', 'bebas'

**Urutan Prioritas:**
1. Kelompok yang belum penuh (load balance) ⭐⭐⭐⭐⭐
2. Variasi Prodi ⭐⭐⭐⭐
3. Variasi Fakultas ⭐⭐⭐
4. Gender Balance ⭐⭐

---

## Database Migration

**Kolom Baru:**
- `min_anggota_per_kelompok` (INT, DEFAULT 8)
- `max_anggota_per_kelompok` (INT, DEFAULT 12)

**Kolom Lama (DIHAPUS):**
- `jumlah_kelompok`
- `anggota_per_kelompok`

**Migration Steps:**
1. ADD COLUMN `min_anggota_per_kelompok` dan `max_anggota_per_kelompok`
2. UPDATE existing data: set defaults dari kolom lama jika ada
3. DROP COLUMN `jumlah_kelompok` dan `anggota_per_kelompok`

---

## Testing Checklist

- [ ] Import 100+ mahasiswa dengan berbagai prodi/fakultas
- [ ] Buat konfigurasi dengan variasi_prodi = 3, variasi_fakultas = 2
- [ ] Generate autogroup dan verifikasi setiap kelompok punya minimal 3 prodi
- [ ] Test dengan sebar_peserta_sakit = true, verifikasi max 1 sakit per kelompok
- [ ] Test aturan_jenis_kelamin = 'dipisah', verifikasi tidak ada kelompok campur
- [ ] Test aturan_jenis_kelamin = 'seimbang', verifikasi distribusi L/P seimbang
- [ ] Verifikasi lokasi dengan faskes diprioritaskan untuk kelompok dengan sakit
- [ ] Verifikasi kuota_terpakai di database ter-update setelah generate

---

## Troubleshooting

**Error: "Konfigurasi autogrup belum dibuat"**
- Solusi: Buat konfigurasi baru di tab "Atur Kriteria"

**Error: "Data peserta KKN belum ada"**
- Solusi: Import file Excel mahasiswa dulu

**Kelompok tidak seimbang:**
- Check min/max anggota per kelompok
- Pastikan jumlah mahasiswa cukup untuk distribusi optimal

**Variasi prodi tidak tercapai:**
- Cek apakah jumlah prodi unik di data < variasi_prodi yang diminta
- Scoring system akan maksimalkan variasi tapi tidak enforce hard limit
