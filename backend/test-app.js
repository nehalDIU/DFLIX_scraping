const express = require('express');
const cors = require('cors');
const config = require('./src/config');
const mockDataService = require('./src/services/mockDataService');

console.log('Starting test app...');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Test app is working!',
    mockMovies: mockDataService.getMovies().length
  });
});

// Test mock data endpoint
app.get('/api/test', (req, res) => {
  const movies = mockDataService.getMovies();
  res.json({
    success: true,
    data: movies,
    count: movies.length
  });
});

const port = config.server.port;
const server = app.listen(port, () => {
  console.log(`✅ Test server running on port ${port}`);
  console.log(`🎬 Mock movies available: ${mockDataService.getMovies().length}`);
});

module.exports = app;
