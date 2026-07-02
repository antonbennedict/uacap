/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ]
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules',
          'C:/DumpStack.log.tmp',
          'C:/hiberfil.sys',
          'C:/swapfile.sys',
          'C:/pagefile.sys'
        ]
      }
    }
    return config;
  }
}

module.exports = nextConfig
