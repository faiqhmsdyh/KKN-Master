import React, { useState, useContext } from 'react';
import { ThemeContext } from '../App';
import { 
  User, 
  Mail, 
  Building2, 
  AlertCircle, 
  Camera, 
  Lock, 
  Eye, 
  EyeOff, 
  X,
  Check,
  IdCard
} from 'lucide-react';

export default function Profil({ user, onUpdateUser }) {
  const { isDarkMode } = useContext(ThemeContext);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
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

        // Update user data in parent
        if (onUpdateUser) {
          onUpdateUser({ ...user, foto: reader.result });
        }
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

  return (
    <div className="space-y-4 md:space-y-6 animate-fadeIn px-2 md:px-0">
      {/* Header */}
      <div className="text-center space-y-1 md:space-y-2">
        <h1 className={`text-xl md:text-2xl lg:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Profil Pengguna
        </h1>
        <p className={`text-sm md:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Kelola informasi akun Anda
        </p>
      </div>

      {/* Main Card */}
      <div className={isDarkMode 
        ? "glass-card bg-gray-800/80 border-gray-700 p-4 md:p-6 lg:p-8" 
        : "glass-card bg-white/90 border-blue-100/80 p-4 md:p-6 lg:p-8"}>
        
        <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6 lg:gap-8">
          {/* Profile Photo Section */}
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <div className="relative group">
              {user?.foto ? (
                <img 
                  src={user.foto} 
                  alt={user.nama}
                  className="w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-2xl object-cover shadow-xl"
                />
              ) : (
                <div className="w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
                  <User size={48} className="text-white md:w-14 md:h-14 lg:w-16 lg:h-16" />
                </div>
              )}
              
              {/* Hover Overlay for Upload */}
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

          {/* User Info Section */}
          <div className="flex-1 space-y-4 md:space-y-5 lg:space-y-6 w-full">
            <div className="text-center md:text-left">
              <h2 className={`text-xl md:text-2xl font-bold break-words ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {user?.nama || 'Pengguna'}
              </h2>
              <p className="text-blue-500 font-semibold mt-1 text-sm md:text-base">
                {user?.role === 'Admin' ? 'Staff Pusat Pengabdian Masyarakat (LPPM)' : user?.role === 'Koordinator' ? 'Koordinator PPM' : user?.role}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 lg:gap-6">
              {/* NIP */}
              <div className="flex items-center gap-2 md:gap-3">
                <div className={`p-2 rounded-lg flex-shrink-0 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <IdCard size={18} className="text-blue-500 md:w-5 md:h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>NIP</p>
                  <p className={`font-medium text-sm md:text-base break-all ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {user?.nip || '-'}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-2 md:gap-3">
                <div className={`p-2 rounded-lg flex-shrink-0 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <Mail size={18} className="text-blue-500 md:w-5 md:h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Email</p>
                  <p className={`font-medium text-sm md:text-base break-all ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {user?.email || user?.username || '-'}
                  </p>
                </div>
              </div>

              {/* Username */}
              <div className="flex items-center gap-2 md:gap-3">
                <div className={`p-2 rounded-lg flex-shrink-0 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <User size={18} className="text-blue-500 md:w-5 md:h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Username</p>
                  <p className={`font-medium text-sm md:text-base break-all ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {user?.username || '-'}
                  </p>
                </div>
              </div>

              {/* Role */}
              <div className="flex items-center gap-2 md:gap-3">
                <div className={`p-2 rounded-lg flex-shrink-0 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <Building2 size={18} className="text-blue-500 md:w-5 md:h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Role</p>
                  <p className={`font-medium text-sm md:text-base break-words ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {user?.role || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 md:pt-5 lg:pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm md:text-base font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                <Lock size={18} className="md:w-5 md:h-5" />
                Ubah Password
              </button>
              
              {user?.role !== 'Admin' && (
                <p className={`text-xs md:text-sm mt-2 md:mt-3 flex items-start md:items-center gap-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5 md:mt-0" />
                  <span>Data lain (Nama, NIP, Email, dll) hanya dapat diubah oleh Admin</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50 p-3 md:p-4">
          <div className={`w-full max-w-md rounded-xl md:rounded-2xl shadow-2xl max-h-[95vh] overflow-y-auto ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          }`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Lock size={20} className="text-blue-600 dark:text-blue-400 md:w-6 md:h-6" />
                </div>
                <h3 className={`text-lg md:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Ubah Password
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <X size={24} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handlePasswordChange} className="p-4 md:p-6 space-y-3 md:space-y-4">
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
                    {showPasswords.old ? <EyeOff size={20} /> : <Eye size={20} />}
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
                    {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
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
                    {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {passwordForm.confirmPassword && (
                  <div className="mt-2 flex items-center gap-2">
                    {passwordForm.newPassword === passwordForm.confirmPassword ? (
                      <>
                        <Check size={16} className="text-green-500" />
                        <span className="text-sm text-green-500">Password cocok</span>
                      </>
                    ) : (
                      <>
                        <X size={16} className="text-red-500" />
                        <span className="text-sm text-red-500">Password tidak cocok</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 md:pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  className={`flex-1 px-4 py-2.5 md:py-3 rounded-lg text-sm md:text-base font-semibold transition-all ${
                    isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 md:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm md:text-base font-semibold transition-all shadow-lg"
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
