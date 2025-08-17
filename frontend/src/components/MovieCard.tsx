'use client';

import { Movie } from '@/types/movie';
import { Play, Download, Calendar, Globe, Star } from 'lucide-react';
import { useState } from 'react';

interface MovieCardProps {
  movie: Movie;
  onClick: () => void;
}

export default function MovieCard({ movie, onClick }: MovieCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Debug logging
  console.log(`Movie: ${movie.title}`);
  console.log(`Poster URL: ${movie.poster}`);
  console.log(`Image Error: ${imageError}, Loading: ${imageLoading}`);

  const getQualityBadgeColor = (quality: string) => {
    const q = quality.toLowerCase();
    if (q.includes('4k') || q.includes('2160p')) return 'bg-purple-500';
    if (q.includes('1080p') || q.includes('fhd')) return 'bg-blue-500';
    if (q.includes('720p') || q.includes('hd')) return 'bg-green-500';
    if (q.includes('480p') || q.includes('sd')) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const getLanguageBadgeColor = (language: string) => {
    const lang = language.toLowerCase();
    if (lang.includes('english')) return 'bg-red-500';
    if (lang.includes('hindi')) return 'bg-orange-500';
    if (lang.includes('tamil')) return 'bg-blue-500';
    if (lang.includes('telugu')) return 'bg-purple-500';
    return 'bg-gray-500';
  };

  const formatTitle = (title: string) => {
    // Remove year from title if it's already shown separately
    return title.replace(/\(\d{4}\)/, '').trim();
  };

  const formatFileSize = (size: string) => {
    if (!size) return '';
    return size.replace(/\s+/g, ' ').trim();
  };

  return (
    <div 
      className="group relative bg-gray-900 rounded-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:z-10 hover:shadow-2xl"
      onClick={onClick}
    >
      {/* Poster Image */}
      <div className="relative aspect-[2/3] bg-gray-800">
        {!imageError && movie.poster ? (
          <>
            <img
              src={movie.poster}
              alt={movie.title}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => {
                console.log(`✅ Image loaded successfully for: ${movie.title}`);
                console.log(`✅ Loaded URL: ${movie.poster}`);
                setImageLoading(false);
              }}
              onError={(e) => {
                console.error(`❌ Image failed to load for: ${movie.title}`);
                console.error(`❌ Failed URL: ${movie.poster}`);
                console.error(`❌ Error details:`, e);
                setImageError(true);
                setImageLoading(false);
              }}
              crossOrigin="anonymous"
            />
            {imageLoading && (
              <div className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
            <div className="text-center p-4">
              <Play className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm font-medium">{formatTitle(movie.title)}</p>
            </div>
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center">
            <Play className="w-16 h-16 text-white mx-auto mb-2" />
            <p className="text-white font-semibold">Play Now</p>
          </div>
        </div>

        {/* Quality Badge */}
        {movie.quality && (
          <div className={`absolute top-2 right-2 ${getQualityBadgeColor(movie.quality)} text-white text-xs font-bold px-2 py-1 rounded`}>
            {movie.quality.toUpperCase()}
          </div>
        )}

        {/* Rating Badge */}
        {movie.rating && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" />
            {movie.rating}
          </div>
        )}
      </div>

      {/* Movie Info */}
      <div className="p-4 space-y-2">
        {/* Title */}
        <h3 className="text-white font-semibold text-sm line-clamp-2 group-hover:text-blue-400 transition-colors">
          {formatTitle(movie.title)}
        </h3>

        {/* Year and Language */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {movie.year && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{movie.year}</span>
            </div>
          )}
          {movie.language && (
            <div className={`${getLanguageBadgeColor(movie.language)} text-white px-2 py-1 rounded text-xs font-medium`}>
              {movie.language}
            </div>
          )}
        </div>

        {/* File Size and Download Count */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          {movie.size && (
            <span className="bg-gray-800 px-2 py-1 rounded">
              {formatFileSize(movie.size)}
            </span>
          )}
          {movie.downloadUrls.length > 0 && (
            <div className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              <span>{movie.downloadUrls.length} link{movie.downloadUrls.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Genres */}
        {movie.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {movie.genres.slice(0, 2).map((genre, index) => (
              <span 
                key={index}
                className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded"
              >
                {genre}
              </span>
            ))}
            {movie.genres.length > 2 && (
              <span className="text-gray-500 text-xs">+{movie.genres.length - 2}</span>
            )}
          </div>
        )}
      </div>

      {/* Hover effect border */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500 rounded-lg transition-colors duration-300 pointer-events-none"></div>
    </div>
  );
}
