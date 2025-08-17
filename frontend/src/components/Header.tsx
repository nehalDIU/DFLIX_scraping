'use client';

import { useState, useEffect } from 'react';
import { Film, Wifi, WifiOff, Clock, Database } from 'lucide-react';
import MovieAPI from '@/lib/api';

export default function Header() {
  const [status, setStatus] = useState<{
    isOnline: boolean;
    moviesCount: number;
    lastUpdated: string | null;
    isAuthenticated: boolean;
  }>({
    isOnline: false,
    moviesCount: 0,
    lastUpdated: null,
    isAuthenticated: false
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const statusData = await MovieAPI.getStatus();
        setStatus({
          isOnline: true,
          moviesCount: statusData.data.moviesCount,
          lastUpdated: statusData.data.lastScrapeTime,
          isAuthenticated: statusData.data.isAuthenticated
        });
      } catch (error) {
        setStatus(prev => ({ ...prev, isOnline: false }));
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const formatLastUpdated = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
              <Film className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Discovery Movies</h1>
              <p className="text-xs text-gray-400 hidden sm:block">Stream & Download Movies</p>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {status.isOnline ? (
                <div className="flex items-center gap-1 text-green-400">
                  <Wifi className="w-4 h-4" />
                  <span className="text-xs hidden sm:inline">Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-400">
                  <WifiOff className="w-4 h-4" />
                  <span className="text-xs hidden sm:inline">Offline</span>
                </div>
              )}
            </div>

            {/* Authentication Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${status.isAuthenticated ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-xs text-gray-400 hidden md:inline">
                {status.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
              </span>
            </div>

            {/* Movie Count */}
            <div className="flex items-center gap-1 text-gray-400">
              <Database className="w-4 h-4" />
              <span className="text-xs">{status.moviesCount}</span>
            </div>

            {/* Last Updated */}
            <div className="flex items-center gap-1 text-gray-400">
              <Clock className="w-4 h-4" />
              <span className="text-xs hidden lg:inline">
                {formatLastUpdated(status.lastUpdated)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
