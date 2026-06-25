'use client';

import { useEffect, useState } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useCamera } from '@/hooks/useCamera';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/MapComponent'), { 
  ssr: false,
  loading: () => <div className="h-[250px] w-full rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center text-slate-400">Memuat Peta...</div>
});
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Camera, MapPin, MapPinOff, RefreshCcw, Loader2, Building2, CheckCircle2, LogOut, ArrowRight, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Helper calculate distance client-side for UI feedback
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function AbsenPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { coords, error: gpsError, isLoading: isLoadingGps, getLocation } = useGeolocation();
  const { videoRef, photoUrl, photoFile, startCamera, takePhoto, retakePhoto, isStreaming, error: camError } = useCamera();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(true);

  const selectedProject = projects.find(p => String(p.id) === selectedProjectId);
  
  let isWithinRadius = false;
  let distance = 0;
  if (selectedProject && coords) {
    distance = getDistance(selectedProject.latitude, selectedProject.longitude, coords.latitude, coords.longitude);
    isWithinRadius = distance <= selectedProject.radiusMeter;
  }

  useEffect(() => {
    if (user) {
      fetchTodayAttendance();
    }
  }, [user]);

  useEffect(() => {
    if (!todayAttendance) {
      fetchProjects();
      getLocation();
      startCamera();
    }
  }, [todayAttendance, getLocation, startCamera]);

  const fetchTodayAttendance = async () => {
    try {
      setIsLoadingAttendance(true);
      const res = await fetch(`/api/attendance/today?userId=${user?.id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setTodayAttendance(data.data);
      }
    } catch (err) {
      console.error('Gagal fetch absen:', err);
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success) {
        setProjects(data.data);
      }
    } catch (err) {
      console.error('Gagal fetch projects:', err);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleClockIn = async () => {
    if (!coords || !photoFile || !user || !selectedProjectId) {
      toast.error('Data belum lengkap', { description: 'Pastikan lokasi, foto, dan proyek sudah dipilih.' });
      return;
    }

    if (!isWithinRadius) {
      toast.error('Di Luar Jangkauan!', { description: `Jarak anda ${Math.round(distance)}m (Maks ${selectedProject.radiusMeter}m)` });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('userId', user.id);
    formData.append('projectId', selectedProjectId);
    formData.append('latitude', String(coords.latitude));
    formData.append('longitude', String(coords.longitude));
    formData.append('photo', photoFile);

    try {
      const res = await fetch('/api/attendance/clock-in', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Gagal absen masuk');
      }

      toast.success('Absen Berhasil!', { description: 'Selamat bekerja!' });
      setTodayAttendance(data.data);
    } catch (err: any) {
      toast.error('Gagal Absen', { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClockOut = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/attendance/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Gagal absen pulang');
      }

      toast.success('Absen Pulang Berhasil!', { description: 'Hati-hati di jalan pulang.' });
      setTodayAttendance(data.data);
    } catch (err: any) {
      toast.error('Peringatan Absen Pulang', {
        description: err.message,
        duration: 8000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingAttendance) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // === UI POST-ABSEN (SUDAH ABSEN) ===
  if (todayAttendance) {
    const clockInTime = new Date(todayAttendance.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const isClockedOut = !!todayAttendance.clockOut;

    return (
      <div className="p-5 space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-32">
        <header className="text-center pt-8">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl ${isClockedOut ? 'bg-blue-100 text-blue-600 shadow-blue-500/20' : 'bg-emerald-100 text-emerald-600 shadow-emerald-500/20'}`}>
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {isClockedOut ? 'Tugas Selesai' : 'Sedang Bekerja'}
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Proyek Pembangunan Berjalan
          </p>
        </header>

        {/* Boarding Pass / Ticket UI */}
        <div className="relative mx-auto max-w-sm">
          {/* Ticket Top */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-t-3xl shadow-xl border border-b-0 border-slate-200 dark:border-slate-800 relative z-10">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jam Masuk</p>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{clockInTime}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                <p className={`text-lg font-bold ${isClockedOut ? 'text-blue-500' : 'text-emerald-500'}`}>{isClockedOut ? 'PULANG' : 'HADIR'}</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 dark:border-slate-800">
                <img src={todayAttendance.photoSelfieUrl} alt="Selfie" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">{user?.nama}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><ShieldCheck className="w-3 h-3 text-emerald-500" /> Lokasi Terverifikasi</p>
              </div>
            </div>
          </div>
          
          {/* Ticket Divider (Dashed) */}
          <div className="relative flex items-center justify-between w-full h-4 bg-white dark:bg-slate-900 shadow-xl border-x border-slate-200 dark:border-slate-800">
             <div className="absolute left-0 w-4 h-4 bg-slate-50 dark:bg-slate-950 rounded-full -translate-x-1/2 border-r border-slate-200 dark:border-slate-800 shadow-inner"></div>
             <div className="absolute right-0 w-4 h-4 bg-slate-50 dark:bg-slate-950 rounded-full translate-x-1/2 border-l border-slate-200 dark:border-slate-800 shadow-inner"></div>
             <div className="w-full h-full px-6 flex items-center">
                <div className="w-full border-t-[2px] border-dashed border-slate-200 dark:border-slate-800"></div>
             </div>
          </div>

          {/* Ticket Bottom */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-b-3xl shadow-xl border border-t-0 border-slate-200 dark:border-slate-800 relative z-10 flex justify-center">
             <div className="text-center">
               <p className="text-xs font-medium text-slate-400 mb-1">ID Absensi</p>
               <p className="font-mono text-xs font-bold tracking-widest text-slate-800 dark:text-slate-300">ATT-{String(todayAttendance.id).padStart(6, '0')}</p>
             </div>
          </div>
        </div>

        {!isClockedOut ? (
          <div className="pt-6 space-y-4 max-w-sm mx-auto">
            <Button
              onClick={() => router.push('/tugas')}
              variant="outline"
              className="w-full h-14 rounded-2xl bg-white dark:bg-slate-900 border-2 border-primary/20 text-primary hover:bg-primary/5 font-bold transition-all shadow-sm"
            >
              Update Laporan Harian
            </Button>
            
            <Button
              size="lg"
              variant="destructive"
              className="w-full h-14 rounded-2xl text-lg font-bold shadow-rose-500/30 shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
              disabled={isSubmitting}
              onClick={handleClockOut}
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <LogOut className="w-5 h-5 mr-2" />}
              Absen Pulang
            </Button>
            <p className="text-[10px] text-center text-slate-500 font-medium">
              *Syarat pulang: Laporan progres harian &gt; 0%
            </p>
          </div>
        ) : (
          <div className="text-center pt-8">
            <p className="text-sm font-bold text-slate-400">Tercatat Pulang Pada:</p>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1">
              {new Date(todayAttendance.clockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}
      </div>
    );
  }

  // === UI PRE-ABSEN (BELUM ABSEN) ===
  return (
    <div className="p-5 space-y-6 animate-in fade-in duration-700 pb-32">
      <header className="pt-4">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Absen Pagi</h1>
        <p className="text-slate-500 font-medium mt-1">Konfirmasi lokasi dan ambil foto selfie.</p>
      </header>

      {/* Project Selector */}
      <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-black/50 bg-white dark:bg-slate-900 rounded-3xl">
        <CardContent className="p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Pilih Proyek</p>
              {isLoadingProjects ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              ) : (
                <Select value={selectedProjectId} onValueChange={v => setSelectedProjectId(v || '')}>
                  <SelectTrigger className="h-10 text-sm font-bold border-slate-200 dark:border-slate-800 rounded-xl focus:ring-primary/20">
                    <SelectValue placeholder="Pilih Proyek..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {projects.map(p => (
                      <SelectItem key={p.id} value={String(p.id)} className="font-semibold">{p.namaProyek}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
            
          {/* Map & Geofence Visualizer */}
          {selectedProject && (
            <div className="pt-2 animate-in zoom-in-95 duration-500">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Radar Geofence</span>
                {coords && (
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${isWithinRadius ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {isWithinRadius ? 'Dalam Area' : `Di Luar Area (${Math.round(distance)}m)`}
                  </span>
                )}
              </div>
              <MapComponent 
                projectLat={selectedProject.latitude}
                projectLng={selectedProject.longitude}
                projectRadius={selectedProject.radiusMeter}
                userLat={coords?.latitude || null}
                userLng={coords?.longitude || null}
                projectName={selectedProject.namaProyek}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Camera View (Native App Style) */}
      <div className="space-y-4">
        <div className="flex justify-between items-end px-2">
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-200">Foto Selfie</h2>
          <Button variant="ghost" size="sm" onClick={getLocation} disabled={isLoadingGps} className="text-slate-400 h-8 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-900">
            <RefreshCcw className={`w-3 h-3 mr-2 ${isLoadingGps ? 'animate-spin' : ''}`} />
            Refresh GPS
          </Button>
        </div>

        <div className={`relative aspect-[3/4] w-full max-w-sm mx-auto overflow-hidden rounded-[40px] bg-black shadow-2xl transition-all duration-500 ${photoUrl ? 'border-4 border-emerald-500 shadow-emerald-500/30' : isStreaming ? 'border-4 border-primary shadow-primary/30' : 'border-4 border-slate-200 dark:border-slate-800'}`}>
          {!photoUrl ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-[1.02]"
              />
              {/* Camera Grid Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                 <div className="w-full h-full grid grid-cols-3 grid-rows-3 opacity-20 border border-white/50">
                   <div className="border-r border-b border-white"></div><div className="border-r border-b border-white"></div><div className="border-b border-white"></div>
                   <div className="border-r border-b border-white"></div><div className="border-r border-b border-white"></div><div className="border-b border-white"></div>
                   <div className="border-r border-white"></div><div className="border-r border-white"></div><div></div>
                 </div>
              </div>

              {!isStreaming && !camError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
              )}
              {camError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-white bg-black/80 backdrop-blur-md">
                  <Camera className="w-12 h-12 mb-4 text-rose-500 opacity-80" />
                  <p className="text-sm font-medium">{camError}</p>
                  <Button variant="outline" className="mt-6 rounded-xl border-white/20 hover:bg-white/10" onClick={startCamera}>Coba Lagi Kamera</Button>
                </div>
              )}
              
              {/* Native Shutter Button Overlay */}
              {isStreaming && (
                <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20">
                  <button 
                    onClick={takePhoto}
                    className="w-20 h-20 rounded-full border-[6px] border-white/50 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                  >
                     <div className="w-14 h-14 bg-white rounded-full shadow-lg"></div>
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <img src={photoUrl} alt="Selfie" className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-500" />
              <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20">
                <Button 
                  onClick={retakePhoto}
                  className="rounded-full bg-black/50 backdrop-blur-md text-white border border-white/20 hover:bg-black/70 shadow-lg font-bold px-6 h-12"
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Ulangi Foto
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Submit Action */}
      <div className="pt-6 pb-4">
        <Button
          size="lg"
          className={`w-full h-16 rounded-[24px] text-lg font-black transition-all duration-300 ${(!coords || !photoUrl || !selectedProjectId || !isWithinRadius) ? 'bg-slate-200 text-slate-400' : 'bg-primary shadow-xl shadow-primary/40 hover:scale-[1.02] active:scale-95 text-white'}`}
          disabled={!coords || !photoUrl || !selectedProjectId || !isWithinRadius || isSubmitting}
          onClick={handleClockIn}
        >
          {isSubmitting ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : !isWithinRadius && selectedProject && coords ? (
             'Di Luar Radius Proyek'
          ) : (
            <>
              Absen Sekarang <ArrowRight className="w-6 h-6 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
