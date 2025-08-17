const express = require('express');
const scraperService = require('../services/scraperService');
const authService = require('../services/authService');

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
        movie.description.toLowerCase().includes(searchTerm) ||
        movie.genres.some(genre => genre.toLowerCase().includes(searchTerm))
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
    
    res.json({
      success: true,
      status: 'operational',
      data: {
        isAuthenticated: authService.isAuthenticated,
        lastAuthTime: authService.lastAuthTime,
        moviesCount: movies.length,
        lastScrapeTime: lastScrapeTime,
        uptime: process.uptime(),
        version: require('../../package.json').version
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
