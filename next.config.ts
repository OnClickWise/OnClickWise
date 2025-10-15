import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  },
  async rewrites() {
    return [
      {
        source: '/telegram/:path*',
        destination: 'http://localhost:3000/telegram/:path*',
      },
    ];
  },
};

export default nextConfig;
