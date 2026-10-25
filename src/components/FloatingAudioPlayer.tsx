'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AudioTrack } from '@/types';

export default function FloatingAudioPlayer() {
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [currentIndexOrder, setCurrentIndexOrder] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [musicIconUrl, setMusicIconUrl] = useState<string>('');
  const [waveColor, setWaveColor] = useState<string>('#84cc16');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
        .then(res => res.json())
        .then(s => {
          if (s.musicIconUrl !== undefined) setMusicIconUrl(s.musicIconUrl);
          if (s.waveColor) setWaveColor(s.waveColor);
        })
        .catch(() => {});
    };

    window.addEventListener('site-settings-updated', handleSettingsUpdated);
    return () => window.removeEventListener('site-settings-updated', handleSettingsUpdated);
  }, [loadData]);

  const activeTrackIndex = shuffledIndices.length > 0 ? shuffledIndices[currentIndexOrder] : 0;
  const currentTrack = tracks[activeTrackIndex];

  // Advance to next shuffled track
  const nextTrack = useCallback(() => {
    if (shuffledIndices.length === 0) return;
    setCurrentIndexOrder((prev) => (prev + 1) % shuffledIndices.length);
  }, [shuffledIndices]);

  // 10-minute track rotation
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

  const currentTrackIdRef = useRef<string | null>(null);

  // Sync audio source ONLY when track actually changes (not on mute/unmute)
  useEffect(() => {
    if (!currentTrack || !audioRef.current) return;
    const audio = audioRef.current;

    // Only load if track has changed to a new one
    if (currentTrackIdRef.current !== currentTrack.id) {
      currentTrackIdRef.current = currentTrack.id;
      audio.src = currentTrack.url;
      audio.load();

      if (!isMuted) {
        audio.muted = false;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch((err) => {
              console.log('Autoplay deferred until first user interaction:', err);
              const unlockPlay = () => {
                if (audioRef.current && !audioRef.current.paused) return;
                if (audioRef.current && !isMuted) {
                  audioRef.current.muted = false;
                  audioRef.current.play()
                    .then(() => setIsPlaying(true))
                    .catch(() => {});
                }
                cleanupListeners();
              };

              const events = ['click', 'touchstart', 'scroll', 'keydown', 'pointerdown'];
              const cleanupListeners = () => {
                events.forEach((evt) => {
                  window.removeEventListener(evt, unlockPlay);
                  document.removeEventListener(evt, unlockPlay);
                });
              };

              events.forEach((evt) => {
                window.addEventListener(evt, unlockPlay, { once: true, passive: true });
                document.addEventListener(evt, unlockPlay, { once: true, passive: true });
              });
            });
        }
      }
    }
  }, [currentTrack, isMuted]);

  // Toggle Mute / Unmute (Resumes from where left off without restarting)
  const toggleSound = () => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    if (isMuted || !isPlaying) {
      audio.muted = false;
      audio.play()
        .then(() => {
          setIsMuted(false);
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn('Playback prevented:', err);
        });
    } else {
      audio.pause();
      setIsMuted(true);
      setIsPlaying(false);
    }
  };

  const handleTrackEnded = () => {
    nextTrack();
  };

  if (!currentTrack) return null;

  // 24 radial bars for audio waves sunburst
  const numBars = 24;
  const bars = Array.from({ length: numBars }, (_, i) => {
    const angle = (i * 360) / numBars;
    // Vary heights for realistic audio equalizer effect
    const heights = [6, 12, 8, 14, 7, 11, 15, 9, 13, 6, 10, 14, 8, 12, 16, 7, 11, 14, 9, 13, 7, 11, 15, 8];
    const height = heights[i % heights.length];
    return { angle, height, delay: (i * 0.08) % 1.2 };
  });

  return (
    <>
      <audio
        ref={audioRef}
        onEnded={handleTrackEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        preload="auto"
        className="hidden"
      />

      {/* Floating Animated Audio Button */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center justify-center">
        <button
          onClick={toggleSound}
          aria-label={isMuted || !isPlaying ? 'Unmute music' : 'Mute music'}
          className="relative group flex items-center justify-center w-16 h-16 transition-transform duration-300 hover:scale-105 active:scale-95 focus:outline-none"
        >
          {/* Audio Waves Surrounding the Circle - Only shown when sound is actively playing */}
          {!isMuted && isPlaying ? (
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
