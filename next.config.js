/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return []
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
  },
  turbopack: {},
}

export default nextConfig;
