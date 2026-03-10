import React, { useState, useEffect, useContext } from 'react';
import { MapPin, ChevronDown, ChevronUp, Loader, Map as MapIcon } from 'lucide-react';
import { ThemeContext } from '../App';
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

export default function HeaderLocations() {
  const { isDarkMode } = useContext(ThemeContext);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:4000/api/locations');
      
      if (!response.ok) {
        throw new Error('Gagal mengambil data lokasi');
      }

      const data = await response.json();
      setLocations(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
        isDarkMode ? 'bg-gray-800/50 text-gray-400' : 'bg-gray-100/50 text-gray-600'
      }`}>
        <Loader size={16} className="animate-spin" />
        <span className="text-sm">Memuat lokasi...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
        isDarkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-100/50 text-red-600'
      }`}>
        <MapPin size={16} />
        <span className="text-sm">Gagal memuat lokasi</span>
      </div>
    );
  }

  const displayLocations = isExpanded ? locations : locations.slice(0, 3);
  const hasMore = locations.length > 3;

  // Calculate map center based on available locations
  const getMapCenter = () => {
    if (!locations || locations.length === 0) {
      return [-0.8, 113.2]; // Default center (Indonesia)
    }
    
    const withCoords = locations.filter(loc => {
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

  const hasValidLocations = locations && locations.some(loc => {
    const lat = parseFloat(loc.latitude);
    const lng = parseFloat(loc.longitude);
    return !isNaN(lat) && !isNaN(lng) && lat && lng;
  });

  return (
    <div className={`flex flex-col gap-2 px-4 py-3 rounded-xl border transition-all ${
      isDarkMode 
        ? 'bg-gray-800/50 border-gray-700/50 text-gray-300' 
        : 'bg-blue-50/50 border-blue-200/50 text-gray-700'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin size={16} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
          <span className="text-sm font-semibold">Lokasi KKN</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isDarkMode 
              ? 'bg-blue-900/40 text-blue-300' 
              : 'bg-blue-100 text-blue-700'
          }`}>
            {locations.length}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {hasValidLocations && (
            <button
              onClick={() => setShowMap(!showMap)}
              className={`p-1 rounded transition-colors ${
                isDarkMode 
                  ? 'hover:bg-gray-700' 
                  : 'hover:bg-blue-100'
              } ${showMap ? (isDarkMode ? 'bg-gray-700' : 'bg-blue-100') : ''}`}
              title={showMap ? 'Sembunyikan Peta' : 'Tampilkan Peta'}
            >
              <MapIcon size={16} />
            </button>
          )}
          
          {hasMore && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-1 rounded transition-colors ${
                isDarkMode 
                  ? 'hover:bg-gray-700' 
                  : 'hover:bg-blue-100'
              }`}
              title={isExpanded ? 'Ciutkan' : 'Perluas'}
            >
              {isExpanded ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Map View */}
      {showMap && hasValidLocations && (
        <div className="rounded-lg overflow-hidden border border-opacity-50" style={{ height: '200px' }}>
          <MapContainer 
            center={getMapCenter()} 
            zoom={9} 
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {locations.map((location) => {
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
                      <h3 className="font-bold text-blue-600">
                        {location.desa_kelurahan}, {location.kecamatan}
                      </h3>
                      <p className="text-gray-700">{location.kabupaten_kota}</p>
                      <p className="text-gray-400 text-xs">
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

      {/* Location List */}
      {locations.length === 0 ? (
        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          Belum ada lokasi KKN
        </p>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto scrollbar-thin">
          {displayLocations.map((location) => (
            <div
              key={location.id_lokasi}
              className={`flex items-start gap-2 p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'hover:bg-gray-700/50' 
                  : 'hover:bg-white/70'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">
                  {location.desa_kelurahan}, {location.kecamatan}
                </p>
                <p className={`text-xs truncate ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  {location.kabupaten_kota}
                </p>
              </div>

            </div>
          ))}
        </div>
      )}

      {hasMore && !isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className={`text-xs text-center py-1 rounded transition-colors ${
            isDarkMode 
              ? 'text-blue-400 hover:text-blue-300' 
              : 'text-blue-600 hover:text-blue-700'
          }`}
        >
          + {locations.length - 3} lokasi lainnya
        </button>
      )}
    </div>
  );
}
