'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  Eye, 
  Heart, 
  Copy, 
  Check, 
  Volume2, 
  Share2, 
  Compass, 
  ChevronRight,
  ShieldCheck,
  Search,
  CheckCircle2
} from 'lucide-react';

export default function PaymoScrollHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    // 1. Mouse glow tracking
    const handleMouseMove = (e: MouseEvent) => {
      const glow = document.getElementById('cursor-glow');
      if (glow) {
        glow.style.opacity = '1';
        glow.style.transform = `translate3d(${e.clientX - 300}px, ${e.clientY - 300}px, 0)`;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 2. Scroll Progress scrubbing
    const handleScroll = () => {
      // Top line progress bar
      const totalDocHeight = document.documentElement.scrollHeight - window.innerHeight;
      const docProgress = totalDocHeight > 0 ? window.scrollY / totalDocHeight : 0;
      const progressBar = document.getElementById('top-scroll-progress');
      if (progressBar) {
        progressBar.style.transform = `scaleX(${docProgress})`;
      }

      // Hero 300vh section progress
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerHeight = containerRef.current.offsetHeight - window.innerHeight;
      const currentScroll = -rect.top;
      const progress = Math.min(Math.max(currentScroll / containerHeight, 0), 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Compute 3D transforms based on progress (identical to paymo.dawod.pk 3D card scrub)
  // Stage 1 (0 -> 0.4): Initial 3D tilt -> straightens
  // Stage 2 (0.4 -> 0.8): Zooms in, straight forward
  // Stage 3 (0.8 -> 1.0): Gentle exit tilt
  const rotateX = 12 - scrollProgress * 14;
  const rotateY = -28 + scrollProgress * 32;
  const rotateZ = 4 - scrollProgress * 5;
  const translateX = 160 - scrollProgress * 170;
  const scale = 0.96 + scrollProgress * 0.1;

  // Active stage determination
  const activeStage = scrollProgress < 0.35 ? 0 : scrollProgress < 0.7 ? 1 : 2;

  const handleCopy = () => {
    navigator.clipboard.writeText(
      '"اے دوست! دنیا کے تمام کام اپنے وقت پر ہوتے ہیں، مگر ذکرِ الٰہی ہر وقت ہوتا ہے۔"\n— Hazrat Sufi Abu Anees Muhammad Barkat Ali (R.A.)'
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAudio = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(
      'O friend! All worldly affairs occur at their appointed times, but the remembrance of Allah is for every single moment.'
    );
    utterance.rate = 0.88;
    utterance.onend = () => setIsPlayingAudio(false);
    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <section ref={containerRef} className="relative h-[300vh] bg-black">
      
      {/* Sticky Pinned Viewport Container */}
      <div className="sticky top-0 h-screen overflow-hidden text-white bg-black bg-[linear-gradient(180deg,#0a2419_0%,#05150e_16%,#000000_34%)] flex items-center">
        
        {/* Left Side Stepper Navigation (Paymo Style) */}
        <nav 
          aria-label="Sections Stepper" 
          className="fixed top-[40%] left-6 z-[60] hidden lg:flex flex-col gap-2.5"
        >
          {[
            { label: 'Dar-ul-Ehsan', stage: 0 },
            { label: 'Makalat-e-Hikmat', stage: 1 },
            { label: 'Free Eye Camps', stage: 2 },
          ].map((item) => {
            const isActive = activeStage === item.stage;
            return (
              <div key={item.label} className="relative flex items-center h-[20px]">
                <span 
                  className="block h-[2px] rounded-full transition-all duration-300 ease-out" 
                  style={{
                    width: isActive ? '20px' : '8px',
                    backgroundColor: isActive ? '#c6ff33' : 'rgba(255,255,255,0.3)',
                  }}
                />
                <span 
                  className={`ml-3 text-[12px] font-semibold tracking-tightest transition-all duration-300 ${
                    isActive ? 'text-[#c6ff33] opacity-100 translate-x-0' : 'text-white/40 opacity-70 -translate-x-1'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </nav>

        {/* Ambient Radial Glow Orb */}
        <div 
          aria-hidden="true" 
          className="pointer-events-none absolute top-1/2 left-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-500"
          style={{
            background: activeStage === 0
              ? 'radial-gradient(closest-side, rgba(16,185,129,0.35), rgba(198,255,51,0.12)_55%, transparent)'
              : activeStage === 1
              ? 'radial-gradient(closest-side, rgba(230,184,74,0.4), rgba(198,255,51,0.14)_55%, transparent)'
              : 'radial-gradient(closest-side, rgba(6,182,212,0.35), rgba(16,185,129,0.14)_55%, transparent)',
            transform: `translate3d(${translateX}px, 0, 0)`,
          }}
        />

        {/* Main Split Grid */}
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 pt-16 lg:pt-0">
          
          {/* LEFT COLUMN: Dynamic Scrollytelling Copy */}
          <div className="lg:col-span-6 max-w-xl">
            
            {/* Stage Indicator Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.12] text-xs font-semibold tracking-tightest text-[#c6ff33] mb-5 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c6ff33] animate-ping" />
              <span>
                {activeStage === 0 && 'Spiritual Luminary of Dar-ul-Ehsan'}
                {activeStage === 1 && '30 Volumes • 10,000+ Aphorisms'}
                {activeStage === 2 && '500,000+ Eye Surgeries • Zero Fees'}
              </span>
            </div>

            {/* Stage 0 Copy */}
            {activeStage === 0 && (
              <div className="transition-all duration-500 ease-out animate-fadeIn">
                <h1 className="text-4xl sm:text-6xl font-bold tracking-tightest leading-[1.05] text-white">
                  Clarity for <br />
                  <span className="text-shimmer">your soul.</span>
                </h1>
                <p className="mt-5 text-base sm:text-lg text-white/70 leading-relaxed font-normal tracking-tight-custom">
                  Dedicated to <strong className="text-white font-semibold">Hazrat Sufi Abu Anees Muhammad Barkat Ali (رحمۃ اللہ علیہ)</strong>. The timeless master of perpetual Zikr, selflessness, and unconditional service to humanity.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link href="/makalat" className="btn-lime">
                    <span>Explore Wisdom Feeds</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/about" className="btn-dark">
                    <span>Life & Legacy Chronicle</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Stage 1 Copy */}
            {activeStage === 1 && (
              <div className="transition-all duration-500 ease-out animate-fadeIn">
                <h2 className="text-4xl sm:text-6xl font-bold tracking-tightest leading-[1.05] text-white">
                  The Living Words of <br />
                  <span className="text-shimmer">Makalat-e-Hikmat.</span>
                </h2>
                <p className="mt-5 text-base sm:text-lg text-white/70 leading-relaxed font-normal tracking-tight-custom">
                  30 comprehensive volumes penned without commercial gain. Addressed affectionately with <span className="font-urdu text-[#c6ff33] text-xl font-bold">”اے دوست!“</span> (&ldquo;O friend!&rdquo;), touching every dimension of faith, morals, and spiritual elevation.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link href="/makalat" className="btn-lime">
                    <span>Read All 30 Volumes</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button onClick={handleCopy} className="btn-dark">
                    {copied ? <Check className="w-4 h-4 text-[#c6ff33]" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied to Clipboard' : 'Copy Maxim #1'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Stage 2 Copy */}
            {activeStage === 2 && (
              <div className="transition-all duration-500 ease-out animate-fadeIn">
                <h2 className="text-4xl sm:text-6xl font-bold tracking-tightest leading-[1.05] text-white">
                  Radical Compassion. <br />
                  <span className="text-shimmer">Free Eye Hospitals.</span>
                </h2>
                <p className="mt-5 text-base sm:text-lg text-white/70 leading-relaxed font-normal tracking-tight-custom">
                  Over half a million cataract surgeries performed free of charge. High-grade lenses, post-op care, meals, and lodging provided without taking a single rupee in donations.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link href="/about" className="btn-lime">
                    <span>Read The Hospital Story</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/gallery" className="btn-dark">
                    <span>View Archival Photos</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Scroll Progress Helper */}
            <div className="mt-10 flex items-center gap-3 text-xs text-white/40 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c6ff33]" />
              <span>Scroll down to interact with 3D Wisdom Tablet ({(scrollProgress * 100).toFixed(0)}%)</span>
            </div>
          </div>

          {/* RIGHT COLUMN: The 3D Rotating Device / Spiritual Wisdom Tablet */}
          <div className="lg:col-span-6 flex items-center justify-center [perspective:1800px] py-6">
            <div 
              className="relative transition-transform duration-100 ease-out preserve-3d will-change-transform"
              style={{
                transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
              }}
            >
              
              {/* Device Bezel & Hardware Shadow (Matches Paymo 3D phone specs) */}
              <div 
                aria-hidden="true" 
                className="absolute inset-0 rounded-[54px] pointer-events-none"
                style={{
                  boxShadow: '1px 0 0 #3a3a40, 2px 0 0 #2e2e34, 3px 1px 0 #26262a, 4px 1px 0 #1f1f23, 5px 1px 0 #18181c, 6px 2px 0 #131316, 7px 2px 0 #0e0e11, 25px 40px 70px rgba(0,0,0,0.85)',
                }}
              />

              {/* Hardware Outer Frame with Subtle Metallic Sheen */}
              <div className="relative rounded-[54px] bg-gradient-to-tr from-[#2a2a30] via-[#141417] to-[#3e3e46] p-[3px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]">
                
                {/* Inner Device Screen */}
                <div className="relative w-[320px] sm:w-[350px] h-[640px] rounded-[50px] bg-black overflow-hidden flex flex-col justify-between border border-white/[0.08] shadow-inner">
                  
                  {/* Status Bar */}
                  <div className="relative z-30 flex items-center justify-between px-7 pt-4 text-xs font-semibold tracking-tight text-white/80">
                    <span>9:41</span>
                    {/* Dynamic Island Pill */}
                    <div className="w-24 h-5 rounded-full bg-black border border-white/[0.1] flex items-center justify-center gap-1.5 px-2">
                      <span className="w-2 h-2 rounded-full bg-[#c6ff33] animate-pulse" />
                      <span className="text-[10px] text-white/80 font-mono tracking-tightest">Dar-ul-Ehsan</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono text-[#c6ff33]">5G</span>
                      <div className="w-5 h-2.5 rounded-sm border border-white/60 p-0.5 flex items-center">
                        <div className="h-full w-full bg-[#c6ff33] rounded-[1px]" />
                      </div>
                    </div>
                  </div>

                  {/* App Screen Content */}
                  <div className="relative z-20 px-5 pt-3 pb-4 flex-1 flex flex-col justify-between overflow-hidden">
                    
                    {/* App Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#10b981] to-[#c6ff33] p-[1.5px]">
                          <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-xs font-bold text-[#c6ff33]">
                            د
                          </div>
                        </div>
                        <div>
                          <p className="text-[12px] font-bold tracking-tightest text-white leading-none">
                            Dar-ul-Ehsan Archive
                          </p>
                          <p className="text-[10px] text-white/50 tracking-tight leading-none mt-1">
                            Hazrat Sufi Barkat Ali (R.A.)
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#c6ff33]/15 text-[#c6ff33] border border-[#c6ff33]/30 text-[10px] font-semibold">
                        Vol. 1
                      </span>
                    </div>

                    {/* Wisdom Counter Card */}
                    <div className="my-3 p-4 rounded-2xl bg-gradient-to-br from-[#0c2419] to-[#04120d] border border-[#c6ff33]/25 shadow-lg">
                      <div className="flex items-center justify-between text-[11px] text-white/60 font-medium">
                        <span>Current Wisdom Feed</span>
                        <span className="text-[#c6ff33] font-mono">Hikmat #1</span>
                      </div>
                      <div className="mt-2 text-right">
                        <p className="font-urdu text-lg text-white font-bold leading-relaxed">
                          اے دوست! دنیا کے تمام کام اپنے وقت پر ہوتے ہیں، مگر ذکرِ الٰہی ہر وقت ہوتا ہے۔
                        </p>
                      </div>
                      <p className="mt-2 text-[11px] text-white/80 italic font-sans leading-snug">
                        &ldquo;All worldly pursuits have their appointed time, but remembrance of Allah is for every breath.&rdquo;
                      </p>
                    </div>

                    {/* Interactive Action Pills inside Device */}
                    <div className="flex items-center justify-around py-2 px-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                      <button 
                        onClick={handleAudio}
                        className="flex flex-col items-center gap-1 text-[10px] text-white/80 hover:text-[#c6ff33]"
                      >
                        <div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center text-white">
                          <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'text-[#c6ff33] animate-pulse' : ''}`} />
                        </div>
                        <span>Listen</span>
                      </button>

                      <button 
                        onClick={handleCopy}
                        className="flex flex-col items-center gap-1 text-[10px] text-white/80 hover:text-[#c6ff33]"
                      >
                        <div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center text-white">
                          {copied ? <Check className="w-4 h-4 text-[#c6ff33]" /> : <Copy className="w-4 h-4" />}
                        </div>
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>

                      <Link 
                        href="/makalat"
                        className="flex flex-col items-center gap-1 text-[10px] text-white/80 hover:text-[#c6ff33]"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#c6ff33] flex items-center justify-center text-black">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-white">Feeds</span>
                      </Link>
                    </div>

                    {/* Quick Feed List Inside Device */}
                    <div className="mt-3 flex-1 flex flex-col gap-2 overflow-hidden">
                      <p className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">
                        Active Wisdom Streams
                      </p>
                      <div className="space-y-1.5 text-xs">
                        <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-between">
                          <span className="text-[11px] font-medium text-white truncate">Service to Humanity (Khidmat)</span>
                          <span className="text-[10px] font-mono text-[#c6ff33] bg-[#c6ff33]/10 px-1.5 py-0.5 rounded">Active</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-between">
                          <span className="text-[11px] font-medium text-white truncate">Tazkiya & Inner Peace</span>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Daily</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-between">
                          <span className="text-[11px] font-medium text-white truncate">Love for the Holy Prophet ﷺ</span>
                          <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">Sacred</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Device Bottom Home Bar */}
                  <div className="relative z-30 flex justify-center pb-2 pt-1">
                    <div className="w-32 h-1 bg-white/30 rounded-full" />
                  </div>

                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
