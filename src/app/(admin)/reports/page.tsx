'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LayoutGrid, List, Loader2, Calendar, MapPin, CheckCircle2, Clock, Image as ImageIcon, SearchX, LogOut } from 'lucide-react';
import { toast } from 'sonner';

interface CrewReport {
  userId: string;
  nama: string;
  role: string;
  attendance: {
    id: number;
    clockIn: string;
    clockOut: string | null;
    photoSelfieUrl: string;
    isVerified: boolean;
  } | null;
  tasks: Array<{
    id: number;
    namaPekerjaan: string;
    progressPercentage: number;
    photoProgresUrl: string | null;
    catatanTambahan: string | null;
    updatedAt: string;
  }>;
}

export default function ReportsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [reports, setReports] = useState<CrewReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'gallery'>('table');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId && selectedDate) {
      fetchReports();
    } else {
      setReports([]);
    }
  }, [selectedProjectId, selectedDate]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success) {
        setProjects(data.data);
        if (data.data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(String(data.data[0].id));
        }
      }
    } catch (err) {
      console.error('Failed to fetch projects', err);
    }
  };

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?projectId=${selectedProjectId}&date=${selectedDate}`);
      const data = await res.json();
      if (data.success) {
        setReports(data.data);
      } else {
        throw new Error(data.error?.message);
      }
    } catch (err: any) {
      toast.error('Gagal mengambil data laporan', { description: err.message });
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Laporan Pekerjaan (Crew Reports)</h1>
          <p className="text-slate-500">Pantau kehadiran dan progres kerja harian seluruh kru di lapangan.</p>
        </div>
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            className={`rounded-lg ${viewMode === 'table' ? 'shadow-sm' : 'text-slate-500'}`}
            onClick={() => setViewMode('table')}
          >
            <List className="w-4 h-4 mr-2" /> Tabel Lengkap
          </Button>
          <Button
            variant={viewMode === 'gallery' ? 'default' : 'ghost'}
            size="sm"
            className={`rounded-lg ${viewMode === 'gallery' ? 'shadow-sm' : 'text-slate-500'}`}
            onClick={() => setViewMode('gallery')}
          >
            <LayoutGrid className="w-4 h-4 mr-2" /> Galeri Visual
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Pilih Proyek</Label>
              <Select value={selectedProjectId} onValueChange={(v) => setSelectedProjectId(v || '')}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                  <SelectValue placeholder="Pilih Proyek...">
                    {selectedProjectId ? projects.find(p => String(p.id) === selectedProjectId)?.namaProyek : "Pilih Proyek..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {projects.map(p => (
                    <SelectItem key={p.id} value={String(p.id)} className="font-medium py-3">{p.namaProyek}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Tanggal Laporan</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex flex-col h-64 items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-slate-500 font-medium animate-pulse">Menarik data dari lapangan...</p>
        </div>
      ) : reports.length === 0 ? (
        <Card className="border-0 shadow-sm border-dashed border-2 border-slate-200 dark:border-slate-800 bg-transparent">
          <CardContent className="flex flex-col h-64 items-center justify-center text-slate-500">
            <SearchX className="w-12 h-12 mb-4 opacity-50" />
            <p className="font-semibold text-lg">Tidak ada laporan</p>
            <p className="text-sm">Belum ada kru yang absen atau mengirim laporan di tanggal ini.</p>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 dark:bg-slate-900/80">
                  <TableHead className="font-semibold whitespace-nowrap">Nama Kru</TableHead>
                  <TableHead className="font-semibold whitespace-nowrap">Kehadiran (Masuk - Pulang)</TableHead>
                  <TableHead className="font-semibold whitespace-nowrap">Progres Pekerjaan</TableHead>
                  <TableHead className="font-semibold whitespace-nowrap">Status Laporan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.userId} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    {/* Kru Info */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0 overflow-hidden border border-slate-200">
                          {report.attendance?.photoSelfieUrl ? (
                            <img src={report.attendance.photoSelfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100"><ImageIcon className="w-4 h-4" /></div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{report.nama}</p>
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">{report.role}</p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Attendance */}
                    <TableCell>
                      {report.attendance ? (
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-xs text-slate-500 mb-0.5 font-medium">Masuk</p>
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                              {formatTime(report.attendance.clockIn)}
                            </span>
                          </div>
                          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
                          <div className="text-center">
                            <p className="text-xs text-slate-500 mb-0.5 font-medium">Pulang</p>
                            {report.attendance.clockOut ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                                {formatTime(report.attendance.clockOut)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-500 text-xs font-bold border border-slate-200">
                                Belum
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-bold border border-rose-100">
                          Tidak Absen (Bolos)
                        </span>
                      )}
                    </TableCell>

                    {/* Tasks */}
                    <TableCell>
                      {report.tasks.length > 0 ? (
                        <div className="space-y-2 min-w-[200px]">
                          {report.tasks.map(task => (
                            <div key={task.id} className="text-sm">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{task.namaPekerjaan}</span>
                                <span className={`text-xs font-bold ${task.progressPercentage === 100 ? 'text-emerald-600' : 'text-primary'}`}>{task.progressPercentage}%</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div className={`h-1.5 rounded-full ${task.progressPercentage === 100 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${task.progressPercentage}%` }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Belum ada laporan kerja.</p>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {(() => {
                        const hasClockIn = !!report.attendance;
                        const hasClockOut = !!report.attendance?.clockOut;
                        const hasProgress = report.tasks.some(t => t.progressPercentage > 0);

                        if (!hasClockIn && !hasProgress) return <span className="text-xs font-bold text-rose-500">Mangkir</span>;
                        if (hasClockIn && !hasClockOut && !hasProgress) return <span className="text-xs font-bold text-amber-500">Bekerja (Belum Lapor)</span>;
                        if (hasClockIn && !hasClockOut && hasProgress) return <span className="text-xs font-bold text-blue-500">Progres Dilaporkan</span>;
                        if (hasClockIn && hasClockOut && hasProgress) return <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Selesai</span>;
                        return <span className="text-xs font-bold text-slate-500">Tidak Diketahui</span>;
                      })()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        /* GALLERY VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {reports.map((report) => (
            <Card key={report.userId} className="border-0 shadow-md hover:shadow-xl transition-all overflow-hidden flex flex-col">
              {/* Photo Header (Uses the latest task photo, or placeholder) */}
              <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden group">
                {report.tasks.length > 0 && report.tasks[0].photoProgresUrl ? (
                  <img src={report.tasks[0].photoProgresUrl} alt="Progres" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-xs font-medium">Tidak ada foto lapangan</span>
                  </div>
                )}

                {/* Floating Progress Badge */}
                {report.tasks.length > 0 && (
                  <div className="absolute top-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/20">
                    <span className="text-white font-black text-sm">{report.tasks[0].progressPercentage}%</span>
                  </div>
                )}
              </div>

              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex gap-4 items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0 overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm -mt-10 relative z-10">
                    {report.attendance?.photoSelfieUrl ? (
                      <img src={report.attendance.photoSelfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100"><ImageIcon className="w-5 h-5" /></div>
                    )}
                  </div>
                  <div className="pt-1">
                    <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{report.nama}</p>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">{report.role}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4 flex-1">
                  {report.tasks.length > 0 ? (
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Target Pekerjaan</p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-2">{report.tasks[0].namaPekerjaan}</p>
                      {report.tasks[0].catatanTambahan && (
                        <p className="text-xs text-slate-500 mt-1 italic">"{report.tasks[0].catatanTambahan}"</p>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg border border-rose-100 dark:border-rose-900/50">
                      <p className="text-xs text-rose-600 font-medium">Belum ada laporan pekerjaan yang disubmit hari ini.</p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-500">
                  <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-emerald-500" /> {formatTime(report.attendance?.clockIn)}</div>
                  <div className="flex items-center gap-1.5">{formatTime(report.attendance?.clockOut)} <LogOut className="w-3.5 h-3.5 text-blue-500" /></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
