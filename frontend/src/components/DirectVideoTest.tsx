'use client';

import { useState } from 'react';
import { DownloadUrl } from '@/types/movie';
import { getProxiedVideoUrl } from '@/utils/videoProxy';

interface DirectVideoTestProps {
  sources: DownloadUrl[];
}

export default function DirectVideoTest({ sources }: DirectVideoTestProps) {
  const [testResult, setTestResult] = useState<string>('Not tested');
  const [isLoading, setIsLoading] = useState(false);

  const testDirectVideoLoad = async () => {
    if (sources.length === 0) return;

    setIsLoading(true);
    setTestResult('Testing...');

    const source = sources[0];
    const proxiedUrl = getProxiedVideoUrl(source.url);

    try {
      // Create a test video element
      const testVideo = document.createElement('video');
      testVideo.preload = 'metadata';
      testVideo.crossOrigin = 'anonymous';

      let timeoutId: NodeJS.Timeout;
      let resolved = false;

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        testVideo.remove();
      };

      const promise = new Promise<string>((resolve) => {
        testVideo.addEventListener('loadedmetadata', () => {
          if (!resolved) {
            resolved = true;
            cleanup();
            resolve(`SUCCESS: ${testVideo.duration?.toFixed(1)}s duration, ${testVideo.videoWidth}x${testVideo.videoHeight}`);
          }
        });

        testVideo.addEventListener('canplay', () => {
          if (!resolved) {
            resolved = true;
            cleanup();
            resolve(`SUCCESS: Video can play (${testVideo.readyState})`);
          }
        });

        testVideo.addEventListener('error', (e) => {
          if (!resolved) {
            resolved = true;
            cleanup();
            const error = (e.target as HTMLVideoElement).error;
            resolve(`ERROR: ${error?.message || 'Unknown error'} (code: ${error?.code})`);
          }
        });

        // Set timeout
        timeoutId = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            cleanup();
            resolve('TIMEOUT: Video did not load within 10 seconds');
          }
        }, 10000);

        // Start loading
        testVideo.src = proxiedUrl;
        testVideo.load();
      });

      const result = await promise;
      setTestResult(result);

    } catch (error) {
      setTestResult(`EXCEPTION: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testNetworkRequest = async () => {
    if (sources.length === 0) return;

    setIsLoading(true);
    setTestResult('Testing network...');

    const source = sources[0];
    const proxiedUrl = getProxiedVideoUrl(source.url);

    try {
      const response = await fetch(proxiedUrl, {
        method: 'HEAD',
        headers: {
          'Range': 'bytes=0-1023'
        }
      });

      if (response.ok) {
        const headers = {
          'content-length': response.headers.get('content-length'),
          'content-type': response.headers.get('content-type'),
          'accept-ranges': response.headers.get('accept-ranges'),
          'content-range': response.headers.get('content-range')
        };

        setTestResult(`NETWORK SUCCESS: ${response.status} ${response.statusText}\nHeaders: ${JSON.stringify(headers, null, 2)}`);
      } else {
        setTestResult(`NETWORK FAILED: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setTestResult(`NETWORK ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (process.env.NODE_ENV !== 'development' || sources.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mt-4">
      <h3 className="text-white font-medium mb-3">🧪 Direct Video Test</h3>
      
      <div className="space-y-3">
        <div className="flex gap-2">
          <button
            onClick={testDirectVideoLoad}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-2 rounded text-sm"
          >
            {isLoading ? 'Testing...' : 'Test Video Element'}
          </button>
          
          <button
            onClick={testNetworkRequest}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 py-2 rounded text-sm"
          >
            {isLoading ? 'Testing...' : 'Test Network'}
          </button>
        </div>

        <div className="bg-gray-900 rounded p-3">
          <div className="text-xs text-gray-400 mb-1">Test Result:</div>
          <pre className="text-xs text-white whitespace-pre-wrap">{testResult}</pre>
        </div>

        <div className="text-xs text-gray-400">
          <div>Source: {sources[0]?.url}</div>
          <div>Proxy: {getProxiedVideoUrl(sources[0]?.url || '')}</div>
        </div>
      </div>
    </div>
  );
}
