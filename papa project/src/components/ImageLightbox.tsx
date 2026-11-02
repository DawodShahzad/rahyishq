'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { GalleryImage } from '@/types';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Copy, 
  Check, 
  Maximize2,
  Calendar,
  MapPin,
  Tag
} from 'lucide-react';

interface ImageLightboxProps {
  image: GalleryImage | null;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export default function ImageLightbox({
  image,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
}: ImageLightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    if (!image) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && onNext && hasNext) onNext();
      if (e.key === 'ArrowLeft' && onPrev && hasPrev) onPrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    // Prevent background scroll
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [image, onClose, onNext, onPrev, hasNext, hasPrev]);

  // Reset zoom on image change
  useEffect(() => {
    setZoom(1);
    setImageError(false);
  }, [image]);

  if (!image) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoom(1);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(image.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = image.url;
    a.download = `${image.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpg`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-2 sm:p-6 transition-all duration-300"
      onClick={onClose}
    >
      {/* Top Floating Control Bar */}
      <div 
        className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
            {image.category.toUpperCase()}
          </span>
          <span className="hidden sm:inline text-xs text-white/70">
            {image.title}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-amber-500/30 rounded-xl p-1 backdrop-blur-md">
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono px-1 text-amber-300">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-5 bg-white/20 mx-1" />
          <button
            onClick={handleCopyUrl}
            className="p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="Copy Direct URL"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="Download Image"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 transition-colors ml-1"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Prev / Next Navigation Buttons */}
      {hasPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onPrev) onPrev();
          }}
          className="absolute left-2 sm:left-6 z-20 p-3 rounded-full bg-emerald-950/70 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 backdrop-blur-md transition-all hover:scale-110"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {hasNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onNext) onNext();
          }}
          className="absolute right-2 sm:right-6 z-20 p-3 rounded-full bg-emerald-950/70 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 backdrop-blur-md transition-all hover:scale-110"
          aria-label="Next image"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Image Display Area */}
      <div 
        className="relative max-w-5xl max-h-[75vh] w-full h-full flex flex-col items-center justify-center p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="relative transition-transform duration-200 ease-out max-w-full max-h-[65vh] flex items-center justify-center"
          style={{ transform: `scale(${zoom})` }}
        >
          {imageError ? (
            <div className="w-[450px] h-[300px] rounded-xl bg-emerald-950 border border-amber-500/30 flex flex-col items-center justify-center text-center p-6 text-amber-200">
              <p className="font-serif-title font-semibold mb-2">Image Preview</p>
              <p className="text-xs text-white/60 mb-4">{image.title}</p>
              <a
                href={image.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-amber-400 underline hover:text-amber-300"
              >
                Open Direct URL in New Tab
              </a>
            </div>
          ) : (
            <img
              src={image.url}
              alt={image.title}
              onError={() => setImageError(true)}
              className="max-h-[65vh] max-w-full object-contain rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] border border-amber-500/30"
              loading="eager"
            />
          )}
        </div>

        {/* Bottom Details Drawer */}
        <div className="mt-4 max-w-2xl w-full bg-[#031a13]/90 border border-amber-500/30 rounded-xl p-4 backdrop-blur-xl text-center sm:text-left shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2 mb-2">
            <h3 className="text-base sm:text-lg font-serif-title font-bold text-amber-200">
              {image.title}
            </h3>
            <div className="flex items-center gap-3 text-xs text-emerald-300/80">
              {image.year && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  {image.year}
                </span>
              )}
              {image.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  {image.location}
                </span>
              )}
            </div>
          </div>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-sans">
            {image.description}
          </p>
        </div>
      </div>
    </div>
  );
}
