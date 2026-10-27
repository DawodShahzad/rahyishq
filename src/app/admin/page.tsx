'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Trash2, 
  Layers, 
  Image as ImageIcon, 
  Music, 
  Lock, 
  Eye, 
  Tag, 
  Hash, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  ArrowLeft,
  Volume2,
  ShieldCheck,
  ShieldAlert,
  LayoutTemplate,
  Sparkles,
  Camera,
  Sliders,
  Palette,
  Share2,
  Film,
  Play,
  Pause,
  Upload,
  X,
  GitBranch,
  Smartphone,
  RefreshCw
} from 'lucide-react';
import { FeedImage, StreamItem, AudioTrack, HeroImage } from '@/types';
import { ENABLE_ADMIN_ACCESS, ADMIN_PASSCODE } from '@/config/adminAccess';
import ImageFileInput from '@/components/ImageFileInput';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'images' | 'hero' | 'streams' | 'audio' | 'logo'>('images');
  
  // Data states
  const [images, setImages] = useState<FeedImage[]>([]);
  const [streams, setStreams] = useState<StreamItem[]>([]);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [platformNameInput, setPlatformNameInput] = useState<string>('Rahy Ishq');
  const [logoInputUrl, setLogoInputUrl] = useState<string>('');
  const [hideSiteNameInput, setHideSiteNameInput] = useState<boolean>(false);
  const [musicIconInputUrl, setMusicIconInputUrl] = useState<string>('');
  const [waveColorInput, setWaveColorInput] = useState<string>('#84cc16');
  const [homeBgInputUrl, setHomeBgInputUrl] = useState<string>('');
  const [navbarColorInput, setNavbarColorInput] = useState<string>('#ffffff');
  const [navbarOpacityInput, setNavbarOpacityInput] = useState<number>(75);
  const [navbarBlurInput, setNavbarBlurInput] = useState<number>(12);
  const [facebookInputUrl, setFacebookInputUrl] = useState<string>('https://facebook.com');
  const [whatsappInputUrl, setWhatsappInputUrl] = useState<string>('https://wa.me');
  const [instagramInputUrl, setInstagramInputUrl] = useState<string>('https://instagram.com');
  const [tiktokInputUrl, setTiktokInputUrl] = useState<string>('https://tiktok.com');
  const [footerEnglishInput, setFooterEnglishInput] = useState<string>('Preserving the photographic, calligraphic, and manuscript heritage of Hazrat Sufi Abu Anees Muhammad Barkat Ali (رحمۃ اللہ علیہ).');
  const [footerArabicInput, setFooterArabicInput] = useState<string>('خدمتِ خلق • ذکرِ الٰہی • نشرِ قرآن مجید');
  const [dupWarningCount, setDupWarningCount] = useState<number>(0);
  const [dupWarningUrl, setDupWarningUrl] = useState<string>('');
  const [isSavingLogo, setIsSavingLogo] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [syncStatus, setSyncStatus] = useState<{ isConfigured: boolean; owner?: string; repo?: string; branch?: string } | null>(null);

  // Form states: New Image
  const [imageUrl, setImageUrl] = useState('');
  const [imageTitle, setImageTitle] = useState('');
  const [imageRefNumber, setImageRefNumber] = useState('');
  const [imageAdminNotes, setImageAdminNotes] = useState('');
  const [imageTags, setImageTags] = useState('');
  const [selectedStreams, setSelectedStreams] = useState<string[]>([]);
  const [imageDescription, setImageDescription] = useState('');
  const [imageAspectRatio, setImageAspectRatio] = useState<'landscape' | 'portrait' | 'square'>('landscape');
  const [isSubmittingImage, setIsSubmittingImage] = useState(false);

  // Form states: New Hero Media (Image or Video)
  const [heroMediaType, setHeroMediaType] = useState<'image' | 'video'>('image');
  const [heroUrl, setHeroUrl] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroAudioUrl, setHeroAudioUrl] = useState('');
  const [isSubmittingHero, setIsSubmittingHero] = useState(false);
  const [activePreviewAudio, setActivePreviewAudio] = useState<string | null>(null);
  const adminAudioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Form states: New Stream
  const [streamTitle, setStreamTitle] = useState('');
  const [streamDescription, setStreamDescription] = useState('');
  const [isSubmittingStream, setIsSubmittingStream] = useState(false);

  // Form states: New Audio
  const [audioTitle, setAudioTitle] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [audioArtist, setAudioArtist] = useState('');
  const [isSubmittingAudio, setIsSubmittingAudio] = useState(false);

  // Check initial authentication
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('darulehsan_admin_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch all admin data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [imagesRes, streamsRes, audioRes, heroRes, settingsRes, syncRes] = await Promise.all([
        fetch('/api/images?admin=true'),
        fetch('/api/streams'),
        fetch('/api/audio'),
        fetch('/api/hero-images'),
        fetch('/api/settings'),
        fetch('/api/sync-status'),
      ]);

      if (imagesRes.ok) setImages(await imagesRes.json());
      if (streamsRes.ok) setStreams(await streamsRes.json());
      if (audioRes.ok) setAudioTracks(await audioRes.json());
      if (heroRes.ok) setHeroImages(await heroRes.json());
      if (syncRes.ok) setSyncStatus(await syncRes.json());
      if (settingsRes.ok) {
        const s = await settingsRes.json();
        if (s.platformName !== undefined) setPlatformNameInput(s.platformName);
        setLogoInputUrl(s.logoUrl || '');
        setHideSiteNameInput(Boolean(s.hideSiteName));
        setMusicIconInputUrl(s.musicIconUrl || '');
        setWaveColorInput(s.waveColor || '#84cc16');
        setHomeBgInputUrl(s.homeBgImageUrl || '');
        setNavbarColorInput(s.navbarColor || '#ffffff');
        setNavbarOpacityInput(s.navbarOpacity !== undefined ? s.navbarOpacity : 75);
        setNavbarBlurInput(s.navbarBlur !== undefined ? s.navbarBlur : 12);
        setFacebookInputUrl(s.facebookUrl || 'https://facebook.com');
        setWhatsappInputUrl(s.whatsappUrl || 'https://wa.me');
        setInstagramInputUrl(s.instagramUrl || 'https://instagram.com');
        setTiktokInputUrl(s.tiktokUrl || 'https://tiktok.com');
        if (s.footerEnglishText !== undefined) setFooterEnglishInput(s.footerEnglishText);
        if (s.footerArabicText !== undefined) setFooterArabicInput(s.footerArabicText);
      }
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === ADMIN_PASSCODE || passcode === 'admin123') {
      setIsAuthenticated(true);
      sessionStorage.setItem('darulehsan_admin_auth', 'true');
      setAuthError('');
    } else {
      setAuthError('Invalid passcode. Default passcode is: darulehsan');
    }
  };

  const showNotify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Auto-generate reference number
  const handleAutoGenerateRef = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setImageRefNumber(`DUE-REF-${randomSuffix}`);
  };

  // Handle Stream Selection Toggle
  const toggleStreamSelection = (streamId: string) => {
    setSelectedStreams(prev => 
      prev.includes(streamId) 
        ? prev.filter(id => id !== streamId)
        : [...prev, streamId]
    );
  };

  // Submit Brand Logo & Appearance Settings
  const handleSaveLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLogo(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          platformName: platformNameInput,
          logoUrl: logoInputUrl,
          hideSiteName: hideSiteNameInput,
          musicIconUrl: musicIconInputUrl,
          waveColor: waveColorInput,
          homeBgImageUrl: homeBgInputUrl,
          navbarColor: navbarColorInput,
          navbarOpacity: Number(navbarOpacityInput),
          navbarBlur: Number(navbarBlurInput),
          facebookUrl: facebookInputUrl,
          whatsappUrl: whatsappInputUrl,
          instagramUrl: instagramInputUrl,
          tiktokUrl: tiktokInputUrl,
          footerEnglishText: footerEnglishInput,
          footerArabicText: footerArabicInput,
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        const syncMsg = data?.syncedToGitHub
          ? '🚀 Saved & Auto-committed to GitHub! Live site will update in ~45s.'
          : 'Appearance, branding, navbar & sound wave settings saved successfully!';
        showNotify('success', syncMsg);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('site-settings-updated'));
        }
      } else {
        showNotify('error', 'Failed to update settings.');
      }
    } catch {
      showNotify('error', 'Error saving brand & appearance settings.');
    } finally {
      setIsSavingLogo(false);
    }
  };

  // Clear Brand Logo
  const handleClearLogo = async () => {
    setLogoInputUrl('');
    setIsSavingLogo(true);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl: '' }),
      });
      showNotify('success', 'Brand logo cleared.');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('site-settings-updated'));
      }
    } finally {
      setIsSavingLogo(false);
    }
  };

  // Submit Image with duplicate link detection (accepts after 3 warnings)
  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = imageUrl.trim();
    if (!trimmedUrl || !imageTitle.trim()) {
      showNotify('error', 'Please provide at least Image Link and Image Title.');
      return;
    }

    // Check if image link already exists in database
    const linkAlreadyExists = images.some(
      (img) => img.url.trim().toLowerCase() === trimmedUrl.toLowerCase()
    );

    if (linkAlreadyExists) {
      const currentCount = dupWarningUrl === trimmedUrl ? dupWarningCount : 0;
      if (currentCount < 3) {
        const nextCount = currentCount + 1;
        setDupWarningUrl(trimmedUrl);
        setDupWarningCount(nextCount);
        if (nextCount === 1) {
          showNotify('error', '⚠️ Duplicate Link Warning (1 of 3): This image link already exists in your feed. Click "Publish Image to Stream" again to proceed.');
        } else if (nextCount === 2) {
          showNotify('error', '⚠️ Duplicate Link Warning (2 of 3): This image link already exists. Click 1 more time to confirm.');
        } else if (nextCount === 3) {
          showNotify('error', '⚠️ Duplicate Link Warning (3 of 3 - Final Warning): Click once more to force accept and publish this duplicate link.');
        }
        return;
      }
      // If currentCount >= 3, 3 warnings have been acknowledged: accept link!
    }

    setIsSubmittingImage(true);
    try {
      const res = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: trimmedUrl,
          title: imageTitle,
          referenceNumber: imageRefNumber.trim() || `REF-${Date.now().toString().slice(-4)}`,
          adminNotes: imageAdminNotes,
          tags: imageTags,
          streamIds: selectedStreams,
          description: imageDescription,
          aspectRatio: imageAspectRatio,
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        const syncMsg = data?.syncedToGitHub
          ? '🚀 Published & Auto-committed to GitHub! Live site is updating now (~45s).'
          : (linkAlreadyExists ? 'Duplicate image accepted after 3 warnings and published!' : 'Image successfully added to the stream!');
        showNotify('success', syncMsg);
        setImageUrl('');
        setImageTitle('');
        setImageRefNumber('');
        setImageAdminNotes('');
        setImageTags('');
        setSelectedStreams([]);
        setImageDescription('');
        setImageAspectRatio('landscape');
        setDupWarningCount(0);
        setDupWarningUrl('');
        fetchData();
      } else {
        const data = await res.json().catch(() => ({}));
        showNotify('error', data.error || 'Failed to add image.');
      }
    } catch (err: any) {
      showNotify('error', err.message || 'Error creating image');
    } finally {
      setIsSubmittingImage(false);
    }
  };

  // Delete Image
  const handleDeleteImage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    try {
      const res = await fetch(`/api/images?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        const syncMsg = data?.syncedToGitHub
          ? '🚀 Image removed & Auto-committed to GitHub! Live site updating in ~45s.'
          : 'Image removed.';
        showNotify('success', syncMsg);
        setImages(prev => prev.filter(img => img.id !== id));
      }
    } catch {
      showNotify('error', 'Failed to delete image.');
    }
  };

  // Audio preview helper for admin testing
  const toggleAudioPreview = (url: string) => {
    if (!adminAudioPreviewRef.current) return;
    const player = adminAudioPreviewRef.current;
    if (activePreviewAudio === url && !player.paused) {
      player.pause();
      setActivePreviewAudio(null);
    } else {
      player.src = url;
      player.load();
      player.play()
        .then(() => {
          setActivePreviewAudio(url);
        })
        .catch(() => {
          showNotify('error', 'Could not play audio preview. Verify the link/file.');
        });
    }
  };

  // Submit Hero Media (Image or Video with optional separate audio)
  const handleAddHero = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroUrl.trim()) {
      showNotify('error', 'Hero Media (URL or file) is required.');
      return;
    }

    setIsSubmittingHero(true);
    try {
      const res = await fetch('/api/hero-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: heroUrl,
          mediaType: heroMediaType,
          title: heroTitle,
          audioUrl: heroAudioUrl.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        const syncMsg = data?.syncedToGitHub
          ? '🚀 Hero media added & Auto-committed to GitHub! Live site updating in ~45s.'
          : 'Hero media added! It will be randomly shown on homepage.';
        showNotify('success', syncMsg);
        setHeroUrl('');
        setHeroTitle('');
        setHeroAudioUrl('');
        setHeroMediaType('image');
        if (adminAudioPreviewRef.current) {
          adminAudioPreviewRef.current.pause();
          setActivePreviewAudio(null);
        }
        fetchData();
      } else {
        const data = await res.json().catch(() => ({}));
        showNotify('error', data.error || 'Failed to add hero media.');
      }
    } catch (err: any) {
      showNotify('error', err.message || 'Error adding hero media');
    } finally {
      setIsSubmittingHero(false);
    }
  };

  // Delete Hero Image
  const handleDeleteHero = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hero image?')) return;
    try {
      const res = await fetch(`/api/hero-images?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        const syncMsg = data?.syncedToGitHub
          ? '🚀 Hero media removed & Auto-committed to GitHub! Live site updating in ~45s.'
          : 'Hero image deleted.';
        showNotify('success', syncMsg);
        setHeroImages(prev => prev.filter(h => h.id !== id));
      }
    } catch {
      showNotify('error', 'Failed to delete hero image.');
    }
  };

  // Submit Stream
  const handleAddStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamTitle.trim()) {
      showNotify('error', 'Stream Title is required.');
      return;
    }

    setIsSubmittingStream(true);
    try {
      const res = await fetch('/api/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: streamTitle,
          description: streamDescription,
        }),
      });

      if (res.ok) {
        showNotify('success', 'New stream created successfully!');
        setStreamTitle('');
        setStreamDescription('');
        fetchData();
      } else {
        const data = await res.json();
        showNotify('error', data.error || 'Failed to create stream.');
      }
    } catch (err: any) {
      showNotify('error', err.message || 'Error creating stream');
    } finally {
      setIsSubmittingStream(false);
    }
  };

  // Delete Stream
  const handleDeleteStream = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stream?')) return;
    try {
      const res = await fetch(`/api/streams?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotify('success', 'Stream deleted.');
        setStreams(prev => prev.filter(s => s.id !== id));
      }
    } catch {
      showNotify('error', 'Failed to delete stream.');
    }
  };

  // Submit Audio
  const handleAddAudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioTitle.trim() || !audioUrl.trim()) {
      showNotify('error', 'Audio Title and Audio Link/Path are required.');
      return;
    }

    setIsSubmittingAudio(true);
    try {
      const res = await fetch('/api/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: audioTitle,
          url: audioUrl,
          artist: audioArtist,
        }),
      });

      if (res.ok) {
        showNotify('success', 'Audio track added to playlist!');
        setAudioTitle('');
        setAudioUrl('');
        setAudioArtist('');
        fetchData();
      } else {
        const data = await res.json();
        showNotify('error', data.error || 'Failed to add audio track.');
      }
    } catch (err: any) {
      showNotify('error', err.message || 'Error adding audio track');
    } finally {
      setIsSubmittingAudio(false);
    }
  };

  // Delete Audio
  const handleDeleteAudio = async (id: string) => {
    if (!confirm('Remove this track from background playlist?')) return;
    try {
      const res = await fetch(`/api/audio?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotify('success', 'Audio track removed.');
        setAudioTracks(prev => prev.filter(t => t.id !== id));
      }
    } catch {
      showNotify('error', 'Failed to delete audio.');
    }
  };

  // If Admin access is disabled globally via config
  if (!ENABLE_ADMIN_ACCESS) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-white">
        <div className="max-w-md w-full bg-neutral-50 border border-neutral-200 rounded-3xl p-8 text-center">
          <ShieldAlert className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-neutral-900 mb-2">Admin Portal Disabled</h1>
          <p className="text-sm text-neutral-500 mb-6">
            Access to the admin panel has been locked for this deployment or GitHub upload.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-full"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Feed</span>
          </Link>
        </div>
      </div>
    );
  }

  // Passcode Gate if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-6 bg-white">
        <div className="max-w-md w-full bg-white border border-neutral-200 rounded-3xl p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white mx-auto flex items-center justify-center mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-neutral-900">Separate Admin Portal</h1>
            <p className="text-xs text-neutral-500 mt-1">
              Isolated backend for managing streams, hero images, archival images, brand logo, and audio.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Admin Passcode
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter admin passcode..."
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                autoFocus
              />
              <p className="text-[11px] text-neutral-400 mt-1">
                Default test passcode: <code className="bg-neutral-100 px-1 py-0.5 rounded">darulehsan</code>
              </p>
            </div>

            {authError && (
              <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
            >
              Unlock Admin Portal
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-neutral-100 text-center">
            <Link
              href="/"
              className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors"
            >
              ← Back to public website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-white min-h-screen">
      
      {/* Admin Header with GitHub Shield Notice */}
      <div className="pb-6 mb-8 border-b border-neutral-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-neutral-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                Isolated Backend
              </span>
              <span className="text-xs text-neutral-400">• Unlinked from Frontend UI</span>
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
              Admin Content & Stream Management
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium rounded-full transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Public Feed</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </Link>

            <button
              onClick={() => {
                sessionStorage.removeItem('darulehsan_admin_auth');
                setIsAuthenticated(false);
              }}
              className="px-3.5 py-1.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-600 text-xs font-medium rounded-full transition-colors"
            >
              Lock & Logout
            </button>
          </div>
        </div>

        {/* Live GitHub Auto-Sync & Publishing Status */}
        <div className="mt-4">
          {syncStatus?.isConfigured ? (
            <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start sm:items-center gap-3">
                <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-600 text-white flex-shrink-0 shadow-sm">
                  <GitBranch className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-emerald-950">GitHub Live Auto-Sync Active</span>
                    <span className="font-mono text-[11px] bg-white text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                      {syncStatus.owner}/{syncStatus.repo} ({syncStatus.branch})
                    </span>
                  </div>
                  <p className="text-emerald-700 text-[11px] mt-0.5">
                    1-Click Mobile Upload is operational. All uploads from this phone or browser automatically commit to GitHub & trigger instant live site updates!
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-medium">
                  <Smartphone className="w-3 h-3" />
                  <span>Mobile Ready</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-neutral-50 border border-neutral-200/90 rounded-2xl p-4 flex items-start gap-3 text-xs text-neutral-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <div className="flex items-center gap-2">
                  <strong className="text-neutral-900 font-medium">Isolated Backend Portal</strong>
                  <span className="text-[10px] bg-neutral-200 text-neutral-700 font-semibold px-2 py-0.5 rounded-md">
                    Passcode Protected
                  </span>
                </div>
                <p className="text-neutral-600 text-[11px] mt-0.5">
                  This admin page is unlinked from the public site and secured with your passcode. On Vercel, with your GitHub token active, all mobile uploads auto-commit directly to GitHub!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`mb-6 p-4 rounded-2xl text-xs font-medium flex items-center gap-2 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-neutral-200 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('images')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-xs border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'images'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-400 hover:text-neutral-700'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Images & Feed Posts ({images.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('hero')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-xs border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'hero'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-400 hover:text-neutral-700'
          }`}
        >
          <LayoutTemplate className="w-4 h-4" />
          <span>Hero Images ({heroImages.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logo')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-xs border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'logo'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-400 hover:text-neutral-700'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Appearance & Branding</span>
        </button>

        <button
          onClick={() => setActiveTab('streams')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-xs border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'streams'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-400 hover:text-neutral-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Streams ({streams.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audio')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-xs border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'audio'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-400 hover:text-neutral-700'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          <span>Background Audio Music ({audioTracks.length})</span>
        </button>
      </div>

      {/* TAB 1: IMAGES MANAGEMENT & ADD FORM */}
      {activeTab === 'images' && (
        <div className="space-y-12">
          {/* Add Image Form */}
          <div className="bg-neutral-50/60 border border-neutral-200 rounded-3xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-neutral-900 mb-1 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Add New Image to Stream</span>
            </h2>
            <p className="text-xs text-neutral-500 mb-6">
              Complete the input fields below. Searchable tags and reference numbers will enable users to easily find the image on the public feed.
            </p>

            <form onSubmit={handleAddImage} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Image File or Link */}
                <div className="md:col-span-2">
                  <ImageFileInput
                    value={imageUrl}
                    onChange={(url, filename, detectedRatio) => {
                      setImageUrl(url);
                      if (detectedRatio) {
                        setImageAspectRatio(detectedRatio);
                      }
                      if (dupWarningUrl !== url.trim()) {
                        setDupWarningCount(0);
                        setDupWarningUrl('');
                      }
                      // Auto-populate title if empty and filename exists
                      if (filename && !imageTitle.trim()) {
                        const cleanTitle = filename
                          .replace(/\.[^/.]+$/, '')
                          .replace(/[-_]+/g, ' ')
                          .replace(/\b\w/g, (c) => c.toUpperCase())
                          .trim();
                        if (cleanTitle) setImageTitle(cleanTitle);
                      }
                    }}
                    label="Image File or Direct Link"
                    required
                    helperText="Upload a photo from your computer (auto-optimized) or provide a direct image URL link."
                  />

                  {/* Duplicate Link Warning Banner */}
                  {dupWarningCount > 0 && dupWarningUrl === imageUrl.trim() && (
                    <div className="mt-2.5 p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between text-xs text-amber-900 shadow-xs">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>
                          <strong>Duplicate Image Warning ({dupWarningCount} of 3):</strong>{' '}
                          {dupWarningCount < 3
                            ? `This image already exists in the database. Click submit ${3 - dupWarningCount} more time(s) to accept it.`
                            : '3 warnings acknowledged! Click submit once more to accept and publish this duplicate image.'}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded text-[11px] whitespace-nowrap ml-2">
                        {dupWarningCount}/3
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Image Title */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Image Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={imageTitle}
                    onChange={(e) => setImageTitle(e.target.value)}
                    placeholder="e.g. Sacred Manuscripts of Makalat-e-Hikmat"
                    className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Supports English or Urdu text in Jameel Noori Nastaleeq.
                  </p>
                </div>

                {/* 3. Image Reference Number */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-neutral-700">
                      Image Reference Number
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoGenerateRef}
                      className="text-[11px] text-neutral-500 hover:text-black underline font-mono"
                    >
                      Generate Auto #
                    </button>
                  </div>
                  <input
                    type="text"
                    value={imageRefNumber}
                    onChange={(e) => setImageRefNumber(e.target.value)}
                    placeholder="e.g. DUE-REF-101"
                    className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Public visitors can use this reference number to quickly search and find this image.
                  </p>
                </div>

                {/* 4. Notes for Image (Admin Only) */}
                <div className="md:col-span-2 bg-amber-50/50 border border-amber-200/70 rounded-2xl p-4">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    <label className="text-xs font-bold text-amber-900">
                      Notes for the Image (Strictly for Admin Only)
                    </label>
                  </div>
                  <p className="text-[11px] text-amber-800/80 mb-2">
                    Private confidential notes (e.g. physical archive vault location, donor name, negative roll number). Never displayed to public visitors!
                  </p>
                  <textarea
                    rows={2}
                    value={imageAdminNotes}
                    onChange={(e) => setImageAdminNotes(e.target.value)}
                    placeholder="e.g. Original print located in Cabinet #3, Drawer B. Negative archived by Trust."
                    className="w-full px-3.5 py-2 bg-white border border-amber-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* 5. Searchable Tags */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Searchable Tags (Comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    value={imageTags}
                    onChange={(e) => setImageTags(e.target.value)}
                    placeholder="e.g. manuscript, hikmat, 1984, calligraphy, faisalabad"
                    className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Allows visitors to search and filter images by these keywords.
                  </p>
                </div>

                {/* 6. Add Image to Streams */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Assign to Streams</span>
                  </label>
                  {streams.length === 0 ? (
                    <p className="text-xs text-neutral-400 p-2 bg-white rounded-xl border border-neutral-200">
                      No streams created yet. Go to Streams tab to create one.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2 p-3 bg-white border border-neutral-200 rounded-xl max-h-32 overflow-y-auto">
                      {streams.map((stream) => {
                        const isSelected = selectedStreams.includes(stream.id);
                        return (
                          <button
                            type="button"
                            key={stream.id}
                            onClick={() => toggleStreamSelection(stream.id)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                              isSelected
                                ? 'bg-neutral-900 text-white'
                                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '}
                            {stream.title}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Click to select which streams this image will appear in.
                  </p>
                </div>

                {/* 7. Description about image */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Description about the Image
                  </label>
                  <textarea
                    rows={4}
                    value={imageDescription}
                    onChange={(e) => setImageDescription(e.target.value)}
                    placeholder="Write detailed background, history, significance, or quote associated with this image. English and Urdu are both fully supported."
                    className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>

              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingImage}
                  className={`px-6 py-2.5 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-sm ${
                    dupWarningCount > 0 && dupWarningUrl === imageUrl.trim()
                      ? dupWarningCount >= 3
                        ? 'bg-amber-600 hover:bg-amber-700 ring-2 ring-amber-400'
                        : 'bg-amber-700 hover:bg-amber-800'
                      : 'bg-neutral-900 hover:bg-neutral-800'
                  }`}
                >
                  {isSubmittingImage 
                    ? 'Publishing to Stream...' 
                    : dupWarningCount > 0 && dupWarningUrl === imageUrl.trim()
                      ? dupWarningCount >= 3
                        ? 'Accept Duplicate & Publish to Stream'
                        : `Acknowledge Warning (${dupWarningCount}/3) & Proceed`
                      : 'Publish Image to Stream'}
                </button>
              </div>
            </form>
          </div>

          {/* Existing Images Table / Registry */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-neutral-900">
                Uploaded Images Registry ({images.length})
              </h2>
              <span className="text-xs text-neutral-400 font-mono">
                Real-time synchronized
              </span>
            </div>

            <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Preview</th>
                      <th className="py-3 px-4">Ref #</th>
                      <th className="py-3 px-4">Title & Description</th>
                      <th className="py-3 px-4">Admin Notes (Confidential)</th>
                      <th className="py-3 px-4">Streams & Tags</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-xs">
                    {images.map((image) => (
                      <tr key={image.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="py-3 px-4 w-16">
                          <img
                            src={image.url}
                            alt={image.title}
                            className="w-12 h-12 rounded-lg object-cover bg-neutral-100 border border-neutral-200"
                          />
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-neutral-700 whitespace-nowrap">
                          {image.referenceNumber}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <Link
                            href={`/image/${image.id}`}
                            target="_blank"
                            className="font-medium text-neutral-900 hover:underline flex items-center gap-1"
                          >
                            <span className="truncate">{image.title}</span>
                            <ExternalLink className="w-3 h-3 text-neutral-400" />
                          </Link>
                          {image.description && (
                            <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                              {image.description}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          {image.adminNotes ? (
                            <div className="p-1.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-md text-[11px]">
                              <span className="font-semibold block text-[10px]">🔒 Admin Note:</span>
                              {image.adminNotes}
                            </div>
                          ) : (
                            <span className="text-neutral-400 italic text-[11px]">None</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {image.tags?.map((t, i) => (
                              <span key={i} className="text-[10px] bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-600">
                                #{t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteImage(image.id)}
                            title="Delete image"
                            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HERO MEDIA MANAGEMENT (IMAGE & VIDEO + SEPARATE AUDIO) */}
      {activeTab === 'hero' && (
        <div className="space-y-10">
          <div className="bg-neutral-50/60 border border-neutral-200 rounded-3xl p-6 sm:p-8 max-w-2xl">
            <h2 className="text-lg font-bold text-neutral-900 mb-1 flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4" />
              <span>Add Homepage Hero Media (Image or Video)</span>
            </h2>
            <p className="text-xs text-neutral-500 mb-6">
              Hero media is displayed edge-to-edge under the navbar on the homepage. You can choose a static image or a looping video, and optionally attach a separate audio track that plays exclusively while visitors view this hero section.
            </p>

            <form onSubmit={handleAddHero} className="space-y-5">
              {/* Media Type Toggle: Image vs Video */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-2">
                  Hero Media Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setHeroMediaType('image');
                      setHeroUrl('');
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      heroMediaType === 'image'
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Static Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHeroMediaType('video');
                      setHeroUrl('');
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      heroMediaType === 'video'
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <Film className="w-4 h-4" />
                    <span>Hero Video (MP4 / WebM)</span>
                  </button>
                </div>
              </div>

              {/* Media Input: Image File/URL vs Video File/URL */}
              {heroMediaType === 'image' ? (
                <div>
                  <ImageFileInput
                    value={heroUrl}
                    onChange={(url, filename) => {
                      setHeroUrl(url);
                      if (filename && !heroTitle.trim()) {
                        const cleanTitle = filename
                          .replace(/\.[^/.]+$/, '')
                          .replace(/[-_]+/g, ' ')
                          .replace(/\b\w/g, (c) => c.toUpperCase())
                          .trim();
                        if (cleanTitle) setHeroTitle(cleanTitle);
                      }
                    }}
                    label="Hero Image File or Direct Link"
                    required
                    helperText="Upload a high-resolution hero photo from your computer or provide a direct web image link."
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-neutral-700">
                    Hero Video File or Direct Link <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={heroUrl}
                      onChange={(e) => setHeroUrl(e.target.value)}
                      placeholder="https://... direct .mp4 or .webm link or choose a video file"
                      className="flex-1 px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                    <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-800 cursor-pointer transition-colors whitespace-nowrap">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Video File</span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/ogg,video/quicktime"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 60 * 1024 * 1024) {
                              showNotify('error', 'Video is larger than 60MB. Please use a smaller clip or direct URL.');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () => {
                              setHeroUrl(reader.result as string);
                              if (!heroTitle.trim()) {
                                const cleanTitle = file.name
                                  .replace(/\.[^/.]+$/, '')
                                  .replace(/[-_]+/g, ' ')
                                  .replace(/\b\w/g, (c) => c.toUpperCase())
                                  .trim();
                                if (cleanTitle) setHeroTitle(cleanTitle);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Supports MP4, WebM, and MOV formats. Videos loop automatically as the hero background.
                  </p>
                  {heroUrl && (
                    <div className="mt-2 rounded-2xl overflow-hidden border border-neutral-200 bg-black max-h-56 flex items-center justify-center relative">
                      <video
                        src={heroUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-44 object-cover"
                      />
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-mono">
                        Video Preview
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Hero Title */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Hero Title / Identifier (Optional admin note)
                </label>
                <input
                  type="text"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  placeholder="e.g. Panoramic Dar-ul-Ehsan Courtyard"
                  className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              {/* SEPARATE AUDIO OPTION FOR HERO */}
              <div className="p-4 bg-white border border-neutral-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-neutral-900" />
                    <label className="text-xs font-bold text-neutral-900">
                      Separate Hero Audio Track (Optional)
                    </label>
                  </div>
                  {heroAudioUrl && (
                    <button
                      type="button"
                      onClick={() => toggleAudioPreview(heroAudioUrl)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      {activePreviewAudio === heroAudioUrl ? (
                        <>
                          <Pause className="w-3 h-3 text-red-600" />
                          <span>Stop Preview</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 text-emerald-600" />
                          <span>Test Audio</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-neutral-500 leading-relaxed">
                  When set, this audio plays exclusively while the visitor is viewing the hero section. When they scroll down into the images, this audio pauses and the platform&apos;s main playlist resumes.
                </p>

                {/* Quick Selection from existing playlist tracks */}
                {audioTracks.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                      Choose from Uploaded Playlist Tracks:
                    </label>
                    <select
                      value={audioTracks.some((t) => t.url === heroAudioUrl) ? heroAudioUrl : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          setHeroAudioUrl(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    >
                      <option value="">-- Choose from existing audio library --</option>
                      {audioTracks.map((track) => (
                        <option key={track.id} value={track.url}>
                          {track.title} {track.artist ? `(${track.artist})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Custom Audio URL or Upload */}
                <div className="pt-2 border-t border-neutral-100">
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                    Or Enter Custom Audio URL / Upload Audio File:
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={heroAudioUrl}
                      onChange={(e) => setHeroAudioUrl(e.target.value)}
                      placeholder="e.g. /api/audio-stream?id=... or https://... audio link"
                      className="flex-1 px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 font-mono focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                    <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-700 cursor-pointer transition-colors whitespace-nowrap">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Audio File</span>
                      <input
                        type="file"
                        accept="audio/mp3,audio/wav,audio/ogg,audio/mpeg,audio/aac,audio/m4a"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 30 * 1024 * 1024) {
                              showNotify('error', 'Audio file is too large (max 30MB).');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () => {
                              setHeroAudioUrl(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    {heroAudioUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          if (activePreviewAudio === heroAudioUrl && adminAudioPreviewRef.current) {
                            adminAudioPreviewRef.current.pause();
                            setActivePreviewAudio(null);
                          }
                          setHeroAudioUrl('');
                        }}
                        className="px-2.5 py-2 text-xs text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        title="Clear Audio"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingHero}
                className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                {isSubmittingHero ? 'Adding Hero Media...' : 'Add Hero Media'}
              </button>
            </form>
          </div>

          <div>
            <h2 className="text-base font-bold text-neutral-900 mb-4">
              Active Hero Media Pool ({heroImages.length})
            </h2>

            {heroImages.length === 0 ? (
              <p className="text-xs text-neutral-400 italic p-6 bg-neutral-50 rounded-2xl border border-neutral-200">
                No hero media added yet. Add one above to display under the navbar.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {heroImages.map((hero) => {
                  const isVid =
                    hero.mediaType === 'video' ||
                    Boolean(hero.url.match(/\.(mp4|webm|mov|ogg)(\?.*)?$/i)) ||
                    hero.url.startsWith('data:video/');

                  return (
                    <div
                      key={hero.id}
                      className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between"
                    >
                      <div className="relative h-44 bg-neutral-900 overflow-hidden">
                        {isVid ? (
                          <video
                            src={hero.url}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={hero.url}
                            alt={hero.title || 'Hero'}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute top-2 left-2 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-semibold backdrop-blur-xs flex items-center gap-1">
                            {isVid ? (
                              <>
                                <Film className="w-3 h-3 text-[#c6ff33]" />
                                <span>Video</span>
                              </>
                            ) : (
                              <>
                                <ImageIcon className="w-3 h-3 text-white" />
                                <span>Image</span>
                              </>
                            )}
                          </span>
                          {hero.audioUrl && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-600/90 text-white text-[10px] font-semibold backdrop-blur-xs flex items-center gap-1">
                              <Volume2 className="w-3 h-3" />
                              <span>Audio</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-4 flex flex-col justify-between gap-3 flex-1">
                        <div>
                          <h4 className="text-xs font-semibold text-neutral-900 truncate">
                            {hero.title || 'Untitled Hero'}
                          </h4>
                          <span className="text-[10px] text-neutral-400 block mt-0.5">
                            Added {hero.dateAdded}
                          </span>

                          {hero.audioUrl ? (
                            <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between">
                              <span className="text-[10px] text-emerald-700 font-medium truncate max-w-[140px]">
                                🎵 Dedicated Hero Audio
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleAudioPreview(hero.audioUrl!)}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
                              >
                                {activePreviewAudio === hero.audioUrl ? (
                                  <>
                                    <Pause className="w-2.5 h-2.5 text-red-600" />
                                    <span>Stop</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-2.5 h-2.5 text-emerald-600" />
                                    <span>Listen</span>
                                  </>
                                )}
                              </button>
                            </div>
                          ) : (
                            <div className="mt-2.5 pt-2 border-t border-neutral-100">
                              <span className="text-[10px] text-neutral-400 italic">
                                Plays platform playlist
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-end pt-1">
                          <button
                            onClick={() => handleDeleteHero(hero.id)}
                            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete hero media"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BRAND LOGO & APPEARANCE MANAGEMENT */}
      {activeTab === 'logo' && (
        <div className="space-y-10 max-w-3xl">
          <div className="bg-neutral-50/60 border border-neutral-200 rounded-3xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-neutral-900 mb-1 flex items-center gap-2">
              <Palette className="w-4 h-4 text-neutral-900" />
              <span>Website Appearance, Theme & Branding</span>
            </h2>
            <p className="text-xs text-neutral-500 mb-6">
              Customize the brand logo, website name visibility, home page fixed background, sticky navbar styling (blur, color, transparency), and audio wave colors.
            </p>

            <form onSubmit={handleSaveLogo} className="space-y-8">
              {/* SECTION 1: BRAND LOGO & SITE NAME */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider text-neutral-500">
                  1. Brand Logo & Site Title
                </h3>

                {/* Platform / Website Name Input */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Platform / Website Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={platformNameInput}
                    onChange={(e) => setPlatformNameInput(e.target.value)}
                    placeholder="e.g. Rahy Ishq"
                    className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 font-medium"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Changing this updates the website header, footer, page titles, and social media share previews across the entire platform in one place.
                  </p>
                </div>

                <div>
                  <ImageFileInput
                    value={logoInputUrl}
                    onChange={(url) => setLogoInputUrl(url)}
                    label="Brand Logo File or Link"
                    helperText="Upload a logo (transparent PNG/SVG recommended) from your computer or enter a direct image link."
                  />
                </div>

                <div className="bg-white border border-neutral-200 rounded-2xl p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hideSiteNameInput}
                      onChange={(e) => setHideSiteNameInput(e.target.checked)}
                      className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                    />
                    <div>
                      <span className="text-xs font-bold text-neutral-900 block">
                        Hide Website Name &amp; Use Logo Image Only
                      </span>
                      <span className="text-[11px] text-neutral-500 block mt-0.5">
                        When enabled, &quot;Makalat-E-Hikmat&quot; text will be removed and ONLY the logo image will be displayed in the header.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Live Navbar Logo Preview */}
                <div>
                  <span className="block text-xs font-semibold text-neutral-700 mb-2">
                    Header Brand Preview
                  </span>
                  <div className="p-4 bg-white border border-neutral-200 rounded-2xl flex items-center gap-3">
                    {logoInputUrl ? (
                      <img
                        src={logoInputUrl}
                        alt="Logo Preview"
                        onError={() => showNotify('error', 'Logo image link failed to load')}
                        className="h-9 w-auto max-w-[140px] object-contain"
                      />
                    ) : (
                      <div className="h-9 px-3 border border-dashed border-neutral-300 rounded-lg flex items-center justify-center text-[11px] text-neutral-400">
                        No Logo Uploaded
                      </div>
                    )}
                    {!hideSiteNameInput && (
                      <span className="font-semibold text-neutral-900 text-lg tracking-tight">
                        {platformNameInput || 'Rahy Ishq'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 2: HOME PAGE FIXED BACKGROUND */}
              <div className="pt-6 border-t border-neutral-200 space-y-4">
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider text-neutral-500">
                  2. Home Page Fixed Background Image
                </h3>
                <p className="text-xs text-neutral-500">
                  Set a fixed background photo behind the homepage. The background will remain completely fixed in place while feed images scroll smoothly through it.
                </p>

                <div>
                  <ImageFileInput
                    value={homeBgInputUrl}
                    onChange={(url) => setHomeBgInputUrl(url)}
                    label="Fixed Background Image File or Link"
                    helperText="Upload a high-res wallpaper photo from your computer or paste a direct image URL."
                  />
                </div>

                {homeBgInputUrl && (
                  <div className="p-4 bg-white border border-neutral-200 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-12 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100 flex-shrink-0">
                        <img
                          src={homeBgInputUrl}
                          alt="Background preview"
                          className="w-full h-full object-cover"
                          onError={() => showNotify('error', 'Background picture failed to load')}
                        />
                      </div>
                      <div className="text-xs">
                        <span className="font-semibold text-neutral-900 block">Fixed Background Active</span>
                        <span className="text-neutral-500 text-[11px]">Pictures will scroll over this static background.</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHomeBgInputUrl('')}
                      className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Remove Background
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 3: STICKY NAVBAR STYLING (BLUR, COLOR, TRANSPARENCY) */}
              <div className="pt-6 border-t border-neutral-200 space-y-5">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-neutral-900" />
                  <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider text-neutral-500">
                    3. Sticky Navbar Styling (Color, Transparency &amp; Blur)
                  </h3>
                </div>
                <p className="text-xs text-neutral-500">
                  Control the appearance of the sticky navigation bar when visitors scroll down the page.
                </p>

                {/* Navbar Color */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Sticky Navbar Background Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={navbarColorInput}
                      onChange={(e) => setNavbarColorInput(e.target.value)}
                      className="w-10 h-10 p-1 rounded-xl border border-neutral-200 cursor-pointer bg-white"
                    />
                    <input
                      type="text"
                      value={navbarColorInput}
                      onChange={(e) => setNavbarColorInput(e.target.value)}
                      placeholder="#ffffff"
                      className="w-32 px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                    {/* Quick Color Swatches */}
                    <div className="flex items-center gap-1.5 ml-2">
                      {[
                        { label: 'White', color: '#ffffff' },
                        { label: 'Charcoal', color: '#18181b' },
                        { label: 'Cream', color: '#faf8f5' },
                        { label: 'Slate', color: '#0f172a' },
                      ].map((preset) => (
                        <button
                          key={preset.color}
                          type="button"
                          onClick={() => setNavbarColorInput(preset.color)}
                          className="px-2.5 py-1 text-[11px] rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 transition-colors"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Navbar Transparency (Opacity) Slider */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-neutral-700">
                      Navbar Opacity / Transparency
                    </label>
                    <span className="text-xs font-mono font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded-md">
                      {navbarOpacityInput}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={navbarOpacityInput}
                    onChange={(e) => setNavbarOpacityInput(Number(e.target.value))}
                    className="w-full accent-neutral-900 h-2 bg-neutral-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 mt-1 font-mono">
                    <span>0% (Fully Transparent)</span>
                    <span>50%</span>
                    <span>75% (Recommended)</span>
                    <span>100% (Solid)</span>
                  </div>
                </div>

                {/* Navbar Blur Slider */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-neutral-700">
                      Navbar Frosted Blur
                    </label>
                    <span className="text-xs font-mono font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded-md">
                      {navbarBlurInput}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="1"
                    value={navbarBlurInput}
                    onChange={(e) => setNavbarBlurInput(Number(e.target.value))}
                    className="w-full accent-neutral-900 h-2 bg-neutral-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 mt-1 font-mono">
                    <span>0px (No Blur)</span>
                    <span>12px (Smooth Glass)</span>
                    <span>20px (Deep Frost)</span>
                    <span>30px (Max Blur)</span>
                  </div>
                </div>

                {/* Sticky Navbar Live Interactive Preview */}
                <div>
                  <span className="block text-xs font-semibold text-neutral-700 mb-2">
                    Live Sticky Navbar Preview (Simulated over Scrolling Content)
                  </span>
                  <div className="relative rounded-2xl overflow-hidden border border-neutral-200 h-28 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-200 via-rose-300 to-indigo-400 p-3 flex flex-col justify-between">
                    {/* Simulated Sticky Bar */}
                    <div
                      className="w-full rounded-xl px-4 py-2.5 flex items-center justify-between shadow-xs border border-white/20 transition-all duration-200"
                      style={{
                        backgroundColor: (() => {
                          const hex = navbarColorInput.replace('#', '');
                          const r = parseInt(hex.substring(0, 2) || 'ff', 16);
                          const g = parseInt(hex.substring(2, 4) || 'ff', 16);
                          const b = parseInt(hex.substring(4, 6) || 'ff', 16);
                          return `rgba(${r}, ${g}, ${b}, ${navbarOpacityInput / 100})`;
                        })(),
                        backdropFilter: `blur(${navbarBlurInput}px)`,
                        WebkitBackdropFilter: `blur(${navbarBlurInput}px)`,
                      }}
                    >
                      <span className="text-xs font-bold text-neutral-900">
                        {hideSiteNameInput && logoInputUrl ? 'Logo Only' : 'Makalat-E-Hikmat'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-black/10 flex items-center justify-center text-[10px]">🔍</span>
                        <span className="w-5 h-5 rounded-full bg-black/10 flex items-center justify-center text-[10px]">≡</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-neutral-800/80 font-medium bg-white/40 backdrop-blur-xs px-2 py-0.5 rounded-full self-start">
                      Simulated content showing through frosted navbar
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 4: FLOATING MUSIC BUTTON & SOUND WAVES */}
              <div className="pt-6 border-t border-neutral-200 space-y-5">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-neutral-900" />
                  <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider text-neutral-500">
                    4. Floating Music Button &amp; Audio Wave Color
                  </h3>
                </div>

                {/* Music Button Image Link */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Music Button Mini Image (URL)
                  </label>
                  <input
                    type="url"
                    value={musicIconInputUrl}
                    onChange={(e) => setMusicIconInputUrl(e.target.value)}
                    placeholder="https://... image link for circular music floating button"
                    className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Replaces the default icon with your mini image inside the circular button.
                  </p>
                </div>

                {/* Wave Color Selector */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Wave Equalizer Color
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="color"
                      value={waveColorInput}
                      onChange={(e) => setWaveColorInput(e.target.value)}
                      className="w-10 h-10 p-1 rounded-xl border border-neutral-200 cursor-pointer bg-white"
                    />
                    <input
                      type="text"
                      value={waveColorInput}
                      onChange={(e) => setWaveColorInput(e.target.value)}
                      placeholder="#84cc16"
                      className="w-32 px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />

                    {/* Quick Color Swatches */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        { label: 'Lime Green', color: '#84cc16' },
                        { label: 'Emerald', color: '#10b981' },
                        { label: 'Golden Amber', color: '#f59e0b' },
                        { label: 'Sky Blue', color: '#0ea5e9' },
                        { label: 'Violet', color: '#8b5cf6' },
                        { label: 'Rose Red', color: '#f43f5e' },
                        { label: 'White', color: '#ffffff' },
                      ].map((preset) => (
                        <button
                          key={preset.color}
                          type="button"
                          onClick={() => setWaveColorInput(preset.color)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 transition-colors"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/10"
                            style={{ backgroundColor: preset.color }}
                          />
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Preview of Playing vs Muted Waves */}
                <div>
                  <span className="block text-xs font-semibold text-neutral-700 mb-2">
                    Live Sound Waves Preview (Playing vs Muted State)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* State 1: Active / Playing Waves */}
                    <div className="p-5 bg-neutral-900 text-white rounded-2xl flex items-center gap-5">
                      <div className="relative flex items-center justify-center w-16 h-16 flex-shrink-0">
                        {/* Dynamic Radial Equalizer Waves */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <svg viewBox="0 0 100 100" className="w-16 h-16 overflow-visible">
                            {Array.from({ length: 24 }).map((_, i) => {
                              const rad = (i * 360 * Math.PI) / (24 * 180);
                              const innerR = 29;
                              const outerR = innerR + [6, 12, 8, 14, 7, 11, 15, 9, 13, 10][i % 10];
                              return (
                                <line
                                  key={i}
                                  x1={50 + innerR * Math.cos(rad)}
                                  y1={50 + innerR * Math.sin(rad)}
                                  x2={50 + outerR * Math.cos(rad)}
                                  y2={50 + outerR * Math.sin(rad)}
                                  stroke={waveColorInput}
                                  strokeWidth="2.75"
                                  strokeLinecap="round"
                                  className="animate-pulse"
                                  style={{
                                    animationDuration: `${0.8 + (i % 4) * 0.25}s`,
                                  }}
                                />
                              );
                            })}
                          </svg>
                        </div>
                        <div className="relative z-10 w-10 h-10 rounded-full overflow-hidden border-2 border-white bg-indigo-600 flex items-center justify-center">
                          {musicIconInputUrl ? (
                            <img
                              src={musicIconInputUrl}
                              alt="Music preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#4c449d] flex items-center justify-center text-white text-xs font-bold">
                              M
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs">
                        <span className="font-semibold text-emerald-400 block mb-0.5">
                          Sound ON (Playing)
                        </span>
                        <span className="text-neutral-400 text-[11px] leading-relaxed">
                          Dynamic animated waves in selected color pulse around the circle button.
                        </span>
                      </div>
                    </div>

                    {/* State 2: Muted State (No Waves Shown) */}
                    <div className="p-5 bg-neutral-900 text-white rounded-2xl flex items-center gap-5">
                      <div className="relative flex items-center justify-center w-16 h-16 flex-shrink-0">
                        {/* No waves when muted */}
                        <div className="relative z-10 w-11 h-11 rounded-full overflow-hidden border-2 border-white bg-indigo-600 flex items-center justify-center shadow-md">
                          {musicIconInputUrl ? (
                            <img
                              src={musicIconInputUrl}
                              alt="Music preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#4c449d] flex items-center justify-center text-white text-xs font-bold">
                              M
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs">
                        <span className="font-semibold text-neutral-300 block mb-0.5">
                          Sound Muted (No Waves)
                        </span>
                        <span className="text-neutral-400 text-[11px] leading-relaxed">
                          When sound is muted or paused, no waves are rendered around the button. Unmuting resumes playback right from where it left off.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 5: FOOTER CONTENT & FULL-SIZE SOCIAL MEDIA LINKS */}
              <div className="pt-6 border-t border-neutral-200 space-y-5">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-neutral-900" />
                  <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider text-neutral-500">
                    5. Footer Content &amp; Full-Size Social Links
                  </h3>
                </div>
                <p className="text-xs text-neutral-500">
                  Customize the English details line, Arabic/Urdu typography, and social media URLs displayed in the website footer card.
                </p>

                {/* Footer English Details Text */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Footer English Details Text
                  </label>
                  <textarea
                    rows={2}
                    value={footerEnglishInput}
                    onChange={(e) => setFooterEnglishInput(e.target.value)}
                    placeholder="Preserving the photographic, calligraphic, and manuscript heritage..."
                    className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Displayed on the top-right of the footer card in place of link columns.
                  </p>
                </div>

                {/* Footer Arabic / Urdu Text */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Footer Arabic / Urdu Text
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={footerArabicInput}
                    onChange={(e) => setFooterArabicInput(e.target.value)}
                    placeholder="خدمتِ خلق • ذکرِ الٰہی • نشرِ قرآن مجید"
                    className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm font-urdu text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-right"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Urdu / Arabic spiritual motto displayed beneath the English details line in Jameel Noori Nastaleeq font.
                  </p>
                </div>

                {/* Social Media Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Facebook */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Facebook Page / Profile Link
                    </label>
                    <input
                      type="url"
                      value={facebookInputUrl}
                      onChange={(e) => setFacebookInputUrl(e.target.value)}
                      placeholder="https://facebook.com/your-page"
                      className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      WhatsApp Link / Direct Chat URL
                    </label>
                    <input
                      type="url"
                      value={whatsappInputUrl}
                      onChange={(e) => setWhatsappInputUrl(e.target.value)}
                      placeholder="https://wa.me/923001234567"
                      className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>

                  {/* Instagram */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Instagram Profile Link
                    </label>
                    <input
                      type="url"
                      value={instagramInputUrl}
                      onChange={(e) => setInstagramInputUrl(e.target.value)}
                      placeholder="https://instagram.com/your-profile"
                      className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>

                  {/* TikTok */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      TikTok Account Link
                    </label>
                    <input
                      type="url"
                      value={tiktokInputUrl}
                      onChange={(e) => setTiktokInputUrl(e.target.value)}
                      placeholder="https://tiktok.com/@your-handle"
                      className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                </div>

                {/* Footer Live Preview */}
                <div className="pt-2">
                  <span className="block text-xs font-semibold text-neutral-700 mb-2">
                    Live Footer Card Preview
                  </span>
                  <div className="bg-[#0b0c0e] text-white rounded-2xl p-5 border border-white/10 shadow-lg space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        {logoInputUrl ? (
                          <img
                            src={logoInputUrl}
                            alt="Logo preview"
                            className="h-8 w-auto object-contain max-w-[140px]"
                          />
                        ) : (
                          <span className="font-semibold text-sm text-white">
                            {hideSiteNameInput ? '' : 'Makalat-E-Hikmat'}
                          </span>
                        )}
                        <span className="text-[11px] text-neutral-400 block mt-1">
                          📍 Camp Dar-ul-Ehsan, Faisalabad
                        </span>
                      </div>
                      <div className="text-left sm:text-right space-y-1 max-w-sm">
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          {footerEnglishInput || 'Preserving the heritage...'}
                        </p>
                        <p className="font-urdu text-neutral-300 text-xs leading-relaxed">
                          {footerArabicInput || 'خدمتِ خلق • ذکرِ الٰہی • نشرِ قرآن مجید'}
                        </p>
                      </div>
                    </div>
                    <div className="h-px bg-neutral-800" />
                    <div className="flex items-center justify-between text-xs text-neutral-400">
                      <div className="flex items-center gap-3 text-white">
                        <span className="font-bold text-[11px]">Facebook</span>
                        <span className="font-bold text-[11px]">WhatsApp</span>
                        <span className="font-bold text-[11px]">Instagram</span>
                        <span className="font-bold text-[11px]">TikTok</span>
                      </div>
                      <span className="text-[10px]">© 2026 Makalat-E-Hikmat</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SAVE BUTTONS */}
              <div className="flex items-center gap-3 pt-6 border-t border-neutral-200">
                <button
                  type="submit"
                  disabled={isSavingLogo}
                  className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
                >
                  {isSavingLogo ? 'Saving Settings...' : 'Save All Appearance & Theme Settings'}
                </button>

                {logoInputUrl && (
                  <button
                    type="button"
                    onClick={handleClearLogo}
                    disabled={isSavingLogo}
                    className="px-4 py-2.5 border border-neutral-200 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold rounded-xl transition-all"
                  >
                    Clear Brand Logo
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: STREAMS MANAGEMENT */}
      {activeTab === 'streams' && (
        <div className="space-y-10">
          <div className="bg-neutral-50/60 border border-neutral-200 rounded-3xl p-6 sm:p-8 max-w-2xl">
            <h2 className="text-lg font-bold text-neutral-900 mb-1 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>Create New Stream</span>
            </h2>
            <p className="text-xs text-neutral-500 mb-6">
              Create feeds or categories to organize images for browsing via the navbar Streams button.
            </p>

            <form onSubmit={handleAddStream} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Stream Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  placeholder="e.g. Sacred Manuscripts, Camp Dar-ul-Ehsan, etc."
                  className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Stream Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={streamDescription}
                  onChange={(e) => setStreamDescription(e.target.value)}
                  placeholder="Short description of what this stream contains..."
                  className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingStream}
                className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
              >
                {isSubmittingStream ? 'Creating Stream...' : 'Create Stream'}
              </button>
            </form>
          </div>

          <div>
            <h2 className="text-base font-bold text-neutral-900 mb-4">
              Existing Streams ({streams.length})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {streams.map((stream) => {
                const count = images.filter((img) =>
                  img.streamIds?.includes(stream.id)
                ).length;

                return (
                  <div
                    key={stream.id}
                    className="p-5 bg-white border border-neutral-200 rounded-2xl flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-neutral-900 text-sm">
                          {stream.title}
                        </h3>
                        <span className="text-[11px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-mono">
                          {count} images
                        </span>
                      </div>
                      {stream.description && (
                        <p className="text-xs text-neutral-500 mb-4">
                          {stream.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-neutral-400 font-mono">
                        Slug: {stream.slug}
                      </span>
                      <button
                        onClick={() => handleDeleteStream(stream.id)}
                        className="text-neutral-400 hover:text-red-600 p-1 rounded-md transition-colors"
                        title="Delete stream"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIO MUSIC MANAGEMENT */}
      {activeTab === 'audio' && (
        <div className="space-y-10">
          <div className="bg-neutral-50/60 border border-neutral-200 rounded-3xl p-6 sm:p-8 max-w-2xl">
            <h2 className="text-lg font-bold text-neutral-900 mb-1 flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              <span>Add Background Audio Music</span>
            </h2>
            <p className="text-xs text-neutral-500 mb-6">
              Background music plays softly across the website, rotates every 10 minutes, and shuffles continuously. Visitors can toggle mute/unmute via the animated floating button.
            </p>

            <form onSubmit={handleAddAudio} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Audio Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={audioTitle}
                  onChange={(e) => setAudioTitle(e.target.value)}
                  placeholder="e.g. Serene Meditation Tone or Spiritual Flute"
                  className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Audio Link or Local File Path <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  placeholder="e.g. /music/my-melody.mp3 or https://..."
                  className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
                <p className="text-[11px] text-neutral-400 mt-1">
                  You can drop any mp3 or wav files inside <code className="bg-neutral-100 px-1 py-0.5 rounded">public/music/</code> and reference them here as <code className="bg-neutral-100 px-1 py-0.5 rounded">/music/filename.mp3</code>, or provide external links.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Artist / Source (Optional)
                </label>
                <input
                  type="text"
                  value={audioArtist}
                  onChange={(e) => setAudioArtist(e.target.value)}
                  placeholder="e.g. Dar-ul-Ehsan Ambient"
                  className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingAudio}
                className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
              >
                {isSubmittingAudio ? 'Adding Track...' : 'Add to Background Music Playlist'}
              </button>
            </form>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-neutral-900">
                  Active Background Music Tracks ({audioTracks.length})
                </h2>
                <p className="text-xs text-neutral-400">
                  Tracks automatically shuffle and change every 10 minutes on the live website.
                </p>
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Track Title</th>
                    <th className="py-3 px-4">URL / Path</th>
                    <th className="py-3 px-4">Audio Test Preview</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs">
                  {audioTracks.map((track) => (
                    <tr key={track.id} className="hover:bg-neutral-50/50">
                      <td className="py-3 px-4 font-medium text-neutral-900">
                        {track.title}
                        {track.artist && (
                          <span className="block text-[11px] text-neutral-400">
                            {track.artist}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-neutral-600 truncate max-w-xs">
                        {track.url}
                      </td>
                      <td className="py-3 px-4">
                        <audio controls src={track.url} className="h-8 w-48" preload="none" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteAudio(track.id)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove track"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Hidden audio element for previewing hero audio tracks in admin */}
      <audio
        ref={adminAudioPreviewRef}
        onEnded={() => setActivePreviewAudio(null)}
        className="hidden"
      />
    </div>
  );
}
