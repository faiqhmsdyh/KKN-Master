import React, { useState, useEffect, useContext } from 'react';
import { PlusIcon, EditIcon, TrashIcon, SaveIcon, XIcon, CheckCircleIcon, AlertCircleIcon, LoaderIcon, SlidersHorizontalIcon, ChevronsDownUp, GitCommitHorizontal, ToggleRight, UsersIcon, InfoIcon, ChevronDownIcon, ChevronUpIcon, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { ThemeContext } from '../App';
import '../styles/Kriteria.css';

const KriteriaCard = ({ kriteria, onEdit, onDelete, isDarkMode, isSelected, onSelect }) => {
  const typeMap = {
    minimal: { label: 'Nilai Minimal', icon: <ChevronsDownUp size={14} />, color: 'bg-sky-500/20 text-sky-300' },
    range: { label: 'Jangkauan', icon: <GitCommitHorizontal size={14} />, color: 'bg-amber-500/20 text-amber-300' },
    boolean: { label: 'Boolean', icon: <ToggleRight size={14} />, color: 'bg-emerald-500/20 text-emerald-300' },
    gender: { label: 'Aturan Gender', icon: <UsersIcon size={14} />, color: 'bg-pink-500/20 text-pink-300' },
  };

  const { label, icon, color } = typeMap[kriteria.tipe_data] || { label: 'Lainnya', icon: null, color: 'bg-gray-500/20 text-gray-300' };

  return (
    <div className={`${isDarkMode ? "glass-card bg-gray-800/60 border-gray-700/80 flex flex-col justify-between relative" : "glass-card bg-white/60 border-blue-100/80 flex flex-col justify-between relative"} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      {/* Checkbox */}
      <div className="absolute top-3 left-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(kriteria.id_kriteria)}
          className="w-4 h-4 text-blue-600 rounded border-gray-400 focus:ring-2 focus:ring-blue-500 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      
      <div className="pl-8">
        <div className="flex justify-between items-start">
          <h4 className={isDarkMode ? "font-bold text-lg text-white mb-1" : "font-bold text-lg text-gray-800 mb-1"}>{kriteria.nama_kriteria}</h4>
          <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${color}`}>
            {icon}
            <span>{label}</span>
          </div>
        </div>
        <p className={isDarkMode ? "text-sm text-gray-400 mb-4" : "text-sm text-gray-500 mb-4"}>
          {kriteria.deskripsi || 'Tidak ada deskripsi.'}
        </p>
      </div>
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700/30 pl-8">
        <span className={isDarkMode ? "text-xs text-gray-500" : "text-xs text-gray-400"}>
          ID: {kriteria.id_kriteria}
        </span>
        <div className="flex gap-1">
          <button onClick={() => onEdit(kriteria)} className="p-2 text-gray-400 hover:text-blue-400 transition-colors rounded-md hover:bg-gray-700/50">
            <EditIcon size={16} />
          </button>
          <button onClick={() => onDelete(kriteria.id_kriteria)} className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-md hover:bg-gray-700/50">
            <TrashIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Kriteria() {
  const { isDarkMode } = useContext(ThemeContext);
  const [criteriaList, setCriteriaList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Pagination & Selection states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    // Load from localStorage or default to 25
    const saved = localStorage.getItem('kriteria_itemsPerPage');
    return saved ? parseInt(saved, 10) : 25;
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formStatus, setFormStatus] = useState({ type: null, message: '' });
  const [showHelp, setShowHelp] = useState(false);
  const [formData, setFormData] = useState({
    nama_kriteria: '',
    deskripsi: '',
    tipe_data: 'minimal'
  });

  // Show status message with auto-dismiss
  const showStatusMessage = (type, message) => {
    setFormStatus({ type, message });
    setTimeout(() => setFormStatus({ type: null, message: '' }), 4000);
  };

  useEffect(() => {
    fetchCriteria();
  }, []);
  
  // Save itemsPerPage to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('kriteria_itemsPerPage', itemsPerPage.toString());
  }, [itemsPerPage]);

  const fetchCriteria = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:4000/kriteria');
      if (!response.ok) throw new Error('Failed to fetch criteria');
      const data = await response.json();
      setCriteriaList(data);
    } catch (err) {
      console.error('Fetch criteria error:', err);
      setFormStatus({ type: 'error', message: 'Gagal memuat kriteria: ' + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenForm = (kriteria = null) => {
    if (kriteria) {
      setEditingId(kriteria.id_kriteria);
      setFormData({
        nama_kriteria: kriteria.nama_kriteria,
        deskripsi: kriteria.deskripsi,
        tipe_data: kriteria.tipe_data
      });
    } else {
      setEditingId(null);
      setFormData({
        nama_kriteria: '',
        deskripsi: '',
        tipe_data: 'minimal'
      });
    }
    setShowForm(true);
    setFormStatus({ type: '', message: '' });
  };

  const handleSave = async () => {
    if (!formData.nama_kriteria || !formData.deskripsi) {
      showStatusMessage('error', 'Nama kriteria dan deskripsi tidak boleh kosong.');
      return;
    }
    setIsLoading(true);
    const url = editingId
      ? `http://localhost:4000/kriteria/${editingId}`
      : 'http://localhost:4000/kriteria';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Gagal menyimpan data');
      
      const result = await response.json();
      showStatusMessage('success', result.message);
      fetchCriteria();
      setShowForm(false);
    } catch (error) {
      showStatusMessage('error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus kriteria ini?')) {
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:4000/kriteria/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Gagal menghapus data');
        
        const result = await response.json();
        showStatusMessage('success', result.message);
        fetchCriteria();
      } catch (error) {
        showStatusMessage('error', error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // Selection & Bulk Delete Functions
  const handleSelectAll = (data) => {
    if (selectedIds.length === data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map(item => item.id_kriteria));
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
    if (!window.confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} kriteria yang dipilih?`)) {
      return;
    }
    
    setIsLoading(true);
    try {
      const deletePromises = selectedIds.map(id =>
        fetch(`http://localhost:4000/kriteria/${id}`, { method: 'DELETE' })
      );
      await Promise.all(deletePromises);
      showStatusMessage('success', `Berhasil menghapus ${selectedIds.length} kriteria`);
      setSelectedIds([]);
      fetchCriteria();
    } catch (error) {
      showStatusMessage('error', 'Gagal menghapus kriteria: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Pagination Functions
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return criteriaList.slice(startIndex, startIndex + itemsPerPage);
  };
  
  const getTotalPages = () => Math.ceil(criteriaList.length / itemsPerPage);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  return (
    <section className="space-y-8 animate-fadeIn">
      {/* Header - Actions Only */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between items-stretch sm:items-center">
        {/* Bulk Actions - Left Side */}
        {criteriaList.length > 0 && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.length > 0 && selectedIds.length === getPaginatedData().length}
              onChange={() => handleSelectAll(getPaginatedData())}
              className="w-4 h-4 text-blue-600 rounded border-gray-400 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
            <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              PILIH SEMUA
            </span>
          </label>
        )}
        
        {/* Bulk Delete Button - Right Side */}
        {selectedIds.length > 0 && (
          <button
            onClick={handleBulkDelete}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
          >
            <TrashIcon size={16} />
            HAPUS {selectedIds.length} DIPILIH
          </button>
        )}
      </div>

      {/* Status Message */}
      {formStatus.type && (
        <div className={`fixed top-20 right-6 z-50 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg animate-slideInUp ${
          formStatus.type === 'success' 
            ? isDarkMode ? 'bg-emerald-900/90 text-emerald-300 border border-emerald-700/50' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : isDarkMode ? 'bg-red-900/90 text-red-300 border border-red-700/50' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {formStatus.type === 'success' ? <CheckCircleIcon size={16} /> : <AlertCircleIcon size={16} />}
          <span className="text-sm font-medium">{formStatus.message}</span>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center animate-fadeIn p-4" onClick={() => setShowForm(false)}>
          <div 
            className={isDarkMode ? "glass-card bg-gray-800/90 border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-slideInUp relative" : "glass-card bg-white/95 border-blue-100 w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-slideInUp relative"}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 relative">
                <h3 className={isDarkMode ? "text-xl font-bold text-white" : "text-xl font-bold text-gray-800"}>
                  {editingId ? 'Edit Kriteria' : 'Tambah Kriteria Baru'}
                </h3>
                <button 
                  onClick={() => setShowHelp(!showHelp)}
                  className={`p-1.5 rounded-lg transition-all ${
                    showHelp 
                      ? isDarkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-500/20 text-blue-600'
                      : isDarkMode ? 'text-gray-500 hover:bg-gray-700/50 hover:text-blue-400' : 'text-gray-400 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                  title="Panduan Pengisian"
                >
                  <InfoIcon size={18} />
                </button>

                {/* Floating Help Guide Popup */}
                {showHelp && (
                  <div 
                    className={`absolute left-0 top-10 w-[600px] p-3 rounded-lg border shadow-2xl animate-slideInDown z-50 ${
                      isDarkMode 
                        ? 'bg-gray-800/95 border-blue-700/60 backdrop-blur-sm' 
                        : 'bg-white/98 border-blue-200 backdrop-blur-sm'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <InfoIcon size={14} className={isDarkMode ? 'text-blue-400 mt-0.5' : 'text-blue-600 mt-0.5'} />
                      <div className="flex-1">
                        <h4 className={`font-bold text-xs mb-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                          Panduan Tipe Data Kriteria
                        </h4>
                      </div>
                      <button 
                        onClick={() => setShowHelp(false)}
                        className={`p-0.5 rounded hover:bg-gray-700/50 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        <XIcon size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-900/50' : 'bg-blue-50/70'}`}>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <ChevronsDownUp size={12} className={isDarkMode ? 'text-sky-400' : 'text-sky-600'} />
                          <span className={`font-semibold ${isDarkMode ? 'text-sky-300' : 'text-sky-700'}`}>
                            Nilai Minimal (Angka)
                          </span>
                        </div>
                        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                          Untuk kriteria nilai minimum. Contoh: "Minimal 3 prodi berbeda dalam satu kelompok"
                        </p>
                      </div>

                      <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-900/50' : 'bg-amber-50/70'}`}>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <GitCommitHorizontal size={12} className={isDarkMode ? 'text-amber-400' : 'text-amber-600'} />
                          <span className={`font-semibold ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                            Range (Min/Max)
                          </span>
                        </div>
                        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                          Untuk batasan min-max. Contoh: "Jumlah anggota 8-12 orang"
                        </p>
                      </div>

                      <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-900/50' : 'bg-emerald-50/70'}`}>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <ToggleRight size={12} className={isDarkMode ? 'text-emerald-400' : 'text-emerald-600'} />
                          <span className={`font-semibold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                            Boolean (Ya/Tidak)
                          </span>
                        </div>
                        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                          Untuk aturan ya/tidak. Contoh: "Kelompok harus dari fakultas sama"
                        </p>
                      </div>

                      <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-900/50' : 'bg-pink-50/70'}`}>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <UsersIcon size={12} className={isDarkMode ? 'text-pink-400' : 'text-pink-600'} />
                          <span className={`font-semibold ${isDarkMode ? 'text-pink-300' : 'text-pink-700'}`}>
                            Aturan Gender
                          </span>
                        </div>
                        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                          Untuk distribusi gender. Contoh: "Campuran", "Khusus L/P"
                        </p>
                      </div>
                    </div>

                    <div className={`mt-2 p-1.5 rounded text-xs ${isDarkMode ? 'bg-yellow-900/20 text-yellow-400' : 'bg-yellow-50/80 text-yellow-800'}`}>
                      💡 <strong>Tips:</strong> Gunakan nama jelas & deskripsi detail agar mudah dipahami.
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 text-gray-400 hover:text-white">
                <XIcon size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={isDarkMode ? "block text-sm font-medium text-gray-300 mb-2" : "block text-sm font-medium text-gray-700 mb-2"}>
                  Nama Kriteria
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Distribusi Prodi"
                  value={formData.nama_kriteria}
                  onChange={(e) => setFormData({ ...formData, nama_kriteria: e.target.value })}
                  className={isDarkMode ? "input-modern w-full bg-gray-900/50 border-gray-600" : "input-modern w-full bg-white/80 border-blue-200"}
                />
              </div>
              <div>
                <label className={isDarkMode ? "block text-sm font-medium text-gray-300 mb-2" : "block text-sm font-medium text-gray-700 mb-2"}>
                  Deskripsi
                </label>
                <textarea
                  placeholder="Contoh: Minimal variasi prodi dalam satu grup"
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className={isDarkMode ? "input-modern w-full bg-gray-900/50 border-gray-600 h-24" : "input-modern w-full bg-white/80 border-blue-200 h-24"}
                />
              </div>
              <div>
                <label className={isDarkMode ? "block text-sm font-medium text-gray-300 mb-2" : "block text-sm font-medium text-gray-700 mb-2"}>
                  Tipe Data
                </label>
                <select
                  value={formData.tipe_data}
                  onChange={(e) => setFormData({ ...formData, tipe_data: e.target.value })}
                  className={isDarkMode ? "input-modern w-full bg-gray-900/50 border-gray-600" : "input-modern w-full bg-white/80 border-blue-200"}
                >
                  <option value="minimal">Nilai Minimal (Angka)</option>
                  <option value="range">Range (Min/Max)</option>
                  <option value="boolean">Boolean (Ya/Tidak)</option>
                  <option value="gender">Aturan Gender</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-6 mt-6 border-t border-gray-700/30">
              <button onClick={() => setShowForm(false)} className="btn-secondary text-sm px-4 py-2">
                Batal
              </button>
              <button onClick={handleSave} disabled={isLoading} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                {isLoading ? <LoaderIcon size={16} className="animate-spin" /> : <SaveIcon size={16} />}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kriteria Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className={isDarkMode ? "glass-card bg-gray-800/60 border-gray-700/80 h-52 animate-pulse" : "glass-card bg-white/60 border-blue-100/80 h-52 animate-pulse"}></div>
          ))
        ) : (
          getPaginatedData().map((kriteria) => (
            <KriteriaCard
              key={kriteria.id_kriteria}
              kriteria={kriteria}
              onEdit={handleOpenForm}
              onDelete={handleDelete}
              isDarkMode={isDarkMode}
              isSelected={selectedIds.includes(kriteria.id_kriteria)}
              onSelect={handleSelectOne}
            />
          ))
        )}
        <div 
          className={isDarkMode ? "flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-700 rounded-2xl text-gray-500 hover:bg-gray-800/50 hover:border-blue-600 hover:text-blue-400 transition-all cursor-pointer" : "flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 hover:bg-blue-50/50 hover:border-blue-400 hover:text-blue-600 transition-all cursor-pointer"}
          onClick={() => handleOpenForm()}
        >
          <div className="p-3 rounded-full bg-gray-500/10 mb-3">
            <PlusIcon size={24} />
          </div>
          <span className="font-semibold">Tambah Kriteria</span>
        </div>
      </div>
      
      {/* Pagination Controls */}
      {criteriaList.length > 0 && (
        <div className={`flex flex-wrap gap-4 justify-between items-center mt-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
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
              <option value="5">5 BARIS</option>
              <option value="10">10 BARIS</option>
              <option value="15">15 BARIS</option>
            </select>
            <span className="text-xs text-gray-500">
              Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, criteriaList.length)} - {Math.min(currentPage * itemsPerPage, criteriaList.length)} dari {criteriaList.length} kriteria
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
    </section>
  );
}
