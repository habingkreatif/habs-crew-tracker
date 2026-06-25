'use client';

import { useAuthStore } from '@/store/auth.store';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, Building2, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') {
      router.push('/home'); // Redirect to mandor if not admin
    }
  }, [isAuthenticated, user, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    router.push('/login');
  };

  const menuItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Manajemen Proyek', href: '/projects', icon: Building2 },
    { name: 'Karyawan & Kru', href: '/profiles', icon: Users },
  ];

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN')) {
    return null; // Prevent flash of content
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row">
      {/* Sidebar for Desktop / Header for Mobile */}
      <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-sm">
        <div className="p-6 flex items-center justify-between md:justify-center border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-xl font-black tracking-tighter text-primary">Habs Crew</h1>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 hidden md:block">
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
                  className={`w-full justify-start ${isActive ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'text-slate-600 dark:text-slate-400'}`}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 hidden md:block">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
              {user?.nama?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{user?.nama}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-3" />
            Keluar
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full animate-in-up">
        {children}
      </main>
    </div>
  );
}
