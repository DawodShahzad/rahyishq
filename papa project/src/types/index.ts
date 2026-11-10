export interface StreamItem {
  id: string;
  title: string;
  slug: string;
  description?: string;
  createdAt: string;
}

export interface HeroImage {
  id: string;
  url: string;
  mediaType?: 'image' | 'video';
  audioUrl?: string;
  title?: string;
  dateAdded: string;
}

export interface SiteSettings {
  platformName?: string;
  logoUrl?: string;
  hideSiteName?: boolean;
  musicIconUrl?: string;
  waveColor?: string;
  homeBgImageUrl?: string;
  navbarColor?: string;
  navbarOpacity?: number;
  navbarBlur?: number;
  facebookUrl?: string;
  whatsappUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  footerEnglishText?: string;
  footerArabicText?: string;
}

export interface FeedImage {
  id: string;
  url: string;
  title: string;
  referenceNumber: string; // Searchable by reference number
  adminNotes?: string;     // Admin-only notes, hidden from public front-end
  tags: string[];          // Searchable tags
  streamIds: string[];     // Stream IDs image belongs to
  description: string;     // Image description
  dateAdded: string;
  aspectRatio?: 'square' | 'portrait' | 'landscape';
  views?: number;          // Public view count
  downloads?: number;      // Public download count
}

export interface DailyVisitorRecord {
  date: string;
  unique: number;
  total: number;
}

export interface AnalyticsData {
  dailyVisitors: Record<string, { unique: number; total: number }>;
  totalVisitors: number;
  totalPageViews: number;
}

export interface AudioTrack {
  id: string;
  title: string;
  url: string;
  artist?: string;
  duration?: string;
  dateAdded: string;
}

export type QuoteCategory = 
  | 'all' 
  | 'makalat' 
  | 'zikr' 
  | 'khidmat' 
  | 'tawakkul' 
  | 'ishq-rasool' 
  | 'favorites';

export interface QuoteItem {
  id: string;
  urdu: string;
  english: string;
  category: 'makalat' | 'zikr' | 'khidmat' | 'tawakkul' | 'ishq-rasool';
  volume?: string;
  number?: string | number;
  theme: string;
  author: string;
  dateAdded: string;
  isFeatured?: boolean;
}

export type GalleryCategory = 
  | 'all'
  | 'hazrat' 
  | 'dar-ul-ehsan' 
  | 'humanity' 
  | 'manuscripts';

export interface GalleryImage {
  id: string;
  url: string;
  title: string;
  category: 'hazrat' | 'dar-ul-ehsan' | 'humanity' | 'manuscripts';
  description: string;
  location?: string;
  year?: string;
  dateAdded: string;
  isFeatured?: boolean;
}
