'use client';

import { useState, useEffect } from 'react';
import { Movie, DownloadUrl } from '@/types/movie';
import { 
  Play, 
  AlertTriangle, 
  ExternalLink, 
  Monitor,
  Download,
  Info
} from 'lucide-react';
import { analyzeMKVSource, checkNativeMKVSupport } from '@/utils/mkvDetector';
import { EXTERNAL_PLAYERS, launchInExternalPlayer } from '@/utils/externalPlayerIntegration';
import UniversalVideoPlayer from './UniversalVideoPlayer';

interface MovieStreamingSectionProps {
  movie: Movie;
}

export default function MovieStreamingSection({ movie }: MovieStreamingSectionProps) {
  const [selectedSource, setSelectedSource] = useState(0);
  const [showPlayer, setShowPlayer] = useState(false);
  const [mkvAnalysis, setMkvAnalysis] = useState<any>(null);
  const [browserSupport, setBrowserSupport] = useState<any>(null);
  const [launchStatus, setLaunchStatus] = useState<string | null>(null);

  useEffect(() => {
    if (movie.downloadUrls.length > 0) {
      const source = movie.downloadUrls[selectedSource];
      const analysis = analyzeMKVSource(source);
      const support = checkNativeMKVSupport();
      
      setMkvAnalysis(analysis);
      setBrowserSupport(support);
    }
  }, [selectedSource, movie.downloadUrls]);

  const handleDownload = (url: string, filename?: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || movie.title;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExternalPlayerLaunch = async (playerId: string) => {
    if (!movie.downloadUrls[selectedSource]) return;

    setLaunchStatus('Launching...');
    
    try {
      const result = await launchInExternalPlayer(
        movie.downloadUrls[selectedSource], 
        playerId, 
        true
      );
      
      setLaunchStatus(result.message);
      setTimeout(() => setLaunchStatus(null), 3000);
    } catch (error) {
      setLaunchStatus('Failed to launch external player');
      setTimeout(() => setLaunchStatus(null), 3000);
    }
  };

  const getFormatBadgeColor = (format: string) => {
    const f = format.toLowerCase();
    if (f === 'mkv') return 'bg-purple-600';
    if (f === 'mp4') return 'bg-blue-600';
    if (f === 'avi') return 'bg-green-600';
    if (f === 'mov') return 'bg-yellow-600';
    return 'bg-gray-600';
  };

  if (!movie.downloadUrls || movie.downloadUrls.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg p-8 text-center">
        <div className="text-gray-400 mb-4">
          <Play className="w-16 h-16 mx-auto opacity-50" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No Video Available</h3>
        <p className="text-gray-400">
          This movie doesn't have any playable video files available for streaming.
        </p>
      </div>
    );
  }

  const currentSource = movie.downloadUrls[selectedSource];
  const isMKV = mkvAnalysis?.isMKV;
  const needsExternalPlayer = isMKV && (!browserSupport?.canPlayNatively || browserSupport?.recommendedAction === 'external');

  return (
    <div className="space-y-6">
      {/* Source Selection */}
      {movie.downloadUrls.length > 1 && (
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Available Sources</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {movie.downloadUrls.map((source, index) => (
              <button
                key={index}
                onClick={() => setSelectedSource(index)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  selectedSource === index
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600 text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{source.quality}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getFormatBadgeColor(source.format)}`}>
                    {source.format.toUpperCase()}
                  </span>
                </div>
                {source.label && (
                  <div className="text-sm text-gray-400">{source.label}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MKV Compatibility Notice */}
      {isMKV && (
        <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-amber-400 font-medium mb-1">MKV Format Detected</h4>
              <p className="text-amber-200 text-sm mb-3">
                This file is in MKV format. {needsExternalPlayer 
                  ? 'For the best experience, we recommend using an external media player.'
                  : 'Your browser supports this format, but external players may provide better performance.'
                }
              </p>
              {mkvAnalysis?.hasSubtitles && (
                <p className="text-amber-200 text-sm">
                  <Info className="w-4 h-4 inline mr-1" />
                  This file includes embedded subtitles.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Player */}
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        {showPlayer ? (
          <div className="p-4">
            <UniversalVideoPlayer
              sources={[currentSource]}
              poster={movie.poster}
              title={movie.title}
              onDownload={handleDownload}
            />
          </div>
        ) : (
          <div className="aspect-video bg-gray-800 flex items-center justify-center">
            <button
              onClick={() => setShowPlayer(true)}
              className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Play className="w-5 h-5" />
              Start Streaming
            </button>
          </div>
        )}
      </div>

      {/* External Players */}
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ExternalLink className="w-5 h-5" />
          Launch in External Player
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          For the best MKV playback experience with full codec support and subtitle handling.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {EXTERNAL_PLAYERS.slice(0, 6).map((player) => (
            <button
              key={player.id}
              onClick={() => handleExternalPlayerLaunch(player.id)}
              className="flex items-center gap-3 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
            >
              <div className="text-2xl">{player.icon}</div>
              <div className="flex-1">
                <div className="font-medium text-white">{player.name}</div>
                <div className="text-xs text-gray-400">{player.description}</div>
              </div>
            </button>
          ))}
        </div>

        {launchStatus && (
          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <p className="text-blue-400 text-sm">{launchStatus}</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => handleDownload(currentSource.url, `${movie.title}.${currentSource.format}`)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Download File
        </button>
        
        <button
          onClick={() => navigator.clipboard?.writeText(currentSource.url)}
          className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Monitor className="w-4 h-4" />
          Copy URL
        </button>
      </div>
    </div>
  );
}
