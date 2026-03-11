import React, { useState, useEffect, useContext } from 'react';
import { MapIcon, Trash2Icon, Edit2Icon, LoaderIcon, SearchIcon, UploadIcon, ArrowUpDownIcon, FilterIcon, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MapPin, Info, X, Calendar, Settings, Calculator, ArrowLeft, FileSpreadsheet, Upload } from 'lucide-react';
import { ThemeContext } from '../App';
import PeriodeModal from './PeriodeModal';
import LocationModal from './LocationModal';
import '../styles/Lokasi.css';
import API_BASE_URL from '../config/api';

export default function Lokasi({ setShowLocationModal, locationData, setLocationData, setLocationForm, setEditingId, lokasiViewMode, setLokasiViewMode, locationForm, editingId }) {
  const { isDarkMode } = useContext(ThemeContext);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState(() => {
    // Load from localStorage or default to 'default' (original import order)
    return localStorage.getItem('lokasi_sortOption') || 'default';
  });
  
  // Periode filter state
  const [periodeFilter, setPeriodeFilter] = useState(() => {
    return localStorage.getItem('lokasi_periodeFilter') || '';
  });
  const [periodeList, setPeriodeList] = useState([]);
  
  // Provinsi & Kabupaten filter states
  const [provinsiFilter, setProvinsiFilter] = useState(() => {
    return localStorage.getItem('lokasi_provinsiFilter') || '';
  });
  const [kabupatenFilter, setKabupatenFilter] = useState(() => {
    return localStorage.getItem('lokasi_kabupatenFilter') || '';
  });
  
  // Dropdown data for filters
  const [provinsiList, setProvinsiList] = useState([]);
  const [kabupatenList, setKabupatenList] = useState([]);
  
  const [showFaskesInfo, setShowFaskesInfo] = useState(false);
  const [showPeriodeModal, setShowPeriodeModal] = useState(false);
  const [isCalculatingDistances, setIsCalculatingDistances] = useState(false);
  
  // Import modal states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importPeriode, setImportPeriode] = useState('');
  
  // Pagination & Selection states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    // Load from localStorage or default to 25
    const saved = localStorage.getItem('lokasi_itemsPerPage');
    return saved ? parseInt(saved, 10) : 25;
  });
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Koordinat kampus (bisa disesuaikan dengan koordinat kampus sebenarnya)
  const KAMPUS_LAT = -7.782; // Lokasi UIN Sunan Kalijaga Yogyakarta
  const KAMPUS_LNG = 100.395;

  // Fetch locations dari backend (with periode filter)
  useEffect(() => {
    fetchLocations();
  }, [periodeFilter]);
  
  // Save sortOption to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('lokasi_sortOption', sortOption);
  }, [sortOption]);
  
  // Save periodeFilter to localStorage
  useEffect(() => {
    localStorage.setItem('lokasi_periodeFilter', periodeFilter);
  }, [periodeFilter]);
  
  // Save provinsiFilter to localStorage
  useEffect(() => {
    localStorage.setItem('lokasi_provinsiFilter', provinsiFilter);
  }, [provinsiFilter]);
  
  // Save kabupatenFilter to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('lokasi_kabupatenFilter', kabupatenFilter);
  }, [kabupatenFilter]);
  
  // Fetch periode list on mount
  useEffect(() => {
    const fetchPeriode = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/periode`);
        if (response.ok) {
          const data = await response.json();
          setPeriodeList(data);
          
          // Validate current filter - if periode no longer exists, reset to active
          if (periodeFilter) {
            const exists = data.find(p => String(p.id_periode) === String(periodeFilter));
            if (!exists) {
              console.log('Saved periode no longer exists, resetting to active');
              localStorage.removeItem('lokasi_periodeFilter');
              const active = data.find(p => p.is_active);
              if (active) {
                setPeriodeFilter(String(active.id_periode));
              } else {
                setPeriodeFilter('');
              }
              return;
            }
          }
          
          // Auto-select active periode if no filter set
          if (!periodeFilter) {
            const active = data.find(p => p.is_active);
            if (active) {
              setPeriodeFilter(String(active.id_periode));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching periode:', error);
      }
    };
    fetchPeriode();
  }, []);
  
  // Fetch provinsi list on mount
  useEffect(() => {
    const fetchProvinsi = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/wilayah/provinsi`);
        if (response.ok) {
          const data = await response.json();
          setProvinsiList(data);
        }
      } catch (error) {
        console.error('Error fetching provinsi:', error);
      }
    };
    fetchProvinsi();
  }, []);
  
  // Fetch kabupaten when provinsiFilter changes
  useEffect(() => {
    const fetchKabupaten = async () => {
      if (!provinsiFilter) {
        setKabupatenList([]);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/api/wilayah/kabupaten/${provinsiFilter}`);
        if (response.ok) {
          const data = await response.json();
          setKabupatenList(data);
        }
      } catch (error) {
        console.error('Error fetching kabupaten:', error);
      }
    };
    fetchKabupaten();
    // Reset kabupaten filter when provinsi changes
    setKabupatenFilter('');
  }, [provinsiFilter]);
  
  // Save itemsPerPage to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('lokasi_itemsPerPage', itemsPerPage.toString());
  }, [itemsPerPage]);

  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      let url = `${API_BASE_URL}/api/locations-with-distance`;
      const params = [];
      if (periodeFilter) {
        params.push(`id_periode=${periodeFilter}`);
      }
      // Add cache buster to ensure fresh data
      params.push(`_=${Date.now()}`);
      if (params.length > 0) {
        url += '?' + params.join('&');
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setLocationData(data);
        setSelectedIds([]); // Reset selection after fetch
      } else {
        alert('Gagal mengambil data lokasi');
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      alert('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Selection handlers
  const handleSelectAll = (data) => {
    if (selectedIds.length === data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map(loc => loc.id_lokasi));
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      alert('Pilih lokasi yang ingin dihapus terlebih dahulu');
      return;
    }

    if (!window.confirm(`Yakin ingin menghapus ${selectedIds.length} lokasi yang dipilih?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const deletePromises = selectedIds.map(id =>
        fetch(`${API_BASE_URL}/lokasi/${id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      alert(`Berhasil menghapus ${selectedIds.length} lokasi`);
      setSelectedIds([]);
      fetchLocations();
    } catch (error) {
      alert('Error menghapus lokasi: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function untuk menghitung jarak (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius bumi dalam km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getSortedData = () => {
    if (!locationData) return [];
    let filtered = locationData;
    
    // Filter berdasarkan search query (lokasi, desa, kecamatan, kabupaten)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((loc) =>
        (loc.lokasi && loc.lokasi.toLowerCase().includes(query)) ||
        (loc.desa && loc.desa.toLowerCase().includes(query)) ||
        (loc.kecamatan && loc.kecamatan.toLowerCase().includes(query)) ||
        (loc.kabupaten && loc.kabupaten.toLowerCase().includes(query))
      );
    }
    
    // Filter berdasarkan provinsi
    if (provinsiFilter.trim()) {
      filtered = filtered.filter((loc) =>
        loc.id_provinsi && String(loc.id_provinsi) === String(provinsiFilter)
      );
    }
    
    // Filter berdasarkan kabupaten
    if (kabupatenFilter.trim()) {
      filtered = filtered.filter((loc) =>
        loc.id_kabupaten && String(loc.id_kabupaten) === String(kabupatenFilter)
      );
    }
    
    // Sorting berdasarkan pilihan
    let sorted = [...filtered];
    
    if (sortOption === 'default') {
      // No sorting - keep original import order from Excel
      // Data stays as it is in filtered array
    } else if (sortOption === 'kabupaten-az') {
      // Sort berdasarkan kabupaten A-Z, kemudian kecamatan A-Z, kemudian lokasi A-Z
      sorted.sort((a, b) => {
        const kabCompare = (a.kabupaten || '').localeCompare(b.kabupaten || '');
        if (kabCompare !== 0) return kabCompare;
        const kecCompare = (a.kecamatan || '').localeCompare(b.kecamatan || '');
        if (kecCompare !== 0) return kecCompare;
        return (a.lokasi || '').localeCompare(b.lokasi || '');
      });
    } else if (sortOption === 'kabupaten-za') {
      // Sort berdasarkan kabupaten Z-A, kemudian kecamatan Z-A, kemudian lokasi Z-A
      sorted.sort((a, b) => {
        const kabCompare = (b.kabupaten || '').localeCompare(a.kabupaten || '');
        if (kabCompare !== 0) return kabCompare;
        const kecCompare = (b.kecamatan || '').localeCompare(a.kecamatan || '');
        if (kecCompare !== 0) return kecCompare;
        return (b.lokasi || '').localeCompare(a.lokasi || '');
      });
    }
    
    return sorted;
  };

  // Get paginated data
  const getPaginatedData = () => {
    const sorted = getSortedData();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sorted.slice(startIndex, endIndex);
  };

  // Calculate total pages
  const getTotalPages = () => {
    const sorted = getSortedData();
    return Math.ceil(sorted.length / itemsPerPage);
  };

  // Reset to page 1 when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, provinsiFilter, kabupatenFilter, sortOption, itemsPerPage]);
  const handleEdit = (location) => {
    // Parse kontak_person menjadi kontak_nama dan kontak_telepon
    let kontakNama = '';
    let kontakTelepon = '';
    
    if (location.kontak_person) {
      // Cek apakah ada format "Nama - Telepon"
      const parts = location.kontak_person.split(' - ');
      if (parts.length === 2) {
        kontakNama = parts[0].trim();
        kontakTelepon = parts[1].trim();
      } else {
        // Jika tidak ada separator, masukkan semua ke nama
        kontakNama = location.kontak_person.trim();
      }
    }
    
    setLocationForm({
      lokasi: location.lokasi || '',
      id_provinsi: location.id_provinsi || '',
      id_kabupaten: location.id_kabupaten || '',
      id_kecamatan: location.id_kecamatan || '',
      id_desa: location.id_desa || '',
      latitude: location.latitude,
      longitude: location.longitude,
      id_periode: location.id_periode || '',
      kontak_person: location.kontak_person || '',
      kontak_nama: kontakNama,
      kontak_telepon: kontakTelepon
    });
    setEditingId(location.id_lokasi);
    setLokasiViewMode('edit');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus lokasi ini?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/lokasi/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        alert('Lokasi berhasil dihapus');
        fetchLocations();
      } else {
        alert('Gagal menghapus lokasi');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // Handle import modal
  const handleImportClick = () => {
    // Set default import periode to current filter if available
    if (periodeFilter) {
      setImportPeriode(periodeFilter);
    }
    setShowImportModal(true);
  };
  
  const handleImportFile = async () => {
    if (!importFile) {
      alert('Pilih file Excel terlebih dahulu!');
      return;
    }
    
    if (!importPeriode) {
      const confirmWithoutPeriode = window.confirm(
        '⚠️ Tidak ada periode yang dipilih!\n\n' +
        'Lokasi yang diimpor tidak akan masuk ke periode manapun.\n\n' +
        'Apakah Anda yakin ingin melanjutkan?\n\n' +
        '(Disarankan: Pilih periode terlebih dahulu sebelum import)'
      );
      if (!confirmWithoutPeriode) return;
    }
    
    setIsImporting(true);
    setImportResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      if (importPeriode) {
        formData.append('id_periode', importPeriode);
      }
      
      const response = await fetch(`${API_BASE_URL}/lokasi/import`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        const selectedPeriode = periodeList.find(p => String(p.id_periode) === String(importPeriode));
        const periodeInfo = selectedPeriode ? ` ke "${selectedPeriode.nama_periode}"` : '';
        
        setImportResult({
          success: true,
          message: `${data.inserted || 0} lokasi berhasil ditambahkan${periodeInfo}`,
          total: data.inserted || 0,
          has_coordinates: data.has_coordinates || 0
        });
        fetchLocations();
      } else {
        const err = await response.json();
        setImportResult({
          success: false,
          message: err.error || 'Import gagal'
        });
      }
    } catch (err) {
      console.error('Import error:', err);
      setImportResult({
        success: false,
        message: 'Error: ' + err.message
      });
    } finally {
      setIsImporting(false);
    }
  };
  
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const fd = new FormData();
    fd.append('file', file);
    // Include selected periode for imported locations
    if (periodeFilter) {
      fd.append('id_periode', periodeFilter);
    }
    setIsLoading(true);
    
    const selectedPeriode = periodeList.find(p => String(p.id_periode) === String(periodeFilter));
    
    try {
      const res = await fetch(`${API_BASE_URL}/lokasi/import`, { 
        method: 'POST', 
        body: fd 
      });
      
      if (res.ok) {
        const data = await res.json();
        const periodeInfo = selectedPeriode ? ` ke "${selectedPeriode.nama_periode}"` : '';
        const hasCoords = data.has_coordinates || 0;
        let message = `✅ Import berhasil!\n\n${data.inserted || 0} lokasi ditambahkan${periodeInfo}.`;
        if (hasCoords > 0) {
          message += `\n\n💡 ${hasCoords} lokasi memiliki koordinat.\nGunakan tombol "HITUNG JARAK FASKES" untuk menghitung jarak ke puskesmas.`;
        }
        alert(message);
        fetchLocations();
      } else {
        const err = await res.json();
        alert('Import gagal: ' + (err.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error import: ' + err.message);
    } finally {
      setIsLoading(false);
      e.target.value = null;
    }
  };
  
  const handleRecalculateDistances = async () => {
    if (!window.confirm('⏱️ Perhitungan jarak ke puskesmas membutuhkan waktu sekitar 3 detik per lokasi.\n\nProses ini berjalan di background dan bisa memakan waktu beberapa menit untuk banyak lokasi.\n\nLanjutkan?')) {
      return;
    }
    
    setIsCalculatingDistances(true);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/recalculate-distances`, {
        method: 'POST'
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(`✅ Perhitungan selesai!\n\n${data.success_count || 0} lokasi berhasil dihitung jarak puskesmasnya.`);
        fetchLocations();
      } else {
        const err = await res.json();
        alert('Perhitungan gagal: ' + (err.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsCalculatingDistances(false);
    }
  };

  // Local state for inline form
  const [formData, setFormData] = useState({
    lokasi: '',
    id_provinsi: '',
    id_kabupaten: '',
    id_kecamatan: '',
    id_desa: '',
    latitude: '',
    longitude: '',
    id_periode: '',
    kontak_nama: '',
    kontak_telepon: ''
  });
  const [formProvinsiList, setFormProvinsiList] = useState([]);
  const [formKabupatenList, setFormKabupatenList] = useState([]);
  const [formKecamatanList, setFormKecamatanList] = useState([]);
  const [formDesaList, setFormDesaList] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isCalculatingFaskes, setIsCalculatingFaskes] = useState(false);
  const [faskesResult, setFaskesResult] = useState(null);

  // Load form data when editingId changes
  useEffect(() => {
    if (lokasiViewMode === 'edit' && locationForm) {
      setFormData({
        lokasi: locationForm.lokasi || '',
        id_provinsi: locationForm.id_provinsi || '',
        id_kabupaten: locationForm.id_kabupaten || '',
        id_kecamatan: locationForm.id_kecamatan || '',
        id_desa: locationForm.id_desa || '',
        latitude: locationForm.latitude || '',
        longitude: locationForm.longitude || '',
        id_periode: locationForm.id_periode || '',
        kontak_nama: locationForm.kontak_nama || '',
        kontak_telepon: locationForm.kontak_telepon || ''
      });
      
      // Load faskes result if exists
      if (locationForm.jarak_ke_puskesmas !== null && locationForm.jarak_ke_puskesmas !== undefined) {
        setFaskesResult({
          success: true,
          jarak: locationForm.jarak_ke_puskesmas,
          nama: locationForm.puskesmas_terdekat,
          kategori: locationForm.kategori_jarak
        });
      } else {
        setFaskesResult(null);
      }
    } else if (lokasiViewMode === 'add') {
      setFormData({
        lokasi: '',
        id_provinsi: '',
        id_kabupaten: '',
        id_kecamatan: '',
        id_desa: '',
        latitude: '',
        longitude: '',
        id_periode: periodeFilter || '',
        kontak_nama: '',
        kontak_telepon: ''
      });
      setFaskesResult(null);
    }
  }, [lokasiViewMode, locationForm, periodeFilter]);

  // Fetch provinsi for form
  useEffect(() => {
    if (lokasiViewMode === 'add' || lokasiViewMode === 'edit') {
      fetch(`${API_BASE_URL}/api/wilayah/provinsi`)
        .then(res => res.json())
        .then(data => setFormProvinsiList(data))
        .catch(err => console.error('Error loading provinsi:', err));
    }
  }, [lokasiViewMode]);

  // Fetch kabupaten when provinsi changes
  useEffect(() => {
    if (formData.id_provinsi && (lokasiViewMode === 'add' || lokasiViewMode === 'edit')) {
      fetch(`${API_BASE_URL}/api/wilayah/kabupaten/${formData.id_provinsi}`)
        .then(res => res.json())
        .then(data => setFormKabupatenList(data))
        .catch(err => console.error('Error loading kabupaten:', err));
    } else {
      setFormKabupatenList([]);
    }
  }, [formData.id_provinsi, lokasiViewMode]);

  // Fetch kecamatan when kabupaten changes
  useEffect(() => {
    if (formData.id_kabupaten && (lokasiViewMode === 'add' || lokasiViewMode === 'edit')) {
      fetch(`${API_BASE_URL}/api/wilayah/kecamatan/${formData.id_kabupaten}`)
        .then(res => res.json())
        .then(data => setFormKecamatanList(data))
        .catch(err => console.error('Error loading kecamatan:', err));
    } else {
      setFormKecamatanList([]);
    }
  }, [formData.id_kabupaten, lokasiViewMode]);

  // Fetch desa when kecamatan changes
  useEffect(() => {
    if (formData.id_kecamatan && (lokasiViewMode === 'add' || lokasiViewMode === 'edit')) {
      fetch(`${API_BASE_URL}/api/wilayah/desa/${formData.id_kecamatan}`)
        .then(res => res.json())
        .then(data => setFormDesaList(data))
        .catch(err => console.error('Error loading desa:', err));
    } else {
      setFormDesaList([]);
    }
  }, [formData.id_kecamatan, lokasiViewMode]);

  // Auto-geocode when desa is selected
  useEffect(() => {
    const autoGeocode = async () => {
      if (!formData.id_desa || !(lokasiViewMode === 'add' || lokasiViewMode === 'edit')) return;
      
      const selectedDesa = formDesaList.find(d => d.id_desa === formData.id_desa);
      const selectedKecamatan = formKecamatanList.find(k => k.id_kecamatan === formData.id_kecamatan);
      const selectedKabupaten = formKabupatenList.find(k => k.id_kabupaten === formData.id_kabupaten);
      
      if (!selectedDesa || !selectedKecamatan || !selectedKabupaten) return;

      setIsGeocoding(true);
      try {
        console.log('🔍 Auto-geocoding:', selectedDesa.nama, selectedKecamatan.nama);
        
        const response = await fetch(`${API_BASE_URL}/api/geocode`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lokasi: formData.lokasi || selectedDesa.nama,
            desa_kecamatan: `${selectedDesa.nama} / ${selectedKecamatan.nama}`,
            kabupaten: selectedKabupaten.nama
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Koordinat ditemukan:', data.latitude, data.longitude);
          
          setFormData(prev => ({
            ...prev,
            latitude: data.latitude,
            longitude: data.longitude
          }));
        }
      } catch (error) {
        console.error('❌ Geocoding error:', error);
      } finally {
        setIsGeocoding(false);
      }
    };

    const timer = setTimeout(autoGeocode, 500);
    return () => clearTimeout(timer);
  }, [formData.id_desa, formData.lokasi, formDesaList, formKecamatanList, formKabupatenList, lokasiViewMode]);

  const handleCalculateFaskes = async () => {
    if (!formData.latitude || !formData.longitude) {
      alert('⚠️ Koordinat belum terisi! Pilih desa terlebih dahulu untuk auto-geocoding.');
      return;
    }

    // Check if location is saved (has id_lokasi)
    if (!editingId) {
      alert('⚠️ Simpan lokasi terlebih dahulu sebelum menghitung jarak faskes.');
      return;
    }

    setIsCalculatingFaskes(true);
    setFaskesResult(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/${editingId}/calculate-distance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: formData.latitude,
          longitude: formData.longitude,
          lokasi: formData.lokasi
        })
      });

      if (response.ok) {
        const result = await response.json();
        setFaskesResult({
          success: true,
          jarak: result.jarak_ke_puskesmas,
          nama: result.puskesmas_terdekat,
          kategori: result.kategori_jarak
        });
      } else {
        const err = await response.json();
        setFaskesResult({
          success: false,
          error: err.error || 'Gagal menghitung jarak'
        });
      }
    } catch (error) {
      setFaskesResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsCalculatingFaskes(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.id_desa) {
      alert('Pilih desa terlebih dahulu!');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        kontak_person: formData.kontak_nama && formData.kontak_telepon 
          ? `${formData.kontak_nama} - ${formData.kontak_telepon}`
          : ''
      };

      const url = editingId 
        ? `${API_BASE_URL}/api/locations/${editingId}`
        : `${API_BASE_URL}/api/locations`;
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        alert(editingId ? 'Lokasi berhasil diupdate!' : 'Lokasi berhasil ditambahkan!');
        
        // Display auto-calculated faskes result if available
        if (result.jarak_ke_puskesmas !== null && result.jarak_ke_puskesmas !== undefined) {
          setFaskesResult({
            success: true,
            jarak: result.jarak_ke_puskesmas,
            nama: result.puskesmas_terdekat,
            kategori: result.kategori_jarak
          });
        }
        
        // If this is a new location, set editingId so user can recalculate faskes later
        if (!editingId && result.id_lokasi) {
          setEditingId(result.id_lokasi);
          setLokasiViewMode('edit');
          
          if (result.jarak_ke_puskesmas) {
            alert(`✅ Lokasi berhasil disimpan dan jarak ke puskesmas otomatis dihitung: ${result.jarak_ke_puskesmas.toFixed(2)} km ke ${result.puskesmas_terdekat}`);
          } else {
            alert('💡 Lokasi berhasil disimpan! Sekarang Anda bisa menghitung jarak ke faskes.');
          }
        } else {
          setLokasiViewMode('list');
          setEditingId(null);
        }
        
        fetchLocations();
      } else {
        const err = await response.json();
        alert('Error: ' + (err.error || 'Gagal menyimpan'));
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      {/* Show form when in add/edit mode */}
      {(lokasiViewMode === 'add' || lokasiViewMode === 'edit') ? (
        <div className={isDarkMode ? "glass-card bg-gray-800/60 border-gray-700 animate-slideInUp" : "glass-card bg-white/60 border-blue-50/50 animate-slideInUp"}>
          {/* Back Button */}
          <button
            onClick={() => {
              setLokasiViewMode('list');
              setEditingId(null);
            }}
            className={`flex items-center gap-2 mb-6 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isDarkMode 
                ? 'text-gray-300 hover:text-white hover:bg-gray-700/50' 
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <ArrowLeft size={18} />
            Kembali ke Daftar Lokasi
          </button>

          {/* Inline Form - Simple & No Focus Issues */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {editingId ? 'Edit Lokasi' : 'Tambah Lokasi Baru'}
            </h3>

            {/* Provinsi */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Provinsi <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.id_provinsi}
                onChange={(e) => setFormData({...formData, id_provinsi: e.target.value, id_kabupaten: '', id_kecamatan: '', id_desa: ''})}
                required
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
              >
                <option value="">-- Pilih Provinsi --</option>
                {formProvinsiList.map(p => (
                  <option key={p.id_provinsi} value={p.id_provinsi}>{p.nama}</option>
                ))}
              </select>
            </div>

            {/* Kabupaten */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Kabupaten/Kota <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.id_kabupaten}
                onChange={(e) => setFormData({...formData, id_kabupaten: e.target.value, id_kecamatan: '', id_desa: ''})}
                required
                disabled={!formData.id_provinsi}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                } disabled:opacity-50`}
              >
                <option value="">-- Pilih Kabupaten --</option>
                {formKabupatenList.map(k => (
                  <option key={k.id_kabupaten} value={k.id_kabupaten}>{k.nama}</option>
                ))}
              </select>
            </div>

            {/* Kecamatan */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Kecamatan <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.id_kecamatan}
                onChange={(e) => setFormData({...formData, id_kecamatan: e.target.value, id_desa: ''})}
                required
                disabled={!formData.id_kabupaten}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                } disabled:opacity-50`}
              >
                <option value="">-- Pilih Kecamatan --</option>
                {formKecamatanList.map(k => (
                  <option key={k.id_kecamatan} value={k.id_kecamatan}>{k.nama}</option>
                ))}
              </select>
            </div>

            {/* Desa */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Desa/Kelurahan <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.id_desa}
                onChange={(e) => setFormData({...formData, id_desa: e.target.value})}
                required
                disabled={!formData.id_kecamatan}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                } disabled:opacity-50`}
              >
                <option value="">-- Pilih Desa --</option>
                {formDesaList.map(d => (
                  <option key={d.id_desa} value={d.id_desa}>{d.nama}</option>
                ))}
              </select>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                💡 Koordinat (lat/long) akan otomatis terisi setelah memilih desa
              </p>
            </div>

            {/* Dusun/Lokasi */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Nama Dusun/Lokasi
              </label>
              <input
                type="text"
                value={formData.lokasi}
                onChange={(e) => setFormData({...formData, lokasi: e.target.value})}
                placeholder="Contoh: Dusun Maju Jaya"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
              />
            </div>

            {/* Kontak Person */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nama Kontak
                </label>
                <input
                  type="text"
                  value={formData.kontak_nama}
                  onChange={(e) => setFormData({...formData, kontak_nama: e.target.value})}
                  placeholder="Nama Dukuh"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  No. Telepon
                </label>
                <input
                  type="text"
                  value={formData.kontak_telepon}
                  onChange={(e) => setFormData({...formData, kontak_telepon: e.target.value})}
                  placeholder="08xx"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>
            </div>

            {/* Koordinat & Faskes Calculation Button */}
            <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-900/30 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <label className={`block text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Koordinat & Jarak Faskes
                </label>
                {editingId && formData.latitude && formData.longitude && (
                  <button
                    type="button"
                    onClick={handleCalculateFaskes}
                    disabled={isCalculatingFaskes}
                    title="Hitung ulang jarak ke puskesmas terdekat"
                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
                  >
                    {isCalculatingFaskes ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Menghitung...
                      </>
                    ) : (
                      <>
                        <Calculator size={14} />
                        {faskesResult ? 'Hitung Ulang' : 'Hitung Jarak'}
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Faskes Calculation Result */}
              {faskesResult && (
                <div className={`mb-3 p-3 rounded-lg ${faskesResult.success ? (isDarkMode ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200') : (isDarkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200')}`}>
                  {faskesResult.success ? (
                    <>
                      <p className={`text-sm font-semibold mb-1 ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>
                        ✅ Jarak ke Puskesmas: {faskesResult.jarak?.toFixed(2)} km
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-green-200' : 'text-green-700'}`}>
                        📍 <strong>{faskesResult.nama}</strong>
                      </p>
                      <div className="mt-2">
                        {(() => {
                          const jarak = faskesResult.jarak;
                          if (jarak < 2) {
                            return (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                &lt; 2 km - Aman untuk sakit
                              </span>
                            );
                          } else if (jarak >= 2 && jarak < 5) {
                            return (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                2-5 km - Aman untuk sakit
                              </span>
                            );
                          } else if (jarak >= 5 && jarak < 10) {
                            return (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                5-10 km - Pertimbangkan hati-hati
                              </span>
                            );
                          } else {
                            return (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                &gt; 10 km - Tidak untuk sakit
                              </span>
                            );
                          }
                        })()}
                      </div>
                    </>
                  ) : (
                    <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-800'}`}>
                      ❌ {faskesResult.error}
                    </p>
                  )}
                </div>
              )}

              {!editingId && (
                <p className={`text-xs mb-3 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                  💡 Simpan lokasi terlebih dahulu untuk menghitung jarak ke puskesmas
                </p>
              )}
              
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Latitude {isGeocoding && <span className="text-blue-500 text-xs">(Mencari otomatis...)</span>}
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                  placeholder="-7.xxxx"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Longitude {isGeocoding && <span className="text-blue-500 text-xs">(Mencari otomatis...)</span>}
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                  placeholder="110.xxxx"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>
            </div>
            </div>

            {/* Periode */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Periode
              </label>
              <select
                value={formData.id_periode}
                onChange={(e) => setFormData({...formData, id_periode: e.target.value})}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
              >
                <option value="">-- Pilih Periode (opsional) --</option>
                {periodeList.map(p => (
                  <option key={p.id_periode} value={p.id_periode}>
                    {p.nama_periode} {p.is_active ? '✓' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setLokasiViewMode('list');
                  setEditingId(null);
                }}
                className={`flex-1 px-4 py-2 border rounded-lg font-medium transition ${
                  isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
              >
                {isSaving ? 'Menyimpan...' : (editingId ? 'Update Lokasi' : 'Simpan Lokasi')}
              </button>
            </div>
          </form>
        </div>
      ) : (
        // Show list when in list mode
        <>
      {/* Main Content Container */}
      <div className={isDarkMode ? "glass-card bg-gray-800/60 border-gray-700 animate-slideInUp" : "glass-card bg-white/60 border-blue-50/50 animate-slideInUp"}>
        
        {/* Controls Bar */}
        <div className="flex flex-wrap gap-3 items-center mb-6">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[200px] max-w-[300px]">
              <SearchIcon size={18} className={isDarkMode ? "absolute left-3 top-2.5 text-gray-500" : "absolute left-3 top-2.5 text-gray-400"} />
              <input
                type="text"
                placeholder="Cari desa, kecamatan, atau dusun..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={isDarkMode 
                  ? "w-full px-3 py-2 pl-10 bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  : "w-full px-3 py-2 pl-10 bg-white/80 border border-gray-300 placeholder-gray-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"}
              />
            </div>
            
            {/* Provinsi Filter */}
            <select
              value={provinsiFilter}
              onChange={(e) => setProvinsiFilter(e.target.value)}
              className={isDarkMode 
                ? "px-3 py-2 bg-gray-900/50 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                : "px-3 py-2 bg-white/80 border border-gray-300 text-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"}
            >
              <option value="">Provinsi</option>
              {provinsiList.map(prov => (
                <option key={prov.id_provinsi} value={prov.id_provinsi}>{prov.nama}</option>
              ))}
            </select>
            
            {/* Kabupaten Filter */}
            <select
              value={kabupatenFilter}
              onChange={(e) => setKabupatenFilter(e.target.value)}
              disabled={!provinsiFilter}
              title={!provinsiFilter ? 'Pilih Provinsi terlebih dahulu' : ''}
              className={isDarkMode 
                ? `px-3 py-2 bg-gray-900/50 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${!provinsiFilter ? 'opacity-50 cursor-not-allowed' : ''}` 
                : `px-3 py-2 bg-white/80 border border-gray-300 text-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${!provinsiFilter ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <option value="">{provinsiFilter ? 'Semua Kabupaten' : 'Pilih Provinsi dulu'}</option>
              {kabupatenList.map(kab => (
                <option key={kab.id_kabupaten} value={kab.id_kabupaten}>{kab.nama}</option>
              ))}
            </select>
            
            {/* Periode Filter */}
            <select
              value={periodeFilter}
              onChange={(e) => setPeriodeFilter(e.target.value)}
              className={isDarkMode 
                ? "px-3 py-2 bg-gray-900/50 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                : "px-3 py-2 bg-white/80 border border-gray-300 text-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"}
            >
              <option value="">Semua Periode</option>
              {periodeList.map(periode => (
                <option key={periode.id_periode} value={periode.id_periode}>
                  {periode.nama_periode} {periode.is_active ? '✓' : ''}
                </option>
              ))}
            </select>
            
            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowPeriodeModal(true)}
              title="Kelola Periode & Filter"
              className={isDarkMode 
                ? "p-2 bg-gray-900/50 border border-gray-700 text-gray-400 hover:text-gray-300 rounded-lg transition" 
                : "p-2 bg-white/80 border border-gray-300 text-gray-600 hover:text-gray-700 rounded-lg transition"}
            >
              <FilterIcon size={18} />
            </button>
            
            <div className="flex-1"></div>
            
            {/* Import Button */}
            <button 
              onClick={handleImportClick} 
              className={isDarkMode
                ? "flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-all"
                : "flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium transition-all"}
            >
              <UploadIcon size={16} />
              Impor
            </button>
            
            {/* Hitung Jarak Button */}
            <button 
              onClick={handleRecalculateDistances}
              disabled={isCalculatingDistances || isLoading}
              className={isDarkMode
                ? `flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-all ${(isCalculatingDistances || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`
                : `flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-all ${(isCalculatingDistances || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Hitung jarak ke puskesmas untuk semua lokasi"
            >
              {isCalculatingDistances ? (
                <LoaderIcon size={16} className="animate-spin" />
              ) : (
                <Calculator size={16} />
              )}
              Hitung Jarak
            </button>
            
            {/* Add Button */}
            <button 
              onClick={() => {
                setLocationForm({ lokasi: '', id_provinsi: '', id_kabupaten: '', id_kecamatan: '', id_desa: '', latitude: '', longitude: '', id_periode: periodeFilter || '', kontak_person: '', kontak_nama: '', kontak_telepon: '' });
                setEditingId(null);
                setLokasiViewMode('add');
              }} 
              className={isDarkMode 
                ? "flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all"
                : "flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all"}
            >
              <span className="text-lg font-bold">+</span>
              Tambah Lokasi
            </button>
        </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <LoaderIcon size={32} className={isDarkMode ? "text-blue-400 animate-spin mb-2" : "text-blue-600 animate-spin mb-2"} />
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Memuat data...</p>
        </div>
      ) : locationData && locationData.length > 0 ? (
        <div className={isDarkMode ? "overflow-hidden rounded-lg border border-gray-700/50" : "overflow-hidden rounded-lg border border-gray-200/80"}>
          <div className="overflow-x-auto">
            <table className={isDarkMode ? "w-full text-sm" : "w-full text-sm"}>
            <thead>
              <tr className={isDarkMode 
                ? "bg-gray-700/60" 
                : "bg-gray-50"}>
                <th className="px-4 py-1 text-center font-semibold text-gray-400 uppercase tracking-wider text-xs w-12">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === getPaginatedData().length}
                    onChange={() => handleSelectAll(getPaginatedData())}
                    className="w-4 h-4 text-blue-600 rounded border-gray-400 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-1 text-center font-semibold text-gray-400 uppercase tracking-wider text-xs">No.</th>
                <th className="px-4 py-1 text-left font-semibold text-gray-400 uppercase tracking-wider text-xs">Dusun</th>
                <th className="px-4 py-1 text-left font-semibold text-gray-400 uppercase tracking-wider text-xs">Desa</th>
                <th className="px-4 py-1 text-left font-semibold text-gray-400 uppercase tracking-wider text-xs">Kecamatan</th>
                <th className="px-4 py-1 text-left font-semibold text-gray-400 uppercase tracking-wider text-xs">Kabupaten</th>
                <th className="px-4 py-1 text-left font-semibold text-gray-400 uppercase tracking-wider text-xs">Provinsi</th>
                <th className="px-4 py-1 text-left font-semibold text-gray-400 uppercase tracking-wider text-xs">Kontak Person</th>
                <th className="px-4 py-1 text-center font-semibold text-gray-400 uppercase tracking-wider text-xs relative">
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-semibold text-gray-400 text-xs">Jarak Faskes</span>
                    <button 
                      onClick={() => setShowFaskesInfo(!showFaskesInfo)}
                      className="p-1 hover:bg-gray-600 rounded-full transition-colors"
                      title="Info Kode Warna Jarak Faskes"
                    >
                      <Info size={13} />
                    </button>
                  </div>
                  
                  {/* Modal Info Faskes - positioned near button */}
                  {showFaskesInfo && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 bg-transparent z-40" 
                        onClick={() => setShowFaskesInfo(false)}
                      />
                      
                      {/* Modal Popup */}
                      <div className="absolute top-full right-0 mt-2 z-50" onClick={(e) => e.stopPropagation()}>
                        <div 
                          className={isDarkMode ? "bg-gray-800 rounded-xl shadow-2xl w-80 p-6 border border-gray-700" : "bg-white rounded-xl shadow-2xl w-80 p-6 border border-gray-300"}
                        >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className={isDarkMode ? "text-base font-semibold text-white" : "text-base font-semibold text-gray-800"}>
                            Info kode warna
                          </h3>
                          <button 
                            onClick={() => setShowFaskesInfo(false)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                          >
                            <X size={15} className="text-gray-500" />
                          </button>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 whitespace-nowrap">
                              &lt; 2 km
                            </div>
                            <p className={isDarkMode ? "text-xs text-gray-300 normal-case" : "text-xs text-gray-600 normal-case"}>
                              Jarak ke puskesmas kurang dari 2 km. <span className="font-semibold normal-case">Aman untuk sakit.</span>
                            </p>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 whitespace-nowrap">
                              &gt; 2 km
                            </div>
                            <p className={isDarkMode ? "text-xs text-gray-300 normal-case" : "text-xs text-gray-600 normal-case"}>
                              Jarak ke puskesmas 2-5 km. <span className="font-semibold normal-case">Aman untuk sakit.</span>
                            </p>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 whitespace-nowrap">
                              &gt; 5 km
                            </div>
                            <p className={isDarkMode ? "text-xs text-gray-300 normal-case" : "text-xs text-gray-600 normal-case"}>
                              Jarak ke puskesmas 5-10 km. <span className="font-semibold normal-case">Pertimbangkan hati-hati.</span>
                            </p>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 whitespace-nowrap">
                              &gt; 10 km
                            </div>
                            <p className={isDarkMode ? "text-xs text-gray-300 normal-case" : "text-xs text-gray-600 normal-case"}>
                              Jarak ke puskesmas lebih dari 10 km. <span className="font-semibold text-red-600 dark:text-red-400 normal-case">Tidak untuk sakit.</span>
                            </p>
                          </div>
                        </div>
                        
                        <div className={isDarkMode ? "mt-4 p-2.5 bg-blue-900/20 border border-blue-700/50 rounded-lg" : "mt-4 p-2.5 bg-blue-50 border border-blue-200 rounded-lg"}>
                          <p className={isDarkMode ? "text-xs text-blue-300 normal-case" : "text-xs text-blue-700 normal-case"}>
                            <span className="font-semibold normal-case">Catatan:</span> Jarak dihitung otomatis oleh sistem ke puskesmas terdekat menggunakan data OpenStreetMap. Sistem akan mengalihkan peserta sakit ke lokasi hijau/biru.
                          </p>
                        </div>
                      </div>
                    </div>
                    </>
                  )}
                </th>
                <th className="px-6 py-4 text-center font-semibold text-gray-400 uppercase tracking-wider text-xs">Aksi</th>
              </tr>
            </thead>
            <tbody className={isDarkMode ? "divide-y divide-gray-700/50 bg-gray-800/40" : "divide-y divide-gray-100/50"}>
              {getPaginatedData().length > 0 ? getPaginatedData().map((location, index) => (
                <tr key={location.id_lokasi} className={isDarkMode ? "hover:bg-gray-700/50 transition-colors" : "hover:bg-gray-50/70 transition-colors"}>
                  <td className="px-4 py-1.5 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(location.id_lokasi)}
                      onChange={() => handleSelectOne(location.id_lokasi)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-400 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className={isDarkMode ? "px-4 py-1.5 text-center text-gray-400 font-medium" : "px-4 py-1.5 text-center text-gray-600 font-medium"}>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className={isDarkMode ? "px-4 py-1.5 text-white font-semibold" : "px-4 py-1.5 text-gray-800 font-semibold"}>{location.lokasi || '-'}</td>
                  <td className={isDarkMode ? "px-4 py-1.5 text-gray-300" : "px-4 py-1.5 text-gray-600"}>{location.desa || '-'}</td>
                  <td className={isDarkMode ? "px-4 py-1.5 text-gray-300" : "px-4 py-1.5 text-gray-600"}>{location.kecamatan || '-'}</td>
                  <td className={isDarkMode ? "px-4 py-1.5 text-gray-300" : "px-4 py-1.5 text-gray-600"}>{location.kabupaten || '-'}</td>
                  <td className={isDarkMode ? "px-4 py-1.5 text-gray-300" : "px-4 py-1.5 text-gray-600"}>{location.provinsi || '-'}</td>
                  <td className={isDarkMode ? "px-4 py-1.5 text-gray-300" : "px-4 py-1.5 text-gray-600"}>
                    {location.kontak_person ? (
                      <div className="text-xs leading-relaxed whitespace-pre-wrap">
                        {location.kontak_person}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-1.5">
                    <div className="flex justify-center">
                      {/* Tampilkan jarak berdasarkan kategori yang dihitung otomatis dari puskesmas terdekat */}
                      {location.jarak_ke_faskes !== null && location.jarak_ke_faskes !== undefined && location.kategori_jarak ? (
                        (() => {
                          const kategori = (location.kategori_jarak || '').toLowerCase();
                          const isVeryClose = kategori.includes('sangat');
                          const isClose = kategori === 'dekat' || kategori.includes('dekat') && !isVeryClose;
                          const isMedium = kategori === 'sedang' || kategori.includes('sedang');
                          
                          return (
                            <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${
                              isVeryClose ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              isClose ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                              isMedium ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {isVeryClose ? '< 2 km' :
                               isClose ? '> 2 km' :
                               isMedium ? '> 5 km' :
                               '> 10 km'}
                            </div>
                          );
                        })()
                      ) : (
                        <span className={isDarkMode ? "text-xs text-gray-500" : "text-xs text-gray-400"}>Belum Dihitung</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-1.5">
                    <div className="flex justify-center items-center gap-2">
                      <button onClick={() => handleEdit(location)} className={isDarkMode ? "p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-600/20 rounded-md transition-colors" : "p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-md transition-colors"} title="Edit">
                        <Edit2Icon size={16} />
                      </button>
                      <button onClick={() => handleDelete(location.id_lokasi)} className={isDarkMode ? "p-2 text-gray-500 hover:text-red-400 hover:bg-red-600/20 rounded-md transition-colors" : "p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-md transition-colors"} title="Hapus">
                        <Trash2Icon size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="10" className={isDarkMode ? "text-center py-12 text-gray-500" : "text-center py-12 text-gray-500"}>
                    Tidak ada hasil yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <MapIcon size={48} className={isDarkMode ? "mx-auto text-gray-600" : "mx-auto text-gray-400"} />
          <h3 className={isDarkMode ? "mt-4 text-lg font-semibold text-gray-300" : "mt-4 text-lg font-semibold text-gray-700"}>Belum Ada Lokasi</h3>
          <p className={isDarkMode ? "mt-2 text-sm text-gray-500" : "mt-2 text-sm text-gray-500"}>Mulai dengan menambahkan lokasi KKN baru.</p>
        </div>
      )}
      
      {/* Pagination Controls */}
      {locationData && locationData.length > 0 && (
        <div className={`flex flex-col md:flex-row gap-3 md:gap-4 justify-between items-stretch md:items-center mt-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {/* Items per page selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium whitespace-nowrap">TAMPILKAN:</span>
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
            </div>
            <span className="text-xs text-gray-500 text-center sm:text-left">
              Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, getSortedData().length)} - {Math.min(currentPage * itemsPerPage, getSortedData().length)} dari {getSortedData().length} lokasi
            </span>
            
            {/* Bulk Delete Button */}
            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
              >
                <Trash2Icon size={14} />
                HAPUS {selectedIds.length} DIPILIH
              </button>
            )}
          </div>
          
          {/* Page navigation */}
          <div className="flex items-center justify-center md:justify-end gap-2">
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
      </div>

      {/* Periode Modal */}
      <PeriodeModal 
        show={showPeriodeModal} 
        onClose={() => setShowPeriodeModal(false)}
        onPeriodeChange={() => {
          // Refresh periode list
          fetch(`${API_BASE_URL}/api/periode`)
            .then(res => res.json())
            .then(data => setPeriodeList(data))
            .catch(err => console.error('Error refreshing periode:', err));
        }}
      />
      
      {/* Import Excel Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => !isImporting && setShowImportModal(false)}>
          <div 
            className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl p-6 w-full max-w-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-5">
              <FileSpreadsheet size={24} className="text-green-600" />
              <h4 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Import Data Lokasi dari Excel
              </h4>
            </div>

            {!importResult ? (
              <>
                {/* Period Selection */}
                <div className={`p-4 rounded-lg mb-4 ${isDarkMode ? 'bg-gray-900/50 border border-gray-700' : 'bg-blue-50 border border-blue-200'}`}>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Lokasi akan diimpor pada periode:
                  </label>
                  <select
                    value={importPeriode}
                    onChange={(e) => setImportPeriode(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-800'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="">-- Pilih Periode (opsional) --</option>
                    {periodeList.map(periode => (
                      <option key={periode.id_periode} value={periode.id_periode}>
                        {periode.nama_periode} ({periode.tahun_akademik || '-'})
                        {periode.is_active ? ' ✓ Aktif' : ''}
                      </option>
                    ))}
                  </select>
                  <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    💡 Pilih periode dimana lokasi akan digunakan. Jika tidak dipilih, lokasi tidak akan terikat ke periode manapun.
                  </p>
                </div>

                {/* File Upload Area */}
                <div className={`border-2 border-dashed rounded-lg p-8 text-center mb-4 ${
                  isDarkMode ? 'border-gray-600' : 'border-gray-300'
                }`}>
                  <Upload size={48} className={`mx-auto mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {importFile ? importFile.name : 'Pilih file Excel (.xlsx, .xls, .csv)'}
                  </p>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => setImportFile(e.target.files[0])}
                    className="hidden"
                    id="import-lokasi-file"
                  />
                  <label
                    htmlFor="import-lokasi-file"
                    className={`inline-block px-4 py-2 rounded-lg cursor-pointer transition ${
                      isDarkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Pilih File
                  </label>
                </div>

                {/* Required Columns Info */}
                <div className={`p-4 rounded-lg mb-4 ${isDarkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                  <p className={`text-sm text-center font-semibold mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                    Kolom wajib :
                  </p>
                  <ul className={`text-xs text-center space-y-1 ${isDarkMode ? 'text-blue-200' : 'text-blue-700'}`}>
                    <li><strong>Lokasi (Dusun), Desa, Kecamatan, Kabupaten, Kontak Person (opsional)</strong></li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      setImportFile(null);
                      setImportPeriode('');
                    }}
                    disabled={isImporting}
                    className={`flex-1 px-4 py-2 border rounded-lg font-medium ${
                      isDarkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    } transition disabled:opacity-50`}
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleImportFile}
                    disabled={!importFile || isImporting}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isImporting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload size={18} />
                        Import Data
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Import Result */}
                <div className={`p-4 rounded-lg mb-4 ${
                  importResult.success 
                    ? (isDarkMode ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200')
                    : (isDarkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200')
                }`}>
                  <p className={`text-sm font-semibold mb-2 ${
                    importResult.success 
                      ? (isDarkMode ? 'text-green-300' : 'text-green-800')
                      : (isDarkMode ? 'text-red-300' : 'text-red-800')
                  }`}>
                    {importResult.success ? '✅ Import Berhasil!' : '❌ Import Gagal'}
                  </p>
                  <p className={`text-xs ${
                    importResult.success 
                      ? (isDarkMode ? 'text-green-200' : 'text-green-700')
                      : (isDarkMode ? 'text-red-200' : 'text-red-700')
                  }`}>
                    {importResult.message}
                  </p>
                  {importResult.success && importResult.has_coordinates > 0 && (
                    <div className={`mt-3 p-3 rounded ${isDarkMode ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
                      <p className={`text-xs ${isDarkMode ? 'text-purple-200' : 'text-purple-700'}`}>
                        💡 <strong>{importResult.has_coordinates}</strong> lokasi memiliki koordinat.
                        <br />
                        Gunakan tombol <strong>"Hitung Jarak"</strong> untuk menghitung jarak ke puskesmas.
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                    setImportResult(null);
                    setImportPeriode('');
                  }}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                >
                  Tutup
                </button>
              </>
            )}
          </div>
        </div>
      )}
        </>
      )}
    </section>
  );
}
