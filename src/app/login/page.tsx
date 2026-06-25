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

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
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
    <Card className="glass-panel border-0 shadow-2xl">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
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
        <CardTitle className="text-2xl font-bold tracking-tight">Habs Crew Tracker</CardTitle>
        <CardDescription>
          Masukkan email dan password untuk masuk ke sistem
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="mandor@habs.co.id"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 transition-all duration-200 focus-visible:ring-primary/50 bg-white/50 dark:bg-black/50"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 transition-all duration-200 focus-visible:ring-primary/50 bg-white/50 dark:bg-black/50"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full h-11 text-base font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-primary/20" 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? 'Memverifikasi...' : 'Masuk'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
