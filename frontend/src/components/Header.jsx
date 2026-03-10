import React, { useContext, useState, useRef, useEffect } from 'react';
import { Moon, Sun, User, Mail, Building2, MapPin, Lock, Camera, Eye, EyeOff, ChevronDown, IdCard, ChevronRight, Menu, X } from 'lucide-react';
import { ThemeContext } from '../App';

export default function Header({ user, onLogout, breadcrumb = [], isSidebarCollapsed = false, setIsSidebarCollapsed }) {
  const { isDarkMode, setIsDarkMode } = useContext(ThemeContext);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const dropdownRef = useRef(null);
  const adminDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target)) {
        setShowAdminDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar!');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2MB!');
      return;
    }

    setUploadingPhoto(true);

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

        alert('Foto profil berhasil diperbarui!');
        window.location.reload(); // Reload untuk update foto
      } catch (error) {
        console.error('Error uploading photo:', error);
        alert(error.message);
      } finally {
        setUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
    <header className={`fixed top-0 ${isSidebarCollapsed ? 'md:left-20' : 'md:left-60'} left-0 right-0 z-40 transition-all duration-300 ${isDarkMode ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-xl border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
      <div className="max-w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Left: Hamburger Menu (Mobile) + Breadcrumb */}
          <div className="flex items-center gap-2 md:gap-4 flex-1">
            {/* Hamburger Menu - Mobile Only */}
            <button
              onClick={() => setIsSidebarCollapsed && setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`md:hidden p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'text-gray-300 hover:bg-gray-800 active:bg-gray-700' 
                  : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
              }`}
              aria-label="Toggle Menu"
            >
              {isSidebarCollapsed ? <Menu size={22} /> : <X size={22} />}
            </button>
            
            <div className="flex flex-col gap-0.5 md:gap-1">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 md:gap-3">
                <span className={`font-bold text-sm md:text-lg lg:text-xl ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>KKN Master</span>
                {breadcrumb.map((item, index) => (
                  <React.Fragment key={index}>
                    <ChevronRight size={14} className={`hidden sm:block ${isDarkMode ? 'text-gray-600' : 'text-gray-400'} md:w-4 md:h-4`} />
                    <span className={`text-xs sm:text-sm md:text-base lg:text-lg truncate max-w-[120px] sm:max-w-none ${index === breadcrumb.length - 1 
                      ? (isDarkMode ? 'text-white font-bold' : 'text-gray-900 font-bold')
                      : (isDarkMode ? 'text-gray-400 font-semibold' : 'text-gray-600 font-semibold')
                    }`}>
                      {item}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Right Controls: Theme Toggle & Profile */}
          <div className="flex justify-end items-center gap-1.5 md:gap-3">{/* Theme toggle & profile dropdown */}
            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 md:p-2.5 rounded-lg md:rounded-xl transition-all hover:scale-105 ${
                isDarkMode
                  ? 'text-yellow-400 hover:text-yellow-300'
                  : 'text-amber-600 hover:text-amber-700'
              }`}
              title={isDarkMode ? 'Tampilan Terang' : 'Tampilan Gelap'}
            >
              {isDarkMode ? <Sun size={18} strokeWidth={2.5} className="md:w-5 md:h-5" /> : <Moon size={18} strokeWidth={2.5} className="md:w-5 md:h-5" />}
            </button>
            {/* Profile Dropdown - Only for Koordinator */}
            {user && user.role === 'Koordinator' && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className={`flex items-center gap-2 px-3 py-2 font-medium transition-colors ${
                    isDarkMode 
                      ? "text-gray-300 hover:text-white" 
                      : "text-gray-700 hover:text-gray-900"
                  }`}
                  title="Profil Saya"
                >
                  {user.foto ? (
                    <img src={user.foto} alt={user.nama} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <User size={18} strokeWidth={2.5} />
                  )}
                  <span className="text-sm font-bold hidden sm:inline">{user.nama}</span>
                  <ChevronDown size={16} className={`transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showProfileDropdown && (
                  <div className={`absolute right-0 top-full mt-2 w-96 rounded-2xl shadow-2xl border overflow-hidden z-50 ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    {/* Profile Header */}
                    <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
                      <div className="flex items-start gap-4">
                        {/* Profile Photo */}
                        <div className="flex-shrink-0">
                          <div className="relative group">
                            {user.foto ? (
                              <img 
                                src={user.foto} 
                                alt={user.nama}
                                className="w-20 h-20 rounded-xl object-cover shadow-lg"
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                                <User size={40} className="text-white" />
                              </div>
                            )}
                            
                            {/* Upload Photo Button */}
                            <label className={`absolute inset-0 flex items-center justify-center rounded-xl cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity ${
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
                                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Camera size={24} className="text-white" />
                              )}
                            </label>
                          </div>
                        </div>

                        {/* Profile Name & Role */}
                        <div className="flex-1">
                          <h3 className={`text-lg font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            {user.nama}
                          </h3>
                          <p className="text-blue-500 text-sm font-semibold mb-3">
                            Koordinator Pusat Pengabdian Masyarakat
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Profile Details */}
                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <IdCard size={18} className="text-blue-500" />
                        </div>
                        <div>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>NIP</p>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            {user.nip || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <Mail size={18} className="text-blue-500" />
                        </div>
                        <div>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Email</p>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            {user.email || user.username || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <Building2 size={18} className="text-blue-500" />
                        </div>
                        <div>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Unit Kerja</p>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            Lembaga Penelitian dan Pengabdian Masyarakat (LPPM)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <MapPin size={18} className="text-blue-500" />
                        </div>
                        <div>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Alamat Kantor</p>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            Gedung Pusat Studi (Rektorat Lama) Lt.2, UIN Sunan Kalijaga
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className={`p-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <button
                        onClick={() => {
                          setShowPasswordModal(true);
                          setShowProfileDropdown(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                      >
                        <Lock size={18} />
                        Ubah Password
                      </button>
                      <p className={`text-xs mt-2 text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        💡 Data lain hanya dapat diubah oleh Admin
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Info - For non-Koordinator (Admin/Staff) */}
            {user && user.role !== 'Koordinator' && (
              <div className="relative" ref={adminDropdownRef}>
                <button
                  onClick={() => setShowAdminDropdown(!showAdminDropdown)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all hover:scale-105 ${
                    isDarkMode 
                      ? "bg-blue-900/40 hover:bg-blue-800/60 text-blue-300 border border-blue-700/50" 
                      : "bg-blue-100/60 hover:bg-blue-200/80 text-blue-700 border border-blue-300/50"
                  }`}
                  title="Profil Saya"
                >
                  {user.foto ? (
                    <img src={user.foto} alt={user.nama} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <User size={18} strokeWidth={2.5} />
                  )}
                  <span className={`text-sm font-bold hidden sm:inline ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}>
                    {user.nama}
                  </span>
                  <ChevronDown size={16} className={`transition-transform hidden sm:block ${
                    showAdminDropdown ? 'rotate-180' : ''
                  }`} />
                </button>

                {/* Dropdown Menu for Admin/Staff */}
                {showAdminDropdown && (
                  <div className={`absolute right-0 top-full mt-2 w-96 rounded-2xl shadow-2xl border overflow-hidden z-50 ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    {/* Profile Header */}
                    <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
                      <div className="flex items-start gap-4">
                        {/* Profile Photo */}
                        <div className="flex-shrink-0">
                          <div className="relative group">
                            {user.foto ? (
                              <img 
                                src={user.foto} 
                                alt={user.nama}
                                className="w-20 h-20 rounded-xl object-cover shadow-lg"
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                                <User size={40} className="text-white" />
                              </div>
                            )}
                            
                            {/* Upload Photo Button */}
                            <label className={`absolute inset-0 flex items-center justify-center rounded-xl cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity ${
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
                                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Camera size={24} className="text-white" />
                              )}
                            </label>
                          </div>
                        </div>

                        {/* Profile Name & Role */}
                        <div className="flex-1">
                          <h3 className={`text-lg font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            {user.nama}
                          </h3>
                          <p className="text-blue-500 text-sm font-semibold mb-3">
                            {user.role === 'Admin' ? 'Staff Pusat Pengabdian Masyarakat' : user.role}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Profile Details */}
                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <IdCard size={18} className="text-blue-500" />
                        </div>
                        <div>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>NIP</p>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            {user.nip || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <Mail size={18} className="text-blue-500" />
                        </div>
                        <div>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Email</p>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            {user.email || user.username || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <Building2 size={18} className="text-blue-500" />
                        </div>
                        <div>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Unit Kerja</p>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            Lembaga Penelitian dan Pengabdian Masyarakat (LPPM)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <MapPin size={18} className="text-blue-500" />
                        </div>
                        <div>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Alamat Kantor</p>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            Gedung Pusat Studi (Rektorat Lama) Lt.2, UIN Sunan Kalijaga
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Logout button moved to Sidebar */}
          </div>
        </div>
      </div>
    </header>

    {/* Password Change Modal */}
    {showPasswordModal && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
        <div className={`w-full max-w-md rounded-2xl shadow-2xl ${
          isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          {/* Modal Header */}
          <div className={`flex items-center justify-between p-6 border-b ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Ubah Password
            </h3>
            <button
              onClick={() => {
                setShowPasswordModal(false);
                setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
                setShowPasswords({ old: false, new: false, confirm: false });
              }}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-2xl">&times;</span>
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
                  placeholder="Masukkan password lama"
                  required
                  className={`w-full px-4 py-3 pr-12 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, old: !showPasswords.old })}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                    isDarkMode 
                      ? 'text-gray-500 hover:text-gray-300' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
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
                  placeholder="Minimal 6 karakter"
                  required
                  className={`w-full px-4 py-3 pr-12 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                    isDarkMode 
                      ? 'text-gray-500 hover:text-gray-300' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
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
                  placeholder="Ulangi password baru"
                  required
                  className={`w-full px-4 py-3 pr-12 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                    isDarkMode 
                      ? 'text-gray-500 hover:text-gray-300' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {passwordForm.newPassword && passwordForm.confirmPassword && (
                <p className={`text-xs mt-2 ${
                  passwordForm.newPassword === passwordForm.confirmPassword
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}>
                  {passwordForm.newPassword === passwordForm.confirmPassword
                    ? '✓ Password cocok'
                    : '✗ Password tidak cocok'}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              Simpan Password Baru
            </button>
          </form>
        </div>
      </div>
    )}

    {/* Logout modal moved to Sidebar */}
  </>
  );
}
