'use client';

import { useEffect, useRef, useState } from 'react';
import { DownloadUrl } from '@/types/movie';

interface AdvancedVideoPlayerProps {
  sources: DownloadUrl[];
  poster?: string;
  title?: string;
  onReady?: () => void;
}

interface SubtitleTrack {
  label: string;
  language: string;
  src: string;
  default?: boolean;
}

interface AudioTrack {
  label: string;
  language: string;
  id: string;
}

export default function AdvancedVideoPlayer({ sources, poster, onReady }: AdvancedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<unknown>(null);
  const hlsRef = useRef<unknown>(null);
  const [isClient, setIsClient] = useState(false);
  
  const [currentSource, setCurrentSource] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([]);
  const [playerReady, setPlayerReady] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // Dynamically load Plyr CSS
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.plyr.io/3.7.8/plyr.css';
      link.onload = () => console.log('Plyr CSS loaded');
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    if (!isClient || !videoRef.current || sources.length === 0) return;

    initializePlayer();

    return () => {
      cleanup();
    };
  }, [isClient]);

  useEffect(() => {
    if (playerReady && sources[currentSource]) {
      loadSource(sources[currentSource]);
    }
  }, [currentSource, playerReady]);

  const initializePlayer = async () => {
    if (!videoRef.current || !isClient) return;

    try {
      // Dynamic import to avoid SSR issues
      const [{ default: Plyr }, { default: Hls }] = await Promise.all([
        import('plyr'),
        import('hls.js')
      ]);

      // Initialize Plyr with advanced options
      const player = new Plyr(videoRef.current, {
        controls: [
          'play-large',
          'play',
          'progress',
          'current-time',
          'duration',
          'mute',
          'volume',
          'captions',
          'settings',
          'pip',
          'airplay',
          'fullscreen'
        ],
        settings: ['captions', 'quality', 'speed', 'loop'],
        captions: {
          active: false,
          language: 'auto',
          update: true
        },
        quality: {
          default: 576,
          options: [576, 720, 1080]
        },
        speed: {
          selected: 1,
          options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
        },
        keyboard: {
          focused: true,
          global: true
        },
        tooltips: {
          controls: true,
          seek: true
        },
        storage: {
          enabled: true,
          key: 'discovery-player'
        }
      });

      // Event listeners
      player.on('ready', () => {
        setPlayerReady(true);
        setLoading(false);
        onReady?.();
        console.log('Advanced player ready');
      });

      player.on('error', (event) => {
        console.error('Player error:', event);
        handlePlayerError(event);
      });

      player.on('loadstart', () => {
        setLoading(true);
        setError(null);
      });

      player.on('canplay', () => {
        setLoading(false);
        detectAudioTracks();
        detectSubtitleTracks();
      });

      player.on('qualitychange', (event) => {
        console.log('Quality changed:', event.detail);
      });

      playerRef.current = player;

    } catch (error) {
      console.error('Failed to initialize player:', error);
      setError('Failed to initialize video player');
      setLoading(false);
    }
  };

  const loadSource = async (source: DownloadUrl) => {
    if (!videoRef.current || !playerRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const sourceUrl = source.url;
      const format = source.format.toLowerCase();

      // Clean up previous HLS instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      // Handle different source types
      if (format === 'm3u8' || sourceUrl.includes('.m3u8')) {
        await loadHLSSource(sourceUrl);
      } else if (format === 'mpd' || sourceUrl.includes('.mpd')) {
        await loadDASHSource(sourceUrl);
      } else {
        await loadDirectSource(sourceUrl, format);
      }

    } catch (error) {
      console.error('Error loading source:', error);
      handleSourceError(error);
    }
  };

  const loadHLSSource = async (url: string) => {
    if (!videoRef.current || !isClient) return;

    const { default: Hls } = await import('hls.js');

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90
      });

      hls.loadSource(url);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed');
        setLoading(false);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        if (data.fatal) {
          handleSourceError(new Error(`HLS Error: ${data.details}`));
        }
      });

      hlsRef.current = hls;
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      videoRef.current.src = url;
    } else {
      throw new Error('HLS not supported');
    }
  };

  const loadDASHSource = async (url: string) => {
    // For DASH support, we would need dash.js
    // For now, try direct loading
    await loadDirectSource(url, 'mpd');
  };

  const loadDirectSource = async (url: string, format: string) => {
    if (!videoRef.current) return;

    const mimeType = getMimeType(format);
    
    // Check if browser can play this format
    const canPlay = videoRef.current.canPlayType(mimeType);

    // canPlayType returns: "" (no), "maybe", or "probably"
    if (canPlay === '') {
      throw new Error(`Format ${format.toUpperCase()} not supported by browser`);
    }

    videoRef.current.src = url;
  };

  const getMimeType = (format: string): string => {
    const mimeTypes: Record<string, string> = {
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'ogg': 'video/ogg',
      'avi': 'video/x-msvideo',
      'mkv': 'video/x-matroska',
      'mov': 'video/quicktime',
      'wmv': 'video/x-ms-wmv',
      'flv': 'video/x-flv',
      'm4v': 'video/x-m4v'
    };
    
    return mimeTypes[format] || 'video/mp4';
  };

  const detectAudioTracks = () => {
    if (!videoRef.current) return;

    const video = videoRef.current as HTMLVideoElement & { audioTracks?: unknown };
    const tracks: AudioTrack[] = [];

    // Check for audio tracks (not widely supported yet)
    if (video.audioTracks) {
      for (let i = 0; i < video.audioTracks.length; i++) {
        const track = video.audioTracks[i];
        tracks.push({
          id: track.id || i.toString(),
          label: track.label || `Audio Track ${i + 1}`,
          language: track.language || 'unknown'
        });
      }
    }

    setAudioTracks(tracks);
  };

  const detectSubtitleTracks = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const tracks: SubtitleTrack[] = [];

    // Check for text tracks (subtitles/captions)
    if (video.textTracks) {
      for (let i = 0; i < video.textTracks.length; i++) {
        const track = video.textTracks[i];
        if (track.kind === 'subtitles' || track.kind === 'captions') {
          tracks.push({
            label: track.label || `Subtitle ${i + 1}`,
            language: track.language || 'unknown',
            src: '', // Would need to be provided separately
            default: track.mode === 'showing'
          });
        }
      }
    }

    setSubtitleTracks(tracks);
  };

  const handlePlayerError = (event: any) => {
    const video = videoRef.current;
    if (!video) return;

    let errorMessage = 'Unknown playback error';

    if (video.error) {
      switch (video.error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = 'Video playback was aborted';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'Network error occurred while loading video';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = 'Video format is not supported or file is corrupted';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Video format is not supported by this browser';
          break;
        default:
          errorMessage = video.error.message || 'Unknown video error';
      }
    }

    setError(errorMessage);
    setLoading(false);
  };

  const handleSourceError = (error: any) => {
    console.error('Source error:', error);
    setError(error.message || 'Failed to load video source');
    setLoading(false);
  };

  const cleanup = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
  };

  const handleSourceChange = (index: number) => {
    setCurrentSource(index);
  };

  const handleAudioTrackChange = (trackId: string) => {
    if (!videoRef.current) return;

    const video = videoRef.current as any; // Type assertion for audioTracks
    if (!video.audioTracks) return;

    for (let i = 0; i < video.audioTracks.length; i++) {
      const track = video.audioTracks[i];
      track.enabled = track.id === trackId || i.toString() === trackId;
    }
  };

  // Show loading state during SSR or while client libraries load
  if (!isClient) {
    return (
      <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="w-8 h-8 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm">Loading advanced player...</p>
        </div>
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-lg font-medium">No video sources available</p>
          <p className="text-sm">This movie doesn't have any playable video links.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quality and Track Selectors */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Quality Selector */}
        {sources.length > 1 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-gray-300 text-sm font-medium">Quality:</span>
            {sources.map((source, index) => (
              <button
                key={index}
                onClick={() => handleSourceChange(index)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  index === currentSource
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {source.quality} {source.format.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {/* Audio Track Selector */}
        {audioTracks.length > 1 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-gray-300 text-sm font-medium">Audio:</span>
            <select
              onChange={(e) => handleAudioTrackChange(e.target.value)}
              className="bg-gray-700 text-gray-300 text-sm rounded px-2 py-1 border border-gray-600"
            >
              {audioTracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.label} ({track.language})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Video Player */}
      <div className="relative">
        <video
          ref={videoRef}
          className="w-full aspect-video bg-black rounded-lg"
          poster={poster}
          preload="metadata"
          crossOrigin="anonymous"
        />

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="text-center text-white">
              <div className="w-8 h-8 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm">Loading video...</p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center rounded-lg">
            <div className="text-center text-white p-6 max-w-md">
              <div className="mb-4">
                <svg className="w-12 h-12 mx-auto text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-lg font-medium mb-2">Playback Error</p>
              <p className="text-sm text-gray-300 mb-4">{error}</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                {sources.length > 1 && (
                  <button
                    onClick={() => {
                      const nextSource = (currentSource + 1) % sources.length;
                      handleSourceChange(nextSource);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Try Next Quality
                  </button>
                )}
                <button
                  onClick={() => setError(null)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Current Source Info */}
      <div className="text-sm text-gray-400">
        <p>
          Playing: <span className="text-white">{sources[currentSource]?.quality} {sources[currentSource]?.format.toUpperCase()}</span>
          {sources[currentSource]?.label && (
            <span> - {sources[currentSource].label}</span>
          )}
        </p>
        {audioTracks.length > 0 && (
          <p className="mt-1">
            Audio tracks: <span className="text-white">{audioTracks.length}</span>
          </p>
        )}
        {subtitleTracks.length > 0 && (
          <p className="mt-1">
            Subtitle tracks: <span className="text-white">{subtitleTracks.length}</span>
          </p>
        )}
      </div>
    </div>
  );
}
