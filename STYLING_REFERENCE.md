# 🎨 KKN Master Digital - Styling Quick Reference

## Color Palette

### Primary Colors
- **Sidebar Dark**: `#0f172a` (slate-900)
- **Sidebar Light**: `#f8fafc` (slate-50)
- **Accent Main**: `#2563eb` (blue-600)
- **Accent Dark**: `#1e40af` (blue-700)
- **Accent Light**: `#dbeafe` (blue-100)

### Glassmorphism Colors
- **Dark Glass**: `bg-slate-700/30 border-slate-600/40`
- **Light Glass**: `bg-white/40 border-blue-200/40`
- **Heavy Glass**: `bg-slate-800/50 border-slate-700/50`

### Gradient References
```css
/* Primary Gradient */
bg-gradient-to-r from-blue-600 to-indigo-600

/* Sidebar Gradient */
bg-gradient-to-b from-slate-900 to-slate-800

/* Stat Card Gradient */
bg-gradient-to-br from-blue-600/10 to-indigo-600/10

/* Page Background */
bg-gradient-to-br from-slate-50 via-white to-blue-50

/* Dark Mode Background */
bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
```

---

## Spacing & Sizing

### Border Radius
| Component | Class | Size |
|-----------|-------|------|
| Main Container | `rounded-[48px]` | 48px |
| Icon Box | `rounded-3xl` | 24px |
| Table/Modal | `rounded-[32px]` | 32px |
| Input/Button/Card | `rounded-2xl` | 16px |
| Small Badge | `rounded-xl` | 12px |

### Padding
| Context | Class | Use Case |
|---------|-------|----------|
| Main Container | `p-8` | Large sections |
| Cards | `p-6` | Stat cards, criterion |
| Icon Box | `p-4` | Icon containers |
| Input | `px-5 py-3` | Form inputs |
| Button | `px-6 py-3.5` | Action buttons |

### Height & Width
| Component | Class |
|-----------|-------|
| Sidebar Collapsed | `w-20` |
| Sidebar Expanded | `w-64` |
| Table Header | `h-14` |
| Icon Small | `w-5 h-5` (stroke-2.5) |
| Icon Medium | `w-8 h-8` (stroke-2.5) |

---

## Typography

### Font Families
```css
/* Brand/Display */
font-family: "Playfair Display", serif;
font-weight: 900;
font-style: italic;

/* Body/Default */
font-family: "Inter", sans-serif;
font-weight: 300-900;
```

### Font Sizes & Weights
| Purpose | Class | Size | Weight |
|---------|-------|------|--------|
| Page Title | `text-5xl font-black` | 48px | 900 |
| Section Title | `text-3xl font-black` | 30px | 900 |
| Card Title | `text-2xl font-black` | 24px | 900 |
| Regular Text | `text-base font-normal` | 16px | 400 |
| Small Label | `text-sm font-semibold` | 14px | 600 |
| Uppercase Label | `text-xs font-black uppercase tracking-widest` | 12px | 900 |

### Letter Spacing
| Class | Usage |
|-------|-------|
| `tracking-widest` | Uppercase labels, titles |
| `tracking-wide` | Section headings |
| `tracking-normal` | Body text |
| `tracking-tight` | Dense content |

---

## Effects & Transitions

### Backdrop Filter
```css
backdrop-blur-sm    /* 4px blur */
backdrop-blur-md    /* 12px blur */
backdrop-blur-2xl   /* 25px blur */
```

### Box Shadows
```css
shadow-lg       /* Material Design lg */
shadow-2xl      /* Extra large shadow */
shadow-none     /* Remove shadow */
```

### Transitions & Hover
```css
transition-all duration-300    /* Smooth transitions */
hover:scale-105               /* Subtle zoom */
hover:-translate-y-2          /* Lift effect */
hover:shadow-2xl              /* Shadow on hover */
hover:from-blue-500           /* Gradient shift */
```

### Animations
```css
animate-fade-in       /* 0.6s fade in */
animate-slide-in      /* 0.5s slide in */
animate-pulse-glow    /* 2s pulsing glow */
```

---

## Component Patterns

### 1. Main Container Template
```jsx
<div className={`relative rounded-[48px] p-8 backdrop-blur-md border transition-all
  ${isDarkMode 
    ? "bg-slate-700/30 border-slate-600/40" 
    : "bg-white/40 border-blue-200/40"}`}>
  <div className="absolute inset-0 rounded-[48px] 
    bg-gradient-to-br from-blue-600 to-indigo-600 opacity-5"></div>
  <div className="relative z-10">
    {/* Content here */}
  </div>
</div>
```

### 2. Page Header Template
```jsx
<div className="mb-8">
  <h1 className="text-5xl font-black mb-2">Title</h1>
  <p className="text-sm font-black uppercase tracking-widest">SUBTITLE</p>
</div>
```

### 3. Input Field Template
```jsx
<input 
  type="text"
  placeholder="Enter value"
  className={`w-full px-5 py-3 rounded-2xl backdrop-blur-sm border transition-all
    ${isDarkMode 
      ? "bg-slate-700/40 border-slate-600/40 text-white placeholder-slate-400 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20" 
      : "bg-white/50 border-blue-200/40 text-slate-900 placeholder-slate-400 focus:border-blue-600/60 focus:ring-2 focus:ring-blue-600/20"}`}
/>
```

### 4. Primary Button Template
```jsx
<button className="px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest
  text-white transition-all duration-300 hover:shadow-2xl hover:scale-105 group
  bg-gradient-to-r from-blue-600 to-indigo-600
  hover:from-blue-500 hover:to-indigo-500 active:scale-95">
  BUTTON TEXT
</button>
```

### 5. Secondary Button Template
```jsx
<button className={`px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest transition-all
  ${isDarkMode
    ? "bg-slate-700/50 text-white border border-slate-600/40 hover:bg-slate-600/50"
    : "bg-slate-200/50 text-slate-900 border border-slate-300/40 hover:bg-slate-300/50"}`}>
  BUTTON TEXT
</button>
```

### 6. Success Button Template
```jsx
<button className="px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest
  text-white transition-all duration-300 hover:shadow-2xl hover:scale-105
  bg-gradient-to-r from-green-600 to-emerald-600
  hover:from-green-500 hover:to-emerald-500">
  SUCCESS ACTION
</button>
```

### 7. Danger Button Template
```jsx
<button className="px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest
  text-white transition-all duration-300 hover:shadow-2xl hover:scale-105
  bg-gradient-to-r from-rose-600 to-red-600
  hover:from-rose-500 hover:to-red-500">
  DANGER ACTION
</button>
```

### 8. Stat Card Template
```jsx
<div className={`relative rounded-[48px] p-8 backdrop-blur-md border transition-all duration-300
  hover:shadow-2xl hover:-translate-y-2 group
  ${isDarkMode 
    ? "bg-slate-700/30 border-slate-600/40" 
    : "bg-white/40 border-blue-200/40"}`}>
  <div className="absolute inset-0 rounded-[48px] 
    bg-gradient-to-br from-blue-600/5 to-indigo-600/5 
    group-hover:from-blue-600/10 group-hover:to-indigo-600/10 transition-all"></div>
  <div className="relative z-10">
    <p className="text-sm font-black uppercase tracking-widest mb-2">Label</p>
    <p className="text-4xl font-black">Value</p>
  </div>
</div>
```

### 9. Modal Template
```jsx
<div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
  <div className={`relative rounded-[48px] shadow-2xl p-10 backdrop-blur-lg border w-full max-w-lg
    ${isDarkMode 
      ? "bg-slate-800/80 border-slate-700/40" 
      : "bg-white/80 border-blue-200/40"}`}>
    {/* Modal content */}
  </div>
</div>
```

### 10. Table Header Template
```jsx
<thead className="bg-gradient-to-r from-blue-600 to-indigo-600">
  <tr>
    <th className="px-6 py-3.5 text-left text-sm font-black uppercase tracking-widest text-white">
      Column Header
    </th>
  </tr>
</thead>
```

---

## Dark Mode Logic

```jsx
const isDarkMode = true; // dari ThemeContext

// Conditional classes pattern
className={isDarkMode 
  ? "bg-slate-700/30 text-white" 
  : "bg-white/40 text-slate-900"}

// Alternative with template literals
className={`
  px-5 py-3 rounded-2xl
  ${isDarkMode 
    ? "bg-slate-700/40 border-slate-600/40 text-white" 
    : "bg-white/50 border-blue-200/40 text-slate-900"}
`}
```

---

## Responsive Breakpoints

| Breakpoint | Class | Min Width | Usage |
|-----------|-------|-----------|-------|
| Mobile | - | 320px | Default |
| Small Tablet | `sm:` | 640px | Adjusted layout |
| Tablet | `md:` | 768px | 2-column layout |
| Desktop | `lg:` | 1024px | 3+ column layout |
| Large Desktop | `xl:` | 1280px | Max width containers |

### Common Responsive Patterns
```jsx
{/* Stack on mobile, 2 columns on desktop */}
className="grid grid-cols-1 md:grid-cols-2 gap-6"

{/* Hide on mobile, show on desktop */}
className="hidden md:block"

{/* Adjust padding */}
className="p-4 md:p-8"

{/* Responsive text size */}
className="text-2xl md:text-4xl"
```

---

## Accessibility Notes

- ✅ All buttons have `font-black` for better visibility
- ✅ Color contrast maintained for glassmorphism
- ✅ Focus rings visible on inputs: `focus:ring-2 focus:ring-blue-500/20`
- ✅ Hover states clearly indicate interactivity
- ✅ Use semantic HTML: `<button>`, `<input>`, `<label>`
- ⚠️ Ensure alt text on icons and images
- ⚠️ ARIA labels for screen readers on icon buttons

---

## Performance Optimization

- ✅ Use CSS for animations (not JavaScript)
- ✅ Backdrop-filter has minimal performance impact
- ✅ Transitions use `transition-all` for smoothness
- ✅ Gradients calculated at build time
- ✅ Classes are pre-compiled in Tailwind

---

## Browser Vendor Prefixes

Tailwind automatically handles prefixes, but for custom CSS:

```css
/* Glassmorphism */
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);

/* Smooth scrolling */
scroll-behavior: smooth;
-webkit-scroll-behavior: smooth;
```

---

**Last Updated**: 9 Februari 2026
**Version**: 2.0
**Component Coverage**: 100% (Header, Sidebar, Dashboard, Lokasi, LocationModal, Kriteria, Autogroup, Riwayat, App)
