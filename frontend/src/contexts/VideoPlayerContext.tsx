'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface VideoPlayerState {
  isVisible: boolean;
  videoSrc?: string;
  title?: string;
  poster?: string;
}

interface VideoPlayerContextType {
  state: VideoPlayerState;
  showPlayer: (options?: { videoSrc?: string; title?: string; poster?: string }) => void;
  hidePlayer: () => void;
  togglePlayer: () => void;
}

const VideoPlayerContext = createContext<VideoPlayerContextType | undefined>(undefined);

export function VideoPlayerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<VideoPlayerState>({
    isVisible: false,
    videoSrc: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    title: "Demo Video Stream",
    poster: undefined
  });

  const showPlayer = (options?: { videoSrc?: string; title?: string; poster?: string }) => {
    setState(prev => ({
      ...prev,
      isVisible: true,
      ...(options?.videoSrc && { videoSrc: options.videoSrc }),
      ...(options?.title && { title: options.title }),
      ...(options?.poster && { poster: options.poster })
    }));
  };

  const hidePlayer = () => {
    setState(prev => ({
      ...prev,
      isVisible: false
    }));
  };

  const togglePlayer = () => {
    setState(prev => ({
      ...prev,
      isVisible: !prev.isVisible
    }));
  };

  return (
    <VideoPlayerContext.Provider value={{ state, showPlayer, hidePlayer, togglePlayer }}>
      {children}
    </VideoPlayerContext.Provider>
  );
}

export function useVideoPlayer() {
  const context = useContext(VideoPlayerContext);
  if (context === undefined) {
    throw new Error('useVideoPlayer must be used within a VideoPlayerProvider');
  }
  return context;
}
