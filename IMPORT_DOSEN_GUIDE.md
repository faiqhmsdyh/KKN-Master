# Template Import Data Dosen

## Format File
Format yang didukung: Excel (.xlsx, .xls) atau CSV (.csv)

## Struktur Kolom

| Kolom | Nama Field | Wajib | Contoh | Keterangan |
|-------|------------|-------|--------|------------|
| A | id_dosen | ✅ Ya | D001 | ID unik dosen (max 10 karakter) |
| B | nip | ✅ Ya | 19800101 | NIP dosen (must be unique) |
| C | nama | ✅ Ya | Ahmad Fauzi | Nama lengkap dosen |
| D | email | ❌ Tidak | ahmad.fauzi@kampus.ac.id | Email dosen |
| E | no_telepon | ❌ Tidak | 81234567801 | Nomor telepon |
| F | prodi | ❌ Tidak | Informatika | Program studi |

## Contoh Data

```csv
id_dosen,nip,nama,email,no_telepon,prodi
D001,19800101,Ahmad Fauzi,ahmad.fauzi@kampus.ac.id,81234567801,Informatika
D002,19800202,Siti Nurhaliza,siti.nurhaliza@kampus.ac.id,81234567802,Informatika
D003,19800303,Budi Santoso,budi.santoso@kampus.ac.id,81234567803,Sistem Informasi
```

## Validasi
- ✅ **ID Dosen** harus unique (tidak boleh duplikat)
- ✅ **NIP** harus unique (tidak boleh duplikat)
- ✅ Kolom wajib (id_dosen, nip, nama) tidak boleh kosong
- ✅ System auto-set `is_active = 1` untuk semua data import

## Cara Menggunakan

1. **Persiapkan File Excel/CSV**
   - Pastikan header di baris pertama sesuai format
   - Data mulai dari baris kedua
   
2. **Klik IMPORT EXCEL** di halaman Data Dosen
   
3. **Download Template** (opsional)
   - Klik link "Download Template CSV" untuk template kosong
   
4. **Upload File**
   - Klik "Pilih File" dan pilih file Excel/CSV Anda
   - Klik "Import Data"
   
5. **Review Hasil**
   - System akan menampilkan summary:
     - Total data diproses
     - Jumlah berhasil
     - Jumlah gagal + detail error

## Troubleshooting

### Error: "ID Dosen atau NIP sudah terdaftar"
**Solusi**: ID Dosen dan NIP harus unique. Cek database existing atau ganti dengan ID/NIP baru.

### Error: "ID Dosen, NIP dan Nama wajib diisi"
**Solusi**: Pastikan ketiga kolom wajib terisi di semua baris.

### Error: "File Excel kosong"
**Solusi**: File harus memiliki minimal 1 baris data (selain header).

## Tips
- 💡 Gunakan template CSV untuk memastikan format benar
- 💡 Test dengan data kecil (3-5 baris) sebelum import massal
- 💡 Backup database sebelum import data besar
- 💡 Data yang gagal tidak akan tersimpan (rollback per-row)
- 💡 Maximum 50 error pertama akan ditampilkan di UI

## Status Active
Semua dosen hasil import otomatis di-set **AKTIF** (is_active = 1). 
Anda bisa menonaktifkan secara manual setelah import jika diperlukan.
