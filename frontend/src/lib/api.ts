import axios from 'axios';
import { Movie, ApiResponse, SearchFilters, ApiStatus } from '@/types/movie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

console.log('🔧 API Configuration:', {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  API_BASE_URL,
  NODE_ENV: process.env.NODE_ENV
});

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    console.log('🌐 Full config:', { baseURL: config.baseURL, url: config.url, method: config.method });
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    
    // Handle specific error cases
    if (error.response?.status === 404) {
      throw new Error('Resource not found');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to server. Please check if the backend is running.');
    }
    
    throw error;
  }
);

export class MovieAPI {
  static async getAllMovies(): Promise<Movie[]> {
    try {
      console.log('🎬 MovieAPI: Fetching all movies from backend...');
      const response = await apiClient.get<ApiResponse<Movie[]>>('/movies');
      console.log('🎬 MovieAPI: Raw response:', response);
      console.log('🎬 MovieAPI: Response data:', response.data);
      console.log('🎬 MovieAPI: Response data.data:', response.data.data);
      console.log(`🎬 MovieAPI: Successfully fetched ${response.data.data.length} movies`);
      return response.data.data;
    } catch (error) {
      console.error('❌ MovieAPI: Failed to fetch movies:', error);
      throw error;
    }
  }

  static async getMovie(id: string): Promise<Movie> {
    try {
      const response = await apiClient.get<ApiResponse<Movie>>(`/movies/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching movie ${id}:`, error);
      throw error;
    }
  }

  static async searchMovies(filters: SearchFilters): Promise<Movie[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters.query) params.append('q', filters.query);
      if (filters.year) params.append('year', filters.year);
      if (filters.language) params.append('language', filters.language);
      if (filters.quality) params.append('quality', filters.quality);

      const response = await apiClient.get<ApiResponse<Movie[]>>(`/movies/search?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Error searching movies:', error);
      throw error;
    }
  }

  static async refreshMovies(): Promise<Movie[]> {
    try {
      const response = await apiClient.post<ApiResponse<Movie[]>>('/movies/refresh');
      return response.data.data;
    } catch (error) {
      console.error('Error refreshing movies:', error);
      throw error;
    }
  }

  static async getStatus(): Promise<ApiStatus> {
    try {
      const response = await apiClient.get<ApiResponse<ApiStatus['data']>>('/status');
      return {
        status: 'ok',
        data: response.data.data
      };
    } catch (error) {
      console.error('Error getting status:', error);
      throw error;
    }
  }

  static async triggerAuth(): Promise<void> {
    try {
      await apiClient.post('/auth/login');
    } catch (error) {
      console.error('Error triggering auth:', error);
      throw error;
    }
  }
}

export default MovieAPI;
