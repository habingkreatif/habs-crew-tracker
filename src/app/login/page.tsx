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
import { User, Lock, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

        if (role === 'ADMIN' || role === 'SUPERADMIN') {
          router.push('/admin');
        } else {
          router.push('/home');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal terhubung ke server';
      toast.error('Terjadi Kesalahan', {
        description: msg,
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full justify-between lg:justify-center overflow-x-hidden relative">
      
      {/* Decorative Blobs for Desktop Glassmorphism Effect */}
      <div className="hidden lg:block absolute top-[10%] left-[20%] w-72 h-72 bg-emerald-400/20 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="hidden lg:block absolute bottom-[10%] right-[20%] w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Mobile Header (Hidden on Desktop) */}
      <div className="lg:hidden px-8 pt-12 pb-8 text-white z-10 flex-shrink-0 animate-in fade-in slide-in-from-top-4 duration-700 relative">
        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-white/20">
          <User className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-[32px] leading-tight font-black mb-1.5 tracking-tight drop-shadow-sm">Halo, Crew!</h1>
        <p className="text-white/80 text-sm font-medium tracking-wide">Silakan otorisasi akun Anda.</p>
      </div>

      <div className="w-full bg-white/95 dark:bg-slate-900/95 lg:bg-white/60 lg:dark:bg-slate-900/60 backdrop-blur-2xl rounded-t-[40px] rounded-b-none lg:rounded-[32px] overflow-hidden relative flex-1 lg:flex-initial flex flex-col pt-4 pb-8 lg:p-12 animate-in slide-in-from-bottom-8 duration-700 lg:max-w-[460px] lg:mx-auto lg:shadow-[0_24px_80px_rgba(0,0,0,0.06)] border-t border-white/50 lg:border lg:border-white/60 dark:border-white/10 z-20">
        
        {/* Pull Indicator for Mobile */}
        <div className="w-12 h-1.5 bg-slate-300/50 dark:bg-slate-700 rounded-full mx-auto mb-8 lg:hidden"></div>

        {/* Desktop Header */}
        <div className="text-center pb-8 relative z-10 hidden lg:block">
          <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 dark:border-slate-700">
             <User className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Otorisasi Sistem</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Akses portal manajemen kru terpadu
          </p>
        </div>

        <form onSubmit={handleLogin} className="relative z-10 flex-1 flex flex-col justify-center lg:justify-start w-full px-8 lg:px-0 mt-4 lg:mt-0">
          <div className="space-y-6 flex-1 lg:flex-initial">
            
            {/* Floating Label Username */}
            <div className="relative group">
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block px-4 pb-3 pt-7 w-full text-base font-bold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border-2 border-slate-200/60 dark:border-slate-800 appearance-none focus:outline-none focus:ring-0 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 peer transition-all shadow-sm"
                placeholder=" "
              />
              <label 
                htmlFor="username" 
                className="absolute text-sm font-bold text-slate-400 dark:text-slate-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-focus:text-emerald-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 cursor-text pointer-events-none"
              >
                Username / NIP
              </label>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-300 peer-focus:text-emerald-500 transition-colors">
                <User className="h-5 w-5" />
              </div>
            </div>

            {/* Floating Label Password */}
            <div className="relative group">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block px-4 pb-3 pt-7 w-full text-base font-bold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border-2 border-slate-200/60 dark:border-slate-800 appearance-none focus:outline-none focus:ring-0 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 peer transition-all shadow-sm pr-12"
                placeholder=" "
              />
              <label 
                htmlFor="password" 
                className="absolute text-sm font-bold text-slate-400 dark:text-slate-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-focus:text-emerald-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 cursor-text pointer-events-none"
              >
                PIN / Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors z-20"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Form Footer */}
          <div className="flex-col space-y-6 mt-10 shrink-0">
            <Button
              className="group w-full h-[60px] text-[17px] tracking-wide font-black rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white transition-all duration-300 shadow-[0_10px_25px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_35px_rgba(16,185,129,0.4)] active:scale-[0.97]"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Memproses...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Lanjutkan
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1.5" />
                </span>
              )}
            </Button>
            
            <p className="text-xs font-bold text-center text-slate-400 dark:text-slate-500">
              Lupa PIN/Password? <a href="#" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors">Hubungi CS Proyek</a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
