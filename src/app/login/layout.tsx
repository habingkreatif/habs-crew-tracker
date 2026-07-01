import React from 'react';

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex w-full bg-slate-50 dark:bg-slate-950">
      {/* Left side - Branding/Image (Hidden on mobile) */}
      <div className="hidden lg:flex flex-1 relative bg-slate-900 items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-overlay"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541888087895-364eebbb690d?q=80&w=2938&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent" />
        
        {/* Content */}
        <div className="relative z-10 p-12 xl:p-20 max-w-2xl text-white w-full">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-primary/30 transform transition-transform hover:scale-105 duration-500 border border-white/10 backdrop-blur-md">
             <svg className="w-10 h-10 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-5xl xl:text-6xl font-extrabold mb-6 tracking-tight leading-[1.1] animate-in-up">
            Membangun Masa Depan Lebih <span className="text-primary drop-shadow-md">Terukur.</span>
          </h1>
          <p className="text-lg xl:text-xl text-slate-300 leading-relaxed font-light animate-in-up mb-12" style={{ animationDelay: '100ms' }}>
            Habs Crew Tracker membantu Anda mengelola kehadiran, target harian, dan evaluasi kinerja kru lapangan secara real-time.
          </p>
          
          {/* Decorative floating badges */}
          <div className="flex flex-wrap gap-4 animate-in-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/10 px-5 py-3 rounded-full shadow-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium tracking-wide">Tracking Real-time</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/10 px-5 py-3 rounded-full shadow-xl">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-sm font-medium tracking-wide">Akurasi Geofence</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col relative bg-primary lg:bg-slate-50 dark:lg:bg-slate-950 overflow-x-hidden">
        {/* Mobile Background Accents */}
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-white/10 rounded-full blur-[80px] pointer-events-none lg:hidden" />
        <div className="absolute top-[20%] left-[-20%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[80px] pointer-events-none lg:hidden" />
        
        {/* Pattern overlay for mobile */}
        <div className="absolute inset-0 opacity-10 lg:hidden bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none mix-blend-overlay"></div>

        <main className="w-full flex-1 flex flex-col relative z-10 lg:items-center lg:justify-center sm:p-12">
          <div className="w-full max-w-[420px] mx-auto h-full flex flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
