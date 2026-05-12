/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone build for Docker
  output: 'standalone',

  // Allow images from external sources if needed
  images: {
    domains: ['localhost'],
  },

  // Environment variables exposed to the browser
  // NEXT_PUBLIC_ prefix makes them available client-side
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  },
};

module.exports = nextConfig;
