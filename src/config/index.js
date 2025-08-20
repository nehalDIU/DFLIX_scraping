require('dotenv').config();

const config = {
  server: {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  
  discovery: {
    baseUrl: process.env.DISCOVERY_BASE_URL || 'https://dflix.discoveryftp.net',
    loginUrl: process.env.LOGIN_URL || 'https://dflix.discoveryftp.net/login',
    moviesUrl: process.env.MOVIES_URL || 'https://dflix.discoveryftp.net/m'
  },
  
  scraping: {
    intervalMinutes: parseInt(process.env.SCRAPE_INTERVAL_MINUTES) || 30,
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
    userAgent: process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

module.exports = config;
