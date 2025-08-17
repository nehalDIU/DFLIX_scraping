'use client';

import { useState } from 'react';
import { Movie, SearchFilters } from '@/types/movie';
import { useMovies, useMovieSearch } from '@/hooks/useMovies';
import MovieGrid from '@/components/MovieGrid';
import MovieModal from '@/components/MovieModal';
import SearchBar from '@/components/SearchBar';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorBoundary';

export default function Home() {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const { movies, loading, error, refetch, refresh, lastUpdated } = useMovies();
  const { movies: searchResults, searchMovies, clearSearch, loading: searchLoading } = useMovieSearch();

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMovie(null);
  };

  const handleSearch = async (filters: SearchFilters) => {
    if (!filters.query && !filters.year && !filters.language && !filters.quality) {
      setIsSearching(false);
      clearSearch();
      return;
    }

    setIsSearching(true);
    await searchMovies(filters);
  };

  const handleClearSearch = () => {
    setIsSearching(false);
    clearSearch();
  };

  const handleRefresh = async () => {
    await refresh();
  };

  const displayMovies = isSearching ? searchResults : movies;
  const displayLoading = isSearching ? searchLoading : loading;
  const displayError = isSearching ? null : error;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Bar */}
      <div className="mb-8">
        <SearchBar
          onSearch={handleSearch}
          onClear={handleClearSearch}
          onRefresh={handleRefresh}
          loading={loading}
          totalMovies={displayMovies.length}
          lastUpdated={lastUpdated}
        />
      </div>

      {/* Content */}
      {displayLoading ? (
        <LoadingSpinner size="lg" text="Loading movies..." />
      ) : displayError ? (
        <ErrorMessage
          title="Failed to Load Movies"
          message={displayError || 'Unknown error occurred'}
          onRetry={refetch}
        />
      ) : (
        <MovieGrid
          movies={displayMovies}
          onMovieClick={handleMovieClick}
          loading={false}
          error={null}
        />
      )}

      {/* Movie Modal */}
      <MovieModal
        movie={selectedMovie}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
