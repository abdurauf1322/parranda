import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldCheck, ArrowRight, Sun, Bird, Trees, Home } from 'lucide-react';

interface SplashIntroProps {
  onEnter: () => void;
}

export const SplashIntro: React.FC<SplashIntroProps> = ({ onEnter }) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(onEnter, 600);
          }, 300);
          return 100;
        }
        return prev + 4;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [onEnter]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-emerald-950 via-slate-950 to-slate-900 text-white p-6 transition-opacity duration-600 ${
        isFadingOut ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Animated Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-amber-500/30 blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-emerald-500/30 blur-3xl animate-pulse" style={{ animationDuration: '3s' }} />
      </div>

      {/* Top Header info */}
      <div className="relative z-10 w-full max-w-4xl flex items-center justify-between pt-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-300 text-xs font-bold animate-bounce">
          <Sparkles className="w-3.5 h-3.5" />
          <span>O'zbekistondagi yetakchi parrandachilik kompleksi</span>
        </div>
        <button
          onClick={() => {
            setIsFadingOut(true);
            setTimeout(onEnter, 600);
          }}
          className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 transition-all flex items-center gap-1"
        >
          <span>O'tkazib yuborish</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Central Alive Artwork & Branding */}
      <div className="relative z-10 flex flex-col items-center max-w-xl text-center space-y-6 my-auto">
        {/* Animated Farm Illustration Container */}
        <div className="relative w-full aspect-[16/10] max-w-md rounded-3xl overflow-hidden border-2 border-emerald-500/40 shadow-2xl bg-gradient-to-b from-sky-400/20 via-emerald-900/40 to-slate-900 p-4 flex flex-col justify-end">
          {/* Sun & Clouds */}
          <div className="absolute top-4 right-6 w-14 h-14 rounded-full bg-amber-400/30 border border-amber-400/60 flex items-center justify-center animate-spin" style={{ animationDuration: '20s' }}>
            <Sun className="w-8 h-8 text-amber-300" />
          </div>

          {/* Flying Birds in Sky */}
          <div className="absolute top-8 left-12 flex gap-3 text-amber-200/80 animate-pulse">
            <Bird className="w-5 h-5 -rotate-12 animate-bounce" />
            <Bird className="w-4 h-4 rotate-6 animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>

          {/* Farm House Background */}
          <div className="absolute right-8 bottom-20 flex flex-col items-end opacity-90">
            <Home className="w-16 h-16 text-amber-100/90 drop-shadow-lg animate-pulse" />
            <div className="w-20 h-2 bg-emerald-700/80 rounded-full mt-1" />
          </div>

          {/* Fence & Rooster/Chickens Foreground */}
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between px-2">
            {/* Animated Rooster */}
            <div className="flex flex-col items-center animate-bounce" style={{ animationDuration: '2s' }}>
              <div className="text-3xl filter drop-shadow">🐓</div>
            </div>

            {/* Walking Hens */}
            <div className="flex items-center gap-3 animate-pulse">
              <span className="text-2xl animate-bounce" style={{ animationDuration: '1.5s' }}>🐔</span>
              <span className="text-xl animate-bounce" style={{ animationDuration: '1.8s', animationDelay: '0.3s' }}>🐥</span>
              <span className="text-2xl animate-bounce" style={{ animationDuration: '1.6s', animationDelay: '0.5s' }}>🐔</span>
            </div>
          </div>

          {/* Grass Floor Gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-emerald-900/90 to-transparent pointer-events-none" />
        </div>

        {/* Brand Typography */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-amber-500/30 animate-pulse">
              3
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-md">
              Uychi <span className="text-amber-400">Parranda</span>
            </h1>
          </div>
          <p className="text-lg font-serif italic text-amber-200/95 tracking-wide">
            "Ichida Salomatlik Bor"
          </p>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 max-w-md leading-relaxed">
          Parrandachilik fabrikasi avtomatlashtirilgan boshqaruv, kunlik shaffoflik va sifat nazorati tizimi yuklanmoqda...
        </p>
      </div>

      {/* Bottom Loading Progress Bar */}
      <div className="relative z-10 w-full max-w-md pb-6 space-y-3">
        <div className="flex justify-between text-xs font-mono text-slate-400 font-bold">
          <span className="text-amber-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Tizim ishga tushmoqda</span>
          </span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-500 rounded-full transition-all duration-70"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
