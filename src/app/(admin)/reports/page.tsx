'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LayoutGrid, List, Loader2, Calendar, MapPin, CheckCircle2, Clock, Image as ImageIcon, SearchX, LogOut, Users, Table2, Filter, X } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [lightboxImage, setLightboxImage] = useState<{url: string, title: string, subtitle?: string} | null>(null);

  const [reports, setReports] = useState<CrewReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'gallery'>('table');
  const [activeSlides, setActiveSlides] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId && selectedDate) {
      fetchReports();
      setSelectedUserId('all'); // Reset user filter when project/date changes
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

  const filteredReports = selectedUserId === 'all'
    ? reports
    : reports.filter(r => r.userId === selectedUserId);

  return (
    <div className="space-y-6 p-4 md:p-0 pb-24 md:pb-0">

      {/* FULLSCREEN LIGHTBOX */}
      {lightboxImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
            <div>
              <h3 className="text-white font-bold">{lightboxImage.title}</h3>
              {lightboxImage.subtitle && <p className="text-white/70 text-sm">{lightboxImage.subtitle}</p>}
            </div>
            <button 
              onClick={() => setLightboxImage(null)}
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white backdrop-blur-md active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <img src={lightboxImage.url} className="max-w-full max-h-full object-contain p-4" alt="Fullscreen" />
        </div>
      )}

      {/* =========================================================
          1. DESKTOP VIEW
      ========================================================= */}
      <div className="hidden md:block space-y-6">
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
              <div className="space-y-2 md:col-span-1">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Tanggal Laporan</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"
                />
              </div>
              <div className="space-y-2 md:col-span-1">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Filter Kru</Label>
                <Select value={selectedUserId} onValueChange={(v) => setSelectedUserId(v || 'all')} disabled={reports.length === 0}>
                  <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <SelectValue placeholder="Semua Kru">
                      {selectedUserId === 'all' ? 'Semua Kru' : reports.find(r => r.userId === selectedUserId)?.nama || 'Semua Kru'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all" className="font-medium py-3">Semua Kru</SelectItem>
                    {reports.map(r => (
                      <SelectItem key={r.userId} value={r.userId} className="font-medium py-3">{r.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
        ) : filteredReports.length === 0 ? (
          <Card className="border-0 shadow-sm border-dashed border-2 border-slate-200 dark:border-slate-800 bg-transparent">
            <CardContent className="flex flex-col h-64 items-center justify-center text-slate-500">
              <SearchX className="w-12 h-12 mb-4 opacity-50" />
              <p className="font-semibold text-lg">Tidak ada laporan</p>
              <p className="text-sm">Belum ada data untuk kriteria filter ini.</p>
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
                  {filteredReports.map((report) => (
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
            {(() => {
              type GalleryItem = {
                id: string;
                userId: string;
                nama: string;
                role: string;
                attendance: CrewReport['attendance'];
                task: CrewReport['tasks'][number] | null;
              };

              const galleryItems = filteredReports.reduce<GalleryItem[]>((acc, report) => {
                if (report.tasks.length === 0) {
                  acc.push({
                    id: `empty-${report.userId}`,
                    userId: report.userId,
                    nama: report.nama,
                    role: report.role,
                    attendance: report.attendance,
                    task: null
                  });
                } else {
                  report.tasks.forEach(task => {
                    acc.push({
                      id: `task-${task.id}`,
                      userId: report.userId,
                      nama: report.nama,
                      role: report.role,
                      attendance: report.attendance,
                      task: task
                    });
                  });
                }
                return acc;
              }, []);

              return galleryItems.map((item) => (
                <Card key={item.id} className="border-0 shadow-md hover:shadow-xl transition-all overflow-hidden flex flex-col">
                  <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden group">
                    {item.task?.photoProgresUrl ? (
                      <img src={item.task.photoProgresUrl} alt="Progres" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-xs font-medium">Tidak ada foto lapangan</span>
                      </div>
                    )}

                    {item.task && (
                      <div className="absolute top-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/20">
                        <span className="text-white font-black text-sm">{item.task.progressPercentage}%</span>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-5 flex-1 flex flex-col">
                    <div className="flex gap-4 items-start mb-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0 overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm -mt-10 relative z-10">
                        {item.attendance?.photoSelfieUrl ? (
                          <img src={item.attendance.photoSelfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100"><ImageIcon className="w-5 h-5" /></div>
                        )}
                      </div>
                      <div className="pt-1">
                        <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{item.nama}</p>
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">{item.role}</p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4 flex-1">
                      {item.task ? (
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Target Pekerjaan</p>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-2">{item.task.namaPekerjaan}</p>
                          {item.task.catatanTambahan && (
                            <p className="text-xs text-slate-500 mt-1 italic">"{item.task.catatanTambahan}"</p>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg border border-rose-100 dark:border-rose-900/50">
                          <p className="text-xs text-rose-600 font-medium">Belum ada laporan pekerjaan yang disubmit hari ini.</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-500">
                      <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-emerald-500" /> {formatTime(item.attendance?.clockIn)}</div>
                      <div className="flex items-center gap-1.5">{formatTime(item.attendance?.clockOut)} <LogOut className="w-3.5 h-3.5 text-blue-500" /></div>
                    </div>
                  </CardContent>
                </Card>
              ));
            })()}
          </div>
        )}
      </div>

      {/* =========================================================
          2. MOBILE VIEW
      ========================================================= */}
      <div className="md:hidden">
        {/* MOBILE FILTERS */}
        <div className="mb-6 flex flex-col gap-4">
          
          {/* Tab-Style Dropdowns Row & Date Chips */}
          <div className="flex overflow-x-auto gap-4 border-b border-slate-200 dark:border-slate-800 px-4 -mx-4 scrollbar-hide items-end">
            
            {/* Project Filter */}
            <Select value={selectedProjectId} onValueChange={(v) => setSelectedProjectId(v || '')}>
              <SelectTrigger className="border-0 !border-b-[2px] !border-blue-600 dark:!border-blue-400 rounded-none bg-transparent shadow-none px-1 h-auto pb-3 text-sm font-semibold text-blue-600 dark:text-blue-400 focus:ring-0 focus:ring-offset-0 whitespace-nowrap outline-none relative hover:bg-transparent">
                <div className="flex items-center gap-1.5">
                  {selectedProjectId ? (
                    <span className="truncate max-w-[120px]">{projects.find(p => String(p.id) === selectedProjectId)?.namaProyek}</span>
                  ) : (
                    <>Semua Proyek <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">{projects.length}</span></>
                  )}
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="" className="font-bold py-3 text-blue-600">Semua Proyek</SelectItem>
                {projects.map(p => (
                  <SelectItem key={p.id} value={String(p.id)} className="font-medium py-3">{p.namaProyek}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Crew Filter */}
            <Select value={selectedUserId} onValueChange={(v) => setSelectedUserId(v || 'all')} disabled={reports.length === 0}>
              <SelectTrigger className="border-0 !border-b-[2px] !border-emerald-600 dark:!border-emerald-400 rounded-none bg-transparent shadow-none px-1 h-auto pb-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400 focus:ring-0 focus:ring-offset-0 whitespace-nowrap outline-none relative hover:bg-transparent">
                <div className="flex items-center gap-1.5">
                  {selectedUserId !== 'all' ? (
                    <span className="truncate max-w-[100px]">{reports.find(r => r.userId === selectedUserId)?.nama.split(' ')[0]}</span>
                  ) : (
                    <>Semua Kru <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">{reports.length}</span></>
                  )}
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all" className="font-bold py-3 text-emerald-600">Semua Kru</SelectItem>
                {reports.map(r => (
                  <SelectItem key={r.userId} value={r.userId} className="font-medium py-3 line-clamp-1">{r.nama.split(' ')[0]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 shrink-0 mx-1 mb-3"></div>

            {/* Hari Ini */}
            <button 
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className={`border-0 border-b-[2px] rounded-none bg-transparent shadow-none px-1 h-auto pb-3 text-sm font-semibold transition-all shrink-0 hover:bg-transparent ${
                selectedDate === new Date().toISOString().split('T')[0] 
                ? 'border-slate-800 text-slate-800 dark:border-slate-100 dark:text-slate-100' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Hari Ini
            </button>
            
            {/* Kemarin */}
            <button 
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() - 1);
                setSelectedDate(d.toISOString().split('T')[0]);
              }}
              className={`border-0 border-b-[2px] rounded-none bg-transparent shadow-none px-1 h-auto pb-3 text-sm font-semibold transition-all shrink-0 hover:bg-transparent ${
                selectedDate === new Date(new Date().setDate(new Date().getDate()-1)).toISOString().split('T')[0]
                ? 'border-slate-800 text-slate-800 dark:border-slate-100 dark:text-slate-100' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Kemarin
            </button>
            
            {/* Pilih Tanggal Lain */}
            <div className={`relative inline-flex items-center shrink-0 border-0 border-b-[2px] rounded-none bg-transparent shadow-none px-1 h-auto pb-3 transition-all ${
                ![new Date().toISOString().split('T')[0], new Date(new Date().setDate(new Date().getDate()-1)).toISOString().split('T')[0]].includes(selectedDate)
                ? 'border-slate-800 text-slate-800 dark:border-slate-100 dark:text-slate-100' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}>
              <Calendar className="w-4 h-4 absolute left-1 z-10 pointer-events-none transition-colors" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-7 p-0 border-0 bg-transparent shadow-none h-auto text-sm font-semibold focus-visible:ring-0 [&::-webkit-calendar-picker-indicator]:invert-0 dark:[&::-webkit-calendar-picker-indicator]:invert cursor-pointer w-[110px]"
              />
            </div>

            <div className="w-1 shrink-0"></div>
          </div>
        </div>

        {/* MOBILE LIST */}
        {isLoading ? (
          <div className="flex flex-col h-64 items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
            <p className="text-slate-500 font-medium animate-pulse">Menarik data dari lapangan...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-slate-400 mt-10">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <SearchX className="w-10 h-10" />
            </div>
            <p className="font-bold text-slate-600 dark:text-slate-300 text-lg">Tidak Ada Laporan</p>
            <p className="text-sm text-center mt-1">Belum ada kru yang absen atau lapor hari ini.</p>
          </div>
        ) : (
          <div className="flex flex-col border-t border-slate-100 dark:border-slate-800/60 mt-2 -mx-4">
            {filteredReports.map((report) => (
              <div key={report.userId} className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/60 flex flex-col overflow-hidden">
                
                {/* INSTAGRAM HEADER */}
                {(() => {
                  const hasClockIn = !!report.attendance;
                  const hasProgress = report.tasks.some(t => t.progressPercentage > 0);
                  const isComplete = hasClockIn && !!report.attendance?.clockOut && hasProgress;
                  const ringColor = !hasClockIn 
                    ? 'ring-rose-500' 
                    : isComplete 
                      ? 'ring-emerald-500' 
                      : hasProgress 
                        ? 'ring-blue-500' 
                        : 'ring-amber-400';
                  return (
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* Avatar with status ring */}
                        <div
                          className={`w-10 h-10 rounded-full ring-2 ring-offset-2 dark:ring-offset-slate-900 ${ringColor} bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center cursor-pointer shrink-0`}
                          onClick={() => report.attendance?.photoSelfieUrl && setLightboxImage({ url: report.attendance.photoSelfieUrl, title: `Selfie: ${report.nama}`, subtitle: formatTime(report.attendance.clockIn) })}
                        >
                          {report.attendance?.photoSelfieUrl ? (
                            <img src={report.attendance.photoSelfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-bold text-slate-400 text-sm">{report.nama.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[15px] leading-tight">{report.nama}</h3>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">{report.role}</p>
                        </div>
                      </div>
                      {/* Clean minimal time display */}
                      <div className="flex flex-col items-end gap-1">
                        {report.attendance ? (
                          <>
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                              <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                              {formatTime(report.attendance.clockIn)}
                            </div>
                            <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${report.attendance.clockOut ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
                              <LogOut className={`w-3 h-3 shrink-0 ${report.attendance.clockOut ? 'text-blue-500' : 'text-slate-300 dark:text-slate-600'}`} />
                              {report.attendance.clockOut ? formatTime(report.attendance.clockOut) : '--:--'}
                            </div>
                          </>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full">Tidak Hadir</span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* CAROUSEL */}
                <div 
                  className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                  onScroll={(e) => {
                    const el = e.currentTarget;
                    const index = Math.round(el.scrollLeft / el.offsetWidth);
                    setActiveSlides(prev => ({ ...prev, [report.userId]: index }));
                  }}
                >
                  {report.tasks.length > 0 ? (
                    report.tasks.map((task, index) => (
                      <div key={task.id} className="min-w-full snap-center flex flex-col">
                        {/* Media */}
                        <div className="relative w-full aspect-square bg-slate-100 dark:bg-slate-950 overflow-hidden">
                          {task.photoProgresUrl ? (
                            <img 
                              src={task.photoProgresUrl} 
                              className="w-full h-full object-cover cursor-pointer" 
                              alt="Progres" 
                              onClick={() => setLightboxImage({ url: task.photoProgresUrl!, title: task.namaPekerjaan, subtitle: `Progres: ${task.progressPercentage}% - ${report.nama}` })}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                              <ImageIcon className="w-10 h-10 opacity-20 mb-2" />
                              <p className="text-xs font-medium">Tanpa Foto Progres</p>
                            </div>
                          )}
                          {/* Cinematic gradient overlay */}
                          {task.photoProgresUrl && (
                            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                          )}
                          {/* Progress Badge */}
                          <div className={`absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-black backdrop-blur-md shadow-lg ${task.progressPercentage === 100 ? 'bg-emerald-500 text-white' : 'bg-white/90 text-slate-900'}`}>
                            {task.progressPercentage}%
                          </div>
                        </div>
                        {/* Caption */}
                        <div className="px-4 pt-3 pb-4">
                          {/* Progress bar */}
                          <div className="flex items-center gap-2.5 mb-3">
                            <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${task.progressPercentage === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                style={{ width: `${task.progressPercentage}%` }}
                              />
                            </div>
                            <span className={`text-[11px] font-black shrink-0 ${task.progressPercentage === 100 ? 'text-emerald-500' : 'text-blue-500'}`}>
                              {task.progressPercentage}%
                            </span>
                          </div>
                          {/* Text caption */}
                          <p className="text-sm leading-relaxed">
                            <span className="font-bold text-slate-900 dark:text-slate-100 mr-1.5">{report.nama.split(' ')[0]}</span>
                            <span className="text-slate-600 dark:text-slate-400">{task.namaPekerjaan}</span>
                          </p>
                          {task.catatanTambahan && (
                            <p className="text-slate-400 dark:text-slate-500 text-[12px] mt-1.5 italic leading-relaxed">"{task.catatanTambahan}"</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : report.attendance ? (
                    <div className="min-w-full snap-center flex flex-col items-center justify-center text-slate-400 p-12 text-center bg-amber-50 dark:bg-amber-950/20 aspect-square">
                      <Clock className="w-10 h-10 opacity-20 mb-3 text-amber-500" />
                      <p className="text-sm font-bold text-amber-700 dark:text-amber-500">Sedang Bekerja</p>
                      <p className="text-xs text-amber-600/70 mt-2 max-w-[200px]">Belum ada laporan progres dari kru ini.</p>
                    </div>
                  ) : (
                    <div className="min-w-full snap-center flex flex-col items-center justify-center text-slate-400 p-12 text-center bg-rose-50 dark:bg-rose-950/20 aspect-square">
                      <LogOut className="w-10 h-10 opacity-20 mb-3 text-rose-500" />
                      <p className="text-sm font-bold text-rose-700 dark:text-rose-500">Tidak Hadir</p>
                      <p className="text-xs text-rose-600/70 mt-2 max-w-[200px]">Kru ini tidak absen masuk hari ini.</p>
                    </div>
                  )}
                </div>

                {/* Dot Indicators — Instagram style */}
                {report.tasks.length > 0 && (
                  <div className="flex justify-center items-center gap-1.5 py-2.5">
                    {(() => {
                      const total = report.tasks.length;
                      const activeIndex = activeSlides[report.userId] ?? 0;
                      
                      // Jika laporan sedikit (<= 5), tampilkan semua titik secara normal
                      if (total <= 5) {
                        return report.tasks.map((_, i) => (
                          <div key={i} className={`rounded-full transition-all duration-300 ${i === activeIndex ? 'w-3.5 h-1.5 bg-blue-500' : 'w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600'}`} />
                        ));
                      }

                      // Logika Jendela Geser (Sliding Window) ala Instagram jika laporan banyak
                      const visibleDots = 5;
                      let start = Math.max(0, activeIndex - 2);
                      let end = start + visibleDots - 1;
                      
                      // Jaga agar window tidak melebihi batas indeks
                      if (end >= total) {
                        end = total - 1;
                        start = Math.max(0, end - visibleDots + 1);
                      }

                      return Array.from({ length: total }).map((_, i) => {
                        const isActive = i === activeIndex;
                        const isVisible = i >= start && i <= end;
                        // Titik yang ada di paling pinggir window dibuat mengecil
                        const isEdge = (i === start && start > 0) || (i === end && end < total - 1);
                        
                        if (!isVisible) return null;

                        return (
                          <div 
                            key={i} 
                            className={`rounded-full transition-all duration-300 ${
                              isActive ? 'w-3.5 h-1.5 bg-blue-500' : 
                              isEdge ? 'w-1 h-1 bg-slate-300 dark:bg-slate-600 opacity-60' : 
                              'w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600'
                            }`} 
                          />
                        );
                      });
                    })()}
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
