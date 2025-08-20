# Quick Start Guide

## 🚀 Getting Started

1. **Install Dependencies**
```bash
cd backend
npm install
```

2. **Start the Server**
```bash
npm start
# or for development with auto-reload
npm run dev
```

3. **Test the API**
Open your browser and visit:
- http://localhost:3001 - API information
- http://localhost:3001/api/movies - All movies
- http://localhost:3001/api/status - Server status

## 📡 API Examples

### Get All Movies
```bash
GET http://localhost:3001/api/movies
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "movie_1",
      "title": "Movie Title (2023)",
      "poster": "https://dflix.discoveryftp.net/poster.jpg",
      "year": "2023",
      "language": "English",
      "detailUrl": "https://dflix.discoveryftp.net/movie/details",
      "downloadUrls": [
        {
          "url": "https://dflix.discoveryftp.net/movie.mp4",
          "quality": "1080p",
          "format": "MP4"
        }
      ],
      "genres": ["Action"],
      "rating": "8.5",
      "size": "2.1 GB",
      "quality": "1080p"
    }
  ],
  "meta": {
    "total": 60,
    "lastUpdated": "2025-08-16T19:43:54.304Z"
  }
}
```

### Search Movies
```bash
GET http://localhost:3001/api/movies/search?q=action&year=2023&language=English
```

### Manual Refresh
```bash
POST http://localhost:3001/api/movies/refresh
```

### Check Status
```bash
GET http://localhost:3001/api/status
```

## 🔧 Configuration

Edit `.env` file to customize:

```env
PORT=3001
SCRAPE_INTERVAL_MINUTES=30
MAX_RETRIES=3
REQUEST_TIMEOUT=30000
```

## 📊 Monitoring

The server automatically:
- ✅ Scrapes movies every 30 minutes
- ✅ Refreshes authentication every hour
- ✅ Performs health checks every 5 minutes
- ✅ Handles authentication failures with auto-retry
- ✅ Logs all operations with timestamps

## 🛠️ Troubleshooting

### Server won't start
- Check if port 3001 is available
- Verify all dependencies are installed: `npm install`

### No movies found
- Check server logs for authentication errors
- Try manual refresh: `POST /api/movies/refresh`
- Verify Discovery FTP site is accessible

### Authentication fails
- Check if site structure has changed
- Try manual login: `POST /api/auth/login`
- Check logs for detailed error messages

## 📝 Logs

Watch the console output for:
```
🚀 Discovery FTP Scraper API started
📡 Server running on port 3001
✅ Scheduler started
[2025-08-16T19:43:48.870Z] Starting scheduled scraping job
Authentication successful!
Successfully scraped 60 movies
```

## 🔄 Auto-Refresh

The system automatically:
1. Logs in to Discovery FTP using Demo Login
2. Scrapes the movies list page
3. Extracts metadata for each movie
4. Caches results for fast API responses
5. Repeats every 30 minutes

## 🌐 Frontend Integration

Use the API in your frontend:

```javascript
// Fetch all movies
const response = await fetch('http://localhost:3001/api/movies');
const data = await response.json();
console.log(data.data); // Array of movies

// Search movies
const searchResponse = await fetch('http://localhost:3001/api/movies/search?q=action');
const searchData = await searchResponse.json();
```

## 🐳 Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t discovery-scraper .
docker run -p 3001:3001 discovery-scraper
```
