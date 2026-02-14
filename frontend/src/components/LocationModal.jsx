import React, { useState } from 'react';
import { LoaderIcon } from 'lucide-react';
import '../styles/LocationModal.css';

export default function LocationModal({ show, setShow, locationForm, setLocationForm, onSave, editingId }) {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [checkingFakes, setCheckingFakes] = useState(false);

  const handleGeocode = async () => {
    if (!locationForm.lokasi) {
      alert('Isikan nama lokasi terlebih dahulu');
      return;
    }

    setIsGeocoding(true);
    try {
      const response = await fetch('http://localhost:4000/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lokasi: locationForm.lokasi,
          desa_kecamatan: locationForm.desa_kecamatan,
          kabupaten: locationForm.kabupaten
        })
      });

      if (response.ok) {
        const data = await response.json();
        setLocationForm({
          ...locationForm,
          latitude: data.latitude,
          longitude: data.longitude
        });
          // After getting coords, check nearby faskes
          try {
            setCheckingFakes(true);
            const chkRes = await fetch('http://localhost:4000/api/check-fakes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ latitude: data.latitude, longitude: data.longitude, radiusMeters: 800 })
            });
            if (chkRes.ok) {
              const chk = await chkRes.json();
              setLocationForm(prev => ({ ...prev, latitude: data.latitude, longitude: data.longitude, fakes: !!chk.hasFakes }));
              alert(`Lokasi ditemukan: ${data.display_name}\nLat: ${data.latitude}, Lng: ${data.longitude}\nDekat faskes: ${chk.hasFakes ? 'Ya' : 'Tidak'}`);
            } else {
              setLocationForm(prev => ({ ...prev, latitude: data.latitude, longitude: data.longitude }));
              alert(`Lokasi ditemukan: ${data.display_name}\nLat: ${data.latitude}, Lng: ${data.longitude}`);
            }
          } catch (err) {
            console.error('check-fakes error:', err);
            alert(`Lokasi ditemukan: ${data.display_name}\nLat: ${data.latitude}, Lng: ${data.longitude}`);
          } finally {
            setCheckingFakes(false);
          }
      } else {
        const error = await response.json();
        alert('Lokasi tidak ditemukan: ' + error.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setIsGeocoding(false);
    }
  };

  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">{editingId ? 'Edit Lokasi' : 'Tambah Lokasi Baru'}</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lokasi (nama)</label>
            <input type="text" placeholder="Contoh: Desa Sungai Rumbai" value={locationForm.lokasi || ''} onChange={(e) => setLocationForm({ ...locationForm, lokasi: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Desa / Kecamatan</label>
            <input type="text" placeholder="Contoh: Desa X / Kecamatan Y" value={locationForm.desa_kecamatan || ''} onChange={(e) => setLocationForm({ ...locationForm, desa_kecamatan: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kabupaten</label>
            <input type="text" placeholder="Contoh: Kabupaten Z" value={locationForm.kabupaten || ''} onChange={(e) => setLocationForm({ ...locationForm, kabupaten: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kuota</label>
            <input type="number" placeholder="Contoh: 50" value={locationForm.kuota || ''} onChange={(e) => setLocationForm({ ...locationForm, kuota: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
          </div>

          <button
            onClick={handleGeocode}
            disabled={isGeocoding}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition font-medium flex items-center justify-center gap-2"
          >
            {isGeocoding ? <LoaderIcon size={16} className="animate-spin" /> : '📍'}
            {isGeocoding ? 'Mencari Lokasi...' : 'Cari Koordinat (Geocode)'}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
              <input type="number" step="0.00000001" placeholder="Contoh: -0.5432" value={locationForm.latitude || ''} onChange={(e) => setLocationForm({ ...locationForm, latitude: e.target.value ? parseFloat(e.target.value) : '' })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
              <input type="number" step="0.00000001" placeholder="Contoh: 101.4321" value={locationForm.longitude || ''} onChange={(e) => setLocationForm({ ...locationForm, longitude: e.target.value ? parseFloat(e.target.value) : '' })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm" />
            </div>
          </div>
        </div>

          <div className="mt-3">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={!!locationForm.fakes} onChange={(e) => setLocationForm({ ...locationForm, fakes: e.target.checked })} />
              <span className="text-sm">Dekat fasilitas kesehatan (Faskes)</span>
              {checkingFakes && <span className="ml-2 text-xs text-gray-500">Mengecek...</span>}
            </label>
          </div>

        <div className="flex gap-3 mt-8">
          <button onClick={() => { setShow(false); setLocationForm({ lokasi: '', desa_kecamatan: '', kabupaten: '', kuota: '', latitude: '', longitude: '' }); }} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">Batal</button>
          <button onClick={onSave} className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition font-medium">{editingId ? 'Update' : 'Simpan'}</button>
        </div>
      </div>
    </div>
  );
}
