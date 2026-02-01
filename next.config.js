/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };

    // Ignore optional platform-specific dependencies
    config.resolve.alias = {
      ...config.resolve.alias,
      'osx-temperature-sensor': false,
    };

    // Suppress warnings for optional dependencies
    config.ignoreWarnings = [
      { module: /node_modules\/systeminformation/ },
    ];

    return config;
  },
}

module.exports = nextConfig
