'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MapPin, CheckSquare } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function MandorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace('/login');
    } else if (user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') {
      router.replace('/');
    }
  }, [isAuthenticated, user, router, isHydrated]);

  if (!isHydrated || !isAuthenticated || user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') {
    return null;
  }

  const navItems = [
    { name: 'Home', href: '/home', icon: Home },
    { name: 'Absen', href: '/absen', icon: MapPin },
    { name: 'Tugas', href: '/tugas', icon: CheckSquare },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      {/* Main Content */}
      <main className="flex-1 w-full max-w-md mx-auto relative shadow-2xl shadow-primary/5 bg-slate-50 dark:bg-black min-h-screen">
        {children}

        {/* Floating Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto z-50 p-4 pb-safe-offset-4 pointer-events-none">
          <nav className="pointer-events-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 shadow-xl shadow-slate-200/50 dark:shadow-black/50 rounded-3xl px-6 py-3">
            <ul className="flex justify-between items-center relative">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/home' && pathname.startsWith(item.href));

                return (
                  <li key={item.name} className="relative z-10">
                    <Link
                      href={item.href}
                      className={`flex flex-col items-center p-2 transition-all duration-500 ease-out ${
                        isActive
                          ? 'text-primary scale-110'
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute inset-0 bg-primary/10 rounded-2xl -z-10 animate-in zoom-in-50 duration-300" />
                      )}
                      <Icon className={`w-6 h-6 mb-1 transition-all duration-300 ${isActive ? 'stroke-[2.5px] drop-shadow-md' : 'stroke-2'}`} />
                      <span className={`text-[10px] transition-all duration-300 ${isActive ? 'font-bold' : 'font-medium'}`}>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </main>
    </div>
  );
}
