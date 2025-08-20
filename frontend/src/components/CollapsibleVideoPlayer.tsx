'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, X, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import { useVideoPlayer } from '@/contexts/VideoPlayerContext';

interface CollapsibleVideoPlayerProps {
  /** Initial collapsed state */
  initiallyCollapsed?: boolean;
}

export default function CollapsibleVideoPlayer({
  initiallyCollapsed = true
}: CollapsibleVideoPlayerProps) {
  const { state, hidePlayer } = useVideoPlayer();
  const [isCollapsed, setIsCollapsed] = useState(initiallyCollapsed);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, []);

  // Auto-hide controls
  useEffect(() => {
    if (!isCollapsed && isPlaying) {
      const resetTimeout = () => {
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        setShowControls(true);
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      };

      resetTimeout();
      return () => {
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      };
    } else {
      setShowControls(true);
    }
  }, [isCollapsed, isPlaying]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleExpand = () => {
    setIsCollapsed(false);
  };

  const handleCollapse = () => {
    setIsCollapsed(true);
    // Pause video when collapsing
    if (videoRef.current && isPlaying) {
      videoRef.current.pause();
    }
  };

  const handleClose = () => {
    if (videoRef.current && isPlaying) {
      videoRef.current.pause();
    }
    hidePlayer();
  };

  // Don't render if not visible
  if (!state.isVisible) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={clsx(
        "fixed bottom-0 left-0 right-0 z-50 bg-black transition-all duration-500 ease-in-out",
        isCollapsed ? "h-16" : "h-96 md:h-[500px]",
        isFullscreen && "!h-screen !top-0"
      )}
      onMouseMove={() => {
        if (!isCollapsed) {
          setShowControls(true);
          if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
          }
          if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
              setShowControls(false);
            }, 3000);
          }
        }
      }}
    >
      {/* Collapsed State - Stream Bar */}
      {isCollapsed && (
        <div 
          className="h-full flex items-center justify-between px-4 bg-gradient-to-r from-blue-600 to-purple-600 cursor-pointer hover:from-blue-500 hover:to-purple-500 transition-all duration-300"
          onClick={handleExpand}
        >
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-white font-medium">{state.title}</span>
            <div className="text-white/70 text-sm">Click to expand player</div>
          </div>
          <div className="flex items-center space-x-2">
            <ChevronUp className="w-5 h-5 text-white" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="text-white/70 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Expanded State - Full Video Player */}
      {!isCollapsed && (
        <div className="h-full flex flex-col bg-black">
          {/* Video Container */}
          <div className="flex-1 relative">
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              src={state.videoSrc}
              poster={state.poster}
              onClick={togglePlayPause}
            />

            {/* Video Controls Overlay */}
            <div
              className={clsx(
                "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 transition-opacity duration-300",
                showControls ? "opacity-100" : "opacity-0"
              )}
            >
              {/* Top Controls */}
              <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
                <h3 className="text-white font-medium text-lg">{state.title}</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCollapse}
                    className="text-white/80 hover:text-white transition-colors p-2"
                  >
                    <Minimize className="w-5 h-5" />
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    className="text-white/80 hover:text-white transition-colors p-2"
                  >
                    <Maximize className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleClose}
                    className="text-white/80 hover:text-white transition-colors p-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Center Play Button */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={togglePlayPause}
                    className="bg-white/20 backdrop-blur-sm rounded-full p-4 hover:bg-white/30 transition-all duration-200"
                  >
                    <Play className="w-12 h-12 text-white ml-1" />
                  </button>
                </div>
              )}

              {/* Bottom Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                {/* Progress Bar */}
                <div className="w-full">
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={togglePlayPause}
                      className="text-white hover:text-blue-400 transition-colors"
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={toggleMute}
                        className="text-white hover:text-blue-400 transition-colors"
                      >
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="text-white text-sm">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Slider Styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
