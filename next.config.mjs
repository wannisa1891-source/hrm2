/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable strict mode to reduce re-renders during debug
  images: {
    unoptimized: true,
  },
  // Suppress specific warnings if needed
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
