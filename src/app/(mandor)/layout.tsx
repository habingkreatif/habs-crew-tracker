'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MapPin, CheckSquare } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MandorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    // Simple client-side protection
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const navItems = [
    { name: 'Home', href: '/home', icon: Home },
    { name: 'Absen', href: '/absen', icon: MapPin },
    { name: 'Tugas', href: '/tugas', icon: CheckSquare },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 pb-16">
      {/* Main Content */}
      <main className="flex-1 w-full max-w-md mx-auto relative shadow-2xl bg-white dark:bg-black min-h-screen">
        {children}

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 w-full max-w-md bg-white/80 dark:bg-black/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 z-50 px-6 py-3 pb-safe">
          <ul className="flex justify-between items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/home' && pathname.startsWith(item.href));

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300 ${isActive
                      ? 'text-primary scale-110'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                      }`}
                  >
                    <Icon className={`w-6 h-6 mb-1 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                    <span className="text-[10px] font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </main>
    </div>
  );
}
