'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Movie } from '@/types/movie';
import MovieAPI from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorBoundary';
import MovieDetailsPage from '@/components/MovieDetailsPage';

interface MovieDetailsClientProps {
  movieId: string;
}

export default function MovieDetailsClient({ movieId }: MovieDetailsClientProps) {
  const router = useRouter();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!movieId) {
      setError('Movie ID is required');
      setLoading(false);
      return;
    }

    const fetchMovie = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(`🎬 Fetching movie details for ID: ${movieId}`);
        
        const movieData = await MovieAPI.getMovie(movieId);
        console.log('🎬 Movie data received:', movieData);
        
        setMovie(movieData);
      } catch (err) {
        console.error('❌ Error fetching movie:', err);
        setError(err instanceof Error ? err.message : 'Failed to load movie details');
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [movieId]);

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading movie details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <ErrorMessage
          title="Failed to Load Movie"
          message={error}
          onRetry={() => window.location.reload()}
          showBackButton={true}
          onBack={handleBack}
        />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <ErrorMessage
          title="Movie Not Found"
          message="The requested movie could not be found."
          showBackButton={true}
          onBack={handleBack}
        />
      </div>
    );
  }

  return <MovieDetailsPage movie={movie} onBack={handleBack} />;
}
