'use client';

import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import '@videojs/themes/dist/sea/index.css';
import 'videojs-hotkeys';
import { DownloadUrl } from '@/types/movie';

interface VideoPlayerProps {
  sources: DownloadUrl[];
  poster?: string;
  title?: string;
  onReady?: () => void;
}

export default function VideoPlayer({ sources, poster, title, onReady }: VideoPlayerProps) {
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
        preload: 'metadata',
        html5: {
          vhs: {
            overrideNative: true
          }
        }
      });

      // Add hotkeys plugin after player is created
      player.ready(() => {
        player.hotkeys({
          volumeStep: 0.1,
          seekStep: 5,
          enableModifiersForNumbers: false
        });
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

        let errorMessage = 'Unknown error';
        if (error?.code === 4) {
          errorMessage = 'This video format is not supported for streaming. Please use the download links below.';
        } else if (error?.code === 3) {
          errorMessage = 'Video file is corrupted or incomplete.';
        } else if (error?.code === 2) {
          errorMessage = 'Network error while loading video.';
        } else if (error?.code === 1) {
          errorMessage = 'Video loading was aborted.';
        } else if (error?.message) {
          errorMessage = error.message;
        }

        setError(errorMessage);
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

  const isStreamableUrl = (url: string): boolean => {
    // Check if URL is likely to be streamable
    const streamablePatterns = [
      /\.m3u8$/i,
      /\.mpd$/i,
      /\/stream\//i,
      /\/play\//i,
      /streaming/i
    ];

    return streamablePatterns.some(pattern => pattern.test(url)) ||
           url.includes('stream') ||
           url.includes('play');
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

  // Check if any sources are likely to be streamable
  const hasStreamableSources = sources.some(source => isStreamableUrl(source.url));

  if (!hasStreamableSources) {
    return (
      <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center border border-gray-700">
        <div className="text-center text-gray-300 p-8 max-w-md">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-lg font-medium mb-2">Streaming Not Available</p>
          <p className="text-sm text-gray-400 mb-4">
            This movie is available for download only. The files cannot be streamed directly in the browser.
          </p>
          <p className="text-xs text-gray-500">
            Use the download buttons below to save the movie files to your device.
          </p>
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
          <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center rounded-lg">
            <div className="text-center text-white p-6 max-w-md">
              <div className="mb-4">
                <svg className="w-12 h-12 mx-auto text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-lg font-medium mb-2">Playback Error</p>
              <p className="text-sm text-gray-300 mb-4">{error}</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
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
                <button
                  onClick={() => setError(null)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Dismiss
                </button>
              </div>
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
