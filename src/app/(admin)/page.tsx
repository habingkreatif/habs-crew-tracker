'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Building2, TrendingUp, AlertCircle, Loader2, MapPin, Trophy, Clock, AlertTriangle, Info, Banknote } from 'lucide-react';
import { DashboardStats, DashboardActivity } from '@/domain/repositories/dashboard.repository';
import dynamic from 'next/dynamic';

// Load MapComponent dynamically with ssr disabled
const DashboardMap = dynamic(() => import('@/components/DashboardMap'), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse flex items-center justify-center text-slate-400">Memuat Peta...</div>
});

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    <div className="space-y-8 animate-in-up">
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
  );
}
