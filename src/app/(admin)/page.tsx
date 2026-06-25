'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      router.push('/home');
    }
  }, [isAuthenticated, user, router]);
  const stats = [
    { title: 'Total Proyek Aktif', value: '3', icon: Building2, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { title: 'Mandor Bertugas', value: '5', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { title: 'Tukang Hadir Hari Ini', value: '24', icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/20' },
    { title: 'Peringatan Over-budget', value: '0', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-900/30' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard Admin</h1>
        <p className="text-slate-500 mt-1">Ringkasan aktivitas proyek dan absensi kru lapangan.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="border-0 shadow-sm transition-all hover:shadow-md">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
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
            <CardTitle>Aktivitas Mandor Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
             {/* Placeholder for list */}
             <div className="space-y-4">
              <div className="flex items-center space-x-4 border-b pb-4 last:border-0 dark:border-slate-800">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">A</div>
                <div>
                  <p className="text-sm font-medium">Andi (Mandor)</p>
                  <p className="text-xs text-slate-500">Clock-in di Proyek Ruko pada 07:15</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 border-b pb-4 last:border-0 dark:border-slate-800">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">B</div>
                <div>
                  <p className="text-sm font-medium">Budi (Mandor)</p>
                  <p className="text-xs text-slate-500">Kunci Target di Proyek Perumahan</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
