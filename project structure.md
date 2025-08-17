movie-streaming-app/
│
├── backend/                   # Express (Node.js) or FastAPI
│   ├── src/
│   │   ├── scrapers/          # Crawler/scraper modules
│   │   │   └── ftpScraper.js  # Recursively crawls FTP/HTTP index
│   │   ├── api/
│   │   │   └── movies.js      # API endpoints: GET /api/movies etc.
│   │   ├── services/
│   │   │   ├── tmdbService.js # TMDB API integration (optional)
│   │   │   └── cache.js       # In-memory or db caching
│   │   ├── utils/
│   │   │   └── fileUtils.js   # Helpers (extension detection, URL utils)
│   │   └── app.js             # Express app or FastAPI main
│   ├── config/
│   │   └── index.js           # Configs (urls, scheduler, env vars)
│   ├── jobs/
│   │   └── scheduler.js       # node-cron or background tasks
│   ├── package.json
│   └── README.md
│
├── frontend/                  # React/Next.js + Tailwind site
│   ├── components/
│   │   ├── MovieGrid.jsx
│   │   ├── MovieCard.jsx
│   │   ├── MovieModal.jsx
│   │   ├── VideoPlayer.jsx    # Uses Video.js/Plyr + subtitles
│   │   └── SearchBar.jsx
│   ├── pages/
│   │   ├── index.jsx          # Home grid
│   │   └── movie/[id].jsx     # Detail modal/page
│   ├── utils/
│   │   └── api.js             # Fetch API helper (SWR or fetcher)
│   ├── public/
│   │   └── icons/             # Logos, app icons
│   ├── styles/
│   │   └── tailwind.css
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── docker-compose.yml
│
├── .env                       # Environment secrets (TMDB key etc.)
├── README.md
└── LICENSE
