# 🚀 Deploy ke Railway.app (Recommended untuk Production)

## Kenapa Railway?
- ✅ Gratis $5/month credit (cukup untuk testing)
- ✅ Auto HTTPS dengan domain gratis
- ✅ Deploy backend + database dalam 1 project
- ✅ Auto-build dari Git
- ✅ Environment variables UI yang mudah

---

## 📋 Langkah-langkah Deploy

### 1️⃣ Persiapan

**A. Push code ke GitHub** (jika belum):
```powershell
# Di root project
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/kkn-autogroup.git
git push -u origin main
```

**B. Sign up Railway.app:**
- Buka https://railway.app
- Sign up dengan GitHub account
- Klik "New Project"

---

### 2️⃣ Deploy Backend + MySQL

**A. Buat MySQL Database:**
1. Klik "+ New" → "Database" → "Add MySQL"
2. Railway auto-provision MySQL instance
3. Catat credentials (auto-generated)

**B. Deploy Backend:**
1. Klik "+ New" → "GitHub Repo"
2. Pilih repository Anda
3. Railway auto-detect `backend/package.json`
4. Set **Root Directory**: `backend`
5. Set **Start Command**: `npm run dev` (atau `node index.js`)

**C. Set Environment Variables di Railway:**
```env
DB_HOST=mysql-instance.railway.internal
DB_USER=root
DB_PASS=<dari railway>
DB_NAME=railway
PORT=4000
```

Railway akan generate URL backend: `https://kkn-backend.up.railway.app`

---

### 3️⃣ Deploy Frontend ke Vercel

**A. Install Vercel CLI:**
```powershell
npm install -g vercel
```

**B. Build Frontend:**
```powershell
cd frontend
npm run build
```

**C. Deploy:**
```powershell
vercel
```

Jawab pertanyaan:
- Project name: `kkn-autogroup-frontend`
- Directory: `./` (current)
- Build command: `npm run build`
- Output directory: `dist`

**D. Set Environment Variables di Vercel:**
```env
VITE_API_URL=https://kkn-backend.up.railway.app
```

Vercel akan generate URL: `https://kkn-autogroup-frontend.vercel.app`

---

### 4️⃣ Update CORS di Backend

Edit `backend/index.js`:
```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://kkn-autogroup-frontend.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
```

Commit dan push:
```powershell
git add .
git commit -m "Update CORS for production"
git push
```

Railway akan auto-redeploy.

---

### 5️⃣ Akses dari HP (Mana Saja!)

✅ Buka browser di HP: `https://kkn-autogroup-frontend.vercel.app`

Sekarang bisa diakses dari:
- ✅ Paket data seluler
- ✅ WiFi manapun
- ✅ Komputer lain
- ✅ Dari mana saja di dunia

---

## 💰 Biaya

**Railway:**
- Gratis $5/month (cukup untuk ~500 jam runtime)
- Setelah habis: $0.000231/GB-hour (~$5-10/month untuk small app)

**Vercel:**
- 100% GRATIS untuk personal projects
- Unlimited bandwidth
- Auto HTTPS

**Total: GRATIS untuk testing, ~$5-10/month untuk production**

---

## 🔒 Security Checklist

Sebelum production:
- ✅ Ganti semua password default
- ✅ Set CORS ke domain spesifik (bukan `*`)
- ✅ Enable HTTPS only
- ✅ Add rate limiting
- ✅ Validasi input di backend
- ✅ Gunakan environment variables untuk secrets
- ✅ Setup backup database

---

## 🆘 Troubleshooting

### Error: "Database connection failed"
- Cek environment variables di Railway
- Pastikan MySQL service running
- Cek `DB_HOST` menggunakan internal hostname

### Error: "CORS blocked"
- Update CORS origin di backend/index.js
- Redeploy backend

### Frontend can't connect to backend
- Cek `VITE_API_URL` di Vercel environment variables
- Rebuild frontend: `vercel --prod`

---

## 📊 Monitoring

Railway Dashboard menampilkan:
- CPU/RAM usage
- Request logs
- Crash reports
- Database metrics

Akses via: https://railway.app/dashboard

---

## 🔄 Update Aplikasi

Setelah edit code:
```powershell
git add .
git commit -m "Update feature"
git push
```

Railway auto-redeploy backend ✅

Untuk frontend:
```powershell
cd frontend
vercel --prod
```

---

**✨ Selamat! Aplikasi Anda sekarang sudah di internet dan bisa diakses dari mana saja! ✨**
