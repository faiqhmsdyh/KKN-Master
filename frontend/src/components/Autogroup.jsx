import React, { useState, useRef, useEffect, useContext } from 'react';
import { UsersIcon, UploadIcon, FileSpreadsheetIcon, LoaderIcon, CheckCircleIcon, AlertCircleIcon, GraduationCapIcon, HeartPulseIcon, CarIcon, MapPinIcon, ChevronDownIcon } from 'lucide-react';
import { ThemeContext } from '../App';
import '../styles/Autogroup.css';

// Import XLSX library for Excel parsing
let XLSX;

// Load XLSX library dynamically
const loadXLSX = async () => {
  try {
    XLSX = await import('xlsx');
    return true;
  } catch (err) {
    console.warn('XLSX library not available, CSV fallback will be used');
    return false;
  }
};

// Initialize XLSX on component mount
loadXLSX();

export default function Autogroup() {
  const { isDarkMode } = useContext(ThemeContext);
  const fileInputRef = useRef(null);
  const [mahasiswaData, setMahasiswaData] = useState([]);
  const [importStatus, setImportStatus] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [groupingResult, setGroupingResult] = useState(null);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [criteriaList, setCriteriaList] = useState([]);
  const [selectedCriteria, setSelectedCriteria] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); // 1=upload,2=parameter,3=result
  const [uploadedFileName, setUploadedFileName] = useState('');
  
  const [filterCriteria, setFilterCriteria] = useState({
    minJumlahMahasiswa: 8,
    maxJumlahMahasiswa: 12,
    minProdi: 2,
    minFakultas: 1,
    jenisKelamin: 'semua'
  });
  const [groupingForm, setGroupingForm] = useState({
    nama_angkatan: '',
    angkatan_ke: '',
    kampus_lat: -7.7979,
    kampus_lng: 110.3701
  });

  // Fetch locations and criteria on component mount
  useEffect(() => {
    fetchLocations();
    fetchCriteria();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await fetch('http://localhost:4000/lokasi');
      if (!response.ok) throw new Error('Failed to fetch locations');
      const data = await response.json();
      setLocations(data);
    } catch (err) {
      console.error('Fetch locations error:', err);
    }
  };

  const fetchCriteria = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/filter-criteria');
      if (!response.ok) throw new Error('Failed to fetch criteria');
      const data = await response.json();
      setCriteriaList(data);
      
      // Set default criteria (yang pertama atau yang aktif)
      if (data.length > 0) {
        const activeCriteria = data.find(c => c.is_active) || data[0];
        setSelectedCriteria(activeCriteria.id_criteria);
        // Update filter criteria dengan nilai dari database
        setFilterCriteria({
          minJumlahMahasiswa: activeCriteria.min_jumlah_mahasiswa,
          maxJumlahMahasiswa: activeCriteria.max_jumlah_mahasiswa,
          minProdi: activeCriteria.min_prodi,
          minFakultas: activeCriteria.min_fakultas,
          jenisKelamin: activeCriteria.jenis_kelamin
        });
      }
    } catch (err) {
      console.error('Fetch criteria error:', err);
    }
  };

  const handleChangeCriteria = (criteriaId) => {
    const criteria = criteriaList.find(c => c.id_criteria === parseInt(criteriaId));
    if (criteria) {
      setSelectedCriteria(criteriaId);
      setFilterCriteria({
        minJumlahMahasiswa: criteria.min_jumlah_mahasiswa,
        maxJumlahMahasiswa: criteria.max_jumlah_mahasiswa,
        minProdi: criteria.min_prodi,
        minFakultas: criteria.min_fakultas,
        jenisKelamin: criteria.jenis_kelamin
      });
      setImportStatus({ 
        type: 'success', 
        message: `Kriteria "${criteria.nama_kriteria}" berhasil dipilih` 
      });
    }
  };

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target.result;
        
        // Try to parse with XLSX library first
        if (XLSX && XLSX.read) {
          try {
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(worksheet);

            if (json.length === 0) {
              setImportStatus({ type: 'error', message: 'File Excel kosong!' });
              setIsLoading(false);
              return;
            }

            // Normalize column names to lowercase
            const normalizedJson = json.map(row => {
              const newRow = {};
              Object.keys(row).forEach(key => {
                newRow[key.toLowerCase().trim()] = row[key];
              });
              return newRow;
            });

            setMahasiswaData(normalizedJson);
            setImportStatus({ 
              type: 'success', 
              message: `${normalizedJson.length} data mahasiswa berhasil diimport (Excel mode)!` 
            });
            setIsLoading(false);
            setUploadedFileName(file.name || 'uploaded.xlsx');
            setCurrentStep(2);
            return;
          } catch (xlsxErr) {
            console.log('XLSX parsing gagal, fallback ke CSV parsing...');
          }
        }

        // Fallback: Parse as CSV
        const text = new TextDecoder().decode(data);
        const lines = text.split('\n');
        
        if (lines.length < 2) {
          throw new Error('File kosong atau format tidak didukung');
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
        const json = [];
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const row = {};
          headers.forEach((header, idx) => {
            row[header] = values[idx] || '';
          });
          json.push(row);
        }

        if (json.length === 0) {
          throw new Error('Tidak ada data mahasiswa ditemukan');
        }

        setMahasiswaData(json);
        setImportStatus({ 
          type: 'success', 
          message: `${json.length} data mahasiswa berhasil diimport (CSV mode)!` 
        });
        setIsLoading(false);
        setUploadedFileName(file.name || 'uploaded.csv');
        setCurrentStep(2);
      } catch (err) {
        console.error('Import error:', err);
        setImportStatus({ type: 'error', message: 'Gagal membaca file: ' + err.message });
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleGenerateAutogroup = async () => {
    if (!mahasiswaData.length) {
      alert('Import data mahasiswa terlebih dahulu!');
      return;
    }

    if (!groupingForm.nama_angkatan || !groupingForm.angkatan_ke) {
      alert('Isi nama angkatan dan angkatan ke-berapa!');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        nama_angkatan: groupingForm.nama_angkatan,
        angkatan_ke: parseInt(groupingForm.angkatan_ke),
        kampus_lat: parseFloat(groupingForm.kampus_lat),
        kampus_lng: parseFloat(groupingForm.kampus_lng),
        mahasiswaList: mahasiswaData,
        filterCriteria,
        locations: locations
      };

      console.log('Sending autogroup request with payload:', payload);

      const response = await fetch('http://localhost:4000/api/autogroup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server error response:', errorData);
        throw new Error(`Server error ${response.status}: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      console.log('Autogroup result:', result);
      
      setGroupingResult(result);
      setImportStatus({ 
        type: 'success', 
        message: `Berhasil membuat ${result.jumlah_kelompok} kelompok dari ${result.jumlah_mahasiswa} mahasiswa di ${result.lokasi_terpilih?.length || 0} lokasi!` 
      });
    } catch (err) {
      console.error('Autogroup error:', err);
      setImportStatus({ type: 'error', message: 'Gagal generate autogroup: ' + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportResult = () => {
    if (!groupingResult) return;

    // Try to use XLSX library for proper Excel export
    if (XLSX && XLSX.utils && XLSX.writeFile) {
      try {
        // Create workbook
        const wb = XLSX.utils.book_new();

        // 1. Summary sheet
        const summaryData = [
          ['HASIL PENGELOMPOKAN MAHASISWA KKN'],
          [],
          ['Nama Angkatan', groupingResult.nama_angkatan],
          ['Angkatan Ke-', groupingResult.angkatan_ke],
          ['Tanggal Export', new Date().toLocaleDateString('id-ID')],
          [],
          ['Jumlah Kelompok', groupingResult.jumlah_kelompok],
          ['Jumlah Mahasiswa', groupingResult.jumlah_mahasiswa],
          [],
          ['Lokasi Penempatan']
        ];
        
        // Add locations
        if (groupingResult.lokasi_terpilih && groupingResult.lokasi_terpilih.length > 0) {
          groupingResult.lokasi_terpilih.forEach(loc => {
            summaryData.push([loc.lokasi, `${loc.desa_kecamatan || loc.dusun_kecamatan || '-'}, ${loc.kabupaten}`]);
          });
        }
        
        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
        summaryWs['!cols'] = [{ wch: 25 }, { wch: 40 }];
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Ringkasan');

        // 2. Detail sheet dengan data tabel utama
        const detailData = [
          ['HASIL PENGELOMPOKAN MAHASISWA KKN'],
          ['Nama Angkatan', groupingResult.nama_angkatan],
          ['Angkatan Ke-', groupingResult.angkatan_ke],
          ['Tanggal', new Date().toLocaleDateString('id-ID')],
          [],
          ['no', 'nim', 'nama', 'prodi','fakultas', 'kelompok', 'lokasi', 'desa/Kecamatan', 'kabupaten']
        ];

        // Flatten semua mahasiswa dengan nomor urut
        let rowNo = 1;
        groupingResult.groups.forEach(group => {
          group.anggota.forEach(member => {
            detailData.push([
              rowNo++,
              member.nim || member.NIM || '-',
              member.nama || member.Nama || '-',
              member.prodi || member.Prodi || '-',
              member.fakultas || member.Fakultas || '-',
              group.nomor_kelompok,
              group.lokasi || '-',
              '-',
              group.desa_kecamatan || '-',
              group.kabupaten || '-'
            ]);
          });
        });

        const detailWs = XLSX.utils.aoa_to_sheet(detailData);
        detailWs['!cols'] = [
          { wch: 5 },   // NO
          { wch: 15 },  // NIM
          { wch: 25 },  // NAMA
          { wch: 20 },  // PRODI
          { wch: 20 },  // FAKULTAS
          { wch: 10 },  // KELOMPOK
          { wch: 20 },  // Lokasi
          { wch: 5 },   // Desa
          { wch: 15 },  // Kecamatan
          { wch: 15 }   // Kabupaten
        ];
        XLSX.utils.book_append_sheet(wb, detailWs, 'Detail');

        // Write file
        XLSX.writeFile(wb, `autogroup-${groupingResult.nama_angkatan}-${new Date().toISOString().slice(0, 10)}.xlsx`);
        return;
      } catch (err) {
        console.warn('XLSX export failed, falling back to CSV:', err);
      }
    }

    // Fallback ke CSV jika XLSX tidak tersedia
    let csvContent = "HASIL PENGELOMPOKAN MAHASISWA KKN\n\n";
    csvContent += "Nama Angkatan,Angkatan Ke,Tanggal\n";
    csvContent += `"${groupingResult.nama_angkatan}",${groupingResult.angkatan_ke},${new Date().toLocaleDateString('id-ID')}\n\n`;

    csvContent += `Jumlah Kelompok,${groupingResult.jumlah_kelompok}\n`;
    csvContent += `Jumlah Mahasiswa,${groupingResult.jumlah_mahasiswa}\n\n`;

    csvContent += "no,nim,nama,prodi,fakultas,kelompok,lokasi,desa/kecamatan,kabupaten\n";
    
    let rowNo = 1;
    groupingResult.groups.forEach(group => {
      group.anggota.forEach(member => {
        csvContent += `${rowNo++},`;
        csvContent += `"${member.nim || member.NIM || '-'}",`;
        csvContent += `"${member.nama || member.Nama || '-'}",`;
        csvContent += `"${member.prodi || member.Prodi || '-'}",`;
        csvContent += `"${member.fakultas || member.Fakultas || '-'}",`;
        csvContent += `${group.nomor_kelompok},`;
        csvContent += `"${group.lokasi || '-'}",`;
        csvContent += `"-",`;
        csvContent += `"${group.desa_kecamatan || '-'}",`;
        csvContent += `"${group.kabupaten || '-'}"\n`;
      });
    });

    // Download CSV
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
    element.setAttribute('download', `autogroup-${groupingResult.nama_angkatan}-${new Date().toISOString().slice(0, 10)}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <section className="space-y-6 font-sans">
      {/* Header + Stepper */}
      <div className="space-y-3">
        <h2 className={isDarkMode ? "text-2xl font-extrabold text-white uppercase" : "text-2xl font-extrabold text-gray-900 uppercase"}>AUTOGROUP</h2>

        {/* Stepper */}
        <div className="flex items-center gap-6 mt-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">1</div>
            <div className={isDarkMode ? "text-sm text-gray-300" : "text-sm text-gray-600"}>Unggah File</div>
          </div>

          <div className="flex items-center gap-3 opacity-60">
            <div className="w-9 h-9 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center border border-gray-300">2</div>
            <div className="text-sm text-gray-500">Parameter Kriteria</div>
          </div>

          <div className="flex items-center gap-3 opacity-60">
            <div className="w-9 h-9 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center border border-gray-300">3</div>
            <div className="text-sm text-gray-500">Hasil Akhir</div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className={isDarkMode ? "bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-gray-700 animate-fadeIn space-y-6" : "bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-blue-50 animate-fadeIn space-y-6"}>

        {/* Step 1: Upload Card */}
        {currentStep === 1 && (
          <div className={isDarkMode ? "p-8 rounded-2xl bg-gray-900/60 flex flex-col items-center gap-6" : "p-8 rounded-2xl bg-white flex flex-col items-center gap-6"}>
            <div className={isDarkMode ? "w-full max-w-3xl p-12 rounded-2xl border-2 border-dashed border-gray-700 bg-gray-800/30 flex flex-col items-center gap-6" : "w-full max-w-3xl p-12 rounded-2xl border-2 border-dashed border-gray-200 bg-white flex flex-col items-center gap-6"}>
              <UploadIcon size={56} className={isDarkMode ? "text-blue-400" : "text-blue-600"} />
              <h3 className={isDarkMode ? "text-xl font-bold text-white" : "text-xl font-bold text-gray-900"}>UNGGAH DATA</h3>
              <p className={isDarkMode ? "text-sm text-gray-300 text-center max-w-2xl" : "text-sm text-gray-600 text-center max-w-2xl"}>Silakan upload data mahasiswa berformat .xlsx untuk memulai langkah pengaturan kriteria.</p>

              <div className="w-full flex justify-center">
                <button onClick={() => fileInputRef.current.click()} className="px-6 py-4 bg-[#07102a] text-white rounded-lg shadow-md hover:shadow-lg transition-all text-sm font-medium">
                  PILIH DOKUMEN EXCEL
                </button>
              </div>
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" ref={fileInputRef} onChange={handleFileImport} />
            </div>
          </div>
        )}

        {/* Step 2: Parameter Kriteria Panel */}
        {currentStep === 2 && (
          <div className="w-full max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-lg">
            <div className={isDarkMode ? "p-6 bg-gradient-to-r from-gray-900 to-gray-800 text-white" : "p-6 bg-gradient-to-r from-black to-slate-800 text-white"}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={isDarkMode ? "bg-gray-800 p-3 rounded-lg" : "bg-gray-900 p-3 rounded-lg"}>
                    <FileSpreadsheetIcon size={28} className="text-emerald-300" />
                  </div>
                  <div>
                    <div className="text-xs text-emerald-200">FILE BERHASIL DIMUAT</div>
                    <div className="font-semibold italic text-lg">{uploadedFileName || 'file_upload.xlsx'}</div>
                  </div>
                </div>
                <div>
                  <button onClick={() => alert('Aturan disimpan (placeholder)')} className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:shadow-lg">SIMPAN ATURAN</button>
                </div>
              </div>
            </div>

            <div className={isDarkMode ? "p-6 bg-gray-800/40 border-t border-gray-700" : "p-6 bg-white"}>
              {/* Reuse existing Import Status and Grouping Form & Criteria here */}
              <div className={isDarkMode ? "mb-4 bg-gray-700/50 p-4 rounded-xl border border-gray-600" : "mb-4 bg-white/70 p-4 rounded-xl border border-blue-100"}>
                {isLoading && mahasiswaData.length === 0 ? (
                  <div className={isDarkMode ? "flex items-center gap-2 text-blue-400" : "flex items-center gap-2 text-blue-600"}>
                    <LoaderIcon size={18} className="animate-spin" /> 
                    <span>Mengimport data...</span>
                  </div>
                ) : importStatus.type === 'success' && mahasiswaData.length > 0 ? (
                  <div className="space-y-3">
                    <div className={isDarkMode ? "flex items-center gap-2 text-emerald-400" : "flex items-center gap-2 text-emerald-600"}>
                      <CheckCircleIcon size={18} /> 
                      <span>{mahasiswaData.length} data mahasiswa siap diproses</span>
                    </div>
                    <div className={isDarkMode ? "text-sm text-gray-300 bg-gray-800/50 p-3 rounded-lg" : "text-sm text-gray-600 bg-gray-50 p-3 rounded-lg"}>
                      Kolom yang terdeteksi: {Object.keys(mahasiswaData[0] || {}).join(', ')}
                    </div>
                  </div>
                ) : importStatus.type === 'error' ? (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircleIcon size={18} /> 
                    <span>{importStatus.message}</span>
                  </div>
                ) : (
                  <div></div>
                )}
              </div>

              {/* Existing grouping form & criteria (copied from below) */}
              <div className={isDarkMode ? "bg-gray-700/50 p-6 rounded-xl space-y-4 border border-gray-600" : "bg-blue-50/50 p-6 rounded-xl space-y-4"}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className={isDarkMode ? "block text-sm font-medium text-gray-300 mb-2" : "block text-sm font-medium text-gray-700 mb-2"}>Nama Angkatan</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Angkatan 2024" 
                      value={groupingForm.nama_angkatan}
                      onChange={(e) => setGroupingForm({...groupingForm, nama_angkatan: e.target.value})}
                      className={isDarkMode ? "w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white" : "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"}
                    />
                  </div>
                  <div>
                    <label className={isDarkMode ? "block text-sm font-medium text-gray-300 mb-2" : "block text-sm font-medium text-gray-700 mb-2"}>Angkatan Ke-</label>
                    <input 
                      type="number" 
                      placeholder="Contoh: 1" 
                      min="1"
                      value={groupingForm.angkatan_ke}
                      onChange={(e) => setGroupingForm({...groupingForm, angkatan_ke: e.target.value})}
                      className={isDarkMode ? "w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white" : "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"}
                    />
                  </div>
                  <div>
                    <label className={isDarkMode ? "block text-sm font-medium text-gray-300 mb-2" : "block text-sm font-medium text-gray-700 mb-2"}>Lat Kampus</label>
                    <input 
                      type="number" 
                      placeholder="-7.7979" 
                      step="0.0001"
                      value={groupingForm.kampus_lat}
                      onChange={(e) => setGroupingForm({...groupingForm, kampus_lat: e.target.value})}
                      className={isDarkMode ? "w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white" : "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"}
                    />
                  </div>
                  <div>
                    <label className={isDarkMode ? "block text-sm font-medium text-gray-300 mb-2" : "block text-sm font-medium text-gray-700 mb-2"}>Lng Kampus</label>
                    <input 
                      type="number" 
                      placeholder="110.3701" 
                      step="0.0001"
                      value={groupingForm.kampus_lng}
                      onChange={(e) => setGroupingForm({...groupingForm, kampus_lng: e.target.value})}
                      className={isDarkMode ? "w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white" : "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"}
                    />
                  </div>
                </div>

                <div className={isDarkMode ? "bg-gray-800/50 p-3 rounded-lg text-sm text-blue-300 border border-gray-600" : "bg-blue-100/50 p-3 rounded-lg text-sm text-blue-800"}>
                  <p className="font-semibold mb-1">📍 Penempatan Otomatis</p>
                  <p>Sistem akan otomatis menempatkan kelompok ke lokasi terdekat dari kampus berdasarkan koordinat GPS.</p>
                  {locations.length > 0 && (
                    <p className="mt-2">Tersedia <strong>{locations.length}</strong> lokasi untuk penempatan.</p>
                  )}
                </div>

                <div className={isDarkMode ? "bg-gray-800/50 border border-emerald-700 p-4 rounded-lg" : "bg-emerald-50 border border-emerald-200 p-4 rounded-lg"}>
                  <label className={isDarkMode ? "block text-sm font-medium text-emerald-300 mb-2" : "block text-sm font-medium text-emerald-900 mb-2"}>Pilih Kriteria Pengelompokan</label>
                  {criteriaList.length > 0 ? (
                    <select
                      value={selectedCriteria || ''}
                      onChange={(e) => handleChangeCriteria(e.target.value)}
                      className={isDarkMode ? "w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-800 text-white" : "w-full px-4 py-2 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"}
                    >
                      <option value="">-- Pilih Kriteria --</option>
                      {criteriaList.map((criteria) => (
                        <option key={criteria.id_criteria} value={criteria.id_criteria}>
                          {criteria.nama_kriteria} ({criteria.min_jumlah_mahasiswa}-{criteria.max_jumlah_mahasiswa} mahasiswa)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className={isDarkMode ? "text-sm text-emerald-300" : "text-sm text-emerald-700"}>Belum ada kriteria. Buat kriteria di menu Kelola Kriteria terlebih dahulu.</p>
                  )}
                  {selectedCriteria && criteriaList.find(c => c.id_criteria === parseInt(selectedCriteria)) && (
                    <div className={isDarkMode ? "mt-3 text-xs text-emerald-300 bg-gray-900/50 p-2 rounded" : "mt-3 text-xs text-emerald-700 bg-white/50 p-2 rounded"}>
                      <p>{criteriaList.find(c => c.id_criteria === parseInt(selectedCriteria)).deskripsi || 'Tidak ada deskripsi'}</p>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleGenerateAutogroup}
                  disabled={isLoading}
                  className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? (
                    <><LoaderIcon size={20} className="animate-spin" /> Memproses...</>
                  ) : (
                    <><UsersIcon size={20} /> Generate Kelompok</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Import Status */}
      <div className={isDarkMode ? "bg-gray-700/50 p-4 rounded-xl border border-gray-600" : "bg-white/70 p-4 rounded-xl border border-blue-100"}>
        {isLoading && mahasiswaData.length === 0 ? (
          <div className={isDarkMode ? "flex items-center gap-2 text-blue-400" : "flex items-center gap-2 text-blue-600"}>
            <LoaderIcon size={18} className="animate-spin" /> 
            <span>Mengimport data...</span>
          </div>
        ) : importStatus.type === 'success' && mahasiswaData.length > 0 ? (
          <div className="space-y-3">
            <div className={isDarkMode ? "flex items-center gap-2 text-emerald-400" : "flex items-center gap-2 text-emerald-600"}>
              <CheckCircleIcon size={18} /> 
              <span>{mahasiswaData.length} data mahasiswa siap diproses</span>
            </div>
            <div className={isDarkMode ? "text-sm text-gray-300 bg-gray-800/50 p-3 rounded-lg" : "text-sm text-gray-600 bg-gray-50 p-3 rounded-lg"}>
              Kolom yang terdeteksi: {Object.keys(mahasiswaData[0] || {}).join(', ')}
            </div>
          </div>
        ) : importStatus.type === 'error' ? (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircleIcon size={18} /> 
            <span>{importStatus.message}</span>
          </div>
        ) : (
          <div></div>
        )}
      </div>

      {/* Grouping Form & Criteria */}
      {mahasiswaData.length > 0 && (
        <div className={isDarkMode ? "bg-gray-700/50 p-6 rounded-xl space-y-4 border border-gray-600" : "bg-blue-50/50 p-6 rounded-xl space-y-4"}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={isDarkMode ? "block text-sm font-medium text-gray-300 mb-2" : "block text-sm font-medium text-gray-700 mb-2"}>Nama Angkatan</label>
              <input 
                type="text" 
                placeholder="Contoh: Angkatan 2024" 
                value={groupingForm.nama_angkatan}
                onChange={(e) => setGroupingForm({...groupingForm, nama_angkatan: e.target.value})}
                className={isDarkMode ? "w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white" : "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"}
              />
            </div>
            <div>
              <label className={isDarkMode ? "block text-sm font-medium text-gray-300 mb-2" : "block text-sm font-medium text-gray-700 mb-2"}>Angkatan Ke-</label>
              <input 
                type="number" 
                placeholder="Contoh: 1" 
                min="1"
                value={groupingForm.angkatan_ke}
                onChange={(e) => setGroupingForm({...groupingForm, angkatan_ke: e.target.value})}
                className={isDarkMode ? "w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white" : "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"}
              />
            </div>
            <div>
              <label className={isDarkMode ? "block text-sm font-medium text-gray-300 mb-2" : "block text-sm font-medium text-gray-700 mb-2"}>Lat Kampus</label>
              <input 
                type="number" 
                placeholder="-7.7979" 
                step="0.0001"
                value={groupingForm.kampus_lat}
                onChange={(e) => setGroupingForm({...groupingForm, kampus_lat: e.target.value})}
                className={isDarkMode ? "w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white" : "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"}
              />
            </div>
            <div>
              <label className={isDarkMode ? "block text-sm font-medium text-gray-300 mb-2" : "block text-sm font-medium text-gray-700 mb-2"}>Lng Kampus</label>
              <input 
                type="number" 
                placeholder="110.3701" 
                step="0.0001"
                value={groupingForm.kampus_lng}
                onChange={(e) => setGroupingForm({...groupingForm, kampus_lng: e.target.value})}
                className={isDarkMode ? "w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white" : "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"}
              />
            </div>
          </div>

          <div className={isDarkMode ? "bg-gray-800/50 p-3 rounded-lg text-sm text-blue-300 border border-gray-600" : "bg-blue-100/50 p-3 rounded-lg text-sm text-blue-800"}>
            <p className="font-semibold mb-1">📍 Penempatan Otomatis</p>
            <p>Sistem akan otomatis menempatkan kelompok ke lokasi terdekat dari kampus berdasarkan koordinat GPS.</p>
            {locations.length > 0 && (
              <p className="mt-2">Tersedia <strong>{locations.length}</strong> lokasi untuk penempatan.</p>
            )}
          </div>

          <div className={isDarkMode ? "bg-gray-800/50 border border-emerald-700 p-4 rounded-lg" : "bg-emerald-50 border border-emerald-200 p-4 rounded-lg"}>
            <label className={isDarkMode ? "block text-sm font-medium text-emerald-300 mb-2" : "block text-sm font-medium text-emerald-900 mb-2"}>Pilih Kriteria Pengelompokan</label>
            {criteriaList.length > 0 ? (
              <select
                value={selectedCriteria || ''}
                onChange={(e) => handleChangeCriteria(e.target.value)}
                className={isDarkMode ? "w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-800 text-white" : "w-full px-4 py-2 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"}
              >
                <option value="">-- Pilih Kriteria --</option>
                {criteriaList.map((criteria) => (
                  <option key={criteria.id_criteria} value={criteria.id_criteria}>
                    {criteria.nama_kriteria} ({criteria.min_jumlah_mahasiswa}-{criteria.max_jumlah_mahasiswa} mahasiswa)
                  </option>
                ))}
              </select>
            ) : (
              <p className={isDarkMode ? "text-sm text-emerald-300" : "text-sm text-emerald-700"}>Belum ada kriteria. Buat kriteria di menu Kelola Kriteria terlebih dahulu.</p>
            )}
            {selectedCriteria && criteriaList.find(c => c.id_criteria === parseInt(selectedCriteria)) && (
              <div className={isDarkMode ? "mt-3 text-xs text-emerald-300 bg-gray-900/50 p-2 rounded" : "mt-3 text-xs text-emerald-700 bg-white/50 p-2 rounded"}>
                <p>{criteriaList.find(c => c.id_criteria === parseInt(selectedCriteria)).deskripsi || 'Tidak ada deskripsi'}</p>
              </div>
            )}
          </div>

          <div>

            <h3 className={isDarkMode ? "text-md font-semibold text-gray-300 mb-3" : "text-md font-semibold text-gray-700 mb-3"}>Filter Kriteria Pengelompokan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={isDarkMode ? "p-4 bg-gray-700/50 rounded-lg border border-gray-600" : "p-4 bg-white/50 rounded-lg"}>
                <label className={isDarkMode ? "text-sm font-medium text-gray-300 flex items-center gap-2 mb-2" : "text-sm font-medium text-gray-700 flex items-center gap-2 mb-2"}>
                  <UsersIcon size={16} className={isDarkMode ? "text-blue-400" : "text-blue-600"} /> 
                  Jumlah Mahasiswa per Kelompok
                </label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    min="1" 
                    value={filterCriteria.minJumlahMahasiswa}
                    onChange={(e) => setFilterCriteria({...filterCriteria, minJumlahMahasiswa: parseInt(e.target.value)})}
                    className={isDarkMode ? "w-full px-3 py-2 border border-gray-600 rounded-lg text-sm bg-gray-800 text-white" : "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"}
                  />
                  <span className={isDarkMode ? "text-gray-400 text-sm flex items-center" : "text-gray-500 text-sm flex items-center"}>hingga</span>
                  <input 
                    type="number" 
                    min="1"
                    value={filterCriteria.maxJumlahMahasiswa}
                    onChange={(e) => setFilterCriteria({...filterCriteria, maxJumlahMahasiswa: parseInt(e.target.value)})}
                    className={isDarkMode ? "w-full px-3 py-2 border border-gray-600 rounded-lg text-sm bg-gray-800 text-white" : "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"}
                  />
                </div>
              </div>

              <div className={isDarkMode ? "p-4 bg-gray-700/50 rounded-lg border border-gray-600" : "p-4 bg-white/50 rounded-lg"}>
                <label className={isDarkMode ? "text-sm font-medium text-gray-300 flex items-center gap-2 mb-2" : "text-sm font-medium text-gray-700 flex items-center gap-2 mb-2"}>
                  <GraduationCapIcon size={16} className={isDarkMode ? "text-blue-400" : "text-blue-600"} /> 
                  Minimal Prodi
                </label>
                <input 
                  type="number" 
                  min="1"
                  value={filterCriteria.minProdi}
                  onChange={(e) => setFilterCriteria({...filterCriteria, minProdi: parseInt(e.target.value)})}
                  className={isDarkMode ? "w-full px-3 py-2 border border-gray-600 rounded-lg text-sm bg-gray-800 text-white" : "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"}
                />
              </div>

              <div className={isDarkMode ? "p-4 bg-gray-700/50 rounded-lg border border-gray-600" : "p-4 bg-white/50 rounded-lg"}>
                <label className={isDarkMode ? "text-sm font-medium text-gray-300 flex items-center gap-2 mb-2" : "text-sm font-medium text-gray-700 flex items-center gap-2 mb-2"}>
                  📚 Minimal Fakultas
                </label>
                <input 
                  type="number" 
                  min="1"
                  value={filterCriteria.minFakultas}
                  onChange={(e) => setFilterCriteria({...filterCriteria, minFakultas: parseInt(e.target.value)})}
                  className={isDarkMode ? "w-full px-3 py-2 border border-gray-600 rounded-lg text-sm bg-gray-800 text-white" : "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"}
                />
              </div>

              <div className={isDarkMode ? "p-4 bg-gray-700/50 rounded-lg border border-gray-600" : "p-4 bg-white/50 rounded-lg"}>
                <label className={isDarkMode ? "text-sm font-medium text-gray-300 flex items-center gap-2 mb-2" : "text-sm font-medium text-gray-700 flex items-center gap-2 mb-2"}>
                  👥 Jenis Kelamin
                </label>
                <select 
                  value={filterCriteria.jenisKelamin}
                  onChange={(e) => setFilterCriteria({...filterCriteria, jenisKelamin: e.target.value})}
                  className={isDarkMode ? "w-full px-3 py-2 border border-gray-600 rounded-lg text-sm bg-gray-800 text-white" : "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"}
                >
                  <option value="semua">Semua Jenis Kelamin</option>
                  <option value="laki-laki">Laki-laki</option>
                  <option value="perempuan">Perempuan</option>
                  <option value="seimbang">Seimbang (Mix)</option>
                </select>
              </div>
            </div>
          </div>

          <button 
            onClick={handleGenerateAutogroup}
            disabled={isLoading}
            className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <><LoaderIcon size={20} className="animate-spin" /> Memproses...</>
            ) : (
              <><UsersIcon size={20} /> Generate Kelompok</>
            )}
          </button>
        </div>
      )}

      {/* Hasil Grouping */}
      {groupingResult && (
        <div className={isDarkMode ? "bg-gray-800/80 rounded-xl p-6 border border-gray-700 space-y-4" : "bg-white/70 rounded-xl p-6 border border-blue-100 space-y-4"}>
          {/* Locations Info */}
          {groupingResult.lokasi_terpilih && groupingResult.lokasi_terpilih.length > 0 && (
            <div className={isDarkMode ? "bg-gradient-to-r from-gray-800 to-gray-700 p-4 rounded-lg border border-gray-600" : "bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200"}>
              <h4 className={isDarkMode ? "text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2" : "text-sm font-semibold text-amber-900 mb-3 flex items-center gap-2"}>
                <MapPinIcon size={18} className={isDarkMode ? "text-amber-400" : "text-amber-600"} />
                Lokasi KKN Terpilih ({groupingResult.lokasi_terpilih.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {groupingResult.lokasi_terpilih.map((loc, idx) => (
                  <div key={idx} className={isDarkMode ? "bg-gray-900/50 p-2 rounded border border-gray-600 text-xs" : "bg-white/50 p-2 rounded border border-amber-100 text-xs"}>
                    <p className={isDarkMode ? "font-semibold text-amber-300" : "font-semibold text-amber-900"}>{loc.lokasi}</p>
                    <p className={isDarkMode ? "text-amber-400" : "text-amber-700"}>{loc.desa_kecamatan || loc.dusun_kecamatan || '-'} / {loc.kabupaten}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results Header */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className={isDarkMode ? "text-md font-semibold text-gray-300" : "text-md font-semibold text-gray-700"}>Hasil Pengelompokan</h3>
              <p className={isDarkMode ? "text-sm text-gray-400" : "text-sm text-gray-600"}>{groupingResult.jumlah_kelompok} Kelompok • {groupingResult.jumlah_mahasiswa} Mahasiswa</p>
            </div>
            <button 
              onClick={handleExportResult}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
            >
              <UploadIcon size={18} className="rotate-180" /> 
              Export Excel
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {/* Single Table View */}
            <div className={isDarkMode ? "bg-gray-800/60 rounded-2xl border border-gray-700/50 shadow-xl overflow-hidden" : "bg-white/70 rounded-2xl border border-blue-100/50 shadow-lg overflow-hidden"}>
              {/* Table Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white grid grid-cols-10 gap-2 p-4 text-xs font-semibold sticky top-0">
                <div className="text-center">NO</div>
                <div>NIM</div>
                <div>NAMA</div>
                <div>PRODI</div>
                <div>FAKULTAS</div>
                <div>KELOMPOK</div>
                <div>Lokasi</div>
                <div>Desa</div>
                <div>Kecamatan</div>
                <div>Kabupaten</div>
              </div>

              {/* Table Body */}
              <div className={isDarkMode ? "divide-y divide-gray-700/50" : "divide-y divide-blue-100/30"}>
                {groupingResult.groups.flatMap((group, groupIdx) =>
                  group.anggota.map((member, memberIdx) => {
                    const rowIndex = groupingResult.groups.slice(0, groupIdx).reduce((acc, g) => acc + g.anggota.length, 0) + memberIdx + 1;
                    return (
                      <div key={`${groupIdx}-${memberIdx}`} className={isDarkMode ? "grid grid-cols-10 gap-2 p-4 text-xs hover:bg-gray-700/30 transition-colors border-gray-700/30" : "grid grid-cols-10 gap-2 p-4 text-xs hover:bg-blue-50/70 transition-colors border-blue-100/20"}>
                        <div className={isDarkMode ? "text-center font-medium text-gray-300" : "text-center font-medium text-gray-800"}>{rowIndex}</div>
                        <div className={isDarkMode ? "font-medium text-gray-200" : "font-medium text-gray-900"}>{member.nim || member.NIM || '-'}</div>
                        <div className={isDarkMode ? "font-medium text-gray-200" : "font-medium text-gray-900"}>{member.nama || member.Nama || '-'}</div>
                        <div className={isDarkMode ? "text-gray-300" : "text-gray-700"}>{member.prodi || member.Prodi || '-'}</div>
                        <div className={isDarkMode ? "text-gray-300" : "text-gray-700"}>{member.fakultas || member.Fakultas || '-'}</div>
                        <div className={isDarkMode ? "text-center font-semibold bg-blue-600/40 text-blue-200 rounded-lg px-2 py-1" : "text-center font-semibold bg-blue-100 text-blue-800 rounded-lg px-2 py-1"}>{group.nomor_kelompok}</div>
                        <div className={isDarkMode ? "text-gray-300" : "text-gray-700"}>{group.lokasi || '-'}</div>
                        <div className={isDarkMode ? "text-gray-300" : "text-gray-700"}>-</div>
                        <div className={isDarkMode ? "text-gray-300" : "text-gray-700"}>{group.desa_kecamatan || '-'}</div>
                        <div className={isDarkMode ? "text-gray-300" : "text-gray-700"}>{group.kabupaten || '-'}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </section>
  );
}
