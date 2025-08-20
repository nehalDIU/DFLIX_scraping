'use client';

import { useState, useEffect } from 'react';
import { Movie, SearchFilters } from '@/types/movie';
import { useMovies, useMovieSearch } from '@/hooks/useMovies';
import MovieGrid from '@/components/MovieGrid';
import SearchBar from '@/components/SearchBar';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorBoundary';
import { useVideoPlayer } from '@/contexts/VideoPlayerContext';

export default function Home() {
  const [isSearching, setIsSearching] = useState(false);
  const [testResult, setTestResult] = useState<string>('');
  const { showPlayer, hidePlayer, togglePlayer, state } = useVideoPlayer();

  console.log('🏠 Home: Component rendering...');
  console.log('🏠 Home: About to call useMovies...');
  const { movies, loading, error, refetch, refresh, lastUpdated } = useMovies();
  console.log(`🏠 Home: useMovies returned ${movies.length} movies, loading: ${loading}, error: ${error}`);



  // Auto-test API after component mounts
  useEffect(() => {
    console.log('🏠 Home: useEffect triggered!');

    // Test direct API call if needed
    if (movies.length === 0 && loading) {
      console.log('🏠 Home: Testing direct API call...');
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
  }, [movies.length, loading]);
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
        {/* Test Buttons */}
        <div className="mt-4 flex gap-4">
          <button
            onClick={handleTestAPI}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Test API Call
          </button>
          <button
            onClick={() => showPlayer({
              title: "Big Buck Bunny Demo",
              videoSrc: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            })}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          >
            Show Video Player
          </button>
          <button
            onClick={togglePlayer}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Toggle Player
          </button>
          {state.isVisible && (
            <button
              onClick={hidePlayer}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Hide Player
            </button>
          )}
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
          loading={false}
          error={null}
        />
      )}
    </div>
  );
}
