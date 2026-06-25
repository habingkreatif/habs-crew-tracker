'use client';

import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LogOut, User, Building } from 'lucide-react';

export default function MandorDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    router.push('/login');
  };

  return (
    <div className="p-6 space-y-6 animate-in-up">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Selamat datang kembali!</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full text-destructive hover:bg-destructive/10">
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <CardContent className="p-6 flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{user?.nama || 'Memuat...'}</h2>
            <p className="text-primary-foreground/80 text-sm font-medium uppercase tracking-wider">{user?.role || 'MANDOR'}</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Building className="w-5 h-5 text-primary" />
          Proyek Aktif
        </h3>
        
        {/* Dummy Project Card for Phase 1 MVP */}
        <Card className="border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md cursor-pointer group">
          <CardHeader className="pb-2">
            <CardTitle className="text-base group-hover:text-primary transition-colors">Pembangunan Ruko 3 Lantai</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 line-clamp-2">Jl. Sudirman No. 123, Jakarta Pusat</p>
            <div className="mt-4 flex items-center justify-between text-xs font-medium text-slate-400">
              <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-md">On-Track</span>
              <span>Radius: 50m</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
