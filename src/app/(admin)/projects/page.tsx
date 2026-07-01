'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, MapPin, CalendarDays, Loader2, Navigation, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: number;
  namaProyek: string;
  alamat: string | null;
  latitude: number;
  longitude: number;
  radiusMeter: number;
  estimasiDurasiHari: number;
  status: string;
  jamKerjaMulai: string;
  jamKerjaSelesai: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    namaProyek: '',
    alamat: '',
    latitude: '',
    longitude: '',
    radiusMeter: '50',
    estimasiDurasiHari: '30',
    jamKerjaMulai: '08:00',
    jamKerjaSelesai: '17:00'
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success) {
        setProjects(data.data);
      } else {
        throw new Error(data.error?.message);
      }
    } catch (err: any) {
      toast.error('Gagal mengambil data proyek', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Browser tidak mendukung akses lokasi');
      return;
    }

    toast.info('Sedang mengambil lokasi...', { id: 'location-toast' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude)
        }));
        toast.success('Lokasi berhasil diambil', { id: 'location-toast' });
      },
      (err) => {
        toast.error('Gagal mengambil lokasi: ' + err.message, { id: 'location-toast' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({ namaProyek: '', alamat: '', latitude: '', longitude: '', radiusMeter: '50', estimasiDurasiHari: '30', jamKerjaMulai: '08:00', jamKerjaSelesai: '17:00' });
    setIsModalOpen(true);
  };

  const handleEdit = (project: Project) => {
    setEditingId(project.id);
    setFormData({
      namaProyek: project.namaProyek,
      alamat: project.alamat || '',
      latitude: project.latitude.toString(),
      longitude: project.longitude.toString(),
      radiusMeter: project.radiusMeter.toString(),
      estimasiDurasiHari: project.estimasiDurasiHari.toString(),
      jamKerjaMulai: project.jamKerjaMulai,
      jamKerjaSelesai: project.jamKerjaSelesai
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingId ? `/api/projects/${editingId}` : '/api/projects';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namaProyek: formData.namaProyek,
          alamat: formData.alamat,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          radiusMeter: parseInt(formData.radiusMeter, 10),
          estimasiDurasiHari: parseInt(formData.estimasiDurasiHari, 10),
          jamKerjaMulai: formData.jamKerjaMulai,
          jamKerjaSelesai: formData.jamKerjaSelesai,
          status: 'on-track'
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? 'Proyek berhasil diperbarui' : 'Proyek berhasil ditambahkan');
        setIsModalOpen(false);
        setEditingId(null);
        fetchProjects();
        setFormData({ namaProyek: '', alamat: '', latitude: '', longitude: '', radiusMeter: '50', estimasiDurasiHari: '30', jamKerjaMulai: '08:00', jamKerjaSelesai: '17:00' });
      } else {
        throw new Error(data.error?.message || (editingId ? 'Gagal mengedit proyek' : 'Gagal menambahkan proyek'));
      }
    } catch (err: any) {
      toast.error('Gagal', { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus proyek ini? (Aksi ini tidak bisa dibatalkan)')) return;
    
    const toastId = toast.loading('Menghapus proyek...');
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Proyek berhasil dihapus', { id: toastId });
        setProjects(prev => prev.filter(p => p.id !== id));
      } else {
        throw new Error(data.error?.message || 'Gagal menghapus');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus proyek', { id: toastId });
    }
  };

  const filteredProjects = projects.filter(p => 
    p.namaProyek.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.alamat && p.alamat.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 p-4 md:p-0 pb-24 md:pb-0">
      {/* =========================================================
          1. DESKTOP VIEW (Table)
      ========================================================= */}
      <div className="hidden md:block space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Manajemen Proyek</h1>
            <p className="text-slate-500">Kelola daftar proyek, koordinat lokasi, dan radius geofence.</p>
          </div>

          <Button className="shadow-md hover:shadow-lg transition-all" size="lg" onClick={handleAddNew}>
            <Plus className="w-5 h-5 mr-2" /> Tambah Proyek Baru
          </Button>
        </div>
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between py-3">
            <CardTitle className="text-lg">Daftar Proyek Aktif</CardTitle>
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input 
                className="pl-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm" 
                placeholder="Cari proyek atau lokasi..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-48 text-slate-500">
                <Building2 className="w-10 h-10 mb-2 opacity-50" />
                <p>Tidak ada proyek yang sesuai pencarian</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                    <TableHead className="font-semibold">Nama Proyek</TableHead>
                    <TableHead className="font-semibold">Lokasi & Radius</TableHead>
                    <TableHead className="font-semibold">Durasi Estimasi</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-900/80 transition-colors">
                      <TableCell className="font-medium">{project.namaProyek}</TableCell>
                      <TableCell>
                        <div className="flex items-center text-slate-500">
                          <MapPin className="w-4 h-4 mr-1 text-emerald-500" />
                          <span className="text-xs truncate max-w-[150px]">{project.alamat || 'Tidak ada alamat'}</span>
                          <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px]">
                            {project.radiusMeter}m
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-slate-500 text-sm gap-1">
                          <div className="flex items-center"><CalendarDays className="w-4 h-4 mr-2" />{project.estimasiDurasiHari} Hari</div>
                          <div className="text-xs font-semibold text-slate-400">Jam Kerja: {project.jamKerjaMulai} - {project.jamKerjaSelesai}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${project.status === 'on-track'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                          }`}>
                          {project.status.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10 px-3" onClick={() => handleEdit(project)}>Edit</Button>
                          <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3" onClick={() => handleDelete(project.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* =========================================================
          2. MOBILE VIEW (M-Banking Cards)
      ========================================================= */}
      <div className="block md:hidden space-y-6">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              className="pl-11 h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-base w-full" 
              placeholder="Cari proyek..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            className="w-12 h-12 shrink-0 rounded-2xl shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center active:scale-[0.98] transition-transform" 
            onClick={handleAddNew}
            size="icon"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-20 text-slate-500 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <p className="font-bold text-slate-700 dark:text-slate-300">Tidak Ditemukan</p>
              <p className="text-xs mt-1">Coba gunakan kata kunci lain.</p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div key={project.id} className="bg-white dark:bg-slate-900 rounded-[24px] p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div className="flex gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base line-clamp-2 leading-tight">{project.namaProyek}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{project.alamat || 'Tanpa alamat'}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${project.status === 'on-track'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                  }`}>
                    {project.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Radius</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{project.radiusMeter} Meter</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Jam Kerja</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{project.jamKerjaMulai} - {project.jamKerjaSelesai}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-xl h-11 font-bold text-slate-600 dark:text-slate-300" onClick={() => handleEdit(project)}>
                    Edit
                  </Button>
                  <Button variant="outline" className="w-11 h-11 rounded-xl border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600 shrink-0" onClick={() => handleDelete(project.id)}>
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* =========================================================
          3. SHARED MODAL (Add / Edit Project)
      ========================================================= */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) setEditingId(null);
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Proyek' : 'Tambah Proyek Baru'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="namaProyek" className="text-sm font-bold text-slate-700 dark:text-slate-300">Nama Proyek</Label>
              <Input id="namaProyek" className="h-12 rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 text-base font-medium px-4 focus-visible:ring-emerald-500" required value={formData.namaProyek} onChange={e => setFormData({ ...formData, namaProyek: e.target.value })} placeholder="Contoh: Proyek A" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alamat" className="text-sm font-bold text-slate-700 dark:text-slate-300">Alamat / Detail Lokasi</Label>
              <Input id="alamat" className="h-12 rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 text-base font-medium px-4 focus-visible:ring-emerald-500" value={formData.alamat} onChange={e => setFormData({ ...formData, alamat: e.target.value })} placeholder="Contoh: Jl. Sudirman" />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border space-y-3">
              <div className="flex justify-between items-center">
                <Label className="font-semibold text-primary">Koordinat GPS</Label>
                <Button type="button" size="sm" variant="outline" onClick={handleGetLocation} className="h-8 text-xs bg-white dark:bg-slate-950">
                  <Navigation className="w-3 h-3 mr-1" />
                  Ambil Lokasi Saat Ini
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude" className="text-xs">Latitude</Label>
                  <Input id="latitude" required type="number" step="any" value={formData.latitude} onChange={e => setFormData({ ...formData, latitude: e.target.value })} placeholder="-6.2088" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude" className="text-xs">Longitude</Label>
                  <Input id="longitude" required type="number" step="any" value={formData.longitude} onChange={e => setFormData({ ...formData, longitude: e.target.value })} placeholder="106.8456" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="radiusMeter">Radius Geofence (Meter)</Label>
                <Input id="radiusMeter" required type="number" min="10" value={formData.radiusMeter} onChange={e => setFormData({ ...formData, radiusMeter: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimasiDurasiHari">Estimasi Durasi (Hari)</Label>
                <Input id="estimasiDurasiHari" required type="number" min="1" value={formData.estimasiDurasiHari} onChange={e => setFormData({ ...formData, estimasiDurasiHari: e.target.value })} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jamKerjaMulai">Jam Masuk (HH:mm)</Label>
                <Input id="jamKerjaMulai" required type="time" value={formData.jamKerjaMulai} onChange={e => setFormData({ ...formData, jamKerjaMulai: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jamKerjaSelesai">Jam Pulang (HH:mm)</Label>
                <Input id="jamKerjaSelesai" required type="time" value={formData.jamKerjaSelesai} onChange={e => setFormData({ ...formData, jamKerjaSelesai: e.target.value })} />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Simpan Proyek
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Temporary icon definition since it's missing in import
function Building2(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" /></svg>
}
