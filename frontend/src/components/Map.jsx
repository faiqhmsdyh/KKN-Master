import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

import { useContext } from 'react';
import { ThemeContext } from '../App';

export default function Map({ locationData }) {
  const { isDarkMode } = useContext(ThemeContext);
  // Calculate center based on locations
  const getCenter = () => {
    if (!locationData || locationData.length === 0) {
      return [-0.8, 113.2]; // Default center (Indonesia)
    }
    
    const withCoords = locationData.filter(loc => {
      const lat = parseFloat(loc.latitude);
      const lng = parseFloat(loc.longitude);
      return !isNaN(lat) && !isNaN(lng) && lat && lng;
    });
    
    if (withCoords.length === 0) {
      return [-0.8, 113.2];
    }

    const sumLat = withCoords.reduce((sum, loc) => sum + parseFloat(loc.latitude), 0);
    const sumLng = withCoords.reduce((sum, loc) => sum + parseFloat(loc.longitude), 0);
    
    return [sumLat / withCoords.length, sumLng / withCoords.length];
  };

  const center = getCenter();
  const hasValidLocations = locationData && locationData.some(loc => {
    const lat = parseFloat(loc.latitude);
    const lng = parseFloat(loc.longitude);
    return !isNaN(lat) && !isNaN(lng) && lat && lng;
  });

  return (
    <>
      {!hasValidLocations ? (
        <div className={isDarkMode ? "bg-gray-700/50 p-8 rounded-xl text-center" : "bg-gray-50 p-8 rounded-xl text-center"}>
          <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>Belum ada lokasi dengan koordinat. Silakan tambah lokasi dan gunakan fitur "Cari Koordinat".</p>
        </div>
      ) : (
        <div style={{ height: '400px' }}>
          <MapContainer center={center} zoom={9} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {locationData.map((location) => {
              const lat = parseFloat(location.latitude);
              const lng = parseFloat(location.longitude);
              
              if (isNaN(lat) || isNaN(lng) || !lat || !lng) return null;
              
              return (
                <Marker
                  key={location.id_lokasi}
                  position={[lat, lng]}
                >
                  <Popup>
                    <div className="text-sm">
                      <h3 className={isDarkMode ? "font-bold text-blue-400" : "font-bold text-blue-600"}>{location.lokasi}</h3>
                      <p className={isDarkMode ? "text-gray-300" : "text-gray-700"}>{location.desa_kecamatan}</p>
                      <p className={isDarkMode ? "text-gray-400 text-xs" : "text-gray-600 text-xs"}>{location.kabupaten}</p>
                      <p className={isDarkMode ? "text-gray-400 text-xs mt-1" : "text-gray-500 text-xs mt-1"}>
                        Kuota: {location.kuota}
                      </p>
                      <p className={isDarkMode ? "text-gray-500 text-xs" : "text-gray-400 text-xs"}>
                        {lat.toFixed(4)}, {lng.toFixed(4)}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      )}
    </>
  );
}
