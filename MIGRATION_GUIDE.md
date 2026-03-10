# Database Migration Guide

## Manajemen Akun - Users Table Update

### What's Changed?
Database schema untuk tabel `users` telah diperbarui untuk mendukung sistem Manajemen Akun yang baru:

**New Fields:**
- `nip` - Nomor Induk Pegawai (VARCHAR 50)
- `email` - Email address (VARCHAR 100)
- `status` - Status akun: Aktif/Nonaktif (VARCHAR 20)

**Role System Update:**
- Old roles: `petugas`, `pimpinan`
- New roles: `Admin`, `Koordinator`

### Migration Steps

#### Option 1: Run SQL Migration File (Recommended)

1. **Open phpMyAdmin** di browser: `http://localhost/phpmyadmin`

2. **Pilih database** KKN Anda (klik nama database di sidebar kiri)

3. **Klik tab "SQL"** di bagian atas

4. **Copy-paste** isi file `backend/migrations/001_update_users_table.sql` ke dalam SQL query box

5. **Klik "Go"** untuk menjalankan migration

6. **Verifikasi** - Anda akan melihat pesan "Migration completed successfully!" dan daftar user yang telah diupdate

#### Option 2: Restart Backend (For Fresh Installation)

Jika Anda ingin **drop dan recreate** tabel users:

```sql
-- WARNING: This will DELETE all existing user data!
DROP TABLE IF NOT EXISTS users;
```

Kemudian restart backend server:
```bash
cd backend
npm run dev
```

Backend akan otomatis membuat tabel baru dengan schema yang sudah diupdate dan insert default users:
- Username: `koordinator` / Password: `admin123` (Role: Koordinator)
- Username: `admin` / Password: `admin123` (Role: Admin)

### Verification Checklist

Setelah migration, pastikan:
- ✅ Kolom `nip`, `email`, `status` sudah ada di tabel users
- ✅ Role berubah dari `petugas`/`pimpinan` menjadi `Admin`/`Koordinator`
- ✅ Semua user existing memiliki `status = 'Aktif'`
- ✅ Default users memiliki data NIP dan email

Query untuk cek:
```sql
DESCRIBE users;
SELECT * FROM users;
```

### Troubleshooting

**Error: "Unknown column 'nip' in 'field list'"**
- Migration belum dijalankan, jalankan Option 1

**Error: "Invalid value for ENUM column 'role'"**
- Jalankan Step 2-5 dalam migration file secara berurutan

**Error: "Duplicate entry for key 'username'"**
- Already migrated, skip migration

### Rollback (If Needed)

Jika ingin kembali ke schema lama:
```sql
ALTER TABLE users 
DROP COLUMN nip,
DROP COLUMN email,
DROP COLUMN status;

ALTER TABLE users MODIFY COLUMN role ENUM('petugas','pimpinan') DEFAULT 'petugas';
UPDATE users SET role = 'pimpinan' WHERE role = 'Koordinator';
UPDATE users SET role = 'petugas' WHERE role = 'Admin';
```

### Next Steps

Setelah migration berhasil:
1. Start backend server: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Login dan buka **Manajemen Akun** untuk test fitur baru
4. Try creating user baru dengan semua field (Nama, NIP, Email, Password, Peran, Status)

---

**Migration File Location:** `backend/migrations/001_update_users_table.sql`  
**Created:** January 2025  
**Version:** 1.0.0
