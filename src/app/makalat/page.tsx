'use client';

import { useState, useEffect, useMemo } from 'react';
import { QuoteItem, QuoteCategory } from '@/types';
import { fetchAllQuotes, getFavorites } from '@/lib/dataService';
import QuoteCard from '@/components/QuoteCard';
import { 
  Search, 
  Sparkles, 
  BookMarked, 
  Heart, 
  Shuffle, 
  Filter
} from 'lucide-react';

export default function MakalatPage() {
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<QuoteCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVolume, setSelectedVolume] = useState('all');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchAllQuotes();
      setQuotes(data);
      setFavoriteIds(getFavorites());
      setLoading(false);
    }
    load();
  }, []);

  const handleFavoriteUpdate = () => {
    setFavoriteIds(getFavorites());
  };

  const volumes = useMemo(() => {
    const set = new Set<string>();
    quotes.forEach((q) => {
      if (q.volume) set.add(q.volume);
    });
    return Array.from(set);
  }, [quotes]);

  const feedTabs = [
    { id: 'all', label: 'All Wisdom', count: quotes.length },
    { 
      id: 'makalat', 
      label: 'Makalat-e-Hikmat', 
      count: quotes.filter((q) => q.category === 'makalat').length 
    },
    { 
      id: 'zikr', 
      label: 'Zikrullah & Tazkiya', 
      count: quotes.filter((q) => q.category === 'zikr').length 
    },
    { 
      id: 'khidmat', 
      label: 'Khidmat-e-Khalq', 
      count: quotes.filter((q) => q.category === 'khidmat').length 
    },
    { 
      id: 'tawakkul', 
      label: 'Tawakkul & Sabr', 
      count: quotes.filter((q) => q.category === 'tawakkul').length 
    },
    { 
      id: 'ishq-rasool', 
      label: 'Ishq-e-Rasool ﷺ', 
      count: quotes.filter((q) => q.category === 'ishq-rasool').length 
    },
    { 
      id: 'favorites', 
      label: 'My Saved Pearls', 
      count: favoriteIds.length,
      icon: Heart 
    },
  ];

  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      if (activeCategory === 'favorites') {
        if (!favoriteIds.includes(q.id)) return false;
      } else if (activeCategory !== 'all') {
        if (q.category !== activeCategory) return false;
      }

      if (selectedVolume !== 'all' && q.volume !== selectedVolume) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesUrdu = q.urdu.toLowerCase().includes(query);
        const matchesEnglish = q.english.toLowerCase().includes(query);
        const matchesTheme = q.theme.toLowerCase().includes(query);
        const matchesNumber = q.number ? q.number.toString().toLowerCase().includes(query) : false;
        if (!matchesUrdu && !matchesEnglish && !matchesTheme && !matchesNumber) {
          return false;
        }
      }

      return true;
    });
  }, [quotes, activeCategory, selectedVolume, searchQuery, favoriteIds]);

  const handleRandomInspire = () => {
    if (quotes.length === 0) return;
    const randomIdx = Math.floor(Math.random() * quotes.length);
    const randomQuote = quotes[randomIdx];
    setSearchQuery(randomQuote.english.split(' ')[0] || '');
  };

  return (
    <div className="pt-28 pb-24 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
      
      {/* Header Banner */}
      <div className="max-w-3xl mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-xs font-semibold tracking-tightest text-[#c6ff33] mb-4">
          <BookMarked className="w-3.5 h-3.5" />
          <span>Complete Makalat Archive</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tightest text-white leading-tight">
          Wisdom Feeds. <br />
          <span className="text-shimmer">Curated for daily contemplation.</span>
        </h1>
        <p className="mt-4 text-sm sm:text-base text-white/60 leading-relaxed font-normal tracking-tight-custom">
          Browse authentic aphorisms of Hazrat Sufi Abu Anees Muhammad Barkat Ali (رحمۃ اللہ علیہ), categorized across spiritual themes.
        </p>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="paymo-card p-4 sm:p-5 mb-8 flex flex-col md:flex-row items-center gap-4 justify-between">
        
        {/* Search Input */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Urdu, English translation, or Hikmat #..."
            className="w-full pl-11 pr-4 py-2.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#c6ff33] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/50 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Volume selector & Random button */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <Filter className="w-3.5 h-3.5 text-[#c6ff33]" />
            <select
              value={selectedVolume}
              onChange={(e) => setSelectedVolume(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.08] rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:border-[#c6ff33]"
            >
              <option value="all" className="bg-black text-white">All Volumes</option>
              {volumes.map((vol) => (
                <option key={vol} value={vol} className="bg-black text-white">
                  {vol}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRandomInspire}
            className="btn-dark !py-2 !px-4 !text-xs"
            title="Get a random pearl of wisdom"
          >
            <Shuffle className="w-3.5 h-3.5 text-[#c6ff33]" />
            <span>Random Pearl</span>
          </button>
        </div>

      </div>

      {/* Multiple Feeds Tab Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
        {feedTabs.map((tab) => {
          const isActive = activeCategory === tab.id;
          const TabIcon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as QuoteCategory)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-tightest whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-[#c6ff33] text-black shadow-lg shadow-[#c6ff33]/20 scale-102'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/70 border border-white/[0.08]'
              }`}
            >
              {TabIcon && <TabIcon className={`w-3.5 h-3.5 ${isActive ? 'text-black fill-black' : 'text-rose-400'}`} />}
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${isActive ? 'bg-black/20 text-black' : 'bg-white/[0.08] text-[#c6ff33]'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quotes Count */}
      <div className="flex items-center justify-between text-xs text-white/40 mb-6 font-mono">
        <span>Showing {filteredQuotes.length} {filteredQuotes.length === 1 ? 'aphorism' : 'aphorisms'}</span>
        {searchQuery && <span>Filter: &ldquo;{searchQuery}&rdquo;</span>}
      </div>

      {/* Quotes Feed Cards Stream */}
      {loading ? (
        <div className="py-20 text-center text-[#c6ff33] font-semibold tracking-tightest animate-pulse">
          Loading wisdom feeds...
        </div>
      ) : filteredQuotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuotes.map((quote) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              isFavorited={favoriteIds.includes(quote.id)}
              onFavoriteChange={handleFavoriteUpdate}
            />
          ))}
        </div>
      ) : (
        <div className="paymo-card p-12 text-center max-w-lg mx-auto">
          <BookMarked className="w-10 h-10 text-white/30 mx-auto mb-3" />
          <h3 className="text-lg font-bold tracking-tightest text-white">
            No aphorisms found
          </h3>
          <p className="text-xs text-white/50 mt-1 mb-5">
            Try adjusting your search criteria or switch to another feed tab.
          </p>
          <button
            onClick={() => {
              setActiveCategory('all');
              setSearchQuery('');
              setSelectedVolume('all');
            }}
            className="btn-lime !py-2 !px-4"
          >
            Reset Filters
          </button>
        </div>
      )}

    </div>
  );
}
