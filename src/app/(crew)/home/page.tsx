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

  // Kalkulasi Sapaan dan Tanggal
  const hour = new Date().getHours();
  const greeting = hour < 11 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam';
  const currentDate = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Motivasi Harian
  const quotes = [
    "Kerja keras hari ini, panen esok hari.",
    "Utamakan keselamatan, keluarga menanti di rumah.",
    "Satu bata pada satu waktu membangun istana.",
    "Teliti dalam kerja, bangga dengan hasilnya.",
    "Pantang pulang sebelum target tercapai.",
    "Kualitas bangunan cerminan kualitas diri.",
    "Semangat pantang menyerah adalah kunci sukses."
  ];
  const todayIndex = new Date().getDate() % quotes.length;
  const quote = quotes[todayIndex];

  // Kalkulasi Keterlambatan
  let latenessText = '';
  let latenessColor = '';

  if (isClockedIn && todayAttendance?.project?.jamKerjaMulai) {
    const clockInTime = new Date(todayAttendance.clockIn);
    const [jamMasuk, menitMasuk] = todayAttendance.project.jamKerjaMulai.split(':').map(Number);

    const limitTime = new Date(todayAttendance.clockIn);
    limitTime.setHours(jamMasuk, menitMasuk, 0, 0);

    const diffMs = clockInTime.getTime() - limitTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes > 0) {
      const jam = Math.floor(diffMinutes / 60);
      const mnt = diffMinutes % 60;
      latenessText = `Telat ${jam > 0 ? `${jam}j ` : ''}${mnt}m`;
      latenessColor = 'border-rose-400/30 bg-rose-500/20 text-rose-300';
    } else {
      latenessText = 'Tepat Waktu';
      latenessColor = 'border-emerald-400/30 bg-emerald-500/20 text-emerald-300';
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      {/* Modern Startup Header */}
      <div className="relative pt-12 pb-28 px-6 bg-slate-900 dark:bg-black rounded-b-[40px] shadow-lg overflow-hidden">
        {/* Subtle glowing orbs for startup aesthetic */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] translate-x-1/2 -translate-y-1/4 pointer-events-none"></div>

        <header className="relative flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-blue-500 p-[2px] shadow-lg shadow-primary/20 shrink-0">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center border-2 border-slate-900">
                <span className="font-bold text-white text-xl">{user?.nama?.charAt(0)?.toUpperCase() || 'U'}</span>
              </div>
            </div>
            <div>
              <p className="text-primary-foreground/70 font-medium tracking-wide text-[11px] mb-0.5 uppercase">{currentDate}</p>
              <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
                {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">{user?.nama ? user.nama.split(' ')[0] : 'Memuat...'}</span>
              </h1>
              <p className="text-[11px] font-medium text-slate-400 mt-1 italic pr-4">"{quote || 'Memuat motivasi...'}"</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full bg-white/5 hover:bg-white/20 text-slate-300 hover:text-white backdrop-blur-md border border-white/10 shadow-sm transition-all h-10 w-10 shrink-0">
            <LogOut className="w-4 h-4" />
          </Button>
        </header>
      </div>

      {/* Main Content overlapping header */}
      <div className="px-5 -mt-20 relative z-20 space-y-6">

        {/* Sleek ID Card */}
        <Card className="border-0 shadow-lg shadow-slate-200/40 dark:shadow-black/20 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
          <CardContent className="p-0">
            <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Jabatan / Peran</p>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{user?.role || 'PEKERJA'}</p>
                </div>
              </div>

              <div className="w-px h-10 bg-slate-100 dark:bg-slate-800 mx-2"></div>

              <div className="flex-1 text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Status Kehadiran</p>
                {isLoading ? (
                  <div className="flex justify-end"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>
                ) : (
                  <div className="flex justify-end">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isClockedIn && !isClockedOut ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-400' : isClockedOut ? 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-400' : 'bg-slate-50 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${isClockedIn && !isClockedOut ? 'bg-emerald-500 animate-pulse' : isClockedOut ? 'bg-blue-500' : 'bg-slate-400'}`}></div>
                      {isClockedIn && !isClockedOut ? 'Aktif' : isClockedOut ? 'Selesai' : 'Belum'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Daily Journey Tracker */}
            <div className="px-6 py-5 bg-slate-50/50 dark:bg-slate-950/50 relative">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5 text-center">Jejak Hari Ini</p>
              <div className="flex justify-between items-center relative px-2">
                {/* Connecting Line */}
                <div className="absolute left-6 right-6 top-1/2 -translate-y-[12px] h-1 bg-slate-200 dark:bg-slate-800 rounded-full -z-10 overflow-hidden">
                  <div className="h-full bg-slate-800 dark:bg-slate-600 rounded-full transition-all duration-1000 ease-out" style={{ width: isClockedOut ? '100%' : isClockedIn ? '50%' : '0%' }}></div>
                </div>

                {steps.map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2 z-10 w-14">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${step.completed ? 'bg-slate-800 text-white shadow-md shadow-slate-400/20' : step.active ? 'bg-white dark:bg-slate-900 border-2 border-slate-800 text-slate-800 shadow-md shadow-slate-200/50' : 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-300'}`}>
                      {step.completed ? <CheckSquare className="w-4 h-4" /> : <div className={`w-2 h-2 rounded-full ${step.active ? 'bg-slate-800 animate-pulse' : 'bg-slate-300'}`}></div>}
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
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-300 bg-white/5 w-fit px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-md">
                  <Clock className="w-4 h-4 text-amber-300" />
                  <span>Jam Kerja: {todayAttendance?.project?.jamKerjaMulai || '08:00'} - {todayAttendance?.project?.jamKerjaSelesai || '17:00'}</span>
                </div>
                {isClockedIn && (
                  <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border backdrop-blur-md ${latenessColor}`}>
                    {latenessText}
                  </div>
                )}
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
