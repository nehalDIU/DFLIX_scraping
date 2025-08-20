// Example client to demonstrate API usage
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

class DiscoveryClient {
  constructor(baseUrl = API_BASE) {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 10000
    });
  }

  async getAllMovies() {
    try {
      const response = await this.client.get('/movies');
      return response.data;
    } catch (error) {
      console.error('Error fetching movies:', error.message);
      throw error;
    }
  }

  async getMovie(id) {
    try {
      const response = await this.client.get(`/movies/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching movie ${id}:`, error.message);
      throw error;
    }
  }

  async searchMovies(query, filters = {}) {
    try {
      const params = { q: query, ...filters };
      const response = await this.client.get('/movies/search', { params });
      return response.data;
    } catch (error) {
      console.error('Error searching movies:', error.message);
      throw error;
    }
  }

  async refreshMovies() {
    try {
      const response = await this.client.post('/movies/refresh');
      return response.data;
    } catch (error) {
      console.error('Error refreshing movies:', error.message);
      throw error;
    }
  }

  async getStatus() {
    try {
      const response = await this.client.get('/status');
      return response.data;
    } catch (error) {
      console.error('Error getting status:', error.message);
      throw error;
    }
  }
}

// Example usage
async function demonstrateAPI() {
  const client = new DiscoveryClient();

  try {
    console.log('🎬 Discovery FTP API Client Demo\n');

    // Get status
    console.log('📊 Checking API status...');
    const status = await client.getStatus();
    console.log(`- Server status: ${status.status}`);
    console.log(`- Movies in cache: ${status.data.moviesCount}`);
    console.log(`- Last scrape: ${status.data.lastScrapeTime}`);
    console.log(`- Is authenticated: ${status.data.isAuthenticated}\n`);

    // Get all movies
    console.log('🎭 Fetching all movies...');
    const allMovies = await client.getAllMovies();
    console.log(`- Total movies: ${allMovies.meta.total}`);
    console.log(`- Last updated: ${allMovies.meta.lastUpdated}\n`);

    // Show first few movies
    if (allMovies.data.length > 0) {
      console.log('🎯 Sample movies:');
      allMovies.data.slice(0, 5).forEach((movie, index) => {
        console.log(`${index + 1}. ${movie.title}`);
        console.log(`   Year: ${movie.year || 'Unknown'}`);
        console.log(`   Language: ${movie.language || 'Unknown'}`);
        console.log(`   Quality: ${movie.quality || 'Unknown'}`);
        console.log(`   Downloads: ${movie.downloadUrls.length} links`);
        console.log('');
      });
    }

    // Search for movies
    console.log('🔍 Searching for action movies...');
    const actionMovies = await client.searchMovies('action');
    console.log(`- Found ${actionMovies.data.length} action movies\n`);

    // Search with filters
    console.log('🔍 Searching for 2023 movies...');
    const recentMovies = await client.searchMovies('', { year: '2023' });
    console.log(`- Found ${recentMovies.data.length} movies from 2023\n`);

    // Get specific movie details
    if (allMovies.data.length > 0) {
      const firstMovie = allMovies.data[0];
      console.log(`🎬 Getting details for: ${firstMovie.title}`);
      const movieDetails = await client.getMovie(firstMovie.id);
      console.log(`- Title: ${movieDetails.data.title}`);
      console.log(`- Poster: ${movieDetails.data.poster || 'No poster'}`);
      console.log(`- Download URLs: ${movieDetails.data.downloadUrls.length}`);
      if (movieDetails.data.downloadUrls.length > 0) {
        movieDetails.data.downloadUrls.forEach((url, index) => {
          console.log(`  ${index + 1}. ${url.quality} ${url.format} - ${url.url}`);
        });
      }
      console.log('');
    }

    console.log('✅ Demo completed successfully!');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the server is running:');
      console.log('   cd backend && npm start');
    }
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demonstrateAPI();
}

module.exports = DiscoveryClient;
