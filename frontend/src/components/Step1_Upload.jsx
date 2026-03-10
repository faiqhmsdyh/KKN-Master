import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, AlertTriangle, CheckCircle, Users, BookOpen, X } from 'lucide-react';

export default function Step1_Upload({ onFileSelect, onFilesSelect, isDarkMode, error }) {
  const [masterFile, setMasterFile] = useState(null);
  const [tematikFile, setTematikFile] = useState(null);
  const [masterFileName, setMasterFileName] = useState('');
  const [tematikFileName, setTematikFileName] = useState('');

  const handleMasterFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMasterFile(file);
      setMasterFileName(file.name);
      e.target.value = '';
    }
  };

  const handleTematikFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setTematikFile(file);
      setTematikFileName(file.name);
      e.target.value = '';
    }
  };

  const removeMasterFile = () => {
    setMasterFile(null);
    setMasterFileName('');
  };

  const removeTematikFile = () => {
    setTematikFile(null);
    setTematikFileName('');
  };

  const handleSubmit = () => {
    if (masterFile) {
      // Call the new handler with both files
      if (onFilesSelect) {
        onFilesSelect(masterFile, tematikFile);
      } else if (onFileSelect) {
        // Fallback to old behavior
        onFileSelect(masterFile);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-4 md:px-6 lg:px-8">
      {/* Error display */}
      {error && (
        <div className="w-full max-w-3xl mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">Error:</p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
          </div>
        </div>
      )}
      
      <div className="w-full max-w-5xl space-y-6">
        {/* Header */}
       

        {/* Two Column Upload Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: File Master (Required) */}
          <div className={`relative rounded-xl border-2 border-dashed p-6 transition-all ${
            masterFile 
              ? (isDarkMode ? 'border-blue-500 bg-gray-800/30' : 'border-blue-500 bg-white')
              : (isDarkMode ? 'border-gray-600 bg-gray-800/30 hover:border-gray-500' : 'border-gray-300 bg-white hover:border-gray-400')
          }`}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`p-3 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <Users size={24} className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
              </div>
              
              <div>
                <h5 className={isDarkMode ? "font-bold text-white" : "font-bold text-gray-800"}>
                  File Master Pendaftar
                  <span className="text-red-500 ml-1">*</span>
                </h5>
                <p className={isDarkMode ? "text-xs text-gray-400 mt-1" : "text-xs text-gray-500 mt-1"}>
                  Berisi seluruh data pendaftar KKN
                </p>
              </div>
              
              {/* Required columns info */}
              <div className={isDarkMode ? "w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-xs" : "w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs"}>
                <p className={isDarkMode ? "text-gray-300 font-semibold mb-1" : "text-gray-700 font-semibold mb-1"}>
                  Kolom Wajib:
                </p>
                <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                  NIM, Nama, Prodi, Fakultas, JK, Kesehatan, No.Telepon 
                </p>
              </div>
              
              {masterFile ? (
                <div className={isDarkMode ? "w-full flex items-center justify-between p-3 bg-gray-700 rounded-lg" : "w-full flex items-center justify-between p-3 bg-gray-100 rounded-lg"}>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className={isDarkMode ? "text-gray-300" : "text-gray-600"}  />
                    <span className={isDarkMode ? "text-sm text-gray-300 truncate max-w-[150px]" : "text-sm text-gray-700 truncate max-w-[150px]"}>
                      {masterFileName}
                    </span>
                  </div>
                  <button 
                    onClick={removeMasterFile}
                    className="p-1 hover:bg-red-500/20 rounded-full transition-colors"
                  >
                    <X size={14} className="text-red-500" />
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    id="master-file-input"
                    className="hidden"
                    onChange={handleMasterFileChange}
                    accept=".xlsx, .xls, .csv"
                  />
                  <button 
                    onClick={() => document.getElementById('master-file-input').click()} 
                    className="btn-primary text-xs px-4 py-2 rounded-full"
                  >
                    Pilih File Peserta
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Card 2: File Tematik (Optional) */}
          <div className={`relative rounded-xl border-2 border-dashed p-6 transition-all ${
            tematikFile 
              ? (isDarkMode ? 'border-blue-500 bg-gray-800/30' : 'border-blue-500 bg-white')
              : (isDarkMode ? 'border-gray-600 bg-gray-800/30 hover:border-gray-500' : 'border-gray-300 bg-white hover:border-gray-400')
          }`}>
            {/* Optional badge */}
            <div className="absolute -top-2 right-3">
              <span className={isDarkMode 
                ? "text-[10px] px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full"
                : "text-[10px] px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full"
              }>
                Opsional
              </span>
            </div>
            
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`p-3 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <BookOpen size={24} className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
              </div>
              
              <div>
                <h5 className={isDarkMode ? "font-bold text-white" : "font-bold text-gray-800"}>
                  File Tematik
                </h5>
                <p className={isDarkMode ? "text-xs text-gray-400 mt-1" : "text-xs text-gray-500 mt-1"}>
                  Daftar mahasiswa KKN Tematik
                </p>
              </div>
              
              {/* Info */}
              <div className={isDarkMode ? "w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-xs" : "w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs"}>
                <p className={isDarkMode ? "text-gray-300 font-semibold mb-1" : "text-gray-700 font-semibold mb-1"}>
                  <strong>Kolom Wajib:</strong>
                </p>
                <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                  NIM{" "}
                  <span className="italic text-[12px]">
                  (NIM tematik akan ditandai & tidak diikutkan autogroup)
                  </span>
                </p>
              </div>
              
              {tematikFile ? (
                <div className={isDarkMode ? "w-full flex items-center justify-between p-3 bg-gray-700 rounded-lg" : "w-full flex items-center justify-between p-3 bg-gray-100 rounded-lg"}>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className={isDarkMode ? "text-gray-300" : "text-gray-600"} />
                    <span className={isDarkMode ? "text-sm text-gray-300 truncate max-w-[150px]" : "text-sm text-gray-700 truncate max-w-[150px]"}>
                      {tematikFileName}
                    </span>
                  </div>
                  <button 
                    onClick={removeTematikFile}
                    className="p-1 hover:bg-red-500/20 rounded-full transition-colors"
                  >
                    <X size={14} className="text-red-500" />
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    id="tematik-file-input"
                    className="hidden"
                    onChange={handleTematikFileChange}
                    accept=".xlsx, .xls, .csv"
                  />
                  <button 
                    onClick={() => document.getElementById('tematik-file-input').click()} 
                    className={isDarkMode 
                      ? "text-xs px-4 py-2 rounded-full border border-amber-600 text-amber-400 hover:bg-amber-900/30 transition-colors"
                      : "text-xs px-4 py-2 rounded-full border border-amber-500 text-amber-600 hover:bg-amber-50 transition-colors"
                    }
                  >
                    Pilih File Tematik
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-4">
          <button 
            onClick={handleSubmit}
            disabled={!masterFile}
            className={`px-8 py-3 rounded-full font-bold text-sm transition-all ${
              masterFile
                ? 'btn-primary shadow-lg hover:shadow-blue-500/30'
                : (isDarkMode 
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed')
            }`}
          >
            {masterFile 
              ? (tematikFile ? 'Proses Data dengan Matching Tematik' : 'Proses Data')
              : 'Pilih File Peserta Terlebih Dahulu'
            }
          </button>
        </div>
      </div>
    </div>
  );
}