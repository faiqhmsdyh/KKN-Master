import React, { useContext } from 'react';
import { Moon, Sun, LogOut } from 'lucide-react';
import { ThemeContext } from '../App';

export default function Header({ user, onLogout }) {
  const { isDarkMode, setIsDarkMode } = useContext(ThemeContext);

  return (
    <header className={isDarkMode 
      ? "sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50 shadow-lg" 
      : "sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-blue-100/50 shadow-lg"}>
      <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo Section */}
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-shrink-0 hover-scale">
              <img src="/src/assets/logo/logo-uin.png" alt="Logo UIN" className="h-12 w-auto filter hover:drop-shadow-lg transition-all" />
            </div>
            <div className="relative flex-shrink-0 hover-scale">
              <img src="src/assets/logo/logo-lppm.png" alt="Logo LPPM" className="h-14 w-auto filter hover:drop-shadow-lg transition-all" />
            </div>
            <div className="flex flex-col gap-1 ml-3 md:ml-[45px]">
              <h1 className="text-3xl font-black leading-tight tracking-wider" style={{
                color: '#000000',
                fontFamily: '"Arial Black", sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                KKN<span className="text-blue-600">MASTER</span>
              </h1>
              <p className={isDarkMode ? "text-xs text-gray-500" : "text-xs text-gray-500"}>
                Sistem Pengelompokan Otomatis
              </p>
            </div>
          </div>

          {/* Right Controls: User Info, Logout */}
          <div className="flex justify-end items-center gap-4">
            {/* User Info */}
            {user && (
              <div className={`text-right hidden sm:block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <p className="text-sm font-medium">{user.nama}</p>
                <p className="text-xs opacity-75 capitalize">{user.role}</p>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all hover:scale-105 ${
                isDarkMode 
                  ? "bg-red-900/40 hover:bg-red-800/60 text-red-300 border border-red-700/50" 
                  : "bg-red-100/60 hover:bg-red-200/80 text-red-700 border border-red-300/50"
              }`}
              title="Keluar dari sistem"
            >
              <LogOut size={18} strokeWidth={2.5} />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
