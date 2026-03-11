import React, { useState } from 'react';
import { Moon, Sun, Eye, EyeOff, X, Mail, IdCard, Loader, Lock, ArrowRight } from 'lucide-react';
import uinLogo from '../assets/logo/logo-uin.png';
import lppmLogo from '../assets/logo/logo-lppm.png';
import API_BASE_URL from '../config/api';

export default function Login({ onLogin, isDarkMode, setIsDarkMode }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState('staff'); // 'staff' or 'koordinator'
  
  // Forgot Password States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotNip, setForgotNip] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Login gagal');
      }
      const user = await res.json();
      // Role validation: allow flexible matching
      const role = (user.role || '').toLowerCase();
      const staffRoles = ['staff', 'admin'];
      const koorRoles = ['koordinator', 'koor'];
      if (
        (loginMode === 'staff' && !staffRoles.includes(role)) ||
        (loginMode === 'koordinator' && !koorRoles.includes(role))
      ) {
        setError(`Role tidak sesuai (role backend: ${user.role}). Silakan login sesuai mode yang dipilih.`);
        setLoading(false);
        return;
      }
      console.log('Login successful:', user);
      onLogin(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess(false);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nip: forgotNip, email: forgotEmail })
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Gagal mengirim email reset password');
      }
      
      setForgotSuccess(true);
      setForgotNip('');
      setForgotEmail('');
      
      // Auto close modal after 3 seconds
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotSuccess(false);
      }, 3000);
      
    } catch (err) {
      setForgotError(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center relative transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`} style={{ backgroundImage: `url(/src/assets/logo/uin-suka.jpg)`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      {/* Overlay for better contrast (dark mode/bright mode) */}
      {isDarkMode && <div className="absolute inset-0 bg-black/60"></div>}
      {!isDarkMode && <div className="absolute inset-0 bg-black/30"></div>}

      {/* Header-style logo bar (centered, same as dashboard) */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
        <img src={uinLogo} alt="Logo UIN" className="h-12 w-auto" />
        <img src={lppmLogo} alt="Logo LPPM" className="h-14 w-auto" />
        <span className="flex flex-col ml-2">
          <span className={`text-3xl text-center font-black leading-tight tracking-wider drop-shadow-lg ${isDarkMode ? 'text-white' : 'text-white'}`} style={{fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
            KKN<span className="text-blue-400">MASTER</span>
          </span>
          <span className={`text-xs  drop-shadow-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-200'}`}>Sistem Pengelompokan & Penempatan KKN</span>
        </span>
      </div>

      {/* Theme Toggle */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`absolute top-8 right-8 p-2.5 rounded-xl transition-all hover:scale-110 z-10 ${
          isDarkMode 
            ? "bg-gray-800/60 hover:bg-gray-700/80 text-yellow-400" 
            : "bg-gray-800/40 hover:bg-gray-700/60 text-yellow-300"
        }`}
        title={isDarkMode ? "Tampilan Terang" : "Tampilan Gelap"}
      >
        {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
      </button>

      {/* Main Login Container */}
      <div className="w-full max-w-2xl mx-auto px-6 relative z-10">
        {/* Login Card */}
        <div className="bg-white/75 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/30">

          {/* Header */}
          <div className="mb-4">
            <h2 className="text-gray-900 text-2xl text-center font-bold mb-2">
              {loginMode === 'koordinator' ? 'Login Sebagai Koordinator' : 'Login Sebagai Staff'}
            </h2>
            <p className="text-gray-600 text-center text-sm">
              Gunakan identitas resmi institusi Anda.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm bg-red-50 border border-red-200 text-red-700">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} className="space-y-5">
            {/* Username/NIP Input */}
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Username 
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <IdCard size={20} />
                </span>
                <input 
                  type="text"
                  name="username"
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  placeholder="Masukkan username anda"
                  required
                  className="w-full px-4 py-3.5 pl-6 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-gray-700 text-sm font-semibold">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline uppercase tracking-wide"
                >
                  Lupa Password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={20} />
                </span>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3.5 pl-6 pr-12 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember Device Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                Remember Me
              </label>
            </div>

            {/* Login Button */}
            <button 
              type="submit"
              disabled={loading} 
              className={`w-full py-4 rounded-xl font-bold text-white text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-slate-800 hover:bg-slate-900 shadow-lg hover:shadow-xl'
              }`}
            >
              {loading ? 'TUNGGU...' : (
                <>
                  Login
                  <ArrowRight size={18} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          {/* Mode Switch */}
          <div className="mt-6 pt-6 border-t border-gray-300/50 text-center">
            <p className="text-gray-600 text-xs mb-3">Login sebagai posisi lain?</p>
            <button
              type="button"
              onClick={() => {
                const newMode = loginMode === 'staff' ? 'koordinator' : 'staff';
                setLoginMode(newMode);
                setError('');
                setUsername('');
                setPassword('');
              }}
              className="inline-flex items-center gap-2 text-sm font-semibold transition-all underline text-blue-700 hover:text-blue-800 focus:outline-none bg-transparent p-0 border-0"
            >
              🔄 {loginMode === 'staff' ? 'Login Sebagai Koordinator' : 'Login Sebagai Staff'}
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Reset Password
              </h3>
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotError('');
                  setForgotSuccess(false);
                  setForgotNip('');
                  setForgotEmail('');
                }}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {forgotSuccess ? (
                <div className="text-center py-6">
                  <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                    <Mail size={32} className="text-green-600" />
                  </div>
                  <h4 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Email Terkirim!
                  </h4>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Link reset password telah dikirim ke email Anda. Silakan cek inbox atau folder spam.
                  </p>
                </div>
              ) : (
                <>
                  <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Masukkan NIP dan Email yang terdaftar. Kami akan mengirimkan link reset password ke email Anda.
                  </p>

                  {forgotError && (
                    <div className={`mb-4 p-4 rounded-lg text-sm ${
                      isDarkMode 
                        ? 'bg-red-900/30 border border-red-800 text-red-300' 
                        : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                      {forgotError}
                    </div>
                  )}

                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    {/* NIP Input */}
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        NIP
                      </label>
                      <div className="relative">
                        <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          value={forgotNip}
                          onChange={(e) => setForgotNip(e.target.value)}
                          placeholder="Masukkan NIP Anda"
                          required
                          className={`w-full px-4 py-3 pl-11 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Email Input */}
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="email@example.com"
                          required
                          className={`w-full px-4 py-3 pl-11 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className={`w-full py-3 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 ${
                        forgotLoading
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-slate-800 hover:bg-slate-900 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {forgotLoading ? (
                        <>
                          <Loader className="animate-spin" size={20} />
                          Mengirim...
                        </>
                      ) : (
                        'Kirim Link Reset Password'
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

