'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, X, Layers } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StreamItem, SiteSettings } from '@/types';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showStreams, setShowStreams] = useState(false);
  const [query, setQuery] = useState('');
  const [settings, setSettings] = useState<SiteSettings>({
    logoUrl: '',
    hideSiteName: false,
    navbarColor: '#ffffff',
    navbarOpacity: 75,
    navbarBlur: 12,
  });
  const [streams, setStreams] = useState<StreamItem[]>([]);
  const router = useRouter();

  // Scroll detection for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadSettingsAndStreams = () => {
    // Fetch site settings
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data: SiteSettings) => {
        setSettings(data);
      })
      .catch(() => {});

    // Fetch streams
    fetch('/api/streams')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setStreams(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadSettingsAndStreams();

    const handleSettingsUpdated = () => {
      loadSettingsAndStreams();
    };

    const handleClearSearch = () => {
      setQuery('');
      setShowSearch(false);
    };

    window.addEventListener('site-settings-updated', handleSettingsUpdated);
    window.addEventListener('clear-navbar-search', handleClearSearch);
    return () => {
      window.removeEventListener('site-settings-updated', handleSettingsUpdated);
      window.removeEventListener('clear-navbar-search', handleClearSearch);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/?q=${encodeURIComponent(query.trim())}`);
      setShowSearch(false);
    }
  };

  const handleToggleSearch = () => {
    setShowSearch((prev) => !prev);
    setShowStreams(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('toggle-search-input'));
    }
  };

  const handleToggleStreams = () => {
    setShowStreams((prev) => !prev);
    setShowSearch(false);
  };

  const handleSelectStream = (streamId: string) => {
    setShowStreams(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('filter-stream', { detail: streamId }));
    }
    router.push(streamId === 'all' ? '/' : `/?stream=${encodeURIComponent(streamId)}`);
  };

  // Convert hex color + opacity to rgba
  const hex = settings.navbarColor || '#ffffff';
  let r = 255, g = 255, b = 255;
  if (hex.startsWith('#') && hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  const alpha = ((settings.navbarOpacity ?? 75) / 100);
  const blurPx = settings.navbarBlur ?? 12;

  // Helper to determine if the custom navbar color is dark or light
  const isDarkNavbar = (() => {
    if (!settings.navbarColor || !settings.navbarColor.startsWith('#')) return false;
    const h = settings.navbarColor.replace('#', '');
    const rVal = parseInt(h.substring(0, 2) || 'ff', 16);
    const gVal = parseInt(h.substring(2, 4) || 'ff', 16);
    const bVal = parseInt(h.substring(4, 6) || 'ff', 16);
    const brightness = (rVal * 299 + gVal * 587 + bVal * 114) / 1000;
    return brightness < 135;
  })();

  const textAndIconClass = !scrolled
    ? 'text-white hover:text-white/80 drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)]'
    : isDarkNavbar
    ? 'text-white hover:text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]'
    : 'text-neutral-800 hover:text-black hover:bg-black/5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]';

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 border-none ${
        scrolled ? 'shadow-xs' : 'bg-transparent shadow-none'
      }`}
      style={
        scrolled
          ? {
              backgroundColor: `rgba(${r}, ${g}, ${b}, ${alpha})`,
              backdropFilter: `blur(${blurPx}px)`,
              WebkitBackdropFilter: `blur(${blurPx}px)`,
            }
          : undefined
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 sm:h-14 flex items-center justify-between relative">
        {/* Left Side: Brand Logo and/or Site Name */}
        <Link href="/" className="flex items-center gap-2.5 group">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt="Brand Logo"
              className="h-11 sm:h-13 w-auto object-contain max-w-[180px] sm:max-w-[240px] transition-transform group-hover:scale-105 drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)] py-0.5"
            />
          ) : null}

          {/* If hideSiteName is false (or no logo uploaded yet), show platform name */}
          {(!settings.hideSiteName || !settings.logoUrl) && (
            <span
              className={`font-semibold text-base sm:text-lg tracking-tight transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)] ${
                !scrolled
                  ? 'text-white'
                  : isDarkNavbar
                  ? 'text-white'
                  : 'text-neutral-900'
              }`}
            >
              {settings.platformName || 'Rahy Ishq'}
            </span>
          )}
        </Link>

        {/* Right Side: Search and Feed filter buttons (Positions swapped: Search first, Feed Filter second) */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {showSearch ? (
            /* ONLY ONE Search Input: Opens Directly in Navbar */
            <div className="relative flex items-center animate-in fade-in duration-200">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  autoFocus
                  value={query}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQuery(val);
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('navbar-search-change', { detail: val }));
                    }
                  }}
                  placeholder="Search by title, ref #, tag..."
                  className="w-48 sm:w-64 md:w-80 pl-8 pr-8 py-1.5 text-xs rounded-full bg-white text-neutral-900 border border-neutral-200 shadow-md focus:outline-none focus:ring-2 focus:ring-neutral-900 placeholder:text-neutral-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowSearch(false);
                    setQuery('');
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('navbar-search-change', { detail: '' }));
                    }
                    router.push('/');
                  }}
                  aria-label="Close search"
                  className="absolute right-2.5 text-neutral-400 hover:text-neutral-700 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Search Button (Swapped to first position) */}
              <button
                onClick={() => {
                  setShowSearch(true);
                  setShowStreams(false);
                }}
                aria-label="Search"
                title="Search Images"
                className={`p-2 rounded-full transition-all bg-transparent border-0 shadow-none ${textAndIconClass}`}
              >
                <Search className="w-5 h-5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)]" />
              </button>

              {/* Feed Filter / Streams Button (Swapped to second position) */}
              <button
                onClick={handleToggleStreams}
                aria-label="Browse Streams"
                title="Browse Streams"
                className={`p-2 rounded-full transition-all bg-transparent border-0 shadow-none ${textAndIconClass}`}
              >
                <Layers className="w-5 h-5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)]" />
              </button>
            </>
          )}

          {showSearch && (
            <button
              onClick={handleToggleStreams}
              aria-label="Browse Streams"
              title="Browse Streams"
              className={`p-2 rounded-full transition-all bg-transparent border-0 shadow-none ${textAndIconClass}`}
            >
              <Layers className="w-4 h-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)]" />
            </button>
          )}
        </div>

        {/* Compact Floating Feed Filter Menu (Clean popup anchored under stream icon) */}
        {showStreams && (
          <div 
            className="absolute right-4 sm:right-6 lg:right-8 top-full mt-1.5 w-64 sm:w-72 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-neutral-200/80 p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-neutral-100 mb-1.5">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Select Stream Feed
              </span>
              <button
                onClick={() => setShowStreams(false)}
                className="text-neutral-400 hover:text-neutral-700 p-0.5 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-1">
              {/* First button is All */}
              <button
                onClick={() => handleSelectStream('all')}
                className="w-full text-left px-3 py-2 text-xs font-semibold rounded-xl transition-colors flex items-center justify-between hover:bg-neutral-100 text-neutral-900"
              >
                <span>All Feeds (Mixed)</span>
                <span className="text-[10px] bg-neutral-900 text-white px-2 py-0.5 rounded-full font-mono">
                  All
                </span>
              </button>

              {/* Individual stream feeds */}
              {streams.map((stream) => (
                <button
                  key={stream.id}
                  onClick={() => handleSelectStream(stream.id)}
                  className="w-full text-left px-3 py-2 text-xs rounded-xl transition-colors flex items-center justify-between hover:bg-neutral-100 text-neutral-700 hover:text-neutral-900"
                >
                  <span className="truncate pr-2 font-medium">{stream.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
