'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, CalendarDays, Loader2, MapPin, CheckSquare } from 'lucide-react';

export default function RiwayatPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      // limit=all will fetch up to 365 days based on API route logic
      const res = await fetch(`/api/attendance/history?userId=${user?.id}&limit=all`);
      const data = await res.json();

      if (data.success && data.data) {
        setHistory(data.data);
      }
    } catch (err) {
      console.error('Gagal fetch data riwayat:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32 font-sans relative overflow-hidden">
      {/* M-Banking Solid Header Background */}
      <div className="absolute top-0 left-0 w-full h-[220px] bg-primary rounded-b-[40px] z-0 shadow-lg overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-blue-500/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
      </div>

      {/* Header Clean Light */}
      <div className="pt-10 pb-20 px-4 relative z-10">
        <header className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 border border-white/30 shadow-sm shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <p className="text-white/80 font-bold tracking-widest text-[10px] mb-0.5 uppercase drop-shadow-sm">Aktivitas Akun</p>
            <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-md">Mutasi Kehadiran</h1>
          </div>
        </header>
      </div>

      <div className="px-5 space-y-6 relative z-20 -mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white dark:bg-slate-900 rounded-[28px] p-2 shadow-2xl shadow-primary/10 dark:shadow-black/20 border border-slate-100 dark:border-slate-800">

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <CalendarDays className="w-16 h-16 text-slate-300 mb-4" />
              <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Belum Ada Riwayat</h2>
              <p className="text-sm text-slate-500 mt-2">Data kehadiran kamu akan muncul di sini.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {history.map((record: any) => (
                <div key={record.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors first:rounded-t-[20px] last:rounded-b-[20px] active:bg-slate-100">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${record.clockOut ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-0.5 truncate">
                      {record.namaProyek || 'Proyek Lapangan'}
                    </p>
                    <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                      {new Date(record.clockIn).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
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
                        Belum Pulang
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
