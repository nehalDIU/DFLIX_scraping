const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const moviesRouter = require('./api/movies');
const scheduler = require('./jobs/scheduler');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://yourdomain.com'] // Replace with your frontend domain
    : ['http://localhost:3000', 'http://localhost:3004', 'http://localhost:3001'], // Allow common dev ports
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Range'],
  exposedHeaders: ['Content-Length', 'Content-Range', 'Accept-Ranges']
}));

// Logging middleware
app.use(morgan(config.server.nodeEnv === 'production' ? 'combined' : 'dev'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Video proxy endpoint for CORS handling
app.get('/proxy/video', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Validate URL is from Discovery FTP
    if (!url.includes('discoveryftp.net')) {
      return res.status(403).json({ error: 'Only Discovery FTP URLs are allowed' });
    }

    const axios = require('axios');

    // Set up proper headers for video streaming
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
    };

    // Handle range requests for video seeking
    const requestHeaders = {};
    if (req.headers.range) {
      requestHeaders.Range = req.headers.range;
    }

    const response = await axios({
      method: 'GET',
      url: url,
      headers: requestHeaders,
      responseType: 'stream',
      timeout: 30000
    });

    // Set CORS and content headers
    Object.keys(headers).forEach(key => {
      res.setHeader(key, headers[key]);
    });

    // Forward content headers from the source
    if (response.headers['content-type']) {
      res.setHeader('Content-Type', response.headers['content-type']);
    }
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }
    if (response.headers['content-range']) {
      res.setHeader('Content-Range', response.headers['content-range']);
    }
    if (response.headers['accept-ranges']) {
      res.setHeader('Accept-Ranges', response.headers['accept-ranges']);
    }

    // Set appropriate status code
    res.status(response.status);

    // Pipe the video stream
    response.data.pipe(res);

  } catch (error) {
    console.error('Video proxy error:', error.message);
    res.status(500).json({
      error: 'Failed to proxy video',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.server.nodeEnv,
    version: require('../package.json').version
  });
});

// API routes
app.use('/api', moviesRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Discovery FTP Movie Scraper API',
    version: require('../package.json').version,
    endpoints: {
      movies: '/api/movies',
      search: '/api/movies/search',
      refresh: '/api/movies/refresh',
      status: '/api/status',
      health: '/health'
    },
    documentation: 'https://github.com/yourusername/discovery-ftp-scraper'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    error: config.server.nodeEnv === 'production' 
      ? 'Internal server error' 
      : error.message,
    ...(config.server.nodeEnv !== 'production' && { stack: error.stack })
  });
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
  
  // Stop the scheduler
  scheduler.stop();
  
  // Close the server
  server.close((err) => {
    if (err) {
      console.error('Error during server shutdown:', err);
      process.exit(1);
    }
    
    console.log('Server closed successfully');
    process.exit(0);
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start the server
const server = app.listen(config.server.port, () => {
  console.log(`🚀 Discovery FTP Scraper API started`);
  console.log(`📡 Server running on port ${config.server.port}`);
  console.log(`🌍 Environment: ${config.server.nodeEnv}`);
  console.log(`🎬 Target URL: ${config.discovery.baseUrl}`);
  console.log(`⏰ Scrape interval: ${config.scraping.intervalMinutes} minutes`);
  
  // Start the scheduler
  scheduler.start();
  
  console.log('✅ Scheduler started');
  console.log(`📋 API endpoints available at http://localhost:${config.server.port}`);
});

module.exports = app;
