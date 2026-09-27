/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for static export so that logo.jpg and other images render correctly
  // without Next.js image optimization server (which is unavailable in static builds).
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
