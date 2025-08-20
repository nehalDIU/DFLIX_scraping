const axios = require('axios');
const cheerio = require('cheerio');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');
const config = require('../config');

class AuthService {
  constructor() {
    this.cookieJar = new CookieJar();
    this.client = wrapper(axios.create({
      jar: this.cookieJar,
      timeout: config.scraping.requestTimeout,
      headers: {
        'User-Agent': config.scraping.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      maxRedirects: 10,
      validateStatus: (status) => status < 400
    }));
    
    this.isAuthenticated = false;
    this.lastAuthTime = null;
    this.authRetries = 0;
  }

  async authenticate() {
    try {
      console.log('Starting authentication process...');
      
      // Step 1: GET the login page
      const loginPageResponse = await this.client.get(config.discovery.loginUrl);
      console.log(`Login page status: ${loginPageResponse.status}`);
      
      const $ = cheerio.load(loginPageResponse.data);
      
      // Step 2: Look for Demo Login button/link
      let demoLoginUrl = null;
      
      // Try different selectors for demo login
      const demoSelectors = [
        'a[href*="demo"]',
        'button[onclick*="demo"]',
        '.demo-login',
        '#demo-login',
        'a:contains("Demo")',
        'button:contains("Demo")',
        'input[value*="Demo"]'
      ];
      
      for (const selector of demoSelectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          if (element.is('a')) {
            demoLoginUrl = element.attr('href');
          } else if (element.is('button') || element.is('input')) {
            const onclick = element.attr('onclick');
            if (onclick) {
              // Extract URL from onclick if present
              const urlMatch = onclick.match(/location\.href\s*=\s*['"]([^'"]+)['"]/);
              if (urlMatch) {
                demoLoginUrl = urlMatch[1];
              }
            }
            // Check for form submission
            const form = element.closest('form');
            if (form.length > 0) {
              demoLoginUrl = form.attr('action') || config.discovery.loginUrl;
            }
          }
          
          if (demoLoginUrl) {
            console.log(`Found demo login URL: ${demoLoginUrl}`);
            break;
          }
        }
      }
      
      // If no specific demo login found, try common demo endpoints
      if (!demoLoginUrl) {
        const commonDemoUrls = [
          '/demo',
          '/demo-login',
          '/login/demo',
          '/auth/demo'
        ];
        
        for (const url of commonDemoUrls) {
          try {
            const testUrl = new URL(url, config.discovery.baseUrl).href;
            const testResponse = await this.client.head(testUrl);
            if (testResponse.status === 200) {
              demoLoginUrl = testUrl;
              console.log(`Found working demo URL: ${demoLoginUrl}`);
              break;
            }
          } catch (error) {
            // Continue to next URL
          }
        }
      }
      
      // Step 3: Access demo login URL or submit form
      if (demoLoginUrl) {
        // Make URL absolute if relative
        if (demoLoginUrl.startsWith('/')) {
          demoLoginUrl = new URL(demoLoginUrl, config.discovery.baseUrl).href;
        }
        
        console.log(`Accessing demo login: ${demoLoginUrl}`);
        const demoResponse = await this.client.get(demoLoginUrl);
        console.log(`Demo login response status: ${demoResponse.status}`);
        
        // Check if we were redirected to a different page (likely success)
        if (demoResponse.request.res.responseUrl !== demoLoginUrl) {
          console.log(`Redirected to: ${demoResponse.request.res.responseUrl}`);
        }
      } else {
        // Fallback: try to submit any form on the login page
        const forms = $('form');
        if (forms.length > 0) {
          const form = forms.first();
          const action = form.attr('action') || config.discovery.loginUrl;
          const method = (form.attr('method') || 'POST').toUpperCase();
          
          const formData = {};
          form.find('input').each((i, input) => {
            const $input = $(input);
            const name = $input.attr('name');
            const value = $input.attr('value') || '';
            if (name) {
              formData[name] = value;
            }
          });
          
          console.log(`Submitting form to: ${action}`);
          const formUrl = action.startsWith('/') ? new URL(action, config.discovery.baseUrl).href : action;
          
          if (method === 'POST') {
            await this.client.post(formUrl, formData);
          } else {
            await this.client.get(formUrl, { params: formData });
          }
        }
      }
      
      // Step 4: Verify authentication by trying to access movies page
      const moviesResponse = await this.client.get(config.discovery.moviesUrl);
      
      if (moviesResponse.status === 200) {
        this.isAuthenticated = true;
        this.lastAuthTime = new Date();
        this.authRetries = 0;
        console.log('Authentication successful!');
        return true;
      } else {
        throw new Error(`Movies page returned status: ${moviesResponse.status}`);
      }
      
    } catch (error) {
      console.error('Authentication failed:', error.message);
      this.isAuthenticated = false;
      this.authRetries++;
      
      if (this.authRetries < config.scraping.maxRetries) {
        console.log(`Retrying authentication (attempt ${this.authRetries + 1}/${config.scraping.maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * this.authRetries)); // Exponential backoff
        return this.authenticate();
      }
      
      throw error;
    }
  }

  async ensureAuthenticated() {
    // Check if we need to re-authenticate (session might expire after 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    if (!this.isAuthenticated || !this.lastAuthTime || this.lastAuthTime < oneHourAgo) {
      await this.authenticate();
    }
    
    return this.isAuthenticated;
  }

  getClient() {
    return this.client;
  }

  getCookies() {
    return this.cookieJar.getCookiesSync(config.discovery.baseUrl);
  }

  reset() {
    this.cookieJar = new CookieJar();
    this.client = wrapper(axios.create({
      jar: this.cookieJar,
      timeout: config.scraping.requestTimeout,
      headers: {
        'User-Agent': config.scraping.userAgent
      }
    }));
    this.isAuthenticated = false;
    this.lastAuthTime = null;
    this.authRetries = 0;
  }
}

module.exports = new AuthService();
