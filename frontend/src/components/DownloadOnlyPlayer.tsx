'use client';

import { Download, Play, Film } from 'lucide-react';
import { DownloadUrl } from '@/types/movie';
import Image from 'next/image';

interface DownloadOnlyPlayerProps {
  sources: DownloadUrl[];
  poster?: string;
  title?: string;
  onDownload: (url: string, filename?: string) => void;
  onTryStreaming?: () => void;
}

export default function DownloadOnlyPlayer({ sources, poster, title, onDownload, onTryStreaming }: DownloadOnlyPlayerProps) {
  const getQualityBadgeColor = (quality: string) => {
    const q = quality.toLowerCase();
    if (q.includes('4k') || q.includes('2160p')) return 'bg-purple-500';
    if (q.includes('1080p') || q.includes('fhd')) return 'bg-blue-500';
    if (q.includes('720p') || q.includes('hd')) return 'bg-green-500';
    if (q.includes('480p') || q.includes('sd')) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const formatFileSize = (url: string) => {
    // Try to extract file size from URL or return placeholder
    return 'Unknown size';
  };

  return (
    <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden border border-gray-700">
      <div className="h-full flex flex-col">
        {/* Poster/Preview Section */}
        <div className="flex-1 relative">
          {poster ? (
            <div className="relative h-full">
              <Image
                src={poster}
                alt={title || 'Movie poster'}
                fill
                className="object-cover opacity-60"
                unoptimized={poster.includes('discoveryftp.net')}
              />
              <div className="absolute inset-0 bg-black bg-opacity-40" />
            </div>
          ) : (
            <div className="h-full bg-gradient-to-br from-gray-700 to-gray-800" />
          )}
          
          {/* Overlay Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white p-6">
              <div className="mb-4">
                <div className="relative">
                  <Film className="w-16 h-16 mx-auto text-gray-300 opacity-50" />
                  <Download className="w-8 h-8 absolute -bottom-1 -right-1 text-blue-400" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Download to Watch</h3>
              <p className="text-gray-300 text-sm mb-4 max-w-sm">
                This movie is available for download only. Choose your preferred quality below.
              </p>
              <div className="flex items-center justify-center gap-2 text-gray-400 text-xs mb-3">
                <Play className="w-4 h-4" />
                <span>Streaming not supported</span>
              </div>
              {onTryStreaming && (
                <button
                  onClick={onTryStreaming}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Try Streaming Anyway
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Download Options */}
        <div className="bg-gray-900 bg-opacity-90 p-4 border-t border-gray-700">
          <div className="space-y-3">
            <h4 className="text-white font-medium text-sm mb-3">Available Downloads:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sources.map((source, index) => (
                <button
                  key={index}
                  onClick={() => onDownload(source.url, `${title}_${source.quality}.${source.format.toLowerCase()}`)}
                  className="flex items-center justify-between bg-gray-800 hover:bg-gray-700 rounded-lg p-3 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`px-2 py-1 rounded text-xs font-medium text-white ${getQualityBadgeColor(source.quality)}`}>
                      {source.quality}
                    </div>
                    <div className="text-left">
                      <div className="text-white text-sm font-medium">
                        {source.format.toUpperCase()}
                      </div>
                      {source.label && (
                        <div className="text-gray-400 text-xs">
                          {source.label}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 group-hover:text-white transition-colors">
                    <Download className="w-4 h-4" />
                    <span className="text-xs hidden sm:inline">Download</span>
                  </div>
                </button>
              ))}
            </div>
            
            {sources.length === 0 && (
              <div className="text-center text-gray-400 py-4">
                <p className="text-sm">No download links available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
