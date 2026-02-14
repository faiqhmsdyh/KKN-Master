import React, { useState, useRef, createContext } from "react";
import './App.css'
import {
  HomeIcon,
  MapIcon,
  UsersIcon,
  CpuIcon,
  ClockIcon,
  UploadIcon,
  FileSpreadsheetIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  LoaderIcon,
  BellIcon,
  SettingsIcon,
  GraduationCapIcon,
  ClipboardListIcon,
  FilterIcon,
  DownloadIcon,
  HeartPulseIcon,
  CarIcon,
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

export const ThemeContext = createContext();

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [excelData, setExcelData] = useState(null);
  const [importStatus, setImportStatus] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationForm, setLocationForm] = useState({ lokasi: "", desa_kecamatan: "", kabupaten: "", kuota: "", latitude: "", longitude: "" });
  const [locationData, setLocationData] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const fileInputRef = useRef(null);

  const handleLogout = () => {
    setUser(null);
    setActiveTab('dashboard');
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const tabs = [
    { 
      key: "dashboard", 
      label: "Dashboard", 
      icon: <HomeIcon size={20} className="stroke-2" />,
      description: "Ringkasan dan statistik"
    },
    { 
      key: "lokasi", 
      label: "Data Lokasi", 
      icon: <MapIcon size={20} className="stroke-2" />,
      description: "Manajemen lokasi KKN"
    },
    { 
      key: "kriteria", 
      label: "Kelola Kriteria", 
      icon: <FilterIcon size={20} className="stroke-2" />,
      description: "Atur kriteria pengelompokan"
    },
    { 
      key: "autogroup", 
      label: "Autogroup", 
      icon: <CpuIcon size={20} className="stroke-2" />,
      description: "Generate kelompok otomatis"
    },
    { 
      key: "riwayat", 
      label: "Riwayat", 
      icon: <ClockIcon size={20} className="stroke-2" />,
      description: "Histori penempatan"
    },
  ];
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
        <Header user={user} onLogout={handleLogout} />

        <div className="relative w-full">
          <Sidebar tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

          <main className={isDarkMode 
            ? "ml-24 flex-1 min-h-[calc(100vh-80px)] overflow-y-auto px-8 py-8 bg-gray-800/50" 
            : "ml-24 flex-1 min-h-[calc(100vh-80px)] overflow-y-auto px-8 py-8 bg-white/30"}>
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'lokasi' && <Lokasi setShowLocationModal={setShowLocationModal} locationData={locationData} setLocationData={setLocationData} setLocationForm={setLocationForm} setEditingId={setEditingId} />}
            {activeTab === 'kriteria' && <Kriteria />}
            {activeTab === 'akun' && <ManajemenAkun />}
            {activeTab === 'autogroup' && <Autogroup fileInputRef={fileInputRef} excelData={excelData} setExcelData={setExcelData} importStatus={importStatus} setImportStatus={setImportStatus} isLoading={isLoading} setIsLoading={setIsLoading} />}
            {activeTab === 'riwayat' && <Riwayat />}
          </main>
        </div>

        <LocationModal show={showLocationModal} setShow={setShowLocationModal} locationForm={locationForm} setLocationForm={setLocationForm} editingId={editingId} onSave={async () => {
        try {
          const payload = {
            lokasi: locationForm.lokasi,
            desa_kecamatan: locationForm.desa_kecamatan || null,
            kabupaten: locationForm.kabupaten || null,
            kuota: Number(locationForm.kuota) || 0,
            latitude: locationForm.latitude ? parseFloat(locationForm.latitude) : null,
            longitude: locationForm.longitude ? parseFloat(locationForm.longitude) : null,
            fakes: locationForm.fakes ? 1 : 0,
          };

          if (editingId) {
            // UPDATE
            const res = await fetch(`http://localhost:4000/lokasi/${editingId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Update failed');
            alert('Lokasi berhasil diupdate');
          } else {
            // CREATE
            const res = await fetch('http://localhost:4000/lokasi', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Save failed');
            const created = await res.json();
            alert('Lokasi berhasil disimpan (ID: ' + created.id_lokasi + ')');
          }
        } catch (err) {
          console.error(err);
          alert('Gagal menyimpan lokasi. Cek console untuk detail.');
          } finally {
          setShowLocationModal(false);
          setLocationForm({ lokasi: '', desa_kecamatan: '', kabupaten: '', kuota: '', latitude: '', longitude: '', fakes: false });
          setEditingId(null);
          // Refresh table
          const res = await fetch('http://localhost:4000/lokasi');
          if (res.ok) {
            const data = await res.json();
            setLocationData(data);
          }
        }
      }} />
      </div>
    </ThemeContext.Provider>
  );
}
