# 📱 QUICK START: Akses dari HP

## ✅ Update Selesai!
Semua file sudah diupdate untuk menggunakan API config centralized.

---

## 🚀 CARA AKSES DARI HP (Jaringan Lokal/WiFi yang Sama)

### 1️⃣ Setup IP Address

**IP Komputer Anda:** `172.20.10.2` (contoh, cek dengan `ipconfig`)

Edit file **`frontend/.env`**:
```env
VITE_API_URL=http://172.20.10.2:4000
```
⚠️ **Ganti `172.20.10.2` dengan IP komputer Anda!**

---

### 2️⃣ Jalankan Backend

```powershell
cd backend
npm run dev
```

Backend akan listen di `http://0.0.0.0:4000` (accessible dari network)

---

### 3️⃣ Jalankan Frontend (Mode Mobile)

```powershell
cd frontend
npm run dev:mobile
```

Atau manual:
```powershell
npm run dev -- --host 0.0.0.0
```

Frontend akan accessible di: `http://172.20.10.2:5173`

---

### 4️⃣ Akses dari HP

1. **Pastikan HP dan komputer terhubung ke WiFi yang SAMA**
2. **Buka browser di HP** (Chrome/Safari)
3. **Ketik alamat:** `http://172.20.10.2:5173`

---

## 🔥 Troubleshooting

### ❌ "Failed to fetch" dari HP
- ✅ Cek backend berjalan: buka `http://172.20.10.2:4000/api/locations` di browser HP
- ✅ Nonaktifkan Windows Firewall sementara untuk testing
- ✅ Pastikan HP dan komputer di WiFi yang SAMA

### ❌ "Cannot access this site"
- ✅ Cek IP dengan `ipconfig` di PowerShell
- ✅ Update file `frontend/.env` dengan IP yang benar
- ✅ Restart frontend: `Ctrl+C` lalu `npm run dev:mobile` lagi

### ❌ CORS Error
- ✅ Backend sudah configured untuk `Access-Control-Allow-Origin: *`
- ✅ Restart backend jika masih error

---

## 📝 File yang Sudah Diupdate

✅ **Config API:** `frontend/src/config/api.js`
✅ **Backend:** Listen di `0.0.0.0:4000` (all interfaces)
✅ **Frontend:** Semua 18 file component sudah menggunakan `${API_BASE_URL}`

**Files Updated:**
- ✅ Dosen.jsx
- ✅ Login.jsx
- ✅ Dashboard.jsx
- ✅ Autogroup.jsx
- ✅ Lokasi.jsx
- ✅ Riwayat.jsx
- ✅ Kriteria.jsx
- ✅ KoordinatorPPM.jsx
- ✅ Step2_Parameters.jsx
- ✅ Step3_Results.jsx
- ✅ PeriodeModal.jsx
- ✅ LocationModal.jsx
- ✅ Header.jsx
- ✅ Profil.jsx
- ✅ HeaderLocations.jsx
- ✅ ManajemenAkun.jsx
- ✅ ResetPassword.jsx
- ✅ App.jsx

---

## 🎯 Test Manual

### Test Backend (dari HP):
```
http://172.20.10.2:4000/api/locations
```
Harus return data JSON ✅

### Test Frontend (dari HP):
```
http://172.20.10.2:5173
```
Harus tampil login page ✅

---

## 📦 Deploy ke Production (Internet Publik)

Untuk akses dari internet (bukan hanya LAN), lihat panduan lengkap di:
📄 [MOBILE_ACCESS_GUIDE.md](MOBILE_ACCESS_GUIDE.md)

**Platform yang disarankan:**
- **VPS**: Digital Ocean, Linode, AWS EC2
- **Heroku**: Deploy backend + JawsDB MySQL
- **Railway**: Modern, simple, auto-HTTPS
- **Vercel** (frontend) + **Render** (backend)

---

## 💡 Tips

- **Hemat Data:** Gunakan WiFi, bukan data seluler
- **Performance:** Aplikasi ini responsive, tapi lebih cepat di desktop
- **Persistent:** Gunakan IP static pada router agar IP tidak berubah
- **Production:** Gunakan domain dan HTTPS untuk keamanan

---

**✨ Selamat! Sistem Anda sekarang bisa diakses dari HP! ✨**
