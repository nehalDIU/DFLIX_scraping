# Discovery Movies Frontend

A modern Next.js + Tailwind CSS streaming frontend for the Discovery FTP movie scraper API.

## Features

🎬 **Netflix-style Movie Grid**
- Responsive grid layout (2-6 columns based on screen size)
- Movie posters with hover effects
- Quality badges (4K, 1080p, 720p, etc.)
- Language badges with color coding
- Rating and year display
- File size and download count indicators

🔍 **Advanced Search & Filtering**
- Real-time search with debouncing
- Filter by year, language, and quality
- Clear all filters functionality
- Search result count display

🎥 **Video Player Modal**
- Video.js-based player with custom styling
- Multiple quality options
- Subtitle support (auto-load SRT/VTT)
- Download buttons for all available formats
- Movie metadata display (genres, rating, description)

📱 **Responsive Design**
- Mobile-first approach
- Touch-friendly interface
- Optimized for all screen sizes
- Custom scrollbars and animations

⚡ **Performance & UX**
- Loading states with skeleton screens
- Error boundaries and error handling
- Optimized images with Next.js Image component
- Real-time API status monitoring

## Quick Start

1. **Install Dependencies**
```bash
cd frontend
npm install
```

2. **Start Development Server**
```bash
npm run dev
```

3. **Open in Browser**
Visit http://localhost:3000

## API Integration

The frontend connects to the backend API at `http://localhost:3001/api` and provides:

- **GET /movies** - Fetch all movies
- **GET /movies/search** - Search with filters
- **POST /movies/refresh** - Manual refresh
- **GET /status** - API status

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with header
│   │   ├── page.tsx            # Main page component
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── MovieCard.tsx       # Individual movie card
│   │   ├── MovieGrid.tsx       # Grid layout component
│   │   ├── MovieModal.tsx      # Movie detail modal
│   │   ├── VideoPlayer.tsx     # Video.js player component
│   │   ├── SearchBar.tsx       # Search and filter component
│   │   ├── Header.tsx          # Navigation header
│   │   ├── LoadingSpinner.tsx  # Loading components
│   │   └── ErrorBoundary.tsx   # Error handling
│   ├── hooks/
│   │   └── useMovies.ts        # Data fetching hooks
│   ├── lib/
│   │   └── api.ts              # API client
│   └── types/
│       └── movie.ts            # TypeScript interfaces
└── package.json
```

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npx tsc --noEmit
```
