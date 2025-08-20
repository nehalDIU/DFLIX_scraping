/**
 * Mock Data Service
 * Provides sample movie data when the real Discovery FTP site is unreachable
 */

const mockMovies = [
  {
    id: 'mock-1',
    title: 'The Matrix',
    year: '1999',
    language: 'English',
    quality: 'HD',
    size: '1.2 GB',
    poster: 'https://images1.discoveryftp.net/posters/matrix.jpg',
    description: 'A computer programmer discovers that reality as he knows it is a simulation.',
    downloadUrls: [
      {
        url: 'https://dflix.discoveryftp.net/movies/matrix_hd.mp4',
        quality: 'HD',
        size: '1.2 GB',
        label: 'Download HD'
      }
    ],
    streamingUrl: 'https://dflix.discoveryftp.net/stream/matrix',
    genres: ['Action', 'Sci-Fi'],
    rating: '8.7',
    director: 'The Wachowskis',
    cast: ['Keanu Reeves', 'Laurence Fishburne', 'Carrie-Anne Moss']
  },
  {
    id: 'mock-2',
    title: 'Inception',
    year: '2010',
    language: 'English',
    quality: 'HD',
    size: '1.5 GB',
    poster: 'https://images1.discoveryftp.net/posters/inception.jpg',
    description: 'A thief who steals corporate secrets through dream-sharing technology.',
    downloadUrls: [
      {
        url: 'https://dflix.discoveryftp.net/movies/inception_hd.mp4',
        quality: 'HD',
        size: '1.5 GB',
        label: 'Download HD'
      }
    ],
    streamingUrl: 'https://dflix.discoveryftp.net/stream/inception',
    genres: ['Action', 'Thriller', 'Sci-Fi'],
    rating: '8.8',
    director: 'Christopher Nolan',
    cast: ['Leonardo DiCaprio', 'Marion Cotillard', 'Tom Hardy']
  },
  {
    id: 'mock-3',
    title: 'Interstellar',
    year: '2014',
    language: 'English',
    quality: 'HD',
    size: '2.1 GB',
    poster: 'https://images1.discoveryftp.net/posters/interstellar.jpg',
    description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
    downloadUrls: [
      {
        url: 'https://dflix.discoveryftp.net/movies/interstellar_hd.mp4',
        quality: 'HD',
        size: '2.1 GB',
        label: 'Download HD'
      }
    ],
    streamingUrl: 'https://dflix.discoveryftp.net/stream/interstellar',
    genres: ['Adventure', 'Drama', 'Sci-Fi'],
    rating: '8.6',
    director: 'Christopher Nolan',
    cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain']
  },
  {
    id: 'mock-4',
    title: 'The Dark Knight',
    year: '2008',
    language: 'English',
    quality: 'HD',
    size: '1.8 GB',
    poster: 'https://images1.discoveryftp.net/posters/dark_knight.jpg',
    description: 'Batman faces the Joker, a criminal mastermind who wants to plunge Gotham City into anarchy.',
    downloadUrls: [
      {
        url: 'https://dflix.discoveryftp.net/movies/dark_knight_hd.mp4',
        quality: 'HD',
        size: '1.8 GB',
        label: 'Download HD'
      }
    ],
    streamingUrl: 'https://dflix.discoveryftp.net/stream/dark_knight',
    genres: ['Action', 'Crime', 'Drama'],
    rating: '9.0',
    director: 'Christopher Nolan',
    cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart']
  },
  {
    id: 'mock-5',
    title: 'Avengers: Endgame',
    year: '2019',
    language: 'English',
    quality: 'HD',
    size: '2.5 GB',
    poster: 'https://images1.discoveryftp.net/posters/endgame.jpg',
    description: 'The Avengers assemble once more to reverse Thanos\' actions and restore balance to the universe.',
    downloadUrls: [
      {
        url: 'https://dflix.discoveryftp.net/movies/endgame_hd.mp4',
        quality: 'HD',
        size: '2.5 GB',
        label: 'Download HD'
      }
    ],
    streamingUrl: 'https://dflix.discoveryftp.net/stream/endgame',
    genres: ['Action', 'Adventure', 'Drama'],
    rating: '8.4',
    director: 'Anthony Russo, Joe Russo',
    cast: ['Robert Downey Jr.', 'Chris Evans', 'Mark Ruffalo']
  },
  {
    id: 'mock-6',
    title: 'Parasite',
    year: '2019',
    language: 'Korean',
    quality: 'HD',
    size: '1.3 GB',
    poster: 'https://images1.discoveryftp.net/posters/parasite.jpg',
    description: 'A poor family schemes to become employed by a wealthy family by infiltrating their household.',
    downloadUrls: [
      {
        url: 'https://dflix.discoveryftp.net/movies/parasite_hd.mp4',
        quality: 'HD',
        size: '1.3 GB',
        label: 'Download HD'
      }
    ],
    streamingUrl: 'https://dflix.discoveryftp.net/stream/parasite',
    genres: ['Comedy', 'Drama', 'Thriller'],
    rating: '8.6',
    director: 'Bong Joon-ho',
    cast: ['Song Kang-ho', 'Lee Sun-kyun', 'Cho Yeo-jeong']
  }
];

class MockDataService {
  constructor() {
    this.movies = mockMovies;
    this.lastScrapeTime = new Date();
  }

  getMovies() {
    return this.movies;
  }

  getMovie(id) {
    return this.movies.find(movie => movie.id === id);
  }

  searchMovies(query, filters = {}) {
    let results = this.movies;

    // Filter by search query
    if (query) {
      const searchTerm = query.toLowerCase();
      results = results.filter(movie =>
        movie.title.toLowerCase().includes(searchTerm) ||
        movie.description.toLowerCase().includes(searchTerm) ||
        (movie.genres && movie.genres.some(g => g.toLowerCase().includes(searchTerm)))
      );
    }

    // Filter by year
    if (filters.year) {
      results = results.filter(movie => movie.year === filters.year);
    }

    // Filter by language
    if (filters.language) {
      results = results.filter(movie => 
        movie.language.toLowerCase() === filters.language.toLowerCase()
      );
    }

    // Filter by quality
    if (filters.quality) {
      results = results.filter(movie => 
        movie.quality.toLowerCase() === filters.quality.toLowerCase()
      );
    }

    return results;
  }

  getLastScrapeTime() {
    return this.lastScrapeTime;
  }

  // Mock refresh - just updates the timestamp
  async refreshMovies() {
    console.log('🎭 Mock refresh: Simulating movie data refresh...');
    this.lastScrapeTime = new Date();
    return this.movies;
  }
}

module.exports = new MockDataService();
