import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [locations, setLocations] = useState([]);
  const [students, setStudents] = useState([]);
  const [history, setHistory] = useState([]);
  const [previewRows, setPreviewRows] = useState(8);

  const [minPerGroup, setMinPerGroup] = useState(5);
  const [maxPerGroup, setMaxPerGroup] = useState(10);
  const [minFakultasPerGroup, setMinFakultasPerGroup] = useState(1);
  const [minProdiPerGroup, setMinProdiPerGroup] = useState(1);
  const [requireHealthCondition, setRequireHealthCondition] = useState(false);
  const [requireVehicle, setRequireVehicle] = useState(false);

  const fileRef = useRef();

  async function handleExcelUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    const normalized = json.map((r, i) => ({
      ...r,
      nim: String(r.nim || '').trim(),
      nama: String(r.nama || '').trim(),
      prodi: String(r.prodi || '').trim(),
      fakultas: String(r.fakultas || '').trim(),
      kesehatan: String(r.kesehatan || '').trim(),
      kendaraan: String(r.kendaraan || '').trim(),
      preferensi_lokasi: String(r.preferensi_lokasi || '').trim(),
      _row: i + 1
    }));
    setStudents(normalized);
    alert(`Berhasil import ${normalized.length} baris dari sheet: ${sheetName}`);
    if (fileRef.current) fileRef.current.value = '';
  }

  function addDemoLocations() {
    setLocations([
      { id: 'L1', nama_desa: 'Desa Suka Maju', kuota: 12 },
      { id: 'L2', nama_desa: 'Desa Makmur', kuota: 10 },
      { id: 'L3', nama_desa: 'Desa Sentosa', kuota: 8 }
    ]);
  }

  function generateGroups({ targetLocationId }) {
    if (students.length === 0) return alert('Belum ada data mahasiswa. Import Excel dulu.');
    const loc = locations.find(l => l.id === targetLocationId) || locations[0];
    if (!loc) return alert('Pilih lokasi terlebih dahulu (atau tambahkan lokasi demo).');

    let pool = students.slice();
    if (requireHealthCondition) pool = pool.filter(s => (s.kesehatan || '').toLowerCase().includes('baik') || (s.kesehatan || '').toLowerCase().includes('sehat'));
    if (requireVehicle) pool = pool.filter(s => ['ya', 'yes', 'true', '1'].includes((s.kendaraan || '').toLowerCase()));

    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const groups = [];
    let currentGroup = [];
    let totalAssigned = 0;
    const maxTotal = Number(loc.kuota) || Infinity;

    while (pool.length > 0 && totalAssigned < maxTotal) {
      const student = pool.shift();
      currentGroup.push(student);
      totalAssigned += 1;

      const shouldClose = currentGroup.length >= maxPerGroup || pool.length === 0 || totalAssigned >= maxTotal;

      if (shouldClose) {
        let fakultasCount = new Set(currentGroup.map(s => s.fakultas)).size;
        let prodiCount = new Set(currentGroup.map(s => s.prodi)).size;

        while ((fakultasCount < minFakultasPerGroup || prodiCount < minProdiPerGroup) && pool.length > 0 && currentGroup.length < maxPerGroup && totalAssigned < maxTotal) {
          const candidateIndex = pool.findIndex(p => !currentGroup.some(c => c.fakultas === p.fakultas) || !currentGroup.some(c => c.prodi === p.prodi));
          if (candidateIndex === -1) break;
          const cand = pool.splice(candidateIndex, 1)[0];
          currentGroup.push(cand);
          fakultasCount = new Set(currentGroup.map(s => s.fakultas)).size;
          prodiCount = new Set(currentGroup.map(s => s.prodi)).size;
          totalAssigned += 1;
        }

        if (currentGroup.length < minPerGroup && groups.length > 0) {
          const last = groups[groups.length - 1];
          while (currentGroup.length < minPerGroup && last.length > minPerGroup) {
            currentGroup.push(last.pop());
          }
        }

        if (currentGroup.length > 0) groups.push(currentGroup.slice());
        currentGroup = [];
      }
    }

    if (currentGroup.length > 0 && totalAssigned < maxTotal) {
      groups.push(currentGroup.slice());
    }

    const flatAssigned = groups.flat().length;
    if (flatAssigned > maxTotal) {
      let excess = flatAssigned - maxTotal;
      for (let i = groups.length - 1; i >= 0 && excess > 0; i--) {
        while (groups[i].length > minPerGroup && excess > 0) {
          groups[i].pop();
          excess -= 1;
        }
      }
      while (groups.length > 0 && groups[groups.length - 1].length === 0) groups.pop();
    }

    const result = groups.map((g, i) => ({ kelompok: `KKN-${i + 1}`, lokasi: loc.nama_desa, anggota: g }));

    const record = {
      id: `H-${Date.now()}`,
      created_at: new Date().toISOString(),
      location: loc.nama_desa,
      groups: result
    };
    setHistory(prev => [record, ...prev]);

    alert(`Generated ${result.length} kelompok untuk lokasi ${loc.nama_desa}`);
    return result;
  }

  function downloadGroupsToExcel(groups) {
    const wb = XLSX.utils.book_new();
    groups.forEach(g => {
      const rows = g.anggota.map(a => ({ NIM: a.nim, Nama: a.nama, Prodi: a.prodi, Fakultas: a.fakultas, Kesehatan: a.kesehatan, Kendaraan: a.kendaraan }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const name = String(g.kelompok).slice(0, 31) || 'Sheet1';
      XLSX.utils.book_append_sheet(wb, ws, name);
    });
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'kkn_groups.xlsx');
  }

  function Sidebar() {
    return (
      <aside className="w-72 bg-white/80 backdrop-blur p-4 border-r min-h-screen">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">KKN AutoGroup</h2>
          <p className="text-sm text-slate-500">Admin Panel</p>
        </div>
        <nav className="flex flex-col gap-2">
          {['dashboard', 'data-lokasi', 'autogrup', 'riwayat'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`text-left p-3 rounded-lg hover:bg-slate-50 ${tab === t ? 'bg-indigo-50 ring-1 ring-indigo-200' : ''}`}>
              {t === 'dashboard' && 'Dashboard'}
              {t === 'data-lokasi' && 'Data Lokasi'}
              {t === 'autogrup' && 'Autogrup'}
              {t === 'riwayat' && 'Riwayat'}
            </button>
          ))}
        </nav>
        <div className="mt-6">
          <button onClick={addDemoLocations} className="w-full py-2 rounded bg-slate-100 hover:bg-slate-200 text-sm">Add demo locations</button>
        </div>
      </aside>
    );
  }

  function Header() {
    return (
      <header className="flex items-center justify-between p-4 bg-white/60 backdrop-blur border-b">
        <div>
          <h3 className="text-lg font-semibold">{tab === 'dashboard' ? 'Dashboard' : tab === 'data-lokasi' ? 'Data Lokasi' : tab === 'autogrup' ? 'Autogrup' : 'Riwayat'}</h3>
          <p className="text-sm text-slate-500">Sistem otomatisasi pengelompokan KKN</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-600">Admin</div>
          <div className="w-9 h-9 bg-indigo-600 rounded-full text-white flex items-center justify-center">A</div>
        </div>
      </header>
    );
  }

  function Card({ title, children }) {
    return (
      <div className="p-4 bg-white rounded-lg border">
        <div className="text-sm text-slate-500 mb-2">{title}</div>
        {children}
      </div>
    );
  }

  function Dashboard() {
    return (
      <div className="p-6 grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card title="Total Mahasiswa">
              <div className="text-2xl font-bold">{students.length}</div>
              <div className="text-sm text-slate-500">Mahasiswa terimport</div>
            </Card>
            <Card title="Lokasi">
              <div className="text-2xl font-bold">{locations.length}</div>
              <div className="text-sm text-slate-500">Desa tersedia</div>
            </Card>
            <Card title="Riwayat Penempatan">
              <div className="text-2xl font-bold">{history.length}</div>
              <div className="text-sm text-slate-500">Hasil generate</div>
            </Card>
          </div>

          <div className="p-4 bg-white rounded-lg border">
            <h4 className="font-semibold mb-2">Preview Mahasiswa (random sample)</h4>
            <div className="overflow-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="text-slate-500 text-left">
                  <tr>
                    <th className="pb-2">NIM</th>
                    <th className="pb-2">Nama</th>
                    <th className="pb-2">Prodi</th>
                    <th className="pb-2">Fakultas</th>
                  </tr>
                </thead>
                <tbody>
                  {students.slice(0, previewRows).map((s, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-2">{s.nim}</td>
                      <td className="py-2">{s.nama}</td>
                      <td className="py-2">{s.prodi}</td>
                      <td className="py-2">{s.fakultas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <div className="p-4 bg-white rounded-lg border mb-4">
            <h4 className="font-semibold mb-2">Import Excel Mahasiswa</h4>
            <input ref={fileRef} onChange={handleExcelUpload} type="file" accept=".xls,.xlsx" />
            <p className="text-xs text-slate-500 mt-2">Format kolom yang dianjurkan: nim, nama, prodi, fakultas, kesehatan, kendaraan, preferensi_lokasi</p>
          </div>

          <div className="p-4 bg-white rounded-lg border">
            <h4 className="font-semibold mb-2">Lokasi</h4>
            <ul className="text-sm">
              {locations.map(l => (
                <li key={l.id} className="py-1">{l.nama_desa} — kuota: {l.kuota}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  function DataLokasi() {
    const [form, setForm] = useState({ nama_desa: '', kecamatan: '', kabupaten: '', kuota: 10, pembimbing: '' });
    function addLocation() {
      setLocations(prev => [...prev, { id: `L${Date.now()}`, ...form }]);
      setForm({ nama_desa: '', kecamatan: '', kabupaten: '', kuota: 10, pembimbing: '' });
    }
    return (
      <div className="p-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <div className="p-4 bg-white rounded-lg border">
              <h4 className="font-semibold mb-4">Daftar Lokasi</h4>
              <table className="w-full text-sm">
                <thead className="text-slate-500 text-left">
                  <tr><th>Nama Desa</th><th>Kecamatan</th><th>Kuota</th><th>Pembimbing</th></tr>
                </thead>
                <tbody>
                  {locations.map(l => (
                    <tr key={l.id} className="border-t"><td className="py-2">{l.nama_desa}</td><td>{l.kecamatan}</td><td>{l.kuota}</td><td>{l.pembimbing}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <div className="p-4 bg-white rounded-lg border">
              <h4 className="font-semibold mb-2">Tambah Lokasi</h4>
              <div className="flex flex-col gap-2">
                <input value={form.nama_desa} onChange={e => setForm(f => ({ ...f, nama_desa: e.target.value }))} placeholder="Nama Desa" className="p-2 border rounded" />
                <input value={form.kecamatan} onChange={e => setForm(f => ({ ...f, kecamatan: e.target.value }))} placeholder="Kecamatan" className="p-2 border rounded" />
                <input value={form.kabupaten} onChange={e => setForm(f => ({ ...f, kabupaten: e.target.value }))} placeholder="Kabupaten" className="p-2 border rounded" />
                <input type="number" value={form.kuota} onChange={e => setForm(f => ({ ...f, kuota: Number(e.target.value) }))} placeholder="Kuota" className="p-2 border rounded" />
                <input value={form.pembimbing} onChange={e => setForm(f => ({ ...f, pembimbing: e.target.value }))} placeholder="Pembimbing" className="p-2 border rounded" />
                <button onClick={addLocation} className="py-2 rounded bg-indigo-600 text-white">Tambah</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function Autogrup() {
    const [selectedLocation, setSelectedLocation] = useState(locations[0]?.id || null);
    const [generated, setGenerated] = useState(null);

    React.useEffect(() => {
      if (!selectedLocation && locations.length > 0) setSelectedLocation(locations[0].id);
    }, [locations, selectedLocation]);

    function handleGenerate() {
      const result = generateGroups({ targetLocationId: selectedLocation });
      setGenerated(result);
    }

    return (
      <div className="p-6 grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="p-4 bg-white rounded-lg border mb-4">
            <h4 className="font-semibold mb-3">Pengaturan Autogrup</h4>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col"><span className="text-sm">Pilih Lokasi</span>
                <select className="p-2 border rounded" value={selectedLocation || ''} onChange={e => setSelectedLocation(e.target.value)}>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.nama_desa} — kuota: {l.kuota}</option>)}
                </select>
              </label>

              <label className="flex flex-col"><span className="text-sm">Min per kelompok</span>
                <input type="number" value={minPerGroup} onChange={e => setMinPerGroup(Number(e.target.value) || 1)} className="p-2 border rounded" />
              </label>

              <label className="flex flex-col"><span className="text-sm">Max per kelompok</span>
                <input type="number" value={maxPerGroup} onChange={e => setMaxPerGroup(Number(e.target.value) || 1)} className="p-2 border rounded" />
              </label>

              <label className="flex flex-col"><span className="text-sm">Min fakultas / kelompok</span>
                <input type="number" value={minFakultasPerGroup} onChange={e => setMinFakultasPerGroup(Number(e.target.value) || 1)} className="p-2 border rounded" />
              </label>

              <label className="flex flex-col"><span className="text-sm">Min prodi / kelompok</span>
                <input type="number" value={minProdiPerGroup} onChange={e => setMinProdiPerGroup(Number(e.target.value) || 1)} className="p-2 border rounded" />
              </label>

              <div className="flex items-center gap-2">
                <input id="health" type="checkbox" checked={requireHealthCondition} onChange={e => setRequireHealthCondition(e.target.checked)} />
                <label htmlFor="health" className="text-sm">Hanya mahasiswa sehat</label>
              </div>

              <div className="flex items-center gap-2">
                <input id="vehicle" type="checkbox" checked={requireVehicle} onChange={e => setRequireVehicle(e.target.checked)} />
                <label htmlFor="vehicle" className="text-sm">Hanya mahasiswa punya kendaraan</label>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={handleGenerate} className="py-2 px-4 rounded bg-indigo-600 text-white">Generate</button>
              <button onClick={() => { if (generated) downloadGroupsToExcel(generated); else alert('Belum ada hasil generate'); }} className="py-2 px-4 rounded border">Download Excel</button>
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg border">
            <h4 className="font-semibold mb-3">Hasil Generate</h4>
            {!generated && <div className="text-sm text-slate-500">Belum ada hasil. Tekan Generate untuk memulai.</div>}
            {generated && (
              <div>
                {generated.map((g, i) => (
                  <div key={i} className="mb-3 p-3 border rounded">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-semibold">{g.kelompok} — {g.lokasi}</div>
                      <div className="text-sm text-slate-500">Anggota: {g.anggota.length}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {g.anggota.map((a, ai) => (
                        <div key={ai} className="p-2 bg-slate-50 rounded text-sm">{a.nim} — {a.nama}
                          <div className="text-xs text-slate-400">{a.prodi} / {a.fakultas}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="p-4 bg-white rounded-lg border mb-4">
            <h4 className="font-semibold mb-2">Preview Upload</h4>
            <div className="text-sm text-slate-500 mb-2">Menampilkan {Math.min(students.length, previewRows)} dari {students.length} baris</div>
            <div className="overflow-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="text-slate-500 text-left"><tr><th>NIM</th><th>Nama</th><th>Prodi</th><th>Fakultas</th></tr></thead>
                <tbody>
                  {students.slice(0, previewRows).map((s, i) => <tr key={i} className="border-t"><td className="py-1">{s.nim}</td><td>{s.nama}</td><td>{s.prodi}</td><td>{s.fakultas}</td></tr>)}
                </tbody>
              </table>
            </div>
            <div className="mt-2">
              <label className="text-sm">Tampilkan baris</label>
              <input type="range" min={3} max={30} value={previewRows} onChange={e => setPreviewRows(Number(e.target.value))} />
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg border">
            <h4 className="font-semibold mb-2">Quick Actions</h4>
            <button onClick={() => { setStudents([]); alert('Data mahasiswa direset'); }} className="w-full py-2 rounded border mb-2">Reset Mahasiswa</button>
            <button onClick={() => { setHistory([]); alert('Riwayat direset'); }} className="w-full py-2 rounded border">Reset Riwayat</button>
          </div>
        </div>
      </div>
    );
  }

  function Riwayat() {
    return (
      <div className="p-6">
        <div className="p-4 bg-white rounded-lg border">
          <h4 className="font-semibold mb-3">Riwayat Generate</h4>
          {history.length === 0 && <div className="text-sm text-slate-500">Belum ada riwayat.</div>}
          <div className="space-y-3">
            {history.map(h => (
              <div key={h.id} className="p-3 border rounded flex justify-between items-center">
                <div>
                  <div className="font-semibold">{h.location}</div>
                  <div className="text-sm text-slate-500">{new Date(h.created_at).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => {
                    const groups = h.groups.map(g => ({ kelompok: g.kelompok, lokasi: g.lokasi, anggota: g.anggota }));
                    downloadGroupsToExcel(groups);
                  }} className="py-1 px-3 border rounded text-sm">Download</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white text-slate-800">
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <main>
            {tab === 'dashboard' && <Dashboard />}
            {tab === 'data-lokasi' && <DataLokasi />}
            {tab === 'autogrup' && <Autogrup />}
            {tab === 'riwayat' && <Riwayat />}
          </main>
        </div>
      </div>
    </div>
  );
}
