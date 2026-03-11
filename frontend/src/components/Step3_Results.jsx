import React, { useState, useRef } from 'react';
import { ArrowLeft, FileDown, Users, Check, Loader2, AlertTriangle, ChevronDown, ChevronUp, RefreshCw, ChevronsDown, ChevronsUp } from 'lucide-react';
import API_BASE_URL from '../config/api';

export default function Step3_Results({ groupingResult, onBack, onRestart, isDarkMode }) {
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [savedIdHasil, setSavedIdHasil] = useState(null);
  const [showSisaMahasiswa, setShowSisaMahasiswa] = useState(true);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  
  const scrollContainerRef = useRef(null);
  const bottomRef = useRef(null);

  if (!groupingResult || !groupingResult.groups) {
    return (
      <div className="text-center p-8">
        <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
          Hasil belum tersedia. Silakan jalankan proses pengelompokan terlebih dahulu.
        </p>
      </div>
    );
  }

  const { rules, konfigurasi, groups, statistics, sisaMahasiswa } = groupingResult;
  const angkatan = konfigurasi?.angkatan_kkn || new Date().getFullYear();
  
  // Check if there are leftover students
  const hasSisaMahasiswa = sisaMahasiswa && sisaMahasiswa.length > 0;

  // Function untuk hanya menyimpan ke database
  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const saveResponse = await fetch(`${API_BASE_URL}/autogroup/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groups, rules, konfigurasi, statistics }),
      });
      
      if (!saveResponse.ok) {
        const errData = await saveResponse.json();
        throw new Error(errData.error || 'Gagal menyimpan hasil');
      }

      const saveData = await saveResponse.json();
      const idHasil = saveData.id_hasil;

      if (!idHasil) {
        throw new Error('ID hasil tidak ditemukan dari response');
      }

      console.log('Data berhasil disimpan dengan ID:', idHasil);
      setSavedIdHasil(idHasil);
      
      // Show success
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
    } catch (err) {
      console.error('Save error:', err);
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Function untuk export Excel
  const handleExport = async () => {
    setIsExporting(true);
    setSaveError(null);
    
    try {
      // Jika belum disimpan, simpan dulu
      let idHasil = savedIdHasil;
      
      if (!idHasil) {
        const saveResponse = await fetch(`${API_BASE_URL}/autogroup/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groups, rules, konfigurasi, statistics }),
        });
        
        if (!saveResponse.ok) {
          const errData = await saveResponse.json();
          throw new Error(errData.error || 'Gagal menyimpan hasil');
        }

        const saveData = await saveResponse.json();
        idHasil = saveData.id_hasil;
        setSavedIdHasil(idHasil);
        console.log('Data berhasil disimpan dengan ID:', idHasil);
      }
      
      // Download structured Excel from backend
      const excelResponse = await fetch(`${API_BASE_URL}/autogroup/hasil/${idHasil}/export-excel`);
      
      if (!excelResponse.ok) {
        throw new Error('Gagal mengunduh file Excel');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = excelResponse.headers.get('Content-Disposition');
      let filename = `Hasil_Autogroup_KKN_${angkatan}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Download the Excel file
      const blob = await excelResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Export error:', err);
      setSaveError(err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Scroll handlers
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // Show buttons if scrolled more than 100px
    setShowScrollButtons(scrollTop > 100);
  };

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 flex flex-col" style={{ height: 'calc(100vh - 2rem)' }}>
      {/* Sticky Header Section */}
      <div className="flex-shrink-0 space-y-4 mb-4">
        {/* Header */}
        <div className={isDarkMode ? "glass-card bg-gray-800/80 border-gray-700" : "glass-card bg-white/90 border-blue-100/80"}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-200/50'}`}>
              <ArrowLeft size={24} className={isDarkMode ? "text-white" : "text-gray-800"} />
            </button>
            <div>
              <h4 className={isDarkMode ? "text-2xl font-bold text-white" : "text-2xl font-bold text-gray-800"}>
                Hasil Penempatan — Angkatan {angkatan}
              </h4>
              <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                {groups.length} kelompok | {statistics?.total_tergabung || statistics?.total_mahasiswa || 0} mahasiswa tergabung
                {hasSisaMahasiswa && <span className="text-amber-500 font-semibold"> • {sisaMahasiswa.length} belum terkelompok</span>}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onRestart}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
              }`}
              title="Mulai proses pengelompokan baru dari awal"
            >
              <RefreshCw size={16} />
              Kelompokkan Ulang
            </button>
            <button 
              onClick={handleSave} 
              disabled={isSaving || saveSuccess}
              className={`flex items-center gap-2 ${
                saveSuccess 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } px-6 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Simpan hasil ke database"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : saveSuccess ? <Check size={16} /> : <Users size={16} />}
              {isSaving ? 'Menyimpan...' : saveSuccess ? 'Tersimpan!' : 'Simpan'}
            </button>
            <button 
              onClick={handleExport} 
              disabled={isExporting}
              className={`flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Unduh hasil dalam format Excel"
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
              {isExporting ? 'Mengekspor...' : 'EXPORT'}
            </button>
          </div>
        </div>
        
        {saveError && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {saveError}
          </div>
        )}
      </div>

      {/* Statistics Summary */}
      {statistics && (
        <div className={`grid grid-cols-2 ${hasSisaMahasiswa ? 'md:grid-cols-6' : 'md:grid-cols-5'} gap-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          <div className={`text-center p-4 rounded-xl ${isDarkMode ? 'bg-gray-800/60 border border-gray-700' : 'bg-white/80 border border-gray-200'}`}>
            <p className="text-2xl font-bold text-blue-500">{statistics.jumlah_kelompok || groups.length}</p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Kelompok</p>
          </div>
          <div className={`text-center p-4 rounded-xl ${isDarkMode ? 'bg-gray-800/60 border border-gray-700' : 'bg-white/80 border border-gray-200'}`}>
            <p className="text-2xl font-bold text-emerald-500">{statistics.total_tergabung || statistics.total_mahasiswa || 0}</p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tergabung</p>
          </div>
          {hasSisaMahasiswa && (
            <div className={`text-center p-4 rounded-xl ${isDarkMode ? 'bg-amber-900/30 border border-amber-700/50' : 'bg-amber-50/80 border border-amber-300'}`}>
              <p className="text-2xl font-bold text-amber-500">{sisaMahasiswa.length}</p>
              <p className={`text-xs ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>Belum Kelompok</p>
            </div>
          )}
          <div className={`text-center p-4 rounded-xl ${isDarkMode ? 'bg-gray-800/60 border border-gray-700' : 'bg-white/80 border border-gray-200'}`}>
            <p className="text-2xl font-bold text-amber-500">{statistics.avg_per_kelompok || '-'}</p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Rata-rata/Kelompok</p>
          </div>
          <div className={`text-center p-4 rounded-xl ${isDarkMode ? 'bg-gray-800/60 border border-gray-700' : 'bg-white/80 border border-gray-200'}`}>
            <p className="text-2xl font-bold text-pink-500">{statistics.total_sakit || 0}</p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Riwayat Sakit</p>
            {/* Legend Warna Kesehatan */}
            <div className="mt-1 pt-1 border-t border-gray-300/20 flex items-center justify-center gap-3 text-[5px]">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Sehat</p>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Sakit</p>
              </div>
            </div>
          </div>
          <div className={`text-center p-4 rounded-xl ${isDarkMode ? 'bg-gray-800/60 border border-gray-700' : 'bg-white/80 border border-gray-200'}`}>
            <p className="text-2xl font-bold text-purple-500">{statistics.kelompok_dengan_lokasi || 0}</p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Lokasi Assigned</p>
          </div>
        </div>
      )}
      </div>

      {/* Scrollable Results Container */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-6 pr-2"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Sisa Mahasiswa Section - Warning Box */}
        {hasSisaMahasiswa && (
        <div className={`border-2 rounded-xl overflow-hidden ${isDarkMode ? 'bg-amber-900/20 border-amber-600/40' : 'bg-amber-50 border-amber-400'}`}>
          {/* Collapsible Header */}
          <button 
            onClick={() => setShowSisaMahasiswa(!showSisaMahasiswa)}
            className={`w-full p-4 flex items-center justify-between transition-colors ${
              isDarkMode ? 'hover:bg-amber-900/30' : 'hover:bg-amber-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle size={24} className="text-amber-500" />
              <div className="text-left">
                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-800'}`}>
                  Mahasiswa Belum Terkelompok
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-amber-300/70' : 'text-amber-700'}`}>
                  {sisaMahasiswa.length} mahasiswa tidak memenuhi kriteria kelompok manapun
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                isDarkMode ? 'bg-amber-600/30 text-amber-300' : 'bg-amber-200 text-amber-800'
              }`}>
                {sisaMahasiswa.length}
              </span>
              {showSisaMahasiswa ? (
                <ChevronUp size={20} className={isDarkMode ? 'text-amber-400' : 'text-amber-600'} />
              ) : (
                <ChevronDown size={20} className={isDarkMode ? 'text-amber-400' : 'text-amber-600'} />
              )}
            </div>
          </button>
          
          {/* Collapsible Content */}
          {showSisaMahasiswa && (
            <div className="border-t border-amber-400/30">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={isDarkMode ? "bg-amber-900/30 border-b border-amber-700/50" : "bg-amber-100/50 border-b border-amber-300"}>
                    <tr>
                      <th className="th-cell w-12">No</th>
                      <th className="th-cell">NIM</th>
                      <th className="th-cell text-left">Nama Mahasiswa</th>
                      <th className="th-cell text-left">Prodi</th>
                      <th className="th-cell text-left">Fakultas</th>
                      <th className="th-cell">JK</th>
                      <th className="th-cell">Kesehatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sisaMahasiswa.map((mhs, index) => {
                      const nim = mhs.nim || mhs.NIM || '-';
                      const nama = mhs.nama || mhs.Nama || '-';
                      const prodi = mhs.prodi || mhs.Prodi || '-';
                      const fakultas = mhs.fakultas || mhs.Fakultas || '-';
                      const jk = mhs.jenis_kelamin || mhs['Jenis Kelamin'] || '-';
                      const kes = mhs.kesehatan || '-';
                      const isSakit = (kes.toLowerCase().includes('sakit') || kes.toLowerCase().includes('tidak sehat'));
                      
                      return (
                        <tr key={nim + index} className={isDarkMode ? "hover:bg-amber-900/20" : "hover:bg-amber-100/50"}>
                          <td className={`td-cell text-center ${isDarkMode ? 'text-amber-200' : 'text-amber-900'}`}>{index + 1}</td>
                          <td className={`td-cell text-center font-mono text-sm ${isDarkMode ? 'text-amber-200' : 'text-amber-900'}`}>{nim}</td>
                          <td className={`td-cell text-left font-medium ${isDarkMode ? 'text-amber-100' : 'text-amber-950'}`}>{nama}</td>
                          <td className={`td-cell text-left ${isDarkMode ? 'text-amber-300' : 'text-amber-800'}`}>{prodi}</td>
                          <td className={`td-cell text-left ${isDarkMode ? 'text-amber-300' : 'text-amber-800'}`}>{fakultas}</td>
                          <td className={`td-cell text-center ${isDarkMode ? 'text-amber-300' : 'text-amber-800'}`}>{jk.charAt(0).toUpperCase()}</td>
                          <td className="td-cell text-center">
                            <div className="flex justify-center items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${isSakit ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                              <span className={`text-xs ${isDarkMode ? 'text-amber-300' : 'text-amber-800'}`}>{kes}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Info Footer */}
              <div className={`p-4 border-t ${isDarkMode ? 'border-amber-700/50 bg-amber-900/20' : 'border-amber-300 bg-amber-100/30'}`}>
                <p className={`text-sm ${isDarkMode ? 'text-amber-300' : 'text-amber-800'}`}>
                  💡 <strong>Catatan:</strong> Mahasiswa ini tidak memenuhi kriteria kelompok yang sudah ada (kapasitas penuh, konflik gender, atau batasan lainnya). 
                  Anda dapat mengatur ulang kriteria atau menambah jumlah kelompok untuk mengakomodasi semua mahasiswa.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

        {/* Group Cards */}
        <div className="space-y-6">
          {groups.map((group) => {
          const lokasi = group.lokasi || 'Lokasi Belum Ditentukan';
          const desaKec = group.desa ? `${group.desa} / ${group.kecamatan || '-'}` : (group.desa_kecamatan || '-');
          const kabupaten = group.kabupaten || '-';
          const hasSakit = group.stats?.sakit > 0;
          const jarakFaskes = group.jarak_ke_puskesmas || null;
          
          // Tentukan warna kotak grup berdasarkan jarak faskes
          let grupBoxColor = 'bg-green-600'; // Default: biru untuk jarak aman (<=5km)
          if (jarakFaskes !== null && jarakFaskes !== undefined) {
            const jarak = parseFloat(jarakFaskes);
            if (jarak > 10) {
              grupBoxColor = 'bg-red-600'; // Merah untuk sangat jauh (>10km)
            } else if (jarak > 5) {
              grupBoxColor = 'bg-red-600'; // Merah untuk jauh (5-10km)
            }
          }
          
          return (
            <div key={group.nomor_kelompok} className={isDarkMode ? "glass-card bg-gray-800/80 border-gray-700 overflow-hidden" : "glass-card bg-white/90 border-blue-100/80 overflow-hidden"}>
              {/* Group Header */}
              <div className={`flex justify-between items-center p-4 ${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-100/80'}`}>
                <div className="flex items-center gap-4">
                  {/* Kotak Grup - Warna mengikuti jarak faskes */}
                  <div className={`${grupBoxColor} text-white rounded-lg w-12 h-12 flex flex-col items-center justify-center`}>
                    <span className="text-[10px] opacity-80">GRUP</span>
                    <span className="font-bold text-xl">{group.nomor_kelompok}</span>
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{lokasi.toUpperCase()}</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{desaKec} — {kabupaten}</p>
                    {/* Tampilkan Jarak Faskes */}
                    {jarakFaskes !== null && jarakFaskes !== undefined && (
                      <p className={`text-xs mt-1 flex items-center gap-1 ${
                        parseFloat(jarakFaskes) > 10 
                          ? (isDarkMode ? 'text-red-400' : 'text-red-600')
                          : parseFloat(jarakFaskes) > 5
                          ? (isDarkMode ? 'text-red-400' : 'text-red-600')
                          : (isDarkMode ? 'text-green-400' : 'text-green-600')
                      }`}>
                        <span className="font-semibold">🏥 Jarak Faskes:</span>
                        <span className="font-bold">{parseFloat(jarakFaskes).toFixed(2)} km</span>
                        {parseFloat(jarakFaskes) > 10 && <span className="text-[10px] font-normal">(Sangat Jauh - Bahaya!)</span>}
                        {parseFloat(jarakFaskes) > 5 && parseFloat(jarakFaskes) <= 10 && <span className="text-[10px] font-normal">(Jauh - Harusnya Sehat Semua)</span>}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  {hasSakit && (
                    <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                      {group.stats.sakit} Riwayat Sakit
                    </span>
                  )}
                  <Users size={24} className="text-blue-500" />
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Anggota</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{group.anggota?.length || group.stats?.total || 0}</p>
                  </div>
                </div>
              </div>
              
              {/* Member Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={isDarkMode ? "border-b border-gray-700 bg-gray-900/30" : "border-b border-gray-200 bg-gray-50/50"}>
                    <tr>
                      <th className="th-cell w-12">No</th>
                      <th className="th-cell">NIM</th>
                      <th className="th-cell text-left">Nama Mahasiswa</th>
                      <th className="th-cell text-left">Prodi</th>
                      <th className="th-cell text-left">Fakultas</th>
                      <th className="th-cell">JK</th>
                      <th className="th-cell">Kes</th>
                      <th className="th-cell">Kelompok</th>
                      <th className="th-cell">No.Telepon</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(group.anggota || []).map((mhs, index) => {
                      const nim = mhs.nim || mhs.NIM || '-';
                      const nama = mhs.nama || mhs.Nama || '-';
                      const prodi = mhs.prodi || mhs.Prodi || '-';
                      const fakultas = mhs.fakultas || mhs.Fakultas || '-';
                      const jk = mhs.jenis_kelamin || mhs['Jenis Kelamin'] || '-';
                      const kes = mhs.kesehatan || '-';
                      const noTelepon = mhs.nomor_telepon || mhs.no_telepon || '-';
                      const isSakit = (kes.toLowerCase().includes('sakit') || kes.toLowerCase().includes('tidak sehat'));
                      
                      return (
                        <tr key={nim + index} className={isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50/50"}>
                          <td className={`td-cell text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{index + 1}</td>
                          <td className={`td-cell text-center font-mono text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{nim}</td>
                          <td className={`td-cell text-left font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{nama}</td>
                          <td className={`td-cell text-left ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{prodi}</td>
                          <td className={`td-cell text-left ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{fakultas}</td>
                          <td className={`td-cell text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{jk.charAt(0).toUpperCase()}</td>
                          <td className="td-cell text-center">
                            <div className="flex justify-center">
                              <div className={`w-3 h-3 rounded-full ${isSakit ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                            </div>
                          </td>
                          <td className={`td-cell text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{group.nomor_kelompok}</td>
                          <td className={`td-cell text-center font-mono text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{noTelepon}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
        </div>
        
        {/* Bottom Reference Point */}
        <div ref={bottomRef} className="h-1"></div>
      </div>

      {/* Floating Scroll Buttons */}
      {showScrollButtons && (
        <div className="fixed bottom-8 right-8 flex flex-col gap-2 z-50">
          {/* Scroll to Top */}
          <button
            onClick={scrollToTop}
            className={`p-3 rounded-full shadow-lg transition-all hover:scale-110 ${
              isDarkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            title="Scroll ke Atas"
          >
            <ChevronsUp size={24} />
          </button>
          
          {/* Scroll to Bottom */}
          <button
            onClick={scrollToBottom}
            className={`p-3 rounded-full shadow-lg transition-all hover:scale-110 ${
              isDarkMode 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
            title="Scroll ke Bawah"
          >
            <ChevronsDown size={24} />
          </button>
        </div>
      )}
    </div>
  );
}
