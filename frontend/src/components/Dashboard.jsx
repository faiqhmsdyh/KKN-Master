import React, { useState, useEffect, useContext } from 'react';
import { MapIcon, ClipboardListIcon } from 'lucide-react';
import Map from './Map';
import { ThemeContext } from '../App';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const { isDarkMode } = useContext(ThemeContext);
  const [desaCount, setDesaCount] = useState(0);
  const [locationData, setLocationData] = useState([]);

  useEffect(() => {
    fetchDesaCount();
    fetchLocationData();
  }, []);

  const fetchDesaCount = async () => {
    try {
      const response = await fetch('http://localhost:4000/lokasi');
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
      const response = await fetch('http://localhost:4000/lokasi');
      if (response.ok) {
        const data = await response.json();
        setLocationData(data);
      }
    } catch (error) {
      console.error('Error fetching location data:', error);
    }
  };

  return (
    <section className="space-y-8 animate-fadeIn">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        {[
          {
            title: 'Desa Tersedia',
            value: desaCount,
            color: 'from-emerald-500 to-teal-600',
            bgColor: isDarkMode ? 'bg-emerald-950/30' : 'bg-emerald-100',
            icon: <MapIcon size={24} className={isDarkMode ? "text-emerald-400 stroke-2" : "text-emerald-600 stroke-2"} />,
            trend: '3 desa baru ditambahkan',
          },
          {
            title: 'Riwayat Penempatan',
            value: 0,
            color: 'from-violet-500 to-purple-600',
            bgColor: isDarkMode ? 'bg-violet-950/30' : 'bg-violet-100',
            icon: <ClipboardListIcon size={24} className={isDarkMode ? "text-violet-400 stroke-2" : "text-violet-600 stroke-2"} />,
            trend: 'Semua kelompok terisi',
          },
        ].map((item, i) => (
          <div key={i} className={isDarkMode ? "modern-card bg-gray-800/80 border-gray-700 hover:bg-gray-700/90" : "modern-card bg-white/80 border-blue-50 hover:bg-white/90"}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className={isDarkMode ? "text-gray-300 font-medium text-sm" : "text-gray-600 font-medium text-sm"}>
                  {item.title}
                </p>
                <p className={isDarkMode ? "text-xs text-gray-500 mt-1" : "text-xs text-gray-500 mt-1"}>
                  {item.trend}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${item.bgColor}`}>
                {item.icon}
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className={isDarkMode ? "text-4xl font-bold text-white" : "text-4xl font-bold text-gray-800"}>
                {item.value}
              </p>
              <span className={isDarkMode ? "text-sm text-gray-400" : "text-sm text-gray-600"}>
                lokasi
              </span>
            </div>
            <div className={`h-4 w-full mt-6 rounded-full bg-gradient-to-r ${item.color} opacity-70 group-hover:opacity-100 transition-opacity`}></div>
          </div>
        ))}
      </div>

      {/* Map Section */}
      <div className={isDarkMode ? "glass-card bg-gray-800/60 border-gray-700" : "glass-card bg-white/60 border-blue-50/50"}>
        <h4 className={isDarkMode ? "text-2xl font-bold text-white mb-4 flex items-center gap-2" : "text-2xl font-bold text-gray-400 mb-4 flex items-center gap-2"}>
          <MapIcon size={24} className={isDarkMode ? "text-blue-400" : "text-blue-600"} />
          Peta Lokasi KKN
        </h4>
        <div className={isDarkMode ? "bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-700 animate-fadeIn" : "bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-blue-50 animate-fadeIn"}>
          <Map locationData={locationData} />
        </div>
      </div>
    </section>
  );
}
