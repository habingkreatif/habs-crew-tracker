'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, CalendarDays, Loader2, MapPin } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 sticky top-0 z-50 flex items-center gap-4 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-lg font-black text-slate-800 dark:text-slate-100">Semua Riwayat Kehadiran</h1>
          <p className="text-xs font-medium text-slate-500">Log absen selama ini</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
             <CalendarDays className="w-16 h-16 text-slate-300 mb-4" />
             <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Belum Ada Riwayat</h2>
             <p className="text-sm text-slate-500 mt-2">Data kehadiran kamu akan muncul di sini setelah kamu melakukan absen.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((record: any) => (
              <Card key={record.id} className="border-0 shadow-md shadow-slate-200/50 dark:shadow-black/50 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden hover:scale-[1.01] transition-all">
                <CardContent className="p-0">
                  <div className="flex border-b border-slate-100 dark:border-slate-800/50">
                     <div className="bg-slate-100 dark:bg-slate-800/50 p-4 flex flex-col items-center justify-center min-w-[80px]">
                        <span className="text-sm font-black text-slate-700 dark:text-slate-300">
                          {new Date(record.clockIn).toLocaleDateString('id-ID', { day: '2-digit' })}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {new Date(record.clockIn).toLocaleDateString('id-ID', { month: 'short' })}
                        </span>
                     </div>
                     <div className="p-4 flex-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Lokasi Proyek
                        </p>
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{record.namaProyek || 'Proyek Lapangan'}</p>
                     </div>
                  </div>
                  <div className="bg-white/50 dark:bg-black/20 p-4 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jam Masuk</p>
                      <p className="font-black text-emerald-600 text-lg">
                        {new Date(record.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jam Pulang</p>
                      {record.clockOut ? (
                        <p className="font-black text-blue-600 text-lg">
                          {new Date(record.clockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      ) : (
                        <p className="font-bold text-slate-300 text-sm mt-1 uppercase">Belum Pulang</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
