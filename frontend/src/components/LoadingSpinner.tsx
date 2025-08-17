'use client';

import { Film, Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ 
  size = 'md', 
  text = 'Loading...', 
  fullScreen = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    : 'flex items-center justify-center p-8';

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div className="relative">
          <Loader2 className={`${sizeClasses[size]} text-blue-500 animate-spin mx-auto mb-4`} />
          <Film className={`${sizeClasses[size]} text-gray-600 absolute inset-0 mx-auto`} />
        </div>
        <p className={`text-gray-300 ${textSizeClasses[size]} font-medium`}>
          {text}
        </p>
      </div>
    </div>
  );
}

export function LoadingGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="bg-gray-800 aspect-[2/3] rounded-lg mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-800 rounded w-3/4"></div>
            <div className="h-3 bg-gray-800 rounded w-1/2"></div>
            <div className="flex gap-2">
              <div className="h-6 bg-gray-800 rounded w-12"></div>
              <div className="h-6 bg-gray-800 rounded w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="animate-pulse bg-gray-900 rounded-lg overflow-hidden">
      <div className="bg-gray-800 aspect-[2/3]"></div>
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-800 rounded w-3/4"></div>
        <div className="h-3 bg-gray-800 rounded w-1/2"></div>
        <div className="flex gap-2">
          <div className="h-6 bg-gray-800 rounded w-12"></div>
          <div className="h-6 bg-gray-800 rounded w-16"></div>
        </div>
      </div>
    </div>
  );
}
