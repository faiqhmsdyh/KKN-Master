import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../App';
import { 
  MapPin, 
  User, 
  Calendar, 
  Users, 
  Building2, 
  Mail, 
  ClipboardList,
  TrendingUp,
  Download,
  Eye,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  BarChart3,
  Lock,
  Camera,
  X,
  Upload,
  Eye as EyeIcon,
  EyeOff,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import Map from './Map';
import '../styles/KoordinatorPPM.css';

export default function KoordinatorPPM({ user, setActiveTab }) {
  const { isDarkMode } = useContext(ThemeContext);
  const [locationData, setLocationData] = useState([]);
  const [riwayatData, setRiwayatData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailSummary, setDetailSummary] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [stats, setStats] = useState({
    total_lokasi: 0,
    total_mahasiswa: 0,
    total_kelompok: 0,
    total_penempatan: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('lokasi');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [kabupatenFilter, setKabupatenFilter] = useState(''); // Filter kabupaten
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const saved = localStorage.getItem('koordinator_lokasi_itemsPerPage');
    return saved ? parseInt(saved, 10) : 10;
  });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false
  });
  const [profilePhoto, setProfilePhoto] = useState(user?.foto || null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Koordinator profile - ambil dari user yang login
  const koordinatorProfile = {
    nama: user?.nama || 'Koordinator PPM',
    jabatan: 'Koordinator Pusat Pengabdian Masyarakat',
    nip: user?.nip || '-',
    email: user?.email || user?.username || '-',
    unit: 'Lembaga Penelitian dan Pengabdian Masyarakat (LPPM)',
    alamat: 'Gedung Pusat Studi (Rektorat Lama) Lt.2, UIN Sunan Kalijaga',
    foto: profilePhoto
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Password baru dan konfirmasi tidak cocok!');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert('Password baru minimal 6 karakter!');
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/api/akun/${user.id_akun}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengubah password');
      }

      alert('Password berhasil diubah!');
      setShowPasswordModal(false);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      alert(error.message);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validasi tipe file
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar!');
      return;
    }

    // Validasi ukuran file (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2MB!');
      return;
    }

    setUploadingPhoto(true);

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/akun/${user.id_akun}/foto`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ foto: reader.result })
        });

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Gagal mengupload foto');
        }

        setProfilePhoto(reader.result);
        alert('Foto profil berhasil diperbarui!');
      } catch (error) {
        console.error('Error uploading photo:', error);
        alert(error.message);
      } finally {
        setUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch lokasi data dari tabel data_lokasi_kkn
      const lokasiRes = await fetch('http://localhost:4000/lokasi');
      const lokasiData = await lokasiRes.json();
      setLocationData(Array.isArray(lokasiData) ? lokasiData : []);

      // Fetch riwayat penempatan dari tabel hasil_autogrup
      const riwayatRes = await fetch('http://localhost:4000/autogroup/hasil');
      const riwayatJson = await riwayatRes.json();
      setRiwayatData(Array.isArray(riwayatJson) ? riwayatJson : []);

      // Fetch statistik mahasiswa dari tabel data_peserta_kkn
      const statsRes = await fetch('http://localhost:4000/mahasiswa/statistik');
      const statsData = await statsRes.json();
      
      setStats({
        total_lokasi: lokasiData?.length || 0,
        total_mahasiswa: statsData?.total || 0,
        total_kelompok: riwayatJson?.[0]?.jumlah_kelompok || 0,
        total_penempatan: riwayatJson?.length || 0
      });

      // Simpan waktu terakhir data diambil
      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Gagal memuat data. Pastikan server backend berjalan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetail = async (riwayat) => {
    setDetailModal(riwayat);
    setDetailData(null);
    setDetailSummary([]);
    setDetailLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/autogroup/hasil/${riwayat.id_hasil}/detail`);
      if (!res.ok) throw new Error('Gagal mengambil detail');
      const data = await res.json();
      
      // Create summary for display
      const summary = data.groups.map(group => ({
        nomor_kelompok: group.nomor_kelompok,
        jumlah_anggota: group.anggota ? group.anggota.length : 0,
        lokasi: group.lokasi || 'Belum Ditentukan',
        desa: group.desa || '-',
        kecamatan: group.kecamatan || '-',
        kabupaten: group.kabupaten || '-',
        id_lokasi: group.id_lokasi
      }));
      
      setDetailData(data); // Keep full data for export
      setDetailSummary(summary); // Summary for display
    } catch (err) {
      console.error('Error fetching detail:', err);
      alert('Gagal memuat detail data.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDownloadReport = async (riwayat) => {
    try {
      // Download structured Excel from backend
      const response = await fetch(`http://localhost:4000/autogroup/hasil/${riwayat.id_hasil}/export-excel`);
      
      if (!response.ok) {
        throw new Error('Gagal mengunduh file Excel');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `Hasil_KKN_${riwayat.angkatan_kkn || 'NA'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Gagal mengunduh laporan. Silakan coba lagi.');
    }
  };

  // Get unique kabupaten list for filter
  const getKabupatenList = () => {
    if (!locationData || locationData.length === 0) return [];
    const kabupatenSet = new Set();
    locationData.forEach(loc => {
      if (loc.kabupaten) kabupatenSet.add(loc.kabupaten);
    });
    return Array.from(kabupatenSet).sort();
  };

  // Get filtered locations based on kabupaten filter
  const getFilteredLocations = () => {
    if (!locationData) return [];
    if (!kabupatenFilter) return locationData;
    return locationData.filter(loc => loc.kabupaten === kabupatenFilter);
  };
  
  // Pagination helpers
  const getPaginatedLocations = () => {
    const filtered = getFilteredLocations();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };
  
  const getTotalPages = () => {
    const filtered = getFilteredLocations();
    return Math.ceil(filtered.length / itemsPerPage);
  };
  
  // Reset to page 1 when filter or itemsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [kabupatenFilter, itemsPerPage]);
  
  // Save itemsPerPage to localStorage
  useEffect(() => {
    localStorage.setItem('koordinator_lokasi_itemsPerPage', itemsPerPage.toString());
  }, [itemsPerPage]);

  const StatCard = ({ icon: Icon, label, value, color, subtitle, unit }) => (
    <div className={isDarkMode 
      ? "glass-card bg-gray-800/80 border-gray-700 p-6 hover:shadow-xl transition-all duration-300" 
      : "glass-card bg-white/90 border-blue-100/80 p-6 hover:shadow-xl transition-all duration-300"}>
      <div className="flex items-start gap-4">
        <div className={`p-4 rounded-2xl ${color} flex-shrink-0`}>
          <Icon size={32} className="text-white" />
        </div>
        <div className="flex-1">
          <p className={isDarkMode ? "text-gray-400 text-xs uppercase tracking-wider mb-2" : "text-gray-600 text-xs uppercase tracking-wider mb-2"}>
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <p className={isDarkMode ? "text-white text-2xl font-black" : "text-gray-900 text-2xl font-black"}>
              {value}
            </p>
            {unit && (
              <span className={isDarkMode ? "text-gray-400 text-lg font-bold" : "text-gray-600 text-lg font-bold"}>
                {unit}
              </span>
            )}
          </div>
          {subtitle && (
            <p className={isDarkMode ? "text-gray-500 text-xs mt-2" : "text-gray-400 text-xs mt-2"}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="space-y-1">
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Portal Koordinator PPM
        </h1>
        <p className={isDarkMode ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>
          Monitoring Lokasi & Hasil 
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <StatCard 
          icon={MapPin} 
          label="Total Lokasi" 
          value={stats.total_lokasi} 
          unit="Titik"
          color="bg-gradient-to-br from-emerald-500 to-emerald-600" 
        />
        <StatCard 
          icon={Users} 
          label="Total Peserta KKN" 
          value={stats.total_mahasiswa} 
          unit="Orang"
          color="bg-gradient-to-br from-blue-500 to-blue-500"
        />
        <StatCard 
          icon={Users} 
          label="Total Kelompok KKN" 
          value={stats.total_kelompok} 
          unit="Kelompok"
          color="bg-gradient-to-br from-blue-500 to-blue-500"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'lokasi', label: 'Lokasi KKN', icon: MapPin },
          { key: 'riwayat', label: 'Hasil AutoGrup', icon: ClipboardList }
        ].map((section) => {
          return (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 ${
                activeSection === section.key
                  ? (isDarkMode ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50' : 'bg-blue-500 text-white shadow-lg shadow-blue-400/50')
                  : (isDarkMode ? 'bg-gray-800/80 text-gray-300 hover:bg-gray-700' : 'bg-white/80 text-gray-700 hover:bg-gray-50')
              }`}
            >
              <section.icon size={18} />
              {section.label}
            </button>
          );
        })}
      </div>

      {activeSection === 'lokasi' && (
        <div className={isDarkMode 
          ? "glass-card bg-gray-800/80 border-gray-700 p-6" 
          : "glass-card bg-white/90 border-blue-100/80 p-6"}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <MapPin className="text-blue-500" size={20} />
              <div>
                <h2 className={`text-1xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Data Lokasi KKN
                </h2>
                <p className={isDarkMode ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>
                  {getFilteredLocations().length} dari {locationData.length} lokasi
                </p>
              </div>
            </div>

            {/* Filter Kabupaten */}
            <div className="flex items-center gap-3">
              <label className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Filter Kabupaten:
              </label>
              <select
                value={kabupatenFilter}
                onChange={(e) => setKabupatenFilter(e.target.value)}
                className={`px-4 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Semua Kabupaten</option>
                {getKabupatenList().map((kab, idx) => (
                  <option key={idx} value={kab}>{kab}</option>
                ))}
              </select>
            </div>
          </div>

          {getFilteredLocations().length === 0 ? (
            <div className="text-center py-12">
              <MapPin size={64} className={isDarkMode ? 'text-gray-600 mx-auto mb-4' : 'text-gray-400 mx-auto mb-4'} />
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                {kabupatenFilter ? `Tidak ada lokasi di ${kabupatenFilter}` : 'Belum ada data lokasi KKN'}
              </p>
            </div>
          ) : (
            <div className={isDarkMode ? "overflow-hidden rounded-lg border border-gray-700/50" : "overflow-hidden rounded-lg border border-gray-200/80"}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={isDarkMode ? "bg-gray-700/60" : "bg-gray-50"}>
                      <th className="px-4 py-4 text-center font-semibold text-gray-400 uppercase tracking-wider text-xs">No.</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-400 uppercase tracking-wider text-xs">Lokasi</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-400 uppercase tracking-wider text-xs">Desa/Kelurahan</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-400 uppercase tracking-wider text-xs">Kecamatan</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-400 uppercase tracking-wider text-xs">Kabupaten/Kota</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-400 uppercase tracking-wider text-xs">Koordinat GPS</th>
                    </tr>
                  </thead>
                  <tbody className={isDarkMode ? "divide-y divide-gray-700/50 bg-gray-800/40" : "divide-y divide-gray-100/50"}>
                    {getPaginatedLocations().map((lokasi, index) => (
                      <tr key={lokasi.id_lokasi} className={isDarkMode ? "hover:bg-gray-700/50 transition-colors" : "hover:bg-gray-50/70 transition-colors"}>
                        <td className={isDarkMode ? "px-4 py-4 text-center text-gray-400 font-medium" : "px-4 py-4 text-center text-gray-600 font-medium"}>
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>
                        <td className={isDarkMode ? "px-6 py-4 text-white font-semibold" : "px-6 py-4 text-gray-800 font-semibold"}>
                          {lokasi.lokasi || '-'}
                        </td>
                        <td className={isDarkMode ? "px-6 py-4 text-gray-300" : "px-6 py-4 text-gray-600"}>
                          {lokasi.desa || '-'}
                        </td>
                        <td className={isDarkMode ? "px-6 py-4 text-gray-300" : "px-6 py-4 text-gray-600"}>
                          {lokasi.kecamatan || '-'}
                        </td>
                        <td className={isDarkMode ? "px-6 py-4 text-gray-300" : "px-6 py-4 text-gray-600"}>
                          {lokasi.kabupaten || '-'}
                        </td>
                        <td className={isDarkMode ? "px-6 py-4 text-gray-400 text-xs" : "px-6 py-4 text-gray-500 text-xs"}>
                          {lokasi.latitude && lokasi.longitude 
                            ? `${parseFloat(lokasi.latitude).toFixed(5)}, ${parseFloat(lokasi.longitude).toFixed(5)}` 
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Pagination Controls */}
          {getFilteredLocations().length > 0 && (
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
                  <option value="25">25 BARIS</option>
                  <option value="50">50 BARIS</option>
                </select>
                <span className="text-xs text-gray-500">
                  Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, getFilteredLocations().length)} - {Math.min(currentPage * itemsPerPage, getFilteredLocations().length)} dari {getFilteredLocations().length} lokasi
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
                      if (page === 1 || page === getTotalPages() || 
                          (page >= currentPage - 1 && page <= currentPage + 1)) {
                        return true;
                      }
                      return false;
                    })
                    .map((page, idx, arr) => (
                      <React.Fragment key={page}>
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

          {/* Map Section */}
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="text-blue-500" size={24} />
              <div>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Peta Sebaran Lokasi
                </h3>
                <p className={isDarkMode ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>
                  Visualisasi geografis lokasi KKN
                </p>
              </div>
            </div>
            <div className={isDarkMode 
              ? "overflow-hidden rounded-lg border border-gray-700/50 bg-gray-800/40"
              : "overflow-hidden rounded-lg border border-gray-200/80 bg-white"}
            >
              <Map locationData={getFilteredLocations()} />
            </div>
          </div>
        </div>
      )}

      {activeSection === 'profil' && (
        <div className={isDarkMode 
          ? "glass-card bg-gray-800/80 border-gray-700 p-6" 
          : "glass-card bg-white/90 border-blue-100/80 p-6"}>
          <div className="flex items-start gap-6">
            {/* Profile Photo */}
            <div className="flex-shrink-0">
              <div className="relative group">
                {koordinatorProfile.foto ? (
                  <img 
                    src={koordinatorProfile.foto} 
                    alt={koordinatorProfile.nama}
                    className="w-32 h-32 rounded-2xl object-cover shadow-xl"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
                    <User size={64} className="text-white" />
                  </div>
                )}
                
                {/* Upload Photo Button */}
                <label className={`absolute inset-0 flex items-center justify-center rounded-2xl cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity ${
                  isDarkMode ? 'bg-black/70' : 'bg-black/60'
                }`}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                  {uploadingPhoto ? (
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Camera size={32} className="text-white" />
                  )}
                </label>
              </div>
              <p className={`text-xs text-center mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Klik untuk upload
              </p>
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-6">
              <div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {koordinatorProfile.nama}
                </h2>
                <p className="text-blue-500 font-semibold mt-1">{koordinatorProfile.jabatan}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <User size={20} className="text-blue-500" />
                    </div>
                    <div>
                      <p className={isDarkMode ? 'text-gray-500 text-xs' : 'text-gray-500 text-xs'}>NIP</p>
                      <p className={isDarkMode ? 'text-gray-200 font-medium' : 'text-gray-800 font-medium'}>
                        {koordinatorProfile.nip}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <Mail size={20} className="text-blue-500" />
                    </div>
                    <div>
                      <p className={isDarkMode ? 'text-gray-500 text-xs' : 'text-gray-500 text-xs'}>Email</p>
                      <p className={isDarkMode ? 'text-gray-200 font-medium' : 'text-gray-800 font-medium'}>
                        {koordinatorProfile.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <Building2 size={20} className="text-blue-500" />
                    </div>
                    <div>
                      <p className={isDarkMode ? 'text-gray-500 text-xs' : 'text-gray-500 text-xs'}>Unit Kerja</p>
                      <p className={isDarkMode ? 'text-gray-200 font-medium' : 'text-gray-800 font-medium'}>
                        {koordinatorProfile.unit}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <MapPin size={20} className="text-blue-500" />
                    </div>
                    <div>
                      <p className={isDarkMode ? 'text-gray-500 text-xs' : 'text-gray-500 text-xs'}>Alamat Kantor</p>
                      <p className={isDarkMode ? 'text-gray-200 font-medium' : 'text-gray-800 font-medium'}>
                        {koordinatorProfile.alamat}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                >
                  <Lock size={20} />
                  Ubah Password
                </button>
                <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  💡 Data lain (Nama, NIP, Email, dll) hanya dapat diubah oleh Admin
                </p>
              </div>
            </div>
          </div>
        </div>
      )}


      {activeSection === 'riwayat' && (
        <div className={isDarkMode 
          ? "glass-card bg-gray-800/80 border-gray-700 p-6" 
          : "glass-card bg-white/90 border-blue-100/80 p-6"}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <ClipboardList className="text-blue-500" size={24} />
              <div>
                <h2 className={`text-1xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Hasil Pengelompokan & Penempatan
                </h2>
                <p className={isDarkMode ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>
                  {riwayatData.length} hasil akhir
                </p>
              </div>
            </div>
          </div>

          {riwayatData.length === 0 ? (
            <div className="text-center py-9">
              <ClipboardList size={50} className={isDarkMode ? 'text-gray-600 mx-auto mb-4' : 'text-gray-400 mx-auto mb-4'} />
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                Belum ada hasil pengelompokan dan penempatan KKN
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {riwayatData.map((riwayat) => {
                const groupsCount = riwayat.jumlah_kelompok || 0;
                const mahasiswaCount = riwayat.jumlah_mahasiswa || 0;

                return (
                  <div 
                    key={riwayat.id_hasil}
                    className={isDarkMode 
                      ? "bg-gray-700/50 border border-gray-600 p-4 rounded-xl hover:bg-gray-700 transition-all" 
                      : "bg-gray-50 border border-gray-200 p-4 rounded-xl hover:shadow-md transition-all"}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            {riwayat.angkatan_kkn || `Penempatan #${riwayat.id_hasil}`}
                          </h3>
                          <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-500 text-xs font-semibold rounded-full">
                            {groupsCount} Kelompok
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-3 text-sm">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-gray-500" />
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                              {new Date(riwayat.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users size={14} className="text-gray-500" />
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                              {mahasiswaCount} Mahasiswa
                            </span>
                          </div>
                          {riwayat.nama_aturan && (
                            <div className="flex items-center gap-1.5">
                              <ClipboardList size={14} className="text-gray-500" />
                              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                                {riwayat.nama_aturan}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetail(riwayat)}
                          className={`p-2.5 rounded-lg transition-colors ${
                            isDarkMode 
                              ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                          }`}
                          title="Lihat Detail"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDownloadReport(riwayat)}
                          className={`p-2.5 rounded-lg transition-colors ${
                            isDarkMode 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                          title="Download Report"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-100">
                  <ClipboardList size={18} className="text-blue-600" />
                </div>
                <div>
                  <h3 className={`text-base font-bold ${ isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {detailModal.angkatan_kkn || `Penempatan #${detailModal.id_hasil}`}
                  </h3>
                  <p className={`text-xs ${ isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {detailModal.jumlah_kelompok} Kelompok &bull; {detailModal.jumlah_mahasiswa} Mahasiswa &bull; {new Date(detailModal.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setDetailModal(null); setDetailData(null); }}
                className={`p-1.5 rounded-lg transition-colors ${ isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-hidden flex flex-col px-4 pb-4 gap-3">
              {detailLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : detailSummary.length > 0 ? (
                <>
                  {/* Summary Table - Ringkasan per Kelompok */}
                  <div className={isDarkMode ? "bg-gray-800/70 rounded-lg p-4 border border-gray-700/70 shadow-lg" : "bg-white rounded-lg p-4 border border-gray-300 shadow-lg"}>
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
                        <ClipboardList className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} size={18} />
                      </div>
                      <div>
                        <h4 className={isDarkMode ? "text-sm font-bold text-white" : "text-sm font-bold text-gray-800"}>
                          Ringkasan Hasil Pengelompokan
                        </h4>
                        <p className={isDarkMode ? "text-xs text-gray-400" : "text-xs text-gray-600"}>
                          {detailSummary.length} kelompok tersedia
                        </p>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <div className="max-h-[420px] overflow-y-auto">
                        <table className="w-full border-collapse">
                          <thead className={isDarkMode ? "bg-gradient-to-r from-gray-700 to-gray-800 sticky top-0 z-10" : "bg-gradient-to-r from-blue-500 to-blue-600 sticky top-0 z-10"}>
                            <tr>
                              <th className={`px-3 py-2 text-left text-xs font-bold tracking-wide border ${isDarkMode ? 'border-gray-600 text-white' : 'border-blue-400 text-white'}`}>
                                NO
                              </th>
                              <th className={`px-3 py-2 text-center text-xs font-bold tracking-wide border ${isDarkMode ? 'border-gray-600 text-white' : 'border-blue-400 text-white'}`}>
                                KELOMPOK
                              </th>
                              <th className={`px-3 py-2 text-center text-xs font-bold tracking-wide border ${isDarkMode ? 'border-gray-600 text-white' : 'border-blue-400 text-white'}`}>
                                JUMLAH ANGGOTA
                              </th>
                              <th className={`px-3 py-2 text-left text-xs font-bold tracking-wide border ${isDarkMode ? 'border-gray-600 text-white' : 'border-blue-400 text-white'}`}>
                                LOKASI
                              </th>
                              <th className={`px-3 py-2 text-left text-xs font-bold tracking-wide border ${isDarkMode ? 'border-gray-600 text-white' : 'border-blue-400 text-white'}`}>
                                DESA
                              </th>
                              <th className={`px-3 py-2 text-left text-xs font-bold tracking-wide border ${isDarkMode ? 'border-gray-600 text-white' : 'border-blue-400 text-white'}`}>
                                KECAMATAN
                              </th>
                              <th className={`px-3 py-2 text-left text-xs font-bold tracking-wide border ${isDarkMode ? 'border-gray-600 text-white' : 'border-blue-400 text-white'}`}>
                                KABUPATEN
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {detailSummary.map((row, idx) => (
                              <tr key={idx} className={isDarkMode ? "hover:bg-gray-700/40 transition-colors" : "hover:bg-blue-50 transition-colors"}>
                                <td className={`px-3 py-2 border text-xs font-medium ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-700'}`}>
                                  {idx + 1}
                                </td>
                                <td className={`px-3 py-2 border text-center ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${isDarkMode ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50' : 'bg-blue-100 text-blue-700 border border-blue-300'}`}>
                                    {row.nomor_kelompok}
                                  </span>
                                </td>
                                <td className={`px-3 py-2 border text-center ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold text-xs ${isDarkMode ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50' : 'bg-emerald-100 text-emerald-700 border border-emerald-300'}`}>
                                    <Users size={14} />
                                    {row.jumlah_anggota} orang
                                  </span>
                                </td>
                                <td className={`px-3 py-2 border text-xs font-semibold ${isDarkMode ? 'border-gray-700 text-white' : 'border-gray-200 text-gray-800'}`}>
                                  {row.lokasi}
                                </td>
                                <td className={`px-3 py-2 border text-xs ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-600'}`}>
                                  {row.desa}
                                </td>
                                <td className={`px-3 py-2 border text-xs ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-600'}`}>
                                  {row.kecamatan}
                                </td>
                                <td className={`px-3 py-2 border text-xs ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-600'}`}>
                                  {row.kabupaten}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-400">Gagal memuat data detail.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          }`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Lock size={24} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Ubah Password
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
                  setShowPasswords({ old: false, new: false, confirm: false });
                }}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <X size={24} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
              {/* Old Password */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Password Lama
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.old ? "text" : "password"}
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                    required
                    className={`w-full px-4 py-3 pr-12 rounded-lg border transition-all ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Masukkan password lama"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, old: !showPasswords.old })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.old ? <EyeOff size={20} /> : <EyeIcon size={20} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    minLength={6}
                    className={`w-full px-4 py-3 pr-12 rounded-lg border transition-all ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Minimal 6 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <EyeOff size={20} /> : <EyeIcon size={20} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                    className={`w-full px-4 py-3 pr-12 rounded-lg border transition-all ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Ulangi password baru"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? <EyeOff size={20} /> : <EyeIcon size={20} />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
                    setShowPasswords({ old: false, new: false, confirm: false });
                  }}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                    isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-lg"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
