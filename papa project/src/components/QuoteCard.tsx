'use client';

import { useState } from 'react';
import { QuoteItem } from '@/types';
import { 
  Copy, 
  Check, 
  Share2, 
  Heart, 
  Volume2, 
  Download, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { toggleFavorite } from '@/lib/dataService';

interface QuoteCardProps {
  quote: QuoteItem;
  onFavoriteChange?: () => void;
  isFavorited?: boolean;
}

export default function QuoteCard({ quote, onFavoriteChange, isFavorited: initialFav }: QuoteCardProps) {
  const [copied, setCopied] = useState(false);
  const [isFav, setIsFav] = useState(initialFav || false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Copy to clipboard
  const handleCopy = async () => {
    const textToCopy = `"${quote.urdu}"\n\n"${quote.english}"\n\n— Hazrat Sufi Abu Anees Muhammad Barkat Ali (R.A.)\n(${quote.volume || 'Makalat-e-Hikmat'}${quote.number ? ` • ${quote.number}` : ''})`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      confetti({
        particleCount: 25,
        spread: 40,
        origin: { y: 0.8 },
        colors: ['#c6ff33', '#10b981', '#ffffff'],
      });
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  // Share
  const handleShare = async () => {
    const shareData = {
      title: `Makalat-e-Hikmat • ${quote.theme}`,
      text: `${quote.urdu}\n\n${quote.english}\n— Hazrat Sufi Muhammad Barkat Ali (R.A.)`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {}
    } else {
      handleCopy();
    }
  };

  const handleToggleFav = () => {
    const nextState = toggleFavorite(quote.id);
    setIsFav(nextState);
    if (onFavoriteChange) onFavoriteChange();
  };

  const handleReadAloud = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(quote.english);
    utterance.rate = 0.88;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleDownloadCard = () => {
    setIsGeneratingImage(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 700;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Dark obsidian background
      ctx.fillStyle = '#08080a';
      ctx.fillRect(0, 0, 1200, 700);

      // Lime-emerald border
      ctx.strokeStyle = '#c6ff33';
      ctx.lineWidth = 4;
      ctx.strokeRect(36, 36, 1128, 628);

      // Header Tag
      ctx.fillStyle = '#c6ff33';
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MAKALAT-E-HIKMAT • DAR-UL-EHSAN', 600, 95);

      // Urdu Text (Centered, large)
      ctx.fillStyle = '#ffffff';
      ctx.font = '36px "Noto Nastaliq Urdu", serif';
      ctx.direction = 'rtl';
      const urduWords = quote.urdu.split(' ');
      let urduLine = '';
      let urduY = 220;
      for (let i = 0; i < urduWords.length; i++) {
        const testLine = urduLine + urduWords[i] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 950 && i > 0) {
          ctx.fillText(urduLine, 600, urduY);
          urduLine = urduWords[i] + ' ';
          urduY += 60;
        } else {
          urduLine = testLine;
        }
      }
      ctx.fillText(urduLine, 600, urduY);

      // Divider Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(400, urduY + 50);
      ctx.lineTo(800, urduY + 50);
      ctx.stroke();

      // English Text
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '500 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.direction = 'ltr';
      const engWords = quote.english.split(' ');
      let engLine = '';
      let engY = urduY + 110;
      for (let i = 0; i < engWords.length; i++) {
        const testLine = engLine + engWords[i] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 950 && i > 0) {
          ctx.fillText(engLine, 600, engY);
          engLine = engWords[i] + ' ';
          engY += 34;
        } else {
          engLine = testLine;
        }
      }
      ctx.fillText(engLine, 600, engY);

      // Author Footer
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText('— Hazrat Sufi Abu Anees Muhammad Barkat Ali (R.A.)', 600, 590);

      ctx.fillStyle = '#c6ff33';
      ctx.font = '14px monospace';
      ctx.fillText(`${quote.volume || 'Makalat-e-Hikmat'}${quote.number ? ` • ${quote.number}` : ''}`, 600, 620);

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `makalat-quote-${quote.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <article className="paymo-card p-6 sm:p-7 flex flex-col justify-between group hover:border-[#c6ff33]/40 transition-all duration-300">
      
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-4 border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold tracking-tightest px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-[#c6ff33]">
            {quote.category.toUpperCase()}
          </span>
          {quote.number && (
            <span className="text-[11px] font-mono text-white/60 bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.06]">
              {quote.number}
            </span>
          )}
        </div>
        <div className="text-[11px] text-white/40 font-mono">
          {quote.volume || 'Makalat-e-Hikmat'}
        </div>
      </div>

      {/* Urdu Quote */}
      <div className="text-right my-3">
        <p className="font-urdu text-xl sm:text-2xl text-white font-semibold leading-relaxed sm:leading-[2.5]">
          {quote.urdu}
        </p>
      </div>

      {/* English Translation */}
      <div className="mt-3 pt-3 border-t border-white/[0.06]">
        <p className="text-sm sm:text-[15px] text-white/75 leading-relaxed font-normal tracking-tight-custom">
          &ldquo;{quote.english}&rdquo;
        </p>
      </div>

      {/* Author & Concept */}
      <div className="mt-4 flex items-center justify-between text-xs text-white/50">
        <div className="flex items-center gap-1.5 font-medium text-white/80">
          <span>{quote.author}</span>
        </div>
        <span className="text-[11px] font-mono text-[#c6ff33]/80">
          {quote.theme}
        </span>
      </div>

      {/* Action Toolbar */}
      <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-tightest transition-all ${
              copied
                ? 'bg-[#c6ff33] text-black'
                : 'bg-white/[0.06] hover:bg-white/[0.12] text-white/80 border border-white/[0.08]'
            }`}
            title="Copy Quote"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/70 hover:text-white border border-white/[0.08] transition-colors"
            title="Share Quote"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleReadAloud}
            className={`p-2 rounded-full border transition-colors ${
              isPlayingAudio
                ? 'bg-[#c6ff33] text-black border-[#c6ff33] animate-pulse'
                : 'bg-white/[0.06] hover:bg-white/[0.12] text-white/70 hover:text-white border border-white/[0.08]'
            }`}
            title={isPlayingAudio ? "Stop Reading" : "Read Aloud"}
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleDownloadCard}
            disabled={isGeneratingImage}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/80 border border-white/[0.08] text-xs font-semibold tracking-tightest transition-colors"
            title="Download Quote as Image Card"
          >
            <Download className="w-3.5 h-3.5 text-[#c6ff33]" />
            <span className="hidden sm:inline">{isGeneratingImage ? 'Exporting...' : 'Card'}</span>
          </button>
        </div>

        <button
          onClick={handleToggleFav}
          className={`p-2 rounded-full transition-transform active:scale-125 ${
            isFav
              ? 'text-rose-500 bg-rose-500/10 border border-rose-500/30'
              : 'text-white/40 hover:text-rose-400 bg-white/[0.04] border border-white/[0.06]'
          }`}
          title={isFav ? "Saved to Favorites" : "Bookmark"}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
        </button>
      </div>

    </article>
  );
}
