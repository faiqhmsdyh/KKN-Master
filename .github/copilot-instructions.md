# KKN AutoGroup - AI Coding Agent Instructions

## Project Overview
**KKN AutoGroup** is a web application for automatic grouping of KKN (Community Service) students across multiple locations in Indonesia. The system intelligently distributes students across geographic locations while respecting grouping criteria.

**Architecture**: Full-stack monorepo with separate frontend (React + Vite) and backend (Express + MySQL).

## Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Leaflet (map integration), XLSX (Excel parsing)
- **Backend**: Express 5, MySQL2, OpenStreetMap Nominatim API for geocoding
- **Database**: MySQL with 4 main tables: `lokasi`, `filter_criteria`, `grouping_history`, `grouping_results`

## Essential Architecture

### Data Flow
1. **Upload Phase**: Excel file containing student data (NIM, Nama, Prodi, Fakultas, etc.) → [Autogroup.jsx](frontend/src/components/Autogroup.jsx)
2. **Criteria Selection**: User selects filtering rules → [Kriteria.jsx](frontend/src/components/Kriteria.jsx) manages criteria persistence
3. **Processing**: Frontend calls `/api/autogroup` with student list + locations + criteria → [backend/index.js](backend/index.js)
4. **Distribution**: Backend algorithm distributes students to locations while respecting grouping constraints
5. **Persistence**: Results saved to `grouping_history` + detail rows in `grouping_results`

### Key Endpoints
- **Locations**: `GET /api/locations`, `POST /api/locations`, `PUT /api/locations/:id`, `DELETE /api/locations/:id`
- **Criteria**: `GET /api/filter-criteria`, `POST /api/filter-criteria`, `PUT /api/filter-criteria/:id`, `DELETE /api/filter-criteria/:id`
- **Grouping**: `POST /api/autogroup` → returns grouped result with locations assigned
- **History**: `GET /api/grouping-history`, `GET /api/grouping-results/:id`
- **Geocoding**: `POST /api/geocode` → calls Nominatim API to convert addresses to lat/lng

### Database Schema Relationships
```
grouping_history (1) ──→ (many) grouping_results
  ├─ Stores batch metadata + full JSON grouping data
  └─ filter_criteria as JSON snapshot
```

## Critical Implementation Patterns

### State Management
- Frontend uses **React Context** ([App.jsx](frontend/src/components/App.jsx) line 32: `ThemeContext`) for theme only
- **No Redux/Zustand**: All state lifted to App.jsx, passed down via props
- Props drilling pattern used throughout: `locationData` → `setLocationData` passed to Lokasi, LocationModal
- Autogroup component owns: `mahasiswaData`, `groupingResult`, `filterCriteria`, `locations`

### API Communication
- **Hardcoded URLs**: All fetch calls use `http://localhost:4000` (no .env config on frontend)
- Pattern: `fetch(url, { method, body: JSON.stringify(), headers: {'Content-Type': 'application/json'} })`
- Backend returns direct JSON objects (no envelope pattern)
- Error handling: Basic `.ok` check + try/catch, no centralized error middleware

### Excel Processing in Autogroup
- Uses `xlsx` library (dynamic import via `loadXLSX()`)
- Column mapping is lenient: accepts both `NIM` and `nim`, `Nama` and `nama`, etc.
- Data stored in component state, **not persisted until grouping is submitted**
- Expected columns: NIM/nim, Nama/nama, Prodi/prodi, Fakultas/fakultas, Jenis Kelamin, Nomor Telepon

### Grouping Algorithm ([backend/index.js](backend/index.js) line ~380)
**Rule-based, non-ML approach**:
1. Filters by gender if criteria specifies
2. Dynamically calculates group count (target 8-12 per group, max 20)
3. Distributes students round-robin across groups
4. Calls `assignLocationsToGroups()` to assign locations by geographic proximity
5. Uses distance formula (lat/lng) + kuota (quota per location) to balance load
6. Returns: array of groups with `nomor_kelompok`, `anggota` (members), `lokasi`, `desa_kecamatan`, `kabupaten`

## Developer Workflows

### Starting the Stack
```bash
# Terminal 1 - Backend (runs on :4000)
cd backend
npm install  # if needed
npm run dev  # runs with nodemon, watches index.js

# Terminal 2 - Frontend (runs on :5173)
cd frontend
npm install  # if needed
npm run dev  # Vite dev server with HMR
```

### Database Setup
- MySQL must be running on localhost:3306
- Env vars in `backend/.env`: `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`
- Tables auto-create on backend startup via pool.query() calls in [backend/index.js](backend/index.js) lines 42-140
- **No migration tool**: schema definition inline in index.js

### Building/Testing
- **Frontend**: `npm run build` → generates `dist/` with Rolldown bundler
- **Linting**: `npm run lint` → ESLint configured, no strict TypeScript
- **Backend**: No test script defined; manual testing via API calls
- **No Docker**: Runs on XAMPP/local MySQL

## Component Boundaries

### Frontend Components
- [Header.jsx](frontend/src/components/Header.jsx): Theme toggle + search bar (search not implemented)
- [Sidebar.jsx](frontend/src/components/Sidebar.jsx): Tab navigation
- [Dashboard.jsx](frontend/src/components/Dashboard.jsx): Summary stats (desa count, mahasiswa count)
- [Lokasi.jsx](frontend/src/components/Lokasi.jsx): CRUD for locations, search/sort, triggers LocationModal
- [LocationModal.jsx](frontend/src/components/LocationModal.jsx): Form for add/edit location with geocoding
- [Autogroup.jsx](frontend/src/components/Autogroup.jsx): **Main complexity** - file upload, grouping execution, result display
- [Kriteria.jsx](frontend/src/components/Kriteria.jsx): CRUD for filter criteria
- [Riwayat.jsx](frontend/src/components/Riwayat.jsx): View grouping history + export results
- [Map.jsx](frontend/src/components/Map.jsx): Leaflet-based map visualization (referenced but usage unclear)

### Backend Sections
- **Initialization** (lines 1-140): ENV loading, pool creation, CORS setup, table creation
- **Location CRUD** (lines 149-265): REST endpoints for lokasi table
- **Criteria CRUD** (lines 269-363): REST endpoints for filter_criteria table
- **Autogroup Logic** (lines 365-543): Core algorithm + location assignment
- **History Endpoints** (lines 575-675): Query/delete grouping records

## Integration Points & Gotchas

1. **Geocoding Latency**: [LocationModal.jsx](frontend/src/components/LocationModal.jsx) calls Nominatim API which is rate-limited—no retry logic
2. **Gender Field Variance**: Students may upload as "L/P", "Laki-laki/Perempuan", "Male/Female"—algorithm handles all
3. **Quota Management**: `kuota` field on location table is set but never enforced in grouping; locations can be overloaded
4. **CORS**: Wildcard `*` allowed ([backend/index.js](backend/index.js) line 35)
5. **No Auth**: Zero authentication/authorization implemented
6. **JSON Storage**: Full grouping result stored as LONGTEXT JSON in `grouping_history.data_grouping`—retrieving/editing requires JSON parsing

## Project-Specific Conventions

- **Naming**: Indonesian mixed with English (`lokasi`, `desa_kecamatan`, `nomor_kelompok` in DB, React hooks in English)
- **Error Messages**: Indonesian user-facing, English in console logs
- **Styling**: Tailwind classes + custom CSS in [App.css](frontend/src/App.css) for gradients/animations
- **Icons**: All from `lucide-react`, imported as needed per component
- **Time Handling**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` used, no timezone awareness

## When Modifying This Codebase

- **Adding a feature**: Check if it needs a new DB table or endpoint first
- **Changing data structure**: Update schema in [backend/index.js](backend/index.js) table creation + any relevant API response
- **Adding a UI tab**: Add to `tabs` array in [App.jsx](frontend/src/components/App.jsx) + create component + add case in render
- **Updating algorithm**: Modify `performAutoGroup()` and/or `assignLocationsToGroups()` in [backend/index.js](backend/index.js)
- **Testing grouping**: Use [Autogroup.jsx](frontend/src/components/Autogroup.jsx) file upload; console logs in backend show processing steps

## Known Limitations
- Search in Header not connected to state
- Map component imported but usage unclear
- No input validation on backend for string length/format
- Student data lost if page refreshes before grouping is submitted
- No pagination for large grouping result display
