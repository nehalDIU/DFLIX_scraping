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
