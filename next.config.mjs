import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

function getBackendOrigin() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  return configured.trim().replace(/\/+$/, '').replace(/(?:\/api)+$/i, '');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async rewrites() {
    const backendOrigin = getBackendOrigin();

    return [
      {
        source: '/api/:path*',
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },

  async headers() {
    const isDev = process.env.NODE_ENV !== 'production';
    const devConnectSrc = isDev
      ? ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8080', 'http://127.0.0.1:8080']
      : [];
    const scriptSrc = isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:"
      : "script-src 'self' 'unsafe-inline' https:";
    
    // Adicionar localhost às sources de imagem em desenvolvimento
    const devImgSrc = isDev
      ? ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8080', 'http://127.0.0.1:8080']
      : [];

    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      `img-src 'self' data: blob: https: ${devImgSrc.join(' ')}`.trim(),
      "font-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline' https:",
      scriptSrc,
      `connect-src 'self' https: ws: wss: ${devConnectSrc.join(' ')}`.trim(),
      `media-src 'self' data: blob: https://api.onclickwise.com.br https: ${devConnectSrc.join(' ')}`.trim(),
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    // ignoreBuildErrors: true,
  },
};

export default withNextIntl(nextConfig);
