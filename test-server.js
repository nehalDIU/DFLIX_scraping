// Simple test script to verify the server works
const express = require('express');

const app = express();
const PORT = 3001;

app.get('/', (req, res) => {
  res.json({
    message: 'Discovery FTP Movie Scraper API - Test Mode',
    status: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test endpoint working',
    data: {
      server: 'Express.js',
      node: process.version,
      uptime: process.uptime()
    }
  });
});

app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log('Visit http://localhost:3001 to test');
});
