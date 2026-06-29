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
import { Camera, RefreshCcw, Loader2, Building2, CheckCircle2, LogOut, ArrowRight, ShieldCheck, Map, Clock, Navigation, ArrowLeft } from 'lucide-react';
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

interface Project {
  id: number;
  namaProyek: string;
  latitude: number;
  longitude: number;
  radiusMeter: number;
}

interface TodayAttendance {
  id: number;
  projectId: number;
  clockIn: string;
  clockOut: string | null;
  photoSelfieUrl: string;
}

interface DailyTask {
  id: number;
  tanggal: string;
  progressPercentage: number | null;
}

export default function AbsenPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { coords, error: gpsError, isLoading: isLoadingGps, getLocation } = useGeolocation();
  const { videoRef, photoUrl, photoFile, startCamera, takePhoto, retakePhoto, isStreaming, error: camError } = useCamera('user');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null);
  const [todayTasks, setTodayTasks] = useState<DailyTask[]>([]);
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
  }, [todayAttendance, isLoadingAttendance]);

  const fetchTodayAttendance = async () => {
    try {
      setIsLoadingAttendance(true);
      const res = await fetch(`/api/attendance/today?userId=${user?.id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setTodayAttendance(data.data);

        // Cek tugas hari ini agar tombol Pulang bisa diverifikasi
        const resTask = await fetch(`/api/daily-tasks?userId=${user?.id}&projectId=${data.data.projectId}&all=true`, { cache: 'no-store' });
        const dataTask = await resTask.json();

        if (dataTask.success && dataTask.data) {
          const todayStr = new Date().toISOString().split('T')[0];
          const hasToday = dataTask.data.filter((r: DailyTask) => {
            const rDate = new Date(r.tanggal).toISOString().split('T')[0];
            return rDate === todayStr;
          });
          setTodayTasks(hasToday);
        }
      }
    } catch {
      // ignore
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
    } catch {
      // ignore
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleClockIn = async () => {
    if (!coords || !photoFile || !user || !selectedProject) {
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan';
      toast.error('Gagal Absen', { description: msg });
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan';
      toast.error('Peringatan Absen Pulang', {
        description: msg,
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32 font-sans relative overflow-hidden">
        {/* M-Banking Solid Header Background */}
        <div className="absolute top-0 left-0 w-full h-[240px] bg-primary rounded-b-[40px] z-0 shadow-lg overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-blue-500/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        </div>

        {/* Header Clean Light */}
        <div className="pt-6 pb-20 px-6 relative z-10">
          <div className="flex items-center mb-6">
            <button
              onClick={() => router.push('/home')}
              className="w-10 h-10 flex items-center justify-center text-white/90 hover:text-white transition-all active:scale-90 shrink-0 -ml-2"
            >
              <ArrowLeft className="w-7 h-7 stroke-[2.5px] drop-shadow-md" />
            </button>
            <h1 className="text-lg font-extrabold text-white ml-1 drop-shadow-md tracking-tight">Detail Kehadiran</h1>
          </div>
          <header className="flex justify-between items-start">
            <div>
              <p className="text-white/80 font-bold tracking-widest text-[10px] mb-1 uppercase drop-shadow-sm">Status Hari Ini</p>
              <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-md">Presensi Aktif</h1>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border shadow-sm backdrop-blur-md shrink-0 ${isClockedOut ? 'bg-white/20 border-white/30 text-white' : 'bg-white text-emerald-600 border-white/10 shadow-black/10'}`}>
              <CheckCircle2 className="w-6 h-6 stroke-[2.5px]" />
            </div>
          </header>
        </div>

        <div className="px-5 space-y-6 relative z-20 -mt-10">
          {/* Clean Receipt / Boarding Pass UI */}
          <div className="relative mx-auto max-w-sm drop-shadow-[0_15px_30px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)]">
            {/* Top Receipt */}
            <div className="bg-white dark:bg-slate-900 p-7 rounded-[32px] rounded-b-none border-0 shadow-lg shadow-slate-200/50 dark:shadow-black/20 relative overflow-hidden">
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                    <Clock className="w-3 h-3" /> Jam Masuk
                  </p>
                  <p className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">{clockInTime}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest ${isClockedOut ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                    {isClockedOut ? 'PULANG' : 'HADIR'}
                  </span>
                </div>
              </div>

              <div className="flex gap-4 items-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-inner mt-4 relative z-10">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 shrink-0 border-2 border-white dark:border-slate-700 shadow-sm">
                  <img src={todayAttendance.photoSelfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{user?.nama}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5 font-bold tracking-wide">
                    <ShieldCheck className="w-3.5 h-3.5" /> GPS Terverifikasi
                  </p>
                </div>
              </div>
            </div>

            {/* Divider (Dashed) */}
            <div className="relative w-full bg-white dark:bg-slate-900 border-x border-slate-200 dark:border-slate-800">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 bg-slate-50 dark:bg-slate-950 rounded-full -translate-x-1/2 border-r border-slate-200 dark:border-slate-800 shadow-inner z-20"></div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 bg-slate-50 dark:bg-slate-950 rounded-full translate-x-1/2 border-l border-slate-200 dark:border-slate-800 shadow-inner z-20"></div>

              <div className="px-6 py-2">
                <div className="w-full border-t-2 border-dashed border-slate-200 dark:border-slate-800"></div>
              </div>
            </div>

            {/* Bottom Receipt */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] rounded-t-none border-0 shadow-lg shadow-slate-200/50 dark:shadow-black/20 relative z-10 text-center">
              <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">ID Presensi</p>
              <p className="font-mono text-sm font-black tracking-widest text-slate-700 dark:text-slate-300">
                ATT-{String(todayAttendance.id).padStart(6, '0')}
              </p>
            </div>
          </div>

          {!isClockedOut ? (
            <div className="pt-6 space-y-4 max-w-sm mx-auto">
              <Button
                onClick={() => router.push('/tugas')}
                className="w-full h-14 rounded-[20px] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 hover:border-primary/20 hover:text-primary font-bold transition-all shadow-sm"
              >
                Buat Laporan Pekerjaan
              </Button>

              <Button
                size="lg"
                className="w-full h-14 rounded-[20px] text-base font-bold bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                disabled={isSubmitting || todayTasks.length === 0}
                onClick={handleClockOut}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
                Akhiri Sesi Kerja (Pulang)
              </Button>
              {todayTasks.length === 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-white dark:from-amber-950/30 dark:to-slate-900 text-amber-600 dark:text-amber-500 text-xs font-medium p-4 rounded-2xl border border-amber-100 dark:border-amber-900/50 flex gap-3 items-start shadow-sm">
                  <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                  <p>Anda belum mengirim laporan progres. Harap lapor target & progres pekerjaan hari ini terlebih dahulu.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center pt-8">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tercatat Pulang Pada</p>
              <p className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1">
                {new Date(todayAttendance.clockOut!).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // === UI PRE-ABSEN (BELUM ABSEN) ===
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-40 font-sans relative overflow-hidden">
      {/* M-Banking Solid Header Background */}
      <div className="absolute top-0 left-0 w-full h-[240px] bg-primary rounded-b-[40px] z-0 shadow-lg overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-blue-500/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
      </div>

      {/* Header Clean Light */}
      <div className="pt-6 pb-20 px-6 relative z-10">
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.push('/home')}
            className="w-10 h-10 flex items-center justify-center text-white/90 hover:text-white transition-all active:scale-90 shrink-0 -ml-2"
          >
            <ArrowLeft className="w-7 h-7 stroke-[2.5px] drop-shadow-md" />
          </button>
          <h1 className="text-lg font-extrabold text-white ml-1 drop-shadow-md tracking-tight">Absen Masuk</h1>
        </div>
        <header className="flex justify-between items-start">
          <div>
            <p className="text-white/80 font-bold tracking-widest text-[10px] mb-1 uppercase drop-shadow-sm">Mulai Sesi Kerja</p>
            <p className="text-white font-medium text-xs leading-relaxed max-w-[240px] mt-1 drop-shadow-sm">
              Pastikan Anda berada di lokasi proyek dan wajah terlihat jelas.
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white shadow-sm shrink-0">
            <Navigation className="w-5 h-5 stroke-[2.5px]" />
          </div>
        </header>
      </div>

      <div className="px-5 space-y-5 relative z-20 -mt-10">
        {/* Project Selector Card */}
        <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-black/30 bg-white dark:bg-slate-900 rounded-[28px] overflow-hidden relative">
          <CardContent className="p-6 relative z-10">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Lokasi Proyek
                </Label>
              </div>

              {isLoadingProjects ? (
                <div className="h-12 rounded-xl bg-slate-100/50 flex items-center px-4 animate-pulse border border-slate-100">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                </div>
              ) : (
                <Select value={selectedProjectId} onValueChange={v => setSelectedProjectId(v || '')}>
                  <SelectTrigger className="h-12 text-sm px-4 font-semibold border-slate-200 dark:border-slate-800 rounded-xl focus:ring-primary/30 bg-slate-50 dark:bg-slate-950/50 shadow-inner">
                    <div className="flex-1 text-left truncate">
                      {selectedProject ? selectedProject.namaProyek : <span className="text-slate-400 font-normal">Pilih proyek tempat bekerja...</span>}
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {projects.map(p => (
                      <SelectItem key={p.id} value={String(p.id)} className="font-medium py-2.5 text-sm">{p.namaProyek}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Map & Geofence Visualizer */}
            {selectedProject && (
              <div className="pt-5 animate-in zoom-in-95 duration-500">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Map className="w-3.5 h-3.5" /> Radar Geofence
                  </span>
                  {coords ? (
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${isWithinRadius ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                      {isWithinRadius ? 'Dalam Area' : `${Math.round(distance)}m (Luar)`}
                    </span>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={getLocation} disabled={isLoadingGps} className="h-6 text-[9px] font-bold text-slate-400 hover:text-primary px-0">
                      <RefreshCcw className={`w-3 h-3 mr-1.5 ${isLoadingGps ? 'animate-spin' : ''}`} /> Muat GPS
                    </Button>
                  )}
                </div>
                <div className="rounded-[20px] overflow-hidden border-2 border-slate-100 dark:border-slate-800 relative z-0 shadow-inner">
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

        {/* Camera View */}
        {selectedProject && (
          <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-black/30 bg-white dark:bg-slate-900 rounded-[28px] overflow-hidden relative">
            <CardContent className="p-6 relative z-10">
              <div className="flex justify-between items-end mb-3">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" /> Bukti Kehadiran
                </Label>
              </div>

              <div className={`relative aspect-[3/4] w-full max-w-sm mx-auto overflow-hidden rounded-[24px] bg-slate-950 transition-all duration-300 shadow-inner ${photoUrl ? 'border-[3px] border-emerald-500 shadow-emerald-500/20' : 'border-2 border-slate-100 dark:border-slate-800'}`}>
                {!photoUrl ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ transform: 'scaleX(-1)' }}
                    />

                    {!isStreaming && !camError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}

                    {camError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-slate-950/90 backdrop-blur-sm">
                        <Camera className="w-10 h-10 mb-3 text-rose-500 opacity-80" />
                        <p className="text-xs font-medium">{camError}</p>
                        <Button variant="outline" size="sm" className="mt-4 rounded-lg border-white/20 hover:bg-white/10 bg-transparent text-white" onClick={startCamera}>Coba Lagi</Button>
                      </div>
                    )}

                    {/* Minimal Shutter Button */}
                    {isStreaming && (
                      <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20">
                        <button
                          onClick={takePhoto}
                          className="w-16 h-16 rounded-full border-[3px] border-white/50 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg backdrop-blur-sm bg-white/10"
                        >
                          <div className="w-12 h-12 bg-white rounded-full shadow-inner"></div>
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <img src={photoUrl} alt="Selfie" className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-300" style={{ transform: 'scaleX(-1)' }} />
                    <div className="absolute bottom-5 left-0 right-0 flex justify-center z-20">
                      <Button
                        size="sm"
                        onClick={retakePhoto}
                        className="rounded-full bg-slate-900/70 backdrop-blur-md text-white border border-white/20 hover:bg-slate-900 shadow-sm font-medium px-4 h-10"
                      >
                        <RefreshCcw className="w-3.5 h-3.5 mr-2" />
                        Ulangi
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* Submit Action (Fixed at Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-white via-white to-transparent dark:from-slate-950 dark:via-slate-950 z-40 pb-safe">
        <Button
          size="lg"
          className={`w-full h-16 rounded-[20px] text-lg font-black transition-all duration-300 ${(!coords || !photoUrl || !selectedProjectId || !isWithinRadius) ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700 shadow-none' : 'bg-primary hover:bg-primary/90 shadow-[0_10px_40px_-10px_rgba(20,184,166,0.6)] hover:scale-[1.02] active:scale-95 text-white'}`}
          disabled={!coords || !photoUrl || !selectedProjectId || !isWithinRadius || isSubmitting}
          onClick={handleClockIn}
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : !isWithinRadius && selectedProject && coords ? (
            'Di Luar Radius Proyek'
          ) : (
            <>
              Absen Masuk <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
