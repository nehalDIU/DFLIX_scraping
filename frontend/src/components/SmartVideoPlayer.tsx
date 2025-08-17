'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { DownloadUrl } from '@/types/movie';

// Dynamically import video players to avoid SSR issues
const AdvancedVideoPlayer = dynamic(() => import('./AdvancedVideoPlayer'), { ssr: false });
const VideoPlayer = dynamic(() => import('./VideoPlayer'), { ssr: false });
const SimpleVideoPlayer = dynamic(() => import('./SimpleVideoPlayer'), { ssr: false });
const DownloadOnlyPlayer = dynamic(() => import('./DownloadOnlyPlayer'), { ssr: false });

interface SmartVideoPlayerProps {
  sources: DownloadUrl[];
  poster?: string;
  title?: string;
  onReady?: () => void;
  onDownload: (url: string, filename?: string) => void;
}

type PlayerType = 'advanced' | 'standard' | 'simple' | 'download';

interface PlayerCapability {
  type: PlayerType;
  score: number;
  reason: string;
}

export default function SmartVideoPlayer({ sources, poster, title, onReady, onDownload }: SmartVideoPlayerProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerType>('advanced');
  const [playerCapabilities, setPlayerCapabilities] = useState<PlayerCapability[]>([]);
  const [manualOverride, setManualOverride] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      analyzeSourcesAndSelectPlayer();
    }
  }, [sources, isClient]);

  const analyzeSourcesAndSelectPlayer = () => {
    if (sources.length === 0) {
      setSelectedPlayer('download');
      return;
    }

    const capabilities = analyzeSources(sources);
    setPlayerCapabilities(capabilities);

    // Select the best player automatically unless manually overridden
    if (!manualOverride) {
      const bestPlayer = capabilities.reduce((best, current) => 
        current.score > best.score ? current : best
      );
      setSelectedPlayer(bestPlayer.type);
    }
  };

  const analyzeSources = (sources: DownloadUrl[]): PlayerCapability[] => {
    const capabilities: PlayerCapability[] = [];

    // Analyze each source type and determine compatibility
    const hasStreamingSources = sources.some(isStreamingSource);
    const hasDirectVideoSources = sources.some(isDirectVideoSource);
    const hasBrowserCompatibleSources = sources.some(isBrowserCompatible);
    const hasAdvancedFormats = sources.some(isAdvancedFormat);

    // Advanced Player Capability
    let advancedScore = 0;
    let advancedReason = '';

    if (hasStreamingSources) {
      advancedScore += 40;
      advancedReason += 'HLS/DASH streaming support. ';
    }
    if (hasAdvancedFormats) {
      advancedScore += 30;
      advancedReason += 'Advanced format handling. ';
    }
    if (hasBrowserCompatibleSources) {
      advancedScore += 20;
      advancedReason += 'Browser-compatible formats. ';
    }
    if (sources.length > 1) {
      advancedScore += 10;
      advancedReason += 'Multiple quality options. ';
    }

    capabilities.push({
      type: 'advanced',
      score: advancedScore,
      reason: advancedReason || 'Advanced player with enhanced features'
    });

    // Standard Player Capability
    let standardScore = 0;
    let standardReason = '';

    if (hasBrowserCompatibleSources) {
      standardScore += 30;
      standardReason += 'Standard video formats. ';
    }
    if (hasStreamingSources) {
      standardScore += 20;
      standardReason += 'Basic streaming support. ';
    }
    if (!hasAdvancedFormats) {
      standardScore += 15;
      standardReason += 'No complex formats. ';
    }

    capabilities.push({
      type: 'standard',
      score: standardScore,
      reason: standardReason || 'Standard video player'
    });

    // Simple Player Capability
    let simpleScore = 0;
    let simpleReason = '';

    if (hasBrowserCompatibleSources && !hasAdvancedFormats) {
      simpleScore += 25;
      simpleReason += 'Simple compatible formats. ';
    }
    if (sources.length === 1) {
      simpleScore += 10;
      simpleReason += 'Single source. ';
    }

    capabilities.push({
      type: 'simple',
      score: simpleScore,
      reason: simpleReason || 'Basic video player'
    });

    // Download-Only Capability
    let downloadScore = 10; // Always available as fallback
    let downloadReason = 'Download-only fallback. ';

    if (!hasBrowserCompatibleSources) {
      downloadScore += 50;
      downloadReason += 'Incompatible formats detected. ';
    }
    if (sources.every(source => isDownloadOnlySource(source))) {
      downloadScore += 30;
      downloadReason += 'All sources are download-only. ';
    }

    capabilities.push({
      type: 'download',
      score: downloadScore,
      reason: downloadReason
    });

    return capabilities.sort((a, b) => b.score - a.score);
  };

  const isStreamingSource = (source: DownloadUrl): boolean => {
    const url = source.url.toLowerCase();
    const format = source.format.toLowerCase();
    
    return (
      format === 'm3u8' ||
      format === 'mpd' ||
      url.includes('.m3u8') ||
      url.includes('.mpd') ||
      url.includes('/stream/') ||
      url.includes('/play/') ||
      url.includes('streaming')
    );
  };

  const isDirectVideoSource = (source: DownloadUrl): boolean => {
    const format = source.format.toLowerCase();
    return ['mp4', 'webm', 'ogg', 'avi', 'mkv', 'mov'].includes(format);
  };

  const isBrowserCompatible = (source: DownloadUrl): boolean => {
    const format = source.format.toLowerCase();
    return ['mp4', 'webm', 'ogg'].includes(format);
  };

  const isAdvancedFormat = (source: DownloadUrl): boolean => {
    const format = source.format.toLowerCase();
    return ['mkv', 'avi', 'mov', 'wmv', 'flv', 'm4v'].includes(format);
  };

  const isDownloadOnlySource = (source: DownloadUrl): boolean => {
    const url = source.url.toLowerCase();
    return (
      url.includes('/download/') ||
      url.includes('/file/') ||
      url.includes('.torrent') ||
      (!isStreamingSource(source) && !isBrowserCompatible(source))
    );
  };

  const handlePlayerChange = (playerType: PlayerType) => {
    setSelectedPlayer(playerType);
    setManualOverride(true);
  };

  const renderPlayer = () => {
    const commonProps = {
      sources,
      poster,
      title,
      onReady
    };

    switch (selectedPlayer) {
      case 'advanced':
        return <AdvancedVideoPlayer {...commonProps} />;
      case 'standard':
        return <VideoPlayer {...commonProps} />;
      case 'simple':
        return <SimpleVideoPlayer {...commonProps} />;
      case 'download':
        return <DownloadOnlyPlayer {...commonProps} onDownload={onDownload} />;
      default:
        return <AdvancedVideoPlayer {...commonProps} />;
    }
  };

  const getPlayerDisplayName = (type: PlayerType): string => {
    switch (type) {
      case 'advanced': return 'Advanced Player';
      case 'standard': return 'Standard Player';
      case 'simple': return 'Simple Player';
      case 'download': return 'Download Only';
      default: return 'Unknown';
    }
  };

  const getPlayerIcon = (type: PlayerType): string => {
    switch (type) {
      case 'advanced': return '🚀';
      case 'standard': return '▶️';
      case 'simple': return '⏯️';
      case 'download': return '⬇️';
      default: return '❓';
    }
  };

  // Show loading state during SSR
  if (!isClient) {
    return (
      <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="w-8 h-8 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm">Loading smart player...</p>
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
      {/* Player Selection */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h4 className="text-white font-medium text-sm mb-1">
              Video Player: {getPlayerIcon(selectedPlayer)} {getPlayerDisplayName(selectedPlayer)}
            </h4>
            <p className="text-gray-400 text-xs">
              {playerCapabilities.find(p => p.type === selectedPlayer)?.reason || 'Auto-selected based on source analysis'}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {playerCapabilities.map((capability) => (
              <button
                key={capability.type}
                onClick={() => handlePlayerChange(capability.type)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  selectedPlayer === capability.type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title={capability.reason}
              >
                {getPlayerIcon(capability.type)} {getPlayerDisplayName(capability.type)}
                <span className="ml-1 text-xs opacity-75">({capability.score})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Player Component */}
      {renderPlayer()}

      {/* Source Analysis Info */}
      {process.env.NODE_ENV === 'development' && (
        <details className="bg-gray-800 rounded-lg p-4">
          <summary className="text-gray-300 text-sm cursor-pointer">
            Source Analysis (Development)
          </summary>
          <div className="mt-2 space-y-2 text-xs">
            {sources.map((source, index) => (
              <div key={index} className="bg-gray-700 rounded p-2">
                <div className="text-white font-medium">{source.quality} {source.format.toUpperCase()}</div>
                <div className="text-gray-400 text-xs mt-1">
                  Streaming: {isStreamingSource(source) ? '✅' : '❌'} |
                  Browser Compatible: {isBrowserCompatible(source) ? '✅' : '❌'} |
                  Advanced Format: {isAdvancedFormat(source) ? '✅' : '❌'} |
                  Download Only: {isDownloadOnlySource(source) ? '✅' : '❌'}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
