'use client';

import { useEffect, useRef, useState } from 'react';
import { DownloadUrl } from '@/types/movie';
import { analyzeMKVSource } from '@/utils/mkvDetector';
import { getProxiedSources, getProxiedVideoUrl } from '@/utils/videoProxy';
import DownloadOnlyPlayer from './DownloadOnlyPlayer';
import MKVPlayer from './MKVPlayer';
import VideoDebugPanel from './VideoDebugPanel';
import UniversalVideoPlayer from './UniversalVideoPlayer';
import DirectVideoTest from './DirectVideoTest';

interface ReliableVideoPlayerProps {
  sources: DownloadUrl[];
  poster?: string;
  title?: string;
  onReady?: () => void;
  onDownload: (url: string, filename?: string) => void;
}

export default function ReliableVideoPlayer({ sources, poster, title, onReady, onDownload }: ReliableVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentSource, setCurrentSource] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [canPlay, setCanPlay] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [hasMKVSources, setHasMKVSources] = useState(false);
  const [useMKVPlayer, setUseMKVPlayer] = useState(false);
  const [proxiedSources, setProxiedSources] = useState<DownloadUrl[]>([]);
  const [forceStreaming, setForceStreaming] = useState(false);
  const [useUniversalPlayer, setUseUniversalPlayer] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && sources.length > 0) {
      // Convert sources to use proxy URLs for better CORS handling
      const proxied = getProxiedSources(sources);
      setProxiedSources(proxied);
      analyzeSources();
      checkPlayability();
    }
  }, [isClient, sources, currentSource]);

  const analyzeSources = () => {
    // Check if any sources are MKV files
    const mkvSources = sources.filter(source => {
      const analysis = analyzeMKVSource(source);
      return analysis.isMKV;
    });

    setHasMKVSources(mkvSources.length > 0);

    // If current source is MKV, auto-enable Universal player (better fallback support)
    if (sources[currentSource]) {
      const currentAnalysis = analyzeMKVSource(sources[currentSource]);
      if (currentAnalysis.isMKV) {
        setUseUniversalPlayer(true);
      }
    }
  };

  const checkPlayability = () => {
    if (!videoRef.current || !sources[currentSource]) return;

    const source = sources[currentSource];
    const mimeType = getMimeType(source.format);

    // Check if browser can play this format
    const playability = videoRef.current.canPlayType(mimeType);

    console.log('Playability check:', {
      source: source,
      mimeType: mimeType,
      playability: playability,
      format: source.format
    });

    // For MKV files, try to play even if browser says "maybe" or ""
    // The proxy might help with compatibility
    if (playability === 'probably' || playability === 'maybe' ||
        (source.format.toLowerCase() === 'mkv' && playability !== 'no')) {
      setCanPlay(true);
      loadSource(source);
    } else {
      console.log('Format not supported, falling back to download-only');
      setCanPlay(false);
      setLoading(false);
    }
  };

  const loadSource = (source: DownloadUrl) => {
    if (!videoRef.current) return;

    setLoading(true);
    setError(null);

    // Test both direct and proxied URLs
    const proxiedUrl = getProxiedVideoUrl(source.url);
    console.log('Loading video source:', {
      original: source.url,
      proxied: proxiedUrl,
      format: source.format
    });

    // Try direct URL first, then fallback to proxy if needed
    const urlToTry = source.url.includes('discoveryftp.net') ? proxiedUrl : source.url;

    videoRef.current.src = urlToTry;
    videoRef.current.load();

    // Test proxy connectivity
    fetch(proxiedUrl.replace(/\?.*/, '').replace('/proxy/video', '/health'))
      .then(response => {
        console.log('Backend connectivity test:', response.ok ? 'SUCCESS' : 'FAILED');
      })
      .catch(error => {
        console.error('Backend connectivity test failed:', error);
      });
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
    
    return mimeTypes[format.toLowerCase()] || 'video/mp4';
  };

  const handleLoadStart = () => {
    setLoading(true);
    setError(null);
  };

  const handleCanPlay = () => {
    setLoading(false);
    onReady?.();
  };

  const handleError = () => {
    const video = videoRef.current;
    if (!video) return;

    let errorMessage = 'Unknown playback error';

    if (video.error) {
      console.error('Video error details:', {
        code: video.error.code,
        message: video.error.message,
        src: video.src,
        currentSource: sources[currentSource]
      });

      // If proxy failed and we're using a proxied URL, try direct URL
      if (video.src.includes('/proxy/video') && sources[currentSource]) {
        console.log('Proxy failed, trying direct URL...');
        video.src = sources[currentSource].url;
        video.load();
        return; // Don't set error yet, give direct URL a chance
      }

      switch (video.error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = 'Video playback was aborted';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'Network error occurred while loading video. This may be due to CORS restrictions or authentication issues.';
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

  const handleSourceChange = (index: number) => {
    setCurrentSource(index);
  };

  const getCompatibleSources = () => {
    if (!videoRef.current) return [];

    return proxiedSources.filter(source => {
      const mimeType = getMimeType(source.format);
      const playability = videoRef.current!.canPlayType(mimeType);
      return playability === 'probably' || playability === 'maybe';
    });
  };

  // Show loading state during SSR
  if (!isClient) {
    return (
      <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="w-8 h-8 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm">Initializing player...</p>
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

  const compatibleSources = getCompatibleSources();

  // If using universal player (better for MKV)
  if (useUniversalPlayer) {
    return (
      <UniversalVideoPlayer
        sources={proxiedSources.length > 0 ? proxiedSources : sources}
        poster={poster}
        title={title}
        onReady={onReady}
        onDownload={onDownload}
      />
    );
  }

  // If current source is MKV, use specialized MKV player
  if (useMKVPlayer) {
    return (
      <MKVPlayer
        sources={proxiedSources.length > 0 ? proxiedSources : sources}
        poster={poster}
        title={title}
        onReady={onReady}
        onDownload={onDownload}
      />
    );
  }

  // If no compatible sources, show download-only player
  // But first try to play anyway - the proxy might help with compatibility
  const shouldTryPlayback = sources.some(source =>
    ['mp4', 'webm', 'mkv'].includes(source.format.toLowerCase())
  );

  if (!canPlay && !shouldTryPlayback && !forceStreaming) {
    return (
      <DownloadOnlyPlayer
        sources={proxiedSources.length > 0 ? proxiedSources : sources}
        poster={poster}
        title={title}
        onDownload={onDownload}
        onTryStreaming={() => {
          console.log('Force streaming attempt...');
          setForceStreaming(true);
          setCanPlay(true);
          if (sources[currentSource]) {
            loadSource(sources[currentSource]);
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* MKV Enhancement Banner */}
      {hasMKVSources && !useMKVPlayer && !useUniversalPlayer && (
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🎬</div>
              <div>
                <h4 className="text-blue-300 font-medium">MKV Files Detected</h4>
                <p className="text-blue-200 text-sm">
                  Switch to MKV Player for better compatibility and external player support
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setUseUniversalPlayer(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Universal Player
              </button>
              <button
                onClick={() => setUseMKVPlayer(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                MKV Player
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quality Selector */}
      {(proxiedSources.length > 1 || sources.length > 1) && (
        <div className="flex flex-wrap gap-2">
          <span className="text-gray-300 text-sm font-medium">Quality:</span>
          {(proxiedSources.length > 0 ? proxiedSources : sources).map((source, index) => {
            const mimeType = getMimeType(source.format);
            const playability = videoRef.current?.canPlayType(mimeType) || '';
            const isCompatible = playability === 'probably' || playability === 'maybe';
            const isMKV = analyzeMKVSource(source).isMKV;

            return (
              <button
                key={index}
                onClick={() => handleSourceChange(index)}
                disabled={!isCompatible && !isMKV}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  index === currentSource
                    ? 'bg-blue-600 text-white'
                    : isCompatible || isMKV
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
                title={
                  isMKV ? `${source.quality} ${source.format} (MKV - Use MKV Player for best experience)` :
                  isCompatible ? `${source.quality} ${source.format}` : 'Format not supported'
                }
              >
                {isMKV && '🎬 '}
                {source.quality} {source.format.toUpperCase()}
                {!isCompatible && !isMKV && ' ❌'}
              </button>
            );
          })}
        </div>
      )}

      {/* Video Player */}
      <div className="relative">
        <video
          ref={videoRef}
          className="w-full aspect-video bg-black rounded-lg"
          controls
          poster={poster}
          preload="metadata"
          onLoadStart={handleLoadStart}
          onCanPlay={handleCanPlay}
          onError={handleError}
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
          Playing: <span className="text-white">{(proxiedSources[currentSource] || sources[currentSource])?.quality} {(proxiedSources[currentSource] || sources[currentSource])?.format.toUpperCase()}</span>
          {(proxiedSources[currentSource] || sources[currentSource])?.label && (
            <span> - {(proxiedSources[currentSource] || sources[currentSource]).label}</span>
          )}
        </p>
        <p className="mt-1">
          Compatible formats: <span className="text-white">{compatibleSources.length}</span> of {proxiedSources.length > 0 ? proxiedSources.length : sources.length}
        </p>
        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-gray-500">Debug Info</summary>
            <div className="mt-1 text-xs text-gray-500 space-y-1">
              <p>Original URL: {sources[currentSource]?.url}</p>
              <p>Proxied URL: {getProxiedVideoUrl(sources[currentSource]?.url || '')}</p>
              <p>Current Video Src: {videoRef.current?.src}</p>
              <p>Video Ready State: {videoRef.current?.readyState}</p>
              <p>Video Network State: {videoRef.current?.networkState}</p>
            </div>
          </details>
        )}
      </div>

      {/* Debug Panel */}
      <VideoDebugPanel sources={sources} />

      {/* Direct Video Test */}
      <DirectVideoTest sources={sources} />
    </div>
  );
}
