const cron = require('node-cron');
const scraperService = require('../services/scraperService');
const authService = require('../services/authService');
const config = require('../config');

class Scheduler {
  constructor() {
    this.tasks = [];
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      console.log('Scheduler is already running');
      return;
    }

    console.log(`Starting scheduler with ${config.scraping.intervalMinutes} minute intervals`);
    
    // Create cron expression for the specified interval
    const cronExpression = `*/${config.scraping.intervalMinutes} * * * *`;
    
    // Schedule the main scraping task
    const scrapingTask = cron.schedule(cronExpression, async () => {
      await this.runScrapingJob();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Schedule authentication refresh (every hour)
    const authTask = cron.schedule('0 * * * *', async () => {
      await this.runAuthRefreshJob();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Schedule health check (every 5 minutes)
    const healthTask = cron.schedule('*/5 * * * *', async () => {
      await this.runHealthCheckJob();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    this.tasks = [
      { name: 'scraping', task: scrapingTask },
      { name: 'auth-refresh', task: authTask },
      { name: 'health-check', task: healthTask }
    ];

    // Start all tasks
    this.tasks.forEach(({ name, task }) => {
      task.start();
      console.log(`Started ${name} task`);
    });

    this.isRunning = true;

    // Run initial scraping job
    setTimeout(() => {
      this.runScrapingJob();
    }, 5000); // Wait 5 seconds after startup
  }

  stop() {
    if (!this.isRunning) {
      console.log('Scheduler is not running');
      return;
    }

    console.log('Stopping scheduler...');
    
    this.tasks.forEach(({ name, task }) => {
      task.stop();
      console.log(`Stopped ${name} task`);
    });

    this.tasks = [];
    this.isRunning = false;
  }

  async runScrapingJob() {
    const startTime = new Date();
    console.log(`[${startTime.toISOString()}] Starting scheduled scraping job`);

    try {
      const movies = await scraperService.scrapeMovies();
      const endTime = new Date();
      const duration = endTime - startTime;
      
      console.log(`[${endTime.toISOString()}] Scraping job completed successfully`);
      console.log(`- Movies found: ${movies.length}`);
      console.log(`- Duration: ${duration}ms`);
      
      // Log some sample movie titles for verification
      if (movies.length > 0) {
        const sampleTitles = movies.slice(0, 3).map(m => m.title).join(', ');
        console.log(`- Sample titles: ${sampleTitles}`);
      }

    } catch (error) {
      const endTime = new Date();
      console.error(`[${endTime.toISOString()}] Scraping job failed:`, error.message);
      
      // Handle specific error types
      if (error.message.includes('401') || error.message.includes('403')) {
        console.log('Authentication error detected, will retry authentication on next run');
        authService.reset();
      } else if (error.message.includes('timeout') || error.message.includes('ECONNRESET')) {
        console.log('Network error detected, will retry on next scheduled run');
      } else {
        console.error('Unexpected error:', error.stack);
      }
    }
  }

  async runAuthRefreshJob() {
    const startTime = new Date();
    console.log(`[${startTime.toISOString()}] Starting authentication refresh job`);

    try {
      await authService.ensureAuthenticated();
      const endTime = new Date();
      
      console.log(`[${endTime.toISOString()}] Authentication refresh completed`);
      console.log(`- Is authenticated: ${authService.isAuthenticated}`);
      console.log(`- Last auth time: ${authService.lastAuthTime}`);

    } catch (error) {
      const endTime = new Date();
      console.error(`[${endTime.toISOString()}] Authentication refresh failed:`, error.message);
    }
  }

  async runHealthCheckJob() {
    const startTime = new Date();
    
    try {
      const movies = scraperService.getMovies();
      const lastScrapeTime = scraperService.getLastScrapeTime();
      const timeSinceLastScrape = lastScrapeTime ? startTime - lastScrapeTime : null;
      
      // Check if data is stale (more than 2 hours old)
      const isStale = timeSinceLastScrape && timeSinceLastScrape > 2 * 60 * 60 * 1000;
      
      if (isStale) {
        console.warn(`[${startTime.toISOString()}] Data is stale (${Math.round(timeSinceLastScrape / 60000)} minutes old)`);
      }
      
      // Check if we have no movies at all
      if (movies.length === 0 && lastScrapeTime) {
        console.warn(`[${startTime.toISOString()}] No movies in cache, may need manual intervention`);
      }
      
      // Log basic health info (only every 30 minutes to avoid spam)
      const minutes = startTime.getMinutes();
      if (minutes % 30 === 0) {
        console.log(`[${startTime.toISOString()}] Health check:`);
        console.log(`- Movies in cache: ${movies.length}`);
        console.log(`- Last scrape: ${lastScrapeTime ? lastScrapeTime.toISOString() : 'Never'}`);
        console.log(`- Is authenticated: ${authService.isAuthenticated}`);
        console.log(`- Uptime: ${Math.round(process.uptime())} seconds`);
      }

    } catch (error) {
      console.error(`[${startTime.toISOString()}] Health check failed:`, error.message);
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      tasks: this.tasks.map(({ name, task }) => ({
        name,
        running: task.running
      })),
      nextRuns: this.tasks.map(({ name, task }) => ({
        name,
        nextRun: task.nextDate ? task.nextDate() : null
      }))
    };
  }

  // Manual trigger methods
  async triggerScraping() {
    console.log('Manual scraping trigger requested');
    return this.runScrapingJob();
  }

  async triggerAuthRefresh() {
    console.log('Manual auth refresh trigger requested');
    return this.runAuthRefreshJob();
  }
}

module.exports = new Scheduler();
