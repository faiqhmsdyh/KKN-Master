import React, { useContext, useState } from 'react';
import { ThemeContext } from '../App';
import { Moon, Sun, Users, LogOut } from 'lucide-react';

export default function Sidebar({ tabs, activeTab, setActiveTab, isDarkMode, setIsDarkMode, onLogout, isSidebarCollapsed, setIsSidebarCollapsed }) {
  const [hoveredTab, setHoveredTab] = useState(null);
  const [hoveredBottom, setHoveredBottom] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const TooltipCard = ({ title, desc }) => (
    <div className={`absolute left-[calc(100%+1rem)] top-1/2 -translate-y-1/2 z-50 px-4 py-3 rounded-lg max-w-xs whitespace-normal pointer-events-none animate-slideInRight shadow-xl ${
      isDarkMode
        ? 'bg-gray-800 text-gray-100 border border-gray-700'
        : 'bg-white text-gray-900 border border-gray-200'
    }`}>
      <div className="space-y-1">
        <p className="font-semibold text-sm">{title}</p>
        {desc && <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{desc}</p>}
      </div>

      <div
        className={`absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 ${isDarkMode ? 'border-l-gray-800' : 'border-l-white'}`}
        style={{
          borderLeft: `6px solid ${isDarkMode ? '#1f2937' : '#ffffff'}`,
          borderTop: '4px solid transparent',
          borderBottom: '4px solid transparent',
        }}
      />
    </div>
  );

  // Filter out Manajemen Akun from main tabs
  const mainTabs = tabs.filter(tab => tab.key !== 'akun');
  
  // Check if user has access to Manajemen Akun
  const hasAkunAccess = tabs.some(tab => tab.key === 'akun');

  return (
    <>
      {/* VS Code Style Icon-Only Sidebar with Logo */}
      <aside className={`fixed left-0 top-0 h-screen ${isSidebarCollapsed ? 'w-20' : 'w-60'} ${isDarkMode ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-xl transition-all duration-300 ease-out flex flex-col z-50`}>
        
        {/* Logo Section */}
        <div className={`p-3 flex ${isSidebarCollapsed ? 'flex-col' : 'flex-row'} items-center justify-center gap-2`}>
          <div className="flex-shrink-0 hover-scale cursor-pointer">
            <img src="/src/assets/logo/logo-uin.png" alt="Logo UIN" className={`${isSidebarCollapsed ? 'h-11' : 'h-11'} w-auto filter hover:drop-shadow-lg transition-all`} />
          </div>
          {!isSidebarCollapsed && (
            <div className="flex-shrink-0 hover-scale cursor-pointer">
              <img src="/src/assets/logo/logo-lppm.png" alt="Logo LPPM" className="h-11 w-auto filter hover:drop-shadow-lg transition-all" />
            </div>
          )}
        </div>
        
        {/* Navigation Items with Menu Label */}
        <nav className={`flex-1 flex flex-col gap-2 px-4 pt-8 pb-4 overflow-y-auto ${isDarkMode ? 'scrollbar-dark' : 'scrollbar-light'}`}>
          {/* Menu Label */}
          {!isSidebarCollapsed && (
            <div className={`px-2 pb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <h3 className="text-xs font-bold uppercase tracking-wider">Menu</h3>
            </div>
          )}
          
          {mainTabs.map((tab) => (
            <div
              key={tab.key}
              className="relative group"
              onMouseEnter={() => setHoveredTab(tab.key)}
              onMouseLeave={() => setHoveredTab(null)}
            >
              <button
                onClick={() => setActiveTab(tab.key)}
                onMouseEnter={() => setHoveredTab(tab.key)}
                onMouseLeave={() => setHoveredTab(null)}
                aria-label={tab.label}
                title={tab.label}
                className={`sidebar-item w-full flex flex-row items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} py-3 ${isSidebarCollapsed ? 'px-2' : 'px-3'} rounded-xl transition-all duration-200 ease-out relative overflow-hidden ${
                  activeTab === tab.key
                    ? isDarkMode
                      ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/20 text-blue-300 border border-blue-700/50 shadow-lg shadow-blue-500/10'
                      : 'bg-gradient-to-r from-blue-100/50 to-indigo-100/30 text-blue-700 border border-blue-200/50 shadow-md shadow-blue-400/10'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 border border-gray-800/30'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/50 border border-gray-200/30'
                }`}
              >
                {/* Icon */}
                <span className={`flex items-center justify-center transition-all duration-200 ${
                  activeTab === tab.key ? 'scale-110' : 'scale-100 group-hover:scale-105'
                }`}>
                  {tab.icon}
                </span>
                
                {/* Label - Hidden when collapsed */}
                {!isSidebarCollapsed && (
                  <span className={`text-xs font-semibold whitespace-nowrap ${
                    activeTab === tab.key ? 'font-bold' : ''
                  }`}>
                    {tab.label}
                  </span>
                )}

                {/* Active Indicator Bar */}
                {activeTab === tab.key && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-indigo-400 animate-pulse-glow"></div>
                )}
              </button>

              {/* Tooltip/Popover */}
              {hoveredTab === tab.key && (
                <TooltipCard title={tab.label} desc={tab.description} />
              )}
            </div>
          ))}
        </nav>

        {/* Bottom Controls: Account Management & Theme Toggle */}
        <div className={`border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} flex flex-col gap-3 p-3`}>
          {/* Account Management Button - Only for Admin */}
          {hasAkunAccess && (
            <div
              className="relative group"
              onMouseEnter={() => setHoveredBottom('akun')}
              onMouseLeave={() => setHoveredBottom(null)}
            >
              <button
                onClick={() => setActiveTab('akun')}
                className={`w-full flex flex-row items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} py-3 ${isSidebarCollapsed ? 'px-2' : 'px-3'} rounded-xl transition-all duration-200 ${
                  activeTab === 'akun'
                    ? isDarkMode
                      ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/20 text-blue-300 border border-blue-700/50'
                      : 'bg-gradient-to-r from-blue-100/50 to-indigo-100/30 text-blue-700 border border-blue-200/50'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 border border-gray-800/30'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/50 border border-gray-200/30'
                }`}
                title="Manajemen Akun"
              >
                <Users size={22} strokeWidth={2.5} />
                {!isSidebarCollapsed && <span className="text-xs font-semibold whitespace-nowrap">Akun</span>}
              </button>

            </div>
          )}

          {/* Logout Button */}
          <div
            className="relative group"
            onMouseEnter={() => setHoveredBottom('logout')}
            onMouseLeave={() => setHoveredBottom(null)}
          >
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className={`w-full flex flex-row items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} py-3 ${isSidebarCollapsed ? 'px-2' : 'px-3'} rounded-xl transition-all duration-200 ${
                isDarkMode
                  ? 'bg-red-900/30 hover:bg-red-800/50 text-red-400 hover:text-red-300 border border-red-800/30'
                  : 'bg-red-100/50 hover:bg-red-200/70 text-red-600 hover:text-red-700 border border-red-300/30'
              }`}
              title="Logout"
            >
              <LogOut size={20} strokeWidth={2.5} />
              {!isSidebarCollapsed && <span className="text-xs font-semibold whitespace-nowrap">Logout</span>}
            </button>

          </div>

          {/* Toggle Sidebar Button */}
          <div
            className="relative group"
            onMouseEnter={() => setHoveredBottom('toggle')}
            onMouseLeave={() => setHoveredBottom(null)}
          >
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`w-full flex flex-row items-center justify-center py-3 px-2 rounded-xl transition-all duration-200 ${
                isDarkMode
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 border border-gray-800/30'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/50 border border-gray-200/30'
              }`}
              title={isSidebarCollapsed ? 'Buka Sidebar' : 'Tutup Sidebar'}
            >
              {isSidebarCollapsed ? <span className="text-lg font-bold">&gt;&gt;</span> : <span className="text-lg font-bold">&lt;&lt;</span>}
            </button>

          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`w-full max-w-sm rounded-xl shadow-2xl p-5 ${
            isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
          }`}>
            <div className="text-center">
              <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                isDarkMode ? "bg-red-900/40" : "bg-red-100"
              }`}>
                <LogOut size={22} className={isDarkMode ? "text-red-400" : "text-red-600"} />
              </div>
              
              <h3 className={`text-base font-bold mb-1.5 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}>
                Konfirmasi Keluar
              </h3>
              
              <p className={`text-sm mb-4 ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}>
                Yakin ingin keluar dari sistem?
              </p>
              
              <div className="flex gap-2.5">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
                >
                  Batal
                </button>
                
                <button
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    onLogout();
                  }}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-all shadow-lg hover:shadow-xl"
                >
                  Keluar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Offset - Fixed width for icon-only sidebar */}
      <div className="w-24"></div>
    </>
  );
}
