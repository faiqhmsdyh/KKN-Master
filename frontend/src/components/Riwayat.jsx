import React, { useState, useEffect, useContext } from 'react';
import { ClockIcon, DownloadIcon, Trash2Icon, LoaderIcon, SearchIcon, CalendarIcon, UserPlus, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ClipboardList, Users, X, Edit2, Save, Check, ArrowLeft } from 'lucide-react';
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

export default function Riwayat({ riwayatViewMode, setRiwayatViewMode, selectedHasilId, setSelectedHasilId }) {
  const { isDarkMode } = useContext(ThemeContext);
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [detailModal, setDetailModal] = useState(null); // modal data
  const [expandedDetail, setExpandedDetail] = useState([]); // untuk tampilan summary
  const [expandedFullData, setExpandedFullData] = useState([]); // untuk export Excel
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState(() => {
    // Load from localStorage or default to 'newest'
    return localStorage.getItem('riwayat_sortOrder') || 'newest';
  });
  
  // Pagination & Selection states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    // Load from localStorage or default to 25
    const saved = localStorage.getItem('riwayat_itemsPerPage');
    return saved ? parseInt(saved, 10) : 25;
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedAngkatan, setSelectedAngkatan] = useState(''); // Untuk menyimpan angkatan KKN yang dipilih
  
  // DPL Edit states - batch mode
  const [dplChanges, setDplChanges] = useState({}); // { nomor_kelompok: id_dosen }
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [dosenList, setDosenList] = useState([]); // List master dosen
  const [loadingDosen, setLoadingDosen] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);
  
  // Fetch detail when entering add-dpl mode
  useEffect(() => {
    if (riwayatViewMode === 'add-dpl' && selectedHasilId) {
      fetchDetailById(selectedHasilId);
      fetchDosen();
    }
  }, [riwayatViewMode, selectedHasilId]);
  
  // Save itemsPerPage to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('riwayat_itemsPerPage', itemsPerPage.toString());
  }, [itemsPerPage]);
  
  // Save sortOrder to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('riwayat_sortOrder', sortOrder);
  }, [sortOrder]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:4000/autogroup/hasil');
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
  
  const fetchDosen = async () => {
    setLoadingDosen(true);
    try {
      const response = await fetch('http://localhost:4000/api/dosen?is_active=true');
      if (response.ok) {
        const data = await response.json();
        setDosenList(data);
      }
    } catch (err) {
      console.error('Error fetching dosen:', err);
    } finally {
      setLoadingDosen(false);
    }
  };

  const fetchDetailById = async (id) => {
    setLoadingDetail(true);
    try {
      console.log('📥 Fetching detail for id:', id);
      const response = await fetch(`http://localhost:4000/autogroup/hasil/${id}/detail`);
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        console.error('❌ Response not OK:', response.status, response.statusText);
        alert('Gagal memuat data detail. Status: ' + response.status);
        setExpandedDetail([]);
        setExpandedFullData([]);
        return;
      }
      
      const data = await response.json();
      console.log('📊 Data received:', data);
      
      if (!data || !data.groups || data.groups.length === 0) {
        console.error('❌ No groups in response data');
        alert('Tidak ada data detail untuk hasil ini. Kemungkinan data belum tersimpan dengan benar saat autogroup dijalankan.');
        setExpandedDetail([]);
        setExpandedFullData([]);
        return;
      }
      
      // Convert to flat array for export Excel (data lengkap)
      const flatRows = [];
      data.groups.forEach(group => {
        if (!group.anggota || group.anggota.length === 0) {
          console.warn('⚠️ Group', group.nomor_kelompok, 'has no anggota');
          return;
        }
        
        group.anggota.forEach(mhs => {
          flatRows.push({
            kelompok: group.nomor_kelompok,
            lokasi: group.lokasi || 'Belum Ditentukan',
            desa: group.desa || '-',
            kecamatan: group.kecamatan || '-',
            kabupaten: group.kabupaten || '-',
            nim: mhs.nim,
            nama: mhs.nama,
            prodi: mhs.prodi,
            fakultas: mhs.fakultas,
            jenis_kelamin: mhs.jenis_kelamin,
            kesehatan: mhs.kesehatan || 'Sehat'
          });
        });
      });
      
      // Create summary per kelompok for display
      const summary = data.groups.map(group => ({
        nomor_kelompok: group.nomor_kelompok,
        jumlah_anggota: group.anggota ? group.anggota.length : 0,
        lokasi: group.lokasi || 'Belum Ditentukan',
        desa: group.desa || '-',
        kecamatan: group.kecamatan || '-',
        kabupaten: group.kabupaten || '-',
        id_lokasi: group.id_lokasi,
        id_dosen: group.id_dosen || null, // FK to master_dosen
        nama_dpl: group.nama_dpl || '' // Display nama from JOIN
      }));
      
      console.log('✅ Summary created:', summary.length, 'groups,', flatRows.length, 'total students');
      setExpandedDetail(summary); // untuk tampilan
      setExpandedFullData(flatRows); // untuk export
    } catch (err) {
      console.error('❌ Error fetching detail:', err);
      alert('Error: ' + err.message);
      setExpandedDetail([]);
      setExpandedFullData([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleExpand = (item) => {
    setDetailModal(item);
    setExpandedDetail([]);
    setExpandedFullData([]);
    setDplChanges({}); // Reset changes
    fetchDetailById(item.id_hasil);
    fetchDosen(); // Load dosen list for DPL dropdown
  };
  
  const handleChangeDPL = (nomor_kelompok, id_dosen) => {
    setDplChanges(prev => ({
      ...prev,
      [nomor_kelompok]: id_dosen
    }));
  };
  
  const handleCancelDPL = (nomor_kelompok) => {
    setDplChanges(prev => {
      const newChanges = { ...prev };
      delete newChanges[nomor_kelompok];
      return newChanges;
    });
  };
  
  const handleCancelAllChanges = () => {
    setDplChanges({});
  };
  
  const handleSaveAllDPL = async () => {
    const idHasil = detailModal ? detailModal.id_hasil : selectedHasilId;
    if (!idHasil) return;
    
    const changesCount = Object.keys(dplChanges).length;
    if (changesCount === 0) {
      alert('Tidak ada perubahan untuk disimpan');
      return;
    }
    
    setIsSavingAll(true);
    try {
      // Save all changes in parallel
      const savePromises = Object.entries(dplChanges).map(([nomor_kelompok, id_dosen]) =>
        fetch(
          `http://localhost:4000/autogroup/hasil/${idHasil}/group/${nomor_kelompok}/dpl`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_dosen: id_dosen || null })
          }
        )
      );
      
      const responses = await Promise.all(savePromises);
      const allSuccess = responses.every(r => r.ok);
      
      if (allSuccess) {
        // Update local detail
        setExpandedDetail(prev => prev.map(row => {
          if (dplChanges[row.nomor_kelompok] !== undefined) {
            const newIdDosen = dplChanges[row.nomor_kelompok];
            const newNamaDpl = dosenList.find(d => d.id_dosen === newIdDosen)?.nama || null;
            return { ...row, id_dosen: newIdDosen, nama_dpl: newNamaDpl };
          }
          return row;
        }));
        setDplChanges({});
        alert(`✅ Berhasil menyimpan ${changesCount} perubahan DPL`);
      } else {
        alert('❌ Beberapa perubahan gagal disimpan. Silakan coba lagi.');
      }
    } catch (err) {
      alert('❌ Error: ' + err.message);
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus hasil ini?')) return;

    try {
      const response = await fetch(`http://localhost:4000/autogroup/hasil/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        alert('Hasil berhasil dihapus');
        setSelectedIds([]); // Reset selection after delete
        fetchHistory();
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };
  
  const handleAddDPL = async (id_hasil, angkatan_kkn) => {
    setSelectedHasilId(id_hasil);
    setSelectedAngkatan(angkatan_kkn || '');
    setRiwayatViewMode('add-dpl');
  };
  
  // Selection & Bulk Delete Functions
  const handleSelectAll = (data) => {
    if (selectedIds.length === data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map(item => item.id_hasil));
    }
  };
  
  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };
  
  const handleBulkDelete = async () => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} hasil yang dipilih?`)) {
      return;
    }
    
    setIsLoading(true);
    try {
      const deletePromises = selectedIds.map(id =>
        fetch(`http://localhost:4000/autogroup/hasil/${id}`, { method: 'DELETE' })
      );
      await Promise.all(deletePromises);
      alert(`Berhasil menghapus ${selectedIds.length} hasil`);
      setSelectedIds([]);
      fetchHistory();
    } catch (error) {
      alert('Gagal menghapus hasil: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (id) => {
    try {
      // Panggil endpoint export Excel terstruktur
      const response = await fetch(`http://localhost:4000/autogroup/hasil/${id}/export-excel`);
      
      if (!response.ok) {
        throw new Error('Gagal export ke Excel');
      }
      
      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `Hasil_Penempatan_KKN_${id}.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ Export Excel berhasil:', filename);
    } catch (err) {
      alert('Error export Excel: ' + err.message);
      console.error('Export error:', err);
    }
  };

  // Sort and filter data
  const sortData = (data) => {
    return sortOrder === 'newest'
      ? data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      : data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  };

  const filteredData = searchQuery
    ? sortData(
        historyData.filter(item => {
          const searchMatch = 
            (item.angkatan_kkn && item.angkatan_kkn.toString().toLowerCase().includes(searchQuery.toLowerCase())) ||
            (item.nama_aturan && item.nama_aturan.toLowerCase().includes(searchQuery.toLowerCase()));
          return searchMatch;
        })
      )
    : sortData([...historyData]);
  
  // Pagination Functions
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  };
  
  const getTotalPages = () => Math.ceil(filteredData.length / itemsPerPage);
  
  // Reset to page 1 when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortOrder]);

  return (
    <section className="space-y-6">
      {/* Show form when in add-dpl mode */}
      {riwayatViewMode === 'add-dpl' ? (
        <div className={isDarkMode ? "glass-card bg-gray-800/60 border-gray-700 animate-slideInUp p-6" : "glass-card bg-white/60 border-blue-50/50 animate-slideInUp p-6"}>
          {/* Back Button & Actions */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => {
                setRiwayatViewMode('list');
                setSelectedHasilId(null);
                setSelectedAngkatan('');
                setExpandedDetail([]);
                setDplChanges({});
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600' 
                  : 'bg-white/90 hover:bg-gray-50 text-gray-700 border border-gray-300'
              }`}
            >
              <ArrowLeft size={16} />
              Kembali
            </button>

            {/* Export Button */}
            <button
              onClick={() => handleExport(selectedHasilId)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isDarkMode 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
              title="Export ke Excel"
            >
              <DownloadIcon size={16} />
              Export Excel
            </button>
          </div>

          {/* Save All Changes Bar */}
          {Object.keys(dplChanges).length > 0 && (
            <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'} flex items-center justify-between`}>
              <div className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                <strong>{Object.keys(dplChanges).length}</strong> perubahan DPL belum disimpan
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCancelAllChanges}
                  disabled={isSavingAll}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600' 
                      : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
                  } disabled:opacity-50`}
                >
                  Batal Semua
                </button>
                <button
                  onClick={handleSaveAllDPL}
                  disabled={isSavingAll}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                >
                  {isSavingAll ? (
                    <>
                      <LoaderIcon size={16} className="animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Simpan Semua Perubahan
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Tambah DPL Content */}
          {loadingDetail ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : expandedDetail.length > 0 ? (
              <div className={isDarkMode ? "bg-gray-800/50 rounded-lg p-4 border border-gray-700/50" : "bg-white rounded-lg p-4 border border-gray-200"}>
                <h4 className={isDarkMode ? "text-sm font-semibold text-gray-300 mb-3" : "text-sm font-semibold text-gray-700 mb-3"}>
                  Pengelompokan Hasil {selectedAngkatan ? `Angkatan ${selectedAngkatan}` : `ID: ${selectedHasilId}`} ({expandedDetail.length} kelompok)
                </h4>
                
                <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead className={isDarkMode ? "bg-gray-900/70 sticky top-0" : "bg-blue-50 sticky top-0"}>
                      <tr>
                        <th className={`px-3 py-2 text-left border ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'}`}>No</th>
                        <th className={`px-3 py-2 text-center border ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'}`}>Kelompok</th>
                        <th className={`px-3 py-2 text-center border ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'}`}>Jumlah Anggota</th>
                        <th className={`px-3 py-2 text-left border ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'}`}>Lokasi</th>
                        <th className={`px-3 py-2 text-left border ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'}`}>Desa</th>
                        <th className={`px-3 py-2 text-left border ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'}`}>Kecamatan</th>
                        <th className={`px-3 py-2 text-left border ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'}`}>Kabupaten</th>
                        <th className={`px-3 py-2 text-left border ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'}`}>DPL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expandedDetail.map((row, idx) => (
                        <tr key={idx} className={isDarkMode ? "hover:bg-gray-700/30" : "hover:bg-blue-50/50"}>
                          <td className={`px-3 py-2 border ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-700'}`}>{idx + 1}</td>
                          <td className={`px-3 py-2 border text-center ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${isDarkMode ? 'bg-blue-800/20 text-blue-800' : 'bg-blue-100 text-blue-800'}`}>
                              {row.nomor_kelompok}
                            </span>
                          </td>
                          <td className={`px-3 py-2 border text-center ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${isDarkMode ? 'bg-emerald-800/20 text-emerald-800' : 'bg-emerald-100 text-emerald-800'}`}>
                              <Users size={12} />
                              {row.jumlah_anggota}
                            </span>
                          </td>
                          <td className={`px-3 py-2 border ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'}`}>
                            {row.lokasi}
                          </td>
                          <td className={`px-3 py-2 border ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-600'}`}>
                            {row.desa}
                          </td>
                          <td className={`px-3 py-2 border ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-600'}`}>
                            {row.kecamatan}
                          </td>
                          <td className={`px-3 py-2 border ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-600'}`}>
                            {row.kabupaten}
                          </td>
                          <td className={`px-3 py-2 border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                            {loadingDosen ? (
                              <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-500">
                                <LoaderIcon size={12} className="animate-spin" />
                                Loading...
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <select
                                  value={dplChanges[row.nomor_kelompok] !== undefined ? dplChanges[row.nomor_kelompok] : row.id_dosen || ''}
                                  onChange={(e) => handleChangeDPL(row.nomor_kelompok, e.target.value)}
                                  className={`flex-1 px-2 py-1.5 text-xs border rounded ${
                                    dplChanges[row.nomor_kelompok] !== undefined
                                      ? 'border-blue-500 ring-1 ring-blue-500'
                                      : ''
                                  } ${
                                    isDarkMode 
                                      ? 'bg-gray-700 border-gray-600 text-white' 
                                      : 'bg-white border-gray-300 text-gray-800'
                                  } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                                >
                                  <option value="">-- Pilih DPL --</option>
                                  {dosenList.map(dosen => (
                                    <option key={dosen.id_dosen} value={dosen.id_dosen}>
                                      {dosen.nama}
                                    </option>
                                  ))}
                                </select>
                                {dplChanges[row.nomor_kelompok] !== undefined && (
                                  <button
                                    onClick={() => handleCancelDPL(row.nomor_kelompok)}
                                    className={`p-1 rounded transition ${
                                      isDarkMode 
                                        ? 'text-red-400 hover:bg-red-900/30' 
                                        : 'text-red-600 hover:bg-red-100'
                                    }`}
                                    title="Batalkan perubahan"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>📭 Tidak ada data detail untuk ditampilkan</div>
                <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Data kelompok kosong atau terjadi error saat memuat data.</div>
              </div>
            )}
        </div>
      ) : (
        /* List view */
        <>
      {/* Main Table Container */}
      <div className={isDarkMode ? "glass-card bg-gray-800/60 border-gray-700 overflow-hidden" : "glass-card bg-white/90 border-blue-100/80 overflow-hidden"}>
        {/* Search Bar & Sort */}
        <div className={isDarkMode ? "p-4 border-b border-gray-700" : "p-4 border-b border-gray-200"}>
          <div className="flex gap-3 items-center justify-between flex-wrap">
            <div className="flex gap-3 items-center flex-1">
              <div className="relative flex-1 min-w-[280px] max-w-[400px]">
                <SearchIcon size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
                <input 
                  type="text" 
                  placeholder="CARI ANGKATAN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={isDarkMode
                    ? "pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-600 text-white rounded-lg text-sm placeholder-gray-500 w-full focus:outline-none focus:border-blue-500 transition-colors"
                    : "pl-10 pr-4 py-2.5 bg-white border border-gray-300 text-gray-800 rounded-lg text-sm placeholder-gray-400 w-full focus:outline-none focus:border-blue-500 transition-colors"}
                />
              </div>
              
              {/* Bulk Delete Button */}
              {selectedIds.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  <Trash2Icon size={16} />
                  HAPUS {selectedIds.length} DIPILIH
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <ArrowUpDown size={16} className={isDarkMode ? "text-gray-500" : "text-gray-400"} />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className={isDarkMode
                  ? "px-4 py-2.5 bg-gray-800/50 border border-gray-600 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                  : "px-4 py-2.5 bg-white border border-gray-300 text-gray-800 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"}
              >
                <option value="newest">Baru</option>
                <option value="oldest">Lama</option>
              </select>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <LoaderIcon size={32} className={isDarkMode ? "text-blue-400 animate-spin" : "text-blue-600 animate-spin"} />
            <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Memuat hasil...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-12">
            <ClockIcon size={48} className={isDarkMode ? "text-gray-600 mx-auto mb-3" : "text-gray-400 mx-auto mb-3"} />
            <p className={isDarkMode ? "text-gray-400 text-sm" : "text-gray-600 text-sm"}>
              {searchQuery ? 'Tidak ada data yang cocok dengan pencarian.' : 'Belum ada hasil penempatan. Buat grouping baru di halaman Autogroup.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDarkMode ? "bg-gray-800/80 border-b border-gray-700" : "bg-gray-50 border-b border-gray-200"}>
                <tr>
                  <th className={`px-4 py-3 text-center text-xs font-bold tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-600"} w-12`}>
                    <input
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === getPaginatedData().length}
                      onChange={() => handleSelectAll(getPaginatedData())}
                      className="w-4 h-4 text-blue-600 rounded border-gray-400 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-bold tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    NO.
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-bold tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    TANGGAL / WAKTU
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-bold tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    ANGKATAN
                  </th>
                  <th className={`px-4 py-3 text-center text-xs font-bold tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    PESERTA
                  </th>
                  <th className={`px-4 py-3 text-center text-xs font-bold tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    KELOMPOK
                  </th>
                  <th className={`px-4 py-3 text-center text-xs font-bold tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    STATUS
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-bold tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    AKSI
                  </th>
                </tr>
              </thead>
              <tbody className={isDarkMode ? "divide-y divide-gray-700" : "divide-y divide-gray-200"}>
                {getPaginatedData().map((item, index) => {
                  const date = new Date(item.created_at);
                  const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                  const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <tr key={item.id_hasil} className={isDarkMode ? "hover:bg-gray-700/30 transition-colors" : "hover:bg-blue-50/50 transition-colors"}>
                      <td className="px-4 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id_hasil)}
                          onChange={() => handleSelectOne(item.id_hasil)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-400 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className={`px-4 py-1.5 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="px-4 py-1.5">
                        <div className="flex items-center gap-2">
                          <CalendarIcon size={16} className={isDarkMode ? "text-blue-400" : "text-blue-600"} />
                          <div>
                            <div className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                              {dateStr}
                            </div>
                            <div className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                              {timeStr}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-1.5">
                        <span className="text-sm font-semibold text-blue-800 hover:text-blue-900 cursor-pointer">
                          {item.angkatan_kkn || '-'}
                        </span>
                      </td>
                      <td className={`px-4 py-1.5 text-center text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                        {item.jumlah_mahasiswa?.toLocaleString('id-ID') || '0'}
                      </td>
                      <td className={`px-4 py-1.5 text-center text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                        {item.jumlah_kelompok || '0'}
                      </td>
                      <td className="px-4 py-1.5 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold tracking-wide ${
                          item.status === 'GAGAL'
                            ? 'text-red-700 bg-red-100 border border-red-200'
                            : 'text-emerald-800 bg-emerald-100 border border-emerald-200'
                        }`}>
                          {item.status || 'Sukses'}
                        </span>
                      </td>
                      <td className="px-4 py-1.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleExport(item.id_hasil)}
                            className={`p-1.5 rounded-md transition-all ${
                              isDarkMode
                                ? 'text-gray-500 hover:bg-emerald-800/20 hover:text-emerald-800'
                                : 'text-gray-400 hover:bg-emerald-100 hover:text-emerald-800'
                            }`}
                            title="Unduh Excel"
                          >
                            <DownloadIcon size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id_hasil)}
                            className={`p-1.5 rounded-md transition-all ${
                              isDarkMode
                                ? 'text-gray-500 hover:bg-red-600/20 hover:text-red-400'
                                : 'text-gray-400 hover:bg-red-100 hover:text-red-600'
                            }`}
                          >
                            <Trash2Icon size={16} />
                          </button>
                          <button
                            onClick={() => handleAddDPL(item.id_hasil, item.angkatan_kkn)}
                            className={`p-1.5 rounded-md transition-all ${
                              isDarkMode
                                ? 'text-gray-500 hover:bg-blue-800/20 hover:text-blue-800'
                                : 'text-gray-400 hover:bg-blue-100 hover:text-blue-800'
                            }`}
                            title="Tambah DPL"
                          >
                            <UserPlus size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Pagination Controls */}
      {filteredData.length > 0 && (
        <div className={`flex flex-wrap gap-4 justify-between items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {/* Items per page selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium">TAMPILKAN:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={isDarkMode 
                ? "px-3 py-2 bg-gray-900/50 border border-gray-700 text-white rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" 
                : "px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"}
            >
              <option value="10">10 BARIS</option>
              <option value="25">25 BARIS</option>
              <option value="50">50 BARIS</option>
              <option value="100">100 BARIS</option>
            </select>
            <span className="text-xs text-gray-500">
              Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, filteredData.length)} - {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} hasil
            </span>
          </div>
          
          {/* Page navigation */}
          <div className="flex items-center gap-2">
            {/* First page */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition-all ${
                currentPage === 1
                  ? isDarkMode ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : isDarkMode ? 'bg-gray-900/50 text-gray-300 hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
              title="Halaman pertama"
            >
              <ChevronsLeft size={16} />
            </button>
            
            {/* Previous page */}
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition-all ${
                currentPage === 1
                  ? isDarkMode ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : isDarkMode ? 'bg-gray-900/50 text-gray-300 hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
              title="Halaman sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>
            
            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: getTotalPages() }, (_, i) => i + 1)
                .filter(page => {
                  // Show first, last, current, and pages around current
                  if (page === 1 || page === getTotalPages() || 
                      (page >= currentPage - 1 && page <= currentPage + 1)) {
                    return true;
                  }
                  return false;
                })
                .map((page, idx, arr) => (
                  <React.Fragment key={page}>
                    {/* Show ellipsis if there's a gap */}
                    {idx > 0 && page - arr[idx - 1] > 1 && (
                      <span className="px-2 text-gray-500">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : isDarkMode 
                            ? 'bg-gray-900/50 text-gray-300 hover:bg-gray-700 border border-gray-700' 
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}
            </div>
            
            {/* Next page */}
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === getTotalPages()}
              className={`p-2 rounded-lg transition-all ${
                currentPage === getTotalPages()
                  ? isDarkMode ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : isDarkMode ? 'bg-gray-900/50 text-gray-300 hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
              title="Halaman berikutnya"
            >
              <ChevronRight size={16} />
            </button>
            
            {/* Last page */}
            <button
              onClick={() => setCurrentPage(getTotalPages())}
              disabled={currentPage === getTotalPages()}
              className={`p-2 rounded-lg transition-all ${
                currentPage === getTotalPages()
                  ? isDarkMode ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : isDarkMode ? 'bg-gray-900/50 text-gray-300 hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
              title="Halaman terakhir"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 py-8 overflow-y-auto">
          <div className={`w-full max-w-5xl max-h-[calc(100vh-64px)] flex flex-col rounded-xl shadow-2xl ${
            isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white'
          }`}>

            {/* Modal Header */}
            <div className={`flex items-center justify-between px-5 py-3 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-100">
                  <ClipboardList size={18} className="text-blue-600" />
                </div>
                <div>
                  <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {detailModal.angkatan_kkn || `Penempatan #${detailModal.id_hasil}`}
                  </h3>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {detailModal.jumlah_kelompok} Kelompok &bull; {detailModal.jumlah_mahasiswa} Mahasiswa
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleExport(detailModal.id_hasil)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all shadow-md hover:shadow-lg"
                >
                  <DownloadIcon size={14} />
                  EXPORT EXCEL
                </button>
                <button
                  onClick={() => setDetailModal(null)}
                  className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-hidden flex flex-col px-5 py-4">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : expandedDetail.length > 0 ? (
                <div className={isDarkMode ? "bg-gray-800/50 rounded-lg p-4 border border-gray-700/50" : "bg-white rounded-lg p-4 border border-gray-200"}>
                  <h4 className={isDarkMode ? "text-sm font-semibold text-gray-300 mb-3" : "text-sm font-semibold text-gray-700 mb-3"}>
                    Ringkasan Hasil Pengelompokan ({expandedDetail.length} kelompok)
                  </h4>
                  
                  <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead className={isDarkMode ? "bg-gray-900/70 sticky top-0" : "bg-blue-50 sticky top-0"}>
                        <tr>
                          <th className={`px-3 py-2 text-left border ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'}`}>No</th>
                          <th className={`px-3 py-2 text-center border ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'}`}>Kelompok</th>
                          <th className={`px-3 py-2 text-center border ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'}`}>Jumlah Anggota</th>
                          <th className={`px-3 py-2 text-left border ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'}`}>Lokasi</th>
                          <th className={`px-3 py-2 text-left border ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'}`}>Desa</th>
                          <th className={`px-3 py-2 text-left border ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'}`}>Kecamatan</th>
                          <th className={`px-3 py-2 text-left border ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'}`}>Kabupaten</th>
                          <th className={`px-3 py-2 text-left border ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'}`}>DPL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expandedDetail.map((row, idx) => (
                          <tr key={idx} className={isDarkMode ? "hover:bg-gray-700/30" : "hover:bg-blue-50/50"}>
                            <td className={`px-3 py-2 border ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-700'}`}>{idx + 1}</td>
                            <td className={`px-3 py-2 border text-center ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${isDarkMode ? 'bg-blue-800/20 text-blue-800' : 'bg-blue-100 text-blue-800'}`}>
                                {row.nomor_kelompok}
                              </span>
                            </td>
                            <td className={`px-3 py-2 border text-center ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${isDarkMode ? 'bg-emerald-800/20 text-emerald-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                <Users size={12} />
                                {row.jumlah_anggota}
                              </span>
                            </td>
                            <td className={`px-3 py-2 border ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'}`}>
                              {row.lokasi}
                            </td>
                            <td className={`px-3 py-2 border ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-600'}`}>
                              {row.desa}
                            </td>
                            <td className={`px-3 py-2 border ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-600'}`}>
                              {row.kecamatan}
                            </td>
                            <td className={`px-3 py-2 border ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-600'}`}>
                              {row.kabupaten}
                            </td>
                            <td className={`px-3 py-2 border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                              {loadingDosen ? (
                                <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-500">
                                  <LoaderIcon size={12} className="animate-spin" />
                                  Loading...
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <select
                                    value={dplChanges[row.nomor_kelompok] !== undefined ? dplChanges[row.nomor_kelompok] : row.id_dosen || ''}
                                    onChange={(e) => handleChangeDPL(row.nomor_kelompok, e.target.value)}
                                    className={`flex-1 px-2 py-1.5 text-xs border rounded ${
                                      dplChanges[row.nomor_kelompok] !== undefined
                                        ? 'border-blue-500 ring-1 ring-blue-500'
                                        : ''
                                    } ${
                                      isDarkMode 
                                        ? 'bg-gray-700 border-gray-600 text-white' 
                                        : 'bg-white border-gray-300 text-gray-800'
                                    } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                                  >
                                    <option value="">-- Pilih DPL --</option>
                                    {dosenList.map(dosen => (
                                      <option key={dosen.id_dosen} value={dosen.id_dosen}>
                                        {dosen.nama}
                                      </option>
                                    ))}
                                  </select>
                                  {dplChanges[row.nomor_kelompok] !== undefined && (
                                    <button
                                      onClick={() => handleCancelDPL(row.nomor_kelompok)}
                                      className={`p-1 rounded transition ${
                                        isDarkMode 
                                          ? 'text-red-400 hover:bg-red-900/30' 
                                          : 'text-red-600 hover:bg-red-100'
                                      }`}
                                      title="Batalkan perubahan"
                                    >
                                      <X size={14} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-2">📭 Tidak ada data detail untuk ditampilkan</div>
                  <div className="text-xs text-gray-500">Data kelompok kosong atau terjadi error saat memuat data. Cek console browser untuk detail.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </section>
  );
}
