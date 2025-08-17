'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Movie, SearchFilters } from '@/types/movie';
import MovieAPI from '@/lib/api';

interface UseMoviesState {
  movies: Movie[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useMovies() {
  console.log('🎬 useMovies: Hook called!');
  console.log('🎬 useMovies: typeof window:', typeof window);
  const [state, setState] = useState<UseMoviesState>({
    movies: [],
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const [hasInitialized, setHasInitialized] = useState(false);

  const fetchMovies = useCallback(async () => {
    console.log('🎬 fetchMovies: Starting to fetch movies...');
    try {
      console.log('🎬 fetchMovies: Setting loading state...');
      setState(prev => {
        console.log('🎬 fetchMovies: Previous state:', prev);
        const newState = { ...prev, loading: true, error: null };
        console.log('🎬 fetchMovies: New loading state:', newState);
        return newState;
      });
      console.log('🎬 fetchMovies: Calling MovieAPI.getAllMovies()...');
      const movies = await MovieAPI.getAllMovies();
      console.log(`🎬 fetchMovies: Received ${movies.length} movies from API`);
      console.log('🎬 fetchMovies: First few movies:', movies.slice(0, 3));
      console.log('🎬 fetchMovies: Setting movies state...');
      const finalState = {
        movies,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      };
      console.log('🎬 fetchMovies: Final state to set:', finalState);
      setState(finalState);
      console.log('🎬 fetchMovies: setState called with final state');
    } catch (error) {
      console.error('🎬 fetchMovies: Error occurred:', error);
      const errorState = {
        movies: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch movies',
        lastUpdated: null,
      };
      console.log('🎬 fetchMovies: Error state to set:', errorState);
      setState(errorState);
    }
  }, []);

  const refreshMovies = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const movies = await MovieAPI.refreshMovies();
      setState({
        movies,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to refresh movies',
      }));
    }
  }, []);

  // Force initialization on client side
  if (typeof window !== 'undefined' && !hasInitialized && state.movies.length === 0) {
    console.log('🎬 useMovies: Forcing initialization...');
    setHasInitialized(true);
    fetchMovies();
  }

  useEffect(() => {
    console.log('🎬 useMovies: useEffect triggered!');
    console.log('🎬 useMovies: typeof window:', typeof window);
    console.log('🎬 useMovies: hasInitialized:', hasInitialized);

    if (!hasInitialized) {
      console.log('🎬 useMovies: Initializing from useEffect...');
      setHasInitialized(true);
      fetchMovies();
    }
  }, [hasInitialized, fetchMovies]);

  return {
    ...state,
    refetch: fetchMovies,
    refresh: refreshMovies,
  };
}

export function useMovieSearch() {
  const [state, setState] = useState<UseMoviesState>({
    movies: [],
    loading: false,
    error: null,
    lastUpdated: null,
  });

  const searchMovies = useCallback(async (filters: SearchFilters) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const movies = await MovieAPI.searchMovies(filters);
      setState({
        movies,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to search movies',
      }));
    }
  }, []);

  const clearSearch = useCallback(() => {
    setState({
      movies: [],
      loading: false,
      error: null,
      lastUpdated: null,
    });
  }, []);

  return {
    ...state,
    searchMovies,
    clearSearch,
  };
}

export function useMovie(id: string | null) {
  const [state, setState] = useState<{
    movie: Movie | null;
    loading: boolean;
    error: string | null;
  }>({
    movie: null,
    loading: false,
    error: null,
  });

  const fetchMovie = useCallback(async (movieId: string) => {
    try {
      setState({ movie: null, loading: true, error: null });
      const movie = await MovieAPI.getMovie(movieId);
      setState({ movie, loading: false, error: null });
    } catch (error) {
      setState({
        movie: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch movie',
      });
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchMovie(id);
    } else {
      setState({ movie: null, loading: false, error: null });
    }
  }, [id, fetchMovie]);

  return {
    ...state,
    refetch: id ? () => fetchMovie(id) : undefined,
  };
}
