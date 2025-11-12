import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Desabilita o ESLint durante o build para permitir que o build complete
    // mesmo com warnings/errors do ESLint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Opcional: também pode ignorar erros de TypeScript durante o build
    // ignoreBuildErrors: true,
  },
};

export default withNextIntl(nextConfig);

