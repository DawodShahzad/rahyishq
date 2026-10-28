'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, Share2, Download, Eye } from 'lucide-react';
import { FeedImage, StreamItem } from '@/types';

interface ImageDetailClientProps {
  image: FeedImage;
  streams: StreamItem[];
  platformName?: string;
}

export default function ImageDetailClient({ image, platformName }: ImageDetailClientProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [views, setViews] = useState<number>(image.views || 0);
  const [downloads, setDownloads] = useState<number>(image.downloads || 0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);

      // Track view: increment view once per session, or fetch latest count
      const sessionKey = `darulehsan_viewed_${image.id}`;
      let alreadyViewed = false;
      try {
        alreadyViewed = Boolean(sessionStorage.getItem(sessionKey));
      } catch {}

      if (!alreadyViewed) {
        try {
          sessionStorage.setItem(sessionKey, 'true');
        } catch {}

        fetch('/api/images/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: image.id, action: 'view' }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (typeof data.views === 'number') setViews(data.views);
            if (typeof data.downloads === 'number') setDownloads(data.downloads);
          })
          .catch(() => {});
      } else {
        // Fetch current stats without incrementing
        fetch(`/api/images/stats?id=${encodeURIComponent(image.id)}`)
          .then((res) => res.json())
          .then((data) => {
            if (typeof data.views === 'number') setViews(data.views);
            if (typeof data.downloads === 'number') setDownloads(data.downloads);
          })
          .catch(() => {});
      }
    }
  }, [image.id]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(shareUrl || window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);

      // Record download stat immediately
      fetch('/api/images/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: image.id, action: 'download' }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (typeof data.downloads === 'number') setDownloads(data.downloads);
        })
        .catch(() => {
          setDownloads((prev) => prev + 1);
        });

      const res = await fetch(image.url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const safeName = (image.title || image.referenceNumber || image.id || 'image')
        .trim()
        .replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_');
      const ext = image.url.includes('.png') ? 'png' : image.url.includes('.webp') ? 'webp' : 'jpg';
      a.download = `${safeName}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      const a = document.createElement('a');
      a.href = image.url;
      a.target = '_blank';
      a.download = `${image.title || 'image'}.jpg`;
      a.click();
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    const currentPlatform = platformName || 'Rahy Ishq';
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: image.title,
          text: image.description ? `${image.description} — ${currentPlatform}` : currentPlatform,
          url: shareUrl || window.location.href,
        });
      } catch {
        // Fallback to copy if cancelled or unsupported
      }
    } else {
      handleCopyLink();
    }
  };

  const isUrdu = (text: string) => /[\u0600-\u06FF]/.test(text);
  const titleHasUrdu = isUrdu(image.title);
  const descHasUrdu = isUrdu(image.description);

  return (
    <div className="bg-white min-h-screen pt-24 sm:pt-28 pb-12 sm:pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header: Back Button on left, Download, Copy & Share on right */}
        <div className="flex items-center justify-between pb-6 mb-8 border-b border-neutral-100">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium rounded-full transition-colors cursor-pointer disabled:opacity-50"
              title="Download Image"
            >
              <Download className={`w-3.5 h-3.5 ${downloading ? 'animate-bounce text-indigo-600' : ''}`} />
              <span>{downloading ? 'Saving...' : 'Download'}</span>
              <span className="ml-0.5 px-1.5 py-0.2 bg-white/90 text-[11px] font-mono text-neutral-600 rounded-full border border-neutral-200/60">
                {downloads}
              </span>
            </button>

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium rounded-full transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-full transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Clean Big Image Container (No reference number overlay, No open in full button) */}
        <div className="w-full bg-neutral-50 rounded-2xl sm:rounded-3xl border-0 overflow-hidden shadow-xs mb-8 flex items-center justify-center p-2 sm:p-4">
          <img
            src={image.url}
            alt={image.title}
            className="max-h-[78vh] w-auto max-w-full object-contain rounded-xl sm:rounded-2xl"
          />
        </div>

        {/* Essential Content: Reference number & Date of Archival, Views, Downloads, Title, Description */}
        <div className="space-y-4">
          {/* Reference Number & Date of Archival & View/Download Counts */}
          <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-2 text-xs text-neutral-500 font-mono">
            {image.referenceNumber && (
              <span className="font-semibold text-neutral-800">Ref: {image.referenceNumber}</span>
            )}
            {image.referenceNumber && image.dateAdded && <span>•</span>}
            {image.dateAdded && (
              <span>Date: {image.dateAdded}</span>
            )}
            
            <span className="hidden sm:inline text-neutral-300">•</span>

            {/* Views Count Pill */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-neutral-100/90 text-neutral-700 rounded-full font-sans text-[11px] font-medium border border-neutral-200/50">
              <Eye className="w-3.5 h-3.5 text-neutral-500" />
              <span>{views.toLocaleString()} {views === 1 ? 'view' : 'views'}</span>
            </div>

            {/* Downloads Count Pill */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-neutral-100/90 text-neutral-700 rounded-full font-sans text-[11px] font-medium border border-neutral-200/50">
              <Download className="w-3.5 h-3.5 text-neutral-500" />
              <span>{downloads.toLocaleString()} {downloads === 1 ? 'download' : 'downloads'}</span>
            </div>
          </div>

          {/* Title */}
          <h1
            className={`text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight leading-snug ${
              titleHasUrdu ? 'font-urdu text-3xl sm:text-4xl' : ''
            }`}
          >
            {image.title}
          </h1>

          {/* Description */}
          {image.description && (
            <div
              className={`text-neutral-700 leading-relaxed text-base sm:text-lg pt-2 ${
                descHasUrdu ? 'font-urdu text-xl leading-loose' : ''
              }`}
            >
              {image.description}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
