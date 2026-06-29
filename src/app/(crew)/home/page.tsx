'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LogOut, User, MapPin, CheckSquare, Clock, Loader2, PlayCircle, Building, ChevronRight } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-28 font-sans">
      {/* M-Banking Solid Header Background */}
      <div className="absolute top-0 left-0 w-full h-[280px] bg-primary rounded-b-[40px] z-0 shadow-lg overflow-hidden">
        {/* Decorative elements for header */}
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-blue-500/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
      </div>

      {/* Clean Light Header Content */}
      <div className="pt-12 pb-24 px-6 relative z-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center border border-white/30 shadow-sm shrink-0">
              <span className="font-bold text-xl">{user?.nama?.charAt(0)?.toUpperCase() || 'U'}</span>
            </div>
            <div>
              <p className="text-white/80 font-medium tracking-wide text-[10px] uppercase mb-0.5 drop-shadow-sm">{currentDate}</p>
              <h1 className="text-xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
                {greeting}, <span className="font-black">{user?.nama ? user.nama.split(' ')[0] : 'Memuat...'}</span>
              </h1>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 text-white shadow-sm border border-white/30 transition-all h-10 w-10 shrink-0">
            <LogOut className="w-4 h-4" />
          </Button>
        </header>
      </div>

      <div className="px-5 space-y-6 relative z-20 -mt-16">

        {/* Floating Balance/Status Card (M-Banking Style) */}
        <Card className="border-0 shadow-2xl shadow-primary/20 dark:shadow-black/50 bg-white dark:bg-slate-900 rounded-[28px] overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] pointer-events-none"></div>
          <CardContent className="p-6">

            {/* Top row: Role and Status */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Status Kehadiran</p>
                {isLoading ? (
                  <div className="h-8 flex items-center"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
                ) : (
                  <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    {isClockedIn && !isClockedOut ? 'Sedang Aktif' : isClockedOut ? 'Selesai Bekerja' : 'Belum Absen'}
                    {isClockedIn && !isClockedOut && (
                      <span className="relative flex h-3 w-3 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                    )}
                  </h2>
                )}
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm shrink-0">
                <p className="text-[10px] font-black uppercase text-primary">{user?.role || 'PEKERJA'}</p>
              </div>
            </div>

            {/* Project Info - Merged like Account Info */}
            <div className="px-1 mb-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800/50">
                <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Lokasi Proyek Aktif</p>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm leading-tight">{todayAttendance?.project?.namaProyek || 'Belum Terpilih'}</h3>

                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{todayAttendance?.project?.jamKerjaMulai || '08:00'} - {todayAttendance?.project?.jamKerjaSelesai || '17:00'}</span>
                  </div>
                  {isClockedIn && (
                    <div className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${latenessColor}`}>
                      {latenessText}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Journey Tracker - Simplified & Elegant */}
            <div className="pt-5 border-t border-slate-100 dark:border-slate-800/50">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">Perjalanan Hari Ini</p>
              <div className="flex justify-between items-center relative px-2">
                <div className="absolute left-6 right-6 top-[10px] h-1 bg-slate-100 dark:bg-slate-800 rounded-full -z-10 overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all duration-1000 ease-out" style={{ width: isClockedOut ? '100%' : isClockedIn ? '50%' : '0%' }}></div>
                </div>

                {steps.map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2 z-10 w-12">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 ring-4 ring-white dark:ring-slate-900 ${step.completed ? 'bg-emerald-500 text-white shadow-sm' :
                      step.active ? 'border-[2.5px] border-emerald-500 bg-white dark:bg-slate-900' :
                        'border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-300'
                      }`}>
                      {step.completed && <CheckSquare className="w-3 h-3" />}
                      {step.active && !step.completed && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>}
                    </div>
                    <span className={`text-[9px] uppercase tracking-widest font-bold transition-colors duration-300 ${step.active || step.completed ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'
                      }`}>{step.title}</span>
                  </div>
                ))}
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Quick Actions - Mobile Banking Grid */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 px-1">
            Menu Utama
          </h3>

          <div className="grid grid-cols-4 gap-4 px-2">
            <button
              onClick={() => router.push('/absen')}
              className="flex flex-col items-center gap-2 group active:scale-95 transition-transform"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:-translate-y-1 ${isClockedIn ? 'bg-amber-500 shadow-amber-500/30 text-white' : 'bg-primary shadow-primary/30 text-white'}`}>
                <MapPin className="w-6 h-6" />
              </div>
              <span className="font-bold text-[10px] text-slate-600 dark:text-slate-300 text-center leading-tight">
                {isClockedIn ? <span>Status<br />Absen</span> : <span>Absen<br />Masuk</span>}
              </span>
            </button>

            <button
              onClick={() => router.push('/tugas')}
              className="flex flex-col items-center gap-2 group active:scale-95 transition-transform"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-emerald-500 shadow-emerald-500/30 text-white transition-transform group-hover:-translate-y-1">
                <CheckSquare className="w-6 h-6" />
              </div>
              <span className="font-bold text-[10px] text-slate-600 dark:text-slate-300 text-center leading-tight">
                Lapor<br />Kerja
              </span>
            </button>

            <button
              onClick={() => router.push('/riwayat')}
              className="flex flex-col items-center gap-2 group active:scale-95 transition-transform"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-indigo-500 shadow-indigo-500/30 text-white transition-transform group-hover:-translate-y-1">
                <Clock className="w-6 h-6" />
              </div>
              <span className="font-bold text-[10px] text-slate-600 dark:text-slate-300 text-center leading-tight">
                Riwayat<br />Absen
              </span>
            </button>

            <button
              onClick={() => { }}
              className="flex flex-col items-center gap-2 group active:scale-95 transition-transform"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-slate-200 dark:bg-slate-800 shadow-slate-200/50 dark:shadow-black/20 text-slate-500 transition-transform group-hover:-translate-y-1">
                <User className="w-6 h-6" />
              </div>
              <span className="font-bold text-[10px] text-slate-600 dark:text-slate-300 text-center leading-tight">
                Profil<br />Akun
              </span>
            </button>
          </div>
        </div>

      </div>

      {/* Riwayat Absen - Mutasi Rekening Style */}
      <div className="pt-4 pb-8 space-y-4 px-5">
        <div className="flex justify-between items-end px-2 mb-2">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">Riwayat Absensi</h3>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">Aktivitas Terakhir</p>
          </div>
          <button
            onClick={() => router.push('/riwayat')}
            className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full transition-colors"
          >
            Lihat Semua
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[28px] p-2 shadow-xl shadow-slate-200/40 dark:shadow-black/20 border border-slate-100 dark:border-slate-800">
          {history.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                <Clock className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-xs font-bold text-slate-500">Belum ada aktivitas</p>
            </div>
          )}

          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {history.map((record: any) => (
              <div key={record.id} className="p-3.5 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors first:rounded-t-[20px] last:rounded-b-[20px] active:bg-slate-100">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${record.clockOut ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-0.5 truncate">
                    {record.namaProyek || 'Proyek Lapangan'}
                  </p>
                  <p className="text-[10px] font-medium text-slate-500">
                    {new Date(record.clockIn).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                    {new Date(record.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {record.clockOut ? (
                    <p className="text-[10px] font-bold text-emerald-500 flex items-center justify-end gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {new Date(record.clockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  ) : (
                    <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mt-0.5">
                      Aktif
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
