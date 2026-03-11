# 📱 Panduan Deploy untuk Akses dari HP

## 🏠 Opsi 1: Akses dalam Jaringan Lokal (WiFi yang Sama)

### Persiapan:

1. **Cari IP Address Komputer Anda**
   ```powershell
   ipconfig
   ```
   Cari `IPv4 Address`, contoh: `192.168.1.100`

2. **Pastikan Firewall Mengizinkan**
   - Buka Windows Firewall
   - Izinkan koneksi pada port `4000` (backend) dan `5173` (frontend)
   - Atau nonaktifkan sementara untuk testing

3. **Pastikan MySQL Berjalan**
   - Jalankan XAMPP
   - Start Apache dan MySQL

### Setup Frontend:

1. **Copy file `.env.example` menjadi `.env`:**
   ```powershell
   cd frontend
   Copy-Item .env.example .env
   ```

2. **Edit file `frontend/.env`** dan ubah IP:
   ```env
   VITE_API_URL=http://192.168.1.100:4000
   ```
   ⚠️ Ganti `192.168.1.100` dengan IP komputer Anda!

3. **Update semua fetch calls** untuk menggunakan config API (lihat section "Update Kode" di bawah)

### Jalankan Aplikasi:

```powershell
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev -- --host 0.0.0.0
```

Parameter `--host 0.0.0.0` membuat Vite accessible dari perangkat lain.

### Akses dari HP:

1. **Hubungkan HP ke WiFi yang sama** dengan komputer
2. **Buka browser di HP** dan akses:
   ```
   http://192.168.1.100:5173
   ```
   (Ganti dengan IP komputer Anda)

---

## ☁️ Opsi 2: Deploy ke Production (Internet Publik)

### Platform yang Disarankan:

#### **1. VPS (Digital Ocean, Linode, AWS EC2)**
- **Frontend**: Build dan serve dengan Nginx
- **Backend**: PM2 untuk process management
- **Database**: MySQL di VPS yang sama atau managed database

**Steps:**
```bash
# Build frontend
cd frontend
npm run build
# Deploy hasil build (folder dist/) ke Nginx

# Backend di PM2
cd backend
pm2 start index.js --name kkn-backend
pm2 save
```

#### **2. Heroku (Gratis/Murah)**
- Deploy backend sebagai Heroku app
- Deploy frontend ke Vercel/Netlify
- Database: JawsDB MySQL (Heroku addon)

#### **3. Railway.app (Simple & Modern)**
- Deploy backend + MySQL in one project
- Deploy frontend separately
- Auto-generate URLs

### Checklist Production:
- ✅ Ganti semua `localhost` dengan domain/IP production
- ✅ Setup HTTPS (Let's Encrypt)
- ✅ Environment variables untuk DB credentials
- ✅ Secure CORS (ganti `*` dengan domain spesifik)
- ✅ Rate limiting untuk API
- ✅ Backup database secara berkala

---

## 🔧 Update Kode untuk Gunakan API Config

Setelah membuat `frontend/src/config/api.js`, update semua file yang menggunakan fetch:

### Contoh Update:

**Before:**
```javascript
const response = await fetch('http://localhost:4000/api/dosen');
```

**After:**
```javascript
import API_BASE_URL from '../config/api';

const response = await fetch(`${API_BASE_URL}/api/dosen`);
```

### File yang Perlu Diupdate:
- `frontend/src/components/Dosen.jsx`
- `frontend/src/components/Autogroup.jsx`
- `frontend/src/components/Lokasi.jsx`
- `frontend/src/components/Kriteria.jsx`
- `frontend/src/components/Riwayat.jsx`
- `frontend/src/components/Dashboard.jsx`
- `frontend/src/components/Login.jsx`
- `frontend/src/components/KoordinatorPPM.jsx`
- `frontend/src/components/ManajemenAkun.jsx`
- `frontend/src/App.jsx`

---

## 🚨 Troubleshooting

### "Failed to fetch" dari HP:
1. ✅ Pastikan backend running dan listening di `0.0.0.0`
2. ✅ Cek firewall tidak memblokir port 4000 dan 5173
3. ✅ HP dan komputer di WiFi yang sama
4. ✅ Test akses backend langsung: `http://IP:4000/api/locations`

### CORS Error:
Backend sudah set `Access-Control-Allow-Origin: *`, tapi jika masih error:
```javascript
// backend/index.js - sudah OK
res.header('Access-Control-Allow-Origin', '*');
```

### Database Connection Error:
```javascript
// backend/.env
DB_HOST=localhost  // Jangan ganti ini jika MySQL di komputer yang sama
DB_USER=root
DB_PASS=
DB_NAME=otomatisasi
```

---

## 📱 UI Responsiveness

UI sudah menggunakan Tailwind CSS dengan responsive breakpoints:
- ✅ Mobile-first design
- ✅ Grid auto-adjust (`grid-cols-1 md:grid-cols-2`)  
- ✅ Sidebar collapsible
- ✅ Touch-friendly buttons

Tidak perlu perubahan tambahan untuk tampilan mobile.

---

## 🎯 Quick Start untuk Testing dari HP:

```powershell
# 1. Cari IP Anda
ipconfig  # Contoh output: 192.168.1.100

# 2. Edit frontend/.env
echo VITE_API_URL=http://192.168.1.100:4000 > frontend\.env

# 3. Jalankan
# Terminal 1:
cd backend; npm run dev

# Terminal 2:  
cd frontend; npm run dev -- --host 0.0.0.0

# 4. Akses dari HP (WiFi sama):
# http://192.168.1.100:5173
```

---

**Butuh bantuan update semua file fetch? Saya bisa otomatis update semua `http://localhost:4000` ke config import!**
