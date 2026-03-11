import React, { useState, useEffect } from 'react';
import { Users, FileCheck2, Calendar, ArrowRight, LoaderIcon, Save, Check, UserCheck, UserX, HeartPulse } from 'lucide-react';
import API_BASE_URL from '../config/api';

export default function Step2_Parameters({
  mahasiswaData,
  onExecuteGrouping,
  onSaveConfiguration,
  isDarkMode,
  fileName
}) {
  const [config, setConfig] = useState({
    tahun_ajaran: '',
    angkatan_kkn: '',
  });
  const [criteria, setCriteria] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        // Fetch available criteria with active configurations
        const criteriaRes = await fetch(`${API_BASE_URL}/kriteria`);
        if (!criteriaRes.ok) throw new Error('Gagal memuat kriteria');
        const criteriaData = await criteriaRes.json();
        
        // Also fetch active konfigurasi
        const konfRes = await fetch(`${API_BASE_URL}/konfigurasi-kriteria/active`);
        if (!konfRes.ok) throw new Error('Gagal memuat konfigurasi kriteria');
        const konfData = await konfRes.json();
        
        // Get tahun_ajaran and angkatan_kkn from first active configuration
        if (Array.isArray(konfData) && konfData.length > 0) {
          const firstKonf = konfData[0];
          setConfig({
            tahun_ajaran: firstKonf.tahun_ajaran || '',
            angkatan_kkn: firstKonf.angkatan_kkn || '',
          });
        }
        
        const initialCriteria = Array.isArray(criteriaData) ? criteriaData.map(c => {
          // Find active configuration for this criteria
          const activeKonf = Array.isArray(konfData) ? konfData.find(k => k.id_kriteria === c.id_kriteria) : null;
          
          let value;
          if (c.tipe_data === 'boolean') {
            value = activeKonf ? activeKonf.nilai_boolean : false;
          } else if (c.tipe_data === 'gender') {
            value = activeKonf ? activeKonf.nilai_gender : '';
          } else if (c.tipe_data === 'range') {
            value = { min: activeKonf?.nilai_min ?? '', max: activeKonf?.nilai_max ?? '' };
          } else {
            value = activeKonf?.nilai_min ?? '';
          }
          
          return { ...c, value, hasConfig: !!activeKonf };
        }) : [];
        setCriteria(initialCriteria);

        // Fetch student statistics
        const statsRes = await fetch(`${API_BASE_URL}/mahasiswa/statistik`);
        if (!statsRes.ok) throw new Error('Gagal memuat statistik mahasiswa');
        const statsData = await statsRes.json();
        setStats(statsData);

      } catch (error) {
        console.error("Failed to fetch initial data:", error);
        setFetchError(error.message || 'Gagal memuat data. Pastikan backend berjalan di localhost:4000');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCriteriaChange = (id, value) => {
    setCriteria(prev =>
      prev.map(c => (c.id_kriteria === id ? { ...c, value } : c))
    );
  };

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveClick = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const payload = {
        config,
        kriteria: criteria,
      };
      await onSaveConfiguration(payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExecuteClick = async () => {
    // Validasi: Kesehatan HARUS dicentang
    const kesehatanKrit = criteria.find(c => c.nama_kriteria?.toLowerCase().includes('kesehatan'));
    if (!kesehatanKrit || !kesehatanKrit.value) {
      setValidationError('Kriteria Kesehatan WAJIB diaktifkan! Tanpa kriteria ini, peserta yang sakit tidak akan dikelompokkan.');
      return;
    }
    
    setValidationError(null);
    setIsExecuting(true);
    try {
      // Simpan konfigurasi terlebih dahulu
      const payload = {
        config,
        kriteria: criteria,
      };
      await onSaveConfiguration(payload);
      
      // Tunggu sedikit agar konfigurasi tersimpan di database
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Eksekusi grouping (backend akan mengambil konfigurasi terakhir dari DB)
      await onExecuteGrouping({});
    } catch (error) {
      console.error('Execute error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <LoaderIcon className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="w-full px-4 md:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
        <div className={`p-6 rounded-xl text-center ${isDarkMode ? 'bg-red-900/20 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
          <p className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
            Gagal Memuat Data
          </p>
          <p className={isDarkMode ? 'text-red-300' : 'text-red-500'}>{fetchError}</p>
          <p className={`text-sm mt-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Pastikan backend berjalan dengan perintah: <code className="bg-gray-800 px-2 py-1 rounded text-sm">cd backend && node index.js</code>
          </p>
        </div>
        </div>
      </div>
    );
  }
  // Get kriteria by name for custom layout
  const rangeKriteria = criteria.find(c => c.tipe_data === 'range');
  const genderKriteria = criteria.find(c => c.tipe_data === 'gender');
  const fakultasKriteria = criteria.find(c => c.nama_kriteria?.toLowerCase().includes('fakultas'));
  const prodiKriteria = criteria.find(c => c.nama_kriteria?.toLowerCase().includes('prodi'));
  const kesehatanKriteria = criteria.find(c => c.nama_kriteria?.toLowerCase().includes('kesehatan'));

  // Get kriteria lainnya yang belum ter-display dengan styling khusus
  const displayedIds = [
    rangeKriteria?.id_kriteria,
    genderKriteria?.id_kriteria,
    fakultasKriteria?.id_kriteria,
    prodiKriteria?.id_kriteria,
    kesehatanKriteria?.id_kriteria
  ].filter(id => id !== undefined);

  const otherKriteria = criteria.filter(c => !displayedIds.includes(c.id_kriteria));

  // Hitung nomor urut dimulai setelah kriteria khusus
  // Tahun Akademik = 1, Range = 2, Gender = 3, Fakultas = 4, Prodi = 5, Kesehatan = 6
  const getStartNumber = () => {
    let num = 0;
    num++; // Tahun akademik always first = 1
    if (rangeKriteria) num++; // 2
    if (genderKriteria) num++; // 3
    if (fakultasKriteria) num++; // 4
    if (prodiKriteria) num++; // 5
    if (kesehatanKriteria) num++; // 6
    return num + 1; // Return next number after the last fixed criteria
  };
  
  let nextNumber = getStartNumber();

  // Generate list tahun akademik otomatis
  const generateTahunAkademik = () => {
    const currentYear = new Date().getFullYear();
    const tahunList = [];
    
    // Generate 3 tahun sebelumnya, tahun sekarang, dan 3 tahun ke depan
    for (let i = -3; i <= 3; i++) {
      const year1 = currentYear + i;
      const year2 = year1 + 1;
      tahunList.push(`${year1}/${year2}`);
    }
    
    return tahunList;
  };

  const tahunAkademikOptions = generateTahunAkademik();
  
  // Get tahun akademik sekarang sebagai default (tahun index 3 = tahun sekarang)
  const currentTahunAkademik = tahunAkademikOptions[3]; // Index 3 karena mulai dari -3

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className={isDarkMode ? "glass-card bg-gray-800/80 border-gray-700" : "glass-card bg-white/90 border-blue-100/80"}>
        {/* Success Notification */}
        {saveSuccess && (
          <div className="fixed top-20 right-8 z-50 animate-fadeIn">
            <div className="bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border-2 border-emerald-400">
              <div className="bg-white/20 p-1.5 rounded-full">
                <Check size={20} />
              </div>
              <div>
                <p className="font-bold text-lg">Berhasil!</p>
                <p className="text-sm opacity-90">Aturan berhasil disimpan</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className={isDarkMode ? "text-2xl font-black tracking-tight text-white mb-1" : "text-2xl font-black tracking-tight text-gray-900 mb-1"}>
               KONFIGURASI KRITERIA
            </h3>
          </div>
          <div className="text-right">
            <p className={`text-xs font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              PERIODE ANGKATAN
            </p>
            <p className="text-2xl font-black text-blue-600">
              {config.angkatan_kkn || currentTahunAkademik}
            </p>
          </div>
        </div>

        {/* Statistics Card */}
        {stats && (
          <div className={`mb-6 p-5 rounded-xl ${isDarkMode ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700/40' : 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200'}`}>
            <div className="flex items-center gap-2 mb-4">
              <FileCheck2 size={20} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
              <h4 className={`font-bold text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                INFORMASI DATA PESERTA KKN
              </h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Total Peserta */}
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800/60 border border-gray-700' : 'bg-white/80 border border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Users size={16} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total Peserta
                  </p>
                </div>
                <p className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.total || 0}
                </p>
              </div>

              {/* Laki-laki */}
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800/60 border border-gray-700' : 'bg-white/80 border border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <UserCheck size={16} className={isDarkMode ? 'text-sky-400' : 'text-sky-600'} />
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Laki-laki
                  </p>
                </div>
                <p className={`text-2xl font-black ${isDarkMode ? 'text-sky-300' : 'text-sky-700'}`}>
                  {stats.laki_laki || 0}
                </p>
              </div>

              {/* Perempuan */}
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800/60 border border-gray-700' : 'bg-white/80 border border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <UserX size={16} className={isDarkMode ? 'text-pink-400' : 'text-pink-600'} />
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Perempuan
                  </p>
                </div>
                <p className={`text-2xl font-black ${isDarkMode ? 'text-pink-300' : 'text-pink-700'}`}>
                  {stats.perempuan || 0}
                </p>
              </div>

              {/* Riwayat Sakit */}
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800/60 border border-gray-700' : 'bg-white/80 border border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <HeartPulse size={16} className={isDarkMode ? 'text-red-400' : 'text-red-600'} />
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Riwayat Sakit
                  </p>
                </div>
                <p className={`text-1xl font-black ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                  {stats.sakit || 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Parameter Sections */}
        <div className="space-y-4">
          {/* #1 Tahun Akademik - Full Width */}
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-900/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
                1
              </div>
              <Calendar size={16} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
              <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Tahun Akademik
              </h4>
            </div>
            <select
              value={config.angkatan_kkn}
              onChange={e => handleConfigChange('angkatan_kkn', e.target.value)}
              className={`w-full px-3 py-2 rounded-lg font-semibold text-sm ${isDarkMode ? 'bg-gray-800 border border-gray-700 text-white' : 'bg-white border border-gray-300 text-gray-800'}`}
            >
              <option value="">Pilih Tahun Akademik</option>
              {tahunAkademikOptions.map(tahun => (
                <option key={tahun} value={tahun}>{tahun}</option>
              ))}
            </select>
          </div>

          {/* Grid 2 kolom untuk parameter #2-7 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* #2 Jumlah Anggota Per-Kelompok */}
            {rangeKriteria && (
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-900/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
                    2
                  </div>
                  <Users size={16} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                  <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    Jumlah Anggota Per-Kelompok
                  </h4>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={rangeKriteria.value?.min || ''}
                    onChange={e => handleCriteriaChange(rangeKriteria.id_kriteria, { ...rangeKriteria.value, min: e.target.value === '' ? '' : parseInt(e.target.value, 10) })}
                    className={`w-16 px-2 py-2 rounded-lg font-bold text-lg text-center ${isDarkMode ? 'bg-gray-800 border border-gray-700 text-white' : 'bg-white border border-gray-300 text-gray-800'}`}
                    placeholder="8"
                  />
                  <span className={`text-xl font-black ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`}>-</span>
                  <input
                    type="number"
                    value={rangeKriteria.value?.max || ''}
                    onChange={e => handleCriteriaChange(rangeKriteria.id_kriteria, { ...rangeKriteria.value, max: e.target.value === '' ? '' : parseInt(e.target.value, 10) })}
                    className={`w-16 px-2 py-2 rounded-lg font-bold text-lg text-center ${isDarkMode ? 'bg-gray-800 border border-gray-700 text-white' : 'bg-white border border-gray-300 text-gray-800'}`}
                    placeholder="12"
                  />
                </div>
              </div>
            )}

            {/* #3 Gender */}
            {genderKriteria && (
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-900/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
                    3
                  </div>
                  <UserCheck size={16} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                  <h3 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    Jenis Kelamin
                  </h3>
                </div>
                <select
                  value={genderKriteria.value || ''}
                  onChange={e => handleCriteriaChange(genderKriteria.id_kriteria, e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg font-semibold text-sm ${isDarkMode ? 'bg-gray-800 border border-gray-700 text-white' : 'bg-white border border-gray-300 text-gray-800'}`}
                >
                  <option value="">Pilih Gender</option>
                  <option value="campur">Campur (Acak)</option>
                  <option value="seimbang">Seimbang (50:50)</option>
                  <option value="dipisah">Dipisah (Khusus L/P)</option>
                  <option value="bebas">Bebas</option>
                </select>
              </div>
            )}

            {/* #4 Fakultas */}
            {fakultasKriteria && (
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-900/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
                    4
                  </div>
                  <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    Fakultas
                  </h4>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={fakultasKriteria.value || ''}
                    onChange={e => handleCriteriaChange(fakultasKriteria.id_kriteria, e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    className={`w-16 px-2 py-2 rounded-lg font-bold text-xl text-center ${isDarkMode ? 'bg-gray-800 border border-gray-700 text-white' : 'bg-white border border-gray-300 text-gray-800'}`}
                    placeholder="2"
                  />
                  <div className="flex-1">
                    <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      minimal per-fakultas
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* #5 Prodi */}
            {prodiKriteria && (
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-900/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
                    5
                  </div>
                  <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    Prodi
                  </h4>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={prodiKriteria.value || ''}
                    onChange={e => handleCriteriaChange(prodiKriteria.id_kriteria, e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    className={`w-16 px-2 py-2 rounded-lg font-bold text-xl text-center ${isDarkMode ? 'bg-gray-800 border border-gray-700 text-white' : 'bg-white border border-gray-300 text-gray-800'}`}
                    placeholder="2"
                  />
                  <div className="flex-1">
                    <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      minimal per-prodi
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* #6 Kesehatan */}
            {kesehatanKriteria && (
              <div className={`p-4 rounded-lg ${!kesehatanKriteria.value ? 'border-2 border-red-500/50 bg-red-900/10' : (isDarkMode ? 'bg-gray-900/50 border border-gray-700' : 'bg-gray-50 border border-gray-200')}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
                      6
                    </div>
                    <HeartPulse size={14} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                    <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      Kesehatan 
                    </h4>
                  </div>
                  <span className="px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded-md">
                    WAJIB
                  </span>
                </div>
                <button
                  onClick={() => {
                    handleCriteriaChange(kesehatanKriteria.id_kriteria, !kesehatanKriteria.value);
                    if (!kesehatanKriteria.value) {
                      setValidationError(null);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                    kesehatanKriteria.value 
                      ? 'bg-green-600 text-white border-2 border-green-500' 
                      : (isDarkMode ? 'bg-gray-800 text-gray-400 border-2 border-gray-700 hover:border-red-500' : 'bg-gray-200 text-gray-600 border-2 border-gray-300 hover:border-red-500')
                  }`}
                >
                  {kesehatanKriteria.value ? '✓ ATURAN KHUSUS' : 'ATURAN KHUSUS'}
                </button>
                {!kesehatanKriteria.value && (
                  <p className="mt-2 text-xs text-red-400">
                    ⚠️ Tanpa kriteria ini, mahasiswa sakit tidak akan dikelompokkan
                  </p>
                )}
              </div>
            )}

            {/* Kriteria Lainnya - Dynamic dari Database */}
            {otherKriteria.map((c) => {
              const kriteriaNumber = nextNumber++;
              return (
                <div key={c.id_kriteria} className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-900/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
                      {kriteriaNumber}
                    </div>
                    <h3 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      {c.nama_kriteria || 'KRITERIA'}
                    </h3>
                  </div>

                  {/* Render berdasarkan tipe_data */}
                  {c.tipe_data === 'boolean' ? (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleCriteriaChange(c.id_kriteria, !c.value)}
                        className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                          c.value 
                            ? 'bg-blue-600 text-white border-2 border-blue-500' 
                            : (isDarkMode ? 'bg-gray-800 text-gray-400 border-2 border-gray-700' : 'bg-gray-200 text-gray-600 border-2 border-gray-300')
                        }`}
                      >
                        {c.value ? '✓ AKTIF' : 'AKTIFKAN'}
                      </button>
                      {c.deskripsi && (
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {c.deskripsi}
                        </p>
                      )}
                    </div>
                  ) : c.tipe_data === 'gender' ? (
                    <div>
                      <select
                        value={c.value || ''}
                        onChange={e => handleCriteriaChange(c.id_kriteria, e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg font-semibold text-sm ${isDarkMode ? 'bg-gray-800 border border-gray-700 text-white' : 'bg-white border border-gray-300 text-gray-800'}`}
                      >
                        <option value="">-- Pilih Pengaturan --</option>
                        <option value="campur">Campur (Acak)</option>
                        <option value="seimbang">Seimbang (50:50)</option>
                        <option value="dipisah">Dipisah (Khusus L/P)</option>
                        <option value="bebas">Bebas</option>
                      </select>
                      {c.deskripsi && (
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {c.deskripsi}
                        </p>
                      )}
                    </div>
                  ) : c.tipe_data === 'range' ? (
                    <div>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          value={c.value?.min || ''}
                          onChange={e => handleCriteriaChange(c.id_kriteria, { ...c.value, min: e.target.value === '' ? '' : parseInt(e.target.value, 10) })}
                          className={`w-16 px-2 py-2 rounded-lg font-bold text-lg text-center ${isDarkMode ? 'bg-gray-800 border border-gray-700 text-white' : 'bg-white border border-gray-300 text-gray-800'}`}
                          placeholder="Min"
                        />
                        <span className={`text-xl font-black ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`}>-</span>
                        <input
                          type="number"
                          value={c.value?.max || ''}
                          onChange={e => handleCriteriaChange(c.id_kriteria, { ...c.value, max: e.target.value === '' ? '' : parseInt(e.target.value, 10) })}
                          className={`w-16 px-2 py-2 rounded-lg font-bold text-lg text-center ${isDarkMode ? 'bg-gray-800 border border-gray-700 text-white' : 'bg-white border border-gray-300 text-gray-800'}`}
                          placeholder="Max"
                        />
                      </div>
                      {c.deskripsi && (
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {c.deskripsi}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          value={c.value || ''}
                          onChange={e => handleCriteriaChange(c.id_kriteria, e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                          className={`w-16 px-2 py-2 rounded-lg font-bold text-xl text-center ${isDarkMode ? 'bg-gray-800 border border-gray-700 text-white' : 'bg-white border border-gray-300 text-gray-800'}`}
                          placeholder="0"
                        />
                        <div className="flex-1">
                          <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {c.deskripsi || 'Min'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="mt-10 pt-6 border-t border-gray-700/30">
          {/* Validation Error Message */}
          {validationError && (
            <div className="mb-4 p-4 bg-red-900/30 border-2 border-red-500/50 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-sm">
                  !
                </div>
                <div className="flex-1">
                  <p className="text-red-400 font-semibold text-sm mb-1">Validasi Gagal</p>
                  <p className="text-red-300 text-xs">{validationError}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-center gap-4">
            <button 
              onClick={handleExecuteClick}
              disabled={isExecuting || !kesehatanKriteria?.value}
              className={`px-8 py-3 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
                isExecuting 
                  ? 'opacity-70 cursor-not-allowed bg-blue-400' 
                  : !kesehatanKriteria?.value
                  ? 'opacity-50 cursor-not-allowed bg-gray-600 text-gray-300'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
              }`}
            >
              {isExecuting ? (
                <>
                  <LoaderIcon size={18} className="animate-spin" />
                  MEMPROSES...
                </>
              ) : (
                <>
                  <ArrowRight size={18} />
                  PROSES PEMETAAN
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
