import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Cloudflare R2
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
      // MinIO local dev
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
      },
      // Codespaces
      {
        protocol: 'https',
        hostname: '*.app.github.dev',
      },
    ],
  },
  async rewrites() {
    return [
      // En développement, proxy vers l'API NestJS
      ...(process.env.NODE_ENV === 'development'
        ? [
            {
              source: '/api/:path*',
              destination: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/:path*`,
            },
          ]
        : []),
    ];
  },
};

export default nextConfig;
