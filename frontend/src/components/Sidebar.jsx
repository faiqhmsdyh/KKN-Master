import React, { useContext, useState } from 'react';
import { ThemeContext } from '../App';
import { Moon, Sun, UsersIcon } from 'lucide-react';

export default function Sidebar({ tabs, activeTab, setActiveTab, isDarkMode, setIsDarkMode }) {
  const [hoveredTab, setHoveredTab] = useState(null);
  const [hoveredBottom, setHoveredBottom] = useState(null);

  const TooltipCard = ({ title, desc }) => (
    <div className={`absolute left-[calc(100%+1rem)] top-1/2 -translate-y-1/2 z-[11000] px-4 py-3 rounded-lg max-w-xs whitespace-normal pointer-events-none animate-slideInRight shadow-xl ${
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

  return (
    <>
      {/* VS Code Style Icon-Only Sidebar */}
      <aside className={isDarkMode 
        ? `fixed left-0 top-20 h-[calc(100vh-80px)] w-16 bg-gray-900 border-r border-gray-800 transition-all duration-300 ease-out flex flex-col shadow-lg z-[10000]` 
        : `fixed left-0 top-20 h-[calc(100vh-80px)] w-16 bg-white border-r border-gray-200 transition-all duration-300 ease-out flex flex-col shadow-md z-[10000]`}>
        
        {/* Navigation Items */}
        <nav className={`flex-1 flex flex-col gap-2 p-3 overflow-y-auto overflow-visible ${isDarkMode ? 'scrollbar-dark' : 'scrollbar-light'}`}>
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
                className={`sidebar-item w-full flex items-center justify-center p-3 rounded-lg transition-all duration-200 ease-out relative overflow-hidden ${
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
        <div className={`border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} flex flex-col gap-2 p-2`}>
          {/* Account Management Button */}
          <div
            className="relative group"
            onMouseEnter={() => setHoveredBottom('akun')}
            onMouseLeave={() => setHoveredBottom(null)}
          >
            <button
              onClick={() => setActiveTab('akun')}
              className={`w-full flex items-center justify-center p-3 rounded-lg transition-all duration-200 ${
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
              <UsersIcon size={20} strokeWidth={2.5} />
            </button>

            {/* Tooltip */}
            {hoveredBottom === 'akun' && (
              <TooltipCard title="Manajemen Akun" />
            )}
          </div>

          {/* Theme Toggle Button */}
          <div
            className="relative group"
            onMouseEnter={() => setHoveredBottom('theme')}
            onMouseLeave={() => setHoveredBottom(null)}
          >
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`w-full flex items-center justify-center p-3 rounded-lg transition-all duration-200 ${
                isDarkMode
                  ? 'bg-gray-800/50 hover:bg-gray-700/50 text-yellow-400 hover:text-yellow-300 border border-gray-800/30'
                  : 'bg-gray-100/50 hover:bg-gray-200/50 text-amber-600 hover:text-amber-700 border border-gray-200/30'
              }`}
              title={isDarkMode ? 'Tampilan Terang' : 'Tampilan Gelap'}
            >
              {isDarkMode ? <Sun size={20} strokeWidth={2.5} /> : <Moon size={20} strokeWidth={2.5} />}
            </button>

            {/* Tooltip */}
            {hoveredBottom === 'theme' && (
              <TooltipCard title={isDarkMode ? 'Tampilan Terang' : 'Tampilan Gelap'} />
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Offset - Fixed width for icon-only sidebar */}
      <div className="w-16" />
    </>
  );
}
