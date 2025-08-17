'use client';

import { useState, useEffect, useCallback } from 'react';
import { Movie, SearchFilters } from '@/types/movie';
import MovieAPI from '@/lib/api';

interface UseMoviesState {
  movies: Movie[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useMovies() {
  const [state, setState] = useState<UseMoviesState>({
    movies: [],
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const fetchMovies = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const movies = await MovieAPI.getAllMovies();
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
        error: error instanceof Error ? error.message : 'Failed to fetch movies',
      }));
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

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

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
