export interface DownloadUrl {
  url: string;
  quality: string;
  format: string;
  label?: string;
}

export interface Movie {
  id: string;
  title: string;
  poster?: string;
  year?: string;
  language?: string;
  detailUrl?: string;
  downloadUrls?: DownloadUrl[];
  genres?: string[];
  rating?: string;
  size?: string;
  quality?: string;
  description?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total: number;
    lastUpdated: string;
    isAuthenticated?: boolean;
  };
  error?: string;
  message?: string;
}

export interface SearchFilters {
  query?: string;
  year?: string;
  language?: string;
  quality?: string;
}

export interface ApiStatus {
  status: string;
  data: {
    isAuthenticated: boolean;
    lastAuthTime: string;
    moviesCount: number;
    lastScrapeTime: string;
    uptime: number;
    version: string;
  };
}
