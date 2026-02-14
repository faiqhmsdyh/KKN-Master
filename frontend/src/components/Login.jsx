import React, { useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function Login({ onLogin, isDarkMode, setIsDarkMode }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('petugas');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Login gagal');
      }
      const user = await res.json();
      onLogin(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative bg-white">
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

        {/* Logo Section */}
        <div className="flex items-center gap-4 mb-12 relative z-10">
          <img src="/src/assets/logo/logo-uin.png" alt="Logo UIN" className="h-16 w-auto filter brightness-0 invert drop-shadow-lg" />
          <img src="src/assets/logo/logo-lppm.png" alt="Logo LPPM" className="h-16 w-auto filter brightness-0 invert drop-shadow-lg" />
        </div>

        {/* Branding Text */}
        <div className="text-center relative z-10">
          <h1 className="text-5xl font-black mb-2">
            <span>KKN</span><br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-blue-200 to-cyan-300">MASTER DIGITAL</span>
          </h1>
          <p className="text-blue-100/80 text-lg mt-6 leading-relaxed max-w-md">
            Kelola pengabdian mahasiswa dengan sistem pemetaan otomatis yang adil, transparan, dan berbasis data.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN FORM */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-8 sm:px-12 py-12 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <img src="/src/assets/logo/logo-uin.png" alt="Logo UIN" className="h-12 w-auto" />
            <img src="src/assets/logo/logo-lppm.png" alt="Logo LPPM" className="h-12 w-auto" />
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Login</h2>
            <p className="text-gray-500">Selamat datang kembali di panel administrasi.</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} className="space-y-6">
            {/* Username Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Username / Email
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">👤</span>
                <input 
                  type="text"
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  placeholder="admin@univ.ac.id"
                  required
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔐</span>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Role Akses
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setRole('petugas')}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all border-2 ${
                    role === 'petugas'
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                  }`}
                >
                  PETUGAS
                </button>
                <button
                  type="button"
                  onClick={() => setRole('pimpinan')}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all border-2 ${
                    role === 'pimpinan'
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                  }`}
                >
                  PIMPINAN
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button 
              type="submit"
              disabled={loading} 
              className={`w-full py-3 rounded-lg font-bold text-white text-lg uppercase letter-spacing transition-all ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-slate-900 hover:bg-slate-800 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
              }`}
            >
              {loading ? 'TUNGGU...' : 'MASUK SEKARANG'}
            </button>
          </form>

          {/* Footer Text */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500 mb-2">Demo Credentials:</p>
            <p className="text-sm text-gray-700">
              <span className="font-mono font-semibold">admin</span> / <span className="font-mono font-semibold">admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

