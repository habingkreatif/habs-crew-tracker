'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Camera, CheckSquare, Loader2, RefreshCcw, X, Send, Clock, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCamera } from '@/hooks/useCamera';

export default function TugasPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // History of reports today
  const [reports, setReports] = useState<any[]>([]);

  // Single form state
  const [namaPekerjaan, setNamaPekerjaan] = useState('');
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Camera state
  const { videoRef, photoUrl, photoFile, startCamera, stopCamera, takePhoto, retakePhoto, isStreaming, error: camError } = useCamera('environment');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [confirmedPhotoUrl, setConfirmedPhotoUrl] = useState<string | null>(null);
  const [confirmedPhotoFile, setConfirmedPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) {
      fetchInitialData();
    }
  }, [user]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);

      const resAtt = await fetch(`/api/attendance/today?userId=${user?.id}`, { cache: 'no-store' });
      const dataAtt = await resAtt.json();

      if (dataAtt.success && dataAtt.data) {
        setTodayAttendance(dataAtt.data);

        // Ambil riwayat tugas hari ini
        const resTask = await fetch(`/api/daily-tasks?userId=${user?.id}&projectId=${dataAtt.data.projectId}`, { cache: 'no-store' });
        const dataTask = await resTask.json();

        if (dataTask.success && dataTask.data) {
          // Sort terbaru di atas
          setReports(dataTask.data.sort((a: any, b: any) => b.id - a.id));
        }
      }
    } catch (err) {
      console.error('Gagal fetch data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenActiveCamera = () => {
    setIsCameraOpen(true);
    startCamera();
  };

  const handleCloseActiveCamera = () => {
    stopCamera();
    setIsCameraOpen(false);
  };

  const handleConfirmPhoto = () => {
    if (photoFile && photoUrl) {
      setConfirmedPhotoFile(photoFile);
      setConfirmedPhotoUrl(photoUrl);
      handleCloseActiveCamera();
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPekerjaan || !user || !todayAttendance) return;

    // Validasi wajib foto jika progres > 0
    if (progress > 0 && !confirmedPhotoFile) {
      toast.error('Foto Wajib Dilampirkan', { description: 'Sertakan bukti visual lapangan untuk progres lebih dari 0%.' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: Create the Task (Target)
      const resCreate = await fetch('/api/daily-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          projectId: todayAttendance.projectId,
          namaPekerjaan,
        }),
      });

      const dataCreate = await resCreate.json();
      if (!resCreate.ok || !dataCreate.success) throw new Error(dataCreate.error?.message || 'Gagal membuat laporan');

      const newTaskId = dataCreate.data.id;

      // Step 2: Upload Progress & Photo in one go
      const formData = new FormData();
      formData.append('progressPercentage', String(progress));
      if (confirmedPhotoFile) {
        formData.append('photo', confirmedPhotoFile);
      }

      const resProgress = await fetch(`/api/daily-tasks/${newTaskId}/progress`, {
        method: 'POST',
        body: formData,
      });

      const dataProgress = await resProgress.json();
      if (!resProgress.ok || !dataProgress.success) throw new Error(dataProgress.error?.message || 'Gagal menyimpan foto/progres');

      toast.success('Laporan Berhasil Terkirim!', { description: 'Mantap! Tetap semangat dan utamakan keselamatan.' });

      // Update history list and reset form
      setReports(prev => [dataProgress.data, ...prev]);
      setNamaPekerjaan('');
      setProgress(0);
      setConfirmedPhotoFile(null);
      setConfirmedPhotoUrl(null);

    } catch (err: any) {
      toast.error('Gagal Mengirim Laporan', { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!todayAttendance) {
    return (
      <div className="p-5 space-y-6 flex flex-col items-center justify-center h-[80vh] text-center animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4 shadow-xl shadow-rose-500/20">
          <CheckSquare className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Belum Absen Masuk</h2>
        <p className="text-slate-500 font-medium max-w-[280px]">
          Anda harus melakukan absen masuk terlebih dahulu sebelum dapat mengirim laporan pekerjaan.
        </p>
        <Button size="lg" onClick={() => router.push('/absen')} className="mt-6 rounded-2xl px-8 h-14 font-bold shadow-lg shadow-primary/30">
          Ke Halaman Absen
        </Button>
      </div>
    );
  }

  const isDone = progress === 100;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">
      {/* Header Premium Clean */}
      <div className="relative pt-12 pb-14 px-6 bg-white dark:bg-black rounded-b-[40px] shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] translate-x-1/2 -translate-y-1/4 pointer-events-none"></div>

        <header className="relative z-10 flex justify-between items-center">
          <div>
            <p className="text-primary font-bold tracking-widest text-[10px] mb-1.5 uppercase">Aktivitas Lapangan</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Kirim Laporan</h1>
          </div>
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-800">
            <Send className="w-5 h-5 text-slate-500" />
          </div>
        </header>
      </div>

      <div className="px-5 -mt-6 relative z-20 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* ONE-STEP REPORT FORM */}
        <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-black/50 bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden">
          <form onSubmit={handleSubmitReport}>
            <CardContent className="p-6 space-y-8">

              {/* 1. Deskripsi */}
              <div className="space-y-3">
                <Label htmlFor="namaPekerjaan" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">1. Aktivitas Apa Saja?</Label>
                <Input
                  id="namaPekerjaan"
                  required
                  className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-base px-5 focus-visible:ring-primary/30 font-medium"
                  placeholder="Contoh: Pasang bata dinding lantai 2"
                  value={namaPekerjaan}
                  onChange={(e) => setNamaPekerjaan(e.target.value)}
                />
              </div>

              {/* 2. Progres */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">2. Estimasi Selesai</Label>
                  <div className={`text-3xl font-black tracking-tighter drop-shadow-sm transition-colors duration-500 ${isDone ? 'text-emerald-500' : 'text-primary'}`}>{progress}<span className="text-lg text-slate-400 ml-0.5">%</span></div>
                </div>
                <Slider
                  value={[progress]}
                  onValueChange={(val: any) => setProgress(Array.isArray(val) ? val[0] : (val?.value?.[0] ?? val))}
                  max={100}
                  step={5}
                  className={`py-2 transition-all duration-500 ${isDone ? '[&>span:first-child]:bg-emerald-500 [&_[role=slider]]:bg-emerald-500 [&_[role=slider]]:border-emerald-500' : '[&>span:first-child]:bg-primary [&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary'}`}
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-300 dark:text-slate-600 px-1">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span className={isDone ? 'text-emerald-500' : 'text-slate-400'}>100%</span>
                </div>
              </div>

              {/* 3. Kamera */}
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  3. Bukti Visual {progress > 0 && <span className="text-rose-500">*Wajib</span>}
                </Label>

                {!confirmedPhotoUrl ? (
                  <Button type="button" variant="outline" className={`w-full h-24 rounded-3xl border-2 border-dashed transition-all group ${progress > 0 ? 'border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary' : 'border-slate-200 dark:border-slate-800 text-slate-400'}`} onClick={handleOpenActiveCamera}>
                    <div className="flex flex-col items-center gap-2 group-hover:scale-105 transition-transform">
                      <Camera className="w-6 h-6" />
                      <span className="font-bold text-xs">Ketuk untuk Ambil Foto</span>
                    </div>
                  </Button>
                ) : (
                  <div className="relative aspect-video rounded-3xl overflow-hidden shadow-md border-4 border-slate-100 dark:border-slate-800 group">
                    <img src={confirmedPhotoUrl} alt="Progres" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <Button type="button" size="sm" variant="secondary" className="rounded-full font-bold shadow-xl bg-white text-slate-900" onClick={handleOpenActiveCamera}>
                        <RefreshCcw className="w-4 h-4 mr-2" /> Ganti
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full h-14 rounded-2xl font-bold text-base bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-900/20 active:scale-95 transition-all mt-4"
                disabled={isSubmitting || (progress > 0 && !confirmedPhotoFile) || !namaPekerjaan}
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Kirim Laporan Sekarang
              </Button>
            </CardContent>
          </form>
        </Card>

        {/* HISTORY SECTION */}
        {reports.length > 0 && (
          <div className="pt-6 space-y-4">
            <div className="flex items-center gap-2 px-2">
              <Clock className="w-5 h-5 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Riwayat Laporan Hari Ini</h3>
            </div>
            <div className="space-y-3">
              {reports.map((report) => (
                <Card key={report.id} className="border border-slate-100 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm shadow-sm rounded-[24px] overflow-hidden">
                  <CardContent className="p-4 flex gap-4 items-center">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 relative">
                      {report.photoProgresUrl ? (
                        <img src={report.photoProgresUrl} alt="History" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-200 line-clamp-1">{report.namaPekerjaan}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{new Date(report.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-[10px] font-black tracking-wider ${report.progressPercentage === 100 ? 'bg-emerald-100 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
                        {report.progressPercentage ?? 0}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* GLOBAL CAMERA MODAL */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-300">
          <div className="absolute top-0 left-0 right-0 p-4 pt-safe flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10">
            <span className="text-white font-bold text-sm drop-shadow-md">Kamera Lapangan</span>
            <Button type="button" variant="ghost" size="icon" onClick={handleCloseActiveCamera} className="text-white hover:bg-white/20 rounded-full">
              <X className="w-6 h-6" />
            </Button>
          </div>

          <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
            {!photoUrl ? (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute inset-0 pointer-events-none p-4 pb-32">
                  <div className="w-full h-full border-2 border-white/30 rounded-3xl grid grid-cols-3 grid-rows-3 overflow-hidden">
                    <div className="border-r border-b border-white/20"></div><div className="border-r border-b border-white/20"></div><div className="border-b border-white/20"></div>
                    <div className="border-r border-b border-white/20"></div><div className="border-r border-b border-white/20"></div><div className="border-b border-white/20"></div>
                    <div className="border-r border-white/20"></div><div className="border-r border-white/20"></div><div></div>
                  </div>
                </div>
                {!isStreaming && !camError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                  </div>
                )}
                {camError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-white bg-black">
                    <Camera className="w-16 h-16 mb-4 text-rose-500" />
                    <p className="font-bold">{camError}</p>
                    <Button type="button" variant="outline" className="mt-6 rounded-full px-8 border-white/30" onClick={startCamera}>Coba Lagi</Button>
                  </div>
                )}
              </>
            ) : (
              <img src={photoUrl} alt="Preview" className="w-full h-full object-contain" />
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-8 pb-safe-offset-8 bg-gradient-to-t from-black via-black/80 to-transparent flex justify-center items-center gap-8">
            {!photoUrl ? (
              <button
                type="button"
                onClick={takePhoto}
                disabled={!isStreaming}
                className="w-20 h-20 rounded-full border-[6px] border-white/50 flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                <div className="w-14 h-14 bg-white rounded-full"></div>
              </button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={retakePhoto} className="rounded-full bg-white/10 border-white/20 text-white hover:bg-white/30 w-32 h-14 font-bold">
                  Ulangi
                </Button>
                <Button type="button" onClick={handleConfirmPhoto} className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white w-32 h-14 font-bold shadow-lg shadow-emerald-500/50">
                  Gunakan Foto
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
