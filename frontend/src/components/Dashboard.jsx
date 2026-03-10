import React, { useState, useEffect, useContext } from 'react';
import { MapIcon, UsersIcon, ListChecksIcon, ArrowRight, Sparkles } from 'lucide-react';
import Map from './Map';
import { ThemeContext } from '../App';
import '../styles/Dashboard.css';

export default function Dashboard({ user, setActiveTab }) {
  const { isDarkMode } = useContext(ThemeContext);
  const [desaCount, setDesaCount] = useState(0);
  const [locationData, setLocationData] = useState([]);
  const [mahasiswaStats, setMahasiswaStats] = useState(null);
  const [kriteriaCount, setKriteriaCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState('');

  useEffect(() => {
    fetchDesaCount();
    fetchLocationData();
    fetchMahasiswaStats();
    fetchKriteriaCount();
    setLastUpdate(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }));
  }, []);

  const fetchDesaCount = async () => {
    try {
      // Fetch active periode first
      const periodeRes = await fetch('http://localhost:4000/api/periode/active');
      let periodeId = null;
      if (periodeRes.ok) {
        const activePeriode = await periodeRes.json();
        periodeId = activePeriode?.id_periode;
      }
      
      // Fetch locations with active periode filter
      let url = 'http://localhost:4000/api/locations-with-distance';
      if (periodeId) {
        url += `?id_periode=${periodeId}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setDesaCount(data.length);
      }
    } catch (error) {
      console.error('Error fetching desa count:', error);
    }
  };

  const fetchLocationData = async () => {
    try {
      // Fetch active periode first
      const periodeRes = await fetch('http://localhost:4000/api/periode/active');
      let periodeId = null;
      if (periodeRes.ok) {
        const activePeriode = await periodeRes.json();
        periodeId = activePeriode?.id_periode;
      }
      
      // Fetch locations with active periode filter
      let url = 'http://localhost:4000/api/locations-with-distance';
      if (periodeId) {
        url += `?id_periode=${periodeId}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setLocationData(data);
      }
    } catch (error) {
      console.error('Error fetching location data:', error);
    }
  };

  const fetchMahasiswaStats = async () => {
    try {
      const response = await fetch('http://localhost:4000/mahasiswa/statistik');
      if (response.ok) {
        const data = await response.json();
        setMahasiswaStats(data);
      }
    } catch (error) {
      console.error('Error fetching mahasiswa stats:', error);
    }
  };

  const fetchKriteriaCount = async () => {
    try {
      const response = await fetch('http://localhost:4000/kriteria');
      if (response.ok) {
        const data = await response.json();
        setKriteriaCount(data.length);
      }
    } catch (error) {
      console.error('Error fetching kriteria count:', error);
    }
  };

  return (
    <section className="space-y-7 animate-fadeIn">
      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Mulai AutoGroup Card */}
        <div 
          onClick={() => setActiveTab('autogroup')}
          className={isDarkMode
            ? "group cursor-pointer bg-white/5 backdrop-blur-md border border-gray-700/50 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
            : "group cursor-pointer bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
          }
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={isDarkMode ? "p-3 rounded-xl bg-blue-600/20" : "p-3 rounded-xl bg-blue-100"}>
              <Sparkles size={28} className="text-blue-500" />
            </div>
          </div>
          <p className={isDarkMode ? "text-gray-400 text-xs uppercase tracking-wide mb-2" : "text-gray-600 text-xs uppercase tracking-wide mb-2"}>
            Mulai AutoGroup
          </p>
          <div className="flex items-baseline gap-2">
            <p className={isDarkMode ? "text-lg font-black text-white" : "text-lg font-black text-gray-900"}>
              <strong>Kelompokkan Peserta</strong>
            </p>
          </div>
        </div>

        {/* Lokasi Card */}
        <div 
          onClick={() => setActiveTab('lokasi')}
          className={isDarkMode 
            ? "cursor-pointer bg-white/5 backdrop-blur-md border border-gray-700/50 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]" 
            : "cursor-pointer bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"}>
          <div className="flex items-center gap-3 mb-4">
            <div className={isDarkMode ? "p-3 rounded-xl bg-emerald-500/20" : "p-3 rounded-xl bg-emerald-100"}>
              <MapIcon size={28} className={isDarkMode ? "text-emerald-400" : "text-emerald-600"} />
            </div>
          </div>
          <p className={isDarkMode ? "text-gray-400 text-xs uppercase tracking-wide mb-2" : "text-gray-600 text-xs uppercase tracking-wide mb-2"}>
            Total Lokasi
          </p>
          <div className="flex items-baseline gap-2">
            <p className={isDarkMode ? "text-4xl font-black text-white" : "text-4xl font-black text-gray-900"}>
              {desaCount}
            </p>
            <span className={isDarkMode ? "text-lg text-gray-400 font-bold" : "text-lg text-gray-600 font-bold"}>Titik</span>
          </div>
        </div>

        {/* Kriteria Card */}
        <div 
          onClick={() => setActiveTab('kriteria')}
          className={isDarkMode 
            ? "cursor-pointer bg-white/5 backdrop-blur-md border border-gray-700/50 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]" 
            : "cursor-pointer bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"}>
          <div className="flex items-center gap-3 mb-4">
            <div className={isDarkMode ? "p-3 rounded-xl bg-amber-500/20" : "p-3 rounded-xl bg-amber-100"}>
              <ListChecksIcon size={28} className={isDarkMode ? "text-amber-400" : "text-amber-600"} />
            </div>
          </div>
          <p className={isDarkMode ? "text-gray-400 text-xs uppercase tracking-wide mb-2" : "text-gray-600 text-xs uppercase tracking-wide mb-2"}>
            Kriteria Aktif
          </p>
          <div className="flex items-baseline gap-2">
            <p className={isDarkMode ? "text-4xl font-black text-white" : "text-4xl font-black text-gray-900"}>
              {kriteriaCount}
            </p>
            <span className={isDarkMode ? "text-lg text-gray-400 font-bold" : "text-lg text-gray-600 font-bold"}>Aturan</span>
          </div>
        </div>

        {/* Mahasiswa Card - Prominent Blue */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
              <UsersIcon size={28} className="text-white" />
            </div>
          </div>
          <p className="text-blue-100 text-xs uppercase tracking-wide mb-2">
            Peserta KKN 
          </p>
          <div className="flex items-baseline gap-2 mb-3">
            <p className="text-4xl font-black text-white">
              {mahasiswaStats?.total?.toLocaleString('id-ID') || '0'}
            </p>
            <span className="text-lg text-blue-100 font-bold">Orang</span>
          </div>
          <p className="text-blue-200 text-xs">
            Update: {lastUpdate}
          </p>
        </div>
      </div>

      {/* Map Section */}
      <div className={isDarkMode 
        ? "bg-white/5 backdrop-blur-md border border-gray-700/50 rounded-2xl p-6" 
        : "bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl p-6 shadow-lg"}>
        <h4 className={isDarkMode ? "text-xl font-black text-white mb-5 uppercase tracking-tight" : "text-xl font-black text-gray-900 mb-5 uppercase tracking-tight"}>
          Peta Sebaran Lokasi
        </h4>
        <div className={isDarkMode 
          ? "bg-gray-800/50 rounded-2xl p-4 shadow-inner border border-gray-700/50" 
          : "bg-gray-50/50 rounded-2xl p-4 shadow-inner"}>
          <Map locationData={locationData} />
        </div>
      </div>
    </section>
  );
}
