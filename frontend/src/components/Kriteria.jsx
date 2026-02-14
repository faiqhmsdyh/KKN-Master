import React, { useState, useEffect, useContext } from 'react';
import { PlusIcon, EditIcon, TrashIcon, SaveIcon, XIcon, CheckCircleIcon, AlertCircleIcon, LoaderIcon } from 'lucide-react';
import { ThemeContext } from '../App';
import '../styles/Kriteria.css';

export default function Kriteria() {
  const { isDarkMode } = useContext(ThemeContext);
  const [criteriaList, setCriteriaList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formStatus, setFormStatus] = useState({ type: '', message: '' });
  const [namaCriteria, setNamaCriteria] = useState('');
  const [kriteriaType, setKriteriaType] = useState('range'); // 'range' | 'min_val' | 'boolean'
  const [minJumlah, setMinJumlah] = useState(8);
  const [maxJumlah, setMaxJumlah] = useState(12);
  const [minProdi, setMinProdi] = useState(2);
  const [minFakultas, setMinFakultas] = useState(1);
  const [jenisKelamin, setJenisKelamin] = useState('semua');
  const [deskripsi, setDeskripsi] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchCriteria();
  }, []);

  const fetchCriteria = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/filter-criteria');
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

  const handleOpenForm = (criteria = null) => {
    if (criteria) {
      setEditingId(criteria.id_criteria);
      setNamaCriteria(criteria.nama_kriteria);
      // populate advanced fields from existing record
      setMinJumlah(criteria.min_jumlah_mahasiswa || 8);
      setMaxJumlah(criteria.max_jumlah_mahasiswa || 12);
      setMinProdi(criteria.min_prodi || 2);
      setMinFakultas(criteria.min_fakultas || 1);
      setJenisKelamin(criteria.jenis_kelamin || 'semua');
      setDeskripsi(criteria.deskripsi || '');
      setIsActive(criteria.is_active === 1 || criteria.is_active === true);
      // infer type from stored fields
      if (criteria.min_jumlah_mahasiswa || criteria.max_jumlah_mahasiswa) {
        setKriteriaType('range');
      } else if (criteria.min_prodi || criteria.min_fakultas) {
        setKriteriaType('min_val');
      } else {
        setKriteriaType('boolean');
      }
    } else {
      setEditingId(null);
      setNamaCriteria('');
      setKriteriaType('range');
      setMinJumlah(8);
      setMaxJumlah(12);
      setMinProdi(2);
      setMinFakultas(1);
      setJenisKelamin('semua');
      setDeskripsi('');
      setIsActive(true);
    }
    setShowForm(true);
    setFormStatus({ type: '', message: '' });
  };

  const handleSave = async () => {
    if (!namaCriteria.trim()) {
      setFormStatus({ type: 'error', message: 'Nama kriteria tidak boleh kosong' });
      return;
    }

    setIsLoading(true);
    try {
      const url = editingId
        ? `http://localhost:4000/api/filter-criteria/${editingId}`
        : 'http://localhost:4000/api/filter-criteria';

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_kriteria: namaCriteria,
          // map form fields into existing DB columns
          min_jumlah_mahasiswa: Number(minJumlah) || 8,
          max_jumlah_mahasiswa: Number(maxJumlah) || 12,
          min_prodi: Number(minProdi) || 2,
          min_fakultas: Number(minFakultas) || 1,
          jenis_kelamin: jenisKelamin || 'semua',
          deskripsi: deskripsi || null,
          is_active: isActive ? 1 : 0
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Gagal menyimpan kriteria');
      }

      setFormStatus({ 
        type: 'success', 
        message: editingId ? 'Kriteria berhasil diupdate' : 'Kriteria berhasil ditambahkan' 
      });
      
      setShowForm(false);
      await fetchCriteria();
    } catch (err) {
      console.error('Save criteria error:', err);
      setFormStatus({ type: 'error', message: 'Error: ' + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kriteria ini?')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:4000/api/filter-criteria/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Gagal menghapus kriteria');

      setFormStatus({ type: 'success', message: 'Kriteria berhasil dihapus' });
      await fetchCriteria();
    } catch (err) {
      console.error('Delete criteria error:', err);
      setFormStatus({ type: 'error', message: 'Error: ' + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className={isDarkMode ? "space-y-6 animate-slideInUp" : "space-y-6 animate-slideInUp"}>
      {/* Header */}
      <div className="space-y-2">
        <h2>
          <span className={isDarkMode ? "bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent" : "bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"}>Kelola Kriteria Pengelompokan</span>
        </h2>
        <p className={isDarkMode ? "text-xs text-gray-400" : "text-xs text-gray-600"}>
          Atur kriteria dan parameter untuk pengelompokan mahasiswa otomatis
        </p>
      </div>

      {/* Status Message */}
      {formStatus.type && (
        <div className={`flex items-center gap-3 p-4 rounded-xl animate-slideInUp ${
          formStatus.type === 'success' 
            ? isDarkMode 
              ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-700/50' 
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : isDarkMode
              ? 'bg-red-900/30 text-red-300 border border-red-700/50'
              : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {formStatus.type === 'success' ? (
            <CheckCircleIcon size={20} className="flex-shrink-0" />
          ) : (
            <AlertCircleIcon size={20} className="flex-shrink-0" />
          )}
          <span className="font-medium">{formStatus.message}</span>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className={isDarkMode 
          ? "glass-card bg-gray-800/60 border-gray-700 animate-slideInUp space-y-5" 
          : "glass-card bg-blue-50/60 border-blue-100/50 animate-slideInUp space-y-5"}>
          <div className="flex justify-between items-center">
            <h3 className={isDarkMode ? "text-lg font-bold text-white" : "text-lg font-bold text-gray-800"}>
              {editingId ? '✏️ Edit Kriteria' : '➕ Tambah Kriteria Baru'}
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className={isDarkMode
                ? "p-2 hover:bg-gray-700/50 rounded-lg transition-colors text-gray-400 hover:text-gray-300"
                : "p-2 hover:bg-gray-200/50 rounded-lg transition-colors text-gray-600 hover:text-gray-800"}
            >
              <XIcon size={20} />
            </button>
          </div>

          <div>
            <label className={isDarkMode ? "block text-sm font-medium text-gray-300 mb-2.5" : "block text-sm font-medium text-gray-700 mb-2.5"}>
              Nama Kriteria
            </label>
            <input
              type="text"
              placeholder="Contoh: Standar, Ketat, Santai"
              value={namaCriteria}
              onChange={(e) => setNamaCriteria(e.target.value)}
              className={isDarkMode
                ? "input-modern w-full bg-gray-800/50 border-gray-600 text-white placeholder-gray-500 rounded-xl"
                : "input-modern w-full bg-white/50 border-blue-200 placeholder-gray-500 rounded-xl"}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={isDarkMode ? "block text-sm font-medium text-gray-300 mb-2.5" : "block text-sm font-medium text-gray-700 mb-2.5"}>
                Tipe Kriteria
              </label>
              <select value={kriteriaType} onChange={(e) => setKriteriaType(e.target.value)} className={isDarkMode ? "input-modern w-full bg-gray-800/50 border-gray-600 text-white placeholder-gray-500 rounded-xl" : "input-modern w-full bg-white/50 border-blue-200 placeholder-gray-500 rounded-xl"}>
                <option value="range">Range (Jumlah anggota per kelompok)</option>
                <option value="min_val">Min Value (Distribusi Prodi / Fakultas)</option>
                <option value="boolean">Boolean / Spesial (Kondisi kesehatan, Gender)</option>
              </select>
            </div>

            <div className="flex items-end gap-3">
              <label className={isDarkMode ? "text-sm text-gray-300" : "text-sm text-gray-700"}>Status</label>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} id="isActive" />
                <label htmlFor="isActive" className={isDarkMode ? "text-sm text-gray-300" : "text-sm text-gray-700"}>{isActive ? 'Aktif' : 'Non-aktif'}</label>
              </div>
            </div>
          </div>

          {/* Conditional inputs based on selected type */}
          {kriteriaType === 'range' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={isDarkMode ? "block text-sm font-medium text-gray-300 mb-2.5" : "block text-sm font-medium text-gray-700 mb-2.5"}>Min Jumlah</label>
                <input type="number" value={minJumlah} onChange={(e) => setMinJumlah(e.target.value)} className={isDarkMode ? "input-modern w-full bg-gray-800/50 border-gray-600 text-white placeholder-gray-500 rounded-xl" : "input-modern w-full bg-white/50 border-blue-200 placeholder-gray-500 rounded-xl"} />
              </div>
              <div>
                <label className={isDarkMode ? "block text-sm font-medium text-gray-300 mb-2.5" : "block text-sm font-medium text-gray-700 mb-2.5"}>Max Jumlah</label>
                <input type="number" value={maxJumlah} onChange={(e) => setMaxJumlah(e.target.value)} className={isDarkMode ? "input-modern w-full bg-gray-800/50 border-gray-600 text-white placeholder-gray-500 rounded-xl" : "input-modern w-full bg-white/50 border-blue-200 placeholder-gray-500 rounded-xl"} />
              </div>
            </div>
          )}

          {kriteriaType === 'min_val' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={isDarkMode ? "block text-sm font-medium text-gray-300 mb-2.5" : "block text-sm font-medium text-gray-700 mb-2.5"}>Min Prodi (variasi minimal per kelompok)</label>
                <input type="number" value={minProdi} onChange={(e) => setMinProdi(e.target.value)} className={isDarkMode ? "input-modern w-full bg-gray-800/50 border-gray-600 text-white placeholder-gray-500 rounded-xl" : "input-modern w-full bg-white/50 border-blue-200 placeholder-gray-500 rounded-xl"} />
              </div>
              <div>
                <label className={isDarkMode ? "block text-sm font-medium text-gray-300 mb-2.5" : "block text-sm font-medium text-gray-700 mb-2.5"}>Min Fakultas</label>
                <input type="number" value={minFakultas} onChange={(e) => setMinFakultas(e.target.value)} className={isDarkMode ? "input-modern w-full bg-gray-800/50 border-gray-600 text-white placeholder-gray-500 rounded-xl" : "input-modern w-full bg-white/50 border-blue-200 placeholder-gray-500 rounded-xl"} />
              </div>
            </div>
          )}

          {kriteriaType === 'boolean' && (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className={isDarkMode ? "block text-sm font-medium text-gray-300 mb-2.5" : "block text-sm font-medium text-gray-700 mb-2.5"}>Jenis Kelamin (opsional)</label>
                <select value={jenisKelamin} onChange={(e) => setJenisKelamin(e.target.value)} className={isDarkMode ? "input-modern w-full bg-gray-800/50 border-gray-600 text-white placeholder-gray-500 rounded-xl" : "input-modern w-full bg-white/50 border-blue-200 placeholder-gray-500 rounded-xl"}>
                  <option value="semua">Semua</option>
                  <option value="laki-laki">Laki-laki</option>
                  <option value="perempuan">Perempuan</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className={isDarkMode ? "block text-sm font-medium text-gray-300 mb-2.5" : "block text-sm font-medium text-gray-700 mb-2.5"}>Deskripsi / Logika (opsional)</label>
            <textarea value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} rows={3} className={isDarkMode ? "input-modern w-full bg-gray-800/50 border-gray-600 text-white placeholder-gray-500 rounded-xl" : "input-modern w-full bg-white/50 border-blue-200 placeholder-gray-500 rounded-xl"} placeholder="Penjelasan singkat atau JSON rule (opsional)"></textarea>
          </div>

          <div className="flex gap-3 justify-end pt-3 border-t border-gray-700/30">
            <button
              onClick={() => setShowForm(false)}
              className="btn-secondary px-5 py-2"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="btn-success px-5 py-2 flex items-center gap-2"
            >
              {isLoading ? (
                <><LoaderIcon size={18} className="animate-spin" /> Menyimpan...</>
              ) : (
                <><SaveIcon size={18} /> Simpan</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Kriteria List & Dropdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dropdown Menu */}
        <div className={isDarkMode 
          ? "glass-card bg-gray-800/60 border-gray-700 space-y-4" 
          : "glass-card bg-white/60 border-blue-50/50 space-y-4"}>
          <h3 className={isDarkMode ? "text-lg font-bold text-white flex items-center gap-2" : "text-lg font-bold text-gray-800 flex items-center gap-2"}>
            🎯 Pilih Kriteria
          </h3>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 gap-2">
              <LoaderIcon size={24} className={isDarkMode ? "text-blue-400 animate-spin" : "text-blue-600 animate-spin"} />
              <span className={isDarkMode ? "text-gray-400 text-sm" : "text-gray-600 text-sm"}>Memuat...</span>
            </div>
          ) : criteriaList.length === 0 ? (
            <div className={isDarkMode 
              ? "text-sm text-gray-500 text-center py-8 bg-gray-900/30 rounded-lg" 
              : "text-sm text-gray-500 text-center py-8 bg-gray-50/50 rounded-lg"}>
              Belum ada kriteria. Buat kriteria terlebih dahulu.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {criteriaList.map((criteria) => (
                <div
                  key={criteria.id_criteria}
                  className={isDarkMode 
                    ? "p-4 bg-gray-800 hover:bg-gray-700/80 border border-gray-700/50 rounded-lg transition-all cursor-pointer hover:shadow-lg flex justify-between items-center" 
                    : "p-4 bg-white hover:bg-blue-50/50 border border-blue-100/50 rounded-lg transition-all cursor-pointer hover:shadow-lg flex justify-between items-center"}
                >
                  <span className={isDarkMode ? "font-semibold text-gray-200" : "font-semibold text-gray-800"}>
                    {criteria.nama_kriteria}
                  </span>
                  {criteria.is_active && (
                    <span className={isDarkMode
                      ? "text-xs bg-emerald-900/50 text-emerald-300 px-3 py-1 rounded-full border border-emerald-700/50"
                      : "text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full"}>
                      ✓ Aktif
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Daftar Kriteria */}
        <div className={isDarkMode 
          ? "glass-card bg-gray-800/60 border-gray-700 space-y-4" 
          : "glass-card bg-white/60 border-blue-50/50 space-y-4"}>
          <div className="flex justify-between items-center">
            <h3 className={isDarkMode ? "text-lg font-bold text-white flex items-center gap-2" : "text-lg font-bold text-gray-800 flex items-center gap-2"}>
              📋 Daftar Kriteria
            </h3>
            <button
              onClick={() => handleOpenForm()}
              disabled={isLoading}
              className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
            >
              <PlusIcon size={16} /> Tambah
            </button>
          </div>

          {isLoading && !showForm ? (
            <div className="flex flex-col items-center justify-center p-8 gap-2">
              <LoaderIcon size={24} className={isDarkMode ? "text-blue-400 animate-spin" : "text-blue-600 animate-spin"} />
            </div>
          ) : criteriaList.length === 0 ? (
            <div className={isDarkMode 
              ? "text-sm text-gray-500 text-center py-8 bg-gray-900/30 rounded-lg" 
              : "text-sm text-gray-500 text-center py-8 bg-gray-50/50 rounded-lg"}>
              Belum ada kriteria
            </div>
          ) : (
            <div className={isDarkMode ? "space-y-2 max-h-96 overflow-y-auto divide-y divide-gray-700/50" : "space-y-2 max-h-96 overflow-y-auto divide-y divide-blue-100/30"}>
              {criteriaList.map((criteria) => (
                <div
                  key={criteria.id_criteria}
                  className={isDarkMode
                    ? "flex justify-between items-center p-4 bg-gray-800 hover:bg-gray-700/50 rounded-lg transition-all group border border-gray-700/30"
                    : "flex justify-between items-center p-4 bg-white hover:bg-blue-50/50 rounded-lg transition-all group border border-blue-100/30"}
                >
                  <div>
                    <p className={isDarkMode ? "font-semibold text-gray-200" : "font-semibold text-gray-800"}>
                      {criteria.nama_kriteria}
                    </p>
                    <p className={isDarkMode ? "text-xs text-gray-500 mt-1" : "text-xs text-gray-600 mt-1"}>
                      {criteria.min_jumlah_mahasiswa}-{criteria.max_jumlah_mahasiswa} mahasiswa per kelompok
                    </p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenForm(criteria)}
                      className={isDarkMode
                        ? "text-blue-400 hover:bg-blue-900/50 p-2.5 rounded-lg transition-colors hover-scale"
                        : "text-blue-600 hover:bg-blue-100 p-2.5 rounded-lg transition-colors hover-scale"}
                      title="Edit"
                    >
                      <EditIcon size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(criteria.id_criteria)}
                      className={isDarkMode
                        ? "text-red-400 hover:bg-red-900/50 p-2.5 rounded-lg transition-colors hover-scale"
                        : "text-red-600 hover:bg-red-100 p-2.5 rounded-lg transition-colors hover-scale"}
                      title="Hapus"
                    >
                      <TrashIcon size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className={isDarkMode
        ? "glass-card bg-blue-900/20 border-blue-700/50 p-5"
        : "glass-card bg-blue-50/50 border-blue-100/50 p-5"}>
        <p className={isDarkMode ? "text-sm text-blue-300 leading-relaxed" : "text-sm text-blue-800 leading-relaxed"}>
          <strong>💡 Tips:</strong> Kriteria yang Anda buat akan tersedia di menu <strong>Autogroup</strong> sebagai pilihan dropdown saat melakukan pengelompokan mahasiswa. Setiap kriteria dapat disesuaikan dengan standar akademik institusi Anda.
        </p>
      </div>
    </section>
  );
}
