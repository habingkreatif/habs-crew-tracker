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
    <Card className="w-full border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl overflow-hidden">
      <CardHeader className="space-y-3 text-center pb-8 pt-10">
        <div className="flex justify-center mb-2 lg:hidden">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>
        <CardTitle className="text-3xl font-extrabold tracking-tight">Selamat Datang</CardTitle>
        <CardDescription className="text-base text-slate-500 dark:text-slate-400">
          Masukkan Username / NIP Anda untuk melanjutkan
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-5 px-8">
          <div className="space-y-2.5">
            <Label htmlFor="username" className="text-sm font-medium text-slate-700 dark:text-slate-300">Username / NIP</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <User className="h-5 w-5" />
              </div>
              <Input
                id="username"
                type="text"
                placeholder="contoh: mandor1 atau 12345"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 pl-11 pr-4 rounded-xl border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-primary/50 focus-visible:ring-primary/20 focus-visible:border-primary dark:bg-slate-900/50 dark:border-slate-800"
              />
            </div>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</Label>
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
                className="h-12 pl-11 pr-4 rounded-xl border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-primary/50 focus-visible:ring-primary/20 focus-visible:border-primary dark:bg-slate-900/50 dark:border-slate-800"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="px-8 pb-10 flex-col space-y-5 bg-transparent border-t-0">
          <Button
            className="group w-full h-12 text-base font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 relative overflow-hidden"
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
            {/* Subtle glow effect on hover */}
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </Button>
          <p className="text-sm text-center text-slate-500 dark:text-slate-400">
            Kendala akses? <a href="#" className="text-primary font-medium hover:underline transition-colors hover:text-primary/80">Hubungi Admin</a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
