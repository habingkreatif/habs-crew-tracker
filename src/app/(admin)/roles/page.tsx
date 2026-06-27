'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newRole, setNewRole] = useState('');
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Pengaturan Role</h1>
        <p className="text-slate-500 mt-1">Kelola daftar jabatan atau role untuk karyawan secara dinamis.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Tambah Role Baru</CardTitle>
            <CardDescription>Role ini akan muncul di dropdown saat menambah atau mengedit karyawan.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddRole} className="flex gap-2">
              <Input 
                placeholder="Contoh: CEO, MANAJER, HRD" 
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="uppercase"
                maxLength={20}
              />
              <Button type="submit" disabled={isAdding || !newRole.trim()}>
                {isAdding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Tambah
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Daftar Role Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : roles.length === 0 ? (
              <div className="text-center p-8 text-slate-500">Belum ada role.</div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {roles.map((role) => (
                  <li key={role.id} className="py-3 flex justify-between items-center group">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{role.nama}</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteRole(role.id, role.nama)}
                      disabled={role.nama === 'SUPERADMIN' || role.nama === 'ADMIN'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
