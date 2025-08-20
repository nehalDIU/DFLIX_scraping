const express = require('express');
const scraperService = require('../services/scraperService');
const authService = require('../services/authService');
const mockDataService = require('../services/mockDataService');

const router = express.Router();

/**
 * GET /api/movies
 * Returns all scraped movies as JSON array
 */
router.get('/movies', async (req, res) => {
  try {
    const movies = scraperService.getMovies();
    const lastScrapeTime = scraperService.getLastScrapeTime();
    
    res.json({
      success: true,
      data: movies,
      meta: {
        total: movies.length,
        lastUpdated: lastScrapeTime,
        isAuthenticated: authService.isAuthenticated
      }
    });
  } catch (error) {
    console.error('Error fetching movies:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch movies',
      message: error.message
    });
  }
});

/**
 * GET /api/movies/debug
 * Debug endpoint to check video content status
 */
router.get('/movies/debug', (req, res) => {
  try {
    const movies = scraperService.getMovies();

    // Get sample of movies with and without video
    const moviesWithVideo = movies.filter(movie => movie.downloadUrls && movie.downloadUrls.length > 0);
    const moviesWithoutVideo = movies.filter(movie => !movie.downloadUrls || movie.downloadUrls.length === 0);

    // Sample movies for debugging
    const sampleWithVideo = moviesWithVideo.slice(0, 3).map(movie => ({
      id: movie.id,
      title: movie.title,
      year: movie.year,
      downloadUrlsCount: movie.downloadUrls ? movie.downloadUrls.length : 0,
      downloadUrlsType: Array.isArray(movie.downloadUrls) ? 'array' : typeof movie.downloadUrls,
      firstDownloadUrl: movie.downloadUrls && movie.downloadUrls.length > 0 ? movie.downloadUrls[0] : null
    }));

    const sampleWithoutVideo = moviesWithoutVideo.slice(0, 3).map(movie => ({
      id: movie.id,
      title: movie.title,
      year: movie.year,
      downloadUrlsCount: movie.downloadUrls ? movie.downloadUrls.length : 0,
      downloadUrlsType: Array.isArray(movie.downloadUrls) ? 'array' : typeof movie.downloadUrls,
      downloadUrls: movie.downloadUrls
    }));

    res.json({
      success: true,
      data: {
        totalMovies: movies.length,
        moviesWithVideo: moviesWithVideo.length,
        moviesWithoutVideo: moviesWithoutVideo.length,
        sampleWithVideo,
        sampleWithoutVideo
      }
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get debug info',
      message: error.message
    });
  }
});

/**
 * GET /api/movies/:id
 * Returns a specific movie by ID
 */
router.get('/movies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const movies = scraperService.getMovies();
    const movie = movies.find(m => m.id === id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        error: 'Movie not found'
      });
    }

    res.json({
      success: true,
      data: movie
    });
  } catch (error) {
    console.error('Error fetching movie:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch movie',
      message: error.message
    });
  }
});

/**
 * POST /api/movies/refresh
 * Manually trigger a refresh of the movies list
 */
router.post('/movies/refresh', async (req, res) => {
  try {
    console.log('Manual refresh triggered');
    const movies = await scraperService.scrapeMovies();

    res.json({
      success: true,
      message: 'Movies refreshed successfully',
      data: movies,
      meta: {
        total: movies.length,
        lastUpdated: scraperService.getLastScrapeTime()
      }
    });
  } catch (error) {
    console.error('Error refreshing movies:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh movies',
      message: error.message
    });
  }
});

/**
 * POST /api/movies/enrich/:id
 * Manually trigger enrichment for a specific movie
 */
router.post('/movies/enrich/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const movies = scraperService.getMovies();
    const movie = movies.find(m => m.id === id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        error: 'Movie not found'
      });
    }

    console.log(`Manual enrichment triggered for movie: ${movie.title}`);

    // Create authenticated client
    const authService = require('../services/authService');
    await authService.ensureAuthenticated();
    const client = authService.getClient();

    // Enrich the movie data
    await scraperService.enrichMovieData(client, movie);

    res.json({
      success: true,
      message: `Movie "${movie.title}" enriched successfully`,
      data: movie,
      meta: {
        videoLinksFound: movie.downloadUrls.length
      }
    });
  } catch (error) {
    console.error('Error enriching movie:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to enrich movie',
      message: error.message
    });
  }
});

/**
 * POST /api/movies/enrich-all
 * Manually trigger enrichment for all movies without video content
 */
router.post('/movies/enrich-all', async (req, res) => {
  try {
    console.log('Manual enrichment triggered for all movies without video content');

    const movies = scraperService.getMovies();
    const moviesWithoutVideo = movies.filter(movie => !movie.downloadUrls || movie.downloadUrls.length === 0);

    console.log(`Found ${moviesWithoutVideo.length} movies without video content out of ${movies.length} total movies`);

    if (moviesWithoutVideo.length === 0) {
      return res.json({
        success: true,
        message: 'All movies already have video content',
        meta: {
          totalMovies: movies.length,
          moviesEnriched: 0,
          moviesWithVideo: movies.length
        }
      });
    }

    // Create authenticated client
    const authService = require('../services/authService');
    await authService.ensureAuthenticated();
    const client = authService.getClient();

    let enrichedCount = 0;
    let errorCount = 0;

    // Process movies in batches to avoid overwhelming the server
    const batchSize = 5;
    for (let i = 0; i < moviesWithoutVideo.length; i += batchSize) {
      const batch = moviesWithoutVideo.slice(i, i + batchSize);

      await Promise.all(batch.map(async (movie) => {
        try {
          console.log(`Enriching movie ${i + batch.indexOf(movie) + 1}/${moviesWithoutVideo.length}: ${movie.title}`);
          await scraperService.enrichMovieData(client, movie);
          if (movie.downloadUrls && movie.downloadUrls.length > 0) {
            enrichedCount++;
          }
        } catch (error) {
          console.error(`Error enriching movie ${movie.title}:`, error.message);
          errorCount++;
        }
      }));

      // Small delay between batches
      if (i + batchSize < moviesWithoutVideo.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const finalMoviesWithVideo = movies.filter(movie => movie.downloadUrls && movie.downloadUrls.length > 0).length;

    res.json({
      success: true,
      message: `Enrichment completed. ${enrichedCount} movies now have video content.`,
      meta: {
        totalMovies: movies.length,
        moviesProcessed: moviesWithoutVideo.length,
        moviesEnriched: enrichedCount,
        errors: errorCount,
        moviesWithVideo: finalMoviesWithVideo,
        moviesWithoutVideo: movies.length - finalMoviesWithVideo
      }
    });
  } catch (error) {
    console.error('Error enriching all movies:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to enrich movies',
      message: error.message
    });
  }
});



/**
 * GET /api/movies/search
 * Search movies by title, year, language, etc.
 */
router.get('/movies/search', async (req, res) => {
  try {
    const { q, year, language, quality } = req.query;
    let movies = scraperService.getMovies();
    
    if (q) {
      const searchTerm = q.toLowerCase();
      movies = movies.filter(movie =>
        movie.title.toLowerCase().includes(searchTerm) ||
        (movie.description && movie.description.toLowerCase().includes(searchTerm)) ||
        (movie.genres && movie.genres.some(genre => genre.toLowerCase().includes(searchTerm)))
      );
    }
    
    if (year) {
      movies = movies.filter(movie => movie.year === year);
    }
    
    if (language) {
      movies = movies.filter(movie => 
        movie.language.toLowerCase() === language.toLowerCase()
      );
    }
    
    if (quality) {
      movies = movies.filter(movie => 
        movie.quality.toLowerCase().includes(quality.toLowerCase())
      );
    }
    
    res.json({
      success: true,
      data: movies,
      meta: {
        total: movies.length,
        query: { q, year, language, quality }
      }
    });
  } catch (error) {
    console.error('Error searching movies:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to search movies',
      message: error.message
    });
  }
});

/**
 * GET /api/status
 * Returns API status and authentication info
 */
router.get('/status', async (req, res) => {
  try {
    const movies = scraperService.getMovies();
    const lastScrapeTime = scraperService.getLastScrapeTime();
    const mockMovies = mockDataService.getMovies();

    // Check if we're using mock data by comparing movie IDs
    const usingMockData = movies.length > 0 && movies.some(movie => movie.id && movie.id.startsWith('mock-'));

    res.json({
      success: true,
      status: 'operational',
      data: {
        isAuthenticated: authService.isAuthenticated,
        lastAuthTime: authService.lastAuthTime,
        moviesCount: movies.length,
        lastScrapeTime: lastScrapeTime,
        uptime: process.uptime(),
        version: require('../../package.json').version,
        usingMockData: usingMockData,
        mockDataAvailable: mockMovies.length,
        dataSource: usingMockData ? 'Mock Data (Site Unreachable)' : 'Live Discovery FTP Site'
      }
    });
  } catch (error) {
    console.error('Error getting status:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get status',
      message: error.message
    });
  }
});

/**
 * POST /api/auth/login
 * Manually trigger authentication
 */
router.post('/auth/login', async (req, res) => {
  try {
    console.log('Manual authentication triggered');
    await authService.authenticate();
    
    res.json({
      success: true,
      message: 'Authentication successful',
      data: {
        isAuthenticated: authService.isAuthenticated,
        lastAuthTime: authService.lastAuthTime
      }
    });
  } catch (error) {
    console.error('Error during authentication:', error.message);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: error.message
    });
  }
});

module.exports = router;
