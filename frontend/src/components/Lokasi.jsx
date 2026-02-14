import React, { useState, useEffect, useContext } from 'react';
import { MapIcon, UploadIcon, Trash2Icon, Edit2Icon, LoaderIcon, ArrowUpAZIcon, ArrowDownZAIcon, SearchIcon } from 'lucide-react';
import { ThemeContext } from '../App';
import '../styles/Lokasi.css';

export default function Lokasi({ setShowLocationModal, locationData, setLocationData, setLocationForm, setEditingId }) {
  const { isDarkMode } = useContext(ThemeContext);
  const [isLoading, setIsLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch locations dari backend
  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:4000/lokasi');
      if (response.ok) {
        const data = await response.json();
        setLocationData(data);
      } else {
        alert('Gagal mengambil data lokasi');
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      alert('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getSortedData = () => {
    if (!locationData) return [];
    let filtered = locationData;
    
    // Filter berdasarkan search query
    if (searchQuery.trim()) {
      filtered = locationData.filter((loc) =>
        (loc.lokasi && loc.lokasi.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (loc.desa && loc.desa.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (loc.kecamatan && loc.kecamatan.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (loc.kabupaten && loc.kabupaten.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Sort berdasarkan ID, bukan nama
    const sorted = [...filtered].sort((a, b) => {
      return sortOrder === 'asc' ? a.id_lokasi - b.id_lokasi : b.id_lokasi - a.id_lokasi;
    });
    return sorted;
  };

  const handleEdit = (location) => {
    setLocationForm({
      lokasi: location.lokasi,
      desa_kecamatan: (location.desa || '') + (location.kecamatan ? ' / ' + location.kecamatan : ''),
      kabupaten: location.kabupaten,
      kuota: location.kuota_total || location.kuota,
      latitude: location.latitude,
      longitude: location.longitude,
      fakes: !!location.fakes
    });
    setEditingId(location.id_lokasi);
    setShowLocationModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus lokasi ini?')) return;

    try {
      const response = await fetch(`http://localhost:4000/lokasi/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        alert('Lokasi berhasil dihapus');
        fetchLocations();
      } else {
        alert('Gagal menghapus lokasi');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // Import handler
  const fileInputRef = React.useRef(null);
  const handleImportClick = () => fileInputRef.current?.click();
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:4000/lokasi/import', { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        alert('Import selesai: ' + (data.inserted || 0) + ' baris');
        fetchLocations();
      } else {
        const err = await res.json();
        alert('Import gagal: ' + (err.error || 'Unknown'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsLoading(false);
      e.target.value = null;
    }
  };

  return (
    <section className="space-y-6">
      {/* Header Outside Container */}
      <div className="space-y-2">
        <h2>
          <span className="gradient-text-alt">Data Lokasi</span>
        </h2>
        <p className={isDarkMode ? "text-xs text-gray-400" : "text-xs text-gray-600"}>
          Kelola lokasi dan penempatan KKN di berbagai desa
        </p>
      </div>

      {/* Main Content Container */}
      <div className={isDarkMode ? "glass-card bg-gray-800/60 border-gray-700 animate-slideInUp" : "glass-card bg-white/60 border-blue-50/50 animate-slideInUp"}>
        {/* Header Section with Right-Aligned Controls */}
        <div className="space-y-4 mb-8">
          {/* Search Box & Action Buttons - Right Aligned */}
          <div className="flex flex-wrap gap-3 justify-end items-center">
            {/* Search Box */}
            <div className="relative w-60">
              <SearchIcon size={18} className={isDarkMode ? "absolute left-4 top-3.5 text-gray-500" : "absolute left-4 top-3.5 text-gray-400"} />
              <input
                type="text"
                placeholder="Cari lokasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={isDarkMode 
                  ? "w-full px-4 py-2.5 pl-12 input-modern bg-gray-800/50 border-gray-600 text-white placeholder-gray-500 rounded-lg text-sm" 
                  : "w-full px-4 py-2.5 pl-12 input-modern bg-gray-50/50 border-gray-200 placeholder-gray-500 rounded-lg text-sm"}
              />
            </div>

            {/* Sort Button */}
            <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="btn-secondary flex items-center gap-2" title="Urutkan berdasarkan ID">
              {sortOrder === 'asc' ? <ArrowUpAZIcon size={18} /> : <ArrowDownZAIcon size={18} />}
              {sortOrder === 'asc' ? 'ID ↑' : 'ID ↓'}
            </button>

            {/* Import Button */}
            <button onClick={handleImportClick} className="btn-success flex items-center gap-2">
              <UploadIcon size={18} />
              Import Data
            </button>
            <input ref={fileInputRef} onChange={handleFileChange} type="file" accept=".xlsx,.xls" className="hidden" />

            {/* Add Button */}
            <button onClick={() => {
              setLocationForm({ lokasi: "", desa_kecamatan: "", kabupaten: "", kuota: "", latitude: "", longitude: "", fakes: false });
              setEditingId(null);
              setShowLocationModal(true);
            }} className="btn-primary flex items-center gap-2">
              <span className="text-lg font-bold">+</span>
              Tambah Lokasi
            </button>
          </div>
        </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <LoaderIcon size={32} className={isDarkMode ? "text-blue-400 animate-spin mb-2" : "text-blue-600 animate-spin mb-2"} />
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Memuat data...</p>
        </div>
      ) : locationData && locationData.length > 0 ? (
        <div className={isDarkMode ? "overflow-hidden rounded-2xl border border-gray-700/50 shadow-xl" : "overflow-hidden rounded-2xl border border-blue-100/50 shadow-lg"}>
          <table className={isDarkMode ? "w-full text-sm bg-gray-800/60" : "w-full text-sm bg-white/70"}>
            <thead>
              <tr className={isDarkMode 
                ? "bg-gradient-to-r from-blue-600 to-indigo-600" 
                : "bg-gradient-to-r from-blue-600 to-indigo-600"}>
                <th className="px-6 py-4 text-left font-semibold text-white">ID</th>
                <th className="px-6 py-4 text-left font-semibold text-white">Lokasi</th>
                <th className="px-6 py-4 text-left font-semibold text-white">Desa/Kecamatan</th>
                <th className="px-6 py-4 text-left font-semibold text-white">Kabupaten</th>
                <th className="px-6 py-4 text-left font-semibold text-white">Kuota</th>
                <th className="px-6 py-4 text-left font-semibold text-white">Faskes</th>
                <th className="px-6 py-4 text-left font-semibold text-white">Koordinat</th>
                <th className="px-6 py-4 text-left font-semibold text-white">Aksi</th>
              </tr>
            </thead>
            <tbody className={isDarkMode ? "divide-y divide-gray-700/50 bg-gray-800/40" : "divide-y divide-blue-100/30 bg-white/50"}>
              {getSortedData().length > 0 ? getSortedData().map((location) => (
                <tr key={location.id_lokasi} className={isDarkMode ? "hover:bg-gray-700/50 transition-colors border-gray-700/30" : "hover:bg-blue-50/70 transition-colors border-blue-100/20"}>
                  <td className={isDarkMode ? "px-6 py-4 text-gray-300 font-medium" : "px-6 py-4 text-gray-800 font-medium"}>{location.id_lokasi}</td>
                  <td className={isDarkMode ? "px-6 py-4 text-gray-100 font-semibold" : "px-6 py-4 text-gray-900 font-semibold"}>{location.lokasi}</td>
                  <td className={isDarkMode ? "px-6 py-4 text-gray-300" : "px-6 py-4 text-gray-700"}>{(location.desa || '') + (location.kecamatan ? ' / ' + location.kecamatan : '')}</td>
                  <td className={isDarkMode ? "px-6 py-4 text-gray-300" : "px-6 py-4 text-gray-700"}>{location.kabupaten}</td>
                  <td className={isDarkMode ? "px-6 py-4 text-gray-200 font-semibold" : "px-6 py-4 text-gray-800 font-semibold"}>{location.kuota_total || location.kuota}</td>
                  <td className={isDarkMode ? "px-6 py-4 text-gray-200" : "px-6 py-4 text-gray-800"}>
                    {location.fakes ? (
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Ya</span>
                    ) : (
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">Tidak</span>
                    )}
                  </td>
                  <td className={isDarkMode ? "px-6 py-4 text-gray-400 text-xs font-mono" : "px-6 py-4 text-gray-600 text-xs font-mono"}>
                    {location.latitude ? `${parseFloat(location.latitude).toFixed(4)}, ${parseFloat(location.longitude).toFixed(4)}` : '-'}
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button
                      onClick={() => handleEdit(location)}
                      className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1 hover-scale"
                    >
                      <Edit2Icon size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(location.id_lokasi)}
                      className="bg-gradient-to-r from-red-600 to-rose-600 text-white text-sm py-1.5 px-3 rounded-lg flex items-center gap-1 hover:shadow-lg transition-all hover-scale"
                    >
                      <Trash2Icon size={16} />
                      Hapus
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" className={isDarkMode ? "px-6 py-8 text-center text-gray-500" : "px-6 py-8 text-center text-gray-500"}>
                    <div className="flex flex-col items-center gap-2">
                      <MapIcon size={32} className="opacity-50" />
                      <p>Tidak ada data lokasi yang sesuai dengan pencarian.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={isDarkMode 
          ? "bg-gradient-to-br from-gray-800/50 to-gray-700/30 p-8 rounded-xl border border-gray-700/50 flex flex-col items-center gap-3" 
          : "bg-gradient-to-br from-blue-50/50 to-indigo-50/30 p-8 rounded-xl border border-blue-100/50 flex flex-col items-center gap-3"}>
          <MapIcon size={32} className={isDarkMode ? "text-gray-500" : "text-gray-400"} />
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            Belum ada data lokasi. Klik <span className="font-semibold">"Tambah Lokasi"</span> untuk mulai.
          </p>
        </div>
      )}
      </div>
    </section>
  );
}
