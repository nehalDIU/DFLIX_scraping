const cheerio = require('cheerio');
const authService = require('./authService');
const config = require('../config');

class ScraperService {
  constructor() {
    this.moviesCache = [];
    this.lastScrapeTime = null;
    this.isScrapingInProgress = false;
  }

  async scrapeMovies() {
    if (this.isScrapingInProgress) {
      console.log('Scraping already in progress, skipping...');
      return this.moviesCache;
    }

    this.isScrapingInProgress = true;
    
    try {
      console.log('Starting movie scraping process...');
      
      // Ensure we're authenticated
      await authService.ensureAuthenticated();
      const client = authService.getClient();
      
      // Get the movies list page
      const moviesResponse = await client.get(config.discovery.moviesUrl);
      
      if (moviesResponse.status !== 200) {
        throw new Error(`Movies page returned status: ${moviesResponse.status}`);
      }
      
      const $ = cheerio.load(moviesResponse.data);
      const movies = [];
      
      // Try different selectors to find movie items - Discovery FTP specific
      const movieSelectors = [
        '.card',                              // Individual movie cards
        '.movie-item',
        '.movie-card',
        '.film-item',
        '.video-item',
        '.media-item',
        'tr[data-name]',                      // Table rows with data-name attribute
        'tr:has(td)',                         // Table rows with cells
        '.list-item',
        'li:has(a[href*="movie"])',
        'li:has(a[href*="film"])',
        'div:has(img[src*="poster"])',
        'div:has(img[src*="thumb"])'
      ];
      
      let movieElements = $();
      
      for (const selector of movieSelectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          console.log(`Found ${elements.length} elements with selector: ${selector}`);
          movieElements = elements;
          break;
        }
      }
      
      // If no specific movie elements found, try to parse table structure
      if (movieElements.length === 0) {
        const tables = $('table');
        if (tables.length > 0) {
          movieElements = tables.first().find('tr').slice(1); // Skip header row
          console.log(`Found ${movieElements.length} table rows`);
        }
      }
      
      // If still no elements, try to find any links that might be movies
      if (movieElements.length === 0) {
        movieElements = $('a[href*=".mp4"], a[href*=".mkv"], a[href*=".avi"], a[href*="movie"], a[href*="film"]');
        console.log(`Found ${movieElements.length} potential movie links`);
      }
      
      // Process each movie element
      movieElements.each((index, element) => {
        try {
          const movie = this.extractMovieData($, $(element), index, 'main');
          if (movie && movie.title) {
            movies.push(movie);
          }
        } catch (error) {
          console.error(`Error processing movie element ${index}:`, error.message);
        }
      });
      
      // If we found movies, also try to get additional details for each
      for (const movie of movies) {
        if (movie.detailUrl) {
          try {
            await this.enrichMovieData(client, movie);
          } catch (error) {
            console.error(`Error enriching movie data for ${movie.title}:`, error.message);
          }
        }
      }
      
      this.moviesCache = movies;
      this.lastScrapeTime = new Date();
      
      console.log(`Successfully scraped ${movies.length} movies from main page`);

      // Check for pagination and scrape additional pages
      const additionalMovies = await this.scrapePaginatedPages(client, $);
      movies.push(...additionalMovies);

      // Also try to scrape common directory structures
      const directoryMovies = await this.scrapeDirectoryStructure(client);
      movies.push(...directoryMovies);

      // Remove duplicates based on title and year
      const uniqueMovies = this.deduplicateMovies(movies);

      console.log(`Total movies scraped: ${movies.length}, unique movies: ${uniqueMovies.length}`);
      return uniqueMovies;
      
    } catch (error) {
      console.error('Error scraping movies:', error.message);
      
      // If authentication failed, reset and retry once
      if (error.message.includes('401') || error.message.includes('403')) {
        console.log('Authentication may have expired, resetting...');
        authService.reset();
        
        if (!this.hasRetriedAuth) {
          this.hasRetriedAuth = true;
          const result = await this.scrapeMovies();
          this.hasRetriedAuth = false;
          return result;
        }
      }
      
      throw error;
    } finally {
      this.isScrapingInProgress = false;
    }
  }

  extractMovieData($, element, index, pageId = 'main') {
    // Generate a unique ID using timestamp, page, and index
    const uniqueId = `movie_${pageId}_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const movie = {
      id: uniqueId,
      title: '',
      poster: '',
      year: '',
      language: '',
      detailUrl: '',
      downloadUrls: [],
      genres: [],
      rating: '',
      size: '',
      quality: '',
      description: ''
    };

    // Extract title - Discovery FTP specific selectors
    const titleSelectors = [
      '.details h3',           // Main title in details section
      'h3',                    // Any h3 tag
      '.movie-title',          // Generic movie title class
      '.title',                // Generic title class
      '.name'                  // Generic name class
    ];

    for (const selector of titleSelectors) {
      const titleElement = element.find(selector).first();
      if (titleElement.length > 0) {
        movie.title = titleElement.text().trim();
        if (movie.title && movie.title !== '1080P' && movie.title !== 'CAM-RIP' && !movie.title.includes('WEB-DL')) {
          break;
        }
      }
    }

    // If no title found, try the element text itself but filter out quality indicators
    if (!movie.title) {
      const elementText = element.text().trim().split('\n')[0].trim();
      if (elementText && !elementText.includes('1080P') && !elementText.includes('CAM-RIP')) {
        movie.title = elementText;
      }
    }
    
    // Extract detail URL
    const linkElement = element.find('a').first();
    if (linkElement.length > 0) {
      let href = linkElement.attr('href');
      if (href) {
        if (href.startsWith('/')) {
          movie.detailUrl = new URL(href, config.discovery.baseUrl).href;
        } else if (href.startsWith('http')) {
          movie.detailUrl = href;
        }
      }
    }
    
    // Extract poster/thumbnail
    const imgElement = element.find('img').first();
    if (imgElement.length > 0) {
      let src = imgElement.attr('src');
      if (src) {
        if (src.startsWith('/')) {
          movie.poster = new URL(src, config.discovery.baseUrl).href;
        } else if (src.startsWith('http')) {
          movie.poster = src;
        }
      }
    }
    
    // Extract year - Discovery FTP specific
    // First try to find year in the feedback section
    const yearElement = element.find('.feedback .movie_details_span[title="views"]').first();
    if (yearElement.length > 0) {
      const yearText = yearElement.text().trim();
      if (/^\d{4}$/.test(yearText)) {
        movie.year = yearText;
      }
    }

    // Fallback: Extract year from title or separate field
    if (!movie.year) {
      const yearMatch = movie.title.match(/\((\d{4})\)/) || movie.title.match(/(\d{4})/);
      if (yearMatch) {
        movie.year = yearMatch[1];
      }
    }
    
    // Extract size if in table format
    const sizeElement = element.find('td').eq(1);
    if (sizeElement.length > 0) {
      const sizeText = sizeElement.text().trim();
      if (sizeText.match(/\d+(\.\d+)?\s*(MB|GB|KB)/i)) {
        movie.size = sizeText;
      }
    }
    
    // Extract quality - Discovery FTP specific
    // First try to get quality from the quality badge
    const qualityElement = element.find('.movie_details_span_end').first();
    if (qualityElement.length > 0) {
      movie.quality = qualityElement.text().trim();
    }

    // Fallback: Extract quality from title
    if (!movie.quality) {
      const qualityMatch = movie.title.match(/(720p|1080p|4K|HD|CAM|TS|DVDRip|BRRip)/i);
      if (qualityMatch) {
        movie.quality = qualityMatch[1];
      }
    }
    
    // Extract language from title
    const languageMatch = movie.title.match(/(Hindi|English|Tamil|Telugu|Malayalam|Kannada|Bengali|Punjabi|Marathi)/i);
    if (languageMatch) {
      movie.language = languageMatch[1];
    }
    
    // Enhanced direct download detection with better MKV support
    if (movie.detailUrl && this.isDirectVideoFile(movie.detailUrl)) {
      const videoInfo = this.analyzeVideoFile(movie.detailUrl, movie);
      movie.downloadUrls.push(videoInfo);

      // For MKV files, add additional metadata
      if (videoInfo.format === 'MKV') {
        movie.isMKV = true;
        movie.mkvFeatures = this.detectMKVFeatures(movie.title, movie.detailUrl);
      }
    }
    
    return movie;
  }

  async scrapePaginatedPages(client, $) {
    const additionalMovies = [];

    try {
      // Look for pagination links
      const paginationSelectors = [
        'a[href*="page="]',
        'a[href*="p="]',
        '.pagination a',
        '.page-link',
        '.next',
        'a:contains("Next")',
        'a:contains(">")',
        'a[href*="/m/"]'
      ];

      const paginationLinks = [];

      for (const selector of paginationSelectors) {
        const links = $(selector);
        if (links.length > 0) {
          console.log(`Found ${links.length} pagination links with selector: ${selector}`);

          links.each((index, element) => {
            const href = $(element).attr('href');
            if (href && !paginationLinks.includes(href)) {
              paginationLinks.push(href);
            }
          });
          break;
        }
      }

      // Also try to find category and year-based links
      const categoryLinks = [];
      $('a').each((index, element) => {
        const href = $(element).attr('href');
        const text = $(element).text().trim();

        // Look for category links (Hindi, English, etc.)
        if (href && (
          href.includes('/Hindi') ||
          href.includes('/English') ||
          href.includes('/Tamil') ||
          href.includes('/Bangla') ||
          href.includes('/2024') ||
          href.includes('/2025') ||
          href.includes('/genre/') ||
          href.includes('/category/')
        )) {
          if (!categoryLinks.includes(href)) {
            categoryLinks.push(href);
          }
        }

        // Look for numeric page links
        if (href && /^\d+$/.test(text)) {
          const pageNum = parseInt(text);
          if (pageNum > 1 && pageNum <= 5) { // Limit to first few pages
            if (!categoryLinks.includes(href)) {
              categoryLinks.push(href);
            }
          }
        }
      });

      // Combine pagination links and category links, prioritize category links
      const allPageUrls = [...new Set([...categoryLinks, ...paginationLinks])];
      console.log(`Found ${allPageUrls.length} potential page URLs:`, allPageUrls.slice(0, 20));

      // Scrape each additional page (limit to prevent infinite loops)
      const maxPages = 20; // Increased to get more content
      let pagesScraped = 0;

      for (const pageUrl of allPageUrls.slice(0, maxPages)) {
        try {
          const fullUrl = this.resolvePageUrl(pageUrl);
          console.log(`Scraping additional page: ${fullUrl}`);

          const pageResponse = await client.get(fullUrl);
          if (pageResponse.status === 200) {
            const page$ = cheerio.load(pageResponse.data);
            const pageMovies = await this.extractMoviesFromPage(page$);

            console.log(`Found ${pageMovies.length} movies on page: ${fullUrl}`);
            additionalMovies.push(...pageMovies);
            pagesScraped++;

            // Add delay between requests to be respectful
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`Error scraping page ${pageUrl}:`, error.message);
        }
      }

      console.log(`Scraped ${pagesScraped} additional pages, found ${additionalMovies.length} additional movies`);

    } catch (error) {
      console.error('Error in pagination scraping:', error.message);
    }

    return additionalMovies;
  }

  resolvePageUrl(href) {
    const config = require('../config');

    // If it's already a full URL, return it
    if (href.startsWith('http')) {
      return href;
    }

    // If it starts with /, make it relative to base URL
    if (href.startsWith('/')) {
      return config.discovery.baseUrl + href;
    }

    // Otherwise, make it relative to base URL
    return config.discovery.baseUrl + '/' + href;
  }

  async extractMoviesFromPage(page$) {
    const movies = [];

    // Use the same selectors as the main scraping method
    const movieSelectors = [
      '.movie-item',
      '.movie-card',
      '.film-item',
      '.video-item',
      '.media-item',
      'tr[data-name]',
      'tr:has(td)',
      '.list-item',
      'li:has(a[href*="movie"])',
      'li:has(a[href*="film"])',
      'div:has(img[src*="poster"])',
      'div:has(img[src*="thumb"])'
    ];

    let movieElements = page$();

    for (const selector of movieSelectors) {
      const elements = page$(selector);
      if (elements.length > 0) {
        movieElements = elements;
        break;
      }
    }

    // If no specific movie elements found, try table structure
    if (movieElements.length === 0) {
      const tables = page$('table');
      if (tables.length > 0) {
        movieElements = tables.first().find('tr').slice(1);
      }
    }

    // If still no elements, try to find any links that might be movies
    if (movieElements.length === 0) {
      movieElements = page$('a[href*=".mp4"], a[href*=".mkv"], a[href*=".avi"], a[href*="movie"], a[href*="film"]');
    }

    // Process each movie element
    movieElements.each((index, element) => {
      try {
        const movie = this.extractMovieData(page$, page$(element), index, 'pagination');
        if (movie && movie.title) {
          movies.push(movie);
        }
      } catch (error) {
        console.error(`Error processing movie element ${index}:`, error.message);
      }
    });

    return movies;
  }

  async scrapeDirectoryStructure(client) {
    const directoryMovies = [];

    try {
      const config = require('../config');

      // Common directory paths for movie content
      const directoryPaths = [
        '/Movies',
        '/Movies/Hindi',
        '/Movies/English',
        '/Movies/2024',
        '/Movies/2025',
        '/m/Hindi',
        '/m/English',
        '/m/2024',
        '/m/2025',
        '/content/Movies',
        '/files/Movies'
      ];

      console.log('Checking directory structures for additional content...');

      for (const path of directoryPaths) {
        try {
          const fullUrl = config.discovery.baseUrl + path;
          console.log(`Checking directory: ${fullUrl}`);

          const response = await client.get(fullUrl);
          if (response.status === 200) {
            const dir$ = cheerio.load(response.data);

            // Look for directory listings or file links
            const fileLinks = dir$('a[href*=".mkv"], a[href*=".mp4"], a[href*=".avi"]');
            const dirLinks = dir$('a[href*="/"]').filter((i, el) => {
              const href = dir$(el).attr('href');
              return href && !href.includes('.') && href !== '../';
            });

            console.log(`Found ${fileLinks.length} file links and ${dirLinks.length} directory links in ${path}`);

            // Process file links directly
            fileLinks.each((index, element) => {
              try {
                const movie = this.extractMovieFromFileLink(dir$, dir$(element), fullUrl);
                if (movie && movie.title) {
                  directoryMovies.push(movie);
                }
              } catch (error) {
                console.error(`Error processing file link:`, error.message);
              }
            });

            // Process subdirectories (limit depth to prevent infinite recursion)
            if (dirLinks.length > 0 && dirLinks.length < 50) {
              for (let i = 0; i < Math.min(dirLinks.length, 10); i++) {
                try {
                  const subDir = dir$(dirLinks[i]).attr('href');
                  if (subDir && !subDir.includes('..')) {
                    const subDirUrl = fullUrl + '/' + subDir;
                    const subResponse = await client.get(subDirUrl);

                    if (subResponse.status === 200) {
                      const subDir$ = cheerio.load(subResponse.data);
                      const subFileLinks = subDir$('a[href*=".mkv"], a[href*=".mp4"], a[href*=".avi"]');

                      subFileLinks.each((index, element) => {
                        try {
                          const movie = this.extractMovieFromFileLink(subDir$, subDir$(element), subDirUrl);
                          if (movie && movie.title) {
                            directoryMovies.push(movie);
                          }
                        } catch (error) {
                          console.error(`Error processing subdirectory file:`, error.message);
                        }
                      });
                    }
                  }
                } catch (error) {
                  console.error(`Error processing subdirectory:`, error.message);
                }
              }
            }

            // Add delay between directory requests
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          // Silently continue if directory doesn't exist
          if (!error.message.includes('404')) {
            console.error(`Error checking directory ${path}:`, error.message);
          }
        }
      }

      console.log(`Found ${directoryMovies.length} additional movies from directory structure`);

    } catch (error) {
      console.error('Error in directory structure scraping:', error.message);
    }

    return directoryMovies;
  }

  extractMovieFromFileLink($, element, baseUrl) {
    const href = element.attr('href');
    const filename = element.text().trim() || href;

    if (!href || !filename) return null;

    // Generate unique ID for directory-sourced movies
    const uniqueId = `movie_dir_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Build full URL
    let fullUrl = href;
    if (!href.startsWith('http')) {
      fullUrl = baseUrl + (href.startsWith('/') ? '' : '/') + href;
    }

    // Extract movie info from filename
    const title = this.extractTitleFromFilename(filename);
    const year = this.extractYearFromFilename(filename);
    const quality = this.extractQualityFromFilename(filename);
    const format = filename.split('.').pop()?.toUpperCase() || 'UNKNOWN';

    return {
      id: uniqueId,
      title,
      year,
      quality,
      format,
      downloadUrls: [{
        url: fullUrl,
        quality,
        format: format.toLowerCase(),
        label: `${quality} ${format}`
      }],
      poster: null,
      description: `${title} (${year}) - ${quality} ${format}`,
      detailUrl: null,
      source: 'directory',
      genres: [],
      rating: '',
      size: '',
      language: ''
    };
  }

  extractTitleFromFilename(filename) {
    // Remove file extension
    let title = filename.replace(/\.[^.]+$/, '');

    // Remove common patterns
    title = title.replace(/_(19|20)\d{2}_.*/, ''); // Remove year and everything after
    title = title.replace(/\.(19|20)\d{2}\..*/, ''); // Remove year with dots
    title = title.replace(/[\._]/g, ' '); // Replace dots and underscores with spaces
    title = title.replace(/\s+/g, ' '); // Normalize spaces
    title = title.trim();

    return title || 'Unknown Movie';
  }

  extractYearFromFilename(filename) {
    const yearMatch = filename.match(/(19|20)\d{2}/);
    return yearMatch ? yearMatch[0] : new Date().getFullYear().toString();
  }

  extractQualityFromFilename(filename) {
    const qualityMatch = filename.match(/(720p|1080p|4K|2160p|HD|SD|CAM|TS|DVDRip|BRRip|BluRay)/i);
    return qualityMatch ? qualityMatch[1] : 'Unknown';
  }

  deduplicateMovies(movies) {
    const seen = new Map();
    const uniqueMovies = [];

    for (const movie of movies) {
      // Create a more robust unique key based on title, year, and first download URL
      const normalizedTitle = movie.title?.toLowerCase().trim().replace(/[^\w\s]/g, '') || '';
      const firstUrl = movie.downloadUrls?.[0]?.url || '';
      const key = `${normalizedTitle}_${movie.year}_${firstUrl.split('/').pop()}`;

      if (!seen.has(key)) {
        // Ensure the movie has a unique ID
        if (!movie.id || movie.id.startsWith('movie_0') || movie.id.startsWith('movie_1')) {
          movie.id = `movie_unique_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        seen.set(key, movie);
        uniqueMovies.push(movie);
      } else {
        // If we've seen this movie before, merge the download URLs
        const existingMovie = seen.get(key);
        if (movie.downloadUrls && movie.downloadUrls.length > 0) {
          existingMovie.downloadUrls = existingMovie.downloadUrls || [];

          // Add new download URLs that don't already exist
          for (const newUrl of movie.downloadUrls) {
            const exists = existingMovie.downloadUrls.some(existing =>
              existing.url === newUrl.url ||
              (existing.quality === newUrl.quality && existing.format === newUrl.format)
            );

            if (!exists) {
              existingMovie.downloadUrls.push(newUrl);
            }
          }
        }

        // Update other fields if they're missing in the existing movie
        if (!existingMovie.poster && movie.poster) {
          existingMovie.poster = movie.poster;
        }
        if (!existingMovie.description && movie.description) {
          existingMovie.description = movie.description;
        }
        if (!existingMovie.detailUrl && movie.detailUrl) {
          existingMovie.detailUrl = movie.detailUrl;
        }
        if (!existingMovie.genres?.length && movie.genres?.length) {
          existingMovie.genres = movie.genres;
        }
        if (!existingMovie.rating && movie.rating) {
          existingMovie.rating = movie.rating;
        }
        if (!existingMovie.language && movie.language) {
          existingMovie.language = movie.language;
        }
      }
    }

    return uniqueMovies;
  }

  async enrichMovieData(client, movie) {
    if (!movie.detailUrl || this.isDirectVideoFile(movie.detailUrl)) {
      return; // Skip if it's a direct download link
    }
    
    try {
      const detailResponse = await client.get(movie.detailUrl);
      const $ = cheerio.load(detailResponse.data);
      
      // Enhanced download link detection with better format support
      const downloadLinks = [];
      const videoSelectors = [
        'a[href*=".mp4"]', 'a[href*=".mkv"]', 'a[href*=".avi"]',
        'a[href*=".webm"]', 'a[href*=".mov"]', 'a[href*=".wmv"]',
        'a[href*=".m4v"]', 'a[href*=".flv"]'
      ];

      $(videoSelectors.join(', ')).each((i, link) => {
        const href = $(link).attr('href');
        if (href) {
          let fullUrl = href;
          if (href.startsWith('/')) {
            fullUrl = new URL(href, config.discovery.baseUrl).href;
          }

          const text = $(link).text().trim();
          const videoInfo = this.analyzeVideoFile(fullUrl, { title: text });

          downloadLinks.push({
            ...videoInfo,
            label: text
          });
        }
      });
      
      movie.downloadUrls = downloadLinks;
      
      // Look for additional metadata
      const description = $('.description, .synopsis, .plot').first().text().trim();
      if (description) {
        movie.description = description;
      }
      
      const rating = $('.rating, .imdb-rating').first().text().trim();
      if (rating) {
        movie.rating = rating;
      }
      
      // Extract genres
      $('.genre, .genres').each((i, genreElement) => {
        const genre = $(genreElement).text().trim();
        if (genre && !movie.genres.includes(genre)) {
          movie.genres.push(genre);
        }
      });
      
    } catch (error) {
      console.error(`Error enriching movie ${movie.title}:`, error.message);
    }
  }

  getMovies() {
    return this.moviesCache;
  }

  getLastScrapeTime() {
    return this.lastScrapeTime;
  }

  /**
   * Checks if URL points to a direct video file
   */
  isDirectVideoFile(url) {
    const videoExtensions = ['.mp4', '.mkv', '.avi', '.webm', '.mov', '.wmv', '.m4v', '.flv', '.ogg'];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.includes(ext));
  }

  /**
   * Analyzes video file and extracts metadata
   */
  analyzeVideoFile(url, movie = {}) {
    const filename = url.split('/').pop() || '';
    const format = url.split('.').pop()?.toUpperCase() || 'UNKNOWN';

    // Extract quality from filename or movie data
    let quality = movie.quality || 'Unknown';
    const qualityMatch = filename.match(/(720p|1080p|4K|2160p|HD|SD|CAM|TS|DVDRip|BRRip|BluRay)/i);
    if (qualityMatch) {
      quality = qualityMatch[1];
    }

    // Extract additional metadata for MKV files
    const videoInfo = {
      url,
      quality,
      format,
      filename
    };

    if (format === 'MKV') {
      videoInfo.mkvFeatures = this.detectMKVFeatures(movie.title || filename, url);
    }

    return videoInfo;
  }

  /**
   * Detects MKV-specific features from filename and metadata
   */
  detectMKVFeatures(title, url) {
    const text = `${title} ${url}`.toLowerCase();

    const features = {
      hasSubtitles: false,
      audioTracks: [],
      videoCodec: null,
      audioCodec: null,
      resolution: null,
      hdr: false,
      multiAudio: false
    };

    // Subtitle detection
    const subtitleIndicators = ['subs', 'subtitle', 'sub', 'cc', 'multi.sub', 'dual.audio'];
    features.hasSubtitles = subtitleIndicators.some(indicator => text.includes(indicator));

    // Audio track detection
    const audioLanguages = ['hindi', 'english', 'tamil', 'telugu', 'malayalam', 'kannada', 'bengali'];
    features.audioTracks = audioLanguages.filter(lang => text.includes(lang));
    features.multiAudio = features.audioTracks.length > 1 || text.includes('dual.audio');

    // Video codec detection
    if (text.includes('h264') || text.includes('x264')) {
      features.videoCodec = 'H.264';
    } else if (text.includes('h265') || text.includes('x265') || text.includes('hevc')) {
      features.videoCodec = 'H.265';
    } else if (text.includes('vp9')) {
      features.videoCodec = 'VP9';
    }

    // Audio codec detection
    if (text.includes('aac')) {
      features.audioCodec = 'AAC';
    } else if (text.includes('ac3') || text.includes('dolby')) {
      features.audioCodec = 'AC-3';
    } else if (text.includes('dts')) {
      features.audioCodec = 'DTS';
    }

    // Resolution detection
    if (text.includes('4k') || text.includes('2160p')) {
      features.resolution = '4K';
    } else if (text.includes('1080p')) {
      features.resolution = '1080p';
    } else if (text.includes('720p')) {
      features.resolution = '720p';
    }

    // HDR detection
    features.hdr = text.includes('hdr') || text.includes('dolby.vision') || text.includes('hdr10');

    return features;
  }
}

module.exports = new ScraperService();
