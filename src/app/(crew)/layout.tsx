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

        {/* Solid Bottom Navigation (Mobile Banking Style) */}
        <div className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.5)]">
          <nav className="px-2">
            <ul className="flex justify-between items-center h-[68px]">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/home' && pathname.startsWith(item.href));

                return (
                  <li key={item.name} className="relative z-10 w-full h-full">
                    <Link
                      href={item.href}
                      className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 group ${isActive
                          ? 'text-primary'
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                    >
                      <div className="relative flex flex-col items-center justify-center">
                        <Icon className={`w-[22px] h-[22px] mb-1 transition-all duration-300 ${isActive ? 'stroke-[2.5px] text-primary scale-110' : 'stroke-2'}`} />
                        <span className={`text-[10px] transition-all duration-300 ${isActive ? 'font-bold' : 'font-medium'}`}>{item.name}</span>
                        
                        {/* Active Indicator Top Line */}
                        {isActive && (
                          <div className="absolute -top-3 w-8 h-[3px] rounded-b-full bg-primary animate-in zoom-in-90 duration-300" />
                        )}
                      </div>
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
