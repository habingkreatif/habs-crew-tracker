'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { DashboardStats, DashboardActivity } from '@/domain/repositories/dashboard.repository';

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

  const statCards = [
    { title: 'Total Proyek Aktif', value: stats?.totalActiveProjects ?? '-', icon: Building2, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { title: 'Kru Aktif Terdaftar', value: stats?.totalActiveCrew ?? '-', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { title: 'Kru Hadir Hari Ini', value: stats?.totalAttendancesToday ?? '-', icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/20' },
    { title: 'Peringatan Over-budget', value: '0', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-900/30' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard Admin</h1>
        <p className="text-slate-500 mt-1">Ringkasan aktivitas proyek dan absensi kru lapangan.</p>
      </div>

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
                    <p className="text-3xl font-bold">{stat.value}</p>
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Progres Proyek Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Placeholder for charts or lists */}
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-xl border-slate-200 dark:border-slate-800 text-slate-400">
              Grafik Progres Proyek akan tampil di sini
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Aktivitas Kru Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 pb-2">
               {isLoading ? (
                 <div className="flex justify-center items-center h-32">
                   <Loader2 className="w-6 h-6 animate-spin text-primary" />
                 </div>
               ) : activities.length === 0 ? (
                 <div className="text-center text-slate-500 py-8 text-sm">
                   Belum ada aktivitas hari ini.
                 </div>
               ) : (
                 activities.map((act) => {
                   const initial = act.userName.charAt(0).toUpperCase();
                   const colorClass = act.type === 'CLOCK_IN' 
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' 
                      : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30';
                   const timeString = new Date(act.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

                   return (
                    <div key={act.id} className="flex items-start space-x-4 border-b pb-4 last:border-0 dark:border-slate-800">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${colorClass}`}>
                        {initial}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{act.userName} <span className="text-xs text-slate-400 font-normal">({act.userRole})</span></p>
                        <p className="text-xs text-slate-500 leading-snug mt-0.5">{act.description}</p>
                      </div>
                      <div className="text-xs font-semibold text-slate-400 shrink-0">
                        {timeString}
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
  );
}
