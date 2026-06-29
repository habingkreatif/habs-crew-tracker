'use client';

import { useEffect, useState } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useCamera } from '@/hooks/useCamera';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className="h-[250px] w-full rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center text-slate-400 font-medium">Menghubungkan ke Satelit...</div>
});
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Camera, RefreshCcw, Loader2, Building2, CheckCircle2, LogOut, ArrowRight, ShieldCheck, Map, Clock, Navigation } from 'lucide-react';
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
  const { videoRef, photoUrl, photoFile, startCamera, takePhoto, retakePhoto, isStreaming, error: camError } = useCamera('user'); // Gunakan kamera depan
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
    if (!todayAttendance && !isLoadingAttendance) {
      fetchProjects();
      getLocation();
      startCamera();
    }
  }, [todayAttendance, isLoadingAttendance]); // Removed dependencies that cause loops

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
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // === UI POST-ABSEN (SUDAH ABSEN) ===
  if (todayAttendance) {
    const clockInTime = new Date(todayAttendance.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const isClockedOut = !!todayAttendance.clockOut;

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">
        {/* Header Style TUGAS */}
        <div className="relative pt-12 pb-14 px-6 bg-white dark:bg-black rounded-b-[40px] shadow-sm overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] translate-x-1/2 -translate-y-1/4 pointer-events-none"></div>

          <header className="relative z-10 flex justify-between items-center">
            <div>
              <p className="text-primary font-bold tracking-widest text-[10px] mb-1.5 uppercase">Status Kehadiran</p>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Presensi Aktif</h1>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${isClockedOut ? 'bg-blue-50 border-blue-100 text-blue-500' : 'bg-emerald-50 border-emerald-100 text-emerald-500'}`}>
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </header>
        </div>

        <div className="px-5 -mt-8 relative z-20 animate-in slide-in-from-bottom-4 duration-500">

          {/* Boarding Pass / Ticket UI Premium */}
          <div className="relative mx-auto max-w-sm drop-shadow-xl">
            {/* Ticket Top */}
            <div className="bg-white dark:bg-slate-900 p-7 rounded-[32px] rounded-b-none border border-b-0 border-slate-200 dark:border-slate-800 relative z-10 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2"></div>

              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                    <Clock className="w-3 h-3" /> Jam Masuk
                  </p>
                  <p className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">{clockInTime}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black tracking-widest ${isClockedOut ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {isClockedOut ? 'PULANG' : 'HADIR'}
                  </span>
                </div>
              </div>

              <div className="flex gap-4 items-center relative z-10 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="w-14 h-14 rounded-[14px] overflow-hidden bg-slate-200 shrink-0 border border-slate-200 dark:border-slate-700">
                  <img src={todayAttendance.photoSelfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{user?.nama}</p>
                  <p className="text-[10px] text-emerald-600 flex items-center gap-1 mt-0.5 font-bold tracking-wide">
                    <ShieldCheck className="w-3.5 h-3.5" /> GPS Terverifikasi
                  </p>
                </div>
              </div>
            </div>

            {/* Ticket Divider (Dashed) */}
            <div className="relative w-full bg-white dark:bg-slate-900 border-x border-slate-200 dark:border-slate-800">
              {/* Left Cutout */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-50 dark:bg-slate-950 rounded-full -translate-x-1/2 border-r border-slate-200 dark:border-slate-800 shadow-inner z-20"></div>
              {/* Right Cutout */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-50 dark:bg-slate-950 rounded-full translate-x-1/2 border-l border-slate-200 dark:border-slate-800 shadow-inner z-20"></div>

              <div className="px-8 py-2">
                <div className="w-full border-t-[3px] border-dashed border-slate-200 dark:border-slate-800"></div>
              </div>
            </div>

            {/* Ticket Bottom */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] rounded-t-none border border-t-0 border-slate-200 dark:border-slate-800 relative z-10 text-center">
              <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">ID Presensi</p>
              <p className="font-mono text-sm font-black tracking-[0.2em] text-slate-700 dark:text-slate-300">
                ATT-{String(todayAttendance.id).padStart(6, '0')}
              </p>
            </div>
          </div>

          {!isClockedOut ? (
            <div className="pt-8 space-y-4 max-w-sm mx-auto">
              <Button
                onClick={() => router.push('/tugas')}
                className="w-full h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-bold transition-all shadow-sm"
              >
                Buat Laporan Pekerjaan
              </Button>

              <Button
                size="lg"
                className="w-full h-14 rounded-2xl text-base font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-xl shadow-rose-500/20 active:scale-95 transition-all"
                disabled={isSubmitting}
                onClick={handleClockOut}
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <LogOut className="w-5 h-5 mr-2" />}
                Akhiri Sesi Kerja (Pulang)
              </Button>
              <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-medium p-3 rounded-xl border border-rose-100 dark:border-rose-900/50 flex gap-2 items-start">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Anda hanya bisa absen pulang jika sudah mengirim laporan progres pekerjaan hari ini.</p>
              </div>
            </div>
          ) : (
            <div className="text-center pt-10">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tercatat Pulang Pada</p>
              <p className="text-3xl font-black text-slate-800 dark:text-slate-200 mt-1">
                {new Date(todayAttendance.clockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // === UI PRE-ABSEN (BELUM ABSEN) ===
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">
      {/* Header Premium Clean */}
      <div className="relative pt-12 pb-14 px-6 bg-white dark:bg-black rounded-b-[40px] shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] translate-x-1/2 -translate-y-1/4 pointer-events-none"></div>

        <header className="relative z-10 flex justify-between items-center">
          <div>
            <p className="text-primary font-bold tracking-widest text-[10px] mb-1.5 uppercase">Mulai Sesi Kerja</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Absen Masuk</h1>
          </div>
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-800 text-slate-400">
            <Navigation className="w-5 h-5" />
          </div>
        </header>
      </div>

      <div className="px-5 -mt-6 relative z-20 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Project Selector Card */}
        <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-black/50 bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Lokasi Proyek
                </Label>
              </div>

              {isLoadingProjects ? (
                <div className="h-14 rounded-2xl bg-slate-100 flex items-center px-4 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                </div>
              ) : (
                <Select value={selectedProjectId} onValueChange={v => setSelectedProjectId(v || '')}>
                  <SelectTrigger className="h-14 text-base px-5 font-bold border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-primary/30 bg-slate-50 dark:bg-slate-950/50">
                    <div className="flex-1 text-left truncate">
                      {selectedProject ? selectedProject.namaProyek : <span className="text-muted-foreground">Pilih proyek tempat bekerja...</span>}
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {projects.map(p => (
                      <SelectItem key={p.id} value={String(p.id)} className="font-semibold py-3">{p.namaProyek}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Map & Geofence Visualizer */}
            {selectedProject && (
              <div className="pt-6 animate-in zoom-in-95 duration-500">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Map className="w-3.5 h-3.5" /> Radar Geofence
                  </span>
                  {coords ? (
                    <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full ${isWithinRadius ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {isWithinRadius ? 'Dalam Area' : `${Math.round(distance)}m (Luar)`}
                    </span>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={getLocation} disabled={isLoadingGps} className="h-6 text-[10px] font-bold text-slate-400 hover:text-primary">
                      <RefreshCcw className={`w-3 h-3 mr-1.5 ${isLoadingGps ? 'animate-spin' : ''}`} /> Muat Ulang GPS
                    </Button>
                  )}
                </div>
                <div className="rounded-[24px] overflow-hidden border-2 border-slate-100 dark:border-slate-800 shadow-inner relative z-0">
                  <MapComponent
                    projectLat={selectedProject.latitude}
                    projectLng={selectedProject.longitude}
                    projectRadius={selectedProject.radiusMeter}
                    userLat={coords?.latitude || null}
                    userLng={coords?.longitude || null}
                    projectName={selectedProject.namaProyek}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Camera View (Native App Style) */}
        {selectedProject && (
          <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-black/50 bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-end mb-4">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" /> Verifikasi Wajah
                </Label>
              </div>

              <div className={`relative aspect-[3/4] w-full max-w-sm mx-auto overflow-hidden rounded-[24px] bg-slate-950 shadow-inner transition-all duration-500 ${photoUrl ? 'border-2 border-emerald-500 shadow-emerald-500/20' : isStreaming ? 'border-2 border-primary/50' : 'border-2 border-slate-200 dark:border-slate-800'}`}>
                {!photoUrl ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ transform: 'scaleX(-1)' }} // Mirror view for selfie
                    />
                    {/* Camera Grid Overlay */}
                    <div className="absolute inset-0 pointer-events-none p-4 pb-24">
                      <div className="w-full h-full border border-white/20 rounded-[20px] grid grid-cols-3 grid-rows-3 overflow-hidden">
                        <div className="border-r border-b border-white/10"></div><div className="border-r border-b border-white/10"></div><div className="border-b border-white/10"></div>
                        <div className="border-r border-b border-white/10"></div><div className="border-r border-b border-white/10"></div><div className="border-b border-white/10"></div>
                        <div className="border-r border-white/10"></div><div className="border-r border-white/10"></div><div></div>
                      </div>
                    </div>

                    {!isStreaming && !camError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
                        <Loader2 className="w-10 h-10 text-white animate-spin" />
                      </div>
                    )}
                    {camError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-white bg-slate-950/90 backdrop-blur-md">
                        <Camera className="w-12 h-12 mb-4 text-rose-500 opacity-80" />
                        <p className="text-sm font-medium">{camError}</p>
                        <Button variant="outline" className="mt-6 rounded-xl border-white/20 hover:bg-white/10 bg-transparent text-white" onClick={startCamera}>Coba Lagi</Button>
                      </div>
                    )}

                    {/* Native Shutter Button Overlay */}
                    {isStreaming && (
                      <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20">
                        <button
                          onClick={takePhoto}
                          className="w-20 h-20 rounded-full border-[5px] border-white/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
                        >
                          <div className="w-14 h-14 bg-white rounded-full shadow-inner"></div>
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <img src={photoUrl} alt="Selfie" className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-500" style={{ transform: 'scaleX(-1)' }} />
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20">
                      <Button
                        onClick={retakePhoto}
                        className="rounded-full bg-slate-900/60 backdrop-blur-md text-white border border-white/20 hover:bg-slate-900/80 shadow-xl font-bold px-6 h-12"
                      >
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Ulangi Foto
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Action */}
        <div className="pt-2">
          <Button
            size="lg"
            className={`w-full h-16 rounded-[24px] text-lg font-black transition-all duration-300 ${(!coords || !photoUrl || !selectedProjectId || !isWithinRadius) ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed' : 'bg-primary shadow-xl shadow-primary/40 hover:scale-[1.02] active:scale-95 text-white'}`}
            disabled={!coords || !photoUrl || !selectedProjectId || !isWithinRadius || isSubmitting}
            onClick={handleClockIn}
          >
            {isSubmitting ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : !isWithinRadius && selectedProject && coords ? (
              'Di Luar Radius Proyek'
            ) : (
              <>
                Absen Masuk <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
}
