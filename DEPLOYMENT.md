# Deployment Guide

This guide will help you deploy your Discovery FTP Movie Scraper application with the backend on Render and frontend on Vercel.

## 🚀 Quick Deployment Overview

- **Backend**: Node.js API deployed on Render
- **Frontend**: Next.js app deployed on Vercel
- **Database**: In-memory (no external database required)

## 📋 Prerequisites

1. GitHub account with your code pushed to a repository
2. Render account (free tier available)
3. Vercel account (free tier available)

## 🔧 Backend Deployment on Render

### Step 1: Create Render Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the repository containing your code

### Step 2: Configure Service

**Basic Settings:**
- **Name**: `discovery-ftp-scraper-api` (or your preferred name)
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Root Directory**: `backend`

**Build & Deploy:**
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Step 3: Environment Variables

Add these environment variables in Render dashboard:

```
NODE_ENV=production
PORT=10000
DISCOVERY_BASE_URL=https://dflix.discoveryftp.net
LOGIN_URL=https://dflix.discoveryftp.net/login
MOVIES_URL=https://dflix.discoveryftp.net/m
SCRAPE_INTERVAL_MINUTES=30
MAX_RETRIES=3
REQUEST_TIMEOUT=30000
USER_AGENT=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36
LOG_LEVEL=info
```

### Step 4: Deploy

1. Click "Create Web Service"
2. Wait for deployment to complete
3. Note your backend URL: `https://your-service-name.onrender.com`

## 🌐 Frontend Deployment on Vercel

### Step 1: Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository

### Step 2: Configure Project

**Framework Preset:** Next.js
**Root Directory:** `frontend`
**Build Command:** `npm run build` (auto-detected)
**Output Directory:** `.next` (auto-detected)

### Step 3: Environment Variables

Add this environment variable in Vercel dashboard:

```
NEXT_PUBLIC_API_URL=https://your-backend-service.onrender.com/api
```

Replace `your-backend-service` with your actual Render service name.

### Step 4: Deploy

1. Click "Deploy"
2. Wait for deployment to complete
3. Note your frontend URL: `https://your-project.vercel.app`

## 🔄 Update CORS Configuration

After both deployments are complete:

1. Update the `FRONTEND_URL` environment variable in Render:
   ```
   FRONTEND_URL=https://your-project.vercel.app
   ```

2. Update the `NEXT_PUBLIC_API_URL` in Vercel:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-service.onrender.com/api
   ```

3. Redeploy both services to apply changes

## ✅ Verification

### Test Backend
Visit: `https://your-backend-service.onrender.com/health`
Should return: `{"status":"ok",...}`

### Test Frontend
Visit: `https://your-project.vercel.app`
Should load the movie browser interface

### Test API Integration
1. Open browser dev tools on your frontend
2. Check Network tab for API calls to your backend
3. Verify movies are loading from your Render backend

## 🔧 Troubleshooting

### Backend Issues

**Service won't start:**
- Check Render logs for errors
- Verify all environment variables are set
- Ensure `package.json` has correct start script

**CORS errors:**
- Verify `FRONTEND_URL` environment variable
- Check that frontend URL matches exactly (no trailing slash)

### Frontend Issues

**API calls failing:**
- Verify `NEXT_PUBLIC_API_URL` environment variable
- Check that backend URL is correct and accessible
- Ensure backend is deployed and running

**Build failures:**
- Check Vercel build logs
- Verify all dependencies are in `package.json`
- Ensure TypeScript errors are resolved

## 📊 Monitoring

### Backend Monitoring
- Render provides built-in monitoring
- Check `/health` endpoint regularly
- Monitor logs for scraping errors

### Frontend Monitoring
- Vercel provides analytics and monitoring
- Check browser console for client-side errors
- Monitor API response times

## 🔄 Updates and Redeployment

### Automatic Deployment
Both services are configured for automatic deployment:
- **Render**: Deploys on push to main branch
- **Vercel**: Deploys on push to main branch

### Manual Deployment
- **Render**: Click "Manual Deploy" in dashboard
- **Vercel**: Push to connected branch or use Vercel CLI

## 💰 Cost Considerations

### Free Tier Limits
- **Render**: 750 hours/month, sleeps after 15 minutes of inactivity
- **Vercel**: 100GB bandwidth, 6000 serverless function executions

### Keeping Services Active
The backend includes a health check endpoint that can be pinged to prevent sleeping.

## 🔐 Security Notes

1. Never commit `.env` files with sensitive data
2. Use environment variables for all configuration
3. Regularly update dependencies
4. Monitor for security vulnerabilities

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Render/Vercel documentation
3. Check application logs for specific errors
