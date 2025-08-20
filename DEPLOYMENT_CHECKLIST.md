# 🚀 Deployment Checklist

## Pre-Deployment

- [ ] Code is committed and pushed to GitHub
- [ ] All dependencies are listed in package.json files
- [ ] Environment variables are documented
- [ ] Application works locally

## Backend Deployment (Render)

### Setup
- [ ] Create Render account
- [ ] Connect GitHub repository
- [ ] Create new Web Service
- [ ] Set root directory to `backend`

### Configuration
- [ ] Set build command: `npm install`
- [ ] Set start command: `npm start`
- [ ] Add all required environment variables:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=10000`
  - [ ] `DISCOVERY_BASE_URL=https://dflix.discoveryftp.net`
  - [ ] `LOGIN_URL=https://dflix.discoveryftp.net/login`
  - [ ] `MOVIES_URL=https://dflix.discoveryftp.net/m`
  - [ ] `SCRAPE_INTERVAL_MINUTES=30`
  - [ ] `MAX_RETRIES=3`
  - [ ] `REQUEST_TIMEOUT=30000`
  - [ ] `USER_AGENT=Mozilla/5.0...`
  - [ ] `LOG_LEVEL=info`

### Deployment
- [ ] Deploy service
- [ ] Wait for successful deployment
- [ ] Test health endpoint: `https://your-service.onrender.com/health`
- [ ] Test API endpoint: `https://your-service.onrender.com/api/movies`
- [ ] Note the backend URL for frontend configuration

## Frontend Deployment (Vercel)

### Setup
- [ ] Create Vercel account
- [ ] Connect GitHub repository
- [ ] Import project
- [ ] Set root directory to `frontend`

### Configuration
- [ ] Framework preset: Next.js (auto-detected)
- [ ] Add environment variable:
  - [ ] `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api`

### Deployment
- [ ] Deploy project
- [ ] Wait for successful deployment
- [ ] Test frontend: `https://your-project.vercel.app`
- [ ] Note the frontend URL for backend CORS configuration

## Post-Deployment Configuration

### Update Backend CORS
- [ ] Add `FRONTEND_URL` environment variable in Render:
  - [ ] `FRONTEND_URL=https://your-project.vercel.app`
- [ ] Redeploy backend service

### Final Testing
- [ ] Visit frontend URL
- [ ] Check that movies load correctly
- [ ] Test search functionality
- [ ] Verify video playback works
- [ ] Check browser console for errors
- [ ] Test API endpoints directly

## Verification URLs

Replace with your actual URLs:

### Backend URLs
- Health Check: `https://your-backend.onrender.com/health`
- API Root: `https://your-backend.onrender.com/api`
- Movies: `https://your-backend.onrender.com/api/movies`
- Status: `https://your-backend.onrender.com/api/status`

### Frontend URL
- Application: `https://your-project.vercel.app`

## Common Issues & Solutions

### Backend Issues
- **Service won't start**: Check environment variables and logs
- **API returns 500 errors**: Check Render logs for detailed errors
- **CORS errors**: Verify FRONTEND_URL environment variable

### Frontend Issues
- **Build fails**: Check TypeScript errors and dependencies
- **API calls fail**: Verify NEXT_PUBLIC_API_URL environment variable
- **Movies don't load**: Check network tab for API call errors

## Monitoring

### Daily Checks
- [ ] Backend health endpoint responds
- [ ] Frontend loads without errors
- [ ] Movies are being scraped (check timestamp in API response)

### Weekly Checks
- [ ] Review Render logs for errors
- [ ] Check Vercel analytics for performance
- [ ] Verify all features work end-to-end

## Maintenance

### Updates
- [ ] Keep dependencies updated
- [ ] Monitor for security vulnerabilities
- [ ] Test changes in development before deploying

### Scaling
- [ ] Monitor usage and performance
- [ ] Consider upgrading to paid plans if needed
- [ ] Implement caching if performance issues arise

## Emergency Procedures

### If Backend Goes Down
1. Check Render dashboard for service status
2. Review recent logs for errors
3. Restart service if needed
4. Check environment variables

### If Frontend Goes Down
1. Check Vercel dashboard for deployment status
2. Review build logs for errors
3. Redeploy if needed
4. Verify environment variables

## Success Criteria

✅ **Deployment is successful when:**
- Backend health check returns 200 OK
- Frontend loads without console errors
- Movies are displayed on the frontend
- Search functionality works
- Video playback works (if applicable)
- No CORS errors in browser console
