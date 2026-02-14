import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../App';
import '../styles/ManajemenAkun.css';

export default function ManajemenAkun() {
  const { isDarkMode } = useContext(ThemeContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nama: '', username: '', password: '', role: 'petugas' });
  const [editingId, setEditingId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const save = async () => {
    if (!form.nama || !form.username || (!editingId && !form.password)) {
      alert('Isi nama, username, dan password (untuk user baru)');
      return;
    }
    try {
      const url = editingId ? `http://localhost:4000/api/users/${editingId}` : 'http://localhost:4000/api/users';
      const method = editingId ? 'PUT' : 'POST';
      const payload = { nama: form.nama, username: form.username, role: form.role };
      if (form.password) payload.password = form.password;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const d = await res.json().catch(()=>({}));
        throw new Error(d.error || 'Save failed');
      }
      await fetchUsers();
      setForm({ nama: '', username: '', password: '', role: 'petugas' });
      setEditingId(null);
    } catch (err) { alert(err.message); }
  };

  const edit = (u) => { setEditingId(u.id); setForm({ nama: u.nama, username: u.username, password: '', role: u.role }); };
  const remove = async (id) => { if (!confirm('Hapus user?')) return; await fetch(`http://localhost:4000/api/users/${id}`, { method: 'DELETE' }); fetchUsers(); };

  return (
    <section className="space-y-6">
      <div className={isDarkMode ? 'bg-gray-800 p-6 rounded-xl' : 'bg-white p-6 rounded-xl'}>
        <h3 className={isDarkMode ? 'text-white font-semibold' : 'text-gray-800 font-semibold'}>Manajemen Akun</h3>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Nama</label>
            <input value={form.nama} onChange={(e)=>setForm({...form, nama:e.target.value})} className="w-full px-3 py-2 rounded-lg border" />
            <label className="block text-sm mb-1 mt-2">Username</label>
            <input value={form.username} onChange={(e)=>setForm({...form, username:e.target.value})} className="w-full px-3 py-2 rounded-lg border" />
            <label className="block text-sm mb-1 mt-2">Password</label>
            <input type="password" value={form.password} onChange={(e)=>setForm({...form, password:e.target.value})} className="w-full px-3 py-2 rounded-lg border" />
            <label className="block text-sm mb-1 mt-2">Role</label>
            <select value={form.role} onChange={(e)=>setForm({...form, role:e.target.value})} className="w-full px-3 py-2 rounded-lg border">
              <option value="petugas">Petugas</option>
              <option value="pimpinan">Pimpinan</option>
            </select>
            <div className="flex gap-2 mt-4">
              <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded-lg">{editingId? 'Update':'Buat User'}</button>
              <button onClick={()=>{setForm({nama:'',username:'',password:'',role:'petugas'}); setEditingId(null);}} className="px-4 py-2 bg-gray-200 rounded-lg">Batal</button>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Daftar User</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {loading ? <div>Loading...</div> : (
                users.map(u => (
                  <div key={u.id} className="p-3 border rounded-lg flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{u.nama}</div>
                      <div className="text-sm text-gray-500">{u.username} • {u.role}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={()=>edit(u)} className="px-3 py-1 bg-yellow-400 rounded">Edit</button>
                      <button onClick={()=>remove(u.id)} className="px-3 py-1 bg-red-500 text-white rounded">Hapus</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
