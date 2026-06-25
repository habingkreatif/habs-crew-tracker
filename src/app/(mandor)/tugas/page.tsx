'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Camera, CheckSquare, Loader2, RefreshCcw, Plus, CheckCircle2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCamera } from '@/hooks/useCamera';

export default function TugasPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Multi-task state
  const [tasks, setTasks] = useState<any[]>([]);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [namaPekerjaan, setNamaPekerjaan] = useState('');
  const [isSubmittingNewTask, setIsSubmittingNewTask] = useState(false);

  // Per-task progress state
  const [progressMap, setProgressMap] = useState<Record<number, number>>({});
  const [isUpdatingMap, setIsUpdatingMap] = useState<Record<number, boolean>>({});

  // Camera state for a specific task
  const { videoRef, photoUrl, photoFile, startCamera, stopCamera, takePhoto, retakePhoto, isStreaming, error: camError } = useCamera('environment');
  const [activeCameraTaskId, setActiveCameraTaskId] = useState<number | null>(null);
  const [photoMap, setPhotoMap] = useState<Record<number, File | null>>({});
  const [photoUrlMap, setPhotoUrlMap] = useState<Record<number, string | null>>({});

  useEffect(() => {
    if (user) {
      fetchInitialData();
    }
  }, [user]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);

      const resAtt = await fetch(`/api/attendance/today?userId=${user?.id}`);
      const dataAtt = await resAtt.json();

      if (dataAtt.success && dataAtt.data) {
        setTodayAttendance(dataAtt.data);

        const resTask = await fetch(`/api/daily-tasks?userId=${user?.id}&projectId=${dataAtt.data.projectId}`);
        const dataTask = await resTask.json();

        if (dataTask.success && dataTask.data) {
          setTasks(dataTask.data);
          
          // Initialize progress map
          const pMap: Record<number, number> = {};
          dataTask.data.forEach((t: any) => {
            pMap[t.id] = t.progressPercentage ?? 0;
          });
          setProgressMap(pMap);
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

    setIsSubmittingNewTask(true);
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
      
      const newTask = data.data;
      setTasks(prev => [...prev, newTask]);
      setProgressMap(prev => ({ ...prev, [newTask.id]: newTask.progressPercentage ?? 0 }));
      
      setNamaPekerjaan('');
      setShowNewTaskForm(false);
    } catch (err: any) {
      toast.error('Gagal', { description: err.message });
    } finally {
      setIsSubmittingNewTask(false);
    }
  };

  const handleUpdateProgress = async (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const currentProgress = progressMap[taskId] ?? 0;
    const currentPhoto = photoMap[taskId];

    if (currentProgress > 0 && !currentPhoto && !task.photoProgresUrl) {
       toast.error('Wajib Lampirkan Foto', { description: 'Wajib melampirkan bukti foto lapangan untuk menyimpan progres.' });
       return;
    }

    setIsUpdatingMap(prev => ({ ...prev, [taskId]: true }));

    const formData = new FormData();
    formData.append('progressPercentage', String(currentProgress));

    if (currentPhoto) {
      formData.append('photo', currentPhoto);
    }

    try {
      const res = await fetch(`/api/daily-tasks/${taskId}/progress`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || 'Gagal update progress');

      const updatedProgress = data.data.progressPercentage;
      toast.success('Progres Diperbarui', { description: `Progres saat ini: ${updatedProgress}%` });
      
      // Update local task data
      setTasks(prev => prev.map(t => t.id === taskId ? data.data : t));
      
      // Clear local photo map so it uses the URL from DB
      setPhotoMap(prev => { const n = {...prev}; delete n[taskId]; return n; });
      setPhotoUrlMap(prev => { const n = {...prev}; delete n[taskId]; return n; });
      
    } catch (err: any) {
      toast.error('Gagal', { description: err.message });
    } finally {
      setIsUpdatingMap(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const handleOpenActiveCamera = (taskId: number) => {
    setActiveCameraTaskId(taskId);
    startCamera();
  };

  const handleCloseActiveCamera = () => {
    stopCamera();
    setActiveCameraTaskId(null);
  };

  const handleConfirmPhoto = () => {
    if (activeCameraTaskId && photoFile && photoUrl) {
       setPhotoMap(prev => ({ ...prev, [activeCameraTaskId]: photoFile }));
       setPhotoUrlMap(prev => ({ ...prev, [activeCameraTaskId]: photoUrl }));
       handleCloseActiveCamera();
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
        <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4 shadow-xl shadow-amber-500/20">
          <CheckSquare className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Belum Absen Masuk</h2>
        <p className="text-slate-500 font-medium max-w-[280px]">
          Sistem butuh verifikasi lokasimu sebelum bisa mengisi target pekerjaan hari ini.
        </p>
        <Button size="lg" onClick={() => router.push('/absen')} className="mt-6 rounded-full px-8 h-12 font-bold shadow-lg shadow-primary/30">
          Pergi ke Halaman Absen
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="p-5 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
        <header className="pt-4 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Laporan Harian</h1>
            <p className="text-slate-500 font-medium mt-1">
              Catat target & progres hari ini.
            </p>
          </div>
          {tasks.length > 0 && !showNewTaskForm && (
            <Button size="icon" onClick={() => setShowNewTaskForm(true)} className="rounded-full w-12 h-12 shadow-lg shadow-primary/30">
              <Plus className="w-6 h-6" />
            </Button>
          )}
        </header>

        {/* Form Tambah Task Baru */}
        {(tasks.length === 0 || showNewTaskForm) && (
          <Card className="border-0 shadow-2xl shadow-primary/10 bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden animate-in zoom-in-95 duration-300 relative">
            {tasks.length > 0 && (
              <Button variant="ghost" size="icon" onClick={() => setShowNewTaskForm(false)} className="absolute top-4 right-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 z-10">
                <X className="w-5 h-5" />
              </Button>
            )}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-blue-500"></div>
            <form onSubmit={handleCreateTask}>
              <CardHeader className="pt-8">
                <CardTitle className="text-xl font-black">Target Baru</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="namaPekerjaan" className="text-xs font-bold uppercase tracking-wider text-slate-500">Deskripsi Pekerjaan</Label>
                  <Input
                    id="namaPekerjaan"
                    required
                    className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-base px-4 focus-visible:ring-primary/20 font-medium shadow-inner"
                    placeholder="Misal: Pasang bata merah lantai 2"
                    value={namaPekerjaan}
                    onChange={(e) => setNamaPekerjaan(e.target.value)}
                  />
                </div>
                <Button type="submit" size="lg" className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all" disabled={isSubmittingNewTask}>
                  {isSubmittingNewTask ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                  Kunci Target
                </Button>
              </CardContent>
            </form>
          </Card>
        )}

        {/* List Task / Progres */}
        <div className="space-y-5">
          {tasks.map((task) => {
             const currentProgress = progressMap[task.id] ?? 0;
             const isDone = currentProgress === 100;
             const previewUrl = photoUrlMap[task.id] || task.photoProgresUrl;
             const isUpdating = isUpdatingMap[task.id];
             const isSavedDone = task.progressPercentage === 100;

             return (
               <Card key={task.id} className={`border-0 shadow-xl rounded-[32px] overflow-hidden transition-all duration-500 ${isDone ? 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-900/10 shadow-emerald-500/10' : 'bg-white dark:bg-slate-900 shadow-slate-200/50 dark:shadow-black/50'}`}>
                 <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/50 bg-white/50 dark:bg-black/20">
                   <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDone ? 'text-emerald-500' : 'text-primary'}`}>Task #{task.id}</p>
                   <CardTitle className="text-lg leading-tight text-slate-800 dark:text-slate-100">{task.namaPekerjaan}</CardTitle>
                 </CardHeader>
                 <CardContent className="pt-5 space-y-6">
                   
                   {/* Slider Section */}
                   <div>
                     <div className="flex justify-between items-center mb-4">
                       <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Progres</Label>
                       <span className={`text-2xl font-black drop-shadow-sm transition-colors duration-500 ${isDone ? 'text-emerald-500' : 'text-primary'}`}>{currentProgress}%</span>
                     </div>
                     <Slider
                       value={[currentProgress]}
                       onValueChange={(val: any) => setProgressMap(prev => ({ ...prev, [task.id]: Array.isArray(val) ? val[0] : (val?.value?.[0] ?? val) }))}
                       max={100}
                       step={25}
                       className={`py-2 transition-all duration-500 ${isDone ? '[&>span:first-child]:bg-emerald-500 [&_[role=slider]]:bg-emerald-500 [&_[role=slider]]:border-emerald-500' : ''}`}
                     />
                     <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 px-1">
                       <span>0</span>
                       <span>25</span>
                       <span>50</span>
                       <span>75</span>
                       <span className={isDone ? 'text-emerald-500' : ''}>100</span>
                     </div>
                   </div>

                   {/* Camera Section (Visible if progress > 0 or has photo) */}
                   {(currentProgress > 0 || previewUrl) && (
                     <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300">
                       <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bukti Foto</Label>
                       
                       {!previewUrl ? (
                         <Button variant="outline" className="w-full h-28 rounded-2xl border-2 border-dashed border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 transition-all group" onClick={() => handleOpenActiveCamera(task.id)}>
                           <div className="flex flex-col items-center gap-2 group-hover:scale-105 transition-transform">
                             <Camera className="w-8 h-8" />
                             <span className="font-bold text-xs uppercase tracking-wider">Buka Kamera Lapangan</span>
                           </div>
                         </Button>
                       ) : (
                         <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg border-2 border-emerald-100 dark:border-emerald-900/50 group">
                           <img src={previewUrl} alt="Progres" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <Button size="sm" variant="secondary" className="rounded-full font-bold shadow-xl" onClick={() => handleOpenActiveCamera(task.id)}>
                               <RefreshCcw className="w-4 h-4 mr-2" /> Ganti Foto
                             </Button>
                           </div>
                         </div>
                       )}
                     </div>
                   )}

                   {/* Save Button */}
                   {currentProgress !== task.progressPercentage || (previewUrl && !task.photoProgresUrl) || (photoUrlMap[task.id]) ? (
                     <Button
                       size="lg"
                       className={`w-full h-14 rounded-2xl font-bold text-lg transition-all shadow-lg hover:scale-[1.02] active:scale-95 ${isDone ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' : 'bg-primary shadow-primary/30'}`}
                       disabled={isUpdating || (currentProgress > 0 && !previewUrl)}
                       onClick={() => handleUpdateProgress(task.id)}
                     >
                       {isUpdating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                       Simpan Progres
                     </Button>
                   ) : (
                     <Button variant="outline" size="lg" disabled className="w-full h-14 rounded-2xl font-bold border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-400">
                       <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-500" /> {currentProgress === 0 ? 'Belum Ada Progres' : 'Tersimpan'}
                     </Button>
                   )}
                 </CardContent>
               </Card>
             );
          })}
        </div>
      </div>

      {/* GLOBAL CAMERA MODAL */}
      {activeCameraTaskId && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-300">
           {/* Top bar */}
           <div className="absolute top-0 left-0 right-0 p-4 pt-safe flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10">
              <span className="text-white font-bold text-sm drop-shadow-md">Kamera Lapangan</span>
              <Button variant="ghost" size="icon" onClick={handleCloseActiveCamera} className="text-white hover:bg-white/20 rounded-full">
                <X className="w-6 h-6" />
              </Button>
           </div>

           {/* Camera Feed */}
           <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
              {!photoUrl ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  
                  {/* Grid overlay */}
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
                      <Button variant="outline" className="mt-6 rounded-full px-8 border-white/30" onClick={startCamera}>Coba Lagi</Button>
                    </div>
                  )}
                </>
              ) : (
                <img src={photoUrl} alt="Preview" className="w-full h-full object-contain" />
              )}
           </div>

           {/* Bottom Bar Controls */}
           <div className="absolute bottom-0 left-0 right-0 p-8 pb-safe-offset-8 bg-gradient-to-t from-black via-black/80 to-transparent flex justify-center items-center gap-8">
              {!photoUrl ? (
                <button 
                  onClick={takePhoto}
                  disabled={!isStreaming}
                  className="w-20 h-20 rounded-full border-[6px] border-white/50 flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                   <div className="w-14 h-14 bg-white rounded-full"></div>
                </button>
              ) : (
                <>
                  <Button variant="outline" onClick={retakePhoto} className="rounded-full bg-white/10 border-white/20 text-white hover:bg-white/30 w-32 h-14 font-bold">
                     Ulangi
                  </Button>
                  <Button onClick={handleConfirmPhoto} className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white w-32 h-14 font-bold shadow-lg shadow-emerald-500/50">
                     Gunakan Foto
                  </Button>
                </>
              )}
           </div>
        </div>
      )}
    </>
  );
}
