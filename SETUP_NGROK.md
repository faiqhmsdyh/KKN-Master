# 🌐 Setup Ngrok untuk Akses dari Paket Data/WiFi Berbeda

## Apa itu Ngrok?
Ngrok membuat **tunnel** dari internet publik ke localhost Anda. Jadi HP dengan paket data bisa akses komputer Anda meski tidak se-WiFi.

**Perfect untuk:** Testing, demo, development
**Jangan untuk:** Production (gunakan cloud hosting)

---

## 📥 1. Download & Install Ngrok

### Windows:
1. Download: https://ngrok.com/download
2. Extract `ngrok.exe` ke folder project: `C:\xampp\htdocs\MyApp\`
3. Sign up gratis: https://dashboard.ngrok.com/signup
4. Copy **authtoken** dari dashboard

### Setup Authtoken:
```powershell
.\ngrok.exe config add-authtoken YOUR_TOKEN_HERE
```

---

## 🚀 2. Jalankan Backend + Ngrok

### Terminal 1 - Backend:
```powershell
cd C:\xampp\htdocs\MyApp\backend
npm run dev
```

Backend running di `http://localhost:4000`

### Terminal 2 - Ngrok Backend Tunnel:
```powershell
cd C:\xampp\htdocs\MyApp
.\ngrok.exe http 4000
```

**Output:**
```
Forwarding   https://abc123-456.ngrok-free.app -> http://localhost:4000
```

✅ **Copy URL ngrok** (contoh: `https://abc123-456.ngrok-free.app`)

---

## 🎨 3. Update Frontend Config

Edit **`frontend/.env`**:
```env
VITE_API_URL=https://abc123-456.ngrok-free.app
```

⚠️ **Ganti dengan URL ngrok Anda!**

---

## 🚀 4. Jalankan Frontend + Ngrok

### Terminal 3 - Frontend:
```powershell
cd C:\xampp\htdocs\MyApp\frontend
npm run dev
```

Frontend running di `http://localhost:5173`

### Terminal 4 - Ngrok Frontend Tunnel:
```powershell
cd C:\xampp\htdocs\MyApp
.\ngrok.exe http 5173
```

**Output:**
```
Forwarding   https://xyz789-012.ngrok-free.app -> http://localhost:5173
```

✅ **Copy URL ngrok** (contoh: `https://xyz789-012.ngrok-free.app`)

---

## 📱 5. Akses dari HP (Paket Data/WiFi Manapun)

Buka browser di HP:
```
https://xyz789-012.ngrok-free.app
```

**Boom!** Aplikasi bisa diakses dari mana saja! 🎉

---

## 🎯 Struktur Lengkap

```
Komputer Anda:
├── Backend: http://localhost:4000
│   └── Ngrok: https://abc123-456.ngrok-free.app ← Pakai ini di .env
│
└── Frontend: http://localhost:5173
    └── Ngrok: https://xyz789-012.ngrok-free.app ← Buka di HP
```

---

## ⚙️ Ngrok Configuration File (Opsional)

Buat file `ngrok.yml` untuk konfigurasi persisten:

```yaml
version: "2"
authtoken: YOUR_TOKEN_HERE
tunnels:
  backend:
    proto: http
    addr: 4000
  frontend:
    proto: http
    addr: 5173
```

Jalankan semua tunnel sekaligus:
```powershell
.\ngrok.exe start --all
```

---

## 💡 Tips & Tricks

### Ngrok Versi Gratis (Limitations):
- ✅ 1 online ngrok process (jalankan 2 terminal = butuh 2 instance)
- ✅ Random URL setiap restart
- ✅ 40 connections/minute
- ❌ Custom domain (perlu bayar)
- ❌ No reserved URL

### Ngrok Versi Paid ($8/month):
- ✅ Reserved domains (URL tetap)
- ✅ Multiple tunnels sekaligus
- ✅ Custom branded domains
- ✅ No connection limits

### Keep Ngrok Running:
Jangan close terminal! Kalau terminal ngrok ditutup, tunnel akan mati.

### URL Berubah Setiap Restart:
Setiap kali restart ngrok, URL baru. Harus update `.env` lagi.

Solusi: Upgrade ke ngrok Pro untuk reserved domain.

---

## 🆘 Troubleshooting

### Error: "Account not found"
- Login/sign up: https://dashboard.ngrok.com/
- Setup authtoken: `.\ngrok.exe config add-authtoken TOKEN`

### Error: "Tunnel not found"
- Cek backend/frontend berjalan di port yang benar
- Ngrok hanya mem-forward, tidak menjalankan server

### "Failed to complete tunnel connection"
- Firewall/antivirus mungkin blocking
- Coba nonaktifkan sementara

### HP bisa buka URL tapi blank/error:
- Refresh browser (Ctrl+F5 di desktop, force refresh di HP)
- Clear cache
- Cek console browser untuk error

### CORS Error:
Backend sudah set `Access-Control-Allow-Origin: *`, seharusnya tidak ada masalah.

---

## 🔐 Security Warning

⚠️ **Ngrok expose komputer Anda ke internet publik!**

**Jangan:**
- ❌ Share URL ngrok di public
- ❌ Gunakan untuk production
- ❌ Tinggalkan ngrok running tanpa pengawasan
- ❌ Pakai untuk data sensitif tanpa enkripsi

**Lakukan:**
- ✅ Gunakan hanya untuk testing
- ✅ Tutup ngrok setelah selesai
- ✅ Gunakan authentication jika perlu
- ✅ Monitor ngrok dashboard untuk aktivitas mencurigakan

---

## 🎬 Quick Start Command

Simpan script ini sebagai `start-ngrok.ps1`:

```powershell
# Start Backend & Ngrok
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"
Start-Sleep 3
Start-Process powershell -ArgumentList "-NoExit", "-Command", ".\ngrok.exe http 4000"

# Start Frontend & Ngrok  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
Start-Sleep 5
Start-Process powershell -ArgumentList "-NoExit", "-Command", ".\ngrok.exe http 5173"

Write-Host "Ngrok started! Check terminals for URLs" -ForegroundColor Green
Write-Host "Remember to update frontend/.env with backend ngrok URL!" -ForegroundColor Yellow
```

Jalankan:
```powershell
.\start-ngrok.ps1
```

---

## 📊 Monitoring Ngrok

Dashboard ngrok (buka di browser):
```
http://127.0.0.1:4040
```

Menampilkan:
- Request logs
- Response times
- Traffic statistics

---

## 🔄 Alternative ke Ngrok

Jika ngrok tidak cocok, coba:

1. **LocalTunnel** (gratis, open source):
   ```powershell
   npm install -g localtunnel
   lt --port 4000
   ```

2. **CloudFlare Tunnel** (gratis, unlimited):
   ```powershell
   cloudflared tunnel --url localhost:4000
   ```

3. **Serveo** (SSH-based):
   ```powershell
   ssh -R 80:localhost:4000 serveo.net
   ```

---

**✨ Dengan Ngrok, HP Anda bisa akses aplikasi dari paket data manapun! ✨**

**Tapi ingat:** Ini untuk testing! Untuk production yang serius, gunakan [DEPLOY_PRODUCTION.md](DEPLOY_PRODUCTION.md)
