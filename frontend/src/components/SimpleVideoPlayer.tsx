'use client';

import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { DownloadUrl } from '@/types/movie';

interface SimpleVideoPlayerProps {
  sources: DownloadUrl[];
  poster?: string;
  title?: string;
  onReady?: () => void;
}

export default function SimpleVideoPlayer({ sources, poster, title, onReady }: SimpleVideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [currentSource, setCurrentSource] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current && videoRef.current && sources.length > 0) {
      const videoElement = document.createElement('video-js');
      videoElement.classList.add('vjs-big-play-centered');
      videoRef.current.appendChild(videoElement);

      const player = videojs(videoElement, {
        autoplay: false,
        controls: true,
        responsive: true,
        fluid: true,
        poster: poster,
        playbackRates: [0.5, 1, 1.25, 1.5, 2],
        preload: 'metadata'
      });

      // Set initial source
      if (sources[currentSource]) {
        player.src({
          src: sources[currentSource].url,
          type: getVideoType(sources[currentSource].format)
        });
      }

      player.ready(() => {
        onReady?.();
      });

      player.on('error', () => {
        const error = player.error();
        console.error('Video player error:', error);
        setError(`Failed to load video: ${error?.message || 'Unknown error'}`);
      });

      playerRef.current = player;
    }

    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  // Update source when currentSource changes
  useEffect(() => {
    if (playerRef.current && sources[currentSource]) {
      const source = sources[currentSource];
      playerRef.current.src({
        src: source.url,
        type: getVideoType(source.format)
      });
      setError(null);
    }
  }, [currentSource, sources]);

  const getVideoType = (format: string): string => {
    const f = format.toLowerCase();
    if (f === 'mp4') return 'video/mp4';
    if (f === 'mkv') return 'video/x-matroska';
    if (f === 'avi') return 'video/x-msvideo';
    if (f === 'webm') return 'video/webm';
    if (f === 'm3u8') return 'application/x-mpegURL';
    return 'video/mp4'; // default
  };

  const handleSourceChange = (index: number) => {
    setCurrentSource(index);
  };

  if (sources.length === 0) {
    return (
      <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-lg font-medium">No video sources available</p>
          <p className="text-sm">This movie doesn't have any playable video links.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quality Selector */}
      {sources.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-gray-300 text-sm font-medium">Quality:</span>
          {sources.map((source, index) => (
            <button
              key={index}
              onClick={() => handleSourceChange(index)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                index === currentSource
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {source.quality} {source.format.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Video Player */}
      <div className="relative">
        <div ref={videoRef} className="aspect-video bg-black rounded-lg overflow-hidden" />
        
        {error && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="text-center text-white p-6">
              <p className="text-lg font-medium mb-2">Video Error</p>
              <p className="text-sm text-gray-300 mb-4">{error}</p>
              {sources.length > 1 && (
                <button
                  onClick={() => {
                    const nextSource = (currentSource + 1) % sources.length;
                    handleSourceChange(nextSource);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Try Next Quality
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Current Source Info */}
      <div className="text-sm text-gray-400">
        <p>
          Playing: <span className="text-white">{sources[currentSource]?.quality} {sources[currentSource]?.format.toUpperCase()}</span>
          {sources[currentSource]?.label && (
            <span> - {sources[currentSource].label}</span>
          )}
        </p>
      </div>
    </div>
  );
}
