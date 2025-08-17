# Discovery FTP Movie Scraper API

A Node.js backend API that scrapes movie data from Discovery FTP site and provides REST endpoints for accessing the data.

## Features

- 🔐 Automated login to Discovery FTP using Demo Login process
- 🎬 Scrapes movie metadata (title, poster, year, language, download links, etc.)
- 🔄 Automatic refresh every 30 minutes
- 🛡️ Authentication failure handling and auto-retry
- 📡 RESTful API endpoints
- 🔍 Search functionality
- ⚡ Caching for improved performance
- 📊 Health monitoring and status endpoints

## Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## API Endpoints

### Movies
- `GET /api/movies` - Get all movies
- `GET /api/movies/:id` - Get specific movie by ID
- `GET /api/movies/search?q=query&year=2023&language=English` - Search movies
- `POST /api/movies/refresh` - Manually trigger refresh

### Status & Health
- `GET /api/status` - API status and authentication info
- `GET /health` - Health check endpoint
- `POST /api/auth/login` - Manually trigger authentication

### Root
- `GET /` - API information and available endpoints

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 150,
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  }
}
```

## Movie Object Structure

```json
{
  "id": "movie_1",
  "title": "Movie Title (2023)",
  "poster": "https://example.com/poster.jpg",
  "year": "2023",
  "language": "English",
  "detailUrl": "https://example.com/movie/details",
  "downloadUrls": [
    {
      "url": "https://example.com/movie.mp4",
      "quality": "1080p",
      "format": "MP4",
      "label": "Full HD"
    }
  ],
  "genres": ["Action", "Adventure"],
  "rating": "8.5",
  "size": "2.1 GB",
  "quality": "1080p",
  "description": "Movie description..."
}
```

## Configuration

Environment variables (see `.env.example`):

- `PORT` - Server port (default: 3001)
- `DISCOVERY_BASE_URL` - Base URL for Discovery FTP
- `SCRAPE_INTERVAL_MINUTES` - Refresh interval (default: 30)
- `MAX_RETRIES` - Max retry attempts (default: 3)
- `REQUEST_TIMEOUT` - HTTP request timeout (default: 30000ms)

## Error Handling

The API includes comprehensive error handling:

- Authentication failures trigger automatic re-authentication
- Network timeouts are handled with retries
- Graceful degradation when scraping fails
- Detailed error messages in development mode

## Monitoring

The scheduler includes:
- Health checks every 5 minutes
- Authentication refresh every hour
- Automatic retry on failures
- Detailed logging of all operations

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests (if available)
npm test
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure proper CORS origins
3. Set up process manager (PM2, Docker, etc.)
4. Configure reverse proxy (Nginx, Apache)
5. Set up monitoring and logging

## Troubleshooting

### Common Issues

1. **Authentication fails**: Check if the Discovery FTP site structure has changed
2. **No movies found**: Verify the movies URL and page structure
3. **Timeout errors**: Increase `REQUEST_TIMEOUT` value
4. **Memory issues**: Monitor memory usage, consider restarting periodically

### Logs

Check console output for detailed information about:
- Authentication attempts
- Scraping progress
- Error messages
- Scheduler status

## License

MIT License - see LICENSE file for details.
