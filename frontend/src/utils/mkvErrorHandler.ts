/**
 * MKV Error Handling Utility
 * Provides comprehensive error handling and user guidance for MKV playback scenarios
 */

export interface MKVError {
  code: string;
  type: 'playback' | 'format' | 'network' | 'external' | 'browser';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  userMessage: string;
  suggestions: string[];
  canRetry: boolean;
  fallbackOptions: FallbackOption[];
}

export interface FallbackOption {
  type: 'external' | 'download' | 'alternative' | 'browser';
  label: string;
  description: string;
  action: string;
  priority: number;
}

/**
 * Error codes for different MKV playback scenarios
 */
export const MKV_ERROR_CODES = {
  // Browser compatibility errors
  BROWSER_NOT_SUPPORTED: 'BROWSER_NOT_SUPPORTED',
  CODEC_NOT_SUPPORTED: 'CODEC_NOT_SUPPORTED',
  FORMAT_NOT_SUPPORTED: 'FORMAT_NOT_SUPPORTED',
  
  // Network and loading errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  LOADING_TIMEOUT: 'LOADING_TIMEOUT',
  CORS_ERROR: 'CORS_ERROR',
  
  // External player errors
  EXTERNAL_PLAYER_NOT_FOUND: 'EXTERNAL_PLAYER_NOT_FOUND',
  PROTOCOL_NOT_SUPPORTED: 'PROTOCOL_NOT_SUPPORTED',
  LAUNCH_FAILED: 'LAUNCH_FAILED',
  
  // File format errors
  CORRUPTED_FILE: 'CORRUPTED_FILE',
  UNSUPPORTED_CODEC: 'UNSUPPORTED_CODEC',
  ENCRYPTED_CONTENT: 'ENCRYPTED_CONTENT',
  
  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED'
} as const;

/**
 * Analyzes an error and returns structured error information with suggestions
 */
export function analyzeMKVError(error: any, context?: any): MKVError {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  const errorCode = error?.code || error?.name || 'UNKNOWN_ERROR';
  
  // Browser compatibility errors
  if (errorMessage.includes('not supported') || errorMessage.includes('canPlayType')) {
    return createError(
      MKV_ERROR_CODES.FORMAT_NOT_SUPPORTED,
      'format',
      'high',
      'Browser does not support MKV format',
      'Your browser cannot play this MKV file directly',
      [
        'Try using an external media player like VLC or PotPlayer',
        'Download the file and play it with a desktop media player',
        'Use a different browser that supports more video formats',
        'Convert the file to MP4 format for better browser compatibility'
      ],
      false,
      [
        {
          type: 'external',
          label: 'Open in VLC',
          description: 'Launch VLC Media Player for best MKV support',
          action: 'launch_vlc',
          priority: 1
        },
        {
          type: 'download',
          label: 'Download File',
          description: 'Download and play with your preferred media player',
          action: 'download',
          priority: 2
        },
        {
          type: 'browser',
          label: 'Try Different Browser',
          description: 'Some browsers have better video format support',
          action: 'browser_suggestion',
          priority: 3
        }
      ]
    );
  }
  
  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorCode === 'NetworkError') {
    return createError(
      MKV_ERROR_CODES.NETWORK_ERROR,
      'network',
      'medium',
      'Network error while loading video',
      'Unable to load the video due to network issues',
      [
        'Check your internet connection',
        'Try refreshing the page',
        'Download the file for offline viewing',
        'Try again in a few minutes'
      ],
      true,
      [
        {
          type: 'download',
          label: 'Download for Offline',
          description: 'Download the file to watch without network issues',
          action: 'download',
          priority: 1
        }
      ]
    );
  }
  
  // File not found errors
  if (errorMessage.includes('404') || errorMessage.includes('not found') || errorCode === 'NotFoundError') {
    return createError(
      MKV_ERROR_CODES.FILE_NOT_FOUND,
      'network',
      'high',
      'Video file not found',
      'The video file is no longer available at this location',
      [
        'The file may have been moved or deleted',
        'Try refreshing the movie list',
        'Contact the administrator if the issue persists',
        'Look for alternative download links'
      ],
      false,
      [
        {
          type: 'alternative',
          label: 'Find Alternative',
          description: 'Look for other quality options or sources',
          action: 'find_alternative',
          priority: 1
        }
      ]
    );
  }
  
  // External player errors
  if (errorMessage.includes('protocol') || errorMessage.includes('external player')) {
    return createError(
      MKV_ERROR_CODES.EXTERNAL_PLAYER_NOT_FOUND,
      'external',
      'medium',
      'External player not available',
      'The requested media player is not installed or available',
      [
        'Install the recommended media player (VLC, PotPlayer, etc.)',
        'Try a different external player',
        'Download the file and open it manually',
        'Use the browser player if available'
      ],
      false,
      [
        {
          type: 'external',
          label: 'Install VLC',
          description: 'Download and install VLC Media Player',
          action: 'install_vlc',
          priority: 1
        },
        {
          type: 'download',
          label: 'Download File',
          description: 'Download and open with any installed media player',
          action: 'download',
          priority: 2
        }
      ]
    );
  }
  
  // CORS errors
  if (errorMessage.includes('CORS') || errorMessage.includes('cross-origin')) {
    return createError(
      MKV_ERROR_CODES.CORS_ERROR,
      'network',
      'high',
      'Cross-origin request blocked',
      'Browser security settings prevent direct video playback',
      [
        'Use the download option instead of streaming',
        'Try an external media player',
        'Contact the administrator about CORS configuration'
      ],
      false,
      [
        {
          type: 'download',
          label: 'Download Instead',
          description: 'Download the file to bypass browser restrictions',
          action: 'download',
          priority: 1
        },
        {
          type: 'external',
          label: 'Use External Player',
          description: 'External players can bypass browser restrictions',
          action: 'launch_external',
          priority: 2
        }
      ]
    );
  }
  
  // Default unknown error
  return createError(
    MKV_ERROR_CODES.UNKNOWN_ERROR,
    'playback',
    'medium',
    errorMessage,
    'An unexpected error occurred while trying to play the video',
    [
      'Try refreshing the page',
      'Use an external media player',
      'Download the file for offline viewing',
      'Try a different quality or format if available'
    ],
    true,
    [
      {
        type: 'external',
        label: 'Try External Player',
        description: 'External players often handle problematic files better',
        action: 'launch_external',
        priority: 1
      },
      {
        type: 'download',
        label: 'Download File',
        description: 'Download and play with a desktop media player',
        action: 'download',
        priority: 2
      }
    ]
  );
}

/**
 * Creates a structured error object
 */
function createError(
  code: string,
  type: MKVError['type'],
  severity: MKVError['severity'],
  message: string,
  userMessage: string,
  suggestions: string[],
  canRetry: boolean,
  fallbackOptions: FallbackOption[]
): MKVError {
  return {
    code,
    type,
    severity,
    message,
    userMessage,
    suggestions,
    canRetry,
    fallbackOptions: fallbackOptions.sort((a, b) => a.priority - b.priority)
  };
}

/**
 * Gets user-friendly error message based on error type
 */
export function getErrorDisplayMessage(error: MKVError): string {
  switch (error.severity) {
    case 'critical':
      return `❌ ${error.userMessage}`;
    case 'high':
      return `⚠️ ${error.userMessage}`;
    case 'medium':
      return `⚡ ${error.userMessage}`;
    case 'low':
      return `ℹ️ ${error.userMessage}`;
    default:
      return error.userMessage;
  }
}

/**
 * Gets recommended action based on error type
 */
export function getRecommendedAction(error: MKVError): FallbackOption | null {
  return error.fallbackOptions[0] || null;
}

/**
 * Checks if error is recoverable
 */
export function isRecoverableError(error: MKVError): boolean {
  return error.canRetry || error.fallbackOptions.length > 0;
}

/**
 * Gets browser-specific recommendations
 */
export function getBrowserSpecificRecommendations(): string[] {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  
  if (userAgent.includes('Chrome')) {
    return [
      'Chrome has good MKV support with proper codecs',
      'Enable hardware acceleration in Chrome settings',
      'Try Chrome Canary for experimental codec support'
    ];
  }
  
  if (userAgent.includes('Firefox')) {
    return [
      'Firefox has limited MKV support',
      'Consider using Chrome or Edge for better video support',
      'Install additional codec packs if available'
    ];
  }
  
  if (userAgent.includes('Safari')) {
    return [
      'Safari has very limited MKV support',
      'Use external players like VLC for MKV files',
      'Consider using Chrome or Firefox for better compatibility'
    ];
  }
  
  if (userAgent.includes('Edge')) {
    return [
      'Edge has good modern codec support',
      'Enable hardware acceleration in Edge settings',
      'Try the legacy Edge if issues persist'
    ];
  }
  
  return [
    'Use a modern browser for better video support',
    'Consider external media players for MKV files',
    'Download files for offline viewing with desktop players'
  ];
}
