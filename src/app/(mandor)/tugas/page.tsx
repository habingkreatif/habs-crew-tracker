'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Camera, CheckSquare, Loader2, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCamera } from '@/hooks/useCamera';

export default function TugasPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [task, setTask] = useState<any>(null);

  // Form states
  const [namaPekerjaan, setNamaPekerjaan] = useState('');
  const [progress, setProgress] = useState<number[]>([0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Camera hooks
  const { videoRef, photoUrl, photoFile, startCamera, takePhoto, retakePhoto, isStreaming, error: camError } = useCamera();
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    if (user) {
      fetchInitialData();
    }
  }, [user]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);

      // 1. Dapatkan Absen Hari Ini (Untuk tahu Project ID)
      const resAtt = await fetch(`/api/attendance/today?userId=${user?.id}`);
      const dataAtt = await resAtt.json();

      if (dataAtt.success && dataAtt.data) {
        setTodayAttendance(dataAtt.data);

        // 2. Dapatkan Task Hari Ini
        const resTask = await fetch(`/api/daily-tasks?userId=${user?.id}&projectId=${dataAtt.data.projectId}`);
        const dataTask = await resTask.json();

        if (dataTask.success && dataTask.data && dataTask.data.length > 0) {
          // Ambil task pertama (MVP 1 user 1 task per hari)
          const currentTask = dataTask.data[0];
          setTask(currentTask);
          setProgress([currentTask.progressPercentage ?? 0]);
        }
      }
    } catch (err) {
      console.error('Gagal fetch data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPekerjaan || !user || !todayAttendance) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/daily-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          projectId: todayAttendance.projectId,
          namaPekerjaan,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || 'Gagal membuat laporan');

      toast.success('Target Pekerjaan Dibuat', { description: 'Selamat bekerja!' });
      setTask(data.data);
    } catch (err: any) {
      toast.error('Gagal', { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProgress = async () => {
    if (!task) return;
    setIsSubmitting(true);

    const formData = new FormData();
    const progressVal = progress && progress.length > 0 && progress[0] !== undefined ? progress[0] : 0;
    formData.append('progressPercentage', String(progressVal));

    if (photoFile) {
      formData.append('photo', photoFile);
    }

    try {
      const res = await fetch(`/api/daily-tasks/${task.id}/progress`, {
        method: 'POST', // Walau namanya update, Next.js route di setup pakai POST via FormData
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || 'Gagal update progress');

      const updatedProgress = data.data.progressPercentage;
      toast.success('Progres Diperbarui', { description: `Progres saat ini: ${updatedProgress}%` });
      setTask(data.data);
      setProgress([updatedProgress]);
      setShowCamera(false);
    } catch (err: any) {
      toast.error('Gagal', { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCamera = () => {
    if (!showCamera) {
      setShowCamera(true);
      startCamera();
    } else {
      setShowCamera(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!todayAttendance) {
    return (
      <div className="p-4 space-y-6 flex flex-col items-center justify-center h-[80vh] text-center">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
          <CheckSquare className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold">Kamu belum Absen Masuk</h2>
        <p className="text-slate-500 text-sm">
          Silakan absen masuk terlebih dahulu di menu Absen agar sistem mengetahui lokasi proyekmu hari ini.
        </p>
        <Button onClick={() => router.push('/absen')} className="mt-4">Ke Halaman Absen</Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 animate-in-up pb-24">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Laporan Harian</h1>
        <p className="text-sm text-slate-500">
          Catat target pagi dan laporkan progres sore hari.
        </p>
      </header>

      {!task ? (
        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
          <form onSubmit={handleCreateTask}>
            <CardHeader>
              <CardTitle className="text-lg">Target Pekerjaan Pagi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="namaPekerjaan">Pekerjaan Utama Hari Ini</Label>
                <Input
                  id="namaPekerjaan"
                  required
                  placeholder="Misal: Pasang bata merah lantai 2"
                  value={namaPekerjaan}
                  onChange={(e) => setNamaPekerjaan(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Kunci Target Pekerjaan
              </Button>
            </CardContent>
          </form>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-2">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Target Hari Ini</p>
              <CardTitle className="text-lg">{task.namaPekerjaan}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-sm font-semibold">Progres Pekerjaan</Label>
                    <span className="text-lg font-bold text-primary">{progress[0]}%</span>
                  </div>
                  <Slider
                    value={progress}
                    onValueChange={(val: any) => setProgress(Array.isArray(val) ? val : [val])}
                    max={100}
                    step={25}
                    className="py-2"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-2 px-1">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Foto Hasil Kerja (Wajib saat 100%)</Label>

                  {!showCamera && !task.photoProgresUrl && (
                    <Button variant="outline" className="w-full h-24 border-dashed" onClick={handleToggleCamera}>
                      <Camera className="w-6 h-6 mr-2 text-slate-400" />
                      <span className="text-slate-500">Ambil Foto Lapangan</span>
                    </Button>
                  )}

                  {task.photoProgresUrl && !showCamera && (
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200">
                      <img src={task.photoProgresUrl} alt="Progres" className="w-full h-full object-cover" />
                      <Button size="sm" variant="secondary" className="absolute bottom-2 right-2" onClick={handleToggleCamera}>
                        Ganti Foto
                      </Button>
                    </div>
                  )}

                  {showCamera && (
                    <div className="space-y-3">
                      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black border border-slate-200">
                        {!photoUrl ? (
                          <>
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                            {camError && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white bg-black/80">
                                <p className="text-sm mb-2">{camError}</p>
                                <Button variant="secondary" size="sm" onClick={startCamera}>Coba Lagi</Button>
                              </div>
                            )}
                          </>
                        ) : (
                          <img src={photoUrl} alt="Hasil" className="w-full h-full object-cover" />
                        )}
                      </div>

                      <div className="flex gap-2">
                        {!photoUrl ? (
                          <Button className="flex-1" onClick={takePhoto} disabled={!isStreaming}>Ambil Foto</Button>
                        ) : (
                          <Button className="flex-1" variant="outline" onClick={retakePhoto}>Foto Ulang</Button>
                        )}
                        <Button variant="ghost" onClick={handleToggleCamera}>Batal</Button>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  size="lg"
                  className="w-full h-12"
                  disabled={isSubmitting || (progress[0] === 100 && !photoUrl && !task.photoProgresUrl)}
                  onClick={handleUpdateProgress}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Update Laporan Progres
                </Button>
                {progress[0] === 100 && !photoUrl && !task.photoProgresUrl && (
                  <p className="text-xs text-center text-rose-500 mt-2">
                    *Foto lapangan wajib dilampirkan untuk progres 100%
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
