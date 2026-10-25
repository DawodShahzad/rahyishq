'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { GalleryImage, GalleryCategory } from '@/types';
import { fetchAllGallery } from '@/lib/dataService';
import ImageLightbox from '@/components/ImageLightbox';
import { 
  PlusCircle, 
  Eye, 
  MapPin, 
  Search,
  ExternalLink
} from 'lucide-react';

export default function GalleryPage() {
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchAllGallery();
      setGallery(data);
      setLoading(false);
    }
    load();
  }, []);

  const categories = [
    { id: 'all', label: 'All Photos', count: gallery.length },
    { 
      id: 'hazrat', 
      label: 'Hazrat Baba Ji', 
      count: gallery.filter((img) => img.category === 'hazrat').length 
    },
    { 
      id: 'dar-ul-ehsan', 
      label: 'Dar-ul-Ehsan Sanctuary', 
      count: gallery.filter((img) => img.category === 'dar-ul-ehsan').length 
    },
    { 
      id: 'humanity', 
      label: 'Free Eye Camps', 
      count: gallery.filter((img) => img.category === 'humanity').length 
    },
    { 
      id: 'manuscripts', 
      label: 'Sacred Manuscripts', 
      count: gallery.filter((img) => img.category === 'manuscripts').length 
    },
  ];

  const filteredImages = useMemo(() => {
    return gallery.filter((img) => {
      if (activeCategory !== 'all' && img.category !== activeCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = img.title.toLowerCase().includes(q);
        const matchesDesc = img.description.toLowerCase().includes(q);
        const matchesLoc = img.location ? img.location.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesDesc && !matchesLoc) return false;
      }
      return true;
    });
  }, [gallery, activeCategory, searchQuery]);

  const activeImage = selectedImageIndex !== null ? filteredImages[selectedImageIndex] : null;

  const handleNext = () => {
    if (selectedImageIndex !== null && selectedImageIndex < filteredImages.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const handlePrev = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  return (
    <div className="pt-28 pb-24 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
      
      {/* Header Banner */}
      <div className="max-w-3xl mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-xs font-semibold tracking-tightest text-[#c6ff33] mb-4">
          <span>Visual Heritage</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tightest text-white leading-tight">
          Historical <span className="text-shimmer">Photo Archive.</span>
        </h1>
        <p className="mt-4 text-sm sm:text-base text-white/60 leading-relaxed font-normal tracking-tight-custom">
          Click on any photo to open in high-definition view style with zoom, pan, and direct image download.
        </p>

        <div className="mt-6 flex">
          <Link href="/admin" className="btn-dark !py-2 !px-4 !text-xs">
            <PlusCircle className="w-3.5 h-3.5 text-[#c6ff33]" />
            <span>Upload Image Direct URL</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="paymo-card p-4 sm:p-5 mb-8 flex flex-col sm:flex-row items-center gap-4 justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search photos by title or location..."
            className="w-full pl-11 pr-4 py-2.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#c6ff33] transition-colors"
          />
        </div>

        <div className="text-xs font-mono text-white/50">
          Showing {filteredImages.length} of {gallery.length} images
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as GalleryCategory)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-tightest whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-[#c6ff33] text-black shadow-lg shadow-[#c6ff33]/20 scale-102'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/70 border border-white/[0.08]'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${isActive ? 'bg-black/20 text-black' : 'bg-white/[0.08] text-[#c6ff33]'}`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="py-20 text-center text-[#c6ff33] font-semibold tracking-tightest animate-pulse">
          Loading gallery images...
        </div>
      ) : filteredImages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredImages.map((image, index) => (
            <div
              key={image.id}
              onClick={() => setSelectedImageIndex(index)}
              className="paymo-card overflow-hidden cursor-pointer group hover:border-[#c6ff33]/50 transition-all duration-300"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-black">
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-full object-cover transform group-hover:scale-106 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="p-3 rounded-full bg-[#c6ff33] text-black shadow-xl transform scale-75 group-hover:scale-100 transition-transform">
                    <Eye className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#c6ff33] mb-1.5">
                  <span className="uppercase tracking-wider">{image.category}</span>
                  {image.year && <span className="text-white/50">{image.year}</span>}
                </div>
                <h3 className="text-base font-bold tracking-tightest text-white truncate group-hover:text-[#c6ff33] transition-colors">
                  {image.title}
                </h3>
                <p className="text-xs text-white/60 mt-1 line-clamp-2 tracking-tight-custom">
                  {image.description}
                </p>
                {image.location && (
                  <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center gap-1.5 text-[11px] text-white/40">
                    <MapPin className="w-3 h-3 text-[#c6ff33]" />
                    <span className="truncate">{image.location}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="paymo-card p-12 text-center max-w-lg mx-auto">
          <h3 className="text-lg font-bold tracking-tightest text-white">
            No images in this category
          </h3>
          <p className="text-xs text-white/50 mt-1 mb-5">
            You can upload new images using direct URLs from the backend system.
          </p>
          <Link href="/admin" className="btn-lime !py-2 !px-4">
            <PlusCircle className="w-4 h-4" />
            <span>Upload Image Direct URL</span>
          </Link>
        </div>
      )}

      {/* View Style Lightbox */}
      <ImageLightbox
        image={activeImage}
        onClose={() => setSelectedImageIndex(null)}
        onNext={handleNext}
        onPrev={handlePrev}
        hasNext={selectedImageIndex !== null && selectedImageIndex < filteredImages.length - 1}
        hasPrev={selectedImageIndex !== null && selectedImageIndex > 0}
      />

    </div>
  );
}
