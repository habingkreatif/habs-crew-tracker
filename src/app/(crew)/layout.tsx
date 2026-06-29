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

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 pb-safe">
      {/* Main Content */}
      <main className="flex-1 w-full max-w-md mx-auto relative shadow-2xl shadow-primary/5 bg-slate-50 dark:bg-black min-h-screen">
        {children}
      </main>
    </div>
  );
}
