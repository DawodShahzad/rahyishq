'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { BookOpen, Sparkles, ArrowRight, Quote } from 'lucide-react';

export default function ThreeDScrollBook() {
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const bookRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrollY(window.scrollY);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!bookRef.current) return;
      const rect = bookRef.current.getBoundingClientRect();
      const x = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const y = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      setMousePos({ x, y });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouseMove);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  // Compute 3D rotation angles based on scroll position (0 to 600px)
  const progress = Math.min(Math.max((scrollY - 100) / 450, 0), 1);
  const rotateX = 18 - progress * 22 + mousePos.y * 6;
  const rotateY = -14 + progress * 20 + mousePos.x * 8;
  const rotateZ = (progress - 0.5) * 4;
  const pageFoldAngle = progress * 170; // 0 to 170 deg page turn

  return (
    <div className="relative py-16 flex flex-col items-center justify-center overflow-hidden">
      {/* Background glow orb */}
      <div 
        className="absolute w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none -z-10"
        style={{
          transform: `scale(${1 + progress * 0.4})`,
        }}
      />

      <div className="text-center max-w-2xl px-4 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs tracking-widest uppercase mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          3D Interactive Tome of Wisdom
        </div>
        <h2 className="text-2xl sm:text-4xl font-serif-title font-bold text-amber-200">
          The Living Pages of <span className="gold-text-gradient">Makalat-e-Hikmat</span>
        </h2>
        <p className="text-xs sm:text-sm text-emerald-200/70 mt-2">
          Scroll down to open the sacred leaves penned by Hazrat Sufi Muhammad Barkat Ali (R.A.)
        </p>
      </div>

      {/* 3D Container with Perspective */}
      <div 
        ref={bookRef}
        className="w-full max-w-4xl px-4 sm:px-6 perspective-2000 flex items-center justify-center min-h-[460px] sm:min-h-[520px]"
      >
        <div 
          className="relative w-full max-w-3xl transition-transform duration-300 ease-out preserve-3d"
          style={{
            transform: `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
          }}
        >
          {/* Main Book Body (Open Two-page spread) */}
          <div className="relative grid grid-cols-1 md:grid-cols-2 rounded-2xl bg-[#07241a] border-2 border-amber-500/40 shadow-[0_30px_70px_rgba(0,0,0,0.8),0_0_40px_rgba(230,184,74,0.15)] overflow-hidden">
            
            {/* Center Spine Divider with Gold Ribbing */}
            <div className="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-8 bg-gradient-to-r from-emerald-950 via-[#103e2c] to-emerald-950 z-20 border-x border-amber-500/30 shadow-inner">
              <div className="h-full w-full flex flex-col justify-around items-center opacity-40">
                <div className="w-1 h-12 bg-amber-400/50 rounded-full" />
                <div className="w-1 h-12 bg-amber-400/50 rounded-full" />
                <div className="w-1 h-12 bg-amber-400/50 rounded-full" />
              </div>
            </div>

            {/* Left Page (Urdu Sacred Maxim) */}
            <div className="p-6 sm:p-10 flex flex-col justify-between bg-gradient-to-br from-[#082b20] to-[#041a13] border-b md:border-b-0 md:border-r border-amber-500/20 relative">
              {/* Corner Arabesque */}
              <div className="absolute top-3 left-3 text-amber-500/30 text-xs font-serif-title">
                ✦ ۳۰ جلدیں ✦
              </div>

              <div>
                <div className="flex items-center gap-2 text-amber-400/80 text-xs uppercase tracking-wider mb-4">
                  <Quote className="w-4 h-4 text-amber-400" />
                  <span>جلد اول • حکمت نمبر ۱</span>
                </div>
                <div className="text-right my-4">
                  <p className="font-urdu text-xl sm:text-2xl text-amber-100 font-semibold leading-loose sm:leading-[2.5]">
                    اے دوست! دنیا کے تمام کام اپنے وقت پر ہوتے ہیں، مگر ذکرِ الٰہی ہر وقت ہوتا ہے۔
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-amber-500/20 flex items-center justify-between text-xs text-emerald-300/70">
                <span>حضرت بابا جی (رحمۃ اللہ علیہ)</span>
                <span className="font-mono text-amber-400/80">صفحہ ۱</span>
              </div>
            </div>

            {/* Right Page (English Translation & Reflection) */}
            <div className="p-6 sm:p-10 flex flex-col justify-between bg-gradient-to-bl from-[#082b20] to-[#041a13] relative">
              {/* Corner Arabesque */}
              <div className="absolute top-3 right-3 text-amber-500/30 text-xs font-serif-title">
                ✦ 10,000+ Pearls ✦
              </div>

              <div>
                <div className="flex items-center gap-2 text-amber-400/80 text-xs uppercase tracking-wider mb-4">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>English Translation</span>
                </div>
                <p className="text-sm sm:text-base text-emerald-100/90 italic font-serif leading-relaxed mb-4">
                  “O friend! All mundane tasks and worldly pursuits take place at their appointed season, but the continuous remembrance of Allah (Zikr-e-Ilahi) is for every single breath and every passing moment.”
                </p>
                <div className="inline-block bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-1.5 text-xs text-amber-300">
                  Theme: Perpetual Remembrance (Dawaam-e-Zikr)
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-amber-500/20 flex items-center justify-between">
                <Link
                  href="/makalat"
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-amber-300 hover:text-amber-100 transition-colors group"
                >
                  <span>Explore All Feeds</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </Link>
                <span className="font-mono text-xs text-amber-400/80">Page 2</span>
              </div>
            </div>

          </div>

          {/* Animated Turning Page (3D Scroll Reveal) */}
          <div 
            className="hidden md:block absolute top-0 bottom-0 left-1/2 w-1/2 origin-left preserve-3d pointer-events-none transition-transform duration-75"
            style={{
              transform: `rotateY(-${pageFoldAngle}deg)`,
              transformStyle: 'preserve-3d',
              zIndex: progress > 0.05 && progress < 0.95 ? 30 : -1,
              opacity: progress > 0.05 && progress < 0.95 ? 0.95 : 0,
            }}
          >
            {/* Front of Turning Page */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-[#0a3526] to-[#0d4431] border-2 border-amber-500/50 rounded-r-2xl p-8 flex flex-col justify-between shadow-2xl backface-hidden">
              <div className="text-amber-400 text-xs uppercase tracking-widest">
                درِ احسان • حکمت نامہ
              </div>
              <div className="text-center font-urdu text-xl text-amber-200">
                اللہ تعالیٰ کے بندوں کی خدمت کرنا سب سے بڑی عبادت ہے۔
              </div>
              <div className="text-right text-xs text-amber-400/70">
                ورق گردانی جاری ہے...
              </div>
            </div>
          </div>

          {/* Bottom shadow base */}
          <div className="w-4/5 mx-auto h-6 bg-black/60 blur-xl -mt-2 rounded-full" />
        </div>
      </div>

      {/* Interactive Helper Text */}
      <div className="mt-6 flex items-center gap-3 text-xs text-amber-300/60 font-mono">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        <span>3D Scroll Depth: {(progress * 100).toFixed(0)}% • Tilt active</span>
      </div>
    </div>
  );
}
