/**
 * MKV Format Detection and Analysis Utility
 * Provides comprehensive MKV file detection, browser compatibility checking,
 * and external player integration capabilities
 */

import { DownloadUrl } from '@/types/movie';

export interface MKVCapabilities {
  canPlayNatively: boolean;
  browserSupport: 'none' | 'limited' | 'full';
  recommendedAction: 'native' | 'external' | 'download';
  supportedCodecs: string[];
  externalPlayers: ExternalPlayer[];
}

export interface ExternalPlayer {
  name: string;
  id: string;
  protocol: string;
  icon: string;
  description: string;
  downloadUrl: string;
  isInstalled?: boolean;
}

export interface MKVAnalysis {
  isMKV: boolean;
  hasSubtitles: boolean;
  estimatedCodecs: string[];
  fileSize?: number;
  quality?: string;
  capabilities: MKVCapabilities;
}

/**
 * Detects if a source is an MKV file and analyzes its characteristics
 */
export function analyzeMKVSource(source: DownloadUrl): MKVAnalysis {
  const format = source.format.toLowerCase();
  const url = source.url.toLowerCase();
  const filename = extractFilename(source.url);
  
  const isMKV = format === 'mkv' || 
                url.includes('.mkv') || 
                filename.endsWith('.mkv');

  if (!isMKV) {
    return {
      isMKV: false,
      hasSubtitles: false,
      estimatedCodecs: [],
      capabilities: getDefaultCapabilities()
    };
  }

  // Analyze MKV characteristics from filename and metadata
  const analysis: MKVAnalysis = {
    isMKV: true,
    hasSubtitles: detectSubtitles(filename),
    estimatedCodecs: estimateCodecs(filename, source),
    quality: source.quality,
    capabilities: analyzeMKVCapabilities()
  };

  return analysis;
}

/**
 * Checks browser's native MKV support
 */
export function checkNativeMKVSupport(): MKVCapabilities {
  if (typeof window === 'undefined') {
    return getDefaultCapabilities();
  }

  const video = document.createElement('video');
  const mkvSupport = video.canPlayType('video/x-matroska');
  const webmSupport = video.canPlayType('video/webm'); // WebM is based on Matroska
  
  // Test common codecs used in MKV files
  const codecTests = [
    'video/x-matroska; codecs="avc1.42E01E, mp4a.40.2"', // H.264 + AAC
    'video/x-matroska; codecs="hev1.1.6.L93.B0, mp4a.40.2"', // H.265 + AAC
    'video/x-matroska; codecs="vp9, opus"', // VP9 + Opus
    'video/x-matroska; codecs="av01.0.04M.08, opus"' // AV1 + Opus
  ];

  const supportedCodecs = codecTests.filter(codec => {
    const support = video.canPlayType(codec);
    return support === 'probably' || support === 'maybe';
  });

  let browserSupport: 'none' | 'limited' | 'full' = 'none';
  let recommendedAction: 'native' | 'external' | 'download' = 'download';

  if (mkvSupport === 'probably' || webmSupport === 'probably') {
    browserSupport = 'full';
    recommendedAction = 'native';
  } else if (mkvSupport === 'maybe' || webmSupport === 'maybe' || supportedCodecs.length > 0) {
    browserSupport = 'limited';
    recommendedAction = 'external';
  }

  return {
    canPlayNatively: browserSupport !== 'none',
    browserSupport,
    recommendedAction,
    supportedCodecs: supportedCodecs.map(codec => codec.split('codecs="')[1]?.split('"')[0] || ''),
    externalPlayers: getAvailableExternalPlayers()
  };
}

/**
 * Gets list of available external players for MKV playback
 */
export function getAvailableExternalPlayers(): ExternalPlayer[] {
  return [
    {
      name: 'VLC Media Player',
      id: 'vlc',
      protocol: 'vlc://',
      icon: '🎬',
      description: 'Free, open-source multimedia player with excellent MKV support',
      downloadUrl: 'https://www.videolan.org/vlc/'
    },
    {
      name: 'PotPlayer',
      id: 'potplayer',
      protocol: 'potplayer://',
      icon: '📺',
      description: 'Lightweight, feature-rich media player for Windows',
      downloadUrl: 'https://potplayer.daum.net/'
    },
    {
      name: 'MPC-HC',
      id: 'mpc-hc',
      protocol: 'mpc-hc://',
      icon: '🎭',
      description: 'Classic Windows media player with extensive codec support',
      downloadUrl: 'https://github.com/clsid2/mpc-hc/releases'
    },
    {
      name: 'MPV',
      id: 'mpv',
      protocol: 'mpv://',
      icon: '⚡',
      description: 'Minimalist, high-performance media player',
      downloadUrl: 'https://mpv.io/'
    },
    {
      name: 'Kodi',
      id: 'kodi',
      protocol: 'kodi://',
      icon: '📱',
      description: 'Media center application with MKV support',
      downloadUrl: 'https://kodi.tv/'
    }
  ];
}

/**
 * Attempts to launch MKV file in external player
 */
export function launchInExternalPlayer(source: DownloadUrl, playerId: string): Promise<boolean> {
  return new Promise((resolve) => {
    const players = getAvailableExternalPlayers();
    const player = players.find(p => p.id === playerId);
    
    if (!player) {
      resolve(false);
      return;
    }

    try {
      // Try to open with custom protocol
      const protocolUrl = `${player.protocol}${encodeURIComponent(source.url)}`;
      
      // Create a temporary link and click it
      const link = document.createElement('a');
      link.href = protocolUrl;
      link.style.display = 'none';
      document.body.appendChild(link);
      
      // Set up timeout to detect if protocol handler worked
      const timeout = setTimeout(() => {
        document.body.removeChild(link);
        resolve(false);
      }, 3000);
      
      // Try to trigger the protocol handler
      link.click();
      
      // If we get here quickly, assume it worked
      setTimeout(() => {
        clearTimeout(timeout);
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        resolve(true);
      }, 500);
      
    } catch (error) {
      console.error('Failed to launch external player:', error);
      resolve(false);
    }
  });
}

/**
 * Detects if filename suggests subtitle tracks
 */
function detectSubtitles(filename: string): boolean {
  const subtitleIndicators = [
    'subs', 'subtitle', 'sub', 'cc', 'closed.caption',
    'multi.sub', 'dual.audio', 'multi.lang', 'eng.sub',
    'hindi.sub', 'tamil.sub', 'telugu.sub'
  ];
  
  const lowerFilename = filename.toLowerCase();
  return subtitleIndicators.some(indicator => lowerFilename.includes(indicator));
}

/**
 * Estimates video/audio codecs from filename patterns
 */
function estimateCodecs(filename: string, source: DownloadUrl): string[] {
  const codecs: string[] = [];
  const lowerFilename = filename.toLowerCase();
  
  // Video codecs
  if (lowerFilename.includes('h264') || lowerFilename.includes('x264')) {
    codecs.push('H.264/AVC');
  }
  if (lowerFilename.includes('h265') || lowerFilename.includes('x265') || lowerFilename.includes('hevc')) {
    codecs.push('H.265/HEVC');
  }
  if (lowerFilename.includes('vp9')) {
    codecs.push('VP9');
  }
  if (lowerFilename.includes('av1')) {
    codecs.push('AV1');
  }
  
  // Audio codecs
  if (lowerFilename.includes('aac')) {
    codecs.push('AAC');
  }
  if (lowerFilename.includes('ac3') || lowerFilename.includes('dolby')) {
    codecs.push('AC-3');
  }
  if (lowerFilename.includes('dts')) {
    codecs.push('DTS');
  }
  if (lowerFilename.includes('opus')) {
    codecs.push('Opus');
  }
  if (lowerFilename.includes('flac')) {
    codecs.push('FLAC');
  }
  
  // If no specific codecs detected, assume common ones
  if (codecs.length === 0) {
    codecs.push('H.264/AVC', 'AAC');
  }
  
  return codecs;
}

/**
 * Extracts filename from URL
 */
function extractFilename(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    return pathname.split('/').pop() || '';
  } catch {
    return url.split('/').pop() || '';
  }
}

/**
 * Analyzes MKV capabilities for current environment
 */
function analyzeMKVCapabilities(): MKVCapabilities {
  if (typeof window === 'undefined') {
    return getDefaultCapabilities();
  }
  
  return checkNativeMKVSupport();
}

/**
 * Returns default capabilities for SSR
 */
function getDefaultCapabilities(): MKVCapabilities {
  return {
    canPlayNatively: false,
    browserSupport: 'none',
    recommendedAction: 'download',
    supportedCodecs: [],
    externalPlayers: getAvailableExternalPlayers()
  };
}
