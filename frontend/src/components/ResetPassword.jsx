import React, { useState, useEffect } from 'react';
import { Moon, Sun, Eye, EyeOff, Lock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import API_BASE_URL from '../config/api';

export default function ResetPassword({ isDarkMode, setIsDarkMode, onBackToLogin }) {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Get token from URL query parameter
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('Token tidak ditemukan. Link reset password tidak valid.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Validation
    if (newPassword.length < 6) {
      setError('Password minimal 6 karakter');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Gagal mengubah password');
      }

      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        if (onBackToLogin) {
          onBackToLogin();
        } else {
          window.location.href = '/';
        }
      }, 3000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex relative ${
      isDarkMode ? "bg-gray-900" : "bg-white"
    }`}>
      {/* Theme Toggle */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`absolute top-8 right-8 p-2.5 rounded-xl transition-all hover:scale-110 z-10 ${
          isDarkMode 
            ? "bg-gray-800/60 hover:bg-gray-700/80 text-yellow-400" 
            : "bg-gray-100/60 hover:bg-gray-200/80 text-amber-600"
        }`}
        title={isDarkMode ? "Tampilan Terang" : "Tampilan Gelap"}
      >
        {isDarkMode ? <Sun size={20} strokeWidth={2.5} /> : <Moon size={20} strokeWidth={2.5} />}
      </button>

      {/* LEFT SIDE - BRANDING */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex-col justify-center items-center text-white p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        
        {/* Content */}
        <div className="relative z-10 text-center max-w-md">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center transform rotate-6 shadow-2xl">
              <Lock size={48} strokeWidth={2.5} className="transform -rotate-6" />
            </div>
            <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-blue-200 via-white to-blue-200 bg-clip-text text-transparent">
              Reset Password
            </h1>
            <p className="text-blue-200 text-lg leading-relaxed">
              Buat password baru yang aman untuk akun Anda
            </p>
          </div>
          
          <div className="space-y-4 text-left bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              </div>
              <p className="text-blue-100 text-sm">Gunakan minimal 6 karakter</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              </div>
              <p className="text-blue-100 text-sm">Kombinasi huruf, angka dan simbol lebih aman</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              </div>
              <p className="text-blue-100 text-sm">Jangan gunakan password yang mudah ditebak</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - RESET FORM */}
      <div className={`w-full lg:w-1/2 flex items-center justify-center p-8 ${
        isDarkMode ? "bg-gray-900" : "bg-white"
      }`}>
        <div className="w-full max-w-md">
          {/* Back to Login */}
          <button
            onClick={() => {
              if (onBackToLogin) {
                onBackToLogin();
              } else {
                window.location.href = '/';
              }
            }}
            className={`flex items-center gap-2 mb-6 text-sm font-medium transition-colors ${
              isDarkMode 
                ? "text-gray-400 hover:text-white" 
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <ArrowLeft size={16} />
            Kembali ke Login
          </button>

          {/* Header */}
          <div className="mb-8">
            <h2 className={`text-3xl font-black mb-2 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}>
              Buat Password Baru
            </h2>
            <p className={`text-sm ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}>
              Masukkan password baru Anda di bawah ini
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-900">Password Berhasil Diubah!</p>
                <p className="text-xs text-green-700 mt-1">
                  Anda akan diarahkan ke halaman login dalam beberapa detik...
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
              <XCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900">Gagal Mengubah Password</p>
                <p className="text-xs text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}>
                Password Baru
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Lock size={18} className={isDarkMode ? "text-gray-500" : "text-gray-400"} />
                </div>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full pl-12 pr-12 py-3.5 rounded-xl border-2 font-medium transition-all ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:bg-gray-750"
                      : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white"
                  }`}
                  placeholder="Masukkan password baru"
                  required
                  disabled={!token || success}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}>
                Konfirmasi Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Lock size={18} className={isDarkMode ? "text-gray-500" : "text-gray-400"} />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-12 pr-12 py-3.5 rounded-xl border-2 font-medium transition-all ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:bg-gray-750"
                      : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white"
                  }`}
                  placeholder="Ketik ulang password baru"
                  required
                  disabled={!token || success}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !token || success}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  Mengubah Password...
                </>
              ) : (
                <>
                  <Lock size={18} />
                  Ubah Password
                </>
              )}
            </button>
          </form>

          {/* Info */}
          <div className={`mt-6 p-4 rounded-xl ${
            isDarkMode ? "bg-blue-900/20 border border-blue-800/30" : "bg-blue-50 border border-blue-200"
          }`}>
            <p className={`text-xs ${
              isDarkMode ? "text-blue-300" : "text-blue-700"
            }`}>
              💡 <strong>Tips Keamanan:</strong> Setelah password berhasil diubah, gunakan password baru Anda untuk login ke sistem.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
