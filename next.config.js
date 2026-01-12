/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},

  images: {
    domains: ['localhost'], // pode remover no futuro (deprecated)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        'canvas',
        'utf-8-validate',
      ]
    }

    return config
  },
}

module.exports = nextConfig
