import React, { useState, useEffect, useRef } from 'react';
import { LoaderIcon, ChevronDown, X } from 'lucide-react';
import '../styles/LocationModal.css';

// Combo-box style Select: single input for both display and search
function SearchableSelect({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  disabled, 
  loading,
  valueKey = 'id',
  labelKey = 'nama'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Find selected option label
  const selectedOption = options.find(opt => opt[valueKey] === value);
  const displayValue = selectedOption ? selectedOption[labelKey] : '';

  // Sync input value with selected value when closed
  useEffect(() => {
    if (!isOpen) {
      setInputValue(displayValue);
    }
  }, [isOpen, displayValue]);

  // Filter options based on input
  const filteredOptions = options.filter(opt => 
    opt[labelKey].toLowerCase().includes(inputValue.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setInputValue(displayValue);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [displayValue]);

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
      setInputValue('');
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleSelect = (opt) => {
    onChange(opt[valueKey]);
    setInputValue(opt[labelKey]);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setInputValue(displayValue);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Combined input/display field */}
      <div className={`w-full border rounded-lg flex items-center transition ${
        disabled 
          ? 'bg-gray-100 border-gray-200' 
          : 'bg-white border-gray-300 hover:border-blue-400'
      } ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`flex-1 px-4 py-2 bg-transparent outline-none text-sm ${
            disabled ? 'cursor-not-allowed text-gray-400' : 'text-gray-800'
          }`}
        />
        <div className="flex items-center gap-1 pr-3">
          {value && !disabled && (
            <button
              onClick={handleClear}
              className="p-1 hover:bg-gray-200 rounded-full transition"
              type="button"
            >
              <X size={14} className="text-gray-400" />
            </button>
          )}
          {loading ? (
            <LoaderIcon size={16} className="animate-spin text-blue-500" />
          ) : (
            <ChevronDown 
              size={18} 
              className={`text-gray-400 transition-transform cursor-pointer ${isOpen ? 'rotate-180' : ''}`}
              onClick={() => !disabled && setIsOpen(!isOpen)}
            />
          )}
        </div>
      </div>

      {/* Dropdown options */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-52 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <div
                key={opt[valueKey]}
                onClick={() => handleSelect(opt)}
                className={`px-4 py-2.5 cursor-pointer transition text-sm ${
                  opt[valueKey] === value
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                {opt[labelKey]}
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-gray-400 text-center">
              {loading ? 'Memuat...' : 'Tidak ditemukan'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function LocationModal({ show, setShow, locationForm, setLocationForm, onSave, editingId, inline = false, onCancel }) {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [distanceResult, setDistanceResult] = useState(null);
  
  // Local state untuk kontak person agar tidak re-render parent setiap keystroke
  const [kontakNama, setKontakNama] = useState('');
  const [kontakTelepon, setKontakTelepon] = useState('');

  // Periode untuk display
  const [periodeList, setPeriodeList] = useState([]);

  // Wilayah dropdown data
  const [provinsiList, setProvinsiList] = useState([]);
  const [kabupatenList, setKabupatenList] = useState([]);
  const [kecamatanList, setKecamatanList] = useState([]);
  const [desaList, setDesaList] = useState([]);
  
  // Loading states for dropdowns
  const [loadingProvinsi, setLoadingProvinsi] = useState(false);
  const [loadingKabupaten, setLoadingKabupaten] = useState(false);
  const [loadingKecamatan, setLoadingKecamatan] = useState(false);
  const [loadingDesa, setLoadingDesa] = useState(false);

  // Ref to track if auto-geocode already ran for current selection
  const lastGeocodedRef = useRef('');
  
  // Ref to track previous show state to detect modal open
  const prevShowRef = useRef(show);
  
  // Sync local kontak state dengan locationForm ONLY when modal first opens
  useEffect(() => {
    // Detect modal opening (show changed from false to true)
    if (show && !prevShowRef.current) {
      setKontakNama(locationForm.kontak_nama || '');
      setKontakTelepon(locationForm.kontak_telepon || '');
    }
    
    // Update ref for next render
    prevShowRef.current = show;
  }, [show]);

  // Fetch provinsi and periode on mount
  useEffect(() => {
    if (show) {
      fetchProvinsi();
      fetchPeriodeList();
    }
  }, [show]);

  const fetchPeriodeList = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/periode');
      if (res.ok) {
        const data = await res.json();
        setPeriodeList(data);
      }
    } catch (err) {
      console.error('Error fetching periode:', err);
    }
  };

  // Get current periode name
  const getCurrentPeriodeName = () => {
    if (!locationForm.id_periode) return null;
    const periode = periodeList.find(p => String(p.id_periode) === String(locationForm.id_periode));
    return periode ? periode.nama_periode : null;
  };

  // When editing, load cascade data based on existing values
  useEffect(() => {
    if (show && editingId && locationForm.id_provinsi) {
      fetchKabupaten(locationForm.id_provinsi).then(() => {
        if (locationForm.id_kabupaten) {
          fetchKecamatan(locationForm.id_kabupaten).then(() => {
            if (locationForm.id_kecamatan) {
              fetchDesa(locationForm.id_kecamatan);
            }
          });
        }
      });
    }
  }, [show, editingId]);

  // Auto-geocode when desa is selected (only when desa changes, not lokasi)
  useEffect(() => {
    const doAutoGeocode = async () => {
      if (!locationForm.id_desa) return;
      
      const selectedDesa = desaList.find(d => d.id_desa === locationForm.id_desa);
      const selectedKecamatan = kecamatanList.find(k => k.id_kecamatan === locationForm.id_kecamatan);
      const selectedKabupaten = kabupatenList.find(k => k.id_kabupaten === locationForm.id_kabupaten);
      
      if (!selectedDesa || !selectedKecamatan || !selectedKabupaten) return;

      const geocodeKey = `${locationForm.id_desa}`;
      if (lastGeocodedRef.current === geocodeKey) return;

      setIsGeocoding(true);
      try {
        const response = await fetch('http://localhost:4000/api/geocode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lokasi: locationForm.lokasi || selectedDesa?.nama,
            desa_kecamatan: `${selectedDesa?.nama} / ${selectedKecamatan?.nama}`,
            kabupaten: selectedKabupaten?.nama
          })
        });

        if (response.ok) {
          const data = await response.json();
          setLocationForm(prev => ({
            ...prev,
            latitude: data.latitude,
            longitude: data.longitude
          }));
          lastGeocodedRef.current = geocodeKey;
          setDistanceResult(null);
        }
      } catch (error) {
        console.error('Auto-geocode error:', error);
      } finally {
        setIsGeocoding(false);
      }
    };

    const timer = setTimeout(doAutoGeocode, 500);
    return () => clearTimeout(timer);
  }, [locationForm.id_desa, desaList, kecamatanList, kabupatenList]);

  const fetchProvinsi = async () => {
    setLoadingProvinsi(true);
    try {
      const response = await fetch('http://localhost:4000/api/wilayah/provinsi');
      if (response.ok) {
        const data = await response.json();
        setProvinsiList(data);
      }
    } catch (error) {
      console.error('Error fetching provinsi:', error);
    } finally {
      setLoadingProvinsi(false);
    }
  };

  const fetchKabupaten = async (id_provinsi) => {
    if (!id_provinsi) {
      setKabupatenList([]);
      return;
    }
    setLoadingKabupaten(true);
    try {
      const response = await fetch(`http://localhost:4000/api/wilayah/kabupaten/${id_provinsi}`);
      if (response.ok) {
        const data = await response.json();
        setKabupatenList(data);
      }
    } catch (error) {
      console.error('Error fetching kabupaten:', error);
    } finally {
      setLoadingKabupaten(false);
    }
  };

  const fetchKecamatan = async (id_kabupaten) => {
    if (!id_kabupaten) {
      setKecamatanList([]);
      return;
    }
    setLoadingKecamatan(true);
    try {
      const response = await fetch(`http://localhost:4000/api/wilayah/kecamatan/${id_kabupaten}`);
      if (response.ok) {
        const data = await response.json();
        setKecamatanList(data);
      }
    } catch (error) {
      console.error('Error fetching kecamatan:', error);
    } finally {
      setLoadingKecamatan(false);
    }
  };

  const fetchDesa = async (id_kecamatan) => {
    if (!id_kecamatan) {
      setDesaList([]);
      return;
    }
    setLoadingDesa(true);
    try {
      const response = await fetch(`http://localhost:4000/api/wilayah/desa/${id_kecamatan}`);
      if (response.ok) {
        const data = await response.json();
        setDesaList(data);
      }
    } catch (error) {
      console.error('Error fetching desa:', error);
    } finally {
      setLoadingDesa(false);
    }
  };

  const handleProvinsiChange = (id_provinsi) => {
    setLocationForm(prev => ({
      ...prev,
      id_provinsi,
      id_kabupaten: '',
      id_kecamatan: '',
      id_desa: '',
      latitude: '',
      longitude: ''
    }));
    setKabupatenList([]);
    setKecamatanList([]);
    setDesaList([]);
    lastGeocodedRef.current = '';
    if (id_provinsi) {
      fetchKabupaten(id_provinsi);
    }
  };

  const handleKabupatenChange = (id_kabupaten) => {
    setLocationForm(prev => ({
      ...prev,
      id_kabupaten,
      id_kecamatan: '',
      id_desa: '',
      latitude: '',
      longitude: ''
    }));
    setKecamatanList([]);
    setDesaList([]);
    lastGeocodedRef.current = '';
    if (id_kabupaten) {
      fetchKecamatan(id_kabupaten);
    }
  };

  const handleKecamatanChange = (id_kecamatan) => {
    setLocationForm(prev => ({
      ...prev,
      id_kecamatan,
      id_desa: '',
      latitude: '',
      longitude: ''
    }));
    setDesaList([]);
    lastGeocodedRef.current = '';
    if (id_kecamatan) {
      fetchDesa(id_kecamatan);
    }
  };

  const handleDesaChange = (id_desa) => {
    lastGeocodedRef.current = '';
    setLocationForm(prev => ({
      ...prev,
      id_desa,
      latitude: '',
      longitude: ''
    }));
  };

  const handleCalculateDistance = async () => {
    console.log('handleCalculateDistance - locationForm:', locationForm);
    console.log('handleCalculateDistance - latitude:', locationForm.latitude, 'longitude:', locationForm.longitude);
    
    if (!locationForm.latitude || !locationForm.longitude) {
      alert('Koordinat belum tersedia. Tunggu auto-geocode selesai atau isi manual.');
      return;
    }

    setIsCalculatingDistance(true);
    try {
      // Convert to numbers to ensure proper format (handles locale issues)
      const lat = parseFloat(String(locationForm.latitude).replace(',', '.'));
      const lon = parseFloat(String(locationForm.longitude).replace(',', '.'));
      
      console.log('Sending to backend:', { lat, lon, lokasi: locationForm.lokasi, editingId });
      
      let response;
      if (editingId) {
        // Lokasi sudah tersimpan - gunakan endpoint yang update database
        response = await fetch(`http://localhost:4000/api/locations/${editingId}/calculate-distance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: lat,
            longitude: lon,
            lokasi: locationForm.lokasi
          })
        });
      } else {
        // Lokasi baru - gunakan endpoint preview (tidak simpan ke database)
        response = await fetch('http://localhost:4000/api/calculate-distance-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: lat,
            longitude: lon,
            lokasi: locationForm.lokasi,
            id_kabupaten: locationForm.id_kabupaten
          })
        });
      }

      if (response.ok) {
        const data = await response.json();
        setDistanceResult({
          jarak: data.jarak_ke_puskesmas,
          puskesmas: data.puskesmas_terdekat,
          kategori: data.kategori_jarak
        });
        const previewNote = data.preview ? '\n\n⚠️ Ini hanya preview. Klik "Simpan" untuk menyimpan lokasi.' : '';
        alert(`✅ Perhitungan Selesai!\n\nPuskesmas Terdekat: ${data.puskesmas_terdekat}\nJarak: ${data.jarak_ke_puskesmas?.toFixed(2)} km\nKategori: ${data.kategori_jarak}${previewNote}`);
      } else {
        const error = await response.json();
        alert('Gagal menghitung jarak: ' + error.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setIsCalculatingDistance(false);
    }
  };

  const resetForm = () => {
    setLocationForm({ 
      lokasi: '', 
      id_provinsi: '', 
      id_kabupaten: '', 
      id_kecamatan: '', 
      id_desa: '', 
      latitude: '', 
      longitude: '',
      id_periode: '',
      kontak_person: '',
      kontak_nama: '',
      kontak_telepon: ''
    });
    setKontakNama('');
    setKontakTelepon('');
    setKabupatenList([]);
    setKecamatanList([]);
    setDesaList([]);
    setDistanceResult(null);
    lastGeocodedRef.current = '';
  };

  if (!show) return null;
  
  // Content component that can be used inline or in modal
  const FormContent = () => (
    <div className={inline ? "" : "bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"} onClick={inline ? undefined : (e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-5">
        <h4 className="text-xl font-bold text-gray-800">{editingId ? 'Edit Lokasi' : 'Tambah Lokasi Baru'}</h4>
        {getCurrentPeriodeName() && (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
            📅 {getCurrentPeriodeName()}
          </span>
        )}
        {!getCurrentPeriodeName() && !editingId && (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
            ⚠️ Tidak ada periode dipilih
          </span>
        )}
      </div>

        <div className="space-y-4">
          {/* Provinsi & Kabupaten - 2 kolom */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Provinsi</label>
              <SearchableSelect
                value={locationForm.id_provinsi || ''}
                onChange={handleProvinsiChange}
                options={provinsiList}
                valueKey="id_provinsi"
                labelKey="nama"
                placeholder="-- Pilih Provinsi --"
                disabled={false}
                loading={loadingProvinsi}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kabupaten/Kota</label>
              <SearchableSelect
                value={locationForm.id_kabupaten || ''}
                onChange={handleKabupatenChange}
                options={kabupatenList}
                valueKey="id_kabupaten"
                labelKey="nama"
                placeholder="-- Pilih Kabupaten --"
                disabled={!locationForm.id_provinsi}
                loading={loadingKabupaten}
              />
            </div>
          </div>

          {/* Kecamatan & Desa - 2 kolom */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kecamatan</label>
              <SearchableSelect
                value={locationForm.id_kecamatan || ''}
                onChange={handleKecamatanChange}
                options={kecamatanList}
                valueKey="id_kecamatan"
                labelKey="nama"
                placeholder="-- Pilih Kecamatan --"
                disabled={!locationForm.id_kabupaten}
                loading={loadingKecamatan}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Desa/Kelurahan</label>
              <SearchableSelect
                value={locationForm.id_desa || ''}
                onChange={handleDesaChange}
                options={desaList}
                valueKey="id_desa"
                labelKey="nama"
                placeholder="-- Pilih Desa --"
                disabled={!locationForm.id_kecamatan}
                loading={loadingDesa}
              />
            </div>
          </div>

          {/* Dusun/Lokasi (manual input) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nama Dusun/Lokasi (opsional)</label>
            <input 
              type="text" 
              placeholder="Contoh: Dusun Maju Jaya" 
              value={locationForm.lokasi || ''} 
              onChange={(e) => {
                setLocationForm(prev => ({ ...prev, lokasi: e.target.value }));
              }} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" 
            />
          </div>

          {/* Kontak Person - Split into 2 inputs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kontak Person <span className="text-gray-500 font-normal">(Nama Dukuh & No. Telp)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input 
                  type="text"
                  placeholder="Nama" 
                  value={kontakNama} 
                  onChange={(e) => setKontakNama(e.target.value)} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" 
                />
              </div>
              <div>
                <input 
                  type="text"
                  placeholder="No.Telepon" 
                  value={kontakTelepon} 
                  onChange={(e) => setKontakTelepon(e.target.value)} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" 
                />
              </div>
            </div>
          </div>

          {/* Auto-geocoding indicator */}
          {isGeocoding && (
            <div className="flex items-center gap-2 text-blue-600 text-sm animate-pulse">
              <LoaderIcon size={16} className="animate-spin" />
              <span>Mencari koordinat otomatis...</span>
            </div>
          )}

          {/* Koordinat hasil geocode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
              <input 
                type="number" 
                step="0.00000001" 
                placeholder="Contoh: -0.5432" 
                value={locationForm.latitude || ''} 
                onChange={(e) => setLocationForm(prev => ({ ...prev, latitude: e.target.value ? parseFloat(e.target.value) : '' }))} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
              <input 
                type="number" 
                step="0.00000001" 
                placeholder="Contoh: 101.4321" 
                value={locationForm.longitude || ''} 
                onChange={(e) => setLocationForm(prev => ({ ...prev, longitude: e.target.value ? parseFloat(e.target.value) : '' }))} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm" 
              />
            </div>
          </div>

          {/* Tombol Hitung Jarak Puskesmas - PREVIEW ONLY */}
          <button
            onClick={handleCalculateDistance}
            disabled={isCalculatingDistance || !locationForm.latitude || !locationForm.longitude}
            className={`w-full px-4 py-2 rounded-lg transition font-medium flex items-center justify-center gap-2 ${
              !locationForm.latitude || !locationForm.longitude
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg'
            }`}
            title={!locationForm.latitude || !locationForm.longitude ? 'Koordinat belum tersedia' : 'Preview jarak ke puskesmas (tidak menyimpan)'}
          >
            {isCalculatingDistance ? (
              <>
                <LoaderIcon size={16} className="animate-spin" />
                Menghitung Preview...
              </>
            ) : (
              '🔍 Preview Jarak Faskes (Opsional)'
            )}
          </button>

          {/* Display hasil perhitungan jarak */}
          {distanceResult && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-xs text-emerald-800 font-semibold mb-1">✅ Hasil Perhitungan:</p>
              <p className="text-xs text-emerald-700">
                📍 Puskesmas: <strong>{distanceResult.puskesmas}</strong><br/>
                📏 Jarak: <strong>{distanceResult.jarak?.toFixed(2)} km</strong><br/>
                🏷️ Kategori: <strong>{distanceResult.kategori}</strong>
              </p>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
          <p className="text-xs text-blue-700">
            💡 <strong>Info:</strong> Ketik di dropdown untuk mencari. Koordinat akan dicari otomatis setelah memilih Desa. {
              locationForm.latitude && locationForm.longitude 
              ? '✨ Jarak ke puskesmas akan dihitung otomatis oleh sistem saat Anda menyimpan lokasi.' 
              : 'Setelah koordinat ditemukan, klik Simpan dan sistem akan menghitung jarak ke puskesmas secara otomatis.'
            }
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <button 
            onClick={() => { 
              if (inline && onCancel) {
                onCancel();
              } else {
                setShow(false);
              }
              resetForm();
            }} 
            className="flex-1 px-2 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            disabled={isSaving}
          >
            Batal
          </button>
          <button 
            onClick={async () => {
              setIsSaving(true);
              try {
                // Gabungkan kontak_nama dan kontak_telepon menjadi kontak_person sebelum save
                const namaValue = kontakNama.trim();
                const teleponValue = kontakTelepon.trim();
                let kontakPerson = '';
                
                if (namaValue && teleponValue) {
                  kontakPerson = `${namaValue} - ${teleponValue}`;
                } else if (namaValue) {
                  kontakPerson = namaValue;
                } else if (teleponValue) {
                  kontakPerson = teleponValue;
                }
                
                // Update locationForm dengan kontak_person yang sudah digabung
                const updatedForm = { 
                  ...locationForm, 
                  kontak_person: kontakPerson,
                  kontak_nama: namaValue,
                  kontak_telepon: teleponValue
                };
                setLocationForm(updatedForm);
                
                // Tunggu sebentar agar react state update selesai
                await new Promise(resolve => setTimeout(resolve, 0));
                
                await onSave();
                setDistanceResult(null);
              } finally {
                setIsSaving(false);
              }
            }} 
            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition font-medium flex items-center justify-center gap-2"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <LoaderIcon size={16} className="animate-spin" />
                {editingId ? 'Mengupdate...' : 'Menyimpan...'}
              </>
            ) : (
              editingId ? 'Update' : 'Simpan'
            )}
          </button>
        </div>
      </div>
  );
  
  // Return inline content or modal-wrapped content
  if (inline) {
    return <FormContent />;
  }
  
  return (
    <div 
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShow(false);
          resetForm();
        }
      }}
    >
      <FormContent />
    </div>
  );
}
