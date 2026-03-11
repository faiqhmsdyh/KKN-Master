import React, { useState, useEffect, useContext } from 'react';
import { X, Plus, Edit2, Trash2, CheckCircle, Copy, Calendar, Users } from 'lucide-react';
import { ThemeContext } from '../App';
import API_BASE_URL from '../config/api';

export default function PeriodeModal({ show, onClose, onPeriodeChange }) {
  const { isDarkMode } = useContext(ThemeContext);
  const [periodeList, setPeriodeList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingPeriode, setEditingPeriode] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nama_periode: '',
    tahun_akademik: '',
    angkatan: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    is_active: false
  });

  useEffect(() => {
    if (show) {
      fetchPeriode();
    }
  }, [show]);

  const fetchPeriode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/periode`);
      if (response.ok) {
        const data = await response.json();
        setPeriodeList(data);
      }
    } catch (error) {
      console.error('Error fetching periode:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nama_periode: '',
      tahun_akademik: '',
      angkatan: '',
      tanggal_mulai: '',
      tanggal_selesai: '',
      is_active: false
    });
    setEditingPeriode(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama_periode.trim()) {
      alert('Nama periode wajib diisi');
      return;
    }

    try {
      const url = editingPeriode 
        ? `${API_BASE_URL}/api/periode/${editingPeriode.id_periode}`
        : `${API_BASE_URL}/api/periode`;
      
      const response = await fetch(url, {
        method: editingPeriode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchPeriode();
        resetForm();
        onPeriodeChange?.();
      } else {
        const err = await response.json();
        alert('Error: ' + err.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleEdit = (periode) => {
    setEditingPeriode(periode);
    setFormData({
      nama_periode: periode.nama_periode || '',
      tahun_akademik: periode.tahun_akademik || '',
      angkatan: periode.angkatan || '',
      tanggal_mulai: periode.tanggal_mulai ? periode.tanggal_mulai.split('T')[0] : '',
      tanggal_selesai: periode.tanggal_selesai ? periode.tanggal_selesai.split('T')[0] : '',
      is_active: periode.is_active || false
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus periode ini?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/periode/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchPeriode();
        onPeriodeChange?.();
      } else {
        const err = await response.json();
        alert('Error: ' + err.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleActivate = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/periode/${id}/activate`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await fetchPeriode();
        onPeriodeChange?.();
      } else {
        const err = await response.json();
        alert('Error: ' + err.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleDuplicate = async (periode) => {
    const newName = prompt('Nama periode baru:', `Copy - ${periode.nama_periode}`);
    if (!newName) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/periode/${periode.id_periode}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_periode: newName,
          tahun_akademik: periode.tahun_akademik,
          angkatan: periode.angkatan,
          is_active: false
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        await fetchPeriode();
        onPeriodeChange?.();
        alert(`Berhasil menduplikasi periode dengan ${data.jumlah_lokasi_copied} lokasi`);
      } else {
        const err = await response.json();
        alert('Error: ' + err.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className={`relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl ${
        isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className={`block font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`} style={{ fontSize: '22px' }}>
                Kelola Periode KKN
              </span>
              <span className={`block ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} style={{ fontSize: '11px' }}>
                Atur periode/angkatan untuk mengelompokkan lokasi
              </span>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg transition ${
            isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
          }`}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Add New Button */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition"
            >
              <Plus size={18} />
              Tambah Periode Baru
            </button>
          )}

          {/* Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className={`mb-6 p-4 rounded-xl border ${
              isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
              <h3 className={`text-sm font-semibold mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {editingPeriode ? 'Edit Periode' : 'Tambah Periode Baru'}
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Nama Periode *
                  </label>
                  <input
                    type="text"
                    value={formData.nama_periode}
                    onChange={(e) => setFormData({ ...formData, nama_periode: e.target.value })}
                    placeholder="Contoh: KKN Angkatan 123"
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Tahun Akademik
                  </label>
                  <input
                    type="text"
                    value={formData.tahun_akademik}
                    onChange={(e) => setFormData({ ...formData, tahun_akademik: e.target.value })}
                    placeholder="Contoh: 2025/2026"
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Angkatan
                  </label>
                  <input
                    type="text"
                    value={formData.angkatan}
                    onChange={(e) => setFormData({ ...formData, angkatan: e.target.value })}
                    placeholder="Contoh: 123"
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal_mulai}
                    onChange={(e) => setFormData({ ...formData, tanggal_mulai: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal_selesai}
                    onChange={(e) => setFormData({ ...formData, tanggal_selesai: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>

                <div className="col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Jadikan periode aktif
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  {editingPeriode ? 'Simpan Perubahan' : 'Tambah Periode'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    isDarkMode 
                      ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Batal
                </button>
              </div>
            </form>
          )}

          {/* Periode List */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : periodeList.length === 0 ? (
            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Belum ada periode. Klik tombol di atas untuk menambahkan.
            </div>
          ) : (
            <div className="space-y-3">
              {periodeList.map((periode) => (
                <div 
                  key={periode.id_periode}
                  className={`p-4 rounded-xl border transition ${
                    periode.is_active 
                      ? isDarkMode 
                        ? 'bg-blue-900/30 border-blue-700' 
                        : 'bg-blue-50 border-blue-200'
                      : isDarkMode 
                        ? 'bg-gray-700/50 border-gray-600 hover:border-gray-500' 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {periode.is_active && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      <div>
                        <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {periode.nama_periode}
                          {periode.is_active && (
                            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-500 text-white">
                              AKTIF
                            </span>
                          )}
                        </h4>
                        <div className={`flex items-center gap-3 text-xs mt-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {periode.tahun_akademik && (
                            <span>📅 {periode.tahun_akademik}</span>
                          )}
                          {periode.angkatan && (
                            <span>🎓 Angkatan {periode.angkatan}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users size={12} />
                            {periode.jumlah_lokasi || 0} lokasi
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {!periode.is_active && (
                        <button
                          onClick={() => handleActivate(periode.id_periode)}
                          title="Jadikan Aktif"
                          className={`p-2 rounded-lg transition ${
                            isDarkMode 
                              ? 'hover:bg-gray-600 text-green-400' 
                              : 'hover:bg-gray-100 text-green-600'
                          }`}
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDuplicate(periode)}
                        title="Duplikasi dengan Lokasi"
                        className={`p-2 rounded-lg transition ${
                          isDarkMode 
                            ? 'hover:bg-gray-600 text-blue-400' 
                            : 'hover:bg-gray-100 text-blue-600'
                        }`}
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(periode)}
                        title="Edit"
                        className={`p-2 rounded-lg transition ${
                          isDarkMode 
                            ? 'hover:bg-gray-600 text-yellow-400' 
                            : 'hover:bg-gray-100 text-yellow-600'
                        }`}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(periode.id_periode)}
                        title="Hapus"
                        className={`p-2 rounded-lg transition ${
                          isDarkMode 
                            ? 'hover:bg-gray-600 text-red-400' 
                            : 'hover:bg-gray-100 text-red-600'
                        }`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`w-full px-4 py-2 rounded-lg font-medium transition ${
              isDarkMode 
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
