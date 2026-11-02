'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { SiteSettings } from '@/types';

export default function Footer() {
  const [settings, setSettings] = useState<SiteSettings>({
    logoUrl: '',
    facebookUrl: 'https://facebook.com',
    whatsappUrl: 'https://wa.me',
    instagramUrl: 'https://instagram.com',
    tiktokUrl: 'https://tiktok.com',
    footerEnglishText: 'Preserving the photographic, calligraphic, and manuscript heritage of Hazrat Sufi Abu Anees Muhammad Barkat Ali (رحمۃ اللہ علیہ).',
    footerArabicText: 'خدمتِ خلق • ذکرِ الٰہی • نشرِ قرآن مجید',
  });

  const loadSettings = () => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data: SiteSettings) => {
        if (data) setSettings(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadSettings();
    window.addEventListener('site-settings-updated', loadSettings);
    return () => window.removeEventListener('site-settings-updated', loadSettings);
  }, []);

  return (
    <footer className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-14 sm:mt-20 mb-8 sm:mb-12 relative z-10">
      <div className="bg-[#0b0c0e] text-white rounded-3xl p-6 sm:p-8 md:p-10 border border-white/10 shadow-2xl">
        {/* Top Section: Logo & Location on Left, Details & Urdu/Arabic Quote on Right */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Left: Brand Logo & Origin Tag */}
          <div className="space-y-2">
            <Link href="/" className="inline-block group">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt="Website Logo"
                  className="h-9 sm:h-11 w-auto object-contain max-w-[170px] transition-transform group-hover:scale-105 drop-shadow-md"
                />
              ) : (
                <span className="font-semibold text-lg sm:text-xl text-white tracking-tight">
                  {settings.platformName || 'Rahy Ishq'}
                </span>
              )}
            </Link>

            <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
              <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              <span>Camp Dar-ul-Ehsan, Faisalabad</span>
            </div>
          </div>

          {/* Right: Customizable Details Line & Arabic/Urdu Typography in place of link columns */}
          <div className="md:max-w-xl text-left md:text-right space-y-1.5">
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              {settings.footerEnglishText || 'Preserving the photographic, calligraphic, and manuscript heritage of Hazrat Sufi Abu Anees Muhammad Barkat Ali (رحمۃ اللہ علیہ).'}
            </p>
            <p className="font-urdu text-neutral-300 text-sm sm:text-base leading-loose">
              {settings.footerArabicText || 'خدمتِ خلق • ذکرِ الٰہی • نشرِ قرآن مجید'}
            </p>
          </div>
        </div>

        {/* Thin Divider Line */}
        <div className="h-px bg-neutral-800/80 my-5 sm:my-6" />

        {/* Bottom Section: Full-Size Social Media Icons on Left, Copyright on Right */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Full-Size Social Icons: Facebook, WhatsApp, Instagram, TikTok */}
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Facebook (Full size) */}
            <a
              href={settings.facebookUrl || 'https://facebook.com'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              title="Facebook"
              className="text-white hover:text-neutral-300 transition-all duration-200 hover:scale-115 flex items-center justify-center p-1 focus:outline-none"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>

            {/* WhatsApp (Full size) */}
            <a
              href={settings.whatsappUrl || 'https://wa.me'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              title="WhatsApp"
              className="text-white hover:text-neutral-300 transition-all duration-200 hover:scale-115 flex items-center justify-center p-1 focus:outline-none"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M12.031 0C5.396 0 .016 5.37.016 11.996c0 2.115.553 4.179 1.603 6L.016 24l6.195-1.625c1.758.959 3.743 1.464 5.82 1.464h.005c6.634 0 12.014-5.37 12.014-11.996 0-3.207-1.25-6.223-3.518-8.491A11.928 11.928 0 0012.031 0zm-.005 21.84h-.004c-1.79 0-3.545-.48-5.076-1.39l-.364-.216-3.77.988 1.006-3.676-.237-.377A9.972 9.972 0 012.02 11.996c0-5.518 4.49-10.007 10.012-10.007 2.673 0 5.187 1.042 7.077 2.933a9.943 9.943 0 012.932 7.074c0 5.52-4.49 10.008-10.015 10.008zm5.485-7.487c-.3-.15-1.774-.875-2.05-.975-.275-.1-.475-.15-.675.15-.2.3-.775.975-.95 1.175-.175.2-.35.225-.65.075-.3-.15-1.267-.467-2.414-1.49-1.011-.902-1.694-2.016-1.894-2.36-.2-.344-.021-.53.129-.68.135-.135.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.675-1.625-.925-2.225-.244-.584-.492-.505-.675-.514-.175-.009-.375-.01-.575-.01-.2 0-.525.075-.8.375s-1.05 1.025-1.05 2.5 1.075 2.9 1.225 3.1c.15.2 2.115 3.23 5.124 4.53.716.31 1.275.495 1.71.634.72.229 1.375.197 1.893.12.577-.086 1.774-.725 2.024-1.425.25-.7.25-1.3.175-1.425-.075-.125-.275-.2-.575-.35z" />
              </svg>
            </a>

            {/* Instagram (Full size) */}
            <a
              href={settings.instagramUrl || 'https://instagram.com'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              title="Instagram"
              className="text-white hover:text-neutral-300 transition-all duration-200 hover:scale-115 flex items-center justify-center p-1 focus:outline-none"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>

            {/* TikTok (Full size) */}
            <a
              href={settings.tiktokUrl || 'https://tiktok.com'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              title="TikTok"
              className="text-white hover:text-neutral-300 transition-all duration-200 hover:scale-115 flex items-center justify-center p-1 focus:outline-none"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.97-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
              </svg>
            </a>
          </div>

          {/* Right: Copyright Text */}
          <div className="text-xs text-neutral-400 font-normal">
            © 2026 {settings.platformName || 'Rahy Ishq'}. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
