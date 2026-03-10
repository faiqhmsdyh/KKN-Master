import React, { useState, useRef, createContext, useEffect } from "react";
import './App.css'
import {
  Home,
  MapPin,
  Users,
  CpuIcon,
  History,
  UploadIcon,
  FileSpreadsheetIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  LoaderIcon,
  BellIcon,
  SettingsIcon,
  GraduationCapIcon,
  ClipboardListIcon,
  SlidersHorizontal,
  DownloadIcon,
  HeartPulseIcon,
  CarIcon,
  UserCog,
  Shuffle,
} from "lucide-react";

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Lokasi from './components/Lokasi';
import Autogroup from './components/Autogroup';
import Riwayat from './components/Riwayat';
import Kriteria from './components/Kriteria';
import LocationModal from './components/LocationModal';
import ManajemenAkun from './components/ManajemenAkun';
import Login from './components/Login';
import ResetPassword from './components/ResetPassword';
import KoordinatorPPM from './components/KoordinatorPPM';
import Dosen from './components/Dosen';

export const ThemeContext = createContext();

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [isResetPasswordPage, setIsResetPasswordPage] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    // Load activeTab from localStorage on mount
    return localStorage.getItem('activeTab') || 'dashboard';
  });
  const [excelData, setExcelData] = useState(null);
  const [importStatus, setImportStatus] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationForm, setLocationForm] = useState({ lokasi: "", desa_kecamatan: "", kabupaten: "", kuota: "", latitude: "", longitude: "", kontak_person: "", kontak_nama: "", kontak_telepon: "" });
  const [locationData, setLocationData] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [lokasiViewMode, setLokasiViewMode] = useState('list'); // 'list' | 'add' | 'edit'
  const [riwayatViewMode, setRiwayatViewMode] = useState('list'); // 'list' | 'add-dpl'
  const [dosenViewMode, setDosenViewMode] = useState('list'); // 'list' | 'add' | 'edit'
  const [selectedHasilId, setSelectedHasilId] = useState(null); // ID hasil untuk tambah DPL
  const fileInputRef = useRef(null);

  // Check localStorage on mount untuk persist login
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error('Error parsing saved user:', err);
        localStorage.removeItem('user');
      }
    }
    
    // Check if current URL is reset password page
    const path = window.location.pathname;
    const search = window.location.search;
    if (path === '/reset-password' || search.includes('token=')) {
      setIsResetPasswordPage(true);
    }
  }, []);

  // Save activeTab to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('activeTab', activeTab);
    }
  }, [activeTab, user]);

  const handleLogout = () => {
    setUser(null);
    setActiveTab('dashboard');
    localStorage.removeItem('user'); // Hapus dari localStorage
    localStorage.removeItem('activeTab'); // Hapus activeTab
  };

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData)); // Simpan ke localStorage
    
    // Check if there's a saved activeTab that's valid for user's role
    const savedTab = localStorage.getItem('activeTab');
    const validTabs = allTabs.filter(tab => tab.roles.includes(userData.role)).map(t => t.key);
    
    if (savedTab && validTabs.includes(savedTab)) {
      setActiveTab(savedTab);
    } else {
      // Set default tab based on role
      if (userData.role === 'Koordinator') {
        setActiveTab('koordinator_ppm');
      } else {
        setActiveTab('dashboard');
      }
    }
  };

  // Define all tabs
  const allTabs = [
    { 
      key: "dashboard", 
      label: "Dashboard", 
      icon: <Home size={20} strokeWidth={2.5} />,
      description: "Ringkasan dan statistik",
      roles: ["Admin"] // Admin role
    },
    { 
      key: "koordinator_ppm", 
      label: "Koordinator PPM", 
      icon: <UserCog size={20} strokeWidth={2.5} />,
      description: "Portal Koordinator PPM",
      roles: ["Koordinator"] // Koordinator role
    },
    { 
      key: "lokasi", 
      label: "Data Lokasi", 
      icon: <MapPin size={20} strokeWidth={2.5} />,
      description: "Manajemen lokasi KKN",
      roles: ["Admin"]
    },
    { 
      key: "kriteria", 
      label: "Kelola Kriteria", 
      icon: <SlidersHorizontal size={20} strokeWidth={2.5} />,
      description: "Atur kriteria pengelompokan",
      roles: ["Admin"]
    },
    { 
      key: "autogroup", 
      label: "Autogroup", 
      icon: <Shuffle size={20} strokeWidth={2.5} />,
      description: "Generate kelompok otomatis",
      roles: ["Admin"]
    },
    { 
      key: "riwayat", 
      label: "Hasil", 
      icon: <History size={20} strokeWidth={2.5} />,
      description: "Histori penempatan",
      roles: ["Admin"]
    },
    { 
      key: "dosen", 
      label: "Data Dosen", 
      icon: <GraduationCapIcon size={20} strokeWidth={2.5} />,
      description: "Kelola data DPL",
      roles: ["Admin"]
    },
    { 
      key: "akun", 
      label: "Manajemen Akun", 
      icon: <Users size={20} strokeWidth={2.5} />,
      description: "Kelola pengguna sistem",
      roles: ["Admin"] // Only admin
    },
  ];

  // Filter tabs based on user role
  const tabs = user 
    ? allTabs.filter(tab => tab.roles.includes(user.role))
    : allTabs;

  // Generate breadcrumb based on activeTab
  const getBreadcrumb = () => {
    const tabMap = {
      dashboard: ['Dashboard'],
      koordinator_ppm: ['Koordinator PPM'],
      lokasi: lokasiViewMode === 'add' ? ['Data Lokasi', 'Tambah Lokasi'] : lokasiViewMode === 'edit' ? ['Data Lokasi', 'Edit Lokasi'] : ['Data Lokasi'],
      kriteria: ['Kelola Kriteria'],
      autogroup: ['Autogroup'],
      riwayat: riwayatViewMode === 'add-dpl' ? ['Hasil', 'Tambah DPL'] : ['Hasil'],
      dosen: dosenViewMode === 'add' ? ['Data Dosen (DPL)', 'Tambah Dosen'] : dosenViewMode === 'edit' ? ['Data Dosen (DPL)', 'Edit Dosen'] : ['Data Dosen (DPL)'],
      akun: ['Manajemen Akun'],
    };
    return tabMap[activeTab] || [];
  };

  // Show reset password page if on reset password route
  if (isResetPasswordPage) {
    return (
      <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode }}>
        <div className={isDarkMode ? "min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" : "min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50"}>
          <ResetPassword 
            isDarkMode={isDarkMode} 
            setIsDarkMode={setIsDarkMode}
            onBackToLogin={() => {
              setIsResetPasswordPage(false);
              window.history.pushState({}, '', '/');
            }}
          />
        </div>
      </ThemeContext.Provider>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return (
      <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode }}>
        <div className={isDarkMode ? "min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" : "min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50"}>
          <Login onLogin={handleLogin} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        </div>
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode }}>
      <div className={isDarkMode ? "min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" : "min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50"}>
        <Header user={user} onLogout={handleLogout} breadcrumb={getBreadcrumb()} isSidebarCollapsed={isSidebarCollapsed} />

        <div className="relative w-full">
          <Sidebar 
            tabs={tabs} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            isDarkMode={isDarkMode} 
            setIsDarkMode={setIsDarkMode} 
            onLogout={handleLogout}
            isSidebarCollapsed={isSidebarCollapsed}
            setIsSidebarCollapsed={setIsSidebarCollapsed}
          />

          <main className={`${isSidebarCollapsed ? 'ml-20' : 'ml-60'} mt-16 flex-1 min-h-[calc(100vh-64px)] overflow-y-auto px-8 py-8 transition-all duration-300 ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/30'}`}>
            {activeTab === 'dashboard' && <Dashboard user={user} setActiveTab={setActiveTab} />}
            {activeTab === 'koordinator_ppm' && <KoordinatorPPM user={user} setActiveTab={setActiveTab} />}
            {activeTab === 'lokasi' && <Lokasi setShowLocationModal={setShowLocationModal} locationData={locationData} setLocationData={setLocationData} setLocationForm={setLocationForm} setEditingId={setEditingId} lokasiViewMode={lokasiViewMode} setLokasiViewMode={setLokasiViewMode} locationForm={locationForm} editingId={editingId} />}
            {activeTab === 'kriteria' && <Kriteria />}
            {activeTab === 'akun' && <ManajemenAkun />}
            {activeTab === 'autogroup' && <Autogroup fileInputRef={fileInputRef} excelData={excelData} setExcelData={setExcelData} importStatus={importStatus} setImportStatus={setImportStatus} isLoading={isLoading} setIsLoading={setIsLoading} />}
            {activeTab === 'riwayat' && <Riwayat riwayatViewMode={riwayatViewMode} setRiwayatViewMode={setRiwayatViewMode} selectedHasilId={selectedHasilId} setSelectedHasilId={setSelectedHasilId} />}
            {activeTab === 'dosen' && <Dosen dosenViewMode={dosenViewMode} setDosenViewMode={setDosenViewMode} />}
          </main>
        </div>

        <LocationModal show={showLocationModal} setShow={setShowLocationModal} locationForm={locationForm} setLocationForm={setLocationForm} editingId={editingId} onSave={async () => {
        try {
          const payload = {
            lokasi: locationForm.lokasi || null,
            id_provinsi: locationForm.id_provinsi || null,
            id_kabupaten: locationForm.id_kabupaten || null,
            id_kecamatan: locationForm.id_kecamatan || null,
            id_desa: locationForm.id_desa || null,
            latitude: locationForm.latitude ? parseFloat(locationForm.latitude) : null,
            longitude: locationForm.longitude ? parseFloat(locationForm.longitude) : null,
            id_periode: locationForm.id_periode || null,
            kontak_person: locationForm.kontak_person || null,
          };

          if (editingId) {
            // UPDATE
            const res = await fetch(`http://localhost:4000/api/locations/${editingId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              throw new Error(errData.error || 'Update failed');
            }
            const hasCoordinates = payload.latitude && payload.longitude;
            const distanceMsg = hasCoordinates ? '\n\n🏥 Jarak ke puskesmas telah dihitung otomatis oleh sistem.' : '';
            alert('✅ Lokasi berhasil diupdate' + distanceMsg);
          } else {
            // CREATE
            const res = await fetch('http://localhost:4000/api/locations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              throw new Error(errData.error || 'Save failed');
            }
            const created = await res.json();
            const hasCoordinates = payload.latitude && payload.longitude;
            const distanceMsg = hasCoordinates ? '\n🏥 Jarak ke puskesmas telah dihitung otomatis oleh sistem.' : '';
            alert('✅ Lokasi berhasil disimpan (ID: ' + created.id_lokasi + ')' + distanceMsg);
          }
          // SUCCESS: Close modal and refresh
          setShowLocationModal(false);
          setLocationForm({ lokasi: '', id_provinsi: '', id_kabupaten: '', id_kecamatan: '', id_desa: '', latitude: '', longitude: '', id_periode: '', kontak_person: '', kontak_nama: '', kontak_telepon: '' });
          setEditingId(null);
          // Refresh table with cache buster
          const refreshRes = await fetch('http://localhost:4000/api/locations-with-distance?_=' + Date.now());
          if (refreshRes.ok) {
            const data = await refreshRes.json();
            setLocationData(data);
          }
        } catch (err) {
          console.error('Save location error:', err);
          alert('Gagal menyimpan lokasi: ' + err.message);
          // DON'T close modal or clear form on error - let user retry
        }
      }} />
      </div>
    </ThemeContext.Provider>
  );
}
