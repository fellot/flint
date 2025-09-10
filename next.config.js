/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/wines',
        destination: '/api/wines/index',
      },
    ];
  },
};

module.exports = nextConfig;
