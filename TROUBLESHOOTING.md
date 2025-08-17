# Troubleshooting Guide

## Image Loading Issues

### Problem: Next.js Image Configuration Error
```
Error: Invalid src prop (https://images1.discoveryftp.net/...) on `next/image`, 
hostname "images1.discoveryftp.net" is not configured under images in your `next.config.js`
```

### Solution: Configure External Image Domains

The `next.config.ts` file has been updated to allow images from Discovery FTP domains:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images1.discoveryftp.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'dflix.discoveryftp.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'images1.discoveryftp.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'dflix.discoveryftp.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
```

### Steps to Fix:

1. **Update next.config.ts** (already done)
2. **Restart the development server**:
   ```bash
   # Stop current server (Ctrl+C)
   # Then restart
   npm run dev
   ```
3. **Clear browser cache** if images still don't load

## Starting the Application

### Backend Server
```bash
cd backend
npm install
npm start
```
Server will run on: http://localhost:3001

### Frontend Server
```bash
cd frontend
npm install
npm run dev
```
Frontend will run on: http://localhost:3000

## Common Issues & Solutions

### 1. Backend Not Starting
**Symptoms**: Frontend shows "Unable to connect to server"

**Solutions**:
- Check if port 3001 is available
- Verify backend dependencies are installed: `npm install`
- Check backend logs for errors
- Try manual start: `node src/app.js`

### 2. Frontend Build Errors
**Symptoms**: TypeScript or build errors

**Solutions**:
- Check TypeScript errors: `npx tsc --noEmit`
- Verify all dependencies: `npm install`
- Clear Next.js cache: `rm -rf .next`

### 3. Images Not Loading
**Symptoms**: Broken image placeholders

**Solutions**:
- Verify next.config.ts is updated (done)
- Restart development server
- Check browser console for CORS errors
- Verify image URLs in API response

### 4. Video Player Issues
**Symptoms**: Video player not loading or playing

**Solutions**:
- Check video source URLs from API
- Verify Video.js dependencies are installed
- Check browser console for errors
- Ensure video formats are supported

### 5. API Connection Issues
**Symptoms**: "Failed to fetch movies" error

**Solutions**:
- Verify backend is running on port 3001
- Check CORS configuration in backend
- Verify API_URL in frontend .env.local
- Check network tab in browser dev tools

## Environment Configuration

### Backend (.env)
```env
PORT=3001
NODE_ENV=development
DISCOVERY_BASE_URL=https://dflix.discoveryftp.net
SCRAPE_INTERVAL_MINUTES=30
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Development Workflow

1. **Start Backend**:
   ```bash
   cd backend
   npm start
   ```

2. **Start Frontend** (in new terminal):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open Browser**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api/movies

## Testing the Application

### 1. Verify Backend
- Visit: http://localhost:3001/api/status
- Should show: `{"success": true, "status": "operational", ...}`

### 2. Verify Frontend
- Visit: http://localhost:3000
- Should show movie grid with search bar

### 3. Test Features
- Search for movies
- Click on a movie card
- Try video playback
- Test download links

## Performance Tips

1. **Image Optimization**: Images are optimized by Next.js
2. **Caching**: API responses are cached for better performance
3. **Lazy Loading**: Images load as you scroll
4. **Debounced Search**: Search waits 300ms before making API calls

## Browser Support

- **Recommended**: Chrome, Firefox, Safari, Edge (latest versions)
- **Video Playback**: Requires modern browser with HTML5 video support
- **Mobile**: iOS Safari, Chrome Mobile

## Deployment Notes

### Production Build
```bash
# Frontend
cd frontend
npm run build
npm start

# Backend
cd backend
NODE_ENV=production npm start
```

### Environment Variables for Production
- Update API URLs to production domains
- Configure proper CORS origins
- Set up SSL certificates for HTTPS

## Getting Help

1. Check browser console for errors
2. Check terminal output for server errors
3. Verify all dependencies are installed
4. Ensure both servers are running
5. Check network connectivity

## Quick Reset

If everything seems broken:

```bash
# Backend
cd backend
rm -rf node_modules
npm install
npm start

# Frontend (new terminal)
cd frontend
rm -rf node_modules .next
npm install
npm run dev
```
