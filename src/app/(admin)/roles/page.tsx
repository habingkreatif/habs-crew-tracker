'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, ShieldCheck, Briefcase, Search } from 'lucide-react';

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newRole, setNewRole] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/roles');
      const data = await res.json();
      if (data.success) {
        setRoles(data.data);
      }
    } catch (err) {
      toast.error('Gagal memuat data role');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole.trim()) return;

    setIsAdding(true);
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: newRole.toUpperCase() })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Role berhasil ditambahkan');
        setNewRole('');
        fetchRoles();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menambahkan role');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteRole = async (id: number, nama: string) => {
    if (!confirm(`Yakin ingin menghapus role ${nama}?`)) return;

    const toastId = toast.loading('Menghapus role...');
    try {
      const res = await fetch(`/api/roles/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Role berhasil dihapus', { id: toastId });
        fetchRoles();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus role', { id: toastId });
    }
  };

  return (
    <div className="space-y-6 animate-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Pengaturan Role</h1>
          </div>
          <p className="text-slate-500 mt-2 text-sm">Kelola daftar jabatan atau role untuk seluruh karyawan secara dinamis.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Tambah Role Baru
            </CardTitle>
            <CardDescription>
              Role ini akan muncul di dropdown saat Anda menambahkan atau mengedit profil karyawan.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleAddRole} className="space-y-4">
              <div className="space-y-2">
                <Input 
                  placeholder="Contoh: CEO, MANAJER, HRD" 
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="uppercase h-11"
                  maxLength={20}
                />
                <p className="text-xs text-slate-400">Pastikan nama role tidak duplikat dengan yang sudah ada.</p>
              </div>
              <Button type="submit" className="w-full h-11" disabled={isAdding || !newRole.trim()}>
                {isAdding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Tambah Role
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                Daftar Role Aktif
              </CardTitle>
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Cari role..."
                  className="pl-8 h-9 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : roles.length === 0 ? (
              <div className="text-center p-12 text-slate-500">Belum ada role.</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[400px] overflow-y-auto">
                {roles.filter(r => r.nama.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                  <div className="text-center p-8 text-sm text-slate-500">Role tidak ditemukan.</div>
                ) : (
                  roles.filter(r => r.nama.toLowerCase().includes(searchQuery.toLowerCase())).map((role) => {
                    const isSystemRole = role.nama === 'SUPERADMIN' || role.nama === 'ADMIN';
                    return (
                      <div key={role.id} className="p-4 flex justify-between items-center group hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSystemRole ? 'bg-primary/20 text-primary' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                            {isSystemRole ? <ShieldCheck className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">{role.nama}</span>
                            {isSystemRole && (
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider">System Default</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {isSystemRole && (
                            <span className="text-[10px] hidden sm:inline-flex bg-primary/10 text-primary hover:bg-primary/20 rounded-full px-2.5 py-0.5 font-semibold">
                              PROTECTED
                            </span>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-rose-500 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-rose-50 hover:text-rose-600 h-8 w-8 p-0"
                            onClick={() => handleDeleteRole(role.id, role.nama)}
                            disabled={isSystemRole}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
