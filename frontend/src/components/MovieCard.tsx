'use client';

import { Movie } from '@/types/movie';
import { Play, Star } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

interface MovieCardProps {
  movie: Movie;
  onClick: () => void;
}

export default function MovieCard({ movie, onClick }: MovieCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [srcIndex, setSrcIndex] = useState(0);


  // Reset loading state when poster URL changes
  useEffect(() => {
    if (movie.poster) {
      setImageError(false);
      setImageLoading(true);
    }
  }, [movie.poster]);

  // Resolve poster URL to be relative to current origin to avoid hardcoded ports
  const posterUrl = useMemo(() => {
    if (!movie.poster) return '';
    try {
      // If backend provided absolute localhost poster API, make it relative
      const replaced = movie.poster.replace(/^https?:\/\/localhost:\\d+\/api\/poster/i, '/api/poster');
      // If it's a direct discoveryftp url or backend proxy, prefer routing through our frontend poster API
      if (/discoveryftp\.net/i.test(replaced) && !/\/api\/poster\?url=/i.test(replaced)) {
        return `/api/poster?url=${encodeURIComponent(replaced)}`;
      }
      return replaced;
    } catch {
      return movie.poster;
    }
  }, [movie.poster]);

  // Build robust fallback sources to ensure poster.jpg shows
  const posterCandidates = useMemo(() => {
    const candidates: string[] = [];
    if (posterUrl) candidates.push(posterUrl);
    // If poster is proxied (/api/poster?url=...), also try the direct remote URL
    try {
      const urlObj = new URL(posterUrl, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
      const u = urlObj.searchParams.get('url');
      if (u) {
        candidates.push(decodeURIComponent(u));
      }
    } catch {}
    // Construct from detailUrl if available
    if (movie.detailUrl) {
      try {
        const detailPath = new URL(movie.detailUrl).pathname;
        const posterPath = detailPath.replace('/m/', '/Movies/') + '/poster.jpg';
        const images1 = `https://images1.discoveryftp.net${posterPath}`;
        const content1 = `https://content1.discoveryftp.net${posterPath}`;
        candidates.push(images1, content1, `/api/poster?url=${encodeURIComponent(images1)}`);
      } catch {}
    }
    // Deduplicate
    return Array.from(new Set(candidates.filter(Boolean)));
  }, [posterUrl, movie.detailUrl]);

  // Reset when input changes
  useEffect(() => {
    setImageError(false);
    setImageLoading(true);
    setSrcIndex(0);
  }, [posterUrl, movie.detailUrl]);

  const currentSrc = posterCandidates[srcIndex] || '';

  // Debug logging (only when there are issues)
  if (imageError || posterCandidates.length === 0) {
    console.log(`🎬 ${movie.title} - Poster candidates:`, posterCandidates);
  }

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



  return (
    <div
      className="group relative bg-gray-900 rounded-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:z-10 hover:shadow-2xl"
      onClick={onClick}
    >
      {/* Poster Image */}
      <div className="relative aspect-[2/3] bg-gray-800">
        {!imageError && posterCandidates.length > 0 ? (
          <>
            <img
              src={currentSrc}
              alt={movie.title}
              className="absolute inset-0 w-full h-full object-cover"
              onLoad={() => {
                console.log(`✅ Poster loaded for: ${movie.title} -> ${currentSrc}`);
                setTimeout(() => setImageLoading(false), 100);
              }}
              onError={() => {
                console.warn(`⚠️ Poster failed [${srcIndex + 1}/${posterCandidates.length}] for ${movie.title}: ${currentSrc}`);
                if (srcIndex < posterCandidates.length - 1) {
                  setSrcIndex(srcIndex + 1);
                } else {
                  setImageError(true);
                }
                setImageLoading(false);
              }}
            />

          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
            <div className="text-center p-4">
              <Play className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm font-medium">{formatTitle(movie.title)}</p>
            </div>

          </div>
        )}



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
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="text-white font-semibold text-base line-clamp-2 group-hover:text-blue-400 transition-colors leading-tight">
          {formatTitle(movie.title)}
        </h3>

        {/* Language */}
        {movie.language && (
          <div className="flex justify-start">
            <div className={`${getLanguageBadgeColor(movie.language)} text-white px-2 py-1 rounded text-xs font-medium`}>
              {movie.language}
            </div>
          </div>
        )}

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
