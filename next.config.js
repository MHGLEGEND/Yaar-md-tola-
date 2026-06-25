const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // When building for the Android app shell (`npm run export`), Next.js produces
  // a fully static `out/` directory that Capacitor copies into the APK's assets.
  // Leave this unset for normal `next build`/`next start` server deployments.
  ...(process.env.CAPACITOR_BUILD === 'true' ? { output: 'export' } : {}),
  images: {
    domains: ['res.cloudinary.com', 'localhost'],
    formats: ['image/avif', 'image/webp'],
    // Static export can't use the Next.js Image Optimization server.
    ...(process.env.CAPACITOR_BUILD === 'true' ? { unoptimized: true } : {}),
  },
  async rewrites() {
    if (process.env.CAPACITOR_BUILD === 'true') return [];
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
