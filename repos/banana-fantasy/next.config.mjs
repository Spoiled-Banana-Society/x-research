import webpack from 'next/dist/compiled/webpack/webpack-lib.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    styledComponents: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'a.espncdn.com',
        pathname: '/i/teamlogos/**',
      },
      {
        protocol: 'https',
        hostname: 'i2c.seadn.io',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/sbs-draft-token-images/**',
      },
    ],
  },
  webpack: (config) => {
    config.plugins.push(
      new webpack.ProvidePlugin({
        React: 'react',
      })
    );
    return config;
  },
};

export default nextConfig;
