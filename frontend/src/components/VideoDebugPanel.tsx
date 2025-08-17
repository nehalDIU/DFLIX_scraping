'use client';

import { useEffect, useState } from 'react';
import { DownloadUrl } from '@/types/movie';

interface VideoDebugPanelProps {
  sources: DownloadUrl[];
}

export default function VideoDebugPanel({ sources }: VideoDebugPanelProps) {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [proxyTest, setProxyTest] = useState<string>('Not tested');

  useEffect(() => {
    testBackendConnectivity();
  }, []);

  const testBackendConnectivity = async () => {
    try {
      const response = await fetch('http://localhost:3001/health');
      if (response.ok) {
        setBackendStatus('online');
        const data = await response.json();
        console.log('Backend health check:', data);
      } else {
        setBackendStatus('offline');
      }
    } catch (error) {
      console.error('Backend connectivity test failed:', error);
      setBackendStatus('offline');
    }
  };

  const testVideoProxy = async () => {
    if (sources.length === 0) {
      setProxyTest('No sources available');
      return;
    }

    const testUrl = sources[0].url;
    const proxyUrl = `http://localhost:3001/proxy/video?url=${encodeURIComponent(testUrl)}`;

    try {
      setProxyTest('Testing...');
      const response = await fetch(proxyUrl, {
        method: 'HEAD',
        headers: {
          'Range': 'bytes=0-1023' // Test range request
        }
      });

      if (response.ok) {
        const contentLength = response.headers.get('content-length');
        const acceptRanges = response.headers.get('accept-ranges');
        setProxyTest(`SUCCESS (${response.status}) - ${contentLength ? `${Math.round(parseInt(contentLength) / 1024 / 1024)}MB` : 'Unknown size'} - Ranges: ${acceptRanges || 'No'}`);
      } else {
        setProxyTest(`FAILED (${response.status}): ${response.statusText}`);
      }
    } catch (error) {
      setProxyTest(`ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testDirectVideo = () => {
    if (sources.length === 0) return;

    const testUrl = sources[0].url;
    const proxyUrl = `http://localhost:3001/proxy/video?url=${encodeURIComponent(testUrl)}`;

    // Open proxy URL in new tab for direct testing
    window.open(proxyUrl, '_blank');
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mt-4">
      <h3 className="text-white font-medium mb-3">🔧 Video Debug Panel</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Backend Status:</span>
          <span className={`font-medium ${
            backendStatus === 'online' ? 'text-green-400' : 
            backendStatus === 'offline' ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {backendStatus === 'checking' ? '⏳ Checking...' : 
             backendStatus === 'online' ? '✅ Online' : '❌ Offline'}
          </span>
          <button 
            onClick={testBackendConnectivity}
            className="text-blue-400 hover:text-blue-300 text-xs underline"
          >
            Retest
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-400">Video Proxy:</span>
          <span className="text-white text-xs">{proxyTest}</span>
          <button
            onClick={testVideoProxy}
            className="text-blue-400 hover:text-blue-300 text-xs underline"
            disabled={sources.length === 0}
          >
            Test
          </button>
          <button
            onClick={testDirectVideo}
            className="text-green-400 hover:text-green-300 text-xs underline"
            disabled={sources.length === 0}
          >
            Open
          </button>
        </div>

        <div className="text-gray-400">
          <span>Sources: </span>
          <span className="text-white">{sources.length}</span>
        </div>

        {sources.length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer text-gray-400">Source URLs</summary>
            <div className="mt-1 space-y-1">
              {sources.map((source, index) => (
                <div key={index} className="text-xs text-gray-500 break-all">
                  <span className="text-gray-400">{source.quality} {source.format}:</span>
                  <br />
                  {source.url}
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
