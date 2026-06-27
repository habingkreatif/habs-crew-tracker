'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ActiveProjectStats, MapAttendancePoint } from '@/domain/repositories/dashboard.repository';

// Fix untuk masalah default icon leaflet di Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const projectIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface DashboardMapProps {
  projects: ActiveProjectStats[];
  attendances: MapAttendancePoint[];
}

function MapBoundsUpdater({ projects, attendances }: DashboardMapProps) {
  const map = useMap();
  useEffect(() => {
    if (projects.length === 0) return;
    const bounds = L.latLngBounds(projects.map(p => [p.latitude, p.longitude]));
    attendances.forEach(a => bounds.extend([a.latitude, a.longitude]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  }, [projects, attendances, map]);
  return null;
}

export default function DashboardMap({ projects, attendances }: DashboardMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[400px] w-full bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />;
  }

  const defaultCenter: [number, number] = projects.length > 0 
    ? [projects[0].latitude, projects[0].longitude] 
    : [-7.797068, 110.370529]; // Default Jogja

  return (
    <div className="h-[400px] w-full rounded-xl overflow-hidden relative z-0 border border-slate-200 dark:border-slate-800 shadow-sm">
      <MapContainer 
        center={defaultCenter} 
        zoom={12} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <MapBoundsUpdater projects={projects} attendances={attendances} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Marker Proyek */}
        {projects.map(p => (
          <div key={`proj-${p.id}`}>
            <Marker position={[p.latitude, p.longitude]} icon={projectIcon}>
              <Popup>
                <div className="font-bold text-sm">{p.namaProyek}</div>
                <div className="text-xs text-slate-500 mt-1">Kru Hadir Hari Ini: {p.jumlahKruHariIni}</div>
              </Popup>
            </Marker>
            <Circle 
              center={[p.latitude, p.longitude]} 
              pathOptions={{ fillColor: '#3b82f6', color: '#2563eb', fillOpacity: 0.15, weight: 2 }} 
              radius={p.radiusMeter} 
            />
          </div>
        ))}

        {/* Marker Absen Kru */}
        {attendances.map((a, i) => (
          <Marker key={`att-${a.userId}-${i}`} position={[a.latitude, a.longitude]} icon={userIcon}>
            <Popup>
              <div className="font-bold text-sm">{a.nama}</div>
              <div className="text-xs text-slate-500 mt-1">
                Absen: {new Date(a.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
