'use client';

import { Movie } from '@/types/movie';
import MovieCard from './MovieCard';
import { Film } from 'lucide-react';

interface MovieGridProps {
  movies: Movie[];
  onMovieClick: (movie: Movie) => void;
  loading?: boolean;
  error?: string | null;
}

export default function MovieGrid({ movies, onMovieClick, loading, error }: MovieGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-800 aspect-[2/3] rounded-lg mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-800 rounded w-3/4"></div>
              <div className="h-3 bg-gray-800 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-8 max-w-md">
          <div className="text-red-400 mb-4">
            <Film className="w-16 h-16 mx-auto opacity-50" />
          </div>
          <h3 className="text-red-400 font-semibold text-lg mb-2">Error Loading Movies</h3>
          <p className="text-red-300 text-sm mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-gray-400 mb-4">
          <Film className="w-16 h-16 mx-auto opacity-50" />
        </div>
        <h3 className="text-gray-400 font-semibold text-lg mb-2">No Movies Found</h3>
        <p className="text-gray-500 text-sm">
          Try adjusting your search filters or check back later for new content.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          onClick={() => onMovieClick(movie)}
        />
      ))}
    </div>
  );
}
