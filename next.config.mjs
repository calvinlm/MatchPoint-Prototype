

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
  async headers() {
    return [
      {
        source: "/t/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=30, stale-while-revalidate=300",
          },
        ],
      },
    ];
  },
}

export default nextConfig
