/**
 * Video Proxy Utility
 * Handles conversion of direct video URLs to proxied URLs for CORS compatibility
 */

import { DownloadUrl } from '@/types/movie';

/**
 * Convert a direct video URL to a proxied URL
 */
export function getProxiedVideoUrl(url: string): string {
  // If URL is already proxied, return as-is
  if (url.includes('/proxy/video')) {
    return url;
  }

  // Only proxy Discovery FTP URLs
  if (!url.includes('discoveryftp.net')) {
    return url;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const baseUrl = apiUrl.replace('/api', '');
  
  return `${baseUrl}/proxy/video?url=${encodeURIComponent(url)}`;
}

/**
 * Convert an array of download URLs to use proxy
 */
export function getProxiedSources(sources: DownloadUrl[]): DownloadUrl[] {
  return sources.map(source => ({
    ...source,
    url: getProxiedVideoUrl(source.url)
  }));
}

/**
 * Check if a URL needs proxying
 */
export function needsProxy(url: string): boolean {
  return url.includes('discoveryftp.net') && !url.includes('/proxy/video');
}

/**
 * Get the original URL from a proxied URL
 */
export function getOriginalUrl(proxiedUrl: string): string {
  if (!proxiedUrl.includes('/proxy/video')) {
    return proxiedUrl;
  }

  try {
    const urlObj = new URL(proxiedUrl);
    const originalUrl = urlObj.searchParams.get('url');
    return originalUrl || proxiedUrl;
  } catch {
    return proxiedUrl;
  }
}

/**
 * Test if video proxy is available
 */
export async function testVideoProxy(): Promise<boolean> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const baseUrl = apiUrl.replace('/api', '');
    
    const response = await fetch(`${baseUrl}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
