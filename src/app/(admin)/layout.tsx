'use client';

import { useAuthStore } from '@/store/auth.store';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, Building2, LogOut, FileText, Banknote, Shield, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace('/login');
    } else if (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') {
      router.replace('/home'); // Redirect to mandor if not admin
    }
  }, [isAuthenticated, user, router, isHydrated]);

  const handleLogout = async () => {
    toast.loading('Sedang keluar...', { id: 'logout' });
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Logout network error ignored:', error);
    } finally {
      logout();
      toast.dismiss('logout');
      router.push('/login');
    }
  };

  const menuItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Laporan Kru', href: '/reports', icon: FileText },
    { name: 'Penggajian', href: '/payroll', icon: Banknote },
    { name: 'Manajemen Proyek', href: '/projects', icon: Building2 },
    { name: 'Karyawan & Kru', href: '/profiles', icon: Users },
    { name: 'Pengaturan Role', href: '/roles', icon: Shield },
  ];

  if (!isHydrated || !isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN')) {
    return null; // Prevent flash of content
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row">
      {/* Mobile Dynamic Header (Only shows if NOT on dashboard root) */}
      {pathname !== '/' && (
        <div className="md:hidden flex items-center p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm sticky top-0 z-30 animate-in fade-in slide-in-from-top-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-3 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ChevronLeft className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          </Button>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate flex-1">
            {menuItems.find(m => pathname.startsWith(m.href) && m.href !== '/')?.name || 'Habs Crew'}
          </h1>
        </div>
      )}

      {/* Sidebar Desktop (Hidden on Mobile) */}
      <aside className="hidden md:flex inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col shadow-sm relative">
        <div className="p-6 flex items-center justify-center border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
            Habs Crew
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="px-3 mb-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Menu Utama
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <Button 
                  variant={isActive ? "secondary" : "ghost"} 
                  className={`w-full justify-start ${isActive ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center font-bold shadow-md">
              {user?.nama?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.nama}</p>
              <p className="text-xs font-medium text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-3" />
            Keluar Sistem
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-0 md:p-6 lg:p-10 w-full animate-in fade-in duration-500 relative pb-24 md:pb-10">
        {children}
      </main>
    </div>
  );
}
