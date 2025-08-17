/**
 * External Player Integration Utility
 * Provides seamless integration with popular media players for MKV and other video formats
 */

import { DownloadUrl } from '@/types/movie';

export interface PlayerProtocol {
  name: string;
  id: string;
  protocols: string[];
  registryKeys?: string[];
  executableNames?: string[];
  icon: string;
  description: string;
  downloadUrl: string;
  features: string[];
  priority: number;
}

export interface LaunchResult {
  success: boolean;
  method: 'protocol' | 'download' | 'clipboard';
  message: string;
  error?: string;
}

/**
 * Comprehensive list of supported external players with multiple launch methods
 */
export const EXTERNAL_PLAYERS: PlayerProtocol[] = [
  {
    name: 'VLC Media Player',
    id: 'vlc',
    protocols: ['vlc://', 'vlc-media://'],
    registryKeys: ['HKEY_CLASSES_ROOT\\vlc', 'HKEY_LOCAL_MACHINE\\SOFTWARE\\VideoLAN\\VLC'],
    executableNames: ['vlc.exe', 'vlc'],
    icon: '🎬',
    description: 'Free, open-source multimedia player with excellent codec support',
    downloadUrl: 'https://www.videolan.org/vlc/',
    features: ['MKV Support', 'Subtitle Support', 'Network Streaming', 'Cross-platform'],
    priority: 1
  },
  {
    name: 'PotPlayer',
    id: 'potplayer',
    protocols: ['potplayer://', 'pot://'],
    registryKeys: ['HKEY_CLASSES_ROOT\\PotPlayer'],
    executableNames: ['PotPlayerMini64.exe', 'PotPlayerMini.exe', 'PotPlayer64.exe', 'PotPlayer.exe'],
    icon: '📺',
    description: 'Lightweight, feature-rich media player for Windows',
    downloadUrl: 'https://potplayer.daum.net/',
    features: ['Hardware Acceleration', 'Advanced Filters', 'Subtitle Customization', 'Windows Only'],
    priority: 2
  },
  {
    name: 'MPC-HC',
    id: 'mpc-hc',
    protocols: ['mpc-hc://', 'mpc://'],
    registryKeys: ['HKEY_CLASSES_ROOT\\mpc-hc'],
    executableNames: ['mpc-hc64.exe', 'mpc-hc.exe'],
    icon: '🎭',
    description: 'Classic Windows media player with extensive codec support',
    downloadUrl: 'https://github.com/clsid2/mpc-hc/releases',
    features: ['Lightweight', 'Classic Interface', 'Extensive Codecs', 'Windows Only'],
    priority: 3
  },
  {
    name: 'MPV',
    id: 'mpv',
    protocols: ['mpv://', 'mpv-player://'],
    registryKeys: ['HKEY_CLASSES_ROOT\\mpv'],
    executableNames: ['mpv.exe', 'mpv'],
    icon: '⚡',
    description: 'Minimalist, high-performance media player',
    downloadUrl: 'https://mpv.io/',
    features: ['High Performance', 'Command Line', 'Scriptable', 'Cross-platform'],
    priority: 4
  },
  {
    name: 'Kodi',
    id: 'kodi',
    protocols: ['kodi://', 'xbmc://'],
    registryKeys: ['HKEY_CLASSES_ROOT\\kodi'],
    executableNames: ['kodi.exe', 'kodi'],
    icon: '📱',
    description: 'Media center application with comprehensive MKV support',
    downloadUrl: 'https://kodi.tv/',
    features: ['Media Center', 'Library Management', 'Add-ons', 'Cross-platform'],
    priority: 5
  },
  {
    name: 'Windows Media Player',
    id: 'wmp',
    protocols: ['wmp://', 'wmplayer://'],
    registryKeys: ['HKEY_CLASSES_ROOT\\WMP11.AssocFile.MP4'],
    executableNames: ['wmplayer.exe'],
    icon: '🪟',
    description: 'Built-in Windows media player (limited MKV support)',
    downloadUrl: 'https://support.microsoft.com/en-us/windows/get-windows-media-player',
    features: ['Built-in Windows', 'Basic Playback', 'Limited Codecs', 'Windows Only'],
    priority: 6
  },
  {
    name: 'QuickTime Player',
    id: 'quicktime',
    protocols: ['quicktime://', 'qt://'],
    registryKeys: [],
    executableNames: ['QuickTime Player.app'],
    icon: '🍎',
    description: 'Apple\'s media player for macOS (limited MKV support)',
    downloadUrl: 'https://support.apple.com/quicktime',
    features: ['macOS Built-in', 'Basic Playback', 'Limited Codecs', 'macOS Only'],
    priority: 7
  }
];

/**
 * Attempts to launch video in external player using multiple methods
 */
export async function launchInExternalPlayer(
  source: DownloadUrl, 
  playerId: string,
  fallbackToDownload: boolean = true
): Promise<LaunchResult> {
  const player = EXTERNAL_PLAYERS.find(p => p.id === playerId);
  
  if (!player) {
    return {
      success: false,
      method: 'protocol',
      message: 'Player not found',
      error: `Unknown player ID: ${playerId}`
    };
  }

  // Try protocol handlers first
  for (const protocol of player.protocols) {
    try {
      const result = await tryProtocolLaunch(source.url, protocol, player.name);
      if (result.success) {
        return result;
      }
    } catch (error) {
      console.warn(`Protocol ${protocol} failed:`, error);
    }
  }

  // Try clipboard method for better compatibility
  try {
    const clipboardResult = await tryClipboardMethod(source.url, player);
    if (clipboardResult.success) {
      return clipboardResult;
    }
  } catch (error) {
    console.warn('Clipboard method failed:', error);
  }

  // Fallback to download if enabled
  if (fallbackToDownload) {
    return {
      success: true,
      method: 'download',
      message: `Download started. Open the file with ${player.name} after download completes.`,
    };
  }

  return {
    success: false,
    method: 'protocol',
    message: `Failed to launch ${player.name}`,
    error: 'All launch methods failed. Make sure the player is installed and try again.'
  };
}

/**
 * Attempts to launch using protocol handler
 */
async function tryProtocolLaunch(url: string, protocol: string, playerName: string): Promise<LaunchResult> {
  return new Promise((resolve) => {
    try {
      const protocolUrl = `${protocol}${encodeURIComponent(url)}`;
      
      // Create invisible iframe to trigger protocol
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = protocolUrl;
      document.body.appendChild(iframe);
      
      // Set up detection mechanism
      let resolved = false;
      const cleanup = () => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      };
      
      // If page doesn't blur within timeout, assume failure
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve({
            success: false,
            method: 'protocol',
            message: `Protocol handler for ${playerName} not available`,
            error: 'Protocol not registered or player not installed'
          });
        }
      }, 2000);
      
      // Listen for page blur (indicates app launch)
      const handleBlur = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          cleanup();
          window.removeEventListener('blur', handleBlur);
          resolve({
            success: true,
            method: 'protocol',
            message: `Successfully launched ${playerName}!`
          });
        }
      };
      
      window.addEventListener('blur', handleBlur);
      
      // Also try direct window.open as fallback
      setTimeout(() => {
        if (!resolved) {
          try {
            window.open(protocolUrl, '_self');
          } catch (e) {
            // Ignore errors from window.open
          }
        }
      }, 100);
      
    } catch (error) {
      resolve({
        success: false,
        method: 'protocol',
        message: 'Protocol launch failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

/**
 * Attempts to use clipboard method for better compatibility
 */
async function tryClipboardMethod(url: string, player: PlayerProtocol): Promise<LaunchResult> {
  try {
    // Copy URL to clipboard
    await navigator.clipboard.writeText(url);
    
    // Show instructions to user
    return {
      success: true,
      method: 'clipboard',
      message: `Video URL copied to clipboard! Open ${player.name} and paste the URL to play.`
    };
  } catch (error) {
    throw new Error('Clipboard access denied');
  }
}

/**
 * Detects which external players are likely installed
 */
export async function detectInstalledPlayers(): Promise<PlayerProtocol[]> {
  const detectedPlayers: PlayerProtocol[] = [];
  
  for (const player of EXTERNAL_PLAYERS) {
    const isInstalled = await isPlayerInstalled(player);
    if (isInstalled) {
      detectedPlayers.push(player);
    }
  }
  
  // Sort by priority
  return detectedPlayers.sort((a, b) => a.priority - b.priority);
}

/**
 * Checks if a specific player is likely installed
 */
async function isPlayerInstalled(player: PlayerProtocol): Promise<boolean> {
  // Try protocol detection
  for (const protocol of player.protocols) {
    if (await testProtocolSupport(protocol)) {
      return true;
    }
  }
  
  // Platform-specific detection
  if (typeof navigator !== 'undefined') {
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Windows-specific players
    if (userAgent.includes('windows')) {
      if (player.id === 'wmp') return true; // WMP is built-in
      
      // Check for common installation indicators
      if (player.id === 'vlc' && userAgent.includes('vlc')) return true;
    }
    
    // macOS-specific players
    if (userAgent.includes('mac')) {
      if (player.id === 'quicktime') return true; // QuickTime is built-in
    }
  }
  
  return false;
}

/**
 * Tests if a protocol is supported
 */
async function testProtocolSupport(protocol: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const testUrl = `${protocol}test`;
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = testUrl;
      
      let resolved = false;
      const cleanup = () => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      };
      
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(false);
        }
      }, 1000);
      
      const handleLoad = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          cleanup();
          resolve(true);
        }
      };
      
      iframe.onload = handleLoad;
      iframe.onerror = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          cleanup();
          resolve(false);
        }
      };
      
      document.body.appendChild(iframe);
      
    } catch (error) {
      resolve(false);
    }
  });
}

/**
 * Gets recommended players for specific video formats
 */
export function getRecommendedPlayersForFormat(format: string): PlayerProtocol[] {
  const formatLower = format.toLowerCase();
  
  // MKV-specific recommendations
  if (formatLower === 'mkv') {
    return EXTERNAL_PLAYERS.filter(p => 
      ['vlc', 'potplayer', 'mpc-hc', 'mpv', 'kodi'].includes(p.id)
    ).sort((a, b) => a.priority - b.priority);
  }
  
  // General video format recommendations
  return EXTERNAL_PLAYERS.sort((a, b) => a.priority - b.priority);
}

/**
 * Creates a download link with proper filename
 */
export function createDownloadLink(source: DownloadUrl, title?: string): string {
  const filename = title ? 
    `${title.replace(/[^a-zA-Z0-9\s-_]/g, '')}.${source.format}` : 
    `video.${source.format}`;
  
  const link = document.createElement('a');
  link.href = source.url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  return filename;
}
