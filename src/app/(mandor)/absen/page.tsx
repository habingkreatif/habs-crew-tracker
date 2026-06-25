'use client';

import { useEffect, useState } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useCamera } from '@/hooks/useCamera';
import dynamic from 'next/dynamic';

// Import map secara dinamis (tanpa SSR) karena Leaflet menggunakan window
const MapComponent = dynamic(() => import('@/components/MapComponent'), { 
  ssr: false,
  loading: () => <div className="h-[250px] w-full rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center text-slate-400">Memuat Peta...</div>
});
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Camera, MapPin, MapPinOff, RefreshCcw, Loader2, Building2, CheckCircle2, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

      const clockInDate = new Date(data.data.clockIn);
      const targetTime = new Date(clockInDate);
      targetTime.setHours(8, 0, 0, 0);

      const diffMs = clockInDate.getTime() - targetTime.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);

      let timeMessage = '';
      let timeColor = '';
      if (diffMinutes <= 0) {
        timeMessage = `Tepat Waktu! (Lebih awal ${Math.abs(diffMinutes)} menit)`;
        timeColor = 'text-emerald-500';
      } else {
        const hours = Math.floor(diffMinutes / 60);
        const mins = diffMinutes % 60;
        timeMessage = `Terlambat ${hours > 0 ? `${hours} jam ` : ''}${mins} menit.`;
        timeColor = 'text-rose-500';
      }

      toast.success('Absen Masuk Berhasil', { 
        description: (
          <div className="flex flex-col mt-1">
            <span className="text-slate-500">Selamat bekerja!</span>
            <span className={`${timeColor} font-bold mt-1`}>{timeMessage}</span>
          </div>
        ) as any
      });
      setTodayAttendance(data.data); // Update UI ke state sudah absen
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

      toast.success('Absen Pulang Berhasil', { description: 'Terima kasih atas kerja keras hari ini!' });
      setTodayAttendance(data.data);
    } catch (err: any) {
      // Alert yang diminta oleh user
      toast.error('Peringatan Absen Pulang', {
        description: err.message,
        duration: 8000 // Tampilkan lebih lama agar mandor bisa baca
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

  // JIKA SUDAH ABSEN MASUK
  if (todayAttendance) {
    const clockInTime = new Date(todayAttendance.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const isClockedOut = !!todayAttendance.clockOut;

    return (
      <div className="p-4 space-y-6 animate-in-up pb-24">
        <header className="text-center pt-8">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isClockedOut ? 'Selesai Bekerja' : 'Sedang Bekerja'}
          </h1>
          <p className="text-slate-500 mt-2">
            Kamu absen masuk pada pukul <strong className="text-slate-900 dark:text-white">{clockInTime}</strong>
          </p>
        </header>

        {!isClockedOut && (
          <Card className="border border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-900/20 shadow-none">
            <CardContent className="p-4 text-center space-y-3 text-sm text-blue-800 dark:text-blue-300">
              <p>Jangan lupa untuk memperbarui progres laporan harian sebelum pulang.</p>
              <Button
                onClick={() => router.push('/tugas')}
                variant="outline"
                className="w-full bg-white dark:bg-slate-950 border-blue-200"
              >
                Ke Halaman Laporan (Tugas)
              </Button>
            </CardContent>
          </Card>
        )}

        {isClockedOut ? (
          <div className="text-center text-sm text-slate-500 pt-8">
            <p>Absen pulang tercatat pada:</p>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {new Date(todayAttendance.clockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        ) : (
          <div className="pt-8">
            <Button
              size="lg"
              variant="destructive"
              className="w-full h-14 rounded-xl text-lg font-semibold shadow-rose-500/25 shadow-lg"
              disabled={isSubmitting}
              onClick={handleClockOut}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <LogOut className="w-5 h-5 mr-2" />
              )}
              Absen Pulang
            </Button>
            <p className="text-xs text-center text-slate-500 mt-3">
              *Syarat absen pulang: Laporan progres harian &gt; 0%
            </p>
          </div>
        )}
      </div>
    );
  }

  // JIKA BELUM ABSEN MASUK
  return (
    <div className="p-4 space-y-6 animate-in-up pb-24">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Absen Masuk</h1>
        <p className="text-sm text-slate-500">Pilih proyek, ambil selfie, dan pastikan lokasi sesuai.</p>
      </header>

      {/* Project Selector */}
      <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold mb-1">Lokasi Proyek</p>
              {isLoadingProjects ? (
                <p className="text-xs text-slate-500">Memuat data proyek...</p>
              ) : (
                <Select value={selectedProjectId} onValueChange={v => setSelectedProjectId(v || '')}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Pilih Proyek" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.namaProyek}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
            
          {/* Visualisasi Peta Geofence */}
          {selectedProject && (
            <div className="pt-2">
              <MapComponent 
                projectLat={selectedProject.latitude}
                projectLng={selectedProject.longitude}
                projectRadius={selectedProject.radiusMeter}
                userLat={coords?.latitude || null}
                userLng={coords?.longitude || null}
                projectName={selectedProject.namaProyek}
              />
              
              <div className="mt-2 text-xs text-center text-slate-500 flex justify-center items-center gap-4">
                <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500/30 border border-green-600"></div> Area Proyek</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Lokasi Anda</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* GPS Status Card */}
      <Card className="border-0 shadow-sm bg-slate-100/50 dark:bg-slate-900/50">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${coords ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
              {coords ? <MapPin className="w-5 h-5" /> : <MapPinOff className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-sm font-semibold">Status Lokasi (GPS)</p>
              <p className="text-xs text-slate-500">
                {isLoadingGps ? 'Mencari sinyal GPS...' : coords ? `Akurasi: Math.round(coords.accuracy)m` : gpsError || 'Gagal mendapatkan lokasi'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={getLocation} disabled={isLoadingGps} className="text-slate-500">
            <RefreshCcw className={`w-4 h-4 ${isLoadingGps ? 'animate-spin' : ''}`} />
          </Button>
        </CardContent>
      </Card>

      {/* Camera View */}
      <div className="space-y-3">
        <div className="relative aspect-[3/4] w-full max-w-sm mx-auto overflow-hidden rounded-2xl bg-black shadow-lg border-4 border-slate-200 dark:border-slate-800">
          {!photoUrl ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!isStreaming && !camError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
              {camError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-black/80">
                  <Camera className="w-10 h-10 mb-2 text-rose-500" />
                  <p className="text-sm">{camError}</p>
                  <Button variant="secondary" className="mt-4" onClick={startCamera}>Coba Lagi</Button>
                </div>
              )}
            </>
          ) : (
            <img src={photoUrl} alt="Selfie" className="w-full h-full object-cover" />
          )}
        </div>

        <div className="flex justify-center pt-2">
          {!photoUrl ? (
            <Button
              size="lg"
              className="rounded-full w-16 h-16 bg-white hover:bg-slate-200 text-black shadow-xl"
              onClick={takePhoto}
              disabled={!isStreaming}
            >
              <Camera className="w-8 h-8" />
            </Button>
          ) : (
            <Button variant="outline" onClick={retakePhoto} className="w-full max-w-sm rounded-xl h-12">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Foto Ulang
            </Button>
          )}
        </div>
      </div>

      {/* Submit Action */}
      <div className="pt-4">
        <Button
          size="lg"
          className="w-full h-14 rounded-xl text-lg font-semibold shadow-primary/25 shadow-lg"
          disabled={!coords || !photoUrl || !selectedProjectId || isSubmitting}
          onClick={handleClockIn}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Mencatat Absensi...
            </>
          ) : (
            'Kirim Absen Masuk'
          )}
        </Button>
      </div>
    </div>
  );
}
