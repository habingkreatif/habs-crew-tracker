'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { User, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const loginEmail = username.includes('@') ? username : `${username}@habs.co.id`;

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (error) {
        toast.error('Gagal Login', {
          description: error.message,
        });
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Fetch custom profile to get role and name
        const res = await fetch(`/api/profiles/${data.user.id}`);
        const profileData = await res.json();

        let role = 'TUKANG';
        let nama = data.user.email || '';

        if (profileData.success && profileData.data) {
          role = profileData.data.role;
          nama = profileData.data.nama;
        }

        setUser({
          id: data.user.id,
          email: data.user.email || '',
          role,
          nama,
        });

        toast.success('Login Berhasil', {
          description: `Selamat datang, ${nama}`,
        });

        // Redirect based on role
        if (role === 'ADMIN' || role === 'SUPERADMIN') {
          router.push('/'); // Admin dashboard
        } else {
          router.push('/home'); // Mandor dashboard (we'll set this up next)
        }
      }
    } catch (err: any) {
      toast.error('Terjadi Kesalahan', {
        description: err.message || 'Gagal terhubung ke server',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full justify-between lg:justify-center">
      {/* Mobile Header (Hidden on Desktop) */}
      <div className="lg:hidden px-8 pt-16 pb-8 text-white z-10 flex-shrink-0 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-white/20">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h1 className="text-3xl font-black mb-1.5 tracking-tight text-white drop-shadow-md">Selamat Datang</h1>
        <p className="text-white/90 text-sm font-medium tracking-wide">Silakan masuk ke akun Anda</p>
      </div>

      <Card className="w-full border-0 lg:shadow-2xl shadow-black/10 dark:shadow-black/50 bg-white dark:bg-slate-900 rounded-t-[32px] rounded-b-none lg:rounded-[32px] overflow-hidden relative flex-1 lg:flex-initial flex flex-col pt-2 pb-6 lg:p-4 animate-in slide-in-from-bottom-8 duration-500">
        {/* Pull Indicator for Mobile */}
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-2 lg:hidden"></div>

        <div className="hidden lg:block absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-blue-400 to-emerald-400"></div>

        <CardHeader className="space-y-2 text-center pb-8 pt-4 lg:pt-10 relative z-10 hidden lg:block">
          <CardTitle className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Selamat Datang</CardTitle>
          <CardDescription className="text-sm font-medium text-slate-500 dark:text-slate-400 px-4">
            Masukkan Username / NIP Anda untuk melanjutkan
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin} className="relative z-10 flex-1 flex flex-col justify-center lg:justify-start lg:mt-0 mt-4">
          <CardContent className="space-y-6 px-8 flex-1 lg:flex-initial">
            <div className="space-y-3">
              <Label htmlFor="username" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Username / NIP</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <Input
                  id="username"
                  type="text"
                  placeholder="Contoh: mandor1 atau 12345"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-14 pl-12 pr-4 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 font-medium transition-all duration-300 hover:border-primary/50 focus-visible:ring-primary/20 focus-visible:border-primary focus-visible:bg-white dark:focus-visible:bg-slate-900 text-base"
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Password</Label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 pl-12 pr-4 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 font-medium transition-all duration-300 hover:border-primary/50 focus-visible:ring-primary/20 focus-visible:border-primary focus-visible:bg-white dark:focus-visible:bg-slate-900 text-base"
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="px-8 pb-4 lg:pb-10 flex-col space-y-6 bg-transparent border-t-0 mt-4 lg:mt-6 shrink-0">
            <Button
              className="group w-full h-14 text-base font-bold rounded-2xl bg-primary hover:bg-primary/90 transition-all duration-300 shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">Memverifikasi...</span>
              ) : (
                <span className="flex items-center">
                  Masuk Sekarang
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              )}
            </Button>
            <p className="text-xs font-medium text-center text-slate-500 dark:text-slate-400">
              Kendala akses? <a href="#" className="text-primary font-bold hover:underline transition-colors">Hubungi Admin</a>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
