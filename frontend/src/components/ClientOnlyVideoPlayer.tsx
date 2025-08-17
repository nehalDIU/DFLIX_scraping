'use client';

import { useEffect, useState } from 'react';
import { DownloadUrl } from '@/types/movie';
import ReliableVideoPlayer from './ReliableVideoPlayer';

interface ClientOnlyVideoPlayerProps {
  sources: DownloadUrl[];
  poster?: string;
  title?: string;
  onReady?: () => void;
  onDownload: (url: string, filename?: string) => void;
}

export default function ClientOnlyVideoPlayer({ sources, poster, title, onDownload }: ClientOnlyVideoPlayerProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show loading state during SSR
  if (!isMounted) {
    return (
      <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="w-8 h-8 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm">Loading video player...</p>
        </div>
      </div>
    );
  }

  return (
    <ReliableVideoPlayer
      sources={sources}
      poster={poster}
      title={title}
      onDownload={onDownload}
    />
  );
}
