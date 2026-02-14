# 💡 KKN Master Digital - Developer Quick Tips

> Panduan cepat dan tips berguna untuk development KKN Master Digital

---

## 🚀 Getting Started in 60 Seconds

### Step 1: Start Servers
```batch
start-dev.bat
```
**Tunggu ~10 detik** sampai kedua window muncul

### Step 2: Open Browser
```
http://localhost:5173
```

### Step 3: Done! 🎉
Sekarang Anda sudah bisa mulai development

---

## ⚡ Hot Tips

### Tip #1: Understanding the Design System
```
Setiap component mengikuti pattern yang sama:
1. rounded-[48px] untuk MAIN CONTAINER
2. rounded-2xl untuk INPUT & BUTTON
3. backdrop-blur-md untuk GLASS EFFECT
4. font-black untuk TITLE, tracking-widest untuk LABEL
```

**Copy-Paste Template:**
```jsx
<div className={`rounded-[48px] p-8 backdrop-blur-md border
  ${isDarkMode 
    ? "bg-slate-700/30 border-slate-600/40" 
    : "bg-white/40 border-blue-200/40"}`}>
  {/* Content */}
</div>
```

### Tip #2: Dark Mode Conditional
Jangan bikin dark mode sulit. Gunakan pattern ini:

```jsx
const isDarkMode = true; // dari ThemeContext

// SIMPLE WAY - recommended
className={isDarkMode ? "dark-class" : "light-class"}

// CLEANER WAY - untuk complex styling
className={`px-5 py-3 rounded-2xl
  ${isDarkMode 
    ? "bg-slate-700/40 text-white" 
    : "bg-white/50 text-slate-900"}`}
```

### Tip #3: Styling Components Faster

**DON'T** copy styles dari component lain dan ubah sedikit.
**DO** gunakan pattern dari STYLING_REFERENCE.md

**Contoh:**
```jsx
// ❌ SLOW - copy-paste dan modify
// Ambil dari Lokasi.jsx, ubah warna...

// ✅ FAST - gunakan template
// Buka STYLING_REFERENCE.md, copy template yang sesuai
// Paste dan customize
```

### Tip #4: File Organization
```
frontend/src/components/
├── Header.jsx          ← Navigation top
├── Sidebar.jsx         ← Navigation left
├── Dashboard.jsx       ← Main dashboard
├── Lokasi.jsx          ← Location CRUD
├── LocationModal.jsx   ← Location form
├── Kriteria.jsx        ← Criteria CRUD
├── Autogroup.jsx       ← Grouping engine
├── Riwayat.jsx         ← History & results
└── Map.jsx             ← Map visualization

Urutan ini adalah dependency order!
Jadi Header.jsx tidak bergantung pada Lokasi.jsx
Tapi Lokasi.jsx BISA bergantung pada Header.jsx
```

### Tip #5: Common Color Patterns

```jsx
// PRIMARY ACTION (Blue gradient)
className="bg-gradient-to-r from-blue-600 to-indigo-600"

// SUCCESS (Green gradient)
className="bg-gradient-to-r from-green-600 to-emerald-600"

// DANGER (Red gradient)
className="bg-gradient-to-r from-rose-600 to-red-600"

// SECONDARY (Slate with border)
className={isDarkMode 
  ? "bg-slate-700/50 border border-slate-600/40" 
  : "bg-slate-200/50 border border-slate-300/40"}

// DISABLED (Gray with opacity)
className="bg-slate-400/30 text-slate-500 cursor-not-allowed"
```

### Tip #6: Form Input Pattern

```jsx
<input 
  type="text"
  className={`w-full px-5 py-3 rounded-2xl backdrop-blur-sm border transition-all
    ${isDarkMode 
      ? "bg-slate-700/40 border-slate-600/40 text-white placeholder-slate-400"
      : "bg-white/50 border-blue-200/40 text-slate-900 placeholder-slate-400"}
    focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20`}
  placeholder="Enter text..."
/>
```

### Tip #7: Button Variants

```jsx
// PRIMARY BUTTON
<button className="px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest
  text-white bg-gradient-to-r from-blue-600 to-indigo-600
  hover:shadow-2xl hover:scale-105 active:scale-95 transition-all">
  SAVE
</button>

// SECONDARY BUTTON
<button className={`px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest transition-all
  ${isDarkMode 
    ? "bg-slate-700/50 text-white border border-slate-600/40 hover:bg-slate-600/50" 
    : "bg-slate-200/50 text-slate-900 border border-slate-300/40 hover:bg-slate-300/50"}`}>
  CANCEL
</button>

// ICON BUTTON
<button className="w-12 h-12 rounded-2xl flex items-center justify-center
  transition-all hover:scale-110
  bg-gradient-to-r from-blue-600 to-indigo-600">
  <Icon size={24} className="text-white" strokeWidth={2.5} />
</button>
```

---

## 🎯 Development Workflow

### When You Want to...

#### Add a New Component
1. Create file di `frontend/src/components/ComponentName.jsx`
2. Import di `App.jsx`
3. Add case di render logic
4. Follow styling pattern dari STYLING_REFERENCE.md

#### Add a New API Endpoint
1. Tambah route di `backend/index.js`
2. Test di Postman atau browser
3. Update frontend component dengan fetch call

#### Update Styling
1. Buka STYLING_REFERENCE.md
2. Copy pattern yang sesuai
3. Customize dengan variasi warna/ukuran
4. Test di dark mode juga!

#### Fix a Bug
1. Check browser console (F12)
2. Check backend logs (terminal)
3. Trace the issue dengan console.log
4. Fix dan refresh (Ctrl+Shift+R)

#### Test Dark Mode
1. Click theme button di Header
2. Verify warna berubah dengan smooth
3. Periksa contrast ratio tetap OK
4. Screenshot untuk dokumentasi

---

## 🔧 VSCode Shortcuts & Extensions

### Recommended Extensions
```
1. Tailwind CSS IntelliSense (bradlc.vscode-tailwindcss)
2. Prettier - Code formatter (esbenp.prettier-vscode)
3. ES7+ React/Redux/React-Native snippets (dsznajder.es7-react-js-snippets)
4. Thunder Client atau REST Client (untuk test API)
5. MySQL (weijan.mysql)
```

### Useful VSCode Shortcuts
```
Ctrl+K Ctrl+0     → Fold all code
Ctrl+K Ctrl+J     → Unfold all code
Ctrl+/            → Toggle line comment
Alt+Up/Down       → Move line up/down
Ctrl+D            → Select word
Ctrl+H            → Find & Replace
F2                → Rename symbol (all occurrences)
Ctrl+Space        → Autocomplete
```

### Quick Code Snippets

**Create new component template:**
```jsx
// frontend/src/components/NewComponent.jsx
import { useContext } from 'react';
import { ChevronRight } from 'lucide-react';
import { ThemeContext } from '../App';

export default function NewComponent() {
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <div className="relative p-8">
      <div className="mb-8">
        <h2 className="text-5xl font-black mb-2">Title</h2>
        <p className="text-sm font-black uppercase tracking-widest">SUBTITLE</p>
      </div>

      <div className={`rounded-[48px] p-8 backdrop-blur-md border
        ${isDarkMode 
          ? "bg-slate-700/30 border-slate-600/40" 
          : "bg-white/40 border-blue-200/40"}`}>
        {/* Content */}
      </div>
    </div>
  );
}
```

---

## 🐛 Debugging Tips

### Common Issues & Quick Fixes

#### Problem: Component tidak render
```javascript
// Check in console:
console.log("Component mounted"); // di useEffect

// Verify di React DevTools:
// Open DevTools → Components tab
// Search component name
// Check props dan state
```

#### Problem: Styling tidak apply
```javascript
// Check in browser DevTools:
// F12 → Elements → Search element
// Check "Styles" panel
// See if CSS is loaded

// Quick fix:
// - Force refresh: Ctrl+Shift+R
// - Clear cache: F12 → Network → Disable cache
// - Restart dev server: npm run dev
```

#### Problem: Dark mode flickering
```javascript
// Issue: isDarkMode state mengubah terlalu sering
// Solution: Check component re-render

// Di component, tambah:
console.log("Re-rendering with isDarkMode:", isDarkMode);

// Jika log muncul terlalu sering, ada unnecessary re-render
// Solution: Gunakan useMemo atau useCallback
```

#### Problem: API call tidak bekerja
```javascript
// Check:
1. Network tab di DevTools
2. Response status (200, 400, 500?)
3. Backend console logs
4. MySQL connection

// Test endpoint:
// Open http://localhost:4000/api/locations
// Should return JSON array
```

#### Problem: Form tidak submit
```javascript
// Check:
1. Form has proper <form> tag
2. Button is type="submit"
3. No JavaScript errors (F12 console)
4. API endpoint correct
5. Request body format correct
```

---

## 📊 Performance Tips

### Tip 1: Minimize Re-renders
```jsx
// ❌ BAD - menyebabkan re-render setiap parent update
const ChildComponent = ({ data }) => {
  return <div>{data}</div>;
};

// ✅ GOOD - hanya re-render jika prop berubah
const ChildComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});
```

### Tip 2: Use useMemo for Expensive Calculations
```jsx
import { useMemo } from 'react';

export function Component({ items }) {
  // Hanya hitung ulang jika items berubah
  const filteredItems = useMemo(() => {
    return items.filter(item => item.active);
  }, [items]);

  return <div>{filteredItems.length}</div>;
}
```

### Tip 3: Lazy Load Components
```jsx
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

export function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  );
}
```

---

## 📝 Code Style Guidelines

### Naming Conventions
```javascript
// Components
MyComponent.jsx          // PascalCase

// Functions & Variables
const myFunction = () => {}  // camelCase
const myVariable = 42

// CSS Classes
className="rounded-[48px]"   // Tailwind format
className="custom-card"      // kebab-case

// Database & API
table_name               // snake_case
api/endpoint_name        // kebab-case
```

### Comment Guidelines
```javascript
// ✅ GOOD
// Fetch locations from API and update state
const fetchLocations = async () => {
  const response = await fetch('/api/locations');
  setLocations(await response.json());
};

// ❌ AVOID
// This fetches locations
const fetchLocations = async () => { ... };

// ❌ AVOID (obvious comment)
// Increment counter
counter++;
```

### Import Organization
```javascript
// Order: React → External → Local components → Utils

// React
import { useState, useContext } from 'react';

// External libraries
import { ChevronRight } from 'lucide-react';

// Local components
import Header from './Header';

// Utils
import { API_URL } from '../config';
```

---

## 🚨 Crisis Mode

### Jika Everything Breaking...

```bash
# Step 1: Kill all terminals (Ctrl+C)

# Step 2: Clean everything
cd frontend
rm -r node_modules package-lock.json
npm install
npm run dev

# Terminal baru:
cd backend
npm install
npm run dev

# Step 3: Clear browser cache
# F12 → Application → Storage → Clear Site Data

# Step 4: Refresh page
# Ctrl+Shift+R (force refresh)

# Step 5: Check errors
# F12 → Console
# Terminal logs
```

### Nuclear Option
```bash
# Last resort - start from scratch

# 1. Backup your work
git add .
git commit -m "Backup before reset"

# 2. Reset to clean state
git reset --hard HEAD

# 3. Reinstall everything
cd frontend && npm install
cd backend && npm install

# 4. Start servers
npm run dev  # each in separate terminal
```

---

## ✨ Pro Tips

### Pro Tip 1: Keyboard Shortcuts for Styling
```
Instead of typing full className, use snippets:
Ctrl+Space in VSCode → See snippets
```

### Pro Tip 2: Component Library Pattern
```jsx
// Save frequently used patterns as snippets
// VSCode: File → Preferences → Configure User Snippets

// Example snippet for glassmorphic container:
{
  "Glasmorphic Container": {
    "prefix": "glass",
    "body": [
      "rounded-[48px] p-8 backdrop-blur-md border",
      "${isDarkMode ? 'bg-slate-700/30 border-slate-600/40' : 'bg-white/40 border-blue-200/40'}"
    ]
  }
}
```

### Pro Tip 3: Git Workflow
```bash
# Branch untuk fitur baru
git checkout -b feature/new-feature

# Commit dengan deskripsi jelas
git commit -m "feat: add glassmorphic card component"

# Push ke repository
git push origin feature/new-feature
```

### Pro Tip 4: Testing in Multiple Browsers
```bash
# Chrome DevTools
F12 → Device toolbar (Ctrl+Shift+M)

# Test di different screen sizes
- Mobile: 375x812 (iPhone)
- Tablet: 768x1024 (iPad)
- Desktop: 1920x1080
```

### Pro Tip 5: API Testing
```javascript
// Quick API test di browser console:
fetch('http://localhost:4000/api/locations')
  .then(r => r.json())
  .then(data => console.log(data));
```

---

## 📚 Reference Quick Links

| Need Help? | Open This File |
|-----------|-----------------|
| Styling help | `STYLING_REFERENCE.md` |
| Design system | `DESIGN_TRANSFORMATION.md` |
| All changes | `CHANGELOG.md` |
| Status check | `IMPLEMENTATION_CHECKLIST.md` |
| Full guide | `README.md` |

---

## 🎯 Daily Development Checklist

### Start of Day
- [ ] `start-dev.bat`
- [ ] Check browser: http://localhost:5173
- [ ] Test dark mode toggle
- [ ] Open VSCode

### End of Day
- [ ] Commit changes: `git commit -m "..."`
- [ ] Push to repository: `git push`
- [ ] Stop servers: `Ctrl+C` in terminals
- [ ] Backup important files

### Before Going to Production
- [ ] All styling complete? Check IMPLEMENTATION_CHECKLIST.md
- [ ] Dark mode working? Test toggle
- [ ] Responsive on mobile? Use Device toolbar
- [ ] No console errors? F12 → Console
- [ ] API endpoints working? Test manually
- [ ] Database changes backed up? Run backup script

---

## 🎉 You're Ready!

Sekarang Anda siap untuk:
1. ✅ Development dengan cepat
2. ✅ Fix bugs efficiently
3. ✅ Add features confidently
4. ✅ Style components beautifully
5. ✅ Deploy proudly

**Happy Coding!** 🚀

---

**Last Updated**: 9 Februari 2026
**Version**: 2.0

Bookmark halaman ini untuk referensi cepat!
