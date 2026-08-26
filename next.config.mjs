/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Optimize font loading
  optimizeFonts: true,
  // Add experimental flag for faster builds
  experimental: {
    optimizePackageImports: ['lucide-react', '@vercel/analytics'],
  },
}

export default nextConfig