import React, { useState } from "react";
import {
  HomeIcon,
  MapIcon,
  UsersIcon,
  ClockIcon,
  UploadIcon,
} from "lucide-react"; // pastikan sudah install: npm i lucide-react

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const tabs = [
    { key: "dashboard", label: "Dashboard", icon: <HomeIcon size={18} /> },
    { key: "lokasi", label: "Data Lokasi", icon: <MapIcon size={18} /> },
    { key: "autogroup", label: "Autogroup", icon: <UsersIcon size={18} /> },
    { key: "riwayat", label: "Riwayat", icon: <ClockIcon size={18} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100 flex flex-col shadow-lg">
        <div className="p-6 text-2xl font-bold tracking-wide border-b border-gray-700">
          🚀 KKN AutoGroup
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full flex items-center gap-3 text-left px-4 py-2.5 rounded-xl transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white shadow-md"
                  : "hover:bg-gray-700/60 text-gray-300"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 text-sm border-t border-gray-700 text-gray-400 text-center">
          © 2025 KKN System
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-10 py-8">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          {tabs.find((t) => t.key === activeTab)?.icon}
          {tabs.find((t) => t.key === activeTab)?.label}
        </h1>

        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <section className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Total Mahasiswa", value: 0, color: "bg-blue-500" },
                { title: "Desa Tersedia", value: 0, color: "bg-green-500" },
                { title: "Riwayat Penempatan", value: 0, color: "bg-purple-500" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 shadow hover:shadow-lg transition-all border border-gray-100"
                >
                  <h2 className="text-gray-500 text-sm">{item.title}</h2>
                  <p className="text-4xl font-bold mt-2 text-gray-800">
                    {item.value}
                  </p>
                  <div className={`h-1 w-16 mt-3 rounded-full ${item.color}`}></div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow border border-gray-100">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <UploadIcon size={18} /> Import Excel Mahasiswa
              </h2>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-blue-400 transition">
                <input type="file" className="hidden" />
                <p className="text-gray-600 text-sm">
                  Klik untuk upload file Excel atau seret ke sini
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Format: nim, nama, prodi, fakultas, kesehatan, kendaraan, preferensi_lokasi
                </p>
              </label>
            </div>
          </section>
        )}

        {/* Data Lokasi */}
        {activeTab === "lokasi" && (
          <section className="bg-white rounded-2xl p-6 shadow border border-gray-100 animate-fadeIn">
            <h2 className="text-lg font-semibold mb-4">Data Lokasi</h2>
            <p className="text-gray-600">Tabel lokasi akan ditampilkan di sini.</p>
          </section>
        )}

        {/* Autogroup */}
        {activeTab === "autogroup" && (
          <section className="bg-white rounded-2xl p-6 shadow border border-gray-100 animate-fadeIn">
            <h2 className="text-lg font-semibold mb-4">Autogroup Generator</h2>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md">
              Generate Kelompok
            </button>
          </section>
        )}

        {/* Riwayat */}
        {activeTab === "riwayat" && (
          <section className="bg-white rounded-2xl p-6 shadow border border-gray-100 animate-fadeIn">
            <h2 className="text-lg font-semibold mb-4">Riwayat Penempatan</h2>
            <p className="text-gray-600">Data riwayat akan muncul di sini.</p>
          </section>
        )}
      </main>
    </div>
  );
}
