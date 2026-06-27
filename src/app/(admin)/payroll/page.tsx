'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { toast } from 'sonner';
import { Loader2, Calculator, CheckCircle2, FileText, Save, Eye, Trash2 } from 'lucide-react';

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [periodeMulai, setPeriodeMulai] = useState('');
  const [periodeSelesai, setPeriodeSelesai] = useState('');
  
  // Format to IDR
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/payroll');
      const data = await res.json();
      if (data.success) setPayrolls(data.data);
    } catch (err) {
      toast.error('Gagal memuat riwayat gaji');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodeMulai || !periodeSelesai) return toast.error('Pilih periode mulai dan selesai');

    setIsGenerating(true);
    toast.loading('Menghitung gaji kru...', { id: 'generate' });
    
    try {
      // Get all active users first
      const usersRes = await fetch('/api/profiles');
      const usersData = await usersRes.json();
      
      if (!usersData.success || !usersData.data) {
        throw new Error('Gagal mengambil daftar kru');
      }

      const userIds = usersData.data
        .filter((u: any) => u.status === 'ACTIVE' && (u.role === 'MANDOR' || u.role === 'TUKANG'))
        .map((u: any) => u.id);

      // Generate payroll
      const res = await fetch('/api/admin/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds, periodeMulai, periodeSelesai })
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`Berhasil menghitung ${data.data.generated.length} slip gaji`, { id: 'generate' });
        if (data.data.errors.length > 0) {
          console.warn('Beberapa gagal:', data.data.errors);
        }
        fetchPayrolls();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghitung gaji', { id: 'generate' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdate = async (id: number, bonus: number, potongan: number, status: string) => {
    const toastId = toast.loading('Menyimpan perubahan...');
    try {
      const res = await fetch(`/api/admin/payroll/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bonusLembur: bonus, potongan, status })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Perubahan disimpan', { id: toastId });
        setPayrolls(prev => prev.map(p => p.id === id ? data.data : p));
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan', { id: toastId });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus draf gaji ini?')) return;
    const toastId = toast.loading('Menghapus data...');
    try {
      const res = await fetch(`/api/admin/payroll/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Data berhasil dihapus', { id: toastId });
        setPayrolls(prev => prev.filter(p => p.id !== id));
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus data', { id: toastId });
    }
  };

  return (
    <div className="space-y-8 animate-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Penggajian (Payroll)</h1>
        <p className="text-slate-500 mt-1">Hitung dan kelola gaji mandor dan tukang secara otomatis.</p>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="history">Riwayat Gaji</TabsTrigger>
          <TabsTrigger value="generate">Hitung Gaji (Baru)</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-6 space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Riwayat Slip Gaji</CardTitle>
              <CardDescription>Daftar seluruh draft dan gaji yang sudah lunas dibayar.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : payrolls.length === 0 ? (
                <div className="text-center p-8 text-slate-500">Belum ada data penggajian.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-xl">Kru</th>
                        <th className="px-4 py-3">Periode</th>
                        <th className="px-4 py-3">Hadir</th>
                        <th className="px-4 py-3">Gaji Pokok</th>
                        <th className="px-4 py-3 w-32">Bonus Lembur</th>
                        <th className="px-4 py-3 w-32">Potongan</th>
                        <th className="px-4 py-3">Total Bersih</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 rounded-tr-xl">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payrolls.map((p) => (
                        <PayrollRow key={p.id} payroll={p} onUpdate={handleUpdate} onDelete={handleDelete} formatRupiah={formatRupiah} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate" className="mt-6">
          <Card className="border-0 shadow-sm max-w-xl">
            <CardHeader>
              <CardTitle>Hitung Gaji Otomatis</CardTitle>
              <CardDescription>Sistem akan menarik data absensi seluruh kru aktif pada rentang tanggal yang dipilih.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Periode Mulai</Label>
                    <Input type="date" value={periodeMulai} onChange={(e) => setPeriodeMulai(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Periode Selesai</Label>
                    <Input type="date" value={periodeSelesai} onChange={(e) => setPeriodeSelesai(e.target.value)} required />
                  </div>
                </div>
                <Button type="submit" disabled={isGenerating} className="w-full">
                  {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}
                  Generate Gaji
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PayrollRow({ payroll, onUpdate, onDelete, formatRupiah }: { payroll: any, onUpdate: any, onDelete: any, formatRupiah: any }) {
  const [bonus, setBonus] = useState(payroll.bonusLembur);
  const [potongan, setPotongan] = useState(payroll.potongan);
  const [isEditing, setIsEditing] = useState(false);

  const totalBersih = payroll.totalGajiPokok + Number(bonus) - Number(potongan);
  
  const handleSave = () => {
    onUpdate(payroll.id, Number(bonus), Number(potongan), payroll.status);
    setIsEditing(false);
  };

  const handlePay = () => {
    onUpdate(payroll.id, Number(bonus), Number(potongan), 'PAID');
  };

  const [attendances, setAttendances] = useState<Date[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isLoadingCal, setIsLoadingCal] = useState(false);

  const fetchAttendance = async () => {
    setIsLoadingCal(true);
    try {
      const res = await fetch(`/api/admin/payroll/${payroll.id}/attendance`);
      const data = await res.json();
      if (data.success) {
        setAttendances(data.data.map((a: any) => new Date(a.date)));
      }
    } catch (err) {
      toast.error('Gagal mengambil data kehadiran');
    } finally {
      setIsLoadingCal(false);
    }
  };

  return (
    <tr className="border-b dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
      <td className="px-4 py-3 font-medium">
        {payroll.userName}
        <span className="block text-[10px] text-slate-400">{payroll.userRole}</span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {new Date(payroll.periodeMulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - 
        {new Date(payroll.periodeSelesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
      </td>
      <td className="px-4 py-3 font-semibold">
        <div className="flex items-center gap-2">
          {payroll.totalHadir} Hari
          <Dialog open={isCalendarOpen} onOpenChange={(open) => {
            setIsCalendarOpen(open);
            if (open) fetchAttendance();
          }}>
            <DialogTrigger>
              <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent h-6 w-6 rounded-full text-slate-400 hover:text-primary">
                <Eye className="w-4 h-4" />
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md flex flex-col items-center">
              <DialogHeader>
                <DialogTitle>Detail Kehadiran</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                {isLoadingCal ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : (
                  <Calendar
                    mode="multiple"
                    selected={attendances}
                    className="rounded-md border shadow"
                    modifiers={{
                      attended: attendances
                    }}
                    modifiersStyles={{
                      attended: { backgroundColor: '#10b981', color: 'white', fontWeight: 'bold' }
                    }}
                  />
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2 text-center w-full">Tanggal yang dilingkari hijau adalah hari di mana kru absen masuk.</p>
            </DialogContent>
          </Dialog>
        </div>
      </td>
      <td className="px-4 py-3">{formatRupiah(payroll.totalGajiPokok)}</td>
      
      <td className="px-4 py-3">
        {isEditing ? (
          <Input type="number" value={bonus} onChange={(e) => setBonus(e.target.value)} className="h-8 text-xs w-24" />
        ) : (
          <span className="text-emerald-600">+{formatRupiah(bonus)}</span>
        )}
      </td>
      
      <td className="px-4 py-3">
        {isEditing ? (
          <Input type="number" value={potongan} onChange={(e) => setPotongan(e.target.value)} className="h-8 text-xs w-24" />
        ) : (
          <span className="text-rose-600">-{formatRupiah(potongan)}</span>
        )}
      </td>
      
      <td className="px-4 py-3 font-bold text-primary">{formatRupiah(totalBersih)}</td>
      
      <td className="px-4 py-3">
        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${payroll.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {payroll.status}
        </span>
      </td>
      
      <td className="px-4 py-3">
        <div className="flex gap-2">
          {payroll.status === 'DRAFT' && (
            <>
              {isEditing ? (
                <Button size="sm" onClick={handleSave} className="h-8 px-2"><Save className="w-4 h-4" /></Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="h-8 px-2">Edit</Button>
              )}
              {!isEditing && (
                <Button size="sm" onClick={handlePay} className="h-8 px-2 bg-emerald-600 hover:bg-emerald-700">Lunas</Button>
              )}
            </>
          )}
          <Button size="sm" variant="outline" onClick={() => onDelete(payroll.id)} className="h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
