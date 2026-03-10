import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../App';
import { Search, Filter, UserPlus, Edit2, Trash2, X, Eye, EyeOff } from 'lucide-react';
import '../styles/ManajemenAkun.css';

export default function ManajemenAkun() {
  const { isDarkMode } = useContext(ThemeContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ 
    nama: '', 
    nip: '', 
    email: '', 
    password: '', 
    role: 'Admin',
    status: 'Aktif' 
  });
  const [editingId, setEditingId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/akun');
      const data = await res.json();
      // Ensure data is an array
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const save = async () => {
    if (!form.nama || !form.nip || (!editingId && !form.password)) {
      alert('Nama, NIP, dan Password (untuk akun baru) wajib diisi');
      return;
    }
    try {
      const url = editingId ? `http://localhost:4000/api/akun/${editingId}` : 'http://localhost:4000/api/akun';
      const method = editingId ? 'PUT' : 'POST';
      const payload = { 
        nama: form.nama,
        nip: form.nip,
        email: form.email || null,
        role: form.role,
        status: form.status
      };
      if (form.password) payload.password = form.password;
      const res = await fetch(url, { 
        method, 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      if (!res.ok) {
        const d = await res.json().catch(()=>({}));
        throw new Error(d.error || 'Gagal menyimpan data');
      }
      await fetchUsers();
      alert(editingId ? 'Akun berhasil diperbarui!' : 'Akun berhasil ditambahkan!');
      resetForm();
    } catch (err) { 
      alert(err.message); 
    }
  };

  const resetForm = () => {
    setForm({ nama: '', nip: '', email: '', password: '', role: 'Admin', status: 'Aktif' });
    setEditingId(null);
    setShowModal(false);
    setShowPassword(false);
  };

  const edit = (u) => { 
    setEditingId(u.id_akun); 
    setForm({ 
      nama: u.nama,
      nip: u.nip || '', 
      email: u.email || '', 
      password: '', 
      role: u.role,
      status: u.status || 'Aktif'
    }); 
    setShowModal(true);
  };

  const remove = async (id) => { 
    if (!window.confirm('Yakin ingin menghapus akun ini?')) return; 
    try {
      const res = await fetch(`http://localhost:4000/api/akun/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus akun');
      alert('Akun berhasil dihapus!');
      fetchUsers();
    } catch (err) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Aktif' ? 'Nonaktif' : 'Aktif';
    try {
      const res = await fetch(`http://localhost:4000/api/akun/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Gagal mengubah status');
      fetchUsers();
    } catch (err) {
      alert('Gagal mengubah status: ' + err.message);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchSearch = !searchQuery || 
      user.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.nip?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = !filterRole || user.role === filterRole;
    return matchSearch && matchRole;
  });

  const getInitial = (name) => {
    return name?.charAt(0).toUpperCase() || '?';
  };

  const getRoleColor = (role) => {
    switch(role) {
          case 'Admin': return 'bg-blue-800/20 text-blue-800 border-blue-800/40'; // STAFF biru tua
          case 'Staff': return 'bg-blue-400/20 text-blue-400 border-blue-400/40'; // STAFF biru muda
          case 'Koordinator': return 'bg-amber-500/20 text-amber-500 border-amber-500/40';
          default: return 'bg-blue-400/20 text-blue-400 border-blue-400/40';
    }
  };

  return (
    <section className="space-y-6">
      {/* Main Table Container */}
      <div className={isDarkMode ? "glass-card bg-gray-800/60 border-gray-700 overflow-hidden" : "glass-card bg-white/90 border-blue-100/80 overflow-hidden"}>
        {/* Search Bar & Filter */}
        <div className={isDarkMode ? "p-4 border-b border-gray-700" : "p-4 border-b border-gray-200"}>
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
              <input 
                type="text" 
                placeholder="CARI NAMA, NIP, ATAU EMAIL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={isDarkMode
                  ? "pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-600 text-white rounded-lg text-sm placeholder-gray-500 w-full focus:outline-none focus:border-blue-500 transition-colors"
                  : "pl-10 pr-4 py-2.5 bg-white border border-gray-300 text-gray-800 rounded-lg text-sm placeholder-gray-400 w-full focus:outline-none focus:border-blue-500 transition-colors"}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className={isDarkMode ? "text-gray-500" : "text-gray-400"} />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className={isDarkMode
                  ? "px-4 py-2.5 bg-gray-800/50 border border-gray-600 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                  : "px-4 py-2.5 bg-white border border-gray-300 text-gray-800 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"}
              >
                <option value="">SEMUA PERAN</option>
                <option value="Admin">STAFF</option>
                <option value="Koordinator">KOORDINATOR </option>
              </select>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center gap-2 whitespace-nowrap"
            >
              <UserPlus size={16} />
              Tambah Akun
            </button>
          </div>
        </div>
        {/* Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className={isDarkMode ? "text-gray-400 mt-2" : "text-gray-600 mt-2"}>Memuat data...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
              {searchQuery || filterRole ? 'Tidak ada data yang cocok dengan pencarian.' : 'Belum ada akun pengguna.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDarkMode ? "bg-gray-800/80 border-b border-gray-700" : "bg-gray-50 border-b border-gray-200"}>
                <tr>
                  <th className={`px-4 py-3 text-left text-xs font-bold tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    NO.
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-bold tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    INFORMASI PENGGUNA
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-bold tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    PERAN
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-bold tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    STATUS
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-bold tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    AKSI
                  </th>
                </tr>
              </thead>
              <tbody className={isDarkMode ? "divide-y divide-gray-700" : "divide-y divide-gray-200"}>
                {filteredUsers.map((user, index) => (
                  <tr key={user.id_akun} className={isDarkMode ? "hover:bg-gray-700/30 transition-colors" : "hover:bg-blue-50/50 transition-colors"}>
                    <td className={`px-4 py-1.5 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                      {index + 1}
                    </td>
                    <td className="px-4 py-1.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                          user.role === 'Admin' ? 'bg-blue-600' : 
                          user.role === 'Koordinator' ? 'bg-amber-600' : 
                          'bg-blue-600'
                        }`}>
                          {getInitial(user.nama)}
                        </div>
                        <div>
                          <div className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                            {user.nama}
                          </div>
                          <div className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                            NIP: {user.nip || '-'} {user.email ? `• ${user.email}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-1.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold tracking-wide border ${getRoleColor(user.role)}`}>
                        {['admin','staff'].includes((user.role||'').toLowerCase()) ? 'STAFF' : ((user.role||'').toLowerCase() === 'koordinator' ? 'KOORDINATOR' : user.role?.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-4 py-1.5">
                      <button
                        onClick={() => toggleStatus(user.id_akun, user.status || 'Aktif')}
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold tracking-wide border cursor-pointer transition-all ${
                          (user.status || 'Aktif') === 'Aktif'
                            ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-red-500/20 text-red-500 border-red-500/40 hover:bg-red-500/30'
                        }`}
                      >
                        {(user.status || 'Aktif') === 'Aktif' ? 'AKTIF' : 'NONAKTIF'}
                      </button>
                    </td>
                    <td className="px-4 py-1.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => edit(user)}
                          className={`p-1.5 rounded-md transition-all ${
                            isDarkMode
                              ? 'text-gray-500 hover:text-blue-400 hover:bg-blue-600/20'
                              : 'text-gray-400 hover:text-blue-600 hover:bg-blue-100'
                          }`}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => remove(user.id_akun)}
                          className={`p-1.5 rounded-md transition-all ${
                            isDarkMode
                              ? 'text-gray-500 hover:text-red-400 hover:bg-red-600/20'
                              : 'text-gray-400 hover:text-red-600 hover:bg-red-100'
                          }`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-2xl rounded-xl shadow-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className={`flex justify-between items-center p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {editingId ? 'EDIT AKUN' : 'TAMBAH AKUN BARU'}
              </h3>
              <button onClick={resetForm} className={`p-1 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                <X size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-2 tracking-wide ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  NAMA LENGKAP <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  value={form.nama} 
                  onChange={(e)=>setForm({...form, nama:e.target.value})} 
                  className={`w-full px-4 py-3 rounded-lg border text-sm ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-800 focus:border-blue-500'
                  } focus:outline-none transition-colors`}
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold mb-2 tracking-wide ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    NIP <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    value={form.nip} 
                    onChange={(e)=>setForm({...form, nip:e.target.value})} 
                    className={`w-full px-4 py-3 rounded-lg border text-sm ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-800 focus:border-blue-500'
                    } focus:outline-none transition-colors`}
                    placeholder="Nomor Induk Pegawai (untuk login)"
                    disabled={editingId ? true : false}
                  />
                  {editingId && (
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      NIP tidak dapat diubah
                    </p>
                  )}
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-2 tracking-wide ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    EMAIL
                  </label>
                  <input 
                    type="email"
                    value={form.email} 
                    onChange={(e)=>setForm({...form, email:e.target.value})} 
                    className={`w-full px-4 py-3 rounded-lg border text-sm ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-800 focus:border-blue-500'
                    } focus:outline-none transition-colors`}
                    placeholder="Email pengguna"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-2 tracking-wide ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  PASSWORD {editingId ? '(Kosongkan jika tidak ingin mengubah)' : <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={form.password} 
                    onChange={(e)=>setForm({...form, password:e.target.value})} 
                    className={`w-full px-4 py-3 rounded-lg border text-sm pr-12 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-800 focus:border-blue-500'
                    } focus:outline-none transition-colors`}
                    placeholder={editingId ? "Kosongkan jika tidak diubah" : "Masukkan password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold mb-2 tracking-wide ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    PERAN
                  </label>
                  <select 
                    value={form.role} 
                    onChange={(e)=>setForm({...form, role:e.target.value})} 
                    className={`w-full px-4 py-3 rounded-lg border text-sm ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-800 focus:border-blue-500'
                    } focus:outline-none transition-colors cursor-pointer`}
                  >
                    <option value="Admin">Staff </option>
                    <option value="Koordinator">Koordinator </option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-2 tracking-wide ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    STATUS
                  </label>
                  <select 
                    value={form.status} 
                    onChange={(e)=>setForm({...form, status:e.target.value})} 
                    className={`w-full px-4 py-3 rounded-lg border text-sm ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-800 focus:border-blue-500'
                    } focus:outline-none transition-colors cursor-pointer`}
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={`flex gap-3 p-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <button 
                onClick={save} 
                className="flex-1 btn-primary py-3 text-sm font-bold tracking-wide"
              >
                {editingId ? 'PERBARUI' : 'SIMPAN'}
              </button>
              <button 
                onClick={resetForm} 
                className={`flex-1 px-4 py-3 rounded-lg font-bold text-sm tracking-wide transition-all ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                BATAL
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}