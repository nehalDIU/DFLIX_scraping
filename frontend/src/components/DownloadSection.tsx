'use client';

import { useState } from 'react';
import { Movie, DownloadUrl } from '@/types/movie';
import { 
  Download, 
  ExternalLink, 
  Copy, 
  FileText, 
  HardDrive,
  Monitor,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface DownloadSectionProps {
  movie: Movie;
}

export default function DownloadSection({ movie }: DownloadSectionProps) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [downloadingUrls, setDownloadingUrls] = useState<Set<string>>(new Set());

  const handleDownload = async (source: DownloadUrl) => {
    const filename = `${movie.title}.${source.format}`;
    
    setDownloadingUrls(prev => new Set(prev).add(source.url));
    
    try {
      // Create download link
      const link = document.createElement('a');
      link.href = source.url;
      link.download = filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Add to DOM and click
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success feedback
      setTimeout(() => {
        setDownloadingUrls(prev => {
          const newSet = new Set(prev);
          newSet.delete(source.url);
          return newSet;
        });
      }, 2000);
      
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadingUrls(prev => {
        const newSet = new Set(prev);
        newSet.delete(source.url);
        return newSet;
      });
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
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

  const getQualityBadgeColor = (quality: string) => {
    const q = quality.toLowerCase();
    if (q.includes('4k') || q.includes('2160p')) return 'bg-purple-600';
    if (q.includes('1080p') || q.includes('fhd')) return 'bg-blue-600';
    if (q.includes('720p') || q.includes('hd')) return 'bg-green-600';
    if (q.includes('480p') || q.includes('sd')) return 'bg-yellow-600';
    return 'bg-gray-600';
  };

  const formatFileSize = (url: string) => {
    // Try to extract file size from URL or return unknown
    return 'Unknown size';
  };

  if (!movie.downloadUrls || movie.downloadUrls.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg p-8 text-center">
        <div className="text-gray-400 mb-4">
          <Download className="w-16 h-16 mx-auto opacity-50" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No Downloads Available</h3>
        <p className="text-gray-400">
          This movie doesn't have any downloadable files available.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Download Instructions */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-blue-400 font-medium mb-1">Download Instructions</h4>
            <p className="text-blue-200 text-sm">
              Click the download button to start downloading the file directly to your device. 
              For MKV files, we recommend using external media players for the best playback experience.
            </p>
          </div>
        </div>
      </div>

      {/* Available Downloads */}
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Download className="w-5 h-5" />
          Available Downloads
        </h3>
        
        <div className="space-y-4">
          {movie.downloadUrls.map((source, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* File Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getQualityBadgeColor(source.quality)}`}>
                        {source.quality}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getFormatBadgeColor(source.format)}`}>
                        {source.format.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  {source.label && (
                    <div className="text-sm text-gray-300 mb-1">{source.label}</div>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <HardDrive className="w-4 h-4" />
                      <span>{formatFileSize(source.url)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      <span>{source.format.toUpperCase()} Format</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(source)}
                    disabled={downloadingUrls.has(source.url)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    {downloadingUrls.has(source.url) ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleCopyUrl(source.url)}
                    className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    {copiedUrl === source.url ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy URL
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Bulk Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              movie.downloadUrls.forEach(source => handleDownload(source));
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Download All Files
          </button>
          
          <button
            onClick={() => {
              const urls = movie.downloadUrls.map(source => source.url).join('\n');
              navigator.clipboard?.writeText(urls);
            }}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Copy className="w-4 h-4" />
            Copy All URLs
          </button>
        </div>
      </div>

      {/* External Player Recommendations */}
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          Recommended Players
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          For the best viewing experience, especially with MKV files, we recommend these media players:
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'VLC Media Player', icon: '🎬', url: 'https://www.videolan.org/vlc/' },
            { name: 'PotPlayer', icon: '📺', url: 'https://potplayer.daum.net/' },
            { name: 'MPC-HC', icon: '🎭', url: 'https://github.com/clsid2/mpc-hc/releases' }
          ].map((player, index) => (
            <a
              key={index}
              href={player.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <div className="text-xl">{player.icon}</div>
              <div className="flex-1">
                <div className="font-medium text-white">{player.name}</div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
