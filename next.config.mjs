/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  webpack: (config, { isServer }) => {
    // Exclude mysql2 from client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        'mysql2': false,
        'mysql2/promise': false,
      }
      
      config.externals = config.externals || []
      config.externals.push('mysql2', 'mysql2/promise', 'bcryptjs', 'jsonwebtoken')
    }
    
    return config
  },
}

export default nextConfig
