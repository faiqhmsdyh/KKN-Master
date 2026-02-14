import React, { useState, useEffect, useContext } from 'react';
import { ClockIcon, DownloadIcon, Trash2Icon, LoaderIcon, ChevronDownIcon, SearchIcon, CalendarIcon } from 'lucide-react';
import { ThemeContext } from '../App';
import '../styles/Riwayat.css';

// Import XLSX library for Excel parsing
let XLSX;

// Load XLSX library dynamically
const loadXLSX = async () => {
  try {
    XLSX = await import('xlsx');
    return true;
  } catch (err) {
    console.warn('XLSX library not available, CSV fallback will be used');
    return false;
  }
};

// Initialize XLSX on component mount
loadXLSX();

export default function Riwayat() {
  const { isDarkMode } = useContext(ThemeContext);
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/grouping-history');
      if (response.ok) {
        const data = await response.json();
        setHistoryData(data);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus riwayat ini?')) return;

    try {
      const response = await fetch(`http://localhost:4000/api/grouping-history/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        alert('Riwayat berhasil dihapus');
        fetchHistory();
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleExport = async (id) => {
    try {
      const response = await fetch(`http://localhost:4000/api/grouping-history/${id}`);
      if (!response.ok) throw new Error('Gagal mengambil data');

      const data = await response.json();
      const groups = data.data_grouping;

      // Try XLSX export first
      if (XLSX && XLSX.utils && XLSX.writeFile) {
        try {
          const wb = XLSX.utils.book_new();

          // Summary sheet
          const summaryData = [
            ['HASIL PENGELOMPOKAN MAHASISWA KKN'],
            [],
            ['Nama Angkatan', data.nama_angkatan],
            ['Angkatan Ke-', data.angkatan_ke],
            ['Tanggal', new Date(data.created_at).toLocaleDateString('id-ID')],
            [],
            ['Jumlah Kelompok', data.jumlah_kelompok],
            ['Jumlah Mahasiswa', data.jumlah_mahasiswa],
          ];
          const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
          summaryWs['!cols'] = [{ wch: 25 }, { wch: 40 }];
          XLSX.utils.book_append_sheet(wb, summaryWs, 'Ringkasan');

          // Detail sheet
          const detailData = [
            ['DETAIL PENGELOMPOKAN']
          ];

          groups.forEach(group => {
            detailData.push([]);
            detailData.push([`KELOMPOK ${group.nomor_kelompok}`]);
            detailData.push(['NIM', 'Nama', 'Prodi', 'Fakultas', 'Jenis Kelamin']);
            
            group.anggota.forEach(member => {
              detailData.push([
                member.nim || member.NIM || '-',
                member.nama || member.Nama || '-',
                member.prodi || member.Prodi || '-',
                member.fakultas || member.Fakultas || '-',
                member.jenis_kelamin || member['Jenis Kelamin'] || '-'
              ]);
            });
          });

          const detailWs = XLSX.utils.aoa_to_sheet(detailData);
          detailWs['!cols'] = [
            { wch: 12 },
            { wch: 20 },
            { wch: 25 },
            { wch: 20 },
            { wch: 15 }
          ];
          XLSX.utils.book_append_sheet(wb, detailWs, 'Detail');

          XLSX.writeFile(wb, `riwayat-${data.nama_angkatan}-${new Date().toISOString().slice(0, 10)}.xlsx`);
          return;
        } catch (err) {
          console.warn('XLSX export failed, falling back to CSV:', err);
        }
      }

      // Fallback CSV
      let csvContent = "HASIL PENGELOMPOKAN MAHASISWA KKN\n\n";
      csvContent += "Nama Angkatan,Angkatan Ke,Jumlah Kelompok,Jumlah Mahasiswa,Tanggal\n";
      csvContent += `"${data.nama_angkatan}",${data.angkatan_ke},${data.jumlah_kelompok},${data.jumlah_mahasiswa},${new Date(data.created_at).toLocaleDateString('id-ID')}\n\n`;

      csvContent += "DETAIL PENGELOMPOKAN\n";
      csvContent += "Kelompok,NIM,Nama,Prodi,Fakultas,Jenis Kelamin\n";
      
      groups.forEach(group => {
        group.anggota.forEach(member => {
          csvContent += `"Kelompok ${group.nomor_kelompok}",`;
          csvContent += `"${member.nim || member.NIM || '-'}",`;
          csvContent += `"${member.nama || member.Nama || '-'}",`;
          csvContent += `"${member.prodi || member.Prodi || '-'}",`;
          csvContent += `"${member.fakultas || member.Fakultas || '-'}",`;
          csvContent += `"${member.jenis_kelamin || member['Jenis Kelamin'] || '-'}"\n`;
        });
      });

      // Download CSV
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
      element.setAttribute('download', `riwayat-${data.nama_angkatan}-${new Date().toISOString().slice(0, 10)}.csv`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const filteredData = (filterDate || searchQuery)
    ? historyData.filter(item => {
        const dateMatch = !filterDate || new Date(item.created_at).toISOString().slice(0, 10) === filterDate;
        const searchMatch = !searchQuery || 
          item.nama_angkatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.angkatan_ke.toString().includes(searchQuery);
        return dateMatch && searchMatch;
      })
    : historyData;

  return (
    <section className="space-y-6">
      {/* Header with Title and Filters */}
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-2">
          <h2>
            <span className={isDarkMode ? "text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400" : "gradient-text"}>Riwayat Penempatan</span>
          </h2>
          <p className={isDarkMode ? "text-xs text-gray-400" : "text-xs text-gray-600"}>
            Lihat dan kelola histori penempatan mahasiswa KKN
          </p>
        </div>

        {/* Filter & Search - Right Aligned Outside Container */}
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <div className="flex items-center gap-2">
            <SearchIcon size={18} className={isDarkMode ? "text-gray-500" : "text-gray-400"} />
            <input 
              type="text" 
              placeholder="Cari nama angkatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={isDarkMode
                ? "input-modern px-4 py-2.5 bg-gray-800/50 border-gray-600 text-white rounded-lg text-sm placeholder-gray-500 w-48"
                : "input-modern px-4 py-2.5 bg-white/50 border-blue-200 rounded-lg text-sm placeholder-gray-500 w-48"}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className={isDarkMode
                  ? "text-xs text-gray-500 hover:text-red-400 hover:bg-red-900/20 px-3 py-1 rounded-lg transition-colors"
                  : "text-xs text-gray-600 hover:text-red-600 hover:bg-red-100 px-3 py-1 rounded-lg transition-colors"}
              >
                ✕ Reset
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <CalendarIcon size={18} className={isDarkMode ? "text-gray-500" : "text-gray-400"} />
            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className={isDarkMode
                ? "input-modern px-4 py-2.5 bg-gray-800/50 border-gray-600 text-white rounded-lg text-sm"
                : "input-modern px-4 py-2.5 bg-white/50 border-blue-200 rounded-lg text-sm"}
            />
            {filterDate && (
              <button 
                onClick={() => setFilterDate('')}
                className={isDarkMode
                  ? "text-xs text-gray-500 hover:text-red-400 hover:bg-red-900/20 px-3 py-1 rounded-lg transition-colors"
                  : "text-xs text-gray-600 hover:text-red-600 hover:bg-red-100 px-3 py-1 rounded-lg transition-colors"}
              >
                ✕ Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className={isDarkMode ? "glass-card bg-gray-800/60 border-gray-700 animate-slideInUp space-y-6" : "glass-card bg-white/60 border-blue-50/50 animate-slideInUp space-y-6"}>
        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <LoaderIcon size={32} className={isDarkMode ? "text-blue-400 animate-spin" : "text-blue-600 animate-spin"} />
            <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Memuat riwayat...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className={isDarkMode 
            ? "bg-gradient-to-br from-gray-800/50 to-gray-700/30 p-8 rounded-xl text-center border border-gray-700/50" 
            : "bg-gradient-to-br from-blue-50/50 to-indigo-50/30 p-8 rounded-xl text-center border border-blue-100/50"}>
            <ClockIcon size={32} className={isDarkMode ? "text-gray-600 mx-auto mb-2" : "text-gray-400 mx-auto mb-2"} />
            <p className={isDarkMode ? "text-gray-400 text-sm" : "text-gray-600 text-sm"}>
              Belum ada riwayat penempatan. Buat grouping baru di halaman <strong>Autogroup</strong>.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
          {filteredData.map((item) => (
            <div key={item.id_grouping} className={isDarkMode
              ? "bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden hover:bg-gray-800/60 hover:shadow-lg transition-all"
              : "bg-white/50 border border-blue-100/50 rounded-xl overflow-hidden hover:bg-white/70 hover:shadow-lg transition-all"}>
              <button
                onClick={() => setExpandedId(expandedId === item.id_grouping ? null : item.id_grouping)}
                className={isDarkMode
                  ? "w-full p-5 flex justify-between items-center hover:bg-gray-700/30 transition-colors"
                  : "w-full p-5 flex justify-between items-center hover:bg-blue-50/50 transition-colors"}
              >
                <div className="text-left flex-1">
                  <h3 className={isDarkMode ? "font-bold text-lg text-white" : "font-bold text-lg text-gray-800"}>
                    📋 {item.nama_angkatan}
                  </h3>
                  <p className={isDarkMode ? "text-sm text-gray-400 mt-1" : "text-sm text-gray-600 mt-1"}>
                    Angkatan Ke-<span className="font-semibold">{item.angkatan_ke}</span> • {item.jumlah_kelompok} Kelompok • {item.jumlah_mahasiswa} Mahasiswa
                  </p>
                  <p className={isDarkMode ? "text-xs text-gray-500 mt-1 font-mono" : "text-xs text-gray-500 mt-1 font-mono"}>
                    📅 {new Date(item.created_at).toLocaleDateString('id-ID', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <ChevronDownIcon 
                  size={24} 
                  className={isDarkMode ? "text-gray-500 transition-transform flex-shrink-0 ml-4" : "text-gray-400 transition-transform flex-shrink-0 ml-4"}
                  style={{ transform: expandedId === item.id_grouping ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

              {expandedId === item.id_grouping && (
                <div className={isDarkMode
                  ? "border-t border-gray-700/50 bg-gray-900/30 p-5 space-y-4"
                  : "border-t border-blue-100/50 bg-blue-50/30 p-5 space-y-4"}>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-end flex-wrap">
                    <button 
                      onClick={() => handleExport(item.id_grouping)}
                      className="btn-success text-sm px-4 py-2 flex items-center gap-2"
                    >
                      <DownloadIcon size={16} className="rotate-180" />
                      Export Excel
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id_grouping)}
                      className="bg-gradient-to-r from-red-600 to-rose-600 text-white text-sm px-4 py-2 rounded-lg hover:shadow-lg transition-all flex items-center gap-2 hover-scale"
                    >
                      <Trash2Icon size={16} />
                      Hapus
                    </button>
                  </div>

                  {/* Detail Kelompok */}
                  <div className={isDarkMode ? "bg-gray-800/50 rounded-lg p-4 border border-gray-700/50" : "bg-white/30 rounded-lg p-4 border border-blue-100/30"}>
                    <h4 className={isDarkMode ? "font-semibold text-gray-300 mb-3" : "font-semibold text-gray-700 mb-3"}>
                      🎯 Detail Pengelompokan
                    </h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {item.detail_groups && item.detail_groups.map((group, idx) => (
                        <div key={idx} className={isDarkMode
                          ? "bg-gray-800 p-3 rounded border border-gray-700/50"
                          : "bg-white/60 p-3 rounded border border-blue-100/50"}>
                          <p className={isDarkMode ? "font-semibold text-blue-400 text-sm" : "font-semibold text-blue-700 text-sm"}>
                            👥 Kelompok {group.nomor_kelompok}
                          </p>
                          <p className={isDarkMode ? "text-xs text-gray-400 mt-2 leading-relaxed" : "text-xs text-gray-600 mt-2 leading-relaxed"}>
                            {group.anggota?.map(m => m.nama || m.Nama || '').join(', ') || 'N/A'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        )}
      </div>
    </section>
  );
}
