import { QuoteItem, GalleryImage } from '@/types';
import { INITIAL_QUOTES, INITIAL_GALLERY } from '@/data/initialData';

const LOCAL_STORAGE_QUOTES_KEY = 'darulehsan_custom_quotes';
const LOCAL_STORAGE_GALLERY_KEY = 'darulehsan_custom_gallery';
const LOCAL_STORAGE_FAVORITES_KEY = 'darulehsan_favorite_quotes';

export async function fetchAllQuotes(): Promise<QuoteItem[]> {
  try {
    const res = await fetch('/api/quotes', { cache: 'no-store' });
    if (res.ok) {
      const serverQuotes: QuoteItem[] = await res.json();
      // Merge with any client-local additions
      if (typeof window !== 'undefined') {
        const localData = localStorage.getItem(LOCAL_STORAGE_QUOTES_KEY);
        if (localData) {
          const localQuotes: QuoteItem[] = JSON.parse(localData);
          const combined = [...localQuotes, ...serverQuotes];
          // Deduplicate by ID
          const seen = new Set();
          return combined.filter(q => {
            if (seen.has(q.id)) return false;
            seen.add(q.id);
            return true;
          });
        }
      }
      return serverQuotes;
    }
  } catch (err) {
    console.warn('Fallback to local storage/seed for quotes:', err);
  }

  // Fallback
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(LOCAL_STORAGE_QUOTES_KEY);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }
  }
  return INITIAL_QUOTES;
}

export async function fetchAllGallery(): Promise<GalleryImage[]> {
  try {
    const res = await fetch('/api/gallery', { cache: 'no-store' });
    if (res.ok) {
      const serverGallery: GalleryImage[] = await res.json();
      if (typeof window !== 'undefined') {
        const localData = localStorage.getItem(LOCAL_STORAGE_GALLERY_KEY);
        if (localData) {
          const localGallery: GalleryImage[] = JSON.parse(localData);
          const combined = [...localGallery, ...serverGallery];
          const seen = new Set();
          return combined.filter(img => {
            if (seen.has(img.id)) return false;
            seen.add(img.id);
            return true;
          });
        }
      }
      return serverGallery;
    }
  } catch (err) {
    console.warn('Fallback to local storage/seed for gallery:', err);
  }

  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(LOCAL_STORAGE_GALLERY_KEY);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }
  }
  return INITIAL_GALLERY;
}

export async function saveNewQuote(quote: Partial<QuoteItem>): Promise<QuoteItem> {
  const newQuote: QuoteItem = {
    id: `quote-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    urdu: quote.urdu || '',
    english: quote.english || '',
    category: quote.category || 'makalat',
    volume: quote.volume || 'Makalat-e-Hikmat',
    number: quote.number || undefined,
    theme: quote.theme || 'Divine Wisdom',
    author: quote.author || 'Hazrat Sufi Muhammad Barkat Ali (R.A.)',
    dateAdded: new Date().toISOString().split('T')[0],
    isFeatured: Boolean(quote.isFeatured),
  };

  // Try server first
  try {
    const res = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newQuote),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.quote) return data.quote;
    }
  } catch (e) {
    console.warn('Server write failed, persisting to client storage:', e);
  }

  // Persist locally
  if (typeof window !== 'undefined') {
    const existing = localStorage.getItem(LOCAL_STORAGE_QUOTES_KEY);
    const list: QuoteItem[] = existing ? JSON.parse(existing) : [];
    list.unshift(newQuote);
    localStorage.setItem(LOCAL_STORAGE_QUOTES_KEY, JSON.stringify(list));
  }

  return newQuote;
}

export async function saveNewGalleryImage(image: Partial<GalleryImage>): Promise<GalleryImage> {
  const newImg: GalleryImage = {
    id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    url: image.url || '',
    title: image.title || 'Untitled',
    category: image.category || 'dar-ul-ehsan',
    description: image.description || '',
    location: image.location,
    year: image.year,
    dateAdded: new Date().toISOString().split('T')[0],
    isFeatured: Boolean(image.isFeatured),
  };

  try {
    const res = await fetch('/api/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newImg),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.image) return data.image;
    }
  } catch (e) {
    console.warn('Server write failed, persisting to client storage:', e);
  }

  if (typeof window !== 'undefined') {
    const existing = localStorage.getItem(LOCAL_STORAGE_GALLERY_KEY);
    const list: GalleryImage[] = existing ? JSON.parse(existing) : [];
    list.unshift(newImg);
    localStorage.setItem(LOCAL_STORAGE_GALLERY_KEY, JSON.stringify(list));
  }

  return newImg;
}

export function getFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function toggleFavorite(quoteId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const favorites = getFavorites();
    const index = favorites.indexOf(quoteId);
    let isNowFavorite = false;
    if (index > -1) {
      favorites.splice(index, 1);
      isNowFavorite = false;
    } else {
      favorites.push(quoteId);
      isNowFavorite = true;
    }
    localStorage.setItem(LOCAL_STORAGE_FAVORITES_KEY, JSON.stringify(favorites));
    return isNowFavorite;
  } catch {
    return false;
  }
}
