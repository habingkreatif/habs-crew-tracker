'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix untuk masalah default icon leaflet di Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icon untuk Proyek (opsional, jika ingin berbeda)
const projectIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapComponentProps {
  projectLat: number;
  projectLng: number;
  projectRadius: number; // dalam meter
  userLat: number | null;
  userLng: number | null;
  projectName: string;
}

// Komponen helper untuk auto-center map jika koordinat berubah
function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function MapComponent({ projectLat, projectLng, projectRadius, userLat, userLng, projectName }: MapComponentProps) {
  const projectCenter: [number, number] = [projectLat, projectLng];
  
  return (
    <div className="h-[250px] w-full rounded-xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-800 relative z-0">
      <MapContainer 
        center={projectCenter} 
        zoom={15} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <MapUpdater center={projectCenter} zoom={15} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Marker Proyek */}
        <Marker position={projectCenter} icon={projectIcon}>
          <Popup>
            <div className="font-semibold text-sm">{projectName}</div>
            <div className="text-xs text-slate-500">Pusat Proyek</div>
          </Popup>
        </Marker>

        {/* Lingkaran Radius Geofence */}
        <Circle 
          center={projectCenter} 
          pathOptions={{ fillColor: '#22c55e', color: '#16a34a', fillOpacity: 0.2, weight: 2 }} 
          radius={projectRadius} 
        />

        {/* Marker User (Jika ada) */}
        {userLat && userLng && (
          <Marker position={[userLat, userLng]}>
            <Popup>
              <div className="font-semibold text-sm">Lokasi Anda</div>
              <div className="text-xs text-slate-500">Posisi GPS Saat Ini</div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
