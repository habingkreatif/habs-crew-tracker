'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LogOut, User, MapPin, CheckSquare, Clock, Loader2, PlayCircle, Building } from 'lucide-react';
import { toast } from 'sonner';

export default function MandorDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const supabase = createClient();
  
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [resToday, resHistory] = await Promise.all([
        fetch(`/api/attendance/today?userId=${user?.id}`),
        fetch(`/api/attendance/history?userId=${user?.id}`)
      ]);
      const dataToday = await resToday.json();
      const dataHistory = await resHistory.json();

      if (dataToday.success && dataToday.data) {
        setTodayAttendance(dataToday.data);
      }
      if (dataHistory.success && dataHistory.data) {
        setHistory(dataHistory.data);
      }
    } catch (err) {
      console.error('Gagal fetch data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    toast.loading('Sedang keluar...', { id: 'logout' });
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Logout network error ignored:', error);
    } finally {
      logout();
      toast.dismiss('logout');
      router.push('/login');
    }
  };

  const isClockedIn = !!todayAttendance;
  const isClockedOut = !!todayAttendance?.clockOut;

  // Journey Tracker Steps
  const steps = [
    { title: 'Absen', active: isClockedIn, completed: isClockedIn },
    { title: 'Target', active: isClockedIn && !isClockedOut, completed: isClockedOut },
    { title: 'Lapor', active: isClockedIn && !isClockedOut, completed: isClockedOut },
    { title: 'Pulang', active: isClockedOut, completed: isClockedOut },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      {/* Dynamic Header */}
      <div className="relative pt-12 pb-28 px-6 bg-gradient-to-br from-blue-600 via-primary to-indigo-700 overflow-hidden rounded-b-[40px] shadow-lg shadow-primary/20">
        <div className="absolute inset-0 bg-white/5 opacity-20 mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute top-20 -left-10 w-40 h-40 bg-blue-400 opacity-20 rounded-full blur-2xl"></div>
        
        <header className="relative flex items-center justify-between z-10">
          <div>
            <p className="text-primary-foreground/80 font-medium tracking-wide text-sm mb-1 uppercase">Selamat Bekerja,</p>
            <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-md">{user?.nama || 'Memuat...'}</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md border border-white/10 shadow-sm transition-all">
            <LogOut className="w-5 h-5" />
          </Button>
        </header>
      </div>

      {/* Main Content overlapping header */}
      <div className="px-5 -mt-20 relative z-20 space-y-6">
        
        {/* Glass ID Card */}
        <Card className="border border-white/40 dark:border-slate-800/60 shadow-xl shadow-slate-200/50 dark:shadow-black/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl rounded-3xl overflow-hidden">
          <CardContent className="p-0">
            <div className="p-5 flex items-center gap-4 border-b border-white/50 dark:border-slate-800/50">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-blue-400 p-0.5 shadow-md">
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Jabatan / Peran</p>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{user?.role || 'MANDOR'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Status</p>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary inline-block" />
                ) : (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isClockedIn && !isClockedOut ? 'bg-emerald-100 text-emerald-700 shadow-sm shadow-emerald-200' : isClockedOut ? 'bg-blue-100 text-blue-700 shadow-sm shadow-blue-200' : 'bg-slate-100 text-slate-600'}`}>
                    {isClockedIn && !isClockedOut ? 'Aktif' : isClockedOut ? 'Selesai' : 'Belum Absen'}
                  </span>
                )}
              </div>
            </div>

            {/* Daily Journey Tracker */}
            <div className="p-5 bg-white/40 dark:bg-slate-900/40 relative">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-5 text-center">Perjalanan Hari Ini</p>
              <div className="flex justify-between items-center relative px-2">
                {/* Connecting Line */}
                <div className="absolute left-6 right-6 top-1/2 -translate-y-[14px] h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full -z-10 overflow-hidden">
                   <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" style={{ width: isClockedOut ? '100%' : isClockedIn ? '50%' : '0%' }}></div>
                </div>

                {steps.map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2 z-10 w-12">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm ${step.completed ? 'bg-primary text-white scale-110 shadow-primary/30' : step.active ? 'bg-white dark:bg-slate-800 border-2 border-primary text-primary scale-110 shadow-md' : 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-300'}`}>
                      {step.completed ? <CheckSquare className="w-4 h-4" /> : <div className={`w-2 h-2 rounded-full ${step.active ? 'bg-primary animate-pulse' : 'bg-slate-200 dark:bg-slate-700'}`}></div>}
                    </div>
                    <span className={`text-[9px] uppercase tracking-wider font-bold transition-colors duration-300 ${step.active || step.completed ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>{step.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-4 pt-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 px-1">
            <PlayCircle className="w-5 h-5 text-primary" />
            Tindakan Cepat
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-32 flex flex-col items-center justify-center gap-3 rounded-[24px] bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200/60 dark:border-slate-800 shadow-lg shadow-slate-200/40 dark:shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all"
              onClick={() => router.push('/absen')}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${isClockedIn ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                <MapPin className="w-7 h-7" />
              </div>
              <span className="font-bold text-xs text-slate-700 dark:text-slate-300">{isClockedIn ? 'Menu Absen' : 'Absen Masuk'}</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-32 flex flex-col items-center justify-center gap-3 rounded-[24px] bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200/60 dark:border-slate-800 shadow-lg shadow-slate-200/40 dark:shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all"
              onClick={() => router.push('/tugas')}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner bg-blue-100 text-blue-600">
                <CheckSquare className="w-7 h-7" />
              </div>
              <span className="font-bold text-xs text-slate-700 dark:text-slate-300">Target & Laporan</span>
            </Button>
          </div>
        </div>

         {/* Proyek Aktif Info */}
         <div className="pt-2">
            <Card className="border-0 shadow-xl shadow-slate-900/20 bg-slate-900 text-white rounded-3xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl -ml-10 -mb-10"></div>
              <CardContent className="p-6 relative z-10">
                 <div className="flex justify-between items-start mb-5">
                   <div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Lokasi Proyek Aktif</p>
                     <h3 className="font-bold text-lg leading-tight text-white">{todayAttendance?.project?.namaProyek || 'Belum Terpilih'}</h3>
                   </div>
                   <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                     <Building className="w-5 h-5 text-blue-300" />
                   </div>
                 </div>
                 <div className="flex items-center gap-2 text-xs font-medium text-slate-300 bg-white/5 w-fit px-3 py-1.5 rounded-full border border-white/5">
                    <Clock className="w-4 h-4 text-amber-300" />
                    <span>Jam Kerja: {todayAttendance?.project?.jamKerjaMulai || '08:00'} - {todayAttendance?.project?.jamKerjaSelesai || '17:00'}</span>
                 </div>
              </CardContent>
            </Card>
         </div>

         {/* Riwayat Absen */}
         <div className="pt-4 pb-6 space-y-4">
           <div className="flex justify-between items-center px-1">
             <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
               <Clock className="w-5 h-5 text-primary" />
               Riwayat (7 Hari)
             </h3>
             <Button variant="link" size="sm" className="text-xs font-bold text-primary px-0" onClick={() => router.push('/riwayat')}>Lihat Semua</Button>
           </div>
           <div className="space-y-3">
             {history.length === 0 && !isLoading && (
               <p className="text-xs text-center text-slate-500 font-medium py-4">Belum ada riwayat kehadiran.</p>
             )}
             {history.map((record: any) => (
               <Card key={record.id} className="border-0 shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
                 <CardContent className="p-4 flex items-center justify-between">
                   <div>
                     <p className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">
                       {new Date(record.clockIn).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                     </p>
                     <p className="text-xs text-slate-500 line-clamp-1">{record.namaProyek || 'Proyek Lapangan'}</p>
                   </div>
                   <div className="text-right flex flex-col gap-1">
                     <div className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full w-fit ml-auto">
                        In: {new Date(record.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                     </div>
                     {record.clockOut ? (
                       <div className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full w-fit ml-auto">
                          Out: {new Date(record.clockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                       </div>
                     ) : (
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right pr-1">
                         BELUM PULANG
                       </div>
                     )}
                   </div>
                 </CardContent>
               </Card>
             ))}
           </div>
         </div>

      </div>
    </div>
  );
}
