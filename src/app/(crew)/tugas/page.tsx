'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Camera, CheckSquare, Loader2, RefreshCcw, X, Send, Clock, CheckCircle2, PartyPopper, ChevronDown, Sparkles, CalendarDays, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCamera } from '@/hooks/useCamera';

export default function TugasPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // All reports grouped by date
  const [allReports, setAllReports] = useState<any[]>([]);

  // Expanded history dates
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  // Single form state
  const [namaPekerjaan, setNamaPekerjaan] = useState('');
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(true);

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

        // Ambil SEMUA riwayat tugas
        const resTask = await fetch(`/api/daily-tasks?userId=${user?.id}&projectId=${dataAtt.data.projectId}&all=true`, { cache: 'no-store' });
        const dataTask = await resTask.json();

        if (dataTask.success && dataTask.data) {
          setAllReports(dataTask.data);

          // Cek apakah ada laporan hari ini
          const todayStr = new Date().toISOString().split('T')[0];
          const hasToday = dataTask.data.some((r: any) => {
            const rDate = new Date(r.tanggal).toISOString().split('T')[0];
            return rDate === todayStr;
          });

          if (hasToday) {
            setShowForm(false);
          }
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

    if (progress > 0 && !confirmedPhotoFile) {
      toast.error('Foto Wajib Dilampirkan', { description: 'Sertakan bukti visual lapangan untuk progres lebih dari 0%.' });
      return;
    }

    setIsSubmitting(true);
    try {
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

      setAllReports(prev => [dataProgress.data, ...prev]);
      setNamaPekerjaan('');
      setProgress(0);
      setConfirmedPhotoFile(null);
      setConfirmedPhotoUrl(null);
      setShowForm(false);

    } catch (err: any) {
      toast.error('Gagal Mengirim Laporan', { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDate = (dateStr: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setExpandedDates(prev => {
      const isCurrentlyExpanded = prev[dateStr] ?? (dateStr === todayStr);
      return {
        ...prev,
        [dateStr]: !isCurrentlyExpanded
      };
    });
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32 font-sans relative overflow-hidden">
        {/* M-Banking Solid Header Background */}
        <div className="absolute top-0 left-0 w-full h-[250px] bg-primary rounded-b-[40px] z-0 shadow-lg overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-blue-500/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        </div>

        <div className="pt-12 pb-24 px-6 relative z-10">
          <header className="flex justify-between items-start">
            <div>
              <p className="text-white/80 font-bold tracking-widest text-[10px] mb-1 uppercase drop-shadow-sm">Aktivitas Lapangan</p>
              <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-md">Laporan Tugas</h1>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white shadow-sm">
              <CheckSquare className="w-5 h-5" />
            </div>
          </header>
        </div>

        <div className="px-5 relative z-20 -mt-16 animate-in fade-in zoom-in-95 duration-500">
          <Card className="border-0 shadow-2xl shadow-primary/20 dark:shadow-black/50 bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden relative">
            <CardContent className="p-8 space-y-6 flex flex-col items-center justify-center text-center py-12">
              <div className="w-24 h-24 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mb-2 shadow-xl shadow-rose-500/10 border border-rose-100 dark:border-rose-800/50">
                <CheckSquare className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Belum Absen Masuk</h2>
              <p className="text-slate-500 font-medium max-w-[280px]">
                Anda harus melakukan absen masuk terlebih dahulu sebelum dapat mengirim laporan pekerjaan.
              </p>
              <Button size="lg" onClick={() => router.push('/absen')} className="mt-6 rounded-2xl w-full h-14 font-bold shadow-lg shadow-primary/30 active:scale-95 transition-transform bg-primary text-white">
                Ke Halaman Absen
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isDone = progress === 100;

  // Group reports by date
  const todayStr = new Date().toISOString().split('T')[0];
  const groupedReports = allReports.reduce((acc: any, curr: any) => {
    const dStr = new Date(curr.tanggal).toISOString().split('T')[0];
    if (!acc[dStr]) acc[dStr] = [];
    acc[dStr].push(curr);
    return acc;
  }, {});

  const todayReports = groupedReports[todayStr] || [];
  const hasSubmittedToday = todayReports.length > 0;
  const has100PercentToday = todayReports.some((r: any) => r.progressPercentage === 100);

  // Sort dates descending
  const sortedDates = Object.keys(groupedReports).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32 font-sans relative overflow-hidden">
      {/* M-Banking Solid Header Background */}
      <div className="absolute top-0 left-0 w-full h-[250px] bg-primary rounded-b-[40px] z-0 shadow-lg overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-blue-500/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
      </div>

      {/* Header Clean Light */}
      <div className="pt-12 pb-24 px-6 relative z-10">
        <header className="flex justify-between items-start">
          <div>
            <p className="text-white/80 font-bold tracking-widest text-[10px] mb-1 uppercase drop-shadow-sm">Aktivitas Lapangan</p>
            <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-md">Laporan Tugas</h1>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border shadow-sm backdrop-blur-md ${hasSubmittedToday ? 'bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/50' : 'bg-white/20 border-white/30 text-white'}`}>
            {hasSubmittedToday ? <CheckCircle2 className="w-6 h-6" /> : <Send className="w-5 h-5" />}
          </div>
        </header>
      </div>

      <div className="px-5 space-y-6 relative z-20 -mt-16 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* APPRECIATION BANNER HARI INI */}
        {hasSubmittedToday && !showForm && (
          <Card className="border-0 shadow-xl shadow-emerald-500/10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-[32px] overflow-hidden text-white relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/4 pointer-events-none"></div>
            <CardContent className="p-8 text-center relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4">
                <PartyPopper className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-black mb-2">Kerja Bagus Hari Ini!</h2>
              <p className="text-emerald-50 font-medium text-sm max-w-[280px]">
                Terima kasih atas dedikasi dan kerja kerasmu di lapangan hari ini. Tetap utamakan keselamatan ya!
              </p>

              {!has100PercentToday && (
                <Button
                  variant="outline"
                  className="mt-6 rounded-full px-6 font-bold bg-white/10 border-white/20 text-white hover:bg-white/20 transition-colors"
                  onClick={() => setShowForm(true)}
                >
                  Kirim Progres Lanjutan
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* ONE-STEP REPORT FORM */}
        {(!hasSubmittedToday || showForm) && (
          <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-black/50 bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden relative">

            {hasSubmittedToday && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 z-10"
                onClick={() => setShowForm(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            )}

            <form onSubmit={handleSubmitReport}>
              <CardContent className="p-6 pt-8 space-y-8">

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
                  className={`w-full h-14 rounded-2xl font-bold text-base shadow-xl active:scale-95 transition-all mt-4 ${isDone ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 text-white' : 'bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 shadow-slate-900/20'}`}
                  disabled={isSubmitting || (progress > 0 && !confirmedPhotoFile) || !namaPekerjaan}
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : (isDone ? <Sparkles className="w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />)}
                  {isDone ? 'Kirim Laporan Final' : 'Kirim Laporan Progres'}
                </Button>
              </CardContent>
            </form>
          </Card>
        )}

        {/* ALL HISTORY SECTION (COLLAPSIBLE PER DAY) */}
        {sortedDates.length > 0 && (
          <div className="pt-8 space-y-4">
            <div className="flex items-center gap-2 px-2">
              <CalendarDays className="w-5 h-5 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Riwayat Laporan</h3>
            </div>

            <div className="space-y-4">
              {sortedDates.map((dateStr) => {
                const dayReports = groupedReports[dateStr];
                const isExpanded = expandedDates[dateStr] ?? (dateStr === todayStr); // Auto-expand today's reports by default
                const dateObj = new Date(dateStr);
                const formattedDate = dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

                return (
                  <div key={dateStr} className="space-y-2">
                    {/* Day Header */}
                    <button
                      onClick={() => toggleDate(dateStr)}
                      className="w-full flex items-center justify-between p-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-[20px] shadow-sm hover:bg-white dark:hover:bg-slate-900 transition-colors"
                    >
                      <div className="text-left">
                        <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                          {dateStr === todayStr ? 'Hari Ini' : formattedDate}
                        </p>
                        <p className="text-[10px] font-medium text-slate-500 mt-0.5">{dayReports.length} Laporan dikirim</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {/* Day Reports List (Collapsible) */}
                    {isExpanded && (
                      <div className="space-y-3 pl-2 pr-2 pb-2 animate-in slide-in-from-top-2 fade-in duration-300">
                        {dayReports.map((report: any) => (
                          <Card key={report.id} className="border-0 bg-white dark:bg-slate-900 shadow-md shadow-slate-200/50 dark:shadow-none rounded-[20px] overflow-hidden">
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
                                <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  {new Date(report.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                </p>
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
                    )}
                  </div>
                );
              })}
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
