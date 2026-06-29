'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LogOut, User, MapPin, CheckSquare, Clock, Loader2, Building, ChevronRight, AlertTriangle, Home, CloudRain, ThumbsUp, Bell, Flame, Target, MessageSquareWarning, CheckCircle2, ArrowLeft, ClipboardList } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { toast } from 'sonner';

export default function MandorDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const supabase = createClient();

  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeBanner, setActiveBanner] = useState(0);
  const [personalGreeting, setPersonalGreeting] = useState('');

  const fetchData = async () => {
    try {
      const [resToday, resHistory] = await Promise.all([
        fetch(`/api/attendance/today?userId=${user?.id}`, { cache: 'no-store' }),
        fetch(`/api/attendance/history?userId=${user?.id}`, { cache: 'no-store' })
      ]);
      const dataToday = await resToday.json();
      const dataHistory = await resHistory.json();

      if (dataToday.success && dataToday.data) {
        setTodayAttendance(dataToday.data);

        // Fetch today's task reports alongside attendance
        const resTask = await fetch(
          `/api/daily-tasks?userId=${user?.id}&projectId=${dataToday.data.projectId}&all=true`,
          { cache: 'no-store' }
        );
        const dataTask = await resTask.json();
        if (dataTask.success && dataTask.data) {
          const todayStr = new Date().toISOString().split('T')[0];
          const todayOnly = dataTask.data.filter((r: any) => {
            return new Date(r.tanggal).toISOString().split('T')[0] === todayStr;
          });
          setTodayTasks(todayOnly);
        }
      }
      if (dataHistory.success && dataHistory.data) {
        setHistory(dataHistory.data);
      }
    } catch {
      // Fetch error silently ignored
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Auto-refetch when user returns to the tab (e.g. after submitting from /tugas or /absen)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        fetchData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % 3);
    }, 4000);

    // Random Personal Greeting
    const hr = new Date().getHours();
    let options: string[] = [];
    if (hr < 11) {
      options = ["Udah ngopi belum hari ini? ☕", "Semangat pagi, siap bangun pondasi! 🏗️", "Pagi! Pemanasan dulu yuk. 💪"];
    } else if (hr < 15) {
      options = ["Matahari terik, banyak minum ya! 💧", "Fokus! Target hari ini hampir kelar 🎯", "Panas banget, tapi tetap semangat! 🧊"];
    } else {
      options = ["Waktunya rekap hasil kerja! 📝", "Hampir beres, bentar lagi istirahat. 🛋️", "Kerja bagus hari ini, mantap! 🏆"];
    }
    setPersonalGreeting(options[Math.floor(Math.random() * options.length)]);

    return () => clearInterval(timer);
  }, []);

  const isClockedIn = !!todayAttendance;
  const isClockedOut = !!todayAttendance?.clockOut;
  const hasReportedToday = todayTasks.length > 0;

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

  // Motivasi Harian (Rotasi per hari)
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

  // Tips K3 / Safety (Rotasi per hari)
  const safetyTips = [
    "Utamakan K3. Gunakan Helm & Rompi saat di lapangan.",
    "Cek kembali perancah (scaffolding) sebelum memanjat.",
    "Pastikan area kerja bebas dari genangan air dan kabel terbuka.",
    "Gunakan sarung tangan saat menangani material tajam.",
    "Istirahat sejenak jika merasa pusing atau kelelahan berlebih.",
  ];
  const safetyIndex = (new Date().getDate() + 2) % safetyTips.length;

  // Simulasi Info Cuaca (Rotasi per hari / jam)
  const weatherTips = [
    { title: "Info Cuaca", desc: "Cuaca cerah hari ini. Jaga hidrasi, perbanyak minum air putih!", icon: <Flame className="w-5 h-5 text-white" />, bg: "from-amber-500 to-orange-600" },
    { title: "Waspada Hujan", desc: "Prediksi hujan sore nanti. Tutup material rawan air seperti semen.", icon: <CloudRain className="w-5 h-5 text-white" />, bg: "from-blue-500 to-indigo-600" },
    { title: "Cuaca Mendung", desc: "Cahaya mungkin kurang optimal, pastikan penerangan area kerja cukup.", icon: <CloudRain className="w-5 h-5 text-white" />, bg: "from-slate-500 to-slate-700" }
  ];
  const weatherIndex = (new Date().getDate() + new Date().getHours()) % weatherTips.length;
  const activeWeather = weatherTips[weatherIndex];

  // Info Banners Data
  const banners = [
    {
      title: "Kabar Hari Ini",
      desc: safetyTips[safetyIndex],
      icon: <AlertTriangle className="w-5 h-5 text-white" />,
      bg: "from-purple-500 to-fuchsia-600",
      iconBg: "bg-white/20 border-white/20"
    },
    {
      title: activeWeather.title,
      desc: activeWeather.desc,
      icon: activeWeather.icon,
      bg: activeWeather.bg,
      iconBg: "bg-white/20 border-white/20"
    },
    {
      title: "Motivasi",
      desc: quotes[todayIndex],
      icon: <ThumbsUp className="w-5 h-5 text-white" />,
      bg: "from-emerald-500 to-teal-600",
      iconBg: "bg-white/20 border-white/20"
    }
  ];

  // Gamification Logic based on real data
  const gamificationStats = useMemo(() => {
    if (!history || history.length === 0) return { streak: 0, onTime: 0 };

    let streak = 0;
    const uniqueDates = Array.from(new Set(history.map((r: any) => {
      const d = new Date(r.clockIn);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }))).sort((a, b) => b - a);

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const lastDateChecked = currentDate.getTime();

    const latestRecord = uniqueDates[0];
    const diffToLatest = (lastDateChecked - latestRecord) / (1000 * 3600 * 24);

    if (diffToLatest <= 1) {
      streak = 1;
      let prevDate = latestRecord;
      for (let i = 1; i < uniqueDates.length; i++) {
        const diff = (prevDate - uniqueDates[i]) / (1000 * 3600 * 24);
        if (diff === 1) {
          streak++;
          prevDate = uniqueDates[i];
        } else {
          break;
        }
      }
    }

    let onTimeCount = 0;
    for (const record of history) {
      const clockInTime = new Date(record.clockIn);
      const jamMasuk = record.jamKerjaMulai || '08:00';
      const [jam, menit] = jamMasuk.split(':').map(Number);
      const limitTime = new Date(record.clockIn);
      limitTime.setHours(jam, menit, 0, 0);
      if (clockInTime.getTime() <= limitTime.getTime()) {
        onTimeCount++;
      }
    }
    const onTime = Math.round((onTimeCount / history.length) * 100);

    return { streak, onTime };
  }, [history]);

  // Helper: format relative time
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  // Smart Notifications Logic — now aware of todayTasks
  const smartNotifications = useMemo(() => {
    const notifs: any[] = [];
    if (!isClockedIn) {
      notifs.push({
        id: 'no-clockin',
        type: 'warning',
        title: 'Belum Absen Masuk',
        desc: 'Waktu kerja segera dimulai, yuk absen sekarang sebelum terlambat!',
        time: formatRelativeTime(new Date())
      });
    } else if (isClockedIn && !isClockedOut) {
      if (!hasReportedToday) {
        notifs.push({
          id: 'no-report',
          type: 'info',
          title: 'Progres Hari Ini',
          desc: `Jangan lupa lapor target & foto progres hari ini ya, ${user?.nama ? user.nama.split(' ')[0] : 'Tim'}!`,
          time: formatRelativeTime(new Date(todayAttendance.clockIn))
        });
      } else {
        // Use the latest task's updatedAt for timing
        const latestTask = todayTasks.reduce((latest: any, t: any) =>
          new Date(t.updatedAt) > new Date(latest.updatedAt) ? t : latest
          , todayTasks[0]);
        notifs.push({
          id: 'reported-today',
          type: 'success',
          title: 'Laporan Terkirim!',
          desc: `Keren! ${todayTasks.length} laporan progres sudah berhasil dikirim hari ini.`,
          time: formatRelativeTime(new Date(latestTask.updatedAt))
        });
      }
      notifs.push({
        id: 'clockin-success',
        type: 'success',
        title: 'Absen Berhasil',
        desc: `Anda absen masuk pukul ${new Date(todayAttendance.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
        time: formatRelativeTime(new Date(todayAttendance.clockIn))
      });
    } else if (isClockedOut) {
      notifs.push({
        id: 'clockout-success',
        type: 'success',
        title: 'Kerja Selesai',
        desc: 'Selamat beristirahat! Sampai jumpa besok.',
        time: formatRelativeTime(new Date(todayAttendance.clockOut))
      });
    }
    return notifs;
  }, [isClockedIn, isClockedOut, todayAttendance, todayTasks, hasReportedToday, user]);

  // Calculate Lateness for Today
  let isLate = false;
  let latenessText = null;
  if (todayAttendance?.clockIn) {
    const clockInDate = new Date(todayAttendance.clockIn);
    const expectedTime = todayAttendance.jamKerjaMulai || '08:00';
    const [h, m] = expectedTime.split(':').map(Number);
    const expectedDate = new Date(todayAttendance.clockIn);
    expectedDate.setHours(h, m, 0, 0);

    const diffMs = clockInDate.getTime() - expectedDate.getTime();
    if (diffMs > 0) {
      isLate = true;
      const diffMins = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      if (hours > 0) {
        latenessText = `Telat ${hours}j ${mins}m`;
      } else {
        latenessText = `Telat ${mins}m`;
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-28 font-sans">
      {/* M-Banking Solid Header Background */}
      <div className="absolute top-0 left-0 w-full h-[280px] bg-primary rounded-b-[40px] z-0 shadow-lg overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-blue-500/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
      </div>

      {/* Clean Light Header Content */}
      <div className="pt-12 pb-24 px-6 relative z-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/profil')} className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center border border-white/30 shadow-sm shrink-0 hover:bg-white/30 transition-colors active:scale-95">
              <span className="font-bold text-xl">{user?.nama?.charAt(0)?.toUpperCase() || 'U'}</span>
            </button>
            <div>
              <p className="text-white/80 font-medium tracking-wide text-[10px] uppercase mb-0.5 drop-shadow-sm">{currentDate}</p>
              <h1 className="text-xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
                {greeting}, <span className="font-black">{user?.nama ? user.nama.split(' ')[0] : 'Memuat...'}</span>
              </h1>
              <p className="text-white/90 text-[10px] mt-1 font-medium">{personalGreeting}</p>
            </div>
          </div>
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 text-white shadow-sm border border-white/30 transition-all h-10 w-10 shrink-0 relative" />}>
              <Bell className="w-5 h-5" />
              {smartNotifications.some(n => n.type === 'warning' || n.type === 'info') && (
                <div className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-primary animate-pulse"></div>
              )}
            </SheetTrigger>
            <SheetContent side="right" showCloseButton={false} className="data-[side=right]:w-full data-[side=right]:max-w-full data-[side=right]:sm:max-w-full h-full pt-6 pb-0 bg-white dark:bg-slate-950 border-l-0 shadow-2xl flex flex-col gap-0 z-[100] px-0">
              <SheetHeader className="text-left mb-2 shrink-0 px-6">
                <div className="flex items-center gap-3">
                  <SheetClose render={<Button variant="ghost" size="icon" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 shrink-0" />}>
                    <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                  </SheetClose>
                  <SheetTitle className="text-2xl font-black text-slate-800 dark:text-slate-100">Notifikasi</SheetTitle>
                </div>
              </SheetHeader>

              <div className="overflow-y-auto flex-1 flex flex-col pb-10">
                {smartNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400">
                    <Bell className="w-12 h-12 mb-3 text-slate-200 dark:text-slate-800" />
                    <p className="font-medium text-sm">Belum ada notifikasi</p>
                  </div>
                ) : smartNotifications.map(notif => {
                  const isUnread = notif.type === 'warning' || notif.type === 'info';
                  return (
                    <div key={notif.id} className={`relative px-6 py-5 flex gap-4 items-start border-b border-slate-100 dark:border-slate-800/60 active:bg-slate-50 dark:active:bg-slate-900 transition-colors ${isUnread ? 'bg-blue-50/40 dark:bg-blue-900/10' : 'bg-transparent'
                      }`}>
                      {isUnread && (
                        <div className="absolute top-1/2 -translate-y-1/2 left-2 w-1.5 h-1.5 rounded-full bg-blue-500" />
                      )}

                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'warning' ? 'bg-amber-100/60 text-amber-600' :
                        notif.type === 'info' ? 'bg-blue-100/60 text-blue-600' : 'bg-emerald-100/60 text-emerald-600'
                        }`}>
                        {notif.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
                          notif.type === 'info' ? <MessageSquareWarning className="w-5 h-5" /> :
                            <CheckCircle2 className="w-5 h-5" />}
                      </div>

                      <div className="flex-1 pr-2">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`font-bold text-sm ${isUnread ? 'text-slate-800 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>{notif.title}</h4>
                          <span className="text-[10px] font-bold text-slate-400 shrink-0 ml-2 mt-0.5">{notif.time}</span>
                        </div>
                        <p className={`text-xs leading-relaxed ${isUnread ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>{notif.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </header>
      </div>

      <div className="px-5 space-y-6 relative z-20 -mt-16">

        {/* Smart Punch Card (Action Focused) */}
        <Card className="border-0 shadow-2xl shadow-primary/20 dark:shadow-black/50 bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden relative">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-bl-full pointer-events-none"></div>

          <CardContent className="p-6 relative z-10 flex flex-col gap-6">

            {/* Top: Project Info Minimalist */}
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-[20px] border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                  <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Lokasi Proyek Aktif</p>
                  {isLoading ? (
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700/50 rounded animate-pulse"></div>
                  ) : (
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs line-clamp-1">{todayAttendance?.project?.namaProyek || 'Belum Terpilih'}</h3>
                  )}
                </div>
              </div>
            </div>

            {/* Center: The Smart CTA Button */}
            <div className="flex flex-col gap-3">
              {isLoading ? (
                <div className="w-full h-[72px] bg-slate-100 dark:bg-slate-800 rounded-[20px] animate-pulse"></div>
              ) : !isClockedIn ? (
                <div className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-[20px] p-4 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Status Saat Ini</p>
                    <h3 className="text-base font-black text-slate-800 dark:text-slate-100 leading-tight">Belum Absen</h3>
                  </div>
                  <button
                    onClick={() => router.push('/absen')}
                    className="shrink-0 relative overflow-hidden group active:scale-95 transition-all rounded-full shadow-lg shadow-emerald-500/20"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                    <div className="relative px-5 py-2.5 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-white" />
                      <span className="font-bold text-xs text-white">Absen Masuk</span>
                    </div>
                  </button>
                </div>
              ) : !isClockedOut ? (
                <div className="w-full bg-slate-50 dark:bg-slate-800/50 border border-emerald-100 dark:border-emerald-900/30 rounded-[20px] p-4 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-[10px] font-extrabold text-emerald-600/70 dark:text-emerald-500/70 uppercase tracking-widest mb-0.5">Status Saat Ini</p>
                    <h3 className="text-base font-black text-emerald-600 dark:text-emerald-400 leading-tight">Sedang Aktif</h3>
                  </div>
                  <button
                    onClick={() => router.push('/tugas')}
                    className="shrink-0 relative overflow-hidden group active:scale-95 transition-all rounded-full shadow-lg shadow-blue-500/20"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                    <div className="relative px-5 py-2.5 flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-white" />
                      <span className="font-bold text-xs text-white">Lapor Progres</span>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 rounded-[20px] p-4 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Status Saat Ini</p>
                    <h3 className="text-base font-black text-slate-700 dark:text-slate-300 leading-tight">Selesai Bekerja</h3>
                  </div>
                  <div className="h-10 px-4 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-slate-500 dark:text-slate-400 mr-1.5" />
                    <span className="font-bold text-xs text-slate-600 dark:text-slate-300">Tuntas</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom: Gamification Tags */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
              <div className="flex-1 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50 rounded-[20px] p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-[9px] font-extrabold text-amber-600/70 dark:text-amber-500/70 uppercase tracking-widest">Streak</p>
                  <p className="font-black text-amber-600 dark:text-amber-500 text-sm leading-none mt-0.5">{gamificationStats.streak} Hari</p>
                </div>
              </div>
              <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 rounded-[20px] p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold text-emerald-600/70 dark:text-emerald-500/70 uppercase tracking-widest">On Time</p>
                  <p className="font-black text-emerald-600 dark:text-emerald-500 text-sm leading-none mt-0.5">{gamificationStats.onTime}%</p>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Menu Utama (Hub Navigation) */}
        <div className="pt-2 pb-1">
          <div className="grid grid-cols-4 gap-3">
            <button
              onClick={() => router.push('/absen')}
              className="flex flex-col items-center gap-2 group active:scale-95 transition-transform animate-in fade-in slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: '0ms', animationFillMode: 'both' }}
            >
              <div className="w-14 h-14 rounded-[20px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none flex items-center justify-center transition-transform relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-900/10 dark:to-teal-900/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <MapPin className="w-6 h-6 text-emerald-500 relative z-10" />
              </div>
              <span className="font-bold text-[10px] text-slate-600 dark:text-slate-300">Absen</span>
            </button>

            <button
              onClick={() => router.push('/tugas')}
              className="flex flex-col items-center gap-2 group active:scale-95 transition-transform animate-in fade-in slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: '60ms', animationFillMode: 'both' }}
            >
              <div className="w-14 h-14 rounded-[20px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none flex items-center justify-center transition-transform relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CheckSquare className="w-6 h-6 text-blue-500 relative z-10" />
              </div>
              <span className="font-bold text-[10px] text-slate-600 dark:text-slate-300">Lapor</span>
            </button>

            <button
              onClick={() => router.push('/riwayat')}
              className="flex flex-col items-center gap-2 group active:scale-95 transition-transform animate-in fade-in slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: '120ms', animationFillMode: 'both' }}
            >
              <div className="w-14 h-14 rounded-[20px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none flex items-center justify-center transition-transform relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-fuchsia-50/50 dark:from-purple-900/10 dark:to-fuchsia-900/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Clock className="w-6 h-6 text-purple-500 relative z-10" />
              </div>
              <span className="font-bold text-[10px] text-slate-600 dark:text-slate-300 text-center leading-tight">R. Absen</span>
            </button>

            <button
              onClick={() => router.push('/riwayat-laporan')}
              className="flex flex-col items-center gap-2 group active:scale-95 transition-transform animate-in fade-in slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: '180ms', animationFillMode: 'both' }}
            >
              <div className="w-14 h-14 rounded-[20px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none flex items-center justify-center transition-transform relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-violet-50/50 dark:from-indigo-900/10 dark:to-violet-900/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <ClipboardList className="w-6 h-6 text-indigo-500 relative z-10" />
              </div>
              <span className="font-bold text-[10px] text-slate-600 dark:text-slate-300 text-center leading-tight">R. Lapor</span>
            </button>

            <button
              onClick={() => router.push('/profil')}
              className="flex flex-col items-center gap-2 group active:scale-95 transition-transform"
            >
              <div className="w-14 h-14 rounded-[20px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none flex items-center justify-center transition-transform relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-50/50 dark:from-slate-800/50 dark:to-slate-800/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <User className="w-6 h-6 text-slate-600 dark:text-slate-400 relative z-10" />
              </div>
              <span className="font-bold text-[10px] text-slate-600 dark:text-slate-300">Profil</span>
            </button>
          </div>
        </div>

        {/* Info Banner Auto-Sliding */}
        <div className="mt-6 mb-2 relative overflow-hidden rounded-[20px] shadow-lg">
          <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${activeBanner * 100}%)` }}>
            {banners.map((banner, idx) => (
              <div key={idx} className={`w-full shrink-0 bg-gradient-to-r ${banner.bg} px-4 pt-4 pb-7 text-white flex items-center justify-between relative`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                <div className="relative z-10 flex-1 pr-2">
                  <p className="text-[10px] font-bold tracking-wider text-white/80 uppercase mb-1">{banner.title}</p>
                  <h4 className="text-sm font-bold leading-tight">{banner.desc}</h4>
                </div>
                <div className={`relative z-10 w-10 h-10 rounded-full ${banner.iconBg} flex items-center justify-center shrink-0 ml-4 backdrop-blur-sm border`}>
                  {banner.icon}
                </div>
              </div>
            ))}
          </div>

          {/* Dots Indicator */}
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-20">
            {banners.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${activeBanner === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`}
              />
            ))}
          </div>
        </div>

      </div>

      {/* Tracker Mingguan & Timeline Hari Ini */}
      <div className="pt-4 pb-8 px-5">
        <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-xl shadow-slate-200/40 dark:shadow-black/20 border border-slate-100 dark:border-slate-800 overflow-hidden">

          {/* Top Section: Calendar Heatmap */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Aktivitas Minggu Ini</h3>
              <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full uppercase tracking-wider">{gamificationStats.streak} Hari Beruntun</span>
            </div>

            <div className="flex justify-between items-center px-1">
              {['S', 'S', 'R', 'K', 'J', 'S', 'M'].map((day, idx) => {
                const currentDayRaw = new Date().getDay();
                const currentDayIdx = currentDayRaw === 0 ? 6 : currentDayRaw - 1;
                const isToday = idx === currentDayIdx;
                const isPast = idx < currentDayIdx;
                const isActive = isPast || (isToday && isClockedIn);

                return (
                  <div key={idx} className="flex flex-col items-center gap-1.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${isActive
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : isToday
                        ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-500 ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}>
                      {isActive ? <CheckSquare className="w-3.5 h-3.5" /> : day}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Section: Timeline Hari Ini */}
          <div className="p-5">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Timeline Hari Ini</h3>
              <button
                onClick={() => router.push('/riwayat')}
                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5"
              >
                Lihat Semua <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg w-full"></div>
              </div>
            ) : !isClockedIn ? (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-[10px] font-bold text-slate-500">Belum ada aktivitas hari ini</p>
              </div>
            ) : (
              <div className="relative pl-3 space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
                {/* Item 1: Absen Masuk */}
                <div className="relative flex gap-4 items-start">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 relative z-10 shadow-sm ring-4 ring-white dark:ring-slate-900 ${isLate ? 'bg-rose-500 text-white shadow-rose-500/30' : 'bg-emerald-500 text-white shadow-emerald-500/30'}`}>
                    <MapPin className="w-3 h-3" />
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-xs font-black text-slate-800 dark:text-slate-100 leading-none mb-1.5">Absen Masuk</p>
                    <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 flex-wrap">
                      <span>{todayAttendance?.project?.namaProyek || 'Proyek Lapangan'}</span>
                      {isLate && latenessText && (
                        <span className="text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider shadow-sm flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" /> {latenessText}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 pt-0.5 text-right">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-md ${isLate ? 'text-rose-600 bg-rose-50 dark:bg-rose-900/30' : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30'}`}>
                      {todayAttendance?.clockIn ? new Date(todayAttendance.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </span>
                  </div>
                </div>

                {/* Item 2: Status Laporan / Pulang */}
                <div className="relative flex gap-4 items-start">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 relative z-10 ring-4 ring-white dark:ring-slate-900 ${isClockedOut
                    ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/30'
                    : hasReportedToday
                      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                    }`}>
                    {isClockedOut || hasReportedToday ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className={`text-xs font-black leading-none mb-1.5 ${isClockedOut || hasReportedToday ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}`}>
                      {isClockedOut ? 'Selesai Bekerja' : hasReportedToday ? 'Laporan Terkirim' : 'Menunggu Laporan'}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400">
                      {isClockedOut ? 'Progres harian dilaporkan' : hasReportedToday ? `${todayTasks.length} laporan dikirim hari ini` : 'Biasanya jam 17:00'}
                    </p>
                  </div>
                  <div className="shrink-0 pt-0.5 text-right">
                    {isClockedOut ? (
                      <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md">
                        {todayAttendance?.clockOut ? new Date(todayAttendance.clockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600">
                        --:--
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
