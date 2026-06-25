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
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Calculate distance using Haversine formula
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // meters
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

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
  
  let isWithinRadius = false;
  let distance = 0;
  if (userLat !== null && userLng !== null) {
    distance = getDistance(projectLat, projectLng, userLat, userLng);
    isWithinRadius = distance <= projectRadius;
  }

  // Dynamic colors
  const fillColor = userLat ? (isWithinRadius ? '#22c55e' : '#ef4444') : '#3b82f6';
  const strokeColor = userLat ? (isWithinRadius ? '#16a34a' : '#b91c1c') : '#2563eb';
  const glowClass = userLat ? (isWithinRadius ? 'shadow-[0_0_20px_rgba(34,197,94,0.3)] border-green-500/50' : 'shadow-[0_0_20px_rgba(239,68,68,0.3)] border-red-500/50') : 'border-slate-200 dark:border-slate-800';

  return (
    <div className={`h-[250px] w-full rounded-2xl overflow-hidden relative z-0 transition-all duration-500 border-2 ${glowClass}`}>
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
          pathOptions={{ fillColor: fillColor, color: strokeColor, fillOpacity: 0.2, weight: 2 }} 
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
