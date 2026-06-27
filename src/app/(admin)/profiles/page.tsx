'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, UserPlus, Loader2, HardHat, Pencil, Trash2 } from 'lucide-react';
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

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
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
      const res = await fetch('/api/profiles');
      const data = await res.json();
      if (data.success) {
        setProfiles(data.data);
      } else {
        throw new Error(data.error?.message);
      }
    } catch (err: any) {
      toast.error('Gagal mengambil data karyawan', { description: err.message });
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Karyawan & Kru Lapangan</h1>
          <p className="text-slate-500">Kelola akun Mandor dan Tukang untuk akses aplikasi.</p>
        </div>

        <Button className="shadow-md hover:shadow-lg transition-all" size="lg" onClick={() => setIsCreateOpen(true)}>
          <UserPlus className="w-5 h-5 mr-2" /> Daftarkan Karyawan
        </Button>

        {/* CREATE MODAL */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Daftarkan Karyawan Baru</DialogTitle>
              <DialogDescription>
                Buat akun Supabase otomatis dan berikan email beserta password ke karyawan.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="c-nama">Nama Lengkap</Label>
                <Input id="c-nama" required value={createData.nama} onChange={e => setCreateData({ ...createData, nama: e.target.value })} placeholder="Misal: Agus Riyadi" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-nik">NIK KTP (Opsional)</Label>
                <Input id="c-nik" value={createData.nik} onChange={e => setCreateData({ ...createData, nik: e.target.value })} placeholder="16 Digit NIK" maxLength={16} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="c-email">Email Login</Label>
                  <Input id="c-email" type="email" required value={createData.email} onChange={e => setCreateData({ ...createData, email: e.target.value })} placeholder="agus@habs.co.id" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-password">Password</Label>
                  <Input id="c-password" required minLength={6} value={createData.password} onChange={e => setCreateData({ ...createData, password: e.target.value })} placeholder="Minimal 6 karakter" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role Pekerjaan</Label>
                  <Select value={createData.role} onValueChange={v => setCreateData({ ...createData, role: v || 'MANDOR' })}>
                    <SelectTrigger><SelectValue placeholder="Pilih Role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANDOR">Mandor Proyek</SelectItem>
                      <SelectItem value="TUKANG">Tukang</SelectItem>
                      <SelectItem value="ADMIN">Admin / Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-noHp">Nomor HP</Label>
                  <Input id="c-noHp" value={createData.noHp} onChange={e => setCreateData({ ...createData, noHp: e.target.value })} placeholder="0812..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="c-spesialisasi">Spesialisasi (Opsional)</Label>
                  <Input id="c-spesialisasi" value={createData.spesialisasi} onChange={e => setCreateData({ ...createData, spesialisasi: e.target.value })} placeholder="Tukang Kayu" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-upah">Upah Per Jam (Rp)</Label>
                  <Input id="c-upah" type="number" min="0" value={createData.upahPerJam} onChange={e => setCreateData({ ...createData, upahPerJam: parseInt(e.target.value) || 0 })} placeholder="20000" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-alamat">Alamat Lengkap</Label>
                <Input id="c-alamat" value={createData.alamat} onChange={e => setCreateData({ ...createData, alamat: e.target.value })} placeholder="Jalan Raya No 1..." />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>Batal</Button>
                <Button type="submit" disabled={isSubmitting}>
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
                Perbarui data profil karyawan. Catatan: Email dan password tidak bisa diubah di sini.
              </DialogDescription>
            </DialogHeader>
            {editData && (
              <form onSubmit={handleEdit} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="e-nama">Nama Lengkap</Label>
                    <Input id="e-nama" required value={editData.nama} onChange={e => setEditData({ ...editData, nama: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="e-nik">NIK KTP</Label>
                    <Input id="e-nik" value={editData.nik || ''} onChange={e => setEditData({ ...editData, nik: e.target.value })} maxLength={16} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Role Pekerjaan</Label>
                    <Select value={editData.role} onValueChange={v => setEditData({ ...editData, role: v || 'MANDOR' })}>
                      <SelectTrigger><SelectValue placeholder="Pilih Role" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MANDOR">Mandor Proyek</SelectItem>
                        <SelectItem value="TUKANG">Tukang</SelectItem>
                        <SelectItem value="ADMIN">Admin / Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status Akun</Label>
                    <Select value={editData.status} onValueChange={v => setEditData({ ...editData, status: v || 'ACTIVE' })}>
                      <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Aktif</SelectItem>
                        <SelectItem value="BLACKLISTED">Blacklist</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="e-noHp">Nomor HP</Label>
                    <Input id="e-noHp" value={editData.noHp || ''} onChange={e => setEditData({ ...editData, noHp: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="e-spesialisasi">Spesialisasi</Label>
                    <Input id="e-spesialisasi" value={editData.spesialisasi || ''} onChange={e => setEditData({ ...editData, spesialisasi: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="e-alamat">Alamat Lengkap</Label>
                    <Input id="e-alamat" value={editData.alamat || ''} onChange={e => setEditData({ ...editData, alamat: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="e-upah">Upah Per Jam (Rp)</Label>
                    <Input id="e-upah" type="number" min="0" value={editData.upahPerJam || 0} onChange={e => setEditData({ ...editData, upahPerJam: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-2">
                  <Button variant="outline" type="button" onClick={() => setIsEditOpen(false)}>Batal</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Simpan Perubahan
                  </Button>
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

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-lg">Daftar Kru Terdaftar</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : profiles.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-48 text-slate-500">
              <HardHat className="w-10 h-10 mb-2 opacity-50" />
              <p>Belum ada karyawan terdaftar</p>
            </div>
          ) : (
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
                {profiles.map((profile) => (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
