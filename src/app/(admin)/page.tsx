'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Building2, TrendingUp, AlertCircle, Loader2, MapPin, Trophy, Clock, AlertTriangle, Info, Banknote, Eye, EyeOff, Plus, FileText, ChevronRight, Shield, Wallet, Bell, ChevronLeft } from 'lucide-react';
import { DashboardStats, DashboardActivity } from '@/domain/repositories/dashboard.repository';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';

// Load MapComponent dynamically with ssr disabled
const DashboardMap = dynamic(() => import('@/components/DashboardMap'), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse flex items-center justify-center text-slate-400">Memuat Peta...</div>
});

const ActionItem = ({ href, icon: Icon, label, color }: { href: string, icon: any, label: string, color: string }) => (
  <Link href={href} className="flex flex-col items-center gap-2 group">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-active:scale-95 shadow-sm ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 text-center">{label}</span>
  </Link>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSaldo, setShowSaldo] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/admin/dashboard');
        const data = await res.json();
        if (data.success) {
          setStats(data.data.stats);
          setActivities(data.data.recentActivities);
        }
      } catch (err) {
        console.error('Gagal memuat dashboard', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka);
  };

  const statCards = [
    { title: 'Total Proyek Aktif', value: stats?.totalActiveProjects ?? '-', icon: Building2, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { title: 'Kru Aktif Terdaftar', value: stats?.totalActiveCrew ?? '-', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { title: 'Kru Hadir Hari Ini', value: stats?.totalAttendancesToday ?? '-', icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/20' },
    { title: 'Estimasi Gaji Minggu Ini', value: stats ? formatRupiah(stats.payrollForecastThisWeek) : '-', icon: Banknote, color: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-900/30' },
  ];

  return (
    <div className="animate-in fade-in duration-700 w-full pb-8">
      
      {/* =========================================================
          1. DESKTOP VIEW (Original Layout, Hidden on Mobile)
      ========================================================= */}
      <div className="hidden md:block space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard Admin</h1>
          <p className="text-slate-500 mt-1">Ringkasan aktivitas proyek, absensi kru lapangan, dan estimasi payroll.</p>
        </div>

        {/* Section 1: 4 Kartu Statistik Atas */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card key={i} className="border-0 shadow-sm transition-all hover:shadow-md">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                    {isLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                    ) : (
                      <p className={`font-bold ${i === 3 ? 'text-xl' : 'text-3xl'}`}>{stat.value}</p>
                    )}
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Section 2: Peta Sebaran Proyek & Titik Absen (Kiri, 2 Kolom) */}
          <Card className="lg:col-span-2 border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Live Map: Sebaran Proyek & Kru
                </CardTitle>
                <CardDescription>Titik proyek aktif (biru) dan lokasi absensi kru hari ini (hijau).</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[400px] w-full flex items-center justify-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <DashboardMap projects={stats?.activeProjectsList || []} attendances={stats?.mapAttendances || []} />
              )}
            </CardContent>
          </Card>

          {/* Section 3: Papan Peringatan & Aktivitas Terbaru (Kanan, 1 Kolom) */}
          <div className="space-y-6">
            <Card className="border-0 shadow-sm border-t-4 border-t-rose-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                  Action Required (Alerts)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
                ) : stats?.alerts && stats.alerts.length > 0 ? (
                  <ul className="space-y-3">
                    {stats.alerts.map((alert) => (
                      <li key={alert.id} className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 rounded-lg text-sm flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{alert.message}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-6 text-sm text-slate-500 flex flex-col items-center">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-2">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    Semua aman terkendali hari ini.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm flex-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Aktivitas Terbaru
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 pb-2">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-20">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="text-center text-slate-500 py-8 text-sm">
                      Belum ada aktivitas.
                    </div>
                  ) : (
                    activities.map((act) => {
                      const initial = act.userName.charAt(0).toUpperCase();
                      const isClockIn = act.type === 'CLOCK_IN';
                      const colorClass = isClockIn
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'
                        : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30';

                      return (
                        <div key={act.id} className="flex items-start space-x-3 border-b pb-3 last:border-0 dark:border-slate-800">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 text-sm ${colorClass}`}>
                            {initial}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{act.userName}</p>
                            <p className="text-xs text-slate-500 leading-snug mt-0.5 line-clamp-2">{act.description}</p>
                          </div>
                          <div className="text-[10px] font-semibold text-slate-400 shrink-0 mt-1">
                            {new Date(act.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Section 4: Quick List Proyek */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Daftar Proyek Aktif
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : stats?.activeProjectsList?.length === 0 ? (
                <div className="text-center py-10 text-slate-500">Tidak ada proyek aktif.</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {stats?.activeProjectsList?.map(proj => (
                    <div key={proj.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <div>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200">{proj.namaProyek}</h4>
                        <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{proj.status}</p>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span className="text-xl font-bold text-primary">{proj.jumlahKruHariIni}</span>
                        <span className="text-[10px] text-slate-500">Kru Hadir Hari Ini</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 5: Leaderboard */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Leaderboard Jam Kerja (Minggu Ini)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : stats?.leaderboard?.length === 0 ? (
                <div className="text-center py-10 text-slate-500">Belum ada data jam kerja minggu ini.</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {stats?.leaderboard?.map((entry, idx) => {
                    let rankColor = "text-slate-400 bg-slate-100 dark:bg-slate-800";
                    if (idx === 0) rankColor = "text-amber-500 bg-amber-100 dark:bg-amber-900/30";
                    if (idx === 1) rankColor = "text-slate-500 bg-slate-200 dark:bg-slate-800";
                    if (idx === 2) rankColor = "text-amber-700 bg-amber-100/50 dark:bg-amber-900/20";

                    return (
                      <div key={entry.userId} className="p-4 flex items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${rankColor}`}>
                          #{idx + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">{entry.nama}</h4>
                          <p className="text-[10px] text-slate-500">{entry.role}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{entry.totalJamKerja}</span>
                          <span className="text-xs text-slate-500 ml-1">Jam</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* =========================================================
          2. MOBILE VIEW (M-Banking Aesthetic, Hidden on Desktop)
      ========================================================= */}
      <div className="block md:hidden">
        {/* M-Banking Gradient Header */}
        <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white rounded-b-[40px] pt-8 pb-28 px-6 shadow-[0_20px_40px_rgba(16,185,129,0.2)] relative overflow-hidden">
          {/* Decorative background blurs */}
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/20 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="absolute bottom-[-10%] left-[-20%] w-48 h-48 bg-teal-300/30 rounded-full blur-[60px] pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-emerald-50 text-sm font-semibold tracking-wide mb-1 opacity-90">Selamat Datang,</p>
                <h1 className="text-2xl font-black tracking-tight">{user?.nama || 'Admin Habs'}</h1>
              </div>
              <Sheet>
                <SheetTrigger className="relative w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-inner transition-transform active:scale-95">
                  <Bell className="w-6 h-6 text-white" />
                  {activities.length > 0 && (
                    <span className="absolute top-2 right-2 w-3 h-3 bg-rose-500 rounded-full border-2 border-emerald-500"></span>
                  )}
                </SheetTrigger>
                <SheetContent side="right" className="!w-full !max-w-none sm:!w-[400px] p-0 flex flex-col bg-slate-50 dark:bg-slate-950 border-l-0 [&>button]:hidden">
                  {/* M-Banking Style Header for Notification */}
                  <div className="bg-emerald-600 dark:bg-emerald-800 text-white p-4 flex items-center shadow-sm sticky top-0 z-10 pt-6">
                    <SheetClose className="p-2 -ml-2 rounded-full hover:bg-white/20 transition-colors active:scale-95">
                      <ChevronLeft className="w-6 h-6" />
                    </SheetClose>
                    <h2 className="text-lg font-bold ml-2">Kotak Masuk</h2>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
                    {activities.length === 0 ? (
                      <div className="text-center text-slate-500 py-20 flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                          <Bell className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="font-bold text-slate-700 dark:text-slate-300">Belum Ada Notifikasi</p>
                        <p className="text-xs mt-1">Aktivitas kru akan muncul di sini.</p>
                      </div>
                    ) : (
                      <div className="p-4 space-y-3">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider pl-1 mb-2">Hari Ini</h3>
                        <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                          {activities.map((act) => {
                            const isClockIn = act.type === 'CLOCK_IN';
                            const colorClass = isClockIn
                              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
                            
                            const Icon = isClockIn ? Clock : Info;

                            return (
                              <div key={act.id} className="p-4 flex items-start gap-4 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors active:bg-slate-100">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black shrink-0 ${colorClass}`}>
                                  <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start mb-0.5">
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate pr-2">{act.userName}</p>
                                    <p className="text-[10px] font-bold text-slate-400 shrink-0 mt-0.5">
                                      {new Date(act.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                  <p className="text-xs font-medium text-slate-500 leading-snug">{act.description}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-emerald-50 text-sm font-medium opacity-90">Estimasi Payroll Minggu Ini</p>
                <button 
                  onClick={() => setShowSaldo(!showSaldo)} 
                  className="text-emerald-100 hover:text-white transition-colors bg-white/10 rounded-full p-1.5 backdrop-blur-sm"
                >
                  {showSaldo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {isLoading ? (
                <div className="h-10 flex items-center"><Loader2 className="w-6 h-6 animate-spin text-emerald-100" /></div>
              ) : (
                <h2 className="text-4xl font-black tracking-tighter drop-shadow-md">
                  {showSaldo ? (stats ? formatRupiah(stats.payrollForecastThisWeek) : 'Rp 0') : 'Rp ••••••••'}
                </h2>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area (Overlapping Header on Mobile) */}
        <div className="px-4 -mt-16 relative z-20 space-y-6">
          
          {/* Quick Actions Grid */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/50 dark:border-slate-800 grid grid-cols-4 gap-y-6 gap-x-2">
            <ActionItem href="/projects" icon={Building2} label="Proyek" color="bg-blue-100 text-blue-600 dark:bg-blue-900/30" />
            <ActionItem href="/profiles" icon={Users} label="Kru" color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" />
            <ActionItem href="/reports" icon={FileText} label="Laporan" color="bg-amber-100 text-amber-600 dark:bg-amber-900/30" />
            <ActionItem href="/payroll" icon={Wallet} label="Gaji" color="bg-purple-100 text-purple-600 dark:bg-purple-900/30" />
            
            <ActionItem href="/roles" icon={Shield} label="Akses" color="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" />
            <ActionItem href="/projects" icon={MapPin} label="Peta" color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30" />
            <ActionItem href="/profiles" icon={Plus} label="Tambah" color="bg-rose-100 text-rose-600 dark:bg-rose-900/30" />
            <ActionItem href="#" icon={ChevronRight} label="Lainnya" color="bg-slate-50 text-slate-400 dark:bg-slate-800/50" />
          </div>

          {/* Info Cards Row (Mini Stats) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Proyek Aktif</p>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-300" /> : <p className="text-xl font-black text-slate-800 dark:text-slate-100">{stats?.totalActiveProjects ?? '-'}</p>}
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Kru Hadir</p>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-300" /> : <p className="text-xl font-black text-slate-800 dark:text-slate-100">{stats?.totalAttendancesToday ?? '-'}</p>}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 col-span-2">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Kru</p>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-300" /> : <p className="text-xl font-black text-slate-800 dark:text-slate-100">{stats?.totalActiveCrew ?? '-'}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Action Required (Alerts) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  Butuh Perhatian
                </h3>
              </div>
              <Card className="border-0 shadow-sm rounded-[24px] bg-white dark:bg-slate-900 overflow-hidden">
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
                  ) : stats?.alerts && stats.alerts.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {stats.alerts.map((alert) => (
                        <div key={alert.id} className="p-4 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0 mt-0.5">
                            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          </div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-snug">{alert.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 flex flex-col items-center">
                      <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mb-3">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Semua Terkendali</p>
                      <p className="text-xs text-slate-400 mt-1">Tidak ada isu darurat hari ini.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>

          {/* Peta Sebaran */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Live Map Proyek
              </h3>
            </div>
            <Card className="border-0 shadow-sm rounded-[24px] overflow-hidden bg-white dark:bg-slate-900">
              <CardContent className="p-2">
                {isLoading ? (
                  <div className="h-[300px] w-full flex items-center justify-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="rounded-[16px] overflow-hidden h-[300px]">
                    <DashboardMap projects={stats?.activeProjectsList || []} attendances={stats?.mapAttendances || []} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>

    </div>
  );
}
