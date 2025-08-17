'use client';

import { useEffect, useRef, useState } from 'react';
import { DownloadUrl } from '@/types/movie';
import {
  analyzeMKVSource,
  checkNativeMKVSupport,
  launchInExternalPlayer,
  MKVAnalysis,
  MKVCapabilities,
  ExternalPlayer
} from '@/utils/mkvDetector';
import {
  analyzeMKVError,
  getErrorDisplayMessage,
  getRecommendedAction,
  isRecoverableError,
  MKVError
} from '@/utils/mkvErrorHandler';
import { getProxiedSources, getProxiedVideoUrl } from '@/utils/videoProxy';

interface MKVPlayerProps {
  sources: DownloadUrl[];
  poster?: string;
  title?: string;
  onReady?: () => void;
  onDownload: (url: string, filename?: string) => void;
}

export default function MKVPlayer({ sources, poster, title, onReady, onDownload }: MKVPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [currentSource, setCurrentSource] = useState(0);
  const [mkvAnalysis, setMkvAnalysis] = useState<MKVAnalysis | null>(null);
  const [capabilities, setCapabilities] = useState<MKVCapabilities | null>(null);
  const [playbackMode, setPlaybackMode] = useState<'native' | 'external' | 'download'>('download');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mkvError, setMkvError] = useState<MKVError | null>(null);
  const [showExternalPlayers, setShowExternalPlayers] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && sources.length > 0) {
      analyzeCurrentSource();
    }
  }, [isClient, sources, currentSource]);

  const analyzeCurrentSource = async () => {
    if (!sources[currentSource]) return;

    setLoading(true);
    setError(null);

    const source = sources[currentSource];
    const analysis = analyzeMKVSource(source);
    const caps = checkNativeMKVSupport();

    setMkvAnalysis(analysis);
    setCapabilities(caps);

    // Determine best playback mode
    if (analysis.isMKV) {
      if (caps.canPlayNatively && caps.browserSupport === 'full') {
        setPlaybackMode('native');
        await testNativePlayback(source);
      } else if (caps.externalPlayers.length > 0) {
        setPlaybackMode('external');
        setLoading(false);
      } else {
        setPlaybackMode('download');
        setLoading(false);
      }
    } else {
      // Not an MKV file, try native playback
      setPlaybackMode('native');
      await testNativePlayback(source);
    }
  };

  const testNativePlayback = async (source: DownloadUrl) => {
    if (!videoRef.current) {
      setLoading(false);
      return;
    }

    try {
      const mimeType = getMimeType(source.format);
      const canPlay = videoRef.current.canPlayType(mimeType);

      console.log('MKV playability check:', {
        source: source.url,
        mimeType,
        canPlay,
        format: source.format
      });

      // For MKV files, try playback even if browser says it might not work
      // The proxy and proper headers might make it work
      if (canPlay === 'probably' || canPlay === 'maybe' ||
          (source.format.toLowerCase() === 'mkv' && canPlay !== 'no')) {

        // Use proxied URL for better CORS handling
        const proxiedUrl = getProxiedVideoUrl(source.url);
        console.log('Attempting MKV playback with proxied URL:', proxiedUrl);

        videoRef.current.src = proxiedUrl;
        videoRef.current.load(); // Force load
        setLoading(false);
        onReady?.();
      } else {
        throw new Error(`Format ${source.format.toUpperCase()} not supported natively (canPlay: ${canPlay})`);
      }
    } catch (err) {
      console.error('Native playback test failed:', err);
      const mkvErr = analyzeMKVError(err, { source, playbackMode: 'native' });
      setMkvError(mkvErr);
      setError(getErrorDisplayMessage(mkvErr));

      // Auto-suggest best fallback
      const recommendedAction = getRecommendedAction(mkvErr);
      if (recommendedAction?.type === 'external') {
        setPlaybackMode('external');
      } else if (recommendedAction?.type === 'download') {
        setPlaybackMode('download');
      }

      setLoading(false);
    }
  };

  const getMimeType = (format: string): string => {
    const mimeTypes: Record<string, string> = {
      'mkv': 'video/x-matroska',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'ogg': 'video/ogg',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime'
    };
    return mimeTypes[format.toLowerCase()] || 'video/x-matroska';
  };

  const handleExternalPlayerLaunch = async (player: ExternalPlayer) => {
    const source = sources[currentSource];
    setLoading(true);

    try {
      const success = await launchInExternalPlayer(source, player.id);
      
      if (success) {
        setError(null);
        setMkvError(null);
        // Show success message
        setError(`✅ Launched in ${player.name} successfully!`);
        setTimeout(() => setError(null), 3000);
      } else {
        const mkvErr = analyzeMKVError(
          new Error('External player launch failed'),
          { player, source: sources[currentSource] }
        );
        setMkvError(mkvErr);
        setError(getErrorDisplayMessage(mkvErr));
      }
    } catch (err) {
      const mkvErr = analyzeMKVError(err, { player, source: sources[currentSource] });
      setMkvError(mkvErr);
      setError(getErrorDisplayMessage(mkvErr));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const source = sources[currentSource];
    const filename = `${title || 'video'}.${source.format}`;
    onDownload(source.url, filename);
  };

  const handleSourceChange = (index: number) => {
    setCurrentSource(index);
  };

  const handleModeChange = (mode: 'native' | 'external' | 'download') => {
    setPlaybackMode(mode);
    setError(null);
    setMkvError(null);

    if (mode === 'native') {
      testNativePlayback(sources[currentSource]);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    setMkvError(null);

    if (playbackMode === 'native') {
      testNativePlayback(sources[currentSource]);
    } else {
      analyzeCurrentSource();
    }
  };

  // Show loading state during SSR
  if (!isClient) {
    return (
      <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="w-8 h-8 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm">Initializing MKV player...</p>
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

  const currentSourceData = sources[currentSource];
  const isCurrentMKV = mkvAnalysis?.isMKV || false;

  return (
    <div className="space-y-4">
      {/* MKV Info Banner */}
      {isCurrentMKV && mkvAnalysis && (
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-2xl">🎬</div>
            <div>
              <h4 className="text-blue-300 font-medium">MKV Video Detected</h4>
              <p className="text-blue-200 text-sm">
                High-quality video with {mkvAnalysis.estimatedCodecs.join(', ')} codecs
                {mkvAnalysis.hasSubtitles && ' • Includes subtitles'}
              </p>
            </div>
          </div>
          
          {capabilities && (
            <div className="text-xs text-blue-200">
              Browser support: <span className="capitalize font-medium">{capabilities.browserSupport}</span>
              {capabilities.supportedCodecs.length > 0 && (
                <span> • Supported codecs: {capabilities.supportedCodecs.join(', ')}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Playback Mode Selector */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h4 className="text-white font-medium text-sm mb-1">
              Playback Mode: {playbackMode === 'native' ? '🎥 Browser Player' : 
                            playbackMode === 'external' ? '📱 External Player' : '⬇️ Download'}
            </h4>
            <p className="text-gray-400 text-xs">
              {playbackMode === 'native' && 'Playing directly in your browser'}
              {playbackMode === 'external' && 'Launch in installed media player for best experience'}
              {playbackMode === 'download' && 'Download file to play with your preferred media player'}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {capabilities?.canPlayNatively && (
              <button
                onClick={() => handleModeChange('native')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  playbackMode === 'native'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                🎥 Browser
              </button>
            )}
            
            {capabilities?.externalPlayers && capabilities.externalPlayers.length > 0 && (
              <button
                onClick={() => handleModeChange('external')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  playbackMode === 'external'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                📱 External
              </button>
            )}
            
            <button
              onClick={() => handleModeChange('download')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                playbackMode === 'download'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              ⬇️ Download
            </button>
          </div>
        </div>
      </div>

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

      {/* Player Content */}
      <div className="relative">
        {playbackMode === 'native' && (
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full aspect-video bg-black rounded-lg"
              controls
              poster={poster}
              preload="metadata"
              onLoadStart={() => setLoading(true)}
              onCanPlay={() => setLoading(false)}
              onError={(e) => {
                console.error('Video error:', e);
                setError('Failed to load video. Try external player or download.');
                setLoading(false);
              }}
            />

            {loading && (
              <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center rounded-lg">
                <div className="text-center text-white">
                  <div className="w-8 h-8 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm">Loading video...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {playbackMode === 'external' && capabilities?.externalPlayers && (
          <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
            <div className="text-center p-6 max-w-md">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-white text-lg font-medium mb-2">Launch External Player</h3>
              <p className="text-gray-300 text-sm mb-6">
                Choose your preferred media player for the best MKV experience:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {capabilities.externalPlayers.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handleExternalPlayerLaunch(player)}
                    disabled={loading}
                    className="bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg p-3 text-left transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{player.icon}</span>
                      <div>
                        <div className="text-white text-sm font-medium">{player.name}</div>
                        <div className="text-gray-400 text-xs">{player.description.split(' ').slice(0, 4).join(' ')}...</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="mt-4 text-xs text-gray-400">
                Don't have these players? 
                <button 
                  onClick={() => setShowExternalPlayers(!showExternalPlayers)}
                  className="text-blue-400 hover:text-blue-300 ml-1"
                >
                  Download links
                </button>
              </div>
              
              {showExternalPlayers && (
                <div className="mt-3 p-3 bg-gray-800 rounded border text-xs">
                  {capabilities.externalPlayers.map((player) => (
                    <div key={player.id} className="flex justify-between items-center py-1">
                      <span className="text-gray-300">{player.name}</span>
                      <a 
                        href={player.downloadUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {playbackMode === 'download' && (
          <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
            <div className="text-center p-6">
              <div className="text-4xl mb-4">⬇️</div>
              <h3 className="text-white text-lg font-medium mb-2">Download to Watch</h3>
              <p className="text-gray-300 text-sm mb-6">
                This {isCurrentMKV ? 'MKV' : currentSourceData.format.toUpperCase()} file is available for download. 
                Choose your preferred quality below.
              </p>
              
              <button
                onClick={handleDownload}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Download {currentSourceData.quality} {currentSourceData.format.toUpperCase()}
              </button>
              
              {isCurrentMKV && (
                <p className="text-xs text-gray-400 mt-3">
                  💡 Tip: Use VLC, PotPlayer, or MPC-HC for best MKV playback experience
                </p>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Error Overlay */}
        {error && (
          <div className="absolute inset-0 bg-black bg-opacity-95 flex items-center justify-center rounded-lg">
            <div className="text-center text-white p-6 max-w-lg">
              <div className="mb-4">
                {error.includes('successfully') || error.includes('✅') ? (
                  <div className="w-12 h-12 mx-auto text-green-400 text-4xl">✅</div>
                ) : (
                  <svg className="w-12 h-12 mx-auto text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                )}
              </div>

              <p className="text-lg font-medium mb-2">
                {error.includes('successfully') || error.includes('✅') ? 'Success!' :
                 mkvError?.severity === 'critical' ? 'Critical Error' :
                 mkvError?.severity === 'high' ? 'Playback Error' : 'Issue Detected'}
              </p>

              <p className="text-sm text-gray-300 mb-4">{error}</p>

              {/* Error-specific suggestions */}
              {mkvError && mkvError.suggestions.length > 0 && (
                <div className="mb-4 text-left">
                  <p className="text-sm font-medium text-gray-200 mb-2">Suggestions:</p>
                  <ul className="text-xs text-gray-300 space-y-1">
                    {mkvError.suggestions.slice(0, 3).map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                {mkvError && isRecoverableError(mkvError) && mkvError.canRetry && (
                  <button
                    onClick={handleRetry}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Retry ({retryCount + 1}/3)
                  </button>
                )}

                {mkvError?.fallbackOptions && mkvError.fallbackOptions.length > 0 && (
                  <button
                    onClick={() => {
                      const action = mkvError.fallbackOptions[0];
                      if (action.type === 'external') {
                        setPlaybackMode('external');
                      } else if (action.type === 'download') {
                        setPlaybackMode('download');
                      }
                      setError(null);
                      setMkvError(null);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {mkvError.fallbackOptions[0].label}
                  </button>
                )}

                <button
                  onClick={() => {
                    setError(null);
                    setMkvError(null);
                  }}
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
          Current: <span className="text-white">{currentSourceData.quality} {currentSourceData.format.toUpperCase()}</span>
          {currentSourceData.label && <span> - {currentSourceData.label}</span>}
        </p>
        {isCurrentMKV && mkvAnalysis && (
          <p className="mt-1">
            Codecs: <span className="text-white">{mkvAnalysis.estimatedCodecs.join(', ')}</span>
            {mkvAnalysis.hasSubtitles && <span className="text-green-400"> • Subtitles included</span>}
          </p>
        )}
      </div>
    </div>
  );
}
