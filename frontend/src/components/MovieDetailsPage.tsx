'use client';

import { useState } from 'react';
import { Movie } from '@/types/movie';
import {
  ArrowLeft,
  Star,
  Calendar,
  Globe,
  Download,
  Play,
  FileText,
  Clock,
  HardDrive,
  Monitor,
  ExternalLink
} from 'lucide-react';
import Image from 'next/image';
import MovieStreamingSection from './MovieStreamingSection';
import DownloadSection from './DownloadSection';
import { EXTERNAL_PLAYERS, launchInExternalPlayer } from '@/utils/externalPlayerIntegration';

interface MovieDetailsPageProps {
  movie: Movie;
  onBack: () => void;
}

export default function MovieDetailsPage({ movie, onBack }: MovieDetailsPageProps) {
  const [activeTab, setActiveTab] = useState<'stream' | 'download' | 'info'>('stream');
  const [launchStatus, setLaunchStatus] = useState<string | null>(null);

  const formatTitle = (title: string) => {
    return title.replace(/\(\d{4}\)/, '').trim();
  };

  const formatFileSize = (size: string) => {
    if (!size || size === 'N/A') return 'Unknown size';
    return size;
  };

  const getQualityBadgeColor = (quality: string) => {
    const q = quality.toLowerCase();
    if (q.includes('4k') || q.includes('2160p')) return 'bg-purple-600';
    if (q.includes('1080p') || q.includes('fhd')) return 'bg-blue-600';
    if (q.includes('720p') || q.includes('hd')) return 'bg-green-600';
    if (q.includes('480p') || q.includes('sd')) return 'bg-yellow-600';
    return 'bg-gray-600';
  };

  const handleExternalPlayerLaunch = async (playerId: string) => {
    if (!movie.downloadUrls || movie.downloadUrls.length === 0) return;

    setLaunchStatus('Launching...');

    try {
      const result = await launchInExternalPlayer(
        movie.downloadUrls[0], // Use first available source
        playerId,
        true
      );

      setLaunchStatus(result.message);
      setTimeout(() => setLaunchStatus(null), 4000);
    } catch (error) {
      setLaunchStatus('Failed to launch external player');
      setTimeout(() => setLaunchStatus(null), 4000);
    }
  };

  const handleDownload = (url: string, filename?: string) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || movie.title;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Movies
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative">
        {/* Background Image */}
        {movie.poster && (
          <div className="absolute inset-0 h-96 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
            <Image
              src={movie.poster}
              alt={movie.title}
              fill
              className="object-cover object-top blur-sm scale-110"
              sizes="100vw"
              unoptimized={movie.poster.includes('discoveryftp.net') || movie.poster.includes('proxy/poster')}
            />
          </div>
        )}

        {/* Hero Content */}
        <div className="relative z-20 container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Movie Poster */}
            <div className="lg:col-span-1">
              {movie.poster ? (
                <div className="relative aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden shadow-2xl max-w-sm mx-auto lg:mx-0">
                  <Image
                    src={movie.poster}
                    alt={movie.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    unoptimized={movie.poster.includes('discoveryftp.net') || movie.poster.includes('proxy/poster')}
                  />
                </div>
              ) : (
                <div className="aspect-[2/3] bg-gray-800 rounded-lg flex items-center justify-center max-w-sm mx-auto lg:mx-0">
                  <FileText className="w-16 h-16 text-gray-600" />
                </div>
              )}
            </div>

            {/* Movie Info */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold mb-2">
                  {formatTitle(movie.title)}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-gray-300">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{movie.year}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    <span>{movie.language}</span>
                  </div>
                  {movie.rating && movie.rating !== 'N/A' && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span>{movie.rating}</span>
                    </div>
                  )}
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getQualityBadgeColor(movie.quality)}`}>
                    {movie.quality}
                  </div>
                </div>
              </div>

              {/* Genres */}
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((genre, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              {movie.description && movie.description !== 'N/A' && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Overview</h3>
                  <p className="text-gray-300 leading-relaxed">{movie.description}</p>
                </div>
              )}

              {/* File Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-400">File Size</div>
                    <div className="font-medium">{formatFileSize(movie.size)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-400">Quality</div>
                    <div className="font-medium">{movie.quality}</div>
                  </div>
                </div>
              </div>

              {/* Launch in External Player */}
              {movie.downloadUrls && movie.downloadUrls.length > 0 && (
                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <ExternalLink className="w-5 h-5 text-blue-400" />
                    Launch in External Player
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {EXTERNAL_PLAYERS.slice(0, 3).map((player) => (
                      <button
                        key={player.id}
                        onClick={() => handleExternalPlayerLaunch(player.id)}
                        className="flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left group"
                        disabled={!!launchStatus}
                      >
                        <div className="text-xl">{player.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white text-sm group-hover:text-blue-400 transition-colors">
                            {player.name}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {player.description.split(' ').slice(0, 3).join(' ')}...
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {launchStatus && (
                    <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                      <p className="text-blue-400 text-sm flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        {launchStatus}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {movie.downloadUrls && movie.downloadUrls.length > 0 && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setActiveTab('stream')}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    <Play className="w-5 h-5" />
                    Stream Web
                  </button>
                  <button
                    onClick={() => handleDownload(movie.downloadUrls[0].url, `${movie.title}.${movie.downloadUrls[0].format || 'mkv'}`)}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Download
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1 mb-8 bg-gray-900 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('stream')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'stream'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Play className="w-4 h-4" />
            Stream
          </button>
          <button
            onClick={() => setActiveTab('download')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'download'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'info'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Details
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'stream' && (
            <MovieStreamingSection movie={movie} />
          )}
          
          {activeTab === 'download' && (
            <DownloadSection movie={movie} />
          )}
          
          {activeTab === 'info' && (
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Movie Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-400">Title:</span>
                    <span className="ml-2">{movie.title}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Year:</span>
                    <span className="ml-2">{movie.year}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Language:</span>
                    <span className="ml-2">{movie.language}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Quality:</span>
                    <span className="ml-2">{movie.quality}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-400">File Size:</span>
                    <span className="ml-2">{formatFileSize(movie.size)}</span>
                  </div>
                  {movie.rating && movie.rating !== 'N/A' && (
                    <div>
                      <span className="text-gray-400">Rating:</span>
                      <span className="ml-2">{movie.rating}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-400">Available Files:</span>
                    <span className="ml-2">{movie.downloadUrls.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
