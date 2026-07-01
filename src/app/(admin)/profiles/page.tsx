'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, UserPlus, Loader2, HardHat, Pencil, Trash2, Search, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface Profile {
  id: string;
  nama: string;
  nik: string | null;
  noHp: string | null;
  role: string;
  status: string;
  spesialisasi: string | null;
  alamat: string | null;
  upahPerJam: number;
}

function MobileProfileCard({ profile, onEdit, onDelete }: { profile: Profile, onEdit: (p: Profile) => void, onDelete: (id: string) => void }) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - startXRef.current;
    if (diff < 0) {
      setTranslateX(Math.max(diff, -100)); // Maksimal geser ke kiri 100px
    } else {
      setTranslateX(0); // Cegah geser ke kanan
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (translateX < -50) {
      setTranslateX(-80); // Kalau digeser cukup jauh, buka menu hapus
    } else {
      setTranslateX(0); // Tutup lagi
    }
  };

  return (
    <div className="relative mb-3 overflow-hidden rounded-2xl">
      {/* BACKGROUND ACTIONS (HAPUS) */}
      <div
        className="absolute inset-0 bg-rose-500 rounded-2xl flex justify-end items-center pr-6 cursor-pointer"
        onClick={() => onDelete(profile.id)}
      >
        <div className="flex flex-col items-center text-white active:scale-95 transition-transform">
          <Trash2 className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">Hapus</span>
        </div>
      </div>

      {/* FOREGROUND CARD */}
      <div
        className={`relative bg-white dark:bg-slate-900 p-4 shadow-sm border border-slate-100/60 dark:border-slate-800/60 flex items-center gap-4 ${isDragging ? '' : 'transition-transform duration-300'}`}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (translateX === 0) onEdit(profile);
          else setTranslateX(0); // Klik untuk menutup menu hapus
        }}
      >
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <span className="font-bold text-slate-500 text-lg">{profile.nama.charAt(0).toUpperCase()}</span>
          </div>
          {/* Status Indicator Dot */}
          <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white dark:border-slate-900 rounded-full ${profile.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base truncate">{profile.nama}</h3>
          <p className="text-sm text-slate-500 truncate">{profile.role} {profile.spesialisasi ? `• ${profile.spesialisasi}` : ''}</p>
        </div>

        <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
      </div>
    </div>
  );
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [masterRoles, setMasterRoles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createData, setCreateData] = useState({
    nama: '', email: '', password: '', role: 'MANDOR', noHp: '', spesialisasi: '', nik: '', alamat: '', upahPerJam: 0
  });

  // Edit State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState<Profile | null>(null);

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const [profRes, roleRes] = await Promise.all([
        fetch('/api/profiles'),
        fetch('/api/roles')
      ]);
      const profData = await profRes.json();
      const roleData = await roleRes.json();

      if (profData.success) {
        setProfiles(profData.data);
      }
      if (roleData.success) {
        setMasterRoles(roleData.data);
      }
    } catch (err: any) {
      toast.error('Gagal mengambil data', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...createData,
        nik: createData.nik || undefined,
        noHp: createData.noHp || undefined,
        spesialisasi: createData.spesialisasi || undefined,
        alamat: createData.alamat || undefined,
        upahPerJam: createData.upahPerJam || 0,
      };

      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || 'Gagal mendaftar');

      toast.success('Berhasil', { description: `Akun untuk ${createData.nama} telah dibuat.` });
      setIsCreateOpen(false);
      setCreateData({ nama: '', email: '', password: '', role: 'MANDOR', noHp: '', spesialisasi: '', nik: '', alamat: '', upahPerJam: 0 });
      fetchProfiles();
    } catch (err: any) {
      toast.error('Gagal Mendaftar', { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData) return;
    setIsSubmitting(true);

    try {
      const payload = {
        nama: editData.nama,
        role: editData.role,
        status: editData.status,
        nik: editData.nik || undefined,
        noHp: editData.noHp || undefined,
        spesialisasi: editData.spesialisasi || undefined,
        alamat: editData.alamat || undefined,
        upahPerJam: editData.upahPerJam || 0,
      };

      const res = await fetch(`/api/profiles/${editData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || 'Gagal memperbarui');

      toast.success('Berhasil', { description: `Profil ${editData.nama} telah diperbarui.` });
      setIsEditOpen(false);
      fetchProfiles();
    } catch (err: any) {
      toast.error('Gagal Update', { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/profiles/${deleteId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || 'Gagal menghapus');

      toast.success('Dihapus', { description: 'Profil dan akun login telah dihapus secara permanen.' });
      fetchProfiles();
    } catch (err: any) {
      toast.error('Gagal Hapus', { description: err.message });
    } finally {
      setIsSubmitting(false);
      setDeleteId(null);
    }
  };

  const openEditModal = (profile: Profile) => {
    setEditData(profile);
    setIsEditOpen(true);
  };

  const filteredProfiles = profiles.filter(p => {
    const matchSearch = p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.spesialisasi && p.spesialisasi.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.role && p.role.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchRole = selectedRoleFilter === 'Semua' || p.role === selectedRoleFilter;

    return matchSearch && matchRole;
  });

  const desktopProfiles = filteredProfiles.slice((currentPage - 1) * 10, currentPage * 10);
  const totalPages = Math.ceil(filteredProfiles.length / 10);
  const mobileProfiles = filteredProfiles.slice(0, visibleCount);

  return (
    <div className="space-y-6 p-4 md:p-0 pb-24 md:pb-0">
      {/* =========================================================
          1. DESKTOP VIEW (Table)
      ========================================================= */}
      <div className="hidden md:block space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Karyawan & Kru Lapangan</h1>
            <p className="text-slate-500">Kelola akun Mandor dan Tukang untuk akses aplikasi.</p>
          </div>
          <Button className="shadow-md hover:shadow-lg transition-all" size="lg" onClick={() => setIsCreateOpen(true)}>
            <UserPlus className="w-5 h-5 mr-2" /> Daftarkan Karyawan
          </Button>
        </div>

        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 dark:bg-slate-900 flex flex-col gap-5 pt-5 px-6 pb-0">
            <div className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Daftar Kru Terdaftar</CardTitle>
              <div className="relative w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm"
                  placeholder="Cari nama atau role..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>

            {/* DESKTOP FILTER TABS */}
            <div className="flex gap-6 border-b border-slate-200 dark:border-slate-800">
              <button
                className={`pb-3 text-sm font-semibold transition-colors relative ${selectedRoleFilter === 'Semua' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                onClick={() => { setSelectedRoleFilter('Semua'); setCurrentPage(1); }}
              >
                Semua <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] ${selectedRoleFilter === 'Semua' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{profiles.length}</span>
                {selectedRoleFilter === 'Semua' && (
                  <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                )}
              </button>
              {masterRoles.map(r => {
                const count = profiles.filter(p => p.role === r.nama).length;
                return (
                  <button
                    key={r.id}
                    className={`pb-3 text-sm font-semibold transition-colors relative ${selectedRoleFilter === r.nama ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    onClick={() => { setSelectedRoleFilter(r.nama); setCurrentPage(1); }}
                  >
                    {r.nama} <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] ${selectedRoleFilter === r.nama ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{count}</span>
                    {selectedRoleFilter === r.nama && (
                      <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredProfiles.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-48 text-slate-500">
                <HardHat className="w-10 h-10 mb-2 opacity-50" />
                <p>Tidak ada kru yang sesuai pencarian</p>
              </div>
            ) : (
              <div className="flex flex-col">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                      <TableHead className="font-semibold">Nama Karyawan</TableHead>
                      <TableHead className="font-semibold">Role</TableHead>
                      <TableHead className="font-semibold">Spesialisasi</TableHead>
                      <TableHead className="font-semibold">Kontak</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="text-right font-semibold">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {desktopProfiles.map((profile) => (
                      <TableRow key={profile.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-900/80 transition-colors">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 text-xs">
                              {profile.nama.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium leading-none">{profile.nama}</p>
                              <p className="text-xs text-slate-500 mt-1">NIK: {profile.nik || '-'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${profile.role === 'MANDOR' || profile.role === 'ADMIN'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                            {profile.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {profile.spesialisasi || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-slate-500 text-sm">
                            <Phone className="w-3 h-3 mr-2" />
                            {profile.noHp || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${profile.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                              {profile.status === 'ACTIVE' ? 'Aktif' : 'Blacklist'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-primary hover:bg-primary/10" onClick={() => openEditModal(profile)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(profile.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* DESKTOP PAGINATION */}
                {filteredProfiles.length > 10 && (
                  <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-sm text-slate-500">
                      Menampilkan {(currentPage - 1) * 10 + 1} - {Math.min(currentPage * 10, filteredProfiles.length)} dari {filteredProfiles.length}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Sebelumnya</Button>
                      <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Selanjutnya</Button>
                    </div>
                  </div>
                )}
              </div>
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
              placeholder="Cari nama atau role..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(10); }}
            />
          </div>
          <Button
            className="w-12 h-12 shrink-0 rounded-2xl shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center active:scale-[0.98] transition-transform"
            onClick={() => setIsCreateOpen(true)}
            size="icon"
          >
            <UserPlus className="w-6 h-6" />
          </Button>
        </div>

        {/* MOBILE FILTER TABS */}
        <div className="flex overflow-x-auto -mx-4 px-4 gap-6 border-b border-slate-200 dark:border-slate-800 mb-2 [&::-webkit-scrollbar]:hidden">
          <button
            className={`pb-3 text-sm font-semibold transition-colors relative whitespace-nowrap shrink-0 ${selectedRoleFilter === 'Semua' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            onClick={() => { setSelectedRoleFilter('Semua'); setVisibleCount(10); }}
          >
            Semua <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedRoleFilter === 'Semua' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{profiles.length}</span>
            {selectedRoleFilter === 'Semua' && (
              <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-blue-600 dark:bg-blue-400 rounded-t-full" />
            )}
          </button>
          {masterRoles.map(r => {
            const count = profiles.filter(p => p.role === r.nama).length;
            if (count === 0) return null;
            return (
              <button
                key={r.id}
                className={`pb-3 text-sm font-semibold transition-colors relative whitespace-nowrap shrink-0 ${selectedRoleFilter === r.nama ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                onClick={() => { setSelectedRoleFilter(r.nama); setVisibleCount(10); }}
              >
                {r.nama} <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedRoleFilter === r.nama ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{count}</span>
                {selectedRoleFilter === r.nama && (
                  <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : filteredProfiles.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-20 text-slate-500 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <p className="font-bold text-slate-700 dark:text-slate-300">Tidak Ditemukan</p>
              <p className="text-xs mt-1">Coba gunakan kata kunci lain atau ubah filter.</p>
            </div>
          ) : (
            <>
              {mobileProfiles.map((profile) => (
                <MobileProfileCard
                  key={profile.id}
                  profile={profile}
                  onEdit={openEditModal}
                  onDelete={setDeleteId}
                />
              ))}

              {/* MOBILE LOAD MORE BUTTON */}
              {visibleCount < filteredProfiles.length && (
                <div className="pt-4 flex justify-center">
                  <Button variant="outline" className="rounded-full w-full max-w-[250px] shadow-sm font-bold text-slate-600 dark:text-slate-300" onClick={() => setVisibleCount(v => v + 10)}>
                    Tampilkan Lebih Banyak
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* =========================================================
          3. MODALS
      ========================================================= */}
      {/* CREATE MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Daftarkan Karyawan Baru</DialogTitle>
            <DialogDescription>
              Buat akun otomatis dan berikan akses ke karyawan.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="c-nama" className="text-sm font-bold text-slate-700 dark:text-slate-300">Nama Lengkap</Label>
              <Input id="c-nama" className="h-12 rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 text-base font-medium px-4 focus-visible:ring-blue-500" required value={createData.nama} onChange={e => setCreateData({ ...createData, nama: e.target.value })} placeholder="Misal: Agus Riyadi" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="c-nik" className="text-sm font-bold text-slate-700 dark:text-slate-300">NIK KTP (Opsional)</Label>
                <Input id="c-nik" className="h-12 rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 text-base font-medium px-4 focus-visible:ring-blue-500" value={createData.nik} onChange={e => setCreateData({ ...createData, nik: e.target.value })} placeholder="16 Digit NIK" maxLength={16} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-noHp" className="text-sm font-bold text-slate-700 dark:text-slate-300">Nomor HP</Label>
                <Input id="c-noHp" className="h-12 rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 text-base font-medium px-4 focus-visible:ring-blue-500" value={createData.noHp} onChange={e => setCreateData({ ...createData, noHp: e.target.value })} placeholder="0812..." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="c-email" className="text-sm font-bold text-slate-700 dark:text-slate-300">Email Login</Label>
                <Input id="c-email" type="email" className="h-12 rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 text-base font-medium px-4 focus-visible:ring-blue-500" required value={createData.email} onChange={e => setCreateData({ ...createData, email: e.target.value })} placeholder="agus@habs.co.id" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-password" className="text-sm font-bold text-slate-700 dark:text-slate-300">Password</Label>
                <Input id="c-password" type="password" className="h-12 rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 text-base font-medium px-4 focus-visible:ring-blue-500" required minLength={6} value={createData.password} onChange={e => setCreateData({ ...createData, password: e.target.value })} placeholder="Minimal 6 karakter" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Role Pekerjaan</Label>
                <Select value={createData.role} onValueChange={v => setCreateData({ ...createData, role: v || 'MANDOR' })}>
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 text-base font-medium px-4 focus-visible:ring-blue-500"><SelectValue placeholder="Pilih Role" /></SelectTrigger>
                  <SelectContent>
                    {masterRoles.map(r => (
                      <SelectItem key={r.id} value={r.nama}>{r.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-upah" className="text-sm font-bold text-slate-700 dark:text-slate-300">Upah / Jam (Rp)</Label>
                <Input id="c-upah" type="number" className="h-12 rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 text-base font-medium px-4 focus-visible:ring-blue-500" min="0" value={createData.upahPerJam} onChange={e => setCreateData({ ...createData, upahPerJam: parseInt(e.target.value) || 0 })} placeholder="20000" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="c-spesialisasi" className="text-sm font-bold text-slate-700 dark:text-slate-300">Spesialisasi (Opsional)</Label>
              <Input id="c-spesialisasi" className="h-12 rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 text-base font-medium px-4 focus-visible:ring-blue-500" value={createData.spesialisasi} onChange={e => setCreateData({ ...createData, spesialisasi: e.target.value })} placeholder="Tukang Kayu, Besi, dll" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-alamat" className="text-sm font-bold text-slate-700 dark:text-slate-300">Alamat Lengkap</Label>
              <Input id="c-alamat" className="h-12 rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 text-base font-medium px-4 focus-visible:ring-blue-500" value={createData.alamat} onChange={e => setCreateData({ ...createData, alamat: e.target.value })} placeholder="Jalan Raya No 1..." />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" className="rounded-xl h-11" onClick={() => setIsCreateOpen(false)}>Batal</Button>
              <Button type="submit" className="rounded-xl h-11 bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Daftarkan Akun
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT MODAL */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Karyawan</DialogTitle>
            <DialogDescription>
              Perbarui data profil karyawan. Email dan password tidak bisa diubah.
            </DialogDescription>
          </DialogHeader>
          {editData && (
            <form onSubmit={handleEdit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="e-nama" className="text-sm font-bold text-slate-700 dark:text-slate-300">Nama Lengkap</Label>
                <Input id="e-nama" className="h-12 rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 text-base font-medium px-4 focus-visible:ring-blue-500" required value={editData.nama} onChange={e => setEditData({ ...editData, nama: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="e-nik" className="text-sm font-bold text-slate-700 dark:text-slate-300">NIK KTP</Label>
                  <Input id="e-nik" className="h-12 rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 text-base font-medium px-4 focus-visible:ring-blue-500" value={editData.nik || ''} onChange={e => setEditData({ ...editData, nik: e.target.value })} maxLength={16} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="e-noHp" className="text-sm font-bold text-slate-700 dark:text-slate-300">Nomor HP</Label>
                  <Input id="e-noHp" className="h-12 rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 text-base font-medium px-4 focus-visible:ring-blue-500" value={editData.noHp || ''} onChange={e => setEditData({ ...editData, noHp: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Role Pekerjaan</Label>
                  <Select value={editData.role} onValueChange={v => setEditData({ ...editData, role: v || 'MANDOR' })}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 text-base font-medium px-4 focus-visible:ring-blue-500"><SelectValue placeholder="Pilih Role" /></SelectTrigger>
                    <SelectContent>
                      {masterRoles.map(r => (
                        <SelectItem key={r.id} value={r.nama}>{r.nama}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Status Akun</Label>
                  <Select value={editData.status} onValueChange={v => setEditData({ ...editData, status: v || 'ACTIVE' })}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 text-base font-medium px-4 focus-visible:ring-blue-500"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Aktif</SelectItem>
                      <SelectItem value="BLACKLISTED">Blacklist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="e-spesialisasi" className="text-sm font-bold text-slate-700 dark:text-slate-300">Spesialisasi</Label>
                  <Input id="e-spesialisasi" className="h-12 rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 text-base font-medium px-4 focus-visible:ring-blue-500" value={editData.spesialisasi || ''} onChange={e => setEditData({ ...editData, spesialisasi: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="e-upah" className="text-sm font-bold text-slate-700 dark:text-slate-300">Upah / Jam (Rp)</Label>
                  <Input id="e-upah" type="number" className="h-12 rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 text-base font-medium px-4 focus-visible:ring-blue-500" min="0" value={editData.upahPerJam || 0} onChange={e => setEditData({ ...editData, upahPerJam: parseInt(e.target.value) || 0 })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="e-alamat" className="text-sm font-bold text-slate-700 dark:text-slate-300">Alamat Lengkap</Label>
                <Input id="e-alamat" className="h-12 rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 text-base font-medium px-4 focus-visible:ring-blue-500" value={editData.alamat || ''} onChange={e => setEditData({ ...editData, alamat: e.target.value })} />
              </div>

              <div className="pt-4 flex justify-between gap-3 items-center border-t border-slate-100 dark:border-slate-800 mt-4">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl px-3"
                  onClick={() => { setIsEditOpen(false); setDeleteId(editData.id); }}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Hapus
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" type="button" className="rounded-xl h-11" onClick={() => setIsEditOpen(false)}>Batal</Button>
                  <Button type="submit" className="rounded-xl h-11 bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Simpan'}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION MODAL */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Ini akan menghapus akun beserta akses login di Supabase secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDelete(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Hapus Permanen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
