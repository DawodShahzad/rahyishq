'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { AudioTrack } from '@/types';

const STORAGE_KEY = 'site_audio_unmuted';

const DEFAULT_TRACKS: AudioTrack[] = [
  {
    id: 'track-1',
    title: '1st',
    url: '/api/audio-stream?id=track-1',
    artist: 'Dar-ul-Ehsan Ambient',
    duration: '0:30',
    dateAdded: '2026-10-24',
  },
  {
    id: 'track-2',
    title: '2nd',
    url: '/api/audio-stream?id=track-2',
    artist: 'Dar-ul-Ehsan Ambient',
    duration: '0:30',
    dateAdded: '2026-10-24',
  },
  {
    id: 'track-3',
    title: '3rd',
    url: '/api/audio-stream?id=track-3',
    artist: 'Dar-ul-Ehsan Ambient',
    duration: '0:30',
    dateAdded: '2026-10-24',
  },
];

export default function FloatingAudioPlayer() {
  const pathname = usePathname();
  const isAdminPage = Boolean(pathname?.startsWith('/admin'));

  const [tracks, setTracks] = useState<AudioTrack[]>(DEFAULT_TRACKS);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([0, 1, 2]);
  const [currentIndexOrder, setCurrentIndexOrder] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isHeroPlaying, setIsHeroPlaying] = useState<boolean>(false);
  const [isHeroActive, setIsHeroActive] = useState<boolean>(false);
  const [heroAudioUrl, setHeroAudioUrl] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [musicIconUrl, setMusicIconUrl] = useState<string>('');
  const [waveColor, setWaveColor] = useState<string>('#84cc16');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const heroAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMutedRef = useRef<boolean>(true);
  const isHeroActiveRef = useRef<boolean>(false);
  const currentTrackIdRef = useRef<string | null>(null);
  const wasPlayingBeforeHideRef = useRef<{
    playlist: boolean;
    hero: boolean;
    unmuted: boolean;
  }>({
    playlist: false,
    hero: false,
    unmuted: false,
  });

  // Keep isMutedRef in sync so event listeners always have latest value
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Keep isHeroActiveRef in sync
  useEffect(() => {
    isHeroActiveRef.current = isHeroActive;
  }, [isHeroActive]);

  // Ensure music NEVER plays when user is on the admin page
  useEffect(() => {
    if (isAdminPage) {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
      if (heroAudioRef.current && !heroAudioRef.current.paused) {
        heroAudioRef.current.pause();
      }
      setIsPlaying(false);
      setIsHeroPlaying(false);
    }
  }, [isAdminPage]);

  // Auto-pause music when the user switches away (tab or window hidden) and resume on return
  useEffect(() => {
    if (isAdminPage) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden from view: pause music
        const isPlPlaying = Boolean(audioRef.current && !audioRef.current.paused);
        const isHrPlaying = Boolean(heroAudioRef.current && !heroAudioRef.current.paused);
        const isCurrentlyUnmuted = !isMutedRef.current;

        wasPlayingBeforeHideRef.current = {
          playlist: isPlPlaying,
          hero: isHrPlaying,
          unmuted: isCurrentlyUnmuted,
        };

        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
        }
        if (heroAudioRef.current && !heroAudioRef.current.paused) {
          heroAudioRef.current.pause();
        }
      } else {
        // Page is visible again on screen: resume playback if it was playing before
        const { playlist, hero, unmuted } = wasPlayingBeforeHideRef.current;

        if (hero && isHeroActiveRef.current && heroAudioRef.current) {
          const heroAudio = heroAudioRef.current;
          heroAudio.muted = !unmuted;
          heroAudio.play()
            .then(() => {
              if (unmuted) setIsHeroPlaying(true);
            })
            .catch(() => {});
        } else if (playlist && !isHeroActiveRef.current && audioRef.current) {
          const audio = audioRef.current;
          audio.muted = !unmuted;
          audio.play()
            .then(() => {
              if (unmuted) setIsPlaying(true);
            })
            .catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAdminPage]);

  // Read saved audio preference from localStorage on initial mount
  useEffect(() => {
    if (isAdminPage) return;

    let savedPref: string | null = null;
    try {
      savedPref = localStorage.getItem(STORAGE_KEY);
    } catch {
      // Ignore if localStorage is unavailable
    }

    const isPrefUnmuted = savedPref === 'true';

    if (isPrefUnmuted) {
      setIsMuted(false);
      isMutedRef.current = false;
    } else {
      setIsMuted(true);
      isMutedRef.current = true;
    }

    if (audioRef.current && !isHeroActiveRef.current) {
      const audio = audioRef.current;
      if (isPrefUnmuted) {
        audio.muted = false;
        audio.volume = 1.0;
        audio.play()
          .then(() => {
            setIsPlaying(true);
            setIsMuted(false);
          })
          .catch(() => {
            audio.muted = true;
            audio.play().catch(() => {});
          });
      } else {
        audio.muted = true;
        audio.play().catch(() => {});
      }
    }
  }, [isAdminPage]);

  // Fetch playlist & appearance settings (music icon & wave color)
  const loadData = useCallback(async () => {
    try {
      const [audioRes, settingsRes] = await Promise.all([
        fetch('/api/audio'),
        fetch('/api/settings'),
      ]);

      if (audioRes.ok) {
        const data: AudioTrack[] = await audioRes.json();
        if (data && data.length > 0) {
          setTracks(data);
          const indices = data.map((_, i) => i);
          for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
          }
          setShuffledIndices(indices);
          setCurrentIndexOrder(0);
        }
      }

      if (settingsRes.ok) {
        const s = await settingsRes.json();
        if (s.musicIconUrl !== undefined) setMusicIconUrl(s.musicIconUrl);
        if (s.waveColor) setWaveColor(s.waveColor);
      }
    } catch (e) {
      console.warn('Audio tracks or settings fetch failed:', e);
    }
  }, []);

  useEffect(() => {
    loadData();

    const handleSettingsUpdated = () => {
      fetch('/api/settings')
        .then((res) => res.json())
        .then((s) => {
          if (s.musicIconUrl !== undefined) setMusicIconUrl(s.musicIconUrl);
          if (s.waveColor) setWaveColor(s.waveColor);
        })
        .catch(() => {});
    };

    window.addEventListener('site-settings-updated', handleSettingsUpdated);
    return () => window.removeEventListener('site-settings-updated', handleSettingsUpdated);
  }, [loadData]);

  // Handle hero audio activation / deactivation events
  useEffect(() => {
    const handleHeroActive = (e: any) => {
      const audioUrl = e.detail?.audioUrl;
      if (!audioUrl) return;

      setIsHeroActive(true);
      isHeroActiveRef.current = true;
      setHeroAudioUrl(audioUrl);

      // Pause regular playlist audio
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
      }

      // Play hero audio
      if (heroAudioRef.current) {
        const heroAudio = heroAudioRef.current;
        if (heroAudio.src !== audioUrl) {
          heroAudio.src = audioUrl;
          heroAudio.load();
        }

        const shouldBeUnmuted = !isMutedRef.current;
        heroAudio.muted = !shouldBeUnmuted;
        heroAudio.volume = 1.0;
        heroAudio.play()
          .then(() => {
            if (shouldBeUnmuted) {
              setIsHeroPlaying(true);
            }
          })
          .catch(() => {
            heroAudio.muted = true;
            heroAudio.play().catch(() => {});
          });
      }
    };

    const handleHeroInactive = () => {
      if (!isHeroActiveRef.current) return;
      setIsHeroActive(false);
      isHeroActiveRef.current = false;
      setIsHeroPlaying(false);

      // Pause hero audio
      if (heroAudioRef.current) {
        heroAudioRef.current.pause();
      }

      // Resume regular playlist audio
      if (audioRef.current) {
        const audio = audioRef.current;
        const shouldBeUnmuted = !isMutedRef.current;
        audio.muted = !shouldBeUnmuted;
        audio.volume = 1.0;
        audio.play()
          .then(() => {
            if (shouldBeUnmuted) {
              setIsPlaying(true);
            }
          })
          .catch(() => {
            audio.muted = true;
            audio.play().catch(() => {});
          });
      }
    };

    window.addEventListener('hero-audio-active', handleHeroActive);
    window.addEventListener('hero-audio-inactive', handleHeroInactive);
    return () => {
      window.removeEventListener('hero-audio-active', handleHeroActive);
      window.removeEventListener('hero-audio-inactive', handleHeroInactive);
    };
  }, []);

  const activeTrackIndex = shuffledIndices.length > 0 ? shuffledIndices[currentIndexOrder] : 0;
  const currentTrack = tracks[activeTrackIndex] || DEFAULT_TRACKS[0];

  // Advance to next shuffled track
  const nextTrack = useCallback(() => {
    if (shuffledIndices.length === 0) return;
    setCurrentIndexOrder((prev) => (prev + 1) % shuffledIndices.length);
  }, [shuffledIndices]);

  // 10-minute track rotation for playlist
  useEffect(() => {
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      nextTrack();
    }, TEN_MINUTES_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [nextTrack]);

  // Switch audio source when currentTrack changes
  useEffect(() => {
    if (!currentTrack || !audioRef.current) return;
    const audio = audioRef.current;

    if (currentTrackIdRef.current !== currentTrack.id) {
      currentTrackIdRef.current = currentTrack.id;
      audio.src = currentTrack.url;
      audio.load();

      let savedPref: string | null = null;
      try {
        savedPref = localStorage.getItem(STORAGE_KEY);
      } catch {}

      const shouldBeUnmuted = savedPref === 'true' && !isMutedRef.current;
      audio.muted = !shouldBeUnmuted;
      audio.volume = 1.0;

      // Only play playlist if hero audio is NOT currently active and NOT on admin
      if (!isHeroActiveRef.current && !isAdminPage) {
        audio.play()
          .then(() => {
            if (shouldBeUnmuted) {
              setIsMuted(false);
              setIsPlaying(true);
            }
          })
          .catch(() => {
            if (audioRef.current) {
              audioRef.current.muted = true;
              audioRef.current.play().catch(() => {});
            }
          });
      }
    }
  }, [currentTrack, isAdminPage]);

  // The first tap anywhere on the screen shifts the muted music to unmuted and stores in localStorage
  useEffect(() => {
    if (isAdminPage) return;
    let unmutedThisSession = false;

    const handleFirstGesture = (e: Event) => {
      if (isAdminPage || unmutedThisSession) return;

      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-audio-control="true"]')) {
        return; // Let the floating button click handler handle its own click
      }

      // Check user preference from localStorage: if explicitly muted by user, don't force unmute on random tap
      let savedPref: string | null = null;
      try {
        savedPref = localStorage.getItem(STORAGE_KEY);
      } catch {}

      // If user never set preference (first time) OR user preference is 'true' (unmuted)
      if (savedPref !== 'false') {
        unmutedThisSession = true;
        try {
          localStorage.setItem(STORAGE_KEY, 'true');
        } catch {}

        // Unlock Web Audio context for Safari / Chrome if suspended
        try {
          const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            if (ctx.state === 'suspended') {
              ctx.resume().catch(() => {});
            }
          }
        } catch {}

        setIsMuted(false);
        isMutedRef.current = false;

        // Unmute whichever track is currently active
        if (isHeroActiveRef.current && heroAudioRef.current) {
          heroAudioRef.current.muted = false;
          heroAudioRef.current.volume = 1.0;
          heroAudioRef.current.play()
            .then(() => {
              setIsHeroPlaying(true);
            })
            .catch(() => {});
        } else if (audioRef.current) {
          audioRef.current.muted = false;
          audioRef.current.volume = 1.0;
          audioRef.current.play()
            .then(() => {
              setIsPlaying(true);
            })
            .catch(() => {});
        }

        cleanupListeners();
      }
    };

    const events = ['touchstart', 'pointerdown', 'click', 'keydown'];
    const cleanupListeners = () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, handleFirstGesture, true);
        document.removeEventListener(evt, handleFirstGesture, true);
      });
    };

    events.forEach((evt) => {
      window.addEventListener(evt, handleFirstGesture, { capture: true, passive: true });
      document.addEventListener(evt, handleFirstGesture, { capture: true, passive: true });
    });

    return () => {
      cleanupListeners();
    };
  }, []);

  // Toggle Mute / Unmute from the mini floating button (updates localStorage)
  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const isCurrentlySilent = isMuted || (!isPlaying && !isHeroPlaying);

    if (isCurrentlySilent) {
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch {}

      setIsMuted(false);
      isMutedRef.current = false;

      if (isHeroActiveRef.current && heroAudioRef.current) {
        heroAudioRef.current.muted = false;
        heroAudioRef.current.volume = 1.0;
        heroAudioRef.current.play()
          .then(() => {
            setIsHeroPlaying(true);
          })
          .catch((err) => console.warn('Hero audio play error:', err));
      } else if (audioRef.current) {
        audioRef.current.muted = false;
        audioRef.current.volume = 1.0;
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => console.warn('Playlist play error:', err));
      }
    } else {
      try {
        localStorage.setItem(STORAGE_KEY, 'false');
      } catch {}

      setIsMuted(true);
      isMutedRef.current = true;
      setIsPlaying(false);
      setIsHeroPlaying(false);

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.muted = true;
      }
      if (heroAudioRef.current) {
        heroAudioRef.current.pause();
        heroAudioRef.current.muted = true;
      }
    }
  };

  const handleTrackEnded = () => {
    nextTrack();
  };

  // 24 radial bars for audio waves sunburst
  const numBars = 24;
  const bars = Array.from({ length: numBars }, (_, i) => {
    const angle = (i * 360) / numBars;
    const heights = [6, 12, 8, 14, 7, 11, 15, 9, 13, 6, 10, 14, 8, 12, 16, 7, 11, 14, 9, 13, 7, 11, 15, 8];
    const height = heights[i % heights.length];
    return { angle, height, delay: (i * 0.08) % 1.2 };
  });

  const isAnyAudioActive = !isMuted && (isHeroActive ? isHeroPlaying : isPlaying);

  if (isAdminPage) {
    return null;
  }

  return (
    <>
      {/* Platform Playlist Audio Element */}
      <audio
        ref={audioRef}
        src={currentTrack.url}
        onEnded={handleTrackEnded}
        onPlay={() => {
          if (audioRef.current && !audioRef.current.muted && !isHeroActiveRef.current) {
            setIsPlaying(true);
          }
        }}
        onPause={() => setIsPlaying(false)}
        playsInline
        preload="auto"
        className="hidden"
      />

      {/* Hero Section Dedicated Audio Element (Loops seamlessly while user is at hero) */}
      <audio
        ref={heroAudioRef}
        src={heroAudioUrl || undefined}
        loop
        onPlay={() => {
          if (heroAudioRef.current && !heroAudioRef.current.muted && isHeroActiveRef.current) {
            setIsHeroPlaying(true);
          }
        }}
        onPause={() => setIsHeroPlaying(false)}
        playsInline
        preload="auto"
        className="hidden"
      />

      {/* Floating Animated Audio Button */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center justify-center">
        <button
          onClick={toggleSound}
          data-audio-control="true"
          aria-label={!isAnyAudioActive ? 'Unmute music' : 'Mute music'}
          className="relative group flex items-center justify-center w-16 h-16 transition-transform duration-300 hover:scale-105 active:scale-95 focus:outline-none cursor-pointer"
        >
          {/* Audio Waves Surrounding the Circle - Only shown when sound is actively unmuted & playing */}
          {isAnyAudioActive ? (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <svg 
                viewBox="0 0 100 100" 
                className="w-20 h-20 overflow-visible"
              >
                {bars.map((bar, idx) => {
                  const rad = (bar.angle * Math.PI) / 180;
                  const innerR = 29;
                  const outerR = innerR + bar.height;
                  const x1 = 50 + innerR * Math.cos(rad);
                  const y1 = 50 + innerR * Math.sin(rad);
                  const x2 = 50 + outerR * Math.cos(rad);
                  const y2 = 50 + outerR * Math.sin(rad);

                  return (
                    <line
                      key={idx}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={waveColor}
                      strokeWidth="2.75"
                      strokeLinecap="round"
                      className="animate-pulse"
                      style={{
                        animationDuration: `${0.75 + (idx % 4) * 0.25}s`,
                        animationDelay: `${bar.delay}s`,
                        transformOrigin: '50px 50px',
                      }}
                    />
                  );
                })}
              </svg>
            </div>
          ) : null}

          {/* Central Circular Mini Image Button */}
          <div className="relative z-10 w-11 h-11 rounded-full overflow-hidden shadow-md border-2 border-white bg-gradient-to-tr from-[#4338ca] to-[#6366f1] flex items-center justify-center">
            {musicIconUrl ? (
              <img
                src={musicIconUrl}
                alt="Music icon"
                className="w-full h-full object-cover"
              />
            ) : (
              /* Sleek modern default disc icon */
              <div className="w-full h-full flex items-center justify-center bg-[#4c449d] text-white">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              </div>
            )}
          </div>
        </button>
      </div>
    </>
  );
}
