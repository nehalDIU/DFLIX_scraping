'use client';

import { useEffect, useRef, useState } from 'react';
import { DownloadUrl } from '@/types/movie';
import { getProxiedVideoUrl } from '@/utils/videoProxy';
import { Play, Download, ExternalLink, AlertCircle } from 'lucide-react';

interface UniversalVideoPlayerProps {
  sources: DownloadUrl[];
  poster?: string;
  title?: string;
  onReady?: () => void;
  onDownload: (url: string, filename?: string) => void;
}

export default function UniversalVideoPlayer({ sources, poster, title, onReady, onDownload }: UniversalVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentSource, setCurrentSource] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playbackAttempted, setPlaybackAttempted] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    if (sources.length > 0) {
      attemptPlayback(sources[currentSource]);
    }
  }, [sources, currentSource]);

  const getMimeType = (format: string): string => {
    const formatMap: { [key: string]: string } = {
      'mp4': 'video/mp4',
      'mkv': 'video/x-matroska',
      'webm': 'video/webm',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'wmv': 'video/x-ms-wmv',
      'm4v': 'video/x-m4v',
      'flv': 'video/x-flv',
      'ogg': 'video/ogg'
    };
    return formatMap[format.toLowerCase()] || 'video/mp4';
  };

  const attemptPlayback = async (source: DownloadUrl) => {
    if (!videoRef.current || !source) return;

    setLoading(true);
    setError(null);
    setPlaybackAttempted(true);

    try {
      const mimeType = getMimeType(source.format);
      const canPlay = videoRef.current.canPlayType(mimeType);
      
      console.log('Universal player attempting playback:', {
        source: source.url,
        format: source.format,
        mimeType,
        canPlay
      });

      // For MKV files, always try playback regardless of browser support
      // The proxy might help with compatibility
      const isMKV = source.format.toLowerCase() === 'mkv';

      // Always attempt playback for MKV files, even if browser says it can't play them
      if (!isMKV && canPlay === '' && canPlay !== 'maybe' && canPlay !== 'probably') {
        console.log('Format not supported and not MKV, showing fallback immediately');
        setShowFallback(true);
        setLoading(false);
        return;
      }

      console.log(`Attempting playback for ${isMKV ? 'MKV' : source.format} file (canPlay: "${canPlay}")`);

      // Try proxied URL first
      const proxiedUrl = getProxiedVideoUrl(source.url);
      
      // Set up video element
      videoRef.current.src = proxiedUrl;
      
      // Add event listeners
      const handleCanPlay = () => {
        console.log('Video can play - success!');
        setLoading(false);
        setError(null);
        setShowFallback(false);
        onReady?.();
      };

      const handleLoadedData = () => {
        console.log('Video data loaded successfully');
        setLoading(false);
        setError(null);
        setShowFallback(false);
      };

      const handleError = (e: any) => {
        const videoError = e.target?.error;

        // If error is null, undefined, or empty object, it's a false positive
        if (!videoError || (typeof videoError === 'object' && Object.keys(videoError).length === 0)) {
          console.log('Video error event fired but no actual error object - ignoring false positive');

          // Check if video is actually working despite the error event
          if (videoRef.current && videoRef.current.readyState >= 2) {
            console.log('Video appears to be loading successfully despite error event');
            setLoading(false);
            setError(null);
            onReady?.();
          }
          return;
        }

        console.error('Video error details:', {
          error: videoError,
          code: videoError?.code,
          message: videoError?.message,
          src: videoRef.current?.src,
          networkState: videoRef.current?.networkState,
          readyState: videoRef.current?.readyState,
          currentTime: videoRef.current?.currentTime,
          duration: videoRef.current?.duration
        });

        // Try direct URL if proxy failed and we haven't tried it yet
        if (videoRef.current && videoRef.current.src.includes('/proxy/video')) {
          console.log('Proxy URL failed, trying direct URL...');
          videoRef.current.src = source.url;
          videoRef.current.load();
          return;
        }

        // If both failed, show fallback options
        let errorMessage = 'Playback failed';
        if (videoError && videoError.code) {
          switch (videoError.code) {
            case MediaError.MEDIA_ERR_ABORTED:
              errorMessage = 'Video loading was aborted';
              break;
            case MediaError.MEDIA_ERR_NETWORK:
              errorMessage = 'Network error while loading video';
              break;
            case MediaError.MEDIA_ERR_DECODE:
              errorMessage = 'Video format not supported or corrupted';
              break;
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMessage = 'Video format not supported by browser';
              break;
            default:
              errorMessage = videoError.message || `Video error (code: ${videoError.code})`;
          }
        } else {
          errorMessage = 'Unknown video error - try external player';
        }

        setError(errorMessage);
        setLoading(false);
        setShowFallback(true);
      };

      const handleLoadStart = () => {
        console.log('Video load started');
      };

      // Clean up existing listeners
      const video = videoRef.current;
      const cleanupListeners = () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
        video.removeEventListener('loadstart', handleLoadStart);
      };

      cleanupListeners();

      // Add new listeners
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('error', handleError);
      video.addEventListener('loadstart', handleLoadStart);

      // Start loading
      video.load();

      // Periodic check to see if video is loading despite missing events
      const checkInterval = setInterval(() => {
        if (videoRef.current && loading) {
          const readyState = videoRef.current.readyState;
          const networkState = videoRef.current.networkState;

          console.log('Video loading check:', {
            readyState,
            networkState,
            currentTime: videoRef.current.currentTime,
            duration: videoRef.current.duration,
            buffered: videoRef.current.buffered.length
          });

          // If video has loaded enough data, consider it successful
          if (readyState >= 2) { // HAVE_CURRENT_DATA or higher
            console.log('Video loaded successfully (detected via polling)');
            setLoading(false);
            setError(null);
            setShowFallback(false);
            onReady?.();
            clearInterval(checkInterval);
          }
        }
      }, 1000); // Check every second

      // Timeout fallback - reduced since proxy is working
      const timeoutId = setTimeout(() => {
        if (loading && !error && !showFallback) {
          console.log('Playback timeout, showing fallback options');
          setShowFallback(true);
          setLoading(false);
        }
        clearInterval(checkInterval);
      }, 10000); // 10 second timeout

      // Cleanup function
      return () => {
        clearTimeout(timeoutId);
        clearInterval(checkInterval);
        if (video) {
          video.removeEventListener('canplay', handleCanPlay);
          video.removeEventListener('loadeddata', handleLoadedData);
          video.removeEventListener('error', handleError);
          video.removeEventListener('loadstart', handleLoadStart);
        }
      };

    } catch (err) {
      console.error('Playback attempt failed:', err);
      setError(`Failed to load video: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
      setShowFallback(true);
    }
  };

  const launchExternalPlayer = (playerName: string) => {
    const source = sources[currentSource];
    if (!source) return;

    const url = source.url;
    let playerUrl = '';

    switch (playerName.toLowerCase()) {
      case 'vlc':
        playerUrl = `vlc://${url}`;
        break;
      case 'potplayer':
        playerUrl = `potplayer://${url}`;
        break;
      case 'mpc-hc':
        playerUrl = `mpc-hc://${url}`;
        break;
      default:
        // Fallback: copy URL to clipboard
        navigator.clipboard?.writeText(url);
        alert('Video URL copied to clipboard. Paste it into your preferred video player.');
        return;
    }

    // Try to open in external player
    const link = document.createElement('a');
    link.href = playerUrl;
    link.click();
  };

  if (showFallback || (error && playbackAttempted)) {
    return (
      <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden border border-gray-700">
        <div className="relative h-full">
          {/* Background */}
          {poster && (
            <div className="absolute inset-0">
              <img 
                src={poster} 
                alt={title}
                className="w-full h-full object-cover opacity-20"
              />
            </div>
          )}

          {/* Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white p-6 max-w-md">
              <AlertCircle className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Playback Options</h3>
              <p className="text-gray-300 text-sm mb-4">
                {error || 'Browser playback may not be supported for this format. Try these alternatives:'}
              </p>

              {/* Debug info in development */}
              {process.env.NODE_ENV === 'development' && (
                <details className="mb-4 text-left">
                  <summary className="text-xs text-gray-400 cursor-pointer">Debug Info</summary>
                  <div className="mt-2 text-xs text-gray-500 space-y-1">
                    <p>Source: {sources[currentSource]?.url}</p>
                    <p>Format: {sources[currentSource]?.format}</p>
                    <p>Proxied: {getProxiedVideoUrl(sources[currentSource]?.url || '')}</p>
                    <p>Error: {error}</p>
                  </div>
                </details>
              )}

              {/* External Players */}
              <div className="space-y-3 mb-6">
                <h4 className="text-sm font-medium text-gray-300">Launch in External Player:</h4>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['VLC', 'PotPlayer', 'MPC-HC'].map((player) => (
                    <button
                      key={player}
                      onClick={() => launchExternalPlayer(player)}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {player}
                    </button>
                  ))}
                </div>
              </div>

              {/* Download Option */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-300">Or Download:</h4>
                <div className="space-y-2">
                  {sources.map((source, index) => (
                    <button
                      key={index}
                      onClick={() => onDownload(source.url, `${title}_${source.quality}.${source.format.toLowerCase()}`)}
                      className="flex items-center justify-between bg-gray-700 hover:bg-gray-600 rounded-lg p-3 w-full transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Download className="w-4 h-4 text-blue-400" />
                        <div className="text-left">
                          <div className="text-sm font-medium">{source.quality} {source.format.toUpperCase()}</div>
                          <div className="text-xs text-gray-400">{source.label || 'Download'}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Retry Button */}
              <button
                onClick={() => {
                  setShowFallback(false);
                  setError(null);
                  setPlaybackAttempted(false);
                  attemptPlayback(sources[currentSource]);
                }}
                className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden border border-gray-700 relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-10">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading video...</p>
            <p className="text-sm text-gray-400 mt-2">
              Format: {sources[currentSource]?.format.toUpperCase()} | Quality: {sources[currentSource]?.quality}
            </p>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        poster={poster}
        preload="metadata"
      >
        Your browser does not support the video tag.
      </video>

      {/* Quality Selector */}
      {sources.length > 1 && (
        <div className="absolute bottom-4 right-4 z-20">
          <select
            value={currentSource}
            onChange={(e) => setCurrentSource(parseInt(e.target.value))}
            className="bg-black bg-opacity-75 text-white text-sm rounded px-2 py-1 border border-gray-600"
          >
            {sources.map((source, index) => (
              <option key={index} value={index}>
                {source.quality} {source.format.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
