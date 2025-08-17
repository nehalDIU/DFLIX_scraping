'use client';

import { useState, useEffect } from 'react';
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
  const [testResult, setTestResult] = useState<string>('');

  console.log('🏠 Home: Component rendering...');
  console.log('🏠 Home: About to call useMovies...');
  const { movies, loading, error, refetch, refresh, lastUpdated } = useMovies();
  console.log(`🏠 Home: useMovies returned ${movies.length} movies, loading: ${loading}, error: ${error}`);

  // Force a direct API call to test
  if (typeof window !== 'undefined' && movies.length === 0 && loading) {
    console.log('🏠 Home: Forcing direct API call...');
    fetch('http://localhost:3001/api/movies')
      .then(response => {
        console.log('🏠 Home: Direct API response status:', response.status);
        console.log('🏠 Home: Direct API response headers:', response.headers);
        return response.json();
      })
      .then(data => {
        console.log('🏠 Home: Direct API data structure:', typeof data);
        console.log('🏠 Home: Direct API data keys:', Object.keys(data || {}));
        console.log('🏠 Home: Direct API data.data type:', typeof data.data);
        console.log('🏠 Home: Direct API movies count:', data.data?.length);
        console.log('🏠 Home: Direct API first movie:', data.data?.[0]);
      })
      .catch(error => {
        console.error('🏠 Home: Direct API error:', error);
      });
  }

  // Auto-test API after component mounts
  useEffect(() => {
    console.log('🏠 Home: useEffect triggered!');
    const timer = setTimeout(async () => {
      console.log('🏠 Home: Auto-testing API...');
      try {
        const response = await fetch('http://localhost:3001/api/movies');
        console.log('🏠 Home: Direct fetch response status:', response.status);
        const data = await response.json();
        console.log('🏠 Home: Direct fetch data length:', data.data?.length);
        console.log('🏠 Home: Direct fetch first movie:', data.data?.[0]);
      } catch (error) {
        console.error('🏠 Home: Direct fetch error:', error);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  const { movies: searchResults, searchMovies, clearSearch, loading: searchLoading } = useMovieSearch();

  const handleTestAPI = async () => {
    console.log('🏠 Home: Testing API directly...');
    setTestResult('Testing API...');
    try {
      const response = await fetch('http://localhost:3001/api/movies');
      console.log('🏠 Home: API Response status:', response.status);
      const data = await response.json();
      console.log('🏠 Home: API Response data:', data);
      console.log('🏠 Home: Movies count:', data.data?.length);
      setTestResult(`✅ API Success! Found ${data.data?.length || 0} movies. First movie: ${data.data?.[0]?.title || 'N/A'}`);
    } catch (error) {
      console.error('🏠 Home: API Test error:', error);
      setTestResult(`❌ API Error: ${error}`);
    }
  };

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

  console.log(`🏠 Home: displayMovies.length = ${displayMovies.length}`);
  console.log(`🏠 Home: isSearching = ${isSearching}, searchResults.length = ${searchResults.length}`);
  console.log(`🏠 Home: displayLoading = ${displayLoading}, displayError = ${displayError}`);

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
        {/* Test Button */}
        <div className="mt-4">
          <button
            onClick={handleTestAPI}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Test API Call
          </button>
          {testResult && (
            <div className="mt-2 p-2 bg-gray-100 rounded">
              <p className="text-sm">{testResult}</p>
            </div>
          )}
        </div>
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
