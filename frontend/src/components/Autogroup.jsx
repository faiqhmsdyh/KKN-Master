import React, { useState, useContext } from 'react';
import * as XLSX from 'xlsx';
import { ThemeContext } from '../App';
import '../styles/Autogroup.css';
import { AlertCircle } from 'lucide-react';

import Step1_Upload from './Step1_Upload';
import Step2_Parameters from './Step2_Parameters';
import Step3_Results from './Step3_Results';
import Stepper from './Stepper';

export default function Autogroup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [mahasiswaData, setMahasiswaData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [groupingResult, setGroupingResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { isDarkMode } = useContext(ThemeContext);

  const handleFileSelect = async (file) => {
    setIsLoading(true);
    setError(null);
    setFileName(file.name);

    // Validasi ekstensi file
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = ['xlsx', 'xls'];
    
    if (!allowedExtensions.includes(fileExtension)) {
      setError(`Format file tidak didukung! Harap upload file Excel (.xlsx atau .xls). File yang Anda pilih: .${fileExtension}`);
      setIsLoading(false);
      setCurrentStep(1);
      return;
    }

    // Validasi MIME type
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];
    
    if (!allowedMimeTypes.includes(file.type) && file.type !== '') {
      setError(`Tipe file tidak valid! Harap upload file Excel yang valid. Tipe file: ${file.type || 'tidak dikenali'}`);
      setIsLoading(false);
      setCurrentStep(1);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        // Clear previous data and upload new
        await fetch('http://localhost:4000/mahasiswa', { method: 'DELETE' });
        
        const response = await fetch('http://localhost:4000/mahasiswa/import-json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: json }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Gagal mengunggah data mahasiswa.');
        }

        const result = await response.json();
        setMahasiswaData(result.data || json);
        setCurrentStep(2);
      } catch (err) {
        setError(err.message);
        setCurrentStep(1);
      } finally {
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Gagal membaca file. Pastikan file Excel tidak rusak atau terproteksi.');
      setIsLoading(false);
      setCurrentStep(1);
    };
    
    reader.readAsArrayBuffer(file);
  };

  // New handler for two-file upload with tematik matching
  const handleFilesSelect = async (masterFile, tematikFile) => {
    setIsLoading(true);
    setError(null);
    setFileName(masterFile.name);

    // Helper function to parse Excel/CSV file
    const parseFile = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);
            resolve(json);
          } catch (err) {
            reject(new Error(`Gagal membaca file ${file.name}: ${err.message}`));
          }
        };
        reader.onerror = () => reject(new Error(`Gagal membaca file ${file.name}`));
        reader.readAsArrayBuffer(file);
      });
    };

    try {
      // Parse master file (required)
      const masterData = await parseFile(masterFile);
      
      if (!masterData || masterData.length === 0) {
        throw new Error('File master kosong atau tidak valid.');
      }
      
      // Parse tematik file (optional)
      let tematikData = [];
      if (tematikFile) {
        tematikData = await parseFile(tematikFile);
        console.log(`📋 Tematik data parsed: ${tematikData.length} records`);
      }
      
      // Send to new endpoint with tematik matching
      const response = await fetch('http://localhost:4000/mahasiswa/import-with-tematik', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data_master: masterData,
          data_tematik: tematikData
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Gagal mengunggah data mahasiswa.');
      }

      const result = await response.json();
      
      // Log matching results
      console.log(`✅ Import selesai:`);
      console.log(`   - Total: ${result.inserted}`);
      console.log(`   - Reguler: ${result.reguler_count}`);
      console.log(`   - Tematik: ${result.tematik_count}`);
      
      // Tampilkan info matching ke user
      if (tematikFile && result.tematik_count > 0) {
        alert(`✅ Import berhasil!\n\n📊 Total: ${result.inserted} mahasiswa\n👥 Reguler: ${result.reguler_count} mahasiswa\n📋 Tematik: ${result.tematik_count} mahasiswa\n\n⚠️ ${result.tematik_count} mahasiswa tematik TIDAK akan diikutkan dalam autogroup.`);
      } else if (tematikFile && result.tematik_count === 0) {
        alert(`⚠️ Import berhasil, tapi tidak ada NIM yang cocok antara file master dan file tematik.\n\nPastikan kolom NIM di kedua file memiliki nama yang sama (NIM, nim, No Induk, dll).`);
      }
      
      setMahasiswaData(result.data || masterData);
      setCurrentStep(2);
    } catch (err) {
      setError(err.message);
      setCurrentStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfiguration = async (payload) => {
    try {
      // Save general configuration (tahun ajaran & angkatan will be saved in konfigurasi_kriteria)
      const response = await fetch('http://localhost:4000/konfigurasi-autogrup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_aturan: `Aturan KKN ${payload.config?.angkatan_kkn || new Date().getFullYear()}`,
          tahun_ajaran: payload.config?.tahun_ajaran || `${new Date().getFullYear()}`,
          angkatan_kkn: payload.config?.angkatan_kkn || '',
          kriteria_config: payload.kriteria ? JSON.stringify(payload.kriteria) : null,
        }),
      });
      if (!response.ok) throw new Error('Gagal menyimpan konfigurasi umum.');
      
      // Save kriteria configurations using batch endpoint
      if (payload.kriteria && Array.isArray(payload.kriteria)) {
        // Filter only kriteria that are actually filled by user
        const filledKriteria = payload.kriteria.filter(k => {
          if (k.tipe_data === 'boolean') {
            // Only save if checked (true)
            return k.value === true;
          } else if (k.tipe_data === 'gender') {
            // Only save if a value is selected (not empty)
            return k.value && k.value !== '';
          } else if (k.tipe_data === 'range') {
            // Only save if at least one field is filled with valid number
            const hasMin = k.value?.min !== undefined && k.value?.min !== null && k.value?.min !== '' && !isNaN(Number(k.value.min));
            const hasMax = k.value?.max !== undefined && k.value?.max !== null && k.value?.max !== '' && !isNaN(Number(k.value.max));
            return hasMin || hasMax;
          } else {
            // For 'minimal' type - only save if value is filled with valid number (can be 0 or positive)
            return k.value !== undefined && k.value !== null && k.value !== '' && !isNaN(Number(k.value));
          }
        });
        
        console.log('Filtered kriteria to save:', filledKriteria.length, 'out of', payload.kriteria.length);
        
        // Only send to backend if there are filled kriteria
        if (filledKriteria.length > 0) {
          const kriteriaPayload = filledKriteria.map(k => {
            const konfig = {
              id_kriteria: k.id_kriteria,
              nilai_min: 0,
              nilai_max: 0,
              nilai_boolean: 0,
              nilai_gender: '',
            };
            
            if (k.tipe_data === 'boolean') {
              konfig.nilai_boolean = 1; // Always 1 because we filtered for true
            } else if (k.tipe_data === 'gender') {
              konfig.nilai_gender = k.value;
            } else if (k.tipe_data === 'range') {
              // Only set if the value is valid
              if (k.value?.min !== undefined && k.value?.min !== null && k.value?.min !== '') {
                const minVal = parseInt(k.value.min, 10);
                if (!isNaN(minVal)) konfig.nilai_min = minVal;
              }
              if (k.value?.max !== undefined && k.value?.max !== null && k.value?.max !== '') {
                const maxVal = parseInt(k.value.max, 10);
                if (!isNaN(maxVal)) konfig.nilai_max = maxVal;
              }
            } else {
              // For 'minimal' type
              const minVal = parseInt(k.value, 10);
              if (!isNaN(minVal)) konfig.nilai_min = minVal;
            }
            
            return konfig;
          });
          
          const konfRes = await fetch('http://localhost:4000/konfigurasi-kriteria/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              konfigurasi: kriteriaPayload,
              tahun_ajaran: payload.config?.tahun_ajaran || `${new Date().getFullYear()}`,
              angkatan_kkn: payload.config?.angkatan_kkn || ''
            }),
          });
          if (!konfRes.ok) {
            console.warn('Gagal menyimpan konfigurasi kriteria');
          }
        } else {
          console.log('No kriteria to save (all empty)');
          // Deactivate all existing kriteria if nothing is filled
          await fetch('http://localhost:4000/konfigurasi-kriteria/deactivate-all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
      
      console.log("Konfigurasi berhasil disimpan!");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExecuteGrouping = async (payload) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:4000/autogroup/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Gagal menjalankan proses pengelompokan.');
      }
      const result = await response.json();
      setGroupingResult(result);
      setCurrentStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = () => {
    // Reset semua state dan kembali ke step 1
    setCurrentStep(1);
    setMahasiswaData([]);
    setFileName('');
    setGroupingResult(null);
    setError(null);
    setIsLoading(false);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1_Upload onFileSelect={handleFileSelect} onFilesSelect={handleFilesSelect} isDarkMode={isDarkMode} error={error} />;
      case 2:
        return (
          <Step2_Parameters
            mahasiswaData={mahasiswaData}
            fileName={fileName}
            onExecuteGrouping={handleExecuteGrouping}
            onSaveConfiguration={handleSaveConfiguration}
            isDarkMode={isDarkMode}
          />
        );
      case 3:
        return (
          <Step3_Results
            groupingResult={groupingResult}
            onBack={() => setCurrentStep(2)}
            onRestart={handleRestart}
            isDarkMode={isDarkMode}
          />
        );
      default:
        return <Step1_Upload onFileSelect={handleFileSelect} onFilesSelect={handleFilesSelect} isDarkMode={isDarkMode} error={error} />;
    }
  };

  return (
    <section className="animate-fadeIn space-y-6">
      <Stepper currentStep={currentStep} isDarkMode={isDarkMode} />
      
      <div className="text-center space-y-1">
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
          Ikuti langkah-langkah ini <br/> untuk melakukan pengelompokan & penempatan peserta KKN 
        </p>
      </div>
      
      {error && (
        <div className="max-w-2xl mx-auto animate-fadeIn">
          <div className={`p-5 rounded-xl border-2 ${isDarkMode ? 'bg-red-900/30 border-red-700/60' : 'bg-red-50 border-red-300'}`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-red-800/50' : 'bg-red-100'}`}>
                <AlertCircle size={24} className={isDarkMode ? 'text-red-400' : 'text-red-600'} />
              </div>
              <div className="flex-1">
                <h4 className={`font-bold text-lg mb-1 ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                  Gagal Memproses File
                </h4>
                <p className={`text-sm ${isDarkMode ? 'text-red-200' : 'text-red-600'}`}>
                  {error}
                </p>
                <p className={`text-xs mt-2 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`}>
                  💡 Pastikan file yang diupload adalah file Excel (.xlsx atau .xls) dan tidak rusak atau terproteksi.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-8">
        {isLoading && currentStep !== 2 ? (
          <div className="flex flex-col justify-center items-center min-h-[400px] gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Memproses file...</p>
          </div>
        ) : (
          renderStep()
        )}
      </div>
    </section>
  );
}
