import { Metadata } from 'next';
import MovieDetailsClient from './MovieDetailsClient';
import MovieAPI from '@/lib/api';

interface Props {
  params: { id: string };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const movie = await MovieAPI.getMovie(params.id);

    return {
      title: `${movie.title} (${movie.year}) - Discovery Movies`,
      description: movie.description || `Watch and download ${movie.title} (${movie.year}) in ${movie.quality} quality. ${movie.genres.join(', ')}.`,
      keywords: [movie.title, movie.year, ...movie.genres, 'movie', 'stream', 'download'].join(', '),
      openGraph: {
        title: `${movie.title} (${movie.year})`,
        description: movie.description || `Watch ${movie.title} in ${movie.quality} quality`,
        images: movie.poster ? [{ url: movie.poster, alt: movie.title }] : [],
        type: 'video.movie',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${movie.title} (${movie.year})`,
        description: movie.description || `Watch ${movie.title} in ${movie.quality} quality`,
        images: movie.poster ? [movie.poster] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Movie Details - Discovery Movies',
      description: 'Stream and download movies from Discovery FTP',
    };
  }
}

export default function MoviePage({ params }: Props) {
  return <MovieDetailsClient movieId={params.id} />;
}
