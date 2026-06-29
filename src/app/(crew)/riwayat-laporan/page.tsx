'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Loader2, CheckCircle2, ChevronDown, ChevronUp, ClipboardList, FileSearch } from 'lucide-react';

interface DailyTaskReport {
  id: number;
  namaPekerjaan: string;
  tanggal: string;
  progressPercentage: number | null;
  photoProgresUrl: string | null;
  updatedAt: string;
}

type GroupedReports = Record<string, DailyTaskReport[]>;

export default function RiwayatLaporanPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [allReports, setAllReports] = useState<DailyTaskReport[]>([]);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      // Fix #3: fetch all tasks by userId only (no projectId needed)
      const res = await fetch(`/api/daily-tasks?userId=${user?.id}&all=true`, { cache: 'no-store' });
      const data = await res.json();

      if (data.success && data.data) {
        setAllReports(data.data);
      } else {
        setHasError(true);
      }
    } catch {
      // Fix #1: no console.error in final code
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDate = (dateStr: string) => {
    setExpandedDates(prev => ({
      ...prev,
      [dateStr]: !prev[dateStr]
    }));
  };

  // Fix #4: typed reduce, no `any`
  const groupedReports = allReports.reduce<GroupedReports>((acc, curr) => {
    const dStr = new Date(curr.tanggal).toISOString().split('T')[0];
    if (!acc[dStr]) acc[dStr] = [];
    acc[dStr].push(curr);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedReports).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const todayStr = new Date().toISOString().split('T')[0];
  const firstName = user?.nama ? user.nama.split(' ')[0] : 'kamu';

  // Auto-expand latest date on first render
  useEffect(() => {
    if (sortedDates.length > 0 && Object.keys(expandedDates).length === 0) {
      setExpandedDates({ [sortedDates[0]]: true });
    }
  }, [sortedDates.length]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32 font-sans relative overflow-hidden">
      {/* M-Banking Solid Header Background */}
      <div className="absolute top-0 left-0 w-full h-[240px] bg-primary rounded-b-[40px] z-0 shadow-lg overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-blue-500/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
      </div>

      {/* Header */}
      <div className="pt-6 pb-20 px-6 relative z-10">
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.push('/home')}
            className="w-10 h-10 flex items-center justify-center text-white/90 hover:text-white transition-all active:scale-90 shrink-0 -ml-2"
          >
            <ArrowLeft className="w-7 h-7 stroke-[2.5px] drop-shadow-md" />
          </button>
          <h1 className="text-lg font-extrabold text-white ml-1 drop-shadow-md tracking-tight">Riwayat Progres</h1>
        </div>
        <header className="flex justify-between items-start">
          <div>
            <p className="text-white/80 font-bold tracking-widest text-[10px] mb-1 uppercase drop-shadow-sm">Aktivitas Akun</p>
            <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-md">Riwayat Laporan</h1>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white shadow-sm shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
        </header>
      </div>

      <div className="px-5 space-y-6 relative z-20 -mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {isLoading ? (
          <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl shadow-primary/10 dark:shadow-black/50 flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm font-bold text-slate-400 animate-pulse">Memuat riwayat...</p>
          </div>
        ) : hasError ? (
          <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl shadow-primary/10 dark:shadow-black/50 flex flex-col items-center justify-center py-24 text-center px-6">
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mb-4">
              <FileSearch className="w-10 h-10 text-rose-300 dark:text-rose-600" />
            </div>
            <h2 className="text-xl font-black text-slate-700 dark:text-slate-200">Gagal Memuat</h2>
            <p className="text-sm font-medium text-slate-500 mt-2">Terjadi kesalahan saat mengambil data.</p>
            <button
              onClick={fetchHistory}
              className="mt-4 px-5 py-2 bg-primary text-white text-xs font-bold rounded-full"
            >
              Coba Lagi
            </button>
          </div>
        ) : allReports.length === 0 ? (
          /* Fix #8: Personalized empty state with user's name */
          <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl shadow-primary/10 dark:shadow-black/50 flex flex-col items-center justify-center py-24 text-center px-6">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 relative">
              <ClipboardList className="w-10 h-10 text-slate-300 dark:text-slate-600" />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                <span className="text-[10px] font-black text-primary">0</span>
              </div>
            </div>
            <h2 className="text-xl font-black text-slate-700 dark:text-slate-200">Halo, {firstName}!</h2>
            <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">
              Laporan progres yang sudah <span className="font-bold text-slate-700 dark:text-slate-300">{firstName}</span> kirimkan akan muncul di sini. Yuk mulai lapor hari ini!
            </p>
            <button
              onClick={() => router.push('/tugas')}
              className="mt-5 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-black rounded-full shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform"
            >
              Lapor Sekarang
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDates.map((dateStr) => {
              const dayReports = groupedReports[dateStr];
              const isExpanded = expandedDates[dateStr];
              const dateObj = new Date(dateStr);
              const formattedDate = dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

              return (
                <div key={dateStr} className="space-y-2">
                  {/* Day Header */}
                  <button
                    onClick={() => toggleDate(dateStr)}
                    className="w-full flex items-center justify-between p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-[20px] shadow-sm hover:bg-white dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="text-left">
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                        {dateStr === todayStr ? 'Hari Ini' : formattedDate}
                      </p>
                      <p className="text-[10px] font-medium text-slate-500 mt-0.5">{dayReports.length} laporan dikirim</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {/* Day Reports List (Collapsible) */}
                  {isExpanded && (
                    <div className="space-y-3 pl-2 pr-2 pb-2 animate-in slide-in-from-top-2 fade-in duration-300">
                      {dayReports.map((report) => (
                        <Card key={report.id} className="border-0 bg-white dark:bg-slate-900 shadow-md shadow-slate-200/50 dark:shadow-none rounded-[20px] overflow-hidden relative">
                          {report.progressPercentage === 100 && (
                            <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500/10 rounded-bl-[20px]"></div>
                          )}
                          <CardContent className="p-4 flex gap-4 items-center">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 relative border border-slate-100 dark:border-slate-700">
                              {report.photoProgresUrl ? (
                                <img src={report.photoProgresUrl} alt="Foto progres" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                  <CheckCircle2 className="w-6 h-6" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-sm text-slate-800 dark:text-slate-200 line-clamp-1">{report.namaPekerjaan}</p>
                              <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                {new Date(report.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-[10px] font-black tracking-wider ${(report.progressPercentage ?? 0) === 100
                                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-primary/10 text-primary border border-primary/20'
                              }`}>
                                {report.progressPercentage ?? 0}%
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
