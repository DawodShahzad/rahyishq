'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { FeedImage, StreamItem, HeroImage } from '@/types';

// Deterministic 2-day shuffle rotation
function getTwoDayMixedFeed(items: FeedImage[]): FeedImage[] {
  if (!items || items.length === 0) return [];
  const twoDayPeriod = Math.floor(Date.now() / (2 * 24 * 60 * 60 * 1000));
  let seed = twoDayPeriod + 7860;
  const pseudoRandom = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(pseudoRandom() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function FeedContent() {
  const [images, setImages] = useState<FeedImage[]>([]);
  const [streams, setStreams] = useState<StreamItem[]>([]);
  const [randomHero, setRandomHero] = useState<HeroImage | null>(null);
  const [homeBgImageUrl, setHomeBgImageUrl] = useState<string>('');
  const [selectedStream, setSelectedStream] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchVisible, setSearchVisible] = useState<boolean>(false);

  const searchParams = useSearchParams();

  // Read URL query params
  useEffect(() => {
    const streamParam = searchParams.get('stream');
    if (streamParam) {
      setSelectedStream(streamParam);
    } else {
      setSelectedStream('all');
    }
    const qParam = searchParams.get('q');
    if (qParam) {
      setSearchQuery(qParam);
    }
  }, [searchParams]);

  // Fetch feed, streams, hero images, and site settings
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [imagesRes, streamsRes, heroRes, settingsRes] = await Promise.all([
          fetch('/api/images'),
          fetch('/api/streams'),
          fetch('/api/hero-images'),
          fetch('/api/settings'),
        ]);

        if (imagesRes.ok) {
          const imgs: FeedImage[] = await imagesRes.json();
          setImages(imgs);
        }
        if (streamsRes.ok) {
          const strms: StreamItem[] = await streamsRes.json();
          setStreams(strms);
        }
        if (heroRes.ok) {
          const heroes: HeroImage[] = await heroRes.json();
          if (heroes.length > 0) {
            const randomIndex = Math.floor(Math.random() * heroes.length);
            setRandomHero(heroes[randomIndex]);
          }
        }
        if (settingsRes.ok) {
          const s = await settingsRes.json();
          if (s.homeBgImageUrl !== undefined) {
            setHomeBgImageUrl(s.homeBgImageUrl);
          }
        }
      } catch (e) {
        console.error('Failed to fetch home page data:', e);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();

    const handleToggleSearch = () => {
      setSearchVisible((prev) => !prev);
    };

    const handleFilterStream = (e: any) => {
      if (e.detail) {
        setSelectedStream(e.detail);
      }
    };

    const handleNavbarSearch = (e: any) => {
      if (e.detail !== undefined) {
        setSearchQuery(e.detail);
      }
    };

    const handleSettingsUpdated = () => {
      fetch('/api/settings')
        .then((res) => res.json())
        .then((s) => {
          if (s.homeBgImageUrl !== undefined) setHomeBgImageUrl(s.homeBgImageUrl);
        })
        .catch(() => {});
    };

    window.addEventListener('filter-stream', handleFilterStream);
    window.addEventListener('navbar-search-change', handleNavbarSearch);
    window.addEventListener('site-settings-updated', handleSettingsUpdated);
    return () => {
      window.removeEventListener('filter-stream', handleFilterStream);
      window.removeEventListener('navbar-search-change', handleNavbarSearch);
      window.removeEventListener('site-settings-updated', handleSettingsUpdated);
    };
  }, []);

  // Compute feed images (filtered or 2-day mixed rotation)
  const displayImages = useMemo(() => {
    let list = images;

    if (selectedStream && selectedStream !== 'all') {
      list = list.filter((img) => img.streamIds?.includes(selectedStream));
    } else {
      list = getTwoDayMixedFeed(list);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((img) => {
        const matchRef = img.referenceNumber?.toLowerCase().includes(q);
        const matchTitle = img.title?.toLowerCase().includes(q);
        const matchDesc = img.description?.toLowerCase().includes(q);
        const matchTag = img.tags?.some((t) => t.toLowerCase().includes(q));
        return matchRef || matchTitle || matchDesc || matchTag;
      });
    }

    return list;
  }, [images, selectedStream, searchQuery]);

  return (
    <div className="w-full relative min-h-screen">
      {/* Fixed Background Image for Home Page (Pictures scroll over it) */}
      {homeBgImageUrl ? (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <img
            src={homeBgImageUrl}
            alt="Fixed background"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center"
          />
        </div>
      ) : null}

      {/* Main Page Content Layer (Relative z-10 over fixed background) */}
      <div className="relative z-10 w-full">
        {/* Edge-to-Edge Hero Image Beneath Transparent Navbar (NO darkness below navbar) */}
        {randomHero ? (
          <section className="relative w-full overflow-hidden bg-neutral-100 mb-6 sm:mb-8 shadow-xs">
            {/* Reduced height, edge-to-edge full width image */}
            <div className="w-full h-52 sm:h-64 md:h-72 lg:h-80">
              <img
                src={randomHero.url}
                alt="Hero"
                className="w-full h-full object-cover"
              />
            </div>
          </section>
        ) : (
          <div className="pt-14 sm:pt-16" />
        )}

        {/* Main Feed Container */}
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6">

        {/* Pure Image Grid with reduced gaps and reduced corner radius */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-neutral-100 animate-pulse rounded-lg sm:rounded-xl h-64"
              />
            ))}
          </div>
        ) : displayImages.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-neutral-200 rounded-2xl p-8">
            <p className="text-neutral-400 text-sm">
              No images found matching your search.
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3 px-4 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-full"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-3 sm:gap-4 space-y-3 sm:space-y-4">
            {displayImages.map((image) => (
              <div
                key={image.id}
                className="break-inside-avoid bg-transparent rounded-lg sm:rounded-xl overflow-hidden border-0 shadow-xs hover:shadow-lg transition-shadow duration-300 group isolate [transform:translateZ(0)] [backface-visibility:hidden]"
              >
                <Link
                  href={`/image/${image.id}`}
                  className="block relative overflow-hidden rounded-lg sm:rounded-xl bg-transparent isolate [transform:translateZ(0)] [backface-visibility:hidden]"
                >
                  <img
                    src={image.url}
                    alt={image.title}
                    loading="lazy"
                    className="w-full h-auto block object-cover transform-gpu scale-100 group-hover:scale-105 transition-transform duration-500 ease-out will-change-transform [backface-visibility:hidden] [transform:translateZ(0)]"
                  />
                </Link>
              </div>
            ))}
          </div>
        )}

        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <FeedContent />
    </Suspense>
  );
}
