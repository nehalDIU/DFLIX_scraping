import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy API requests to avoid CORS issues in development
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://dflix-scraping-3.onrender.com/api/:path*',
      },
    ];
  },
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
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/proxy/**',
      },
      {
        protocol: 'https',
        hostname: '*.onrender.com',
        port: '',
        pathname: '/proxy/**',
      },
    ],
  },
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@headlessui/react'],
  },
  // Disable ESLint during build and development
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
