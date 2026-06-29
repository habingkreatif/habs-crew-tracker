'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, User, Lock, BookOpen, HeadphonesIcon, LogOut, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const supabase = createClient();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      // 1. Matikan sesi di Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      // 2. Bersihkan state lokal Zustand
      logout();
      
      toast.success('Berhasil keluar akun');
      
      // 3. Arahkan kembali ke login
      router.replace('/login');
    } catch (error: any) {
      console.error('Error logging out:', error);
      toast.error('Gagal keluar: ' + (error.message || 'Terjadi kesalahan'));
      setIsLoggingOut(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-safe relative">
      
      {/* M-Banking Solid Header Background (Matches Home Page) */}
      <div className="absolute top-0 left-0 w-full h-[240px] bg-primary rounded-b-[40px] z-0 shadow-lg overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
      </div>

      <div className="pt-6 pb-10 px-6 relative z-10 flex flex-col min-h-screen">
        
        {/* Header Navigation */}
        <div className="flex items-center mb-5">
          <button 
            onClick={() => router.push('/home')}
            className="w-10 h-10 flex items-center justify-center text-white/90 hover:text-white transition-all active:scale-90 shrink-0 -ml-2"
          >
            <ArrowLeft className="w-7 h-7 stroke-[2.5px] drop-shadow-md" />
          </button>
          <h1 className="text-lg font-extrabold text-white ml-1 drop-shadow-md tracking-tight">Profil Akun</h1>
        </div>

        {/* Profile Info (Horizontal Layout) */}
        <div className="flex flex-row items-center px-2 pb-8">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md p-1 shadow-xl shadow-black/10 border border-white/30 shrink-0 mr-4">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
              <span className="text-2xl font-black text-primary">{getInitials(user?.nama || '')}</span>
            </div>
          </div>
          
          <div className="flex flex-col flex-1 overflow-hidden">
            <h2 className="text-xl font-black text-white mb-1 drop-shadow-md leading-tight truncate w-full">
              {user?.nama || 'Memuat...'}
            </h2>
            <div className="flex items-center mb-1">
              <p className="text-[9px] font-bold text-white/90 bg-black/20 backdrop-blur-md px-2.5 py-0.5 rounded-full uppercase tracking-widest border border-white/10 shadow-sm">
                {user?.role === 'MANDOR' ? 'Mandor Lapangan' : user?.role || 'Kru'}
              </p>
            </div>
            <p className="text-xs font-medium text-white/80 drop-shadow-sm truncate w-full">
              {user?.email || 'email@contoh.com'}
            </p>
          </div>
        </div>

        {/* Overlapping Settings Card (Matches Home Card Style) */}
        <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl shadow-primary/5 border border-slate-100 dark:border-slate-800 overflow-hidden relative z-20 -mt-2">
          
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
             <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Pengaturan & Bantuan</h3>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 p-2">
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group active:bg-slate-100 rounded-[20px]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 transition-colors shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Ubah Kata Sandi</p>
                  <p className="text-[10px] font-medium text-slate-500 mt-0.5">Perbarui keamanan akun</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group active:bg-slate-100 rounded-[20px]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 transition-colors shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Panduan Aplikasi</p>
                  <p className="text-[10px] font-medium text-slate-500 mt-0.5">Cara absensi & lapor</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group active:bg-slate-100 rounded-[20px]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-500 group-hover:bg-amber-100 transition-colors shrink-0">
                  <HeadphonesIcon className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Hubungi Admin</p>
                  <p className="text-[10px] font-medium text-slate-500 mt-0.5">Bantuan kendala</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Spacer to push logout to bottom */}
        <div className="flex-1 min-h-[40px]"></div>

        {/* Logout Section */}
        <div className="mt-auto">
          <button 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full h-14 bg-white dark:bg-slate-900 text-red-600 dark:text-red-500 font-extrabold rounded-[24px] flex items-center justify-center gap-2 border border-red-100 dark:border-red-900/30 shadow-xl shadow-red-500/5 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-50 dark:hover:bg-red-900/10 relative overflow-hidden"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                <span className="relative z-10">Sedang Keluar...</span>
              </>
            ) : (
              <>
                <LogOut className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Keluar Akun</span>
              </>
            )}
          </button>
          <p className="text-center text-[10px] font-extrabold text-slate-400 mt-5 tracking-widest uppercase mb-2">
            Habs Crew Tracker v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
